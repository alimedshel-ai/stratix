// routes/scenarios.js
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ═══════════════════════════════════════════════
// ===== Scenario Model CRUD (simulation-lab) ====
// ═══════════════════════════════════════════════

// GET /api/scenarios?versionId=xxx — جلب سيناريوهات الإصدار
router.get('/', verifyToken, async (req, res) => {
    try {
        const { versionId } = req.query;
        if (!versionId) return res.status(400).json({ error: 'versionId مطلوب' });

        const scenarios = await prisma.scenario.findMany({
            where: { versionId },
            include: { variables: true },
            orderBy: { createdAt: 'asc' }
        });
        res.json({ scenarios });
    } catch (error) {
        console.error('Error fetching scenarios:', error);
        res.status(500).json({ error: 'فشل في جلب السيناريوهات' });
    }
});

// POST /api/scenarios — إنشاء سيناريو جديد
router.post('/', verifyToken, async (req, res) => {
    try {
        const { versionId, name, type, probability, description, h1BudgetPct, h2BudgetPct, h3BudgetPct } = req.body;
        if (!versionId || !name) return res.status(400).json({ error: 'الاسم والإصدار مطلوبان' });

        const scenario = await prisma.scenario.create({
            data: {
                versionId,
                name,
                type: type || 'CUSTOM',
                probability: probability || 50,
                description: description || null,
                h1BudgetPct: h1BudgetPct ?? 70,
                h2BudgetPct: h2BudgetPct ?? 20,
                h3BudgetPct: h3BudgetPct ?? 10,
                createdBy: req.user?.id || null
            },
            include: { variables: true }
        });
        res.json(scenario);
    } catch (error) {
        console.error('Error creating scenario:', error);
        res.status(500).json({ error: 'فشل في إنشاء السيناريو' });
    }
});

// GET /api/scenarios/:id — جلب سيناريو واحد
router.get('/:id', verifyToken, async (req, res) => {
    try {
        // Skip dept-style requests (handled below)
        if (req.params.id.length < 10) return deptGet(req, res);

        const scenario = await prisma.scenario.findUnique({
            where: { id: req.params.id },
            include: { variables: true }
        });
        if (!scenario) return res.status(404).json({ error: 'السيناريو غير موجود' });
        res.json(scenario);
    } catch (error) {
        console.error('Error fetching scenario:', error);
        res.status(500).json({ error: 'فشل في جلب السيناريو' });
    }
});

// PATCH /api/scenarios/:id — تحديث سيناريو
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { name, type, probability, description, h1BudgetPct, h2BudgetPct, h3BudgetPct, status } = req.body;
        const scenario = await prisma.scenario.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined && { name }),
                ...(type !== undefined && { type }),
                ...(probability !== undefined && { probability }),
                ...(description !== undefined && { description }),
                ...(h1BudgetPct !== undefined && { h1BudgetPct }),
                ...(h2BudgetPct !== undefined && { h2BudgetPct }),
                ...(h3BudgetPct !== undefined && { h3BudgetPct }),
                ...(status !== undefined && { status })
            },
            include: { variables: true }
        });
        res.json(scenario);
    } catch (error) {
        console.error('Error updating scenario:', error);
        res.status(500).json({ error: 'فشل في تحديث السيناريو' });
    }
});

// DELETE /api/scenarios/:id — حذف سيناريو
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await prisma.scenario.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting scenario:', error);
        res.status(500).json({ error: 'فشل في حذف السيناريو' });
    }
});

// ═══════════════════════════════════════════════
// ===== Scenario Variables =======================
// ═══════════════════════════════════════════════

// POST /api/scenarios/:id/variables — إضافة متغير
router.post('/:id/variables', verifyToken, async (req, res) => {
    try {
        const { variableType, referenceId, referenceName, baselineValue, changePercent, changeType, impactArea } = req.body;
        const variable = await prisma.scenarioVariable.create({
            data: {
                scenarioId: req.params.id,
                variableType: variableType || 'CUSTOM',
                referenceId: referenceId || null,
                referenceName: referenceName || null,
                baselineValue: baselineValue || null,
                changePercent: changePercent || 0,
                changeType: changeType || 'PERCENT',
                impactArea: impactArea || null
            }
        });
        res.json(variable);
    } catch (error) {
        console.error('Error creating variable:', error);
        res.status(500).json({ error: 'فشل في إضافة المتغير' });
    }
});

// PATCH /api/scenarios/variables/:varId — تحديث متغير
router.patch('/variables/:varId', verifyToken, async (req, res) => {
    try {
        const { changePercent, baselineValue, adjustedValue, notes, impactScore } = req.body;
        const variable = await prisma.scenarioVariable.update({
            where: { id: req.params.varId },
            data: {
                ...(changePercent !== undefined && { changePercent }),
                ...(baselineValue !== undefined && { baselineValue }),
                ...(adjustedValue !== undefined && { adjustedValue }),
                ...(notes !== undefined && { notes }),
                ...(impactScore !== undefined && { impactScore })
            }
        });
        res.json(variable);
    } catch (error) {
        console.error('Error updating variable:', error);
        res.status(500).json({ error: 'فشل في تحديث المتغير' });
    }
});

