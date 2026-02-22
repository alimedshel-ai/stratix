const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============================================
// 🔗 CAUSAL LINKS — الروابط السببية بين الأهداف
// ============================================

// GET /api/causal-links?versionId=xxx
// عرض جميع الروابط السببية لنسخة استراتيجية
router.get('/', verifyToken, async (req, res) => {
    try {
        const { versionId } = req.query;
        if (!versionId) return res.status(400).json({ error: 'versionId مطلوب' });

        const links = await prisma.causalLink.findMany({
            where: { versionId },
            include: {
                source: { select: { id: true, title: true, perspective: true, status: true } },
                target: { select: { id: true, title: true, perspective: true, status: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Group by perspective for Strategy Map
        const perspectives = ['LEARNING_GROWTH', 'INTERNAL_PROCESS', 'CUSTOMER', 'FINANCIAL'];
        const objectives = await prisma.strategicObjective.findMany({
            where: { versionId },
            select: { id: true, title: true, perspective: true, status: true, weight: true },
            orderBy: { perspective: 'asc' }
        });

        const strategyMap = {};
        for (const p of perspectives) {
            strategyMap[p] = objectives.filter(o => o.perspective === p);
        }

        res.json({
            links,
            strategyMap,
            stats: {
                totalLinks: links.length,
                validated: links.filter(l => l.validated).length,
                strong: links.filter(l => l.strength === 'STRONG').length,
                medium: links.filter(l => l.strength === 'MEDIUM').length,
                weak: links.filter(l => l.strength === 'WEAK').length
            }
        });
    } catch (error) {
        console.error('Error fetching causal links:', error);
        res.status(500).json({ error: 'Failed to fetch causal links' });
    }
});

// POST /api/causal-links
// إنشاء رابط سببي جديد
router.post('/', verifyToken, async (req, res) => {
    try {
        const { versionId, sourceId, targetId, linkType, strength, description, hypothesis } = req.body;

        if (!versionId || !sourceId || !targetId) {
            return res.status(400).json({ error: 'versionId, sourceId, targetId مطلوبة' });
        }

        if (sourceId === targetId) {
            return res.status(400).json({ error: 'لا يمكن ربط هدف بنفسه' });
        }

        // Check for existing link
        const existing = await prisma.causalLink.findUnique({
            where: { versionId_sourceId_targetId: { versionId, sourceId, targetId } }
        });
        if (existing) {
            return res.status(409).json({ error: 'هذا الرابط موجود بالفعل' });
        }

        // Detect circular dependency (simple check)
        const reverseExists = await prisma.causalLink.findUnique({
            where: { versionId_sourceId_targetId: { versionId, sourceId: targetId, targetId: sourceId } }
        });
        if (reverseExists) {
            return res.status(400).json({ error: 'ربط دائري: الهدف المستهدف يؤثر بالفعل على الهدف المصدر' });
        }

        const link = await prisma.causalLink.create({
            data: {
                versionId,
                sourceId,
                targetId,
                linkType: linkType || 'ENABLES',
                strength: strength || 'MEDIUM',
                description: description || null,
                hypothesis: hypothesis || null
            },
            include: {
                source: { select: { id: true, title: true, perspective: true } },
                target: { select: { id: true, title: true, perspective: true } }
            }
        });

        res.status(201).json(link);
    } catch (error) {
        console.error('Error creating causal link:', error);
        res.status(500).json({ error: 'Failed to create causal link' });
    }
});

// PUT /api/causal-links/:id
// تحديث رابط سببي
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { linkType, strength, description, hypothesis, validated } = req.body;

        const link = await prisma.causalLink.update({
            where: { id: req.params.id },
            data: {
                ...(linkType && { linkType }),
                ...(strength && { strength }),
                ...(description !== undefined && { description }),
                ...(hypothesis !== undefined && { hypothesis }),
                ...(validated !== undefined && { validated })
            },
            include: {
                source: { select: { id: true, title: true, perspective: true } },
                target: { select: { id: true, title: true, perspective: true } }
            }
        });

        res.json(link);
    } catch (error) {
        console.error('Error updating causal link:', error);
        res.status(500).json({ error: 'Failed to update causal link' });
    }
});

// DELETE /api/causal-links/:id
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await prisma.causalLink.delete({ where: { id: req.params.id } });
        res.json({ message: 'تم حذف الرابط السببي' });
    } catch (error) {
        console.error('Error deleting causal link:', error);
        res.status(500).json({ error: 'Failed to delete causal link' });
    }
});

// POST /api/causal-links/auto-suggest
// اقتراح تلقائي للروابط السببية بناءً على BSC
router.post('/auto-suggest', verifyToken, async (req, res) => {
    try {
        const { versionId } = req.body;
        if (!versionId) return res.status(400).json({ error: 'versionId مطلوب' });

        const objectives = await prisma.strategicObjective.findMany({
            where: { versionId },
            select: { id: true, title: true, perspective: true }
        });

        const existingLinks = await prisma.causalLink.findMany({
            where: { versionId },
            select: { sourceId: true, targetId: true }
        });
        const existingSet = new Set(existingLinks.map(l => `${l.sourceId}->${l.targetId}`));

        // BSC causal chain: Learning → Internal → Customer → Financial
        const bscFlow = {
            'LEARNING_GROWTH': 'INTERNAL_PROCESS',
            'INTERNAL_PROCESS': 'CUSTOMER',
            'CUSTOMER': 'FINANCIAL'
        };

        const suggestions = [];
        for (const source of objectives) {
            const targetPerspective = bscFlow[source.perspective];
            if (!targetPerspective) continue;

            const targets = objectives.filter(o => o.perspective === targetPerspective);
            for (const target of targets) {
                const key = `${source.id}->${target.id}`;
                if (!existingSet.has(key)) {
                    suggestions.push({
                        sourceId: source.id,
                        sourceTitle: source.title,
                        sourcePerspective: source.perspective,
                        targetId: target.id,
                        targetTitle: target.title,
                        targetPerspective: target.perspective,
                        suggestedType: 'ENABLES',
                        hypothesis: `تحسين "${source.title}" سيؤدي إلى تحسين "${target.title}"`,
                        confidence: source.perspective === 'LEARNING_GROWTH' ? 'HIGH' : 'MEDIUM'
                    });
                }
            }
        }

        res.json({
            suggestions,
            count: suggestions.length,
            message: `تم اقتراح ${suggestions.length} رابط سببي بناءً على هرمية BSC`
        });
    } catch (error) {
        console.error('Error auto-suggesting links:', error);
        res.status(500).json({ error: 'Failed to auto-suggest' });
    }
});

module.exports = router;
