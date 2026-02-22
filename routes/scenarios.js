const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware
const { verifyToken } = require('../middleware/auth');

// =============================================
// 1. GET /api/scenarios — كل سيناريوهات الإصدار
// =============================================
router.get('/', verifyToken, async (req, res) => {
    try {
        const { versionId, type, status, limit = 20 } = req.query;
        const where = {};
        if (versionId) where.versionId = versionId;
        if (type) where.type = type;
        if (status) where.status = status;

        const scenarios = await prisma.scenario.findMany({
            where,
            include: {
                variables: true,
                version: {
                    select: { id: true, versionNumber: true, name: true, entity: { select: { legalName: true } } }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        res.json({ scenarios, total: scenarios.length });
    } catch (error) {
        console.error('GET /scenarios error:', error);
        res.status(500).json({ error: 'خطأ في جلب السيناريوهات' });
    }
});

// =============================================
// 2. GET /api/scenarios/:id — سيناريو واحد
// =============================================
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const scenario = await prisma.scenario.findUnique({
            where: { id: req.params.id },
            include: {
                variables: { orderBy: { createdAt: 'asc' } },
                version: {
                    select: {
                        id: true, versionNumber: true, name: true,
                        entity: { select: { legalName: true, displayName: true } }
                    }
                }
            }
        });

        if (!scenario) return res.status(404).json({ error: 'السيناريو غير موجود' });
        res.json(scenario);
    } catch (error) {
        console.error('GET /scenarios/:id error:', error);
        res.status(500).json({ error: 'خطأ في جلب السيناريو' });
    }
});

// =============================================
// 3. POST /api/scenarios — إنشاء سيناريو جديد
// =============================================
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            versionId, name, nameEn, type, description,
            probability, impact, h1BudgetPct, h2BudgetPct, h3BudgetPct,
            notes, variables
        } = req.body;

        if (!versionId || !name) {
            return res.status(400).json({ error: 'اسم السيناريو والإصدار مطلوبان' });
        }

        const scenario = await prisma.scenario.create({
            data: {
                versionId, name, nameEn,
                type: type || 'CUSTOM',
                description,
                probability: probability ? parseFloat(probability) : 50,
                impact: impact || 'MEDIUM',
                h1BudgetPct: h1BudgetPct ? parseFloat(h1BudgetPct) : 70,
                h2BudgetPct: h2BudgetPct ? parseFloat(h2BudgetPct) : 20,
                h3BudgetPct: h3BudgetPct ? parseFloat(h3BudgetPct) : 10,
                notes,
                createdBy: req.user?.id || null,
                variables: variables && variables.length > 0 ? {
                    create: variables.map(v => ({
                        variableType: v.variableType || 'CUSTOM',
                        referenceId: v.referenceId || null,
                        referenceName: v.referenceName || null,
                        baselineValue: v.baselineValue ? parseFloat(v.baselineValue) : null,
                        adjustedValue: v.adjustedValue ? parseFloat(v.adjustedValue) : null,
                        changePercent: v.changePercent ? parseFloat(v.changePercent) : 0,
                        changeType: v.changeType || 'PERCENT',
                        impactArea: v.impactArea || null,
                        impactScore: v.impactScore ? parseFloat(v.impactScore) : 0,
                        notes: v.notes || null
                    }))
                } : undefined
            },
            include: { variables: true }
        });

        // حساب التأثير الكلي
        await recalculateImpact(scenario.id);

        const updatedScenario = await prisma.scenario.findUnique({
            where: { id: scenario.id },
            include: { variables: true }
        });

        res.status(201).json(updatedScenario);
    } catch (error) {
        console.error('POST /scenarios error:', error);
        res.status(500).json({ error: 'خطأ في إنشاء السيناريو' });
    }
});

