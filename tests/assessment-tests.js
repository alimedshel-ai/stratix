/**
 * 🧪 Assessment Tests — Phase 1.1
 * Tests for the Assessment methodology (Closed Loop)
 * 
 * Run: node tests/assessment-tests.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ============ TEST HELPERS ============

let authToken = null;
let testEntityId = null;
let testAssessmentId = null;
let testDimensionId = null;
let testCriterionId = null;

const results = {
    passed: 0,
    failed: 0,
    errors: []
};

async function request(method, path, body = null) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (authToken) {
        opts.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (body) {
        opts.body = JSON.stringify(body);
    }

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

    const TEST_EMAIL = 'test-assessments@startix.com';
    const TEST_PASS = 'TestPass123!';

    // Try login first
    let loginRes = await request('POST', '/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASS
    });

    // If login fails, register first then login
    if (loginRes.status !== 200 || !loginRes.data?.token) {
        console.log('  ℹ️ Registering test user...');
        const regRes = await request('POST', '/api/auth/register', {
            email: TEST_EMAIL,
            password: TEST_PASS,
            name: 'Assessment Test User'
        });

        if (regRes.status === 201 || regRes.status === 200) {
            console.log('  ✅ Test user registered');
        } else if (regRes.data?.message === 'User already exists') {
            console.log('  ℹ️ Test user already exists');
        } else {
            console.error('❌ Cannot register. Response:', regRes.data);
        }

        // Login with newly registered user
        loginRes = await request('POST', '/api/auth/login', {
            email: TEST_EMAIL,
            password: TEST_PASS
        });
    }

    if (loginRes.status !== 200 || !loginRes.data?.token) {
        console.error('❌ Cannot authenticate. Please check credentials.');
        console.log('   Login response:', loginRes.data);
        process.exit(1);
    }

    authToken = loginRes.data.token;
    console.log('  ✅ Authenticated successfully');

    // Get an entity to use for testing
    const entitiesRes = await request('GET', '/api/entities?limit=1');
    if (entitiesRes.status === 200 && entitiesRes.data?.entities?.length > 0) {
        testEntityId = entitiesRes.data.entities[0].id;
        console.log(`  ✅ Test entity found: ${testEntityId}`);
    } else {
        console.error('❌ No entities found for testing');
        process.exit(1);
    }
}


// ============ TEST SUITES ============

async function testCreateAssessment() {
    console.log('\n📋 Test Suite: Create Assessment');

    // 1. Create valid assessment
    const res = await request('POST', '/api/assessments', {
        title: 'تقييم شامل للاختبار',
        description: 'تقييم تجريبي لاختبار النظام',
        entityId: testEntityId,
        status: 'DRAFT'
    });
    assert(res.status === 201, 'Create valid assessment returns 201');
    assert(res.data?.id, 'Assessment has an ID');
    assert(res.data?.title === 'تقييم شامل للاختبار', 'Title matches');
    assert(res.data?.status === 'DRAFT', 'Status is DRAFT');

    if (res.data?.id) {
        testAssessmentId = res.data.id;
    }

    // 2. Fail without title
    const res2 = await request('POST', '/api/assessments', {
        entityId: testEntityId
    });
    assert(res2.status === 400, 'Create without title returns 400');

    // 3. Fail with short title
    const res3 = await request('POST', '/api/assessments', {
        title: 'ab',
        entityId: testEntityId
    });
    assert(res3.status === 400, 'Create with short title returns 400');

    // 4. Fail with invalid status
    const res4 = await request('POST', '/api/assessments', {
        title: 'Test Assessment',
        entityId: testEntityId,
        status: 'INVALID_STATUS'
    });
    assert(res4.status === 400, 'Create with invalid status returns 400');

    // 5. Fail with non-existent entity
    const res5 = await request('POST', '/api/assessments', {
        title: 'Test Assessment',
        entityId: 'non_existent_entity_id'
    });
    assert(res5.status === 404, 'Create with non-existent entity returns 404');
}


async function testGetAssessments() {
    console.log('\n📋 Test Suite: Get Assessments');

    // 1. List all assessments
    const res = await request('GET', '/api/assessments');
    assert(res.status === 200, 'List assessments returns 200');
    assert(Array.isArray(res.data?.assessments), 'Response has assessments array');
    assert(typeof res.data?.total === 'number', 'Response has total count');

    // 2. With pagination
    const res2 = await request('GET', '/api/assessments?page=1&limit=5');
    assert(res2.status === 200, 'Paginated list returns 200');
    assert(res2.data?.limit === 5, 'Limit is respected');

    // 3. With status filter
    const res3 = await request('GET', '/api/assessments?status=DRAFT');
    assert(res3.status === 200, 'Filter by status returns 200');

    // 4. Invalid status filter
    const res4 = await request('GET', '/api/assessments?status=INVALID');
    assert(res4.status === 400, 'Invalid status filter returns 400');

    // 5. Get single assessment
    if (testAssessmentId) {
        const res5 = await request('GET', `/api/assessments/${testAssessmentId}`);
        assert(res5.status === 200, 'Get single assessment returns 200');
        assert(res5.data?.scoring, 'Single assessment includes scoring data');
        assert(res5.data?.scoring?.overallScore === null, 'Empty assessment has null score');
    }
}


async function testDimensions() {
    console.log('\n📐 Test Suite: Dimensions');

    if (!testAssessmentId) {
        console.log('  ⚠️ Skipped — no assessment ID');
        return;
    }

    // 1. Create dimension
    const res = await request('POST', `/api/assessments/${testAssessmentId}/dimensions`, {
        name: 'البعد القيادي',
        description: 'تقييم القدرات القيادية'
    });
    assert(res.status === 201, 'Create dimension returns 201');
    assert(res.data?.name === 'البعد القيادي', 'Dimension name matches');

    if (res.data?.id) {
        testDimensionId = res.data.id;
    }

    // 2. Create second dimension
    const res2 = await request('POST', `/api/assessments/${testAssessmentId}/dimensions`, {
        name: 'البعد التشغيلي',
        description: 'تقييم العمليات التشغيلية'
    });
    assert(res2.status === 201, 'Create second dimension returns 201');

    // 3. Fail with short name
    const res3 = await request('POST', `/api/assessments/${testAssessmentId}/dimensions`, {
        name: 'x'
    });
    assert(res3.status === 400, 'Dimension with short name returns 400');

    // 4. Update dimension
    if (testDimensionId) {
        const res4 = await request('PATCH', `/api/assessments/dimensions/${testDimensionId}`, {
            name: 'البعد القيادي (محدث)'
        });
        assert(res4.status === 200, 'Update dimension returns 200');
        assert(res4.data?.name === 'البعد القيادي (محدث)', 'Updated name matches');
    }
}


async function testCriteria() {
    console.log('\n📏 Test Suite: Criteria');

    if (!testDimensionId) {
        console.log('  ⚠️ Skipped — no dimension ID');
        return;
    }

    // 1. Create criterion without score
    const res = await request('POST', `/api/assessments/dimensions/${testDimensionId}/criteria`, {
        name: 'الرؤية الاستراتيجية',
        description: 'قدرة القيادة على وضع رؤية واضحة'
    });
    assert(res.status === 201, 'Create criterion without score returns 201');
    assert(res.data?.score === null, 'Score is null initially');

    if (res.data?.id) {
        testCriterionId = res.data.id;
    }

    // 2. Create criterion with score
    const res2 = await request('POST', `/api/assessments/dimensions/${testDimensionId}/criteria`, {
        name: 'اتخاذ القرار',
        score: 4
    });
    assert(res2.status === 201, 'Create criterion with score returns 201');
    assert(res2.data?.score === 4, 'Score is 4');

    // 3. Create criterion with score
    const res3 = await request('POST', `/api/assessments/dimensions/${testDimensionId}/criteria`, {
        name: 'إدارة الفريق',
        score: 3.5
    });
    assert(res3.status === 201, 'Create criterion with decimal score returns 201');

    // 4. Invalid score > 5
    const res4 = await request('POST', `/api/assessments/dimensions/${testDimensionId}/criteria`, {
        name: 'Test Invalid',
        score: 6
    });
    assert(res4.status === 400, 'Score > 5 returns 400');

    // 5. Invalid score < 0
    const res5 = await request('POST', `/api/assessments/dimensions/${testDimensionId}/criteria`, {
        name: 'Test Invalid',
        score: -1
    });
    assert(res5.status === 400, 'Score < 0 returns 400');

    // 6. Update criterion with score
    if (testCriterionId) {
        const res6 = await request('PATCH', `/api/assessments/criteria/${testCriterionId}`, {
            score: 3
        });
        assert(res6.status === 200, 'Update criterion score returns 200');
        assert(res6.data?.score === 3, 'Updated score is 3');
    }
}


async function testScoreCalculation() {
    console.log('\n🎯 Test Suite: Score Calculation');

    if (!testAssessmentId) {
        console.log('  ⚠️ Skipped — no assessment ID');
        return;
    }

    // 1. Get score
    const res = await request('GET', `/api/assessments/${testAssessmentId}/score`);
    assert(res.status === 200, 'Get score returns 200');
    assert(res.data?.overallScore !== undefined, 'Has overallScore');
    assert(res.data?.grade !== undefined, 'Has grade');
    assert(Array.isArray(res.data?.dimensionScores), 'Has dimensionScores array');
    assert(res.data?.totalCriteria > 0, 'Has total criteria count');
    assert(res.data?.completionRate > 0, 'Has completion rate');

    console.log(`    Overall Score: ${res.data?.overallScore}% (${res.data?.grade})`);
    console.log(`    Criteria: ${res.data?.scoredCriteria}/${res.data?.totalCriteria} scored`);
    console.log(`    Completion: ${res.data?.completionRate}%`);

    // 2. Score should be reasonable (3 criteria scored: 3, 4, 3.5 out of 5 = avg 3.5 = 70%)
    if (res.data?.overallScore !== null) {
        assert(res.data.overallScore >= 0 && res.data.overallScore <= 100,
            'Score is between 0 and 100');
    }
}


async function testGapAnalysis() {
    console.log('\n🔍 Test Suite: Gap Analysis');

    if (!testAssessmentId) {
        console.log('  ⚠️ Skipped — no assessment ID');
        return;
    }

    // 1. Default gap analysis (target = 80%)
    const res = await request('GET', `/api/assessments/${testAssessmentId}/gaps`);
    assert(res.status === 200, 'Gap analysis returns 200');
    assert(res.data?.status !== undefined, 'Has status');
    assert(res.data?.overallScore !== undefined, 'Has overallScore');
    assert(res.data?.targetScore === 80, 'Default target is 80');
    assert(Array.isArray(res.data?.gaps), 'Has gaps array');

    console.log(`    Status: ${res.data?.status}`);
    console.log(`    Score: ${res.data?.overallScore}% / Target: ${res.data?.targetScore}%`);
    console.log(`    Overall Gap: ${res.data?.overallGap}%`);
    console.log(`    Gaps Found: ${res.data?.gapsFound}, Critical: ${res.data?.criticalGaps}`);

    // 2. Custom target
    const res2 = await request('GET', `/api/assessments/${testAssessmentId}/gaps?target=60`);
    assert(res2.status === 200, 'Gap analysis with custom target returns 200');
    assert(res2.data?.targetScore === 60, 'Custom target is 60');

    // 3. Invalid target
    const res3 = await request('GET', `/api/assessments/${testAssessmentId}/gaps?target=150`);
    assert(res3.status === 400, 'Invalid target (150) returns 400');

    // 4. Check gap structure
    if (res.data?.gaps?.length > 0) {
        const gap = res.data.gaps[0];
        assert(gap.dimensionName !== undefined, 'Gap has dimensionName');
        assert(gap.severity !== undefined, 'Gap has severity');
        assert(gap.recommendation !== undefined, 'Gap has recommendation');
        assert(Array.isArray(gap.weakCriteria), 'Gap has weakCriteria');
    }
}


async function testSummary() {
    console.log('\n📊 Test Suite: Assessment Summary');

    if (!testAssessmentId) {
        console.log('  ⚠️ Skipped — no assessment ID');
        return;
    }

    const res = await request('GET', `/api/assessments/${testAssessmentId}/summary`);
    assert(res.status === 200, 'Summary returns 200');
    assert(res.data?.scoring, 'Has scoring data');
    assert(res.data?.swot !== undefined, 'Has SWOT summary');
    assert(typeof res.data?.swot?.total === 'number', 'SWOT has total');
}


async function testDeleteProtection() {
    console.log('\n🛡️ Test Suite: Delete Protection');

    if (!testAssessmentId) {
        console.log('  ⚠️ Skipped — no assessment ID');
        return;
    }

    // 1. Mark as completed
    await request('PATCH', `/api/assessments/${testAssessmentId}`, {
        status: 'COMPLETED'
    });

    // 2. Try to delete — should fail
    const res = await request('DELETE', `/api/assessments/${testAssessmentId}`);
    assert(res.status === 400, 'Cannot delete completed assessment without force');
    assert(res.data?.hint !== undefined, 'Error includes hint');

    // 3. Delete with force
    const res2 = await request('DELETE', `/api/assessments/${testAssessmentId}?force=true`);
    assert(res2.status === 200, 'Can delete completed assessment with force=true');
}


// ============ CLEANUP ============

async function cleanup() {
    console.log('\n🧹 Cleanup...');

    // Assessment should already be deleted by testDeleteProtection
    // But in case it wasn't:
    if (testAssessmentId) {
        try {
            await request('DELETE', `/api/assessments/${testAssessmentId}?force=true`);
        } catch (e) { /* ignore */ }
    }

    console.log('  ✅ Cleanup complete');
}


// ============ RUN ============

async function run() {
    console.log('═══════════════════════════════════════════════');
    console.log('🧪 Assessment Tests — Phase 1.1');
    console.log('═══════════════════════════════════════════════');

    try {
        await setup();
        await testCreateAssessment();
        await testGetAssessments();
        await testDimensions();
        await testCriteria();
        await testScoreCalculation();
        await testGapAnalysis();
        await testSummary();
        await testDeleteProtection();
        await cleanup();
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