// DELETE /api/scenarios/variables/:varId — حذف متغير
router.delete('/variables/:varId', verifyToken, async (req, res) => {
    try {
        await prisma.scenarioVariable.delete({ where: { id: req.params.varId } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting variable:', error);
        res.status(500).json({ error: 'فشل في حذف المتغير' });
    }
});

// ═══════════════════════════════════════════════
// ===== Simulation Engine ========================
// ═══════════════════════════════════════════════

// POST /api/scenarios/:id/simulate — تشغيل المحاكاة
router.post('/:id/simulate', verifyToken, async (req, res) => {
    try {
        const scenario = await prisma.scenario.findUnique({
            where: { id: req.params.id },
            include: { variables: true }
        });
        if (!scenario) return res.status(404).json({ error: 'السيناريو غير موجود' });

        // Fetch KPIs and Initiatives from the version
        const [kpis, initiatives] = await Promise.all([
            prisma.initiativeKpi.findMany({
                where: { initiative: { versionId: scenario.versionId } },
                include: { initiative: { select: { title: true } } }
            }).catch(() => []),
            prisma.strategicInitiative.findMany({
                where: { versionId: scenario.versionId }
            }).catch(() => [])
        ]);

        // Apply variable adjustments to KPIs
        const simulatedKpis = kpis.map(kpi => {
            const variable = scenario.variables.find(v =>
                v.variableType === 'KPI' && v.referenceId === kpi.id
            );
            const changePct = variable ? (variable.changePercent || 0) : 0;
            const originalTarget = kpi.target || 0;
            const adjustedTarget = originalTarget * (1 + changePct / 100);
            return {
                id: kpi.id,
                name: kpi.nameAr || kpi.name || 'مؤشر',
                objectiveName: kpi.initiative?.title || '',
                originalTarget: Math.round(originalTarget * 100) / 100,
                adjustedTarget: Math.round(adjustedTarget * 100) / 100,
                unit: kpi.unit || '',
                changePct
            };
        });

        // Apply variable adjustments to Initiatives
        const simulatedInitiatives = initiatives.map(init => {
            const variable = scenario.variables.find(v =>
                v.variableType === 'INITIATIVE' && v.referenceId === init.id
            );
            const changePct = variable ? (variable.changePercent || 0) : 0;
            const originalBudget = init.budget || 0;
            const adjustedBudget = originalBudget * (1 + changePct / 100);
            return {
                id: init.id,
                title: init.title || 'مبادرة',
                originalBudget: Math.round(originalBudget),
                adjustedBudget: Math.round(adjustedBudget),
                changePct
            };
        });

        // Summary
        const totalOriginalBudget = simulatedInitiatives.reduce((s, i) => s + i.originalBudget, 0);
        const totalAdjustedBudget = simulatedInitiatives.reduce((s, i) => s + i.adjustedBudget, 0);
        const budgetDiffPct = totalOriginalBudget > 0
            ? Math.round((totalAdjustedBudget - totalOriginalBudget) / totalOriginalBudget * 100)
            : 0;
        const avgAchievement = simulatedKpis.length > 0
            ? Math.round(simulatedKpis.reduce((s, k) => s + (k.originalTarget > 0 ? (k.adjustedTarget / k.originalTarget * 100) : 100), 0) / simulatedKpis.length)
            : 0;

        res.json({
            scenario,
            simulation: {
                kpis: simulatedKpis,
                initiatives: simulatedInitiatives,
                summary: {
                    variablesCount: scenario.variables.length,
                    budgetDiffPct,
                    avgAchievement,
                    totalOriginalBudget,
                    totalAdjustedBudget
                }
            }
        });
    } catch (error) {
        console.error('Simulation error:', error);
        res.status(500).json({ error: 'فشل في تشغيل المحاكاة' });
    }
});

// ═══════════════════════════════════════════════
// ===== Dept-Based Scenarios (Wizard) ============
// ═══════════════════════════════════════════════

async function deptGet(req, res) {
    try {
        const dept = req.params.id;
        const entityId = req.user.entityId;

        const analysis = await prisma.departmentAnalysis.findFirst({
            where: {
                entityId,
                department: dept.toUpperCase(),
                type: 'SCENARIOS'
            }
        });

        if (!analysis) return res.json({ optimistic: '', realistic: '', pessimistic: '' });
        res.json(JSON.parse(analysis.data));
    } catch (error) {
        console.error('Error fetching dept scenarios:', error);
        res.status(500).json({ error: 'Failed to fetch scenarios' });
    }
}

// POST /api/scenarios/:dept — حفظ سيناريوهات القسم (Wizard)
router.post('/:dept', verifyToken, async (req, res) => {
    try {
        const { dept } = req.params;
        // Skip if it looks like a CUID (Scenario model ID)
        if (dept.length >= 10) return res.status(400).json({ error: 'Invalid dept code' });

        const data = req.body;
        const entityId = req.user.entityId;

        await prisma.departmentAnalysis.upsert({
            where: {
                entityId_department_type: {
                    entityId,
                    department: dept.toUpperCase(),
                    type: 'SCENARIOS'
                }
            },
            update: {
                data: JSON.stringify(data),
                updatedAt: new Date()
            },
            create: {
                entityId,
                department: dept.toUpperCase(),
                type: 'SCENARIOS',
                data: JSON.stringify(data)
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving dept scenarios:', error);
        res.status(500).json({ error: 'Failed to save scenarios' });
    }
});

module.exports = router;