// =============================================
// 4. PATCH /api/scenarios/:id — تحديث السيناريو
// =============================================
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const {
            name, nameEn, type, description, probability,
            impact, status, h1BudgetPct, h2BudgetPct, h3BudgetPct, notes
        } = req.body;

        const data = {};
        if (name !== undefined) data.name = name;
        if (nameEn !== undefined) data.nameEn = nameEn;
        if (type !== undefined) data.type = type;
        if (description !== undefined) data.description = description;
        if (probability !== undefined) data.probability = parseFloat(probability);
        if (impact !== undefined) data.impact = impact;
        if (status !== undefined) data.status = status;
        if (h1BudgetPct !== undefined) data.h1BudgetPct = parseFloat(h1BudgetPct);
        if (h2BudgetPct !== undefined) data.h2BudgetPct = parseFloat(h2BudgetPct);
        if (h3BudgetPct !== undefined) data.h3BudgetPct = parseFloat(h3BudgetPct);
        if (notes !== undefined) data.notes = notes;

        const scenario = await prisma.scenario.update({
            where: { id: req.params.id },
            data,
            include: { variables: true }
        });

        res.json(scenario);
    } catch (error) {
        console.error('PATCH /scenarios/:id error:', error);
        res.status(500).json({ error: 'خطأ في تحديث السيناريو' });
    }
});

// =============================================
// 5. DELETE /api/scenarios/:id — حذف سيناريو
// =============================================
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await prisma.scenario.delete({ where: { id: req.params.id } });
        res.json({ message: 'تم حذف السيناريو بنجاح' });
    } catch (error) {
        console.error('DELETE /scenarios/:id error:', error);
        res.status(500).json({ error: 'خطأ في حذف السيناريو' });
    }
});

// =============================================
// 6. POST /api/scenarios/:id/variables — إضافة متغير
// =============================================
router.post('/:id/variables', verifyToken, async (req, res) => {
    try {
        const { variableType, referenceId, referenceName, baselineValue, adjustedValue, changePercent, changeType, impactArea, notes } = req.body;

        const variable = await prisma.scenarioVariable.create({
            data: {
                scenarioId: req.params.id,
                variableType: variableType || 'CUSTOM',
                referenceId, referenceName,
                baselineValue: baselineValue ? parseFloat(baselineValue) : null,
                adjustedValue: adjustedValue ? parseFloat(adjustedValue) : null,
                changePercent: changePercent ? parseFloat(changePercent) : 0,
                changeType: changeType || 'PERCENT',
                impactArea, notes
            }
        });

        // إعادة حساب التأثير
        await recalculateImpact(req.params.id);

        res.status(201).json(variable);
    } catch (error) {
        console.error('POST /variables error:', error);
        res.status(500).json({ error: 'خطأ في إضافة المتغير' });
    }
});

// =============================================
// 7. PATCH /api/scenarios/variables/:varId — تحديث متغير
// =============================================
router.patch('/variables/:varId', verifyToken, async (req, res) => {
    try {
        const { baselineValue, adjustedValue, changePercent, changeType, impactArea, impactScore, notes } = req.body;
        const data = {};
        if (baselineValue !== undefined) data.baselineValue = parseFloat(baselineValue);
        if (adjustedValue !== undefined) data.adjustedValue = parseFloat(adjustedValue);
        if (changePercent !== undefined) data.changePercent = parseFloat(changePercent);
        if (changeType !== undefined) data.changeType = changeType;
        if (impactArea !== undefined) data.impactArea = impactArea;
        if (impactScore !== undefined) data.impactScore = parseFloat(impactScore);
        if (notes !== undefined) data.notes = notes;

        const variable = await prisma.scenarioVariable.update({
            where: { id: req.params.varId },
            data
        });

        // إعادة حساب التأثير
        await recalculateImpact(variable.scenarioId);

        res.json(variable);
    } catch (error) {
        console.error('PATCH /variables error:', error);
        res.status(500).json({ error: 'خطأ في تحديث المتغير' });
    }
});

// =============================================
// 8. DELETE /api/scenarios/variables/:varId — حذف متغير
// =============================================
router.delete('/variables/:varId', verifyToken, async (req, res) => {
    try {
        const variable = await prisma.scenarioVariable.findUnique({ where: { id: req.params.varId } });
        if (!variable) return res.status(404).json({ error: 'المتغير غير موجود' });

        await prisma.scenarioVariable.delete({ where: { id: req.params.varId } });
        await recalculateImpact(variable.scenarioId);

        res.json({ message: 'تم حذف المتغير' });
    } catch (error) {
        console.error('DELETE /variables error:', error);
        res.status(500).json({ error: 'خطأ في حذف المتغير' });
    }
});

