const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// 🎯 PRIORITY MATRIX — مصفوفة الأولويات الذكية (MCDA)
// المنهجية 3: Multi-Criteria Decision Analysis
// Phase 1.3: تقوية + Report + Calculation Validation
// ============================================================

// Default criteria weights (can be customized per entity)
const DEFAULT_CRITERIA = [
    { id: 'strategic_sdg', category: 'strategic', nameAr: 'التوافق مع SDGs', weight: 10, max: 5 },
    { id: 'strategic_vision', category: 'strategic', nameAr: 'التوافق مع رؤية 2030', weight: 15, max: 5 },
    { id: 'strategic_plan', category: 'strategic', nameAr: 'التوافق مع أهداف الخطة', weight: 5, max: 5 },
    { id: 'impact_beneficiaries', category: 'impact', nameAr: 'عدد المستفيدين', weight: 10, max: 5 },
    { id: 'impact_roi', category: 'impact', nameAr: 'العائد المتوقع', weight: 10, max: 5 },
    { id: 'impact_core', category: 'impact', nameAr: 'المجال الجوهري', weight: 5, max: 5 },
    { id: 'operational_cost', category: 'operational', nameAr: 'التكلفة', weight: 7, max: 5 },
    { id: 'operational_time', category: 'operational', nameAr: 'الوقت المطلوب', weight: 5, max: 5 },
    { id: 'operational_resources', category: 'operational', nameAr: 'الموارد المتاحة', weight: 5, max: 5 },
    { id: 'operational_infra', category: 'operational', nameAr: 'البنية التحتية', weight: 3, max: 5 },
    { id: 'sustainability_urgency', category: 'sustainability', nameAr: 'الاستعجال', weight: 8, max: 5 },
    { id: 'sustainability_long', category: 'sustainability', nameAr: 'الاستدامة طويلة المدى', weight: 7, max: 5 },
    { id: 'risk_level', category: 'risk', nameAr: 'مستوى المخاطر', weight: 10, max: 5 },
];

const CATEGORIES = {
    strategic: { nameAr: 'المعايير الاستراتيجية', weight: 30, color: '#818cf8' },
    impact: { nameAr: 'معايير الأثر', weight: 25, color: '#22c55e' },
    operational: { nameAr: 'المعايير التشغيلية', weight: 20, color: '#38bdf8' },
    sustainability: { nameAr: 'معايير الاستدامة', weight: 15, color: '#facc15' },
    risk: { nameAr: 'معايير المخاطر', weight: 10, color: '#f87171' },
};


// ============================================================
// 🧮 CALCULATION ENGINE — محرك الحساب
// ============================================================

/**
 * Calculate weighted score for a set of scores
 * @param {Object} scores - {criterionId: score}
 * @param {Object} categories - Custom categories or defaults
 * @returns {Object} {totalScore, categoryScores, breakdown}
 */
function calculateWeightedScore(scores, categories = CATEGORIES) {
    const categoryScores = {};
    let totalWeightedScore = 0;
    const breakdown = [];

    for (const [catId, cat] of Object.entries(categories)) {
        const catCriteria = DEFAULT_CRITERIA.filter(c => c.category === catId);
        let catScore = 0;
        let catMaxScore = 0;
        const criteriaDetails = [];

        for (const criterion of catCriteria) {
            const score = scores[criterion.id] || 0;
            const weightedScore = score * criterion.weight;
            const maxWeightedScore = criterion.max * criterion.weight;

            catScore += weightedScore;
            catMaxScore += maxWeightedScore;

            criteriaDetails.push({
                id: criterion.id,
                name: criterion.nameAr,
                rawScore: score,
                maxScore: criterion.max,
                weight: criterion.weight,
                weightedScore,
                maxWeightedScore,
                percentage: criterion.max > 0 ? Math.round((score / criterion.max) * 100) : 0
            });
        }

        const catPct = catMaxScore > 0 ? (catScore / catMaxScore) * 100 : 0;
        const weightedContribution = catPct * (cat.weight / 100);

        categoryScores[catId] = {
            name: cat.nameAr,
            color: cat.color,
            categoryWeight: cat.weight,
            score: catScore,
            maxScore: catMaxScore,
            percentage: Math.round(catPct),
            weightedContribution: Math.round(weightedContribution * 10) / 10,
            criteria: criteriaDetails
        };

        totalWeightedScore += weightedContribution;
        breakdown.push({
            category: catId,
            name: cat.nameAr,
            weight: cat.weight,
            percentage: Math.round(catPct),
            contribution: Math.round(weightedContribution * 10) / 10
        });
    }

    return {
        totalScore: Math.round(totalWeightedScore),
        grade: totalWeightedScore >= 80 ? 'A' :
            totalWeightedScore >= 60 ? 'B' :
                totalWeightedScore >= 40 ? 'C' :
                    totalWeightedScore >= 20 ? 'D' : 'F',
        categoryScores,
        breakdown
    };
}

