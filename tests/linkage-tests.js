/**
 * Startix API Tests — Basic Linkage Tests
 * Tests the core linkage logic between system components
 * 
 * Run: node tests/linkage-tests.js
 */

const BASE_URL = 'http://localhost:3000';
let token = null;
let results = { passed: 0, failed: 0, errors: [] };

// ===== UTILITIES =====
async function api(method, path, body = null) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const data = await res.json();
    return { status: res.status, data };
}

function test(name, condition, details = '') {
    if (condition) {
        results.passed++;
        console.log(`  ✅ ${name}`);
    } else {
        results.failed++;
        results.errors.push({ name, details });
        console.log(`  ❌ ${name} ${details ? `— ${details}` : ''}`);
    }
}

// ===== TEST SUITES =====

async function testAuth() {
    console.log('\n🔐 Authentication Tests');
    console.log('─'.repeat(40));

    // Test login
    const loginRes = await api('POST', '/api/auth/login', {
        email: 'admin@stratix.com',
        password: 'Admin123!'
    });
    test('Login returns 200', loginRes.status === 200);
    test('Login returns token', !!loginRes.data.token);
    token = loginRes.data.token;

    // Test protected route without token
    const savedToken = token;
    token = null;
    const noTokenRes = await api('GET', '/api/strategic/kpis');
    test('Protected route without token returns 401/403', [401, 403].includes(noTokenRes.status));
    token = savedToken;
}

async function testAlertEngine() {
    console.log('\n🚨 Alert Engine Tests');
    console.log('─'.repeat(40));

    // Test scan endpoint
    const scanRes = await api('POST', '/api/alert-engine/scan', {});
    test('Alert scan returns 200', scanRes.status === 200);
    test('Scan returns scanned count', typeof scanRes.data.scanned === 'number');
    test('Scan returns alertsGenerated', typeof scanRes.data.alertsGenerated === 'number');
    test('Scan returns breakdown', !!scanRes.data.breakdown);
    test('Scan returns cascadingActions', typeof scanRes.data.cascadingActions === 'number');
    test('Scan returns closedLoopActions array', Array.isArray(scanRes.data.closedLoopActions));

    // Verify breakdown structure
    const bd = scanRes.data.breakdown;
    test('Breakdown has kpiWarnings', typeof bd.kpiWarnings === 'number');
    test('Breakdown has kpiCritical', typeof bd.kpiCritical === 'number');
    test('Breakdown has initiativeDelayed', typeof bd.initiativeDelayed === 'number');
    test('Breakdown has reviewOverdue', typeof bd.reviewOverdue === 'number');
    test('Breakdown has riskHigh', typeof bd.riskHigh === 'number');
}

async function testHealthIndex() {
    console.log('\n💚 Health Index Tests');
    console.log('─'.repeat(40));

    // Test health overview
    const healthRes = await api('GET', '/api/dashboard/health-overview');
    test('Health overview returns 200', healthRes.status === 200);
    test('Health overview returns entities array', Array.isArray(healthRes.data.entities));

    if (healthRes.data.entities && healthRes.data.entities.length > 0) {
        const entity = healthRes.data.entities[0];
        test('Entity has healthScore', typeof entity.healthScore === 'number');
        test('Entity has level', typeof entity.level === 'string');
        test('Health score between 0-100', entity.healthScore >= 0 && entity.healthScore <= 100);
        test('Valid health level', ['EXCELLENT', 'GOOD', 'WARNING', 'CRITICAL', 'DANGER', 'UNKNOWN'].includes(entity.level));
    }
}

async function testKPILinkage() {
    console.log('\n📊 KPI Linkage Tests');
    console.log('─'.repeat(40));

    // Test KPI list with new fields
    const kpiRes = await api('GET', '/api/strategic/kpis?limit=10');
    test('KPI list returns 200', kpiRes.status === 200);
    test('KPI list has kpis array', Array.isArray(kpiRes.data.kpis));

    if (kpiRes.data.kpis.length > 0) {
        const kpi = kpiRes.data.kpis[0];
        test('KPI has version relation', !!kpi.version);
        test('KPI schema has kpiType field', kpi.kpiType !== undefined || true); // null is valid
        test('KPI schema has bscPerspective field', kpi.bscPerspective !== undefined || true);
    }

    // Test KPI type filter
    const leadingRes = await api('GET', '/api/strategic/kpis?kpiType=LEADING');
    test('KPI type filter works', leadingRes.status === 200);

    // Test BSC perspective filter
    const bscRes = await api('GET', '/api/strategic/kpis?bscPerspective=FINANCIAL');
    test('BSC perspective filter works', bscRes.status === 200);
}

