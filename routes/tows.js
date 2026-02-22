const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// ============================================
// 🔄 TOWS MATRIX — مصفوفة التقاطع الاستراتيجي
// ============================================

const QUADRANT_INFO = {
    SO: { name: 'استراتيجيات هجومية', nameEn: 'Maxi-Maxi', desc: 'استخدم القوة لاستغلال الفرصة', color: '#22c55e' },
    ST: { name: 'استراتيجيات دفاعية', nameEn: 'Maxi-Mini', desc: 'استخدم القوة لمواجهة التهديد', color: '#3b82f6' },
    WO: { name: 'استراتيجيات علاجية', nameEn: 'Mini-Maxi', desc: 'عالج الضعف لاستغلال الفرصة', color: '#f59e0b' },
    WT: { name: 'استراتيجيات تجنبية', nameEn: 'Mini-Mini', desc: 'قلل الضعف وتجنب التهديد', color: '#ef4444' }
};

// GET /api/tows?assessmentId=xxx
// عرض مصفوفة TOWS كاملة
router.get('/', verifyToken, async (req, res) => {
    try {
        const { assessmentId } = req.query;
        if (!assessmentId) return res.status(400).json({ error: 'assessmentId مطلوب' });

        // Get all SWOT points
        const points = await prisma.analysisPoint.findMany({
            where: { assessmentId },
            orderBy: [{ type: 'asc' }, { createdAt: 'asc' }]
        });

        const strengths = points.filter(p => p.type === 'STRENGTH');
        const weaknesses = points.filter(p => p.type === 'WEAKNESS');
        const opportunities = points.filter(p => p.type === 'OPPORTUNITY');
        const threats = points.filter(p => p.type === 'THREAT');

        // Get existing strategies
        const strategies = await prisma.tOWSStrategy.findMany({
            where: { assessmentId },
            include: {
                internalPoint: { select: { id: true, code: true, title: true, type: true } },
                externalPoint: { select: { id: true, code: true, title: true, type: true } }
            },
            orderBy: [{ quadrant: 'asc' }, { priority: 'asc' }]
        });

        // Group strategies by quadrant
        const matrix = {
            SO: { ...QUADRANT_INFO.SO, strategies: strategies.filter(s => s.quadrant === 'SO') },
            ST: { ...QUADRANT_INFO.ST, strategies: strategies.filter(s => s.quadrant === 'ST') },
            WO: { ...QUADRANT_INFO.WO, strategies: strategies.filter(s => s.quadrant === 'WO') },
            WT: { ...QUADRANT_INFO.WT, strategies: strategies.filter(s => s.quadrant === 'WT') }
        };

        res.json({
            matrix,
            swotPoints: { strengths, weaknesses, opportunities, threats },
            stats: {
                totalStrategies: strategies.length,
                byQuadrant: {
                    SO: matrix.SO.strategies.length,
                    ST: matrix.ST.strategies.length,
                    WO: matrix.WO.strategies.length,
                    WT: matrix.WT.strategies.length
                },
                approved: strategies.filter(s => s.status === 'APPROVED').length,
                proposed: strategies.filter(s => s.status === 'PROPOSED').length,
                highPriority: strategies.filter(s => s.priority === 'HIGH').length
            }
        });
    } catch (error) {
        console.error('Error fetching TOWS matrix:', error);
        res.status(500).json({ error: 'Failed to fetch TOWS matrix' });
    }
});

// POST /api/tows
// إنشاء استراتيجية TOWS جديدة
router.post('/', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { assessmentId, internalPointId, externalPointId, strategy, priority, notes } = req.body;

        if (!assessmentId || !internalPointId || !externalPointId || !strategy) {
            return res.status(400).json({ error: 'assessmentId, internalPointId, externalPointId, strategy مطلوبة' });
        }

        // Determine quadrant automatically
        const internal = await prisma.analysisPoint.findUnique({
            where: { id: internalPointId },
            select: { type: true }
        });
        const external = await prisma.analysisPoint.findUnique({
            where: { id: externalPointId },
            select: { type: true }
        });

        if (!internal || !external) {
            return res.status(404).json({ error: 'نقاط التحليل غير موجودة' });
        }

        // Validate: internal must be S or W, external must be O or T
        if (!['STRENGTH', 'WEAKNESS'].includes(internal.type)) {
            return res.status(400).json({ error: 'النقطة الداخلية يجب أن تكون قوة أو ضعف' });
        }
        if (!['OPPORTUNITY', 'THREAT'].includes(external.type)) {
            return res.status(400).json({ error: 'النقطة الخارجية يجب أن تكون فرصة أو تهديد' });
        }

        const quadrantMap = {
            'STRENGTH_OPPORTUNITY': 'SO',
            'STRENGTH_THREAT': 'ST',
            'WEAKNESS_OPPORTUNITY': 'WO',
            'WEAKNESS_THREAT': 'WT'
        };
        const quadrant = quadrantMap[`${internal.type}_${external.type}`];

        const towsStrategy = await prisma.tOWSStrategy.create({
            data: {
                assessmentId,
                quadrant,
                internalPointId,
                externalPointId,
                strategy,
                priority: priority || 'MEDIUM',
                notes: notes || null
            },
            include: {
                internalPoint: { select: { id: true, code: true, title: true, type: true } },
                externalPoint: { select: { id: true, code: true, title: true, type: true } }
            }
        });

        res.status(201).json(towsStrategy);
    } catch (error) {
        console.error('Error creating TOWS strategy:', error);
        res.status(500).json({ error: 'Failed to create TOWS strategy' });
    }
});