/**
 * Validate that category weights sum to 100
 */
function validateWeights(categories) {
    const totalWeight = Object.values(categories).reduce((sum, c) => sum + (c.weight || 0), 0);
    return { valid: totalWeight === 100, totalWeight };
}

/**
 * Classify priority based on score
 */
function classifyPriority(score) {
    if (score >= 80) return { level: 'CRITICAL', label: 'أولوية حرجة', color: '#ef4444' };
    if (score >= 60) return { level: 'HIGH', label: 'أولوية عالية', color: '#f97316' };
    if (score >= 40) return { level: 'MEDIUM', label: 'أولوية متوسطة', color: '#eab308' };
    if (score >= 20) return { level: 'LOW', label: 'أولوية منخفضة', color: '#22c55e' };
    return { level: 'MINIMAL', label: 'أولوية دنيا', color: '#94a3b8' };
}


// ============================================================
// GET /api/priority-matrix/criteria
// ============================================================
router.get('/criteria', verifyToken, (req, res) => {
    const weightValidation = validateWeights(CATEGORIES);
    res.json({
        criteria: DEFAULT_CRITERIA,
        categories: CATEGORIES,
        totalCriteria: DEFAULT_CRITERIA.length,
        weightsValid: weightValidation.valid,
        totalWeight: weightValidation.totalWeight
    });
});


// ============================================================
// GET /api/priority-matrix?versionId=xxx
// Get all evaluations for a version
// ============================================================
router.get('/', verifyToken, async (req, res) => {
    try {
        const { versionId } = req.query;
        if (!versionId) return res.status(400).json({ error: 'versionId مطلوب' });

        // Get initiatives for this version
        const initiatives = await prisma.strategicInitiative.findMany({
            where: { versionId },
            select: {
                id: true, title: true, description: true, status: true,
                priority: true, budget: true, progress: true,
                startDate: true, endDate: true, owner: true
            },
            orderBy: { createdAt: 'asc' }
        });

        // Get choices for this version  
        const choices = await prisma.strategicChoice.findMany({
            where: { versionId },
            select: {
                id: true, title: true, description: true, priority: true,
                status: true, choiceType: true, feasibility: true, riskLevel: true
            },
            orderBy: { createdAt: 'asc' }
        });

        // Combine all "items" that can be prioritized
        const items = [
            ...initiatives.map(i => ({ ...i, type: 'INITIATIVE', typeLabel: 'مبادرة' })),
            ...choices.map(c => ({ ...c, type: 'CHOICE', typeLabel: 'خيار استراتيجي' })),
        ];

        // Get stored evaluations
        const evaluations = await getStoredEvaluations(versionId);

        // Calculate scores
        const rankedItems = items.map(item => {
            const eval_ = evaluations[item.id];
            if (!eval_ || !eval_.scores) {
                return { ...item, totalScore: null, categoryScores: {}, evaluated: false, priority: classifyPriority(0) };
            }

            const result = calculateWeightedScore(eval_.scores);
            return {
                ...item,
                totalScore: result.totalScore,
                grade: result.grade,
                categoryScores: result.categoryScores,
                priorityClass: classifyPriority(result.totalScore),
                evaluated: true,
                evaluatedAt: eval_.evaluatedAt
            };
        });

        // Sort: evaluated first, then by score desc
        rankedItems.sort((a, b) => {
            if (a.evaluated && !b.evaluated) return -1;
            if (!a.evaluated && b.evaluated) return 1;
            return (b.totalScore || 0) - (a.totalScore || 0);
        });

        // Assign ranks
        let rank = 1;
        for (const item of rankedItems) {
            if (item.evaluated) {
                item.rank = rank++;
            }
        }

        // Dominance analysis
        const dominanceResults = performDominanceAnalysis(rankedItems);

        const evaluatedItems = rankedItems.filter(i => i.evaluated);

        res.json({
            items: rankedItems,
            criteria: DEFAULT_CRITERIA,
            categories: CATEGORIES,
            dominance: dominanceResults,
            stats: {
                total: items.length,
                evaluated: evaluatedItems.length,
                pending: items.length - evaluatedItems.length,
                averageScore: evaluatedItems.length > 0 ?
                    Math.round(evaluatedItems.reduce((s, i) => s + i.totalScore, 0) / evaluatedItems.length) : 0,
                highPriority: evaluatedItems.filter(i => i.totalScore >= 60).length,
                lowPriority: evaluatedItems.filter(i => i.totalScore < 40).length
            }
        });
    } catch (error) {
        console.error('Error fetching priority matrix:', error);
        res.status(500).json({ error: 'Failed to fetch priority matrix' });
    }
});


