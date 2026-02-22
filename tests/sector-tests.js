/**
 * 🧪 Sector & Hierarchy Tests — Phase 1.2
 * Tests for Sector linkage (ISIC classification)
 * 
 * Run: node tests/sector-tests.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ============ TEST HELPERS ============

let authToken = null;
let testSectorId = null;
let testEntityId = null; // existing entity for stats testing

const results = {
    passed: 0,
    failed: 0,
    errors: []
};

async function request(method, path, body = null) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (authToken) opts.headers['Authorization'] = `Bearer ${authToken}`;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, opts);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
}

function assert(condition, testName, details = '') {
    if (condition) {
        console.log(`  ✅ ${testName}`);
        results.passed++;
    } else {
        console.log(`  ❌ ${testName}${details ? ' — ' + details : ''}`);
        results.failed++;
        results.errors.push({ testName, details });
    }
}


// ============ SETUP ============

async function setup() {
    console.log('\n🔧 Setup: Authenticating...');

    const TEST_EMAIL = 'test-sectors@startix.com';
    const TEST_PASS = 'TestPass123!';

    let loginRes = await request('POST', '/api/auth/login', {
        email: TEST_EMAIL, password: TEST_PASS
    });

    if (loginRes.status !== 200 || !loginRes.data?.token) {
        await request('POST', '/api/auth/register', {
            email: TEST_EMAIL, password: TEST_PASS, name: 'Sector Test User'
        });
        loginRes = await request('POST', '/api/auth/login', {
            email: TEST_EMAIL, password: TEST_PASS
        });
    }

    if (loginRes.status !== 200 || !loginRes.data?.token) {
        console.error('❌ Cannot authenticate');
        process.exit(1);
    }

    authToken = loginRes.data.token;
    console.log('  ✅ Authenticated');

    // Get an existing entity for testing stats
    const entitiesRes = await request('GET', '/api/entities?limit=1');
    if (entitiesRes.status === 200 && entitiesRes.data?.entities?.length > 0) {
        testEntityId = entitiesRes.data.entities[0].id;
        console.log(`  ✅ Test entity: ${testEntityId}`);
    }
}


// ============ TEST SUITES ============

async function testCreateSector() {
    console.log('\n🏗️ Test Suite: Create Sector');

    // 1. Create valid sector
    const res = await request('POST', '/api/sectors', {
        nameEn: 'Test Technology Sector',
        nameAr: 'قطاع التقنية الاختباري',
        code: 'TEST_TECH_' + Date.now()
    });
    assert(res.status === 201, 'Create valid sector returns 201');
    assert(res.data?.sector?.id, 'Sector has an ID');

    if (res.data?.sector?.id) {
        testSectorId = res.data.sector.id;
    }

    // 2. Fail without required fields
    const res2 = await request('POST', '/api/sectors', { nameEn: 'Only English' });
    assert(res2.status === 400, 'Create without all fields returns 400');

    // 3. Fail with short names
    const res3 = await request('POST', '/api/sectors', {
        nameEn: 'X', nameAr: 'ق', code: 'Q'
    });
    assert(res3.status === 400, 'Create with short names returns 400');

    // 4. Fail with duplicate code
    if (testSectorId) {
        const sector = await request('GET', `/api/sectors/${testSectorId}`);
        // Try creating another with the same code (we don't know it, but test the concept)
        const res4 = await request('POST', '/api/sectors', {
            nameEn: 'Duplicate Test',
            nameAr: 'اختبار مكرر',
            code: sector.data?.sector?.code || 'TEST_TECH'
        });
        assert(res4.status === 400, 'Duplicate code returns 400');
    }
}


async function testGetSectors() {
    console.log('\n📋 Test Suite: Get Sectors');

    // 1. List all sectors
    const res = await request('GET', '/api/sectors');
    assert(res.status === 200, 'List sectors returns 200');
    assert(Array.isArray(res.data?.sectors), 'Response has sectors array');
    assert(typeof res.data?.total === 'number', 'Response has total count');
    assert(res.data?.totalPages !== undefined, 'Response has totalPages');

    // 2. With pagination
    const res2 = await request('GET', '/api/sectors?page=1&limit=5');
    assert(res2.status === 200, 'Paginated list returns 200');

    // 3. With search
    const res3 = await request('GET', '/api/sectors?search=اختبار');
    assert(res3.status === 200, 'Search returns 200');

    // 4. Get single sector
    if (testSectorId) {
        const res4 = await request('GET', `/api/sectors/${testSectorId}`);
        assert(res4.status === 200, 'Get single sector returns 200');
        assert(res4.data?.sector?.id === testSectorId, 'Returns correct sector');
        assert(Array.isArray(res4.data?.sector?.industries), 'Sector includes industries');
        assert(Array.isArray(res4.data?.sector?.entities), 'Sector includes entities');
    }

    // 5. Non-existent sector
    const res5 = await request('GET', '/api/sectors/non_existent_id');
    assert(res5.status === 404, 'Non-existent sector returns 404');
}


async function testHierarchy() {
    console.log('\n🌳 Test Suite: Hierarchy');

    const res = await request('GET', '/api/sectors/hierarchy');
    assert(res.status === 200, 'Hierarchy returns 200');
    assert(Array.isArray(res.data?.hierarchy), 'Has hierarchy array');
    assert(res.data?.stats !== undefined, 'Has stats object');
    assert(typeof res.data?.stats?.totalSectors === 'number', 'Has totalSectors');
    assert(typeof res.data?.stats?.totalEntities === 'number', 'Has totalEntities');
    assert(typeof res.data?.stats?.totalIndustries === 'number', 'Has totalIndustries');
    assert(Array.isArray(res.data?.issues), 'Has issues array');
    assert(res.data?.integrity !== undefined, 'Has integrity status');

    console.log(`    Sectors: ${res.data?.stats?.totalSectors}`);
    console.log(`    Industries: ${res.data?.stats?.totalIndustries}`);
    console.log(`    Entities: ${res.data?.stats?.totalEntities}`);
    console.log(`    Orphan Entities: ${res.data?.stats?.orphanEntities}`);
    console.log(`    Issues: ${res.data?.issues?.length}`);
    console.log(`    Integrity: ${res.data?.integrity}`);

    // Check hierarchy structure
    if (res.data?.hierarchy?.length > 0) {
        const firstSector = res.data.hierarchy[0];
        assert(firstSector.nameAr !== undefined, 'Sector has nameAr');
        assert(Array.isArray(firstSector.industries), 'Sector has industries array');
        assert(Array.isArray(firstSector.entities), 'Sector has entities array');
    }

    // Check issues structure
    if (res.data?.issues?.length > 0) {
        const firstIssue = res.data.issues[0];
        assert(firstIssue.type !== undefined, 'Issue has type');
        assert(firstIssue.severity !== undefined, 'Issue has severity');
        assert(firstIssue.message !== undefined, 'Issue has message');
    }
}


async function testSectorStats() {
    console.log('\n📊 Test Suite: Sector Stats');

    // Find a sector that has entities
    const sectorsRes = await request('GET', '/api/sectors?limit=50');
    const sectorWithEntities = sectorsRes.data?.sectors?.find(s => s._count?.entities > 0);

    if (!sectorWithEntities) {
        console.log('  ⚠️ No sector with entities found — testing with test sector');
        if (testSectorId) {
            const res = await request('GET', `/api/sectors/${testSectorId}/stats`);
            assert(res.status === 200, 'Stats for empty sector returns 200');
            assert(res.data?.stats?.entities?.total === 0, 'Empty sector has 0 entities');
            assert(res.data?.stats?.coverage !== undefined, 'Has coverage data');
        }
        return;
    }

    console.log(`  📌 Testing with sector: ${sectorWithEntities.nameAr} (${sectorWithEntities._count.entities} entities)`);

    const res = await request('GET', `/api/sectors/${sectorWithEntities.id}/stats`);
    assert(res.status === 200, 'Stats returns 200');
    assert(res.data?.sector !== undefined, 'Response has sector info');
    assert(res.data?.stats !== undefined, 'Response has stats');

    // Entity stats
    assert(res.data?.stats?.entities?.total >= 0, 'Has entity count');
    assert(res.data?.stats?.entities?.active !== undefined, 'Has active count');

    // Coverage
    assert(typeof res.data?.stats?.coverage?.strategy === 'number', 'Has strategy coverage %');
    assert(typeof res.data?.stats?.coverage?.assessment === 'number', 'Has assessment coverage %');

    // Strategic aggregate
    assert(res.data?.stats?.strategic !== undefined, 'Has strategic data');
    assert(typeof res.data?.stats?.strategic?.objectives === 'number', 'Has objectives count');
    assert(typeof res.data?.stats?.strategic?.kpis === 'number', 'Has KPIs count');
    assert(typeof res.data?.stats?.strategic?.initiatives === 'number', 'Has initiatives count');

    // Health
    assert(res.data?.stats?.health !== undefined, 'Has health data');

    // Entity details
    assert(Array.isArray(res.data?.entities), 'Has entity details array');

    if (res.data?.entities?.length > 0) {
        const entity = res.data.entities[0];
        assert(entity.name !== undefined, 'Entity has name');
        assert(entity.hasStrategy !== undefined, 'Entity has hasStrategy flag');
        assert(entity.hasAssessment !== undefined, 'Entity has hasAssessment flag');
    }

    console.log(`    Entities: ${res.data?.stats?.entities?.total}`);
    console.log(`    Strategy Coverage: ${res.data?.stats?.coverage?.strategy}%`);
    console.log(`    Assessment Coverage: ${res.data?.stats?.coverage?.assessment}%`);
    console.log(`    Objectives: ${res.data?.stats?.strategic?.objectives}`);
    console.log(`    KPIs: ${res.data?.stats?.strategic?.kpis}`);
    console.log(`    Health: ${res.data?.stats?.health?.sectorScore || 'N/A'} (${res.data?.stats?.health?.grade || 'N/A'})`);

    // Non-existent sector
    const res2 = await request('GET', '/api/sectors/non_existent_id/stats');
    assert(res2.status === 404, 'Stats for non-existent sector returns 404');
}


async function testUpdateSector() {
    console.log('\n✏️ Test Suite: Update Sector');

    if (!testSectorId) {
        console.log('  ⚠️ Skipped — no test sector');
        return;
    }

    const res = await request('PATCH', `/api/sectors/${testSectorId}`, {
        nameAr: 'قطاع التقنية المحدث'
    });
    assert(res.status === 200, 'Update sector returns 200');
    assert(res.data?.sector?.nameAr === 'قطاع التقنية المحدث', 'Name updated');

    // Non-existent
    const res2 = await request('PATCH', '/api/sectors/non_existent_id', {
        nameAr: 'test'
    });
    assert(res2.status === 404, 'Update non-existent returns 404');
}


async function testDeleteSector() {
    console.log('\n🗑️ Test Suite: Delete Sector');

    if (!testSectorId) {
        console.log('  ⚠️ Skipped — no test sector');
        return;
    }

    // Delete empty sector (should succeed)
    const res = await request('DELETE', `/api/sectors/${testSectorId}`);
    assert(res.status === 200, 'Delete empty sector succeeds');

    // Verify it's gone
    const res2 = await request('GET', `/api/sectors/${testSectorId}`);
    assert(res2.status === 404, 'Deleted sector is not found');

    // Find a sector with entities — should fail
    const sectorsRes = await request('GET', '/api/sectors?limit=50');
    const sectorWithEntities = sectorsRes.data?.sectors?.find(s => s._count?.entities > 0);

    if (sectorWithEntities) {
        const res3 = await request('DELETE', `/api/sectors/${sectorWithEntities.id}`);
        assert(res3.status === 400, 'Cannot delete sector with entities');
        assert(res3.data?.hint !== undefined, 'Error includes hint');
    }

    // Non-existent
    const res4 = await request('DELETE', '/api/sectors/non_existent_id');
    assert(res4.status === 404, 'Delete non-existent returns 404');
}


// ============ RUN ============

async function run() {
    console.log('═══════════════════════════════════════════════');
    console.log('🧪 Sector & Hierarchy Tests — Phase 1.2');
    console.log('═══════════════════════════════════════════════');

    try {
        await setup();
        await testCreateSector();
        await testGetSectors();
        await testHierarchy();
        await testSectorStats();
        await testUpdateSector();
        await testDeleteSector();
    } catch (error) {
        console.error('\n💥 Fatal error:', error.message);
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log(`📊 Results: ${results.passed} passed, ${results.failed} failed`);
    console.log('═══════════════════════════════════════════════');

    if (results.errors.length > 0) {
        console.log('\n❌ Failed tests:');
        results.errors.forEach(e => console.log(`  - ${e.testName}: ${e.details}`));
    }

    process.exit(results.failed > 0 ? 1 : 0);
}

run();