// PUT /api/tows/:id
// تحديث استراتيجية TOWS
router.put('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { strategy, priority, status, notes, initiativeId } = req.body;

        const updated = await prisma.tOWSStrategy.update({
            where: { id: req.params.id },
            data: {
                ...(strategy && { strategy }),
                ...(priority && { priority }),
                ...(status && { status }),
                ...(notes !== undefined && { notes }),
                ...(initiativeId !== undefined && { initiativeId })
            },
            include: {
                internalPoint: { select: { id: true, code: true, title: true, type: true } },
                externalPoint: { select: { id: true, code: true, title: true, type: true } }
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating TOWS strategy:', error);
        res.status(500).json({ error: 'Failed to update TOWS strategy' });
    }
});

// DELETE /api/tows/:id
router.delete('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        await prisma.tOWSStrategy.delete({ where: { id: req.params.id } });
        res.json({ message: 'تم حذف الاستراتيجية' });
    } catch (error) {
        console.error('Error deleting TOWS strategy:', error);
        res.status(500).json({ error: 'Failed to delete TOWS strategy' });
    }
});

// POST /api/tows/auto-generate
// توليد تلقائي للاستراتيجيات بناءً على تقاطعات SWOT
router.post('/auto-generate', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { assessmentId } = req.body;
        if (!assessmentId) return res.status(400).json({ error: 'assessmentId مطلوب' });

        const points = await prisma.analysisPoint.findMany({
            where: { assessmentId },
            select: { id: true, type: true, code: true, title: true, impact: true }
        });

        const strengths = points.filter(p => p.type === 'STRENGTH');
        const weaknesses = points.filter(p => p.type === 'WEAKNESS');
        const opportunities = points.filter(p => p.type === 'OPPORTUNITY');
        const threats = points.filter(p => p.type === 'THREAT');

        // Get existing strategies to avoid duplicates
        const existing = await prisma.tOWSStrategy.findMany({
            where: { assessmentId },
            select: { internalPointId: true, externalPointId: true }
        });
        const existingSet = new Set(existing.map(e => `${e.internalPointId}-${e.externalPointId}`));

        const generated = [];

        // Strategy templates for auto-generation
        const templates = {
            SO: (s, o) => `استغلال "${s.title}" لتعظيم فرصة "${o.title}"`,
            ST: (s, t) => `استخدام "${s.title}" للتصدي لتهديد "${t.title}"`,
            WO: (w, o) => `معالجة "${w.title}" لاستغلال فرصة "${o.title}"`,
            WT: (w, t) => `تقليل أثر "${w.title}" وتجنب تهديد "${t.title}"`
        };

        // Generate strategies for HIGH impact combinations first
        const combos = [
            { internals: strengths, externals: opportunities, q: 'SO', template: templates.SO },
            { internals: strengths, externals: threats, q: 'ST', template: templates.ST },
            { internals: weaknesses, externals: opportunities, q: 'WO', template: templates.WO },
            { internals: weaknesses, externals: threats, q: 'WT', template: templates.WT }
        ];

        for (const { internals, externals, q, template } of combos) {
            for (const internal of internals) {
                for (const external of externals) {
                    const key = `${internal.id}-${external.id}`;
                    if (existingSet.has(key)) continue;

                    // Prioritize HIGH impact combinations
                    const bothHigh = internal.impact === 'HIGH' && external.impact === 'HIGH';
                    const anyHigh = internal.impact === 'HIGH' || external.impact === 'HIGH';
                    const priority = bothHigh ? 'HIGH' : anyHigh ? 'MEDIUM' : 'LOW';

                    const strategy = await prisma.tOWSStrategy.create({
                        data: {
                            assessmentId,
                            quadrant: q,
                            internalPointId: internal.id,
                            externalPointId: external.id,
                            strategy: template(internal, external),
                            priority
                        }
                    });
                    generated.push(strategy);
                    existingSet.add(key);
                }
            }
        }

        res.json({
            message: `تم توليد ${generated.length} استراتيجية TOWS تلقائياً`,
            generated: generated.length,
            byQuadrant: {
                SO: generated.filter(g => g.quadrant === 'SO').length,
                ST: generated.filter(g => g.quadrant === 'ST').length,
                WO: generated.filter(g => g.quadrant === 'WO').length,
                WT: generated.filter(g => g.quadrant === 'WT').length
            }
        });
    } catch (error) {
        console.error('Error auto-generating TOWS:', error);
        res.status(500).json({ error: 'Failed to auto-generate' });
    }
});

module.exports = router;