// ============================================================
// GET /api/priority-matrix/report?versionId=xxx
// Priority Report — تقرير الأولويات (المهمة 1.3.2)
// ============================================================
router.get('/report', verifyToken, async (req, res) => {
    try {
        const { versionId } = req.query;
        if (!versionId) return res.status(400).json({ error: 'versionId مطلوب' });

        // Get version info
        const version = await prisma.strategyVersion.findUnique({
            where: { id: versionId },
            select: {
                id: true,
                versionNumber: true,
                status: true,
                entity: {
                    select: { id: true, legalName: true, displayName: true }
                }
            }
        });

        if (!version) {
            return res.status(404).json({ error: 'Strategy version not found' });
        }

        // Get initiatives
        const initiatives = await prisma.strategicInitiative.findMany({
            where: { versionId },
            select: {
                id: true, title: true, description: true, status: true,
                priority: true, budget: true, progress: true,
                startDate: true, endDate: true, owner: true
            }
        });

        // Get choices
        const choices = await prisma.strategicChoice.findMany({
            where: { versionId },
            select: {
                id: true, title: true, description: true, priority: true,
                status: true, choiceType: true, feasibility: true, riskLevel: true
            }
        });

        const items = [
            ...initiatives.map(i => ({ ...i, type: 'INITIATIVE', typeLabel: 'مبادرة' })),
            ...choices.map(c => ({ ...c, type: 'CHOICE', typeLabel: 'خيار استراتيجي' })),
        ];

        // Get evaluations
        const evaluations = await getStoredEvaluations(versionId);

        // Calculate scores for all
        const scoredItems = items.map(item => {
            const eval_ = evaluations[item.id];
            if (!eval_ || !eval_.scores) {
                return { ...item, totalScore: null, evaluated: false };
            }
            const result = calculateWeightedScore(eval_.scores);
            return {
                ...item,
                totalScore: result.totalScore,
                grade: result.grade,
                categoryScores: result.categoryScores,
                breakdown: result.breakdown,
                priorityClass: classifyPriority(result.totalScore),
                evaluated: true,
                evaluatedAt: eval_.evaluatedAt
            };
        });

        // Sort by score
        scoredItems.sort((a, b) => {
            if (a.evaluated && !b.evaluated) return -1;
            if (!a.evaluated && b.evaluated) return 1;
            return (b.totalScore || 0) - (a.totalScore || 0);
        });

        // Assign ranks
        let rank = 1;
        for (const item of scoredItems) {
            if (item.evaluated) item.rank = rank++;
        }

        const evaluatedItems = scoredItems.filter(i => i.evaluated);
        const pendingItems = scoredItems.filter(i => !i.evaluated);

        // Category analysis across all evaluated items
        const categoryAnalysis = {};
        for (const catId of Object.keys(CATEGORIES)) {
            const catScores = evaluatedItems
                .filter(i => i.categoryScores?.[catId])
                .map(i => i.categoryScores[catId].percentage);

            categoryAnalysis[catId] = {
                name: CATEGORIES[catId].nameAr,
                weight: CATEGORIES[catId].weight,
                avgScore: catScores.length > 0 ? Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length) : 0,
                minScore: catScores.length > 0 ? Math.min(...catScores) : 0,
                maxScore: catScores.length > 0 ? Math.max(...catScores) : 0,
                itemCount: catScores.length
            };
        }

        // Weakest category (lowest avg score across all items)
        let weakestCategory = null;
        let weakestScore = 100;
        for (const [catId, analysis] of Object.entries(categoryAnalysis)) {
            if (analysis.avgScore < weakestScore && analysis.itemCount > 0) {
                weakestScore = analysis.avgScore;
                weakestCategory = { id: catId, ...analysis };
            }
        }

        // Strongest category
        let strongestCategory = null;
        let strongestScore = 0;
        for (const [catId, analysis] of Object.entries(categoryAnalysis)) {
            if (analysis.avgScore > strongestScore && analysis.itemCount > 0) {
                strongestScore = analysis.avgScore;
                strongestCategory = { id: catId, ...analysis };
            }
        }

        // Budget analysis for initiatives
        const totalBudget = initiatives.reduce((sum, i) => sum + (i.budget || 0), 0);
        const prioritizedBudget = evaluatedItems
            .filter(i => i.type === 'INITIATIVE' && i.totalScore >= 60)
            .reduce((sum, i) => sum + (i.budget || 0), 0);

        // Recommendations
        const recommendations = [];

        if (pendingItems.length > 0) {
            recommendations.push({
                type: 'ACTION',
                severity: 'HIGH',
                message: `يوجد ${pendingItems.length} عنصر لم يُقيَّم بعد — يجب تقييمها لاكتمال المصفوفة`,
                items: pendingItems.map(i => i.title)
            });
        }

        if (weakestCategory && weakestCategory.avgScore < 40) {
            recommendations.push({
                type: 'IMPROVEMENT',
                severity: 'MEDIUM',
                message: `الفئة الأضعف: "${weakestCategory.name}" بمعدل ${weakestCategory.avgScore}% — تحتاج تحسين`,
                category: weakestCategory.id
            });
        }

        const highPriorityItems = evaluatedItems.filter(i => i.totalScore >= 60);
        if (highPriorityItems.length > 5) {
            recommendations.push({
                type: 'FOCUS',
                severity: 'MEDIUM',
                message: `${highPriorityItems.length} عنصر بأولوية عالية — قد تحتاج لتقليص العدد والتركيز على الأهم`
            });
        }

        const dominance = performDominanceAnalysis(scoredItems);

        res.json({
            report: {
                generatedAt: new Date().toISOString(),
                version: {
                    id: version.id,
                    number: version.versionNumber,
                    status: version.status,
                    entity: version.entity
                },
                summary: {
                    totalItems: items.length,
                    evaluated: evaluatedItems.length,
                    pending: pendingItems.length,
                    completionRate: items.length > 0 ? Math.round((evaluatedItems.length / items.length) * 100) : 0,
                    averageScore: evaluatedItems.length > 0 ?
                        Math.round(evaluatedItems.reduce((s, i) => s + i.totalScore, 0) / evaluatedItems.length) : 0,
                    highestScore: evaluatedItems.length > 0 ? Math.max(...evaluatedItems.map(i => i.totalScore)) : 0,
                    lowestScore: evaluatedItems.length > 0 ? Math.min(...evaluatedItems.map(i => i.totalScore)) : 0
                },
                priorityDistribution: {
                    critical: evaluatedItems.filter(i => i.totalScore >= 80).length,
                    high: evaluatedItems.filter(i => i.totalScore >= 60 && i.totalScore < 80).length,
                    medium: evaluatedItems.filter(i => i.totalScore >= 40 && i.totalScore < 60).length,
                    low: evaluatedItems.filter(i => i.totalScore >= 20 && i.totalScore < 40).length,
                    minimal: evaluatedItems.filter(i => i.totalScore < 20).length
                },
                budget: {
                    total: totalBudget,
                    prioritized: prioritizedBudget,
                    ratio: totalBudget > 0 ? Math.round((prioritizedBudget / totalBudget) * 100) : 0
                },
                categoryAnalysis,
                weakestCategory,
                strongestCategory,
                weightsValid: validateWeights(CATEGORIES),
                dominance
            },
            rankedItems: scoredItems,
            recommendations
        });
    } catch (error) {
        console.error('Error generating priority report:', error);
        res.status(500).json({ error: 'Failed to generate priority report' });
    }
});


