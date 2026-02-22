const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// ============ ANALYSIS POINTS (SWOT) ============

// Get all analysis points with filters
router.get('/points', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, type, assessmentId, impact } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        // Auto-filter by user's entity
        if (req.user.activeEntityId) {
            where.assessment = { entityId: req.user.activeEntityId };
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } }
            ];
        }

        if (type) where.type = type;
        if (assessmentId) where.assessmentId = assessmentId;
        if (impact) where.impact = impact;

        const points = await prisma.analysisPoint.findMany({
            where,
            include: {
                assessment: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        entity: {
                            select: { id: true, legalName: true, displayName: true }
                        }
                    }
                }
            },
            skip,
            take: parseInt(limit),
            orderBy: [{ createdAt: 'desc' }]
        });

        const total = await prisma.analysisPoint.count({ where });

        // Get summary counts by type
        const summary = await prisma.analysisPoint.groupBy({
            by: ['type'],
            where: assessmentId ? { assessmentId } : {},
            _count: { id: true }
        });

        res.json({
            points,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
            summary: summary.reduce((acc, s) => { acc[s.type] = s._count.id; return acc; }, {})
        });
    } catch (error) {
        console.error('Error fetching analysis points:', error);
        res.status(500).json({ error: 'Failed to fetch analysis points' });
    }
});

// Get single analysis point
router.get('/points/:id', verifyToken, async (req, res) => {
    try {
        const point = await prisma.analysisPoint.findUnique({
            where: { id: req.params.id },
            include: {
                assessment: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        entity: { select: { id: true, legalName: true } }
                    }
                }
            }
        });

        if (!point) return res.status(404).json({ error: 'Analysis point not found' });
        res.json(point);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch analysis point' });
    }
});

// Create analysis point (with auto-SWOT-coding)
router.post('/points', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { assessmentId, type, title, description, impact } = req.body;

        if (!assessmentId || !type || !title) {
            return res.status(400).json({ error: 'assessmentId, type, and title are required' });
        }

        const validTypes = ['STRENGTH', 'WEAKNESS', 'OPPORTUNITY', 'THREAT'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Type must be STRENGTH, WEAKNESS, OPPORTUNITY, or THREAT' });
        }

        // ✨ Auto-generate SWOT code (S1, S2, W1, W2, O1, T1...)
        const typePrefix = { STRENGTH: 'S', WEAKNESS: 'W', OPPORTUNITY: 'O', THREAT: 'T' };
        const prefix = typePrefix[type];
        const existingCount = await prisma.analysisPoint.count({
            where: { assessmentId, type }
        });
        const code = `${prefix}${existingCount + 1}`;

        const point = await prisma.analysisPoint.create({
            data: {
                assessmentId,
                type,
                code,
                title,
                description: description || null,
                impact: impact || 'MEDIUM'
            },
            include: {
                assessment: {
                    select: { id: true, title: true, entity: { select: { legalName: true } } }
                }
            }
        });

        res.status(201).json(point);
    } catch (error) {
        console.error('Error creating analysis point:', error);
        res.status(500).json({ error: 'Failed to create analysis point' });
    }
});

// Update analysis point
router.patch('/points/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { title, description, type, impact } = req.body;

        const existing = await prisma.analysisPoint.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Not found' });

        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (type) updateData.type = type;
        if (impact) updateData.impact = impact;

        const point = await prisma.analysisPoint.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                assessment: {
                    select: { id: true, title: true }
                }
            }
        });

        res.json(point);
    } catch (error) {
        console.error('Error updating analysis point:', error);
        res.status(500).json({ error: 'Failed to update analysis point' });
    }
});

// Delete analysis point
router.delete('/points/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const existing = await prisma.analysisPoint.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Not found' });

        await prisma.analysisPoint.delete({ where: { id: req.params.id } });
        res.json({ message: 'Analysis point deleted successfully' });
    } catch (error) {
        console.error('Error deleting analysis point:', error);
        res.status(500).json({ error: 'Failed to delete analysis point' });
    }
});

// ============ SWOT SUMMARY ============

// Get SWOT matrix for an assessment
router.get('/swot/:assessmentId', verifyToken, async (req, res) => {
    try {
        const points = await prisma.analysisPoint.findMany({
            where: { assessmentId: req.params.assessmentId },
            orderBy: [{ type: 'asc' }, { impact: 'desc' }, { createdAt: 'desc' }]
        });

        const swot = {
            STRENGTH: points.filter(p => p.type === 'STRENGTH'),
            WEAKNESS: points.filter(p => p.type === 'WEAKNESS'),
            OPPORTUNITY: points.filter(p => p.type === 'OPPORTUNITY'),
            THREAT: points.filter(p => p.type === 'THREAT')
        };

        res.json(swot);
    } catch (error) {
        console.error('Error fetching SWOT:', error);
        res.status(500).json({ error: 'Failed to fetch SWOT analysis' });
    }
});

// ============ BACKFILL SWOT CODES ============
// POST /api/analysis/backfill-codes
// Assigns S1, S2, W1, W2... to existing points without codes

router.post('/backfill-codes', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const typePrefix = { STRENGTH: 'S', WEAKNESS: 'W', OPPORTUNITY: 'O', THREAT: 'T' };
        const assessments = await prisma.assessment.findMany({ select: { id: true } });

        let updated = 0;
        for (const assessment of assessments) {
            for (const [type, prefix] of Object.entries(typePrefix)) {
                const points = await prisma.analysisPoint.findMany({
                    where: { assessmentId: assessment.id, type },
                    orderBy: { createdAt: 'asc' }
                });

                let counter = 1;
                for (const point of points) {
                    if (!point.code) {
                        await prisma.analysisPoint.update({
                            where: { id: point.id },
                            data: { code: `${prefix}${counter}` }
                        });
                        updated++;
                    }
                    counter++;
                }
            }
        }

        res.json({ message: `تم ترميز ${updated} نقطة تحليل`, updated });
    } catch (error) {
        console.error('Error backfilling codes:', error);
        res.status(500).json({ error: 'Failed to backfill codes' });
    }
});

module.exports = router;