// =============================================
// 9. POST /api/scenarios/:id/simulate — محاكاة سيناريو
// =============================================
router.post('/:id/simulate', verifyToken, async (req, res) => {
    try {
        const scenario = await prisma.scenario.findUnique({
            where: { id: req.params.id },
            include: {
                variables: true,
                version: {
                    include: {
                        kpis: { include: { objective: true } },
                        initiatives: true
                    }
                }
            }
        });

        if (!scenario) return res.status(404).json({ error: 'السيناريو غير موجود' });

        // محاكاة التأثير على KPIs
        const simulatedKPIs = scenario.version.kpis.map(kpi => {
            const variable = scenario.variables.find(v =>
                v.variableType === 'KPI' && v.referenceId === kpi.id
            );

            let adjustedTarget = kpi.target || 0;
            if (variable) {
                if (variable.changeType === 'PERCENT') {
                    adjustedTarget = adjustedTarget * (1 + (variable.changePercent || 0) / 100);
                } else {
                    adjustedTarget = (variable.adjustedValue != null) ? variable.adjustedValue : adjustedTarget;
                }
            }

            const gap = adjustedTarget - (kpi.actual || 0);
            const achievement = adjustedTarget > 0 ? ((kpi.actual || 0) / adjustedTarget) * 100 : 0;

            return {
                id: kpi.id,
                name: kpi.nameAr || kpi.name,
                originalTarget: kpi.target,
                adjustedTarget: Math.round(adjustedTarget * 100) / 100,
                actual: kpi.actual || 0,
                unit: kpi.unit,
                gap: Math.round(gap * 100) / 100,
                achievement: Math.round(achievement * 10) / 10,
                objectiveName: kpi.objective?.nameAr || kpi.objective?.name,
                changePercent: variable?.changePercent || 0
            };
        });

        // محاكاة التأثير على المبادرات
        const simulatedInitiatives = scenario.version.initiatives.map(init => {
            const variable = scenario.variables.find(v =>
                v.variableType === 'INITIATIVE' && v.referenceId === init.id
            );

            let adjustedBudget = init.budget || 0;
            if (variable) {
                if (variable.changeType === 'PERCENT') {
                    adjustedBudget = adjustedBudget * (1 + (variable.changePercent || 0) / 100);
                } else {
                    adjustedBudget = (variable.adjustedValue != null) ? variable.adjustedValue : adjustedBudget;
                }
            }

            return {
                id: init.id,
                title: init.title,
                originalBudget: init.budget || 0,
                adjustedBudget: Math.round(adjustedBudget),
                progress: init.progress || 0,
                status: init.status,
                budgetChange: variable?.changePercent || 0
            };
        });

        // ملخص التأثير
        const totalOriginalBudget = simulatedInitiatives.reduce((s, i) => s + i.originalBudget, 0);
        const totalAdjustedBudget = simulatedInitiatives.reduce((s, i) => s + i.adjustedBudget, 0);
        const avgAchievement = simulatedKPIs.length > 0
            ? simulatedKPIs.reduce((s, k) => s + k.achievement, 0) / simulatedKPIs.length
            : 0;

        // توزيع ميزانية الآفاق
        const horizonBudgets = {
            H1: { pct: scenario.h1BudgetPct || 70, amount: totalAdjustedBudget * ((scenario.h1BudgetPct || 70) / 100) },
            H2: { pct: scenario.h2BudgetPct || 20, amount: totalAdjustedBudget * ((scenario.h2BudgetPct || 20) / 100) },
            H3: { pct: scenario.h3BudgetPct || 10, amount: totalAdjustedBudget * ((scenario.h3BudgetPct || 10) / 100) }
        };

        res.json({
            scenario: {
                id: scenario.id,
                name: scenario.name,
                type: scenario.type,
                probability: scenario.probability
            },
            simulation: {
                kpis: simulatedKPIs,
                initiatives: simulatedInitiatives,
                horizonBudgets,
                summary: {
                    totalOriginalBudget,
                    totalAdjustedBudget,
                    budgetDiff: totalAdjustedBudget - totalOriginalBudget,
                    budgetDiffPct: totalOriginalBudget > 0 ? ((totalAdjustedBudget - totalOriginalBudget) / totalOriginalBudget * 100).toFixed(1) : 0,
                    avgAchievement: Math.round(avgAchievement * 10) / 10,
                    kpiCount: simulatedKPIs.length,
                    initiativeCount: simulatedInitiatives.length,
                    variablesCount: scenario.variables.length
                }
            }
        });
    } catch (error) {
        console.error('POST /simulate error:', error);
        res.status(500).json({ error: 'خطأ في المحاكاة' });
    }
});