// ============================================================
// POST /api/priority-matrix/evaluate
// Submit evaluation for an item
// ============================================================
router.post('/evaluate', verifyToken, async (req, res) => {
    try {
        const { versionId, itemId, itemType, scores, notes } = req.body;

        if (!versionId || !itemId || !scores) {
            return res.status(400).json({ error: 'versionId, itemId, and scores مطلوبة' });
        }

        // Validate itemType
        if (itemType && !['INITIATIVE', 'CHOICE'].includes(itemType)) {
            return res.status(400).json({ error: 'itemType must be INITIATIVE or CHOICE' });
        }

        // Validate scores
        for (const criterion of DEFAULT_CRITERIA) {
            const score = scores[criterion.id];
            if (score !== undefined) {
                if (typeof score !== 'number' || score < 0 || score > criterion.max) {
                    return res.status(400).json({
                        error: `قيمة غير صالحة للمعيار "${criterion.nameAr}": ${score}. يجب أن تكون بين 0 و ${criterion.max}`,
                        criterion: criterion.id,
                        range: { min: 0, max: criterion.max }
                    });
                }
            }
        }

        // Verify version exists
        const version = await prisma.strategyVersion.findUnique({
            where: { id: versionId },
            select: { id: true, entityId: true }
        });

        if (!version) {
            return res.status(404).json({ error: 'Strategy version not found' });
        }

        // Store evaluation via Audit Log
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id || 'system',
                action: 'PRIORITY_EVALUATION',
                entityId: version.entityId,
                details: JSON.stringify({
                    versionId,
                    itemId,
                    itemType,
                    scores,
                    notes: notes || '',
                    evaluatedAt: new Date().toISOString(),
                    evaluatedBy: req.user?.id || 'system'
                })
            }
        });

        // Calculate the score for immediate feedback
        const result = calculateWeightedScore(scores);

        res.json({
            message: 'تم حفظ التقييم بنجاح',
            itemId,
            totalScore: result.totalScore,
            grade: result.grade,
            priorityClass: classifyPriority(result.totalScore),
            categoryScores: result.categoryScores,
            breakdown: result.breakdown
        });
    } catch (error) {
        console.error('Error saving evaluation:', error);
        res.status(500).json({ error: 'Failed to save evaluation' });
    }
});


