/**
 * Stratix — API Performance Analyzer
 * تحليل أداء APIs كل دقيقة لمدة ساعة
 */

const http = require('http');

const BASE = 'http://localhost:3000';
let TOKEN = '';

const ENDPOINTS = [
    { method: 'GET', path: '/api/dashboard/stats', name: 'Dashboard Stats' },
    { method: 'GET', path: '/api/entities', name: 'Entities' },
    { method: 'GET', path: '/api/strategic/objectives', name: 'Objectives' },
    { method: 'GET', path: '/api/strategic/kpis', name: 'KPIs' },
    { method: 'GET', path: '/api/strategic/initiatives', name: 'Initiatives' },
    { method: 'GET', path: '/api/assessments', name: 'Assessments' },
    { method: 'GET', path: '/api/alerts', name: 'Alerts' },
    { method: 'GET', path: '/api/versions', name: 'Versions' },
    { method: 'GET', path: '/api/analysis/points', name: 'Analysis Points' },
    { method: 'GET', path: '/api/tools', name: 'Tools' },
];

function httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const req = http.request({
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: 10000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function login() {
    try {
        const res = await httpRequest(`${BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@stratix.com', password: 'Admin123!' })
        });
        const data = JSON.parse(res.data);
        TOKEN = data.token;
        console.log('  ✅ تسجيل الدخول ناجح');
    } catch (err) {
        console.error('  ❌ فشل تسجيل الدخول:', err.message);
        process.exit(1);
    }
}

async function testEndpoint(ep) {
    const start = Date.now();
    try {
        const res = await httpRequest(`${BASE}${ep.path}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const latency = Date.now() - start;
        return { ...ep, latency, status: res.status, ok: res.status === 200 };
    } catch (err) {
        return { ...ep, latency: Date.now() - start, status: 0, ok: false, error: err.message };
    }
}

async function analyzeForOneHour() {
    const startTime = Date.now();
    const oneHour = 60 * 60 * 1000;
    const allResults = {};
    let cycle = 0;

    console.log('🔍 [API Analyzer] بدأ تحليل أداء APIs:', new Date().toLocaleTimeString('ar-SA'));
    console.log('  📊 Endpoints:', ENDPOINTS.length);
    console.log('  ⏰ المدة: ساعة واحدة');
    console.log('');

    await login();

    while (Date.now() - startTime < oneHour) {
        cycle++;
        const elapsed = Math.round((Date.now() - startTime) / 60000);
        console.log(`\n--- دورة #${cycle} | الدقيقة ${elapsed} ---`);

        for (const ep of ENDPOINTS) {
            const result = await testEndpoint(ep);

            if (!allResults[ep.path]) allResults[ep.path] = { name: ep.name, latencies: [], errors: 0 };
            allResults[ep.path].latencies.push(result.latency);
            if (!result.ok) allResults[ep.path].errors++;

            const icon = result.ok ? '✅' : '❌';
            console.log(`  ${icon} ${ep.name.padEnd(20)} ${result.latency}ms (HTTP ${result.status})`);
        }

        // Wait 1 minute
        await new Promise(r => setTimeout(r, 60000));
    }

    // Final Summary
    console.log('\n========================================');
    console.log('📊 ملخص الأداء بعد ساعة:');
    console.log('========================================');
    console.log('');

    for (const [path, data] of Object.entries(allResults)) {
        const times = data.latencies;
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const max = Math.max(...times);
        const min = Math.min(...times);
        const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)] || max;

        console.log(`  ${data.name}:`);
        console.log(`    متوسط: ${avg}ms | أدنى: ${min}ms | أقصى: ${max}ms | P95: ${p95}ms | أخطاء: ${data.errors}`);
    }

    console.log('\n🎉 [API Analyzer] انتهى التحليل');
    process.exit(0);
}

analyzeForOneHour().catch(console.error);