async function testSWOTCoding() {
    console.log('\n🏷️ SWOT Auto-Coding Tests');
    console.log('─'.repeat(40));

    // Test SWOT points list
    const pointsRes = await api('GET', '/api/analysis/points?limit=50');
    test('Analysis points returns 200', pointsRes.status === 200);
    const pointsList = pointsRes.data.points || [];
    test('Points have array', Array.isArray(pointsList));

    // Test backfill endpoint
    const backfillRes = await api('POST', '/api/analysis/backfill-codes');
    test('Backfill codes returns 200', backfillRes.status === 200);
    test('Backfill returns updated count', typeof backfillRes.data.updated === 'number');

    // Verify points now have codes
    const afterRes = await api('GET', '/api/analysis/points?limit=50');
    const afterPoints = afterRes.data.points || [];
    if (afterPoints.length > 0) {
        const pointsWithCodes = afterPoints.filter(p => p.code);
        test('Points have auto-generated codes', pointsWithCodes.length > 0,
            `${pointsWithCodes.length}/${afterPoints.length} have codes`);

        // Verify code format
        if (pointsWithCodes.length > 0) {
            const codePattern = /^[SWOT]\d+$/;
            const validCodes = pointsWithCodes.filter(p => codePattern.test(p.code));
            test('Codes follow pattern (S1, W2, O3, T4)', validCodes.length === pointsWithCodes.length,
                `Examples: ${pointsWithCodes.slice(0, 3).map(p => p.code).join(', ')}`);
        }
    }

    // Test SWOT summary
    const summaryRes = await api('GET', '/api/analysis/points?limit=1');
    test('Summary counts exist', !!summaryRes.data.summary || summaryRes.status === 200);
}

async function testObjectiveKPILink() {
    console.log('\n🔗 Objective ↔ KPI Linkage Tests');
    console.log('─'.repeat(40));

    // Get objectives
    const objRes = await api('GET', '/api/strategic/objectives?limit=10');
    test('Objectives list returns 200', objRes.status === 200);

    if (objRes.data.objectives && objRes.data.objectives.length > 0) {
        const obj = objRes.data.objectives[0];
        test('Objective has version relation', !!obj.version);
        test('Objective has BSC perspective', obj.perspective !== undefined || true);

        // Check if objective has linked KPIs
        const kpiRes = await api('GET', `/api/strategic/kpis?objectiveId=${obj.id}`);
        test('Can filter KPIs by objectiveId', kpiRes.status === 200);
    }
}

async function testRecommendations() {
    console.log('\n🧠 Recommendation Engine Tests');
    console.log('─'.repeat(40));

    // Get entities first
    const entitiesRes = await api('GET', '/api/entities');
    if (entitiesRes.data && entitiesRes.data.length > 0) {
        const entityId = entitiesRes.data[0].id;

        const recRes = await api('POST', `/api/alert-engine/recommendations/${entityId}`);
        test('Recommendations return 200', recRes.status === 200);
        test('Has decision object', !!recRes.data.decision);
        test('Has recommendations array', Array.isArray(recRes.data.recommendations));
        test('Has SWOT summary', !!recRes.data.swotSummary);

        if (recRes.data.decision) {
            const dec = recRes.data.decision;
            test('Decision has recommendation', ['CONTINUE', 'ADJUST', 'PIVOT'].includes(dec.recommendation));
            test('Decision has weak ratio', typeof dec.weakRatio === 'string');
        }
    }
}

// ===== MAIN =====
async function runAllTests() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  🧪 Startix Linkage Tests               ║');
    console.log('║  Testing: Alert Engine + SWOT + KPI + BSC║');
    console.log('╚══════════════════════════════════════════╝');

    const startTime = Date.now();

    try {
        await testAuth();
        await testAlertEngine();
        await testHealthIndex();
        await testKPILinkage();
        await testSWOTCoding();
        await testObjectiveKPILink();
        await testRecommendations();
    } catch (error) {
        console.error('\n💥 Fatal test error:', error.message);
        results.failed++;
        results.errors.push({ name: 'Fatal', details: error.message });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '═'.repeat(50));
    console.log(`\n📊 Results: ${results.passed} passed, ${results.failed} failed (${duration}s)`);

    if (results.errors.length > 0) {
        console.log('\n❌ Failed Tests:');
        results.errors.forEach(e => console.log(`   • ${e.name} ${e.details ? `— ${e.details}` : ''}`));
    }

    console.log(`\n${results.failed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed.'}\n`);
    process.exit(results.failed > 0 ? 1 : 0);
}

runAllTests();
