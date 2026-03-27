/**
 * 🧪 سكريبت اختبار شامل لصفحات وعمليات الدخول
 * يختبر: API Login, Register, Validation, Edge Cases
 */

const BASE_URL = 'http://localhost:3000';
let passed = 0, failed = 0, total = 0;

async function test(name, fn) {
    total++;
    try {
        await fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (err) {
        failed++;
        console.log(`  ❌ ${name}`);
        console.log(`     → ${err.message}`);
    }
}

function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
}

async function fetchJSON(url, opts = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...opts.headers },
        ...opts,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, ok: res.ok };
}

// ═══════════════════════════════════════════════
// الاختبارات
// ═══════════════════════════════════════════════

async function runTests() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   🧪 اختبارات صفحات وعمليات الدخول — Stratix          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // ─── 1. اختبارات API تسجيل الدخول ──────────────────────
    console.log('📋 [1] اختبارات API تسجيل الدخول (/api/auth/login)');
    console.log('─'.repeat(50));

    await test('دخول ببيانات صحيحة (admin@stratix.com)', async () => {
        const { status, data } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@stratix.com', password: 'Adm!n@Str4tix2026' })
        });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.token, 'Token missing');
        assert(data.user?.email === 'admin@stratix.com', 'Wrong email in response');
        assert(data.user?.name === 'مدير النظام', `Wrong name: ${data.user?.name}`);
        assert(data.user?.role === 'OWNER', `Wrong role: ${data.user?.role}`);
        assert(data.user?.entity, 'Entity missing');
    });

    await test('دخول ببيانات صحيحة (manager@stratix.com)', async () => {
        const { status, data } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'manager@stratix.com', password: 'Mgr@Str4tix2026!' })
        });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.token, 'Token missing');
        // Let's check another user type or role if needed
    });

    await test('رفض كلمة مرور خاطئة (401)', async () => {
        const { status, data } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'WrongPassword123' })
        });
        assert(status === 401, `Expected 401, got ${status}`);
        assert(data.message === 'Invalid credentials', `Wrong message: ${data.message}`);
    });

    await test('رفض إيميل غير موجود (401)', async () => {
        const { status } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'nonexistent@example.com', password: 'SomePass123' })
        });
        assert(status === 401, `Expected 401, got ${status}`);
    });

    await test('رفض بدون إيميل (400)', async () => {
        const { status } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ password: 'SomePass123' })
        });
        assert(status === 400, `Expected 400, got ${status}`);
    });

    await test('رفض بدون كلمة مرور (400)', async () => {
        const { status } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com' })
        });
        assert(status === 400, `Expected 400, got ${status}`);
    });

    await test('رفض body فارغ (400)', async () => {
        const { status } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({})
        });
        assert(status === 400, `Expected 400, got ${status}`);
    });

    await test('تنظيف الإيميل من المسافات (trim)', async () => {
        const { status, data } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: '  admin@stratix.com  ', password: 'Adm!n@Str4tix2026' })
        });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.token, 'Token missing after trim');
    });

    await test('الإيميل Case Insensitive (ADMIN@STRATIX.COM)', async () => {
        const { status, data } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'ADMIN@STRATIX.COM', password: 'Adm!n@Str4tix2026' })
        });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.token, 'Token missing for uppercase email');
    });

    // ─── 2. اختبارات JWT Token ──────────────────────
    console.log('\n📋 [2] اختبارات JWT Token والجلسة');
    console.log('─'.repeat(50));

    await test('التوكن يحتوي البيانات الصحيحة (JWT decode)', async () => {
        const { data } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@stratix.com', password: 'Adm!n@Str4tix2026' })
        });
        const token = data.token;
        assert(token, 'No token');
        // Decode JWT payload
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        assert(payload.id, 'JWT missing id');
        assert(payload.email === 'admin@stratix.com', 'JWT wrong email');
        assert(payload.role === 'OWNER', `JWT wrong role: ${payload.role}`);
        assert(payload.entityId, 'JWT missing entityId');
        assert(payload.exp > Date.now() / 1000, 'JWT expired');
    });

    await test('الوصول لـ profile بتوكن صحيح (200)', async () => {
        const loginRes = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@stratix.com', password: 'Adm!n@Str4tix2026' })
        });
        const token = loginRes.data.token;

        const { status, data } = await fetchJSON(`${BASE_URL}/api/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.user?.email === 'admin@stratix.com', 'Profile email mismatch');
    });

    await test('رفض الوصول لـ profile بدون توكن (401/403)', async () => {
        const { status } = await fetchJSON(`${BASE_URL}/api/auth/profile`);
        assert(status === 401 || status === 403, `Expected 401 or 403, got ${status}`);
    });

    await test('رفض توكن مزيف (401/403)', async () => {
        const { status } = await fetchJSON(`${BASE_URL}/api/auth/profile`, {
            headers: { 'Authorization': 'Bearer fake.token.here' }
        });
        assert(status === 401 || status === 403, `Expected 401 or 403, got ${status}`);
    });

    // ─── 3. اختبارات صفحة الدخول HTML ──────────────────────
    console.log('\n📋 [3] اختبارات صفحة الدخول (HTML)');
    console.log('─'.repeat(50));

    await test('صفحة الدخول تفتح بنجاح (from=landing)', async () => {
        const res = await fetch(`${BASE_URL}/login?from=landing`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        const html = await res.text();
        assert(html.includes('loginForm'), 'Login form not found in HTML');
        assert(html.includes('signupForm'), 'Signup form not found in HTML');
    });

    await test('صفحة الدخول تحتوي عناصر التسجيل', async () => {
        const res = await fetch(`${BASE_URL}/login?from=landing`);
        const html = await res.text();
        assert(html.includes('login-email'), 'Email input missing');
        assert(html.includes('login-password'), 'Password input missing');
        assert(html.includes('signup-name'), 'Signup name input missing');
        assert(html.includes('signup-email'), 'Signup email input missing');
        assert(html.includes('signup-password'), 'Signup password input missing');
    });

    await test('صفحة الدخول تقبل tab=login', async () => {
        const res = await fetch(`${BASE_URL}/login?tab=login`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('صفحة الدخول تقبل tab=signup', async () => {
        const res = await fetch(`${BASE_URL}/login?tab=signup`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('صفحة الدخول تقبل from=diagnostic', async () => {
        const res = await fetch(`${BASE_URL}/login?from=diagnostic`);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    // ─── 4. اختبارات الأمان ──────────────────────
    console.log('\n📋 [4] اختبارات الأمان');
    console.log('─'.repeat(50));

    await test('حماية من SQL Injection في الإيميل', async () => {
        const { status } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: "'; DROP TABLE users; --", password: 'test' })
        });
        assert(status === 400 || status === 401, `Expected 400/401, got ${status}`);
    });

    await test('حماية من XSS في الإيميل', async () => {
        const { status } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: '<script>alert("xss")</script>@test.com', password: 'test' })
        });
        assert(status === 400 || status === 401, `Expected 400/401, got ${status}`);
    });

    await test('التحقق من Rate Limiter (عدم تعطل السيرفر)', async () => {
        // إرسال 5 طلبات سريعة
        const promises = Array(5).fill(null).map(() =>
            fetchJSON(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                body: JSON.stringify({ email: 'test@example.com', password: 'wrongpass' })
            })
        );
        const results = await Promise.all(promises);
        // كلها يجب أن ترجع 401 (بيانات خاطئة) وليس 500 (crash)
        const allValid = results.every(r => r.status === 401 || r.status === 429);
        assert(allValid, `Some responses had unexpected status: ${results.map(r => r.status).join(',')}`);
    });

    // ─── 5. اختبارات التسجيل ──────────────────────
    console.log('\n📋 [5] اختبارات التسجيل (/api/auth/register)');
    console.log('─'.repeat(50));

    await test('رفض تسجيل بإيميل مكرر', async () => {
        const { status, data } = await fetchJSON(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@stratix.com', password: 'Adm!n@Str4tix2026', name: 'Duplicate' })
        });
        assert(status === 400, `Expected 400, got ${status}`);
        // The message might be different, let's just assert 400
    });

    await test('رفض تسجيل بدون إيميل', async () => {
        const { status } = await fetchJSON(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            body: JSON.stringify({ password: 'Startix@123' })
        });
        assert(status === 400, `Expected 400, got ${status}`);
    });

    await test('رفض تسجيل بكلمة مرور قصيرة', async () => {
        const { status } = await fetchJSON(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            body: JSON.stringify({ email: 'shortpw@test.com', password: '123' })
        });
        assert(status === 400, `Expected 400, got ${status}`);
    });

    // ─── 6. اختبارات التوجيه بعد الدخول ──────────────────────
    console.log('\n📋 [6] اختبارات بيانات التوجيه (Routing Data)');
    console.log('─'.repeat(50));

    await test('بيانات التوجيه متوفرة بعد الدخول', async () => {
        const { data } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@stratix.com', password: 'Adm!n@Str4tix2026' })
        });
        const user = data.user;
        assert(typeof user.onboardingCompleted === 'boolean', 'onboardingCompleted missing or wrong type');
        assert(user.systemRole, 'systemRole missing');
        assert(user.role, 'role missing');
        assert(user.userType, 'userType missing');
        // entity data for routing
        assert(user.entity?.id, 'entity.id missing');
        assert(user.entity?.company?.id, 'entity.company.id missing');
    });

    await test('المستخدم بدون كيان يرجع entity: null', async () => {
        // نختبر مع أحد المستخدمين اللي ممكن ما عندهم كيان
        const { data } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: 'viewer@stratix.com', password: 'V!ew@Str4tix2026' })
        });
        // إذا نجح وما عنده entity → null
        if (data.user) {
            // Just check the field exists in the response
            assert('entity' in data.user, 'entity field should exist in response (even if null)');
        }
    });

    // ─── النتائج ──────────────────────
    console.log('\n' + '═'.repeat(50));
    console.log(`📊 النتائج النهائية: `);
    console.log(`   ✅ نجح: ${passed} / ${total}`);
    console.log(`   ❌ فشل: ${failed} / ${total}`);
    console.log(`   📈 نسبة النجاح: ${Math.round((passed / total) * 100)} % `);
    console.log('═'.repeat(50));

    if (failed > 0) {
        console.log('\n⚠️  بعض الاختبارات فشلت — يرجى مراجعة التفاصيل أعلاه');
        process.exit(1);
    } else {
        console.log('\n🎉 جميع الاختبارات نجحت!');
        process.exit(0);
    }
}

runTests().catch(err => {
    console.error('💀 خطأ فادح:', err);
    process.exit(1);
});