// =============================================
// 10. GET /api/scenarios/:id/compare — مقارنة سيناريوهات
// =============================================
router.get('/compare/:versionId', verifyToken, async (req, res) => {
    try {
        const scenarios = await prisma.scenario.findMany({
            where: { versionId: req.params.versionId, status: { not: 'ARCHIVED' } },
            include: { variables: true },
            orderBy: { createdAt: 'asc' }
        });

        if (!scenarios.length) return res.json({ scenarios: [], comparison: null });

        // Fetch KPIs and Initiatives for comparison
        const version = await prisma.strategyVersion.findUnique({
            where: { id: req.params.versionId },
            include: { kpis: true, initiatives: true }
        });

        const comparison = scenarios.map(sc => {
            const budgetChanges = sc.variables
                .filter(v => v.variableType === 'INITIATIVE' || v.variableType === 'BUDGET')
                .reduce((sum, v) => sum + (v.changePercent || 0), 0);

            const kpiChanges = sc.variables
                .filter(v => v.variableType === 'KPI')
                .reduce((sum, v) => sum + (v.changePercent || 0), 0);

            return {
                id: sc.id,
                name: sc.name,
                type: sc.type,
                probability: sc.probability,
                variablesCount: sc.variables.length,
                avgBudgetChange: sc.variables.filter(v => v.variableType === 'BUDGET').length > 0
                    ? budgetChanges / sc.variables.filter(v => v.variableType === 'BUDGET').length : 0,
                avgKpiChange: sc.variables.filter(v => v.variableType === 'KPI').length > 0
                    ? kpiChanges / sc.variables.filter(v => v.variableType === 'KPI').length : 0,
                horizonSplit: `${sc.h1BudgetPct}/${sc.h2BudgetPct}/${sc.h3BudgetPct}`,
                overallImpact: sc.overallImpactScore
            };
        });

        res.json({ scenarios: comparison });
    } catch (error) {
        console.error('GET /compare error:', error);
        res.status(500).json({ error: 'خطأ في المقارنة' });
    }
});

// =============================================
// Helper: حساب التأثير الكلي
// =============================================
async function recalculateImpact(scenarioId) {
    try {
        const variables = await prisma.scenarioVariable.findMany({
            where: { scenarioId }
        });

        if (!variables.length) {
            await prisma.scenario.update({
                where: { id: scenarioId },
                data: { overallImpactScore: 0, totalBudgetChange: 0, totalRevenueChange: 0 }
            });
            return;
        }

        const budgetVars = variables.filter(v => ['BUDGET', 'INITIATIVE'].includes(v.variableType));
        const revenueVars = variables.filter(v => v.variableType === 'REVENUE');
        const allScores = variables.filter(v => v.impactScore > 0);

        const avgBudgetChange = budgetVars.length > 0
            ? budgetVars.reduce((s, v) => s + (v.changePercent || 0), 0) / budgetVars.length : 0;
        const avgRevenueChange = revenueVars.length > 0
            ? revenueVars.reduce((s, v) => s + (v.changePercent || 0), 0) / revenueVars.length : 0;
        const overallImpact = allScores.length > 0
            ? allScores.reduce((s, v) => s + v.impactScore, 0) / allScores.length : 0;

        await prisma.scenario.update({
            where: { id: scenarioId },
            data: {
                totalBudgetChange: Math.round(avgBudgetChange * 10) / 10,
                totalRevenueChange: Math.round(avgRevenueChange * 10) / 10,
                overallImpactScore: Math.round(overallImpact * 10) / 10
            }
        });
    } catch (e) {
        console.error('recalculateImpact error:', e);
    }
}

module.exports = router;