// ============================================================
// POST /api/priority-matrix/evaluate-batch
// Batch evaluate multiple items at once
// ============================================================
router.post('/evaluate-batch', verifyToken, async (req, res) => {
    try {
        const { versionId, evaluations } = req.body;

        if (!versionId || !Array.isArray(evaluations) || evaluations.length === 0) {
            return res.status(400).json({ error: 'versionId and evaluations[] مطلوبة' });
        }

        // Verify version
        const version = await prisma.strategyVersion.findUnique({
            where: { id: versionId },
            select: { id: true, entityId: true }
        });
        if (!version) {
            return res.status(404).json({ error: 'Strategy version not found' });
        }

        const results = [];
        const errors = [];

        for (let i = 0; i < evaluations.length; i++) {
            const { itemId, itemType, scores, notes } = evaluations[i];

            if (!itemId || !scores) {
                errors.push({ index: i, error: 'itemId and scores required' });
                continue;
            }

            // Validate scores
            let valid = true;
            for (const criterion of DEFAULT_CRITERIA) {
                const score = scores[criterion.id];
                if (score !== undefined && (typeof score !== 'number' || score < 0 || score > criterion.max)) {
                    errors.push({ index: i, itemId, error: `Invalid score for ${criterion.id}` });
                    valid = false;
                    break;
                }
            }

            if (!valid) continue;

            await prisma.auditLog.create({
                data: {
                    userId: req.user?.id || 'system',
                    action: 'PRIORITY_EVALUATION',
                    entityId: version.entityId,
                    details: JSON.stringify({
                        versionId,
                        itemId,
                        itemType,
                        scores,
                        notes: notes || '',
                        evaluatedAt: new Date().toISOString(),
                        evaluatedBy: req.user?.id || 'system'
                    })
                }
            });

            const result = calculateWeightedScore(scores);
            results.push({
                itemId,
                totalScore: result.totalScore,
                grade: result.grade,
                priorityClass: classifyPriority(result.totalScore)
            });
        }

        res.json({
            message: `تم تقييم ${results.length} عنصر بنجاح`,
            processed: results.length,
            errors: errors.length,
            results,
            errorDetails: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error batch evaluating:', error);
        res.status(500).json({ error: 'Failed to batch evaluate' });
    }
});


// ============================================================
// POST /api/priority-matrix/sensitivity
// Sensitivity analysis — what if weights change?
// ============================================================
router.post('/sensitivity', verifyToken, async (req, res) => {
    try {
        const { versionId, weightOverrides } = req.body;
        if (!versionId) return res.status(400).json({ error: 'versionId مطلوب' });

        // Apply weight overrides
        const modifiedCategories = {};
        for (const [key, val] of Object.entries(CATEGORIES)) {
            modifiedCategories[key] = { ...val };
        }

        if (weightOverrides) {
            for (const [catId, newWeight] of Object.entries(weightOverrides)) {
                if (modifiedCategories[catId]) {
                    modifiedCategories[catId].weight = newWeight;
                }
            }
        }

        // Validate new weights
        const weightValidation = validateWeights(modifiedCategories);

        // Get evaluations
        const evaluations = await getStoredEvaluations(versionId);

        // Recalculate with both original and modified weights
        const results = [];
        for (const [itemId, eval_] of Object.entries(evaluations)) {
            if (!eval_.scores) continue;

            const originalResult = calculateWeightedScore(eval_.scores, CATEGORIES);
            const modifiedResult = calculateWeightedScore(eval_.scores, modifiedCategories);

            results.push({
                itemId,
                itemType: eval_.itemType,
                originalScore: originalResult.totalScore,
                originalGrade: originalResult.grade,
                modifiedScore: modifiedResult.totalScore,
                modifiedGrade: modifiedResult.grade,
                scoreDelta: modifiedResult.totalScore - originalResult.totalScore,
                rankChange: null // will be calculated after sorting
            });
        }

        // Calculate rank changes
        const originalOrder = [...results].sort((a, b) => b.originalScore - a.originalScore);
        const modifiedOrder = [...results].sort((a, b) => b.modifiedScore - a.modifiedScore);

        for (const item of results) {
            const origRank = originalOrder.findIndex(i => i.itemId === item.itemId) + 1;
            const modRank = modifiedOrder.findIndex(i => i.itemId === item.itemId) + 1;
            item.originalRank = origRank;
            item.modifiedRank = modRank;
            item.rankChange = origRank - modRank; // positive = moved up
        }

        results.sort((a, b) => b.modifiedScore - a.modifiedScore);

        res.json({
            results,
            originalWeights: CATEGORIES,
            appliedWeights: modifiedCategories,
            weightsValid: weightValidation,
            rankChanges: results.filter(r => r.rankChange !== 0).length,
            message: 'تحليل الحساسية مكتمل'
        });
    } catch (error) {
        console.error('Error in sensitivity analysis:', error);
        res.status(500).json({ error: 'Failed to run sensitivity analysis' });
    }
});


// ============================================================
// GET /api/priority-matrix/validate
// Validate calculation integrity
// ============================================================
router.get('/validate', verifyToken, (req, res) => {
    const weightValidation = validateWeights(CATEGORIES);

    // Verify each category criteria weights are reasonable
    const categoryChecks = {};
    for (const [catId, cat] of Object.entries(CATEGORIES)) {
        const catCriteria = DEFAULT_CRITERIA.filter(c => c.category === catId);
        const totalCriteriaWeight = catCriteria.reduce((sum, c) => sum + c.weight, 0);
        categoryChecks[catId] = {
            name: cat.nameAr,
            categoryWeight: cat.weight,
            criteriaCount: catCriteria.length,
            totalCriteriaWeight,
            criteria: catCriteria.map(c => ({ id: c.id, name: c.nameAr, weight: c.weight, max: c.max }))
        };
    }

    // Test calculation with perfect scores
    const perfectScores = {};
    for (const c of DEFAULT_CRITERIA) {
        perfectScores[c.id] = c.max;
    }
    const perfectResult = calculateWeightedScore(perfectScores);

    // Test with zero scores
    const zeroResult = calculateWeightedScore({});

    // Test with mid scores
    const midScores = {};
    for (const c of DEFAULT_CRITERIA) {
        midScores[c.id] = Math.round(c.max / 2);
    }
    const midResult = calculateWeightedScore(midScores);

    res.json({
        valid: weightValidation.valid && perfectResult.totalScore === 100,
        weightsSum: weightValidation.totalWeight,
        weightsValid: weightValidation.valid,
        categoryChecks,
        testResults: {
            perfectScore: { input: 'All max values', totalScore: perfectResult.totalScore, grade: perfectResult.grade },
            zeroScore: { input: 'All zeros', totalScore: zeroResult.totalScore, grade: zeroResult.grade },
            midScore: { input: 'All mid values', totalScore: midResult.totalScore, grade: midResult.grade }
        },
        formula: 'totalScore = Σ(category_percentage × category_weight / 100) for each category'
    });
});


// ============================================================
// HELPER: Get stored evaluations for a version
// ============================================================
async function getStoredEvaluations(versionId) {
    const storedEvals = await prisma.auditLog.findMany({
        where: {
            action: 'PRIORITY_EVALUATION',
        },
        orderBy: { createdAt: 'desc' }
    });

    const evaluations = {};
    for (const log of storedEvals) {
        try {
            const data = JSON.parse(log.details || '{}');
            // Match by versionId stored in details (since entityId is now Entity ID)
            if (data.versionId === versionId && data.itemId && !evaluations[data.itemId]) {
                evaluations[data.itemId] = data;
            }
        } catch (e) { /* skip */ }
    }
    return evaluations;
}


// ============================================================
// HELPER: Dominance analysis
// ============================================================
function performDominanceAnalysis(rankedItems) {
    const dominanceResults = [];
    const evaluatedItems = rankedItems.filter(i => i.evaluated);

    for (let i = 0; i < evaluatedItems.length; i++) {
        for (let j = i + 1; j < evaluatedItems.length; j++) {
            const a = evaluatedItems[i];
            const b = evaluatedItems[j];
            let aDominates = true;
            let bDominates = true;
            let equalCount = 0;

            for (const catId of Object.keys(CATEGORIES)) {
                const aScore = a.categoryScores[catId]?.percentage || 0;
                const bScore = b.categoryScores[catId]?.percentage || 0;
                if (aScore < bScore) aDominates = false;
                if (bScore < aScore) bDominates = false;
                if (aScore === bScore) equalCount++;
            }

            if (aDominates && !bDominates) {
                dominanceResults.push({
                    dominant: a.id,
                    dominantTitle: a.title,
                    dominated: b.id,
                    dominatedTitle: b.title,
                    type: equalCount === 0 ? 'STRICT' : 'WEAK'
                });
            } else if (bDominates && !aDominates) {
                dominanceResults.push({
                    dominant: b.id,
                    dominantTitle: b.title,
                    dominated: a.id,
                    dominatedTitle: a.title,
                    type: equalCount === 0 ? 'STRICT' : 'WEAK'
                });
            }
        }
    }
    return dominanceResults;
}


module.exports = router;
