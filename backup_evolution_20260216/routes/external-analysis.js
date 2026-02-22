const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============ EXTERNAL ANALYSIS ============
// PESTEL: POLITICAL, ECONOMIC, SOCIAL, TECHNOLOGICAL, ENVIRONMENTAL, LEGAL
// Porter: PORTER_RIVALRY, PORTER_NEW_ENTRANTS, PORTER_SUBSTITUTES, PORTER_SUPPLIERS, PORTER_BUYERS

const PESTEL_TYPES = ['POLITICAL', 'ECONOMIC', 'SOCIAL', 'TECHNOLOGICAL', 'ENVIRONMENTAL', 'LEGAL'];
const PORTER_TYPES = ['PORTER_RIVALRY', 'PORTER_NEW_ENTRANTS', 'PORTER_SUBSTITUTES', 'PORTER_SUPPLIERS', 'PORTER_BUYERS'];
const ALL_TYPES = [...PESTEL_TYPES, ...PORTER_TYPES];

// Get all analyses (with filters)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { versionId, type, impact, framework, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};
        if (versionId) where.versionId = versionId;
        if (type) where.type = type;
        if (impact) where.impact = impact;
        if (framework === 'PESTEL') where.type = { in: PESTEL_TYPES };
        if (framework === 'PORTER') where.type = { in: PORTER_TYPES };

        const analyses = await prisma.externalAnalysis.findMany({
            where,
            include: {
                version: {
                    select: {
                        id: true,
                        versionNumber: true,
                        name: true,
                        entity: { select: { id: true, legalName: true, displayName: true } }
                    }
                }
            },
            skip,
            take: parseInt(limit),
            orderBy: [{ type: 'asc' }, { createdAt: 'desc' }]
        });

        const total = await prisma.externalAnalysis.count({ where });

        res.json({
            analyses,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching external analyses:', error);
        res.status(500).json({ error: 'Failed to fetch analyses' });
    }
});

// Get analyses grouped by framework for a version
router.get('/grouped/:versionId', verifyToken, async (req, res) => {
    try {
        const analyses = await prisma.externalAnalysis.findMany({
            where: { versionId: req.params.versionId },
            orderBy: [{ type: 'asc' }, { createdAt: 'desc' }]
        });

        const pestel = {};
        const porter = {};

        analyses.forEach(a => {
            if (PESTEL_TYPES.includes(a.type)) {
                if (!pestel[a.type]) pestel[a.type] = [];
                pestel[a.type].push(a);
            } else if (PORTER_TYPES.includes(a.type)) {
                if (!porter[a.type]) porter[a.type] = [];
                porter[a.type].push(a);
            }
        });

        res.json({
            pestel,
            porter,
            total: analyses.length,
            pestelCount: analyses.filter(a => PESTEL_TYPES.includes(a.type)).length,
            porterCount: analyses.filter(a => PORTER_TYPES.includes(a.type)).length,
        });
    } catch (error) {
        console.error('Error fetching grouped analyses:', error);
        res.status(500).json({ error: 'Failed to fetch grouped analyses' });
    }
});

// Get single analysis
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const analysis = await prisma.externalAnalysis.findUnique({
            where: { id: req.params.id },
            include: {
                version: {
                    select: {
                        id: true, versionNumber: true, name: true,
                        entity: { select: { id: true, legalName: true, displayName: true } }
                    }
                }
            }
        });

        if (!analysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        res.json(analysis);
    } catch (error) {
        console.error('Error fetching analysis:', error);
        res.status(500).json({ error: 'Failed to fetch analysis' });
    }
});

// Create analysis
router.post('/', verifyToken, async (req, res) => {
    try {
        const { versionId, type, factor, impact, probability, trend, notes } = req.body;

        if (!versionId || !type || !factor) {
            return res.status(400).json({ error: 'versionId, type, and factor are required' });
        }

        if (!ALL_TYPES.includes(type)) {
            return res.status(400).json({ error: `Invalid type. Must be one of: ${ALL_TYPES.join(', ')}` });
        }

        const analysis = await prisma.externalAnalysis.create({
            data: {
                versionId,
                type,
                factor,
                impact: impact || 'MEDIUM',
                probability: probability ? parseFloat(probability) : null,
                trend: trend || null,
                notes: notes || null,
            },
            include: {
                version: { select: { id: true, versionNumber: true, name: true } }
            }
        });

        res.status(201).json(analysis);
    } catch (error) {
        console.error('Error creating analysis:', error);
        res.status(500).json({ error: 'Failed to create analysis' });
    }
});

// Update analysis
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { type, factor, impact, probability, trend, notes } = req.body;

        const existing = await prisma.externalAnalysis.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        const updateData = {};
        if (type) {
            if (!ALL_TYPES.includes(type)) {
                return res.status(400).json({ error: 'Invalid type' });
            }
            updateData.type = type;
        }
        if (factor !== undefined) updateData.factor = factor;
        if (impact) updateData.impact = impact;
        if (probability !== undefined) updateData.probability = probability ? parseFloat(probability) : null;
        if (trend !== undefined) updateData.trend = trend || null;
        if (notes !== undefined) updateData.notes = notes || null;

        const analysis = await prisma.externalAnalysis.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                version: { select: { id: true, versionNumber: true, name: true } }
            }
        });

        res.json(analysis);
    } catch (error) {
        console.error('Error updating analysis:', error);
        res.status(500).json({ error: 'Failed to update analysis' });
    }
});

// Delete analysis
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const analysis = await prisma.externalAnalysis.findUnique({ where: { id: req.params.id } });
        if (!analysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        await prisma.externalAnalysis.delete({ where: { id: req.params.id } });
        res.json({ message: 'Analysis deleted successfully' });
    } catch (error) {
        console.error('Error deleting analysis:', error);
        res.status(500).json({ error: 'Failed to delete analysis' });
    }
});

module.exports = router;
