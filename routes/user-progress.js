const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET progress for an entity (uses latest active version if versionId not provided)
router.get('/entity/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;
        const { versionId } = req.query;

        // Find target version: use provided or pick latest active (isActive) or highest versionNumber
        let version = null;
        if (versionId) {
            version = await prisma.strategyVersion.findUnique({ where: { id: versionId } });
        } else {
            version = await prisma.strategyVersion.findFirst({
                where: { entityId },
                orderBy: [{ isActive: 'desc' }, { versionNumber: 'desc' }],
            });
        }

        if (!version) {
            return res.status(404).json({ error: 'No strategy version found for entity' });
        }

        // Load entity basic info
        const entity = await prisma.entity.findUnique({ where: { id: entityId } });
        if (!entity) return res.status(404).json({ error: 'Entity not found' });

        // Define stage -> tool category mapping (sensible defaults)
        const stages = [
            { id: 'FOUNDATION', nameAr: 'التأسيس', type: 'FOUNDATION' },
            { id: 'DIAGNOSIS', nameAr: 'التشخيص', categories: ['DIAGNOSIS'] },
            { id: 'PLANNING', nameAr: 'التخطيط', categories: ['CHOICE'] },
            { id: 'EXECUTION', nameAr: 'التنفيذ', categories: ['EXECUTION'] },
            { id: 'ADAPTATION', nameAr: 'المتابعة', categories: ['ADAPTATION'] }
        ];

        // Helper: compute foundation score from entity fields
        function foundationScore(ent) {
            const fields = ['displayName', 'industryId', 'sectorId', 'typeId', 'size', 'logoUrl'];
            const filled = fields.filter(f => ent[f] !== null && ent[f] !== undefined && ent[f] !== '').length;
            return Math.round((filled / fields.length) * 100);
        }

        // Preload tool definitions for categories used
        const categories = Array.from(new Set(stages.flatMap(s => s.categories || [])));
        let toolsByCategory = {};
        if (categories.length > 0) {
            const tools = await prisma.toolDefinition.findMany({ where: { category: { in: categories }, isActive: true } });
            tools.forEach(t => {
                toolsByCategory[t.code] = t;
            });
        }

        // Load all analyses for the version
        const analyses = await prisma.companyAnalysis.findMany({ where: { versionId: version.id } });
        const analysisMap = {};
        analyses.forEach(a => { analysisMap[a.toolCode] = a; });

        const results = [];
        for (const s of stages) {
            if (s.type === 'FOUNDATION') {
                const percent = foundationScore(entity);
                results.push({ id: s.id, nameAr: s.nameAr, percent, completed: percent >= 100 });
                continue;
            }

            const stageCategories = s.categories || [];
            // Find tool definitions belonging to these categories
            const tools = await prisma.toolDefinition.findMany({ where: { category: { in: stageCategories }, isActive: true } });
            if (!tools || tools.length === 0) {
                results.push({ id: s.id, nameAr: s.nameAr, percent: 0, completed: false });
                continue;
            }

            // For each tool compute progress (0 if no analysis)
            const perTool = tools.map(t => {
                const a = analysisMap[t.code];
                return a ? (a.progress || 0) : 0;
            });
            const avg = perTool.length > 0 ? Math.round(perTool.reduce((x, y) => x + y, 0) / perTool.length) : 0;
            results.push({ id: s.id, nameAr: s.nameAr, percent: avg, completed: avg >= 100 });
        }

        const overall = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.percent, 0) / results.length) : 0;

        // === Smart Locking Logic ===
        const unlockRules = [
            { id: 'FOUNDATION', locked: false, unlockAt: 0, unlockMsg: '' },
            { id: 'DIAGNOSIS', prevId: 'FOUNDATION', threshold: 60, unlockMsg: 'أكمل 60% من التأسيس أولاً' },
            { id: 'PLANNING', prevId: 'DIAGNOSIS', threshold: 50, unlockMsg: 'أكمل 50% من التشخيص أولاً' },
            { id: 'EXECUTION', prevId: 'PLANNING', threshold: 50, unlockMsg: 'أكمل 50% من التخطيط أولاً' },
            { id: 'ADAPTATION', prevId: 'EXECUTION', threshold: 20, unlockMsg: 'ابدأ التنفيذ أولاً (20% على الأقل)' },
        ];

        results.forEach(stage => {
            const rule = unlockRules.find(r => r.id === stage.id);
            if (!rule || !rule.prevId) {
                stage.locked = false;
                stage.unlockAt = 0;
                stage.unlockMsg = '';
                return;
            }
            const prevStage = results.find(r => r.id === rule.prevId);
            const prevPercent = prevStage ? prevStage.percent : 0;
            stage.locked = prevPercent < rule.threshold;
            stage.unlockAt = rule.threshold;
            stage.unlockMsg = stage.locked ? rule.unlockMsg : '';
        });

        res.json({ entityId, versionId: version.id, versionNumber: version.versionNumber, stages: results, overall });
    } catch (error) {
        console.error('Error computing user progress:', error);
        res.status(500).json({ error: 'Failed to compute progress' });
    }
});

// POST: Save pain & ambition for entity
router.post('/pain-ambition', verifyToken, async (req, res) => {
    try {
        const { entityId, pains, ambitions, painCustom, ambitionCustom, pattern } = req.body;
        if (!entityId) return res.status(400).json({ error: 'entityId required' });

        // Save to entity metadata
        const entity = await prisma.entity.findUnique({ where: { id: entityId } });
        if (!entity) return res.status(404).json({ error: 'Entity not found' });

        const metadata = entity.metadata ? (typeof entity.metadata === 'string' ? JSON.parse(entity.metadata) : entity.metadata) : {};
        metadata.painAmbition = { pains, ambitions, painCustom, ambitionCustom, pattern, updatedAt: new Date().toISOString() };

        await prisma.entity.update({
            where: { id: entityId },
            data: { metadata: JSON.stringify(metadata) }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving pain-ambition:', error);
        res.status(500).json({ error: 'Failed to save' });
    }
});

// GET: Retrieve pain & ambition for entity
router.get('/pain-ambition/:entityId', verifyToken, async (req, res) => {
    try {
        const entity = await prisma.entity.findUnique({ where: { id: req.params.entityId } });
        if (!entity) return res.status(404).json({ error: 'Entity not found' });

        const metadata = entity.metadata ? (typeof entity.metadata === 'string' ? JSON.parse(entity.metadata) : entity.metadata) : {};
        res.json(metadata.painAmbition || null);
    } catch (error) {
        console.error('Error getting pain-ambition:', error);
        res.status(500).json({ error: 'Failed to get' });
    }
});

module.exports = router;
