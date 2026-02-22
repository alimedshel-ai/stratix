/**
 * 🧪 Priority Matrix Tests — Phase 1.3
 * Tests for MCDA calculation, evaluation, report, and ordering
 * 
 * Run: node tests/priority-matrix-tests.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ============ TEST HELPERS ============

let authToken = null;
let testVersionId = null;
let testEntityId = null;

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

    const TEST_EMAIL = 'test-priority@startix.com';
    const TEST_PASS = 'TestPass123!';

    let loginRes = await request('POST', '/api/auth/login', {
        email: TEST_EMAIL, password: TEST_PASS
    });

    if (loginRes.status !== 200 || !loginRes.data?.token) {
        await request('POST', '/api/auth/register', {
            email: TEST_EMAIL, password: TEST_PASS, name: 'Priority Test User'
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

    // Find an entity with strategy version
    const entitiesRes = await request('GET', '/api/entities?limit=50');
    if (entitiesRes.status === 200 && entitiesRes.data?.entities?.length > 0) {
        // Search for an entity that has strategy versions
        for (const entity of entitiesRes.data.entities) {
            const entityRes = await request('GET', `/api/entities/${entity.id}`);
            if (entityRes.data?.entity?.strategyVersions?.length > 0) {
                testEntityId = entity.id;
                testVersionId = entityRes.data.entity.strategyVersions[0].id;
                console.log(`  ✅ Entity: ${testEntityId} (${entity.legalName || entity.displayName})`);
                console.log(`  ✅ Version: ${testVersionId}`);
                break;
            }
        }
        if (!testVersionId) {
            testEntityId = entitiesRes.data.entities[0].id;
            console.log(`  ✅ Entity: ${testEntityId} (no versions)`);
            console.log('  ⚠️ No entity with strategy versions found');
        }
    }
}


// ============ TEST SUITES ============

async function testCriteria() {
    console.log('\n📋 Test Suite: Criteria');

    const res = await request('GET', '/api/priority-matrix/criteria');
    assert(res.status === 200, 'Get criteria returns 200');
    assert(Array.isArray(res.data?.criteria), 'Has criteria array');
    assert(res.data?.criteria?.length === 13, `Has 13 criteria (got ${res.data?.criteria?.length})`);
    assert(res.data?.categories !== undefined, 'Has categories object');
    assert(res.data?.weightsValid === true, 'Weights sum to 100');
    assert(res.data?.totalWeight === 100, `Total weight is 100 (got ${res.data?.totalWeight})`);

    // Check category weights
    const cats = res.data?.categories;
    if (cats) {
        assert(cats.strategic?.weight === 30, 'Strategic weight = 30%');
        assert(cats.impact?.weight === 25, 'Impact weight = 25%');
        assert(cats.operational?.weight === 20, 'Operational weight = 20%');
        assert(cats.sustainability?.weight === 15, 'Sustainability weight = 15%');
        assert(cats.risk?.weight === 10, 'Risk weight = 10%');
    }
}


async function testValidation() {
    console.log('\n🧮 Test Suite: Calculation Validation');

    const res = await request('GET', '/api/priority-matrix/validate');
    assert(res.status === 200, 'Validate returns 200');
    assert(res.data?.valid === true, 'Calculations are valid');
    assert(res.data?.weightsValid === true, 'Weights are valid');
    assert(res.data?.weightsSum === 100, 'Weights sum to 100');

    // Test score cases
    const tests = res.data?.testResults;
    assert(tests?.perfectScore?.totalScore === 100, `Perfect score = 100 (got ${tests?.perfectScore?.totalScore})`);
    assert(tests?.perfectScore?.grade === 'A', 'Perfect score grade = A');
    assert(tests?.zeroScore?.totalScore === 0, `Zero score = 0 (got ${tests?.zeroScore?.totalScore})`);
    assert(tests?.zeroScore?.grade === 'F', 'Zero score grade = F');
    assert(tests?.midScore?.totalScore > 0 && tests?.midScore?.totalScore < 100, 'Mid score is between 0 and 100');

    // Check category checks
    assert(res.data?.categoryChecks !== undefined, 'Has category checks');
    assert(res.data?.formula !== undefined, 'Has formula documentation');

    console.log(`    Perfect: ${tests?.perfectScore?.totalScore} (${tests?.perfectScore?.grade})`);
    console.log(`    Mid:     ${tests?.midScore?.totalScore} (${tests?.midScore?.grade})`);
    console.log(`    Zero:    ${tests?.zeroScore?.totalScore} (${tests?.zeroScore?.grade})`);
}


async function testEvaluate() {
    console.log('\n✏️ Test Suite: Evaluate Items');

    if (!testVersionId) {
        console.log('  ⚠️ No version found — skipping evaluate tests');
        return;
    }

    // Get items first
    const listRes = await request('GET', `/api/priority-matrix?versionId=${testVersionId}`);

    if (!listRes.data?.items || listRes.data.items.length === 0) {
        console.log('  ⚠️ No items to evaluate — creating test scenario');
        // Test with missing versionId
        const res = await request('POST', '/api/priority-matrix/evaluate', {});
        assert(res.status === 400, 'Missing fields returns 400');
        return;
    }

    const testItem = listRes.data.items[0];
    console.log(`  📌 Testing with: ${testItem.title} (${testItem.type})`);

    // Valid evaluation — HIGH scores
    const highScores = {
        strategic_sdg: 5, strategic_vision: 5, strategic_plan: 5,
        impact_beneficiaries: 4, impact_roi: 5, impact_core: 4,
        operational_cost: 4, operational_time: 3, operational_resources: 4, operational_infra: 3,
        sustainability_urgency: 5, sustainability_long: 4,
        risk_level: 4
    };

    const res1 = await request('POST', '/api/priority-matrix/evaluate', {
        versionId: testVersionId,
        itemId: testItem.id,
        itemType: testItem.type,
        scores: highScores
    });
    assert(res1.status === 200, 'Evaluate returns 200');
    assert(res1.data?.totalScore > 0, `Has score (${res1.data?.totalScore})`);
    assert(res1.data?.grade !== undefined, `Has grade (${res1.data?.grade})`);
    assert(res1.data?.priorityClass?.level !== undefined, 'Has priority level');
    assert(res1.data?.categoryScores !== undefined, 'Has category breakdown');
    assert(res1.data?.breakdown !== undefined, 'Has detailed breakdown');

    console.log(`    Score: ${res1.data?.totalScore} (${res1.data?.grade}) — ${res1.data?.priorityClass?.label}`);

    // Evaluate second item with LOW scores (if available)
    if (listRes.data.items.length > 1) {
        const lowItem = listRes.data.items[1];
        const lowScores = {
            strategic_sdg: 1, strategic_vision: 1, strategic_plan: 1,
            impact_beneficiaries: 2, impact_roi: 1, impact_core: 1,
            operational_cost: 2, operational_time: 2, operational_resources: 1, operational_infra: 1,
            sustainability_urgency: 1, sustainability_long: 2,
            risk_level: 1
        };

        const res2 = await request('POST', '/api/priority-matrix/evaluate', {
            versionId: testVersionId,
            itemId: lowItem.id,
            itemType: lowItem.type,
            scores: lowScores
        });
        assert(res2.status === 200, 'Low-score evaluate returns 200');
        assert(res2.data?.totalScore < res1.data?.totalScore,
            `Low score (${res2.data?.totalScore}) < High score (${res1.data?.totalScore})`);

        console.log(`    Low Score: ${res2.data?.totalScore} (${res2.data?.grade}) — ${res2.data?.priorityClass?.label}`);
    }

    // Invalid score range
    const res3 = await request('POST', '/api/priority-matrix/evaluate', {
        versionId: testVersionId,
        itemId: testItem.id,
        itemType: testItem.type,
        scores: { strategic_sdg: 10 } // max is 5
    });
    assert(res3.status === 400, 'Score > max returns 400');

    // Negative score
    const res4 = await request('POST', '/api/priority-matrix/evaluate', {
        versionId: testVersionId,
        itemId: testItem.id,
        itemType: testItem.type,
        scores: { strategic_sdg: -1 }
    });
    assert(res4.status === 400, 'Negative score returns 400');

    // Missing required fields
    const res5 = await request('POST', '/api/priority-matrix/evaluate', {
        versionId: testVersionId
    });
    assert(res5.status === 400, 'Missing itemId returns 400');

    // Invalid itemType
    const res6 = await request('POST', '/api/priority-matrix/evaluate', {
        versionId: testVersionId,
        itemId: testItem.id,
        itemType: 'INVALID',
        scores: { strategic_sdg: 3 }
    });
    assert(res6.status === 400, 'Invalid itemType returns 400');

    // Non-existent version
    const res7 = await request('POST', '/api/priority-matrix/evaluate', {
        versionId: 'non_existent',
        itemId: testItem.id,
        scores: { strategic_sdg: 3 }
    });
    assert(res7.status === 404, 'Non-existent version returns 404');
}


async function testOrdering() {
    console.log('\n📊 Test Suite: Ordering & Rankings');

    if (!testVersionId) {
        console.log('  ⚠️ No version — skipping');
        return;
    }

    const res = await request('GET', `/api/priority-matrix?versionId=${testVersionId}`);
    assert(res.status === 200, 'Get matrix returns 200');
    assert(Array.isArray(res.data?.items), 'Has items array');
    assert(res.data?.stats !== undefined, 'Has stats');
    assert(typeof res.data?.stats?.total === 'number', 'Has total count');
    assert(typeof res.data?.stats?.evaluated === 'number', 'Has evaluated count');
    assert(typeof res.data?.stats?.pending === 'number', 'Has pending count');
    assert(typeof res.data?.stats?.averageScore === 'number', 'Has average score');
    assert(Array.isArray(res.data?.dominance), 'Has dominance array');

    // Check ordering: evaluated items should come first
    const items = res.data?.items || [];
    const evaluatedFirst = items.every((item, i) => {
        if (i === 0) return true;
        const prev = items[i - 1];
        if (prev.evaluated && !item.evaluated) return true;
        if (!prev.evaluated && item.evaluated) return false;
        if (prev.evaluated && item.evaluated) return (prev.totalScore || 0) >= (item.totalScore || 0);
        return true;
    });
    assert(evaluatedFirst, 'Items sorted: evaluated first, then by score desc');

    // Evaluated items should have ranks
    const evaluatedItems = items.filter(i => i.evaluated);
    if (evaluatedItems.length > 0) {
        assert(evaluatedItems[0].rank === 1, 'First evaluated item has rank 1');

        if (evaluatedItems.length > 1) {
            assert(evaluatedItems[1].rank === 2, 'Second evaluated item has rank 2');
            assert(evaluatedItems[0].totalScore >= evaluatedItems[1].totalScore,
                'Rank 1 score >= Rank 2 score');
        }
    }

    console.log(`    Total items: ${res.data?.stats?.total}`);
    console.log(`    Evaluated: ${res.data?.stats?.evaluated}/${res.data?.stats?.total}`);
    console.log(`    Average score: ${res.data?.stats?.averageScore}`);
    console.log(`    High priority: ${res.data?.stats?.highPriority}`);
}


async function testReport() {
    console.log('\n📑 Test Suite: Priority Report');

    if (!testVersionId) {
        console.log('  ⚠️ No version — skipping');
        return;
    }

    const res = await request('GET', `/api/priority-matrix/report?versionId=${testVersionId}`);
    assert(res.status === 200, 'Report returns 200');
    assert(res.data?.report !== undefined, 'Has report object');

    const report = res.data?.report;

    // Version info
    assert(report?.version?.id === testVersionId, 'Report has correct version');

    // Summary
    assert(report?.summary !== undefined, 'Has summary');
    assert(typeof report?.summary?.totalItems === 'number', 'Summary has totalItems');
    assert(typeof report?.summary?.evaluated === 'number', 'Summary has evaluated');
    assert(typeof report?.summary?.completionRate === 'number', 'Summary has completionRate');
    assert(typeof report?.summary?.averageScore === 'number', 'Summary has averageScore');

    // Priority distribution
    assert(report?.priorityDistribution !== undefined, 'Has priority distribution');
    assert(typeof report?.priorityDistribution?.critical === 'number', 'Has critical count');
    assert(typeof report?.priorityDistribution?.high === 'number', 'Has high count');
    assert(typeof report?.priorityDistribution?.medium === 'number', 'Has medium count');
    assert(typeof report?.priorityDistribution?.low === 'number', 'Has low count');

    // Budget analysis
    assert(report?.budget !== undefined, 'Has budget analysis');
    assert(typeof report?.budget?.total === 'number', 'Has total budget');

    // Category analysis
    assert(report?.categoryAnalysis !== undefined, 'Has category analysis');
    for (const catId of ['strategic', 'impact', 'operational', 'sustainability', 'risk']) {
        assert(report?.categoryAnalysis?.[catId] !== undefined, `Has ${catId} analysis`);
        assert(typeof report?.categoryAnalysis?.[catId]?.avgScore === 'number', `${catId} has avgScore`);
    }

    // Weights validation
    assert(report?.weightsValid !== undefined, 'Has weights validation');

    // Dominance
    assert(Array.isArray(report?.dominance), 'Has dominance analysis');

    // Ranked items
    assert(Array.isArray(res.data?.rankedItems), 'Has ranked items');

    // Recommendations
    assert(Array.isArray(res.data?.recommendations), 'Has recommendations');

    console.log(`    Items: ${report?.summary?.totalItems}`);
    console.log(`    Evaluated: ${report?.summary?.evaluated}`);
    console.log(`    Completion: ${report?.summary?.completionRate}%`);
    console.log(`    Avg Score: ${report?.summary?.averageScore}`);
    console.log(`    Strongest: ${report?.strongestCategory?.name || 'N/A'} (${report?.strongestCategory?.avgScore || 0}%)`);
    console.log(`    Weakest: ${report?.weakestCategory?.name || 'N/A'} (${report?.weakestCategory?.avgScore || 0}%)`);

    // Missing versionId
    const res2 = await request('GET', '/api/priority-matrix/report');
    assert(res2.status === 400, 'Report without versionId returns 400');

    // Non-existent version
    const res3 = await request('GET', '/api/priority-matrix/report?versionId=non_existent');
    assert(res3.status === 404, 'Report for non-existent version returns 404');
}


async function testSensitivity() {
    console.log('\n🔬 Test Suite: Sensitivity Analysis');

    if (!testVersionId) {
        console.log('  ⚠️ No version — skipping');
        return;
    }

    // Without overrides (same weights)
    const res1 = await request('POST', '/api/priority-matrix/sensitivity', {
        versionId: testVersionId
    });
    assert(res1.status === 200, 'Sensitivity without overrides returns 200');
    assert(Array.isArray(res1.data?.results), 'Has results array');
    assert(res1.data?.weightsValid !== undefined, 'Has weights validation');

    // With overrides — increase strategic weight
    const res2 = await request('POST', '/api/priority-matrix/sensitivity', {
        versionId: testVersionId,
        weightOverrides: {
            strategic: 50,  // was 30
            operational: 0   // was 20 — to keep sum = 100
        }
    });
    assert(res2.status === 200, 'Sensitivity with overrides returns 200');
    assert(res2.data?.appliedWeights?.strategic?.weight === 50, 'Strategic weight overridden to 50');
    assert(res2.data?.appliedWeights?.operational?.weight === 0, 'Operational weight overridden to 0');

    if (res2.data?.results?.length > 0) {
        const item = res2.data.results[0];
        assert(typeof item.originalScore === 'number', 'Has original score');
        assert(typeof item.modifiedScore === 'number', 'Has modified score');
        assert(typeof item.scoreDelta === 'number', 'Has score delta');
        assert(typeof item.rankChange === 'number', 'Has rank change');

        console.log(`    Sample: ${item.itemId}`);
        console.log(`      Original: ${item.originalScore} → Modified: ${item.modifiedScore} (Δ${item.scoreDelta > 0 ? '+' : ''}${item.scoreDelta})`);
    }

    // Missing versionId
    const res3 = await request('POST', '/api/priority-matrix/sensitivity', {});
    assert(res3.status === 400, 'Sensitivity without versionId returns 400');
}


async function testBatchEvaluate() {
    console.log('\n📦 Test Suite: Batch Evaluate');

    if (!testVersionId) {
        console.log('  ⚠️ No version — skipping');
        return;
    }

    // Get items
    const listRes = await request('GET', `/api/priority-matrix?versionId=${testVersionId}`);
    const items = listRes.data?.items || [];

    if (items.length < 2) {
        console.log('  ⚠️ Not enough items for batch test');
        return;
    }

    // Batch evaluate 2 items
    const evaluations = items.slice(0, 2).map((item, i) => ({
        itemId: item.id,
        itemType: item.type,
        scores: {
            strategic_sdg: 3 + i, strategic_vision: 4, strategic_plan: 3,
            impact_beneficiaries: 3, impact_roi: 3 + i, impact_core: 3,
            operational_cost: 3, operational_time: 3, operational_resources: 3, operational_infra: 3,
            sustainability_urgency: 3, sustainability_long: 3,
            risk_level: 3
        }
    }));

    const res = await request('POST', '/api/priority-matrix/evaluate-batch', {
        versionId: testVersionId,
        evaluations
    });

    assert(res.status === 200, 'Batch evaluate returns 200');
    assert(res.data?.processed === 2, `Processed 2 items (got ${res.data?.processed})`);
    assert(res.data?.errors === 0, 'No errors');
    assert(Array.isArray(res.data?.results), 'Has results array');

    if (res.data?.results?.length > 0) {
        assert(res.data.results[0].totalScore > 0, 'First item has score');
        assert(res.data.results[0].grade !== undefined, 'First item has grade');
    }

    // Batch with validation errors
    const res2 = await request('POST', '/api/priority-matrix/evaluate-batch', {
        versionId: testVersionId,
        evaluations: [
            { itemId: items[0].id, scores: { strategic_sdg: 10 } }, // invalid score
            { scores: {} } // missing itemId
        ]
    });
    assert(res2.status === 200, 'Batch with errors still returns 200');
    assert(res2.data?.errors > 0, 'Reports errors count');

    // Missing evaluations
    const res3 = await request('POST', '/api/priority-matrix/evaluate-batch', {
        versionId: testVersionId
    });
    assert(res3.status === 400, 'Batch without evaluations returns 400');
}


// ============ RUN ============

async function run() {
    console.log('═══════════════════════════════════════════════');
    console.log('🧪 Priority Matrix Tests — Phase 1.3');
    console.log('═══════════════════════════════════════════════');

    try {
        await setup();
        await testCriteria();
        await testValidation();
        await testEvaluate();
        await testOrdering();
        await testReport();
        await testSensitivity();
        await testBatchEvaluate();
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
