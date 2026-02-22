const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// ============ STRATEGIC DIRECTIONS ============
// Supports: VISION, MISSION, VALUES, ISSUES, LONG_TERM_GOALS

// Get all directions (with filters)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { versionId, type, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};
        // Auto-filter by user's entity
        if (req.user.activeEntityId) {
            where.version = { entityId: req.user.activeEntityId };
        }
        if (versionId) where.versionId = versionId;
        if (type) where.type = type;

        const directions = await prisma.strategicDirection.findMany({
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
            orderBy: [{ type: 'asc' }, { order: 'asc' }]
        });

        const total = await prisma.strategicDirection.count({ where });

        res.json({
            directions,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching directions:', error);
        res.status(500).json({ error: 'Failed to fetch directions' });
    }
});

// Get directions grouped by type for a specific version
router.get('/grouped/:versionId', verifyToken, async (req, res) => {
    try {
        const directions = await prisma.strategicDirection.findMany({
            where: { versionId: req.params.versionId },
            orderBy: [{ type: 'asc' }, { order: 'asc' }]
        });

        // Group by type
        const grouped = {
            VISION: directions.filter(d => d.type === 'VISION'),
            MISSION: directions.filter(d => d.type === 'MISSION'),
            VALUES: directions.filter(d => d.type === 'VALUES'),
            ISSUES: directions.filter(d => d.type === 'ISSUES'),
            LONG_TERM_GOALS: directions.filter(d => d.type === 'LONG_TERM_GOALS'),
        };

        res.json({ grouped, total: directions.length });
    } catch (error) {
        console.error('Error fetching grouped directions:', error);
        res.status(500).json({ error: 'Failed to fetch grouped directions' });
    }
});

// Get single direction
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const direction = await prisma.strategicDirection.findUnique({
            where: { id: req.params.id },
            include: {
                version: {
                    select: {
                        id: true,
                        versionNumber: true,
                        name: true,
                        entity: { select: { id: true, legalName: true, displayName: true } }
                    }
                }
            }
        });

        if (!direction) {
            return res.status(404).json({ error: 'Direction not found' });
        }

        res.json(direction);
    } catch (error) {
        console.error('Error fetching direction:', error);
        res.status(500).json({ error: 'Failed to fetch direction' });
    }
});

// Create direction
router.post('/', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { versionId, type, content, order } = req.body;

        if (!versionId || !type || !content) {
            return res.status(400).json({ error: 'versionId, type, and content are required' });
        }

        const validTypes = ['VISION', 'MISSION', 'VALUES', 'ISSUES', 'LONG_TERM_GOALS'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
        }

        const direction = await prisma.strategicDirection.create({
            data: {
                versionId,
                type,
                content,
                order: order || 0
            },
            include: {
                version: { select: { id: true, versionNumber: true, name: true } }
            }
        });

        res.status(201).json(direction);
    } catch (error) {
        console.error('Error creating direction:', error);
        res.status(500).json({ error: 'Failed to create direction' });
    }
});

// Update direction
router.patch('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { type, content, order } = req.body;

        const existing = await prisma.strategicDirection.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Direction not found' });
        }

        const updateData = {};
        if (type) {
            const validTypes = ['VISION', 'MISSION', 'VALUES', 'ISSUES', 'LONG_TERM_GOALS'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({ error: `Invalid type` });
            }
            updateData.type = type;
        }
        if (content !== undefined) updateData.content = content;
        if (order !== undefined) updateData.order = parseInt(order);

        const direction = await prisma.strategicDirection.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                version: { select: { id: true, versionNumber: true, name: true } }
            }
        });

        res.json(direction);
    } catch (error) {
        console.error('Error updating direction:', error);
        res.status(500).json({ error: 'Failed to update direction' });
    }
});

// Delete direction
router.delete('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const direction = await prisma.strategicDirection.findUnique({ where: { id: req.params.id } });
        if (!direction) {
            return res.status(404).json({ error: 'Direction not found' });
        }

        await prisma.strategicDirection.delete({ where: { id: req.params.id } });
        res.json({ message: 'Direction deleted successfully' });
    } catch (error) {
        console.error('Error deleting direction:', error);
        res.status(500).json({ error: 'Failed to delete direction' });
    }
});

module.exports = router;
