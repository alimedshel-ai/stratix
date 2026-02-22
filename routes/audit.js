const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============ AUDIT LOG ============
// Governance and audit trail

// Get all audit logs (with filters)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { entityId, userId, action, page = 1, limit = 50, from, to } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};
        if (entityId) where.entityId = entityId;
        if (userId) where.userId = userId;
        if (action) where.action = { contains: action };
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) where.createdAt.lte = new Date(to);
        }

        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                entity: { select: { id: true, legalName: true, displayName: true } },
                user: { select: { id: true, name: true, email: true } }
            },
            skip,
            take: parseInt(limit),
            orderBy: [{ createdAt: 'desc' }]
        });

        const total = await prisma.auditLog.count({ where });

        res.json({
            logs,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

// Get audit log summary/stats for an entity
router.get('/stats/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;

        const totalLogs = await prisma.auditLog.count({ where: { entityId } });

        // Get logs grouped by action (approximate — fetch recent and count)
        const recentLogs = await prisma.auditLog.findMany({
            where: { entityId },
            select: { action: true },
            take: 500,
            orderBy: { createdAt: 'desc' }
        });

        const actionCounts = {};
        recentLogs.forEach(log => {
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        });

        // Get last 10 logs
        const latestLogs = await prisma.auditLog.findMany({
            where: { entityId },
            include: {
                user: { select: { id: true, name: true, email: true } }
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            totalLogs,
            actionCounts,
            latestLogs
        });
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({ error: 'Failed to fetch audit stats' });
    }
});

// Get single audit log
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const log = await prisma.auditLog.findUnique({
            where: { id: req.params.id },
            include: {
                entity: { select: { id: true, legalName: true, displayName: true } },
                user: { select: { id: true, name: true, email: true } }
            }
        });

        if (!log) {
            return res.status(404).json({ error: 'Audit log not found' });
        }

        res.json(log);
    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});

// Create audit log (manual entry for governance)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { entityId, userId, action, details, oldData, newData } = req.body;

        if (!entityId || !userId || !action) {
            return res.status(400).json({ error: 'entityId, userId, and action are required' });
        }

        const log = await prisma.auditLog.create({
            data: {
                entityId,
                userId,
                action,
                details: details || null,
                oldData: oldData || null,
                newData: newData || null,
            },
            include: {
                entity: { select: { id: true, legalName: true } },
                user: { select: { id: true, name: true } }
            }
        });

        res.status(201).json(log);
    } catch (error) {
        console.error('Error creating audit log:', error);
        res.status(500).json({ error: 'Failed to create audit log' });
    }
});

// Delete audit log (admin only — careful!)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const log = await prisma.auditLog.findUnique({ where: { id: req.params.id } });
        if (!log) {
            return res.status(404).json({ error: 'Audit log not found' });
        }

        await prisma.auditLog.delete({ where: { id: req.params.id } });
        res.json({ message: 'Audit log deleted successfully' });
    } catch (error) {
        console.error('Error deleting audit log:', error);
        res.status(500).json({ error: 'Failed to delete audit log' });
    }
});

module.exports = router;
