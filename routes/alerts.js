const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============ STRATEGIC ALERTS ============
// Alert types: KPI_WARNING, KPI_CRITICAL, REVIEW_OVERDUE, INITIATIVE_DELAYED,
//              VERSION_PENDING, RISK_HIGH, HEALTH_LOW

// Get all alerts (with filters)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { entityId, type, severity, isRead, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = { isDismissed: false };
        // Auto-filter by user's entity
        if (req.user.activeEntityId) {
            where.entityId = req.user.activeEntityId;
        } else if (entityId) {
            where.entityId = entityId;
        }
        if (type) where.type = type;
        if (severity) where.severity = severity;
        if (isRead !== undefined) where.isRead = isRead === 'true';

        const alerts = await prisma.strategicAlert.findMany({
            where,
            skip,
            take: parseInt(limit),
            orderBy: [{ createdAt: 'desc' }]
        });

        const total = await prisma.strategicAlert.count({ where });
        const unreadCount = await prisma.strategicAlert.count({
            where: { ...where, isRead: false, isDismissed: false }
        });

        res.json({
            alerts,
            total,
            unreadCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// Get unread count (lightweight endpoint for badge)
router.get('/unread-count', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.query;
        let where = { isRead: false, isDismissed: false };
        // Auto-filter by user's entity
        if (req.user.activeEntityId) {
            where.entityId = req.user.activeEntityId;
        } else if (entityId) {
            where.entityId = entityId;
        }

        const count = await prisma.strategicAlert.count({ where });
        res.json({ count });
    } catch (error) {
        console.error('Error counting unread alerts:', error);
        res.status(500).json({ error: 'Failed to count alerts' });
    }
});

// Get single alert
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const alert = await prisma.strategicAlert.findUnique({
            where: { id: req.params.id }
        });

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json(alert);
    } catch (error) {
        console.error('Error fetching alert:', error);
        res.status(500).json({ error: 'Failed to fetch alert' });
    }
});

// Create alert (used by system or manual)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { entityId, type, severity, title, message, referenceId, referenceType } = req.body;

        if (!entityId || !type || !title) {
            return res.status(400).json({ error: 'entityId, type, and title are required' });
        }

        const validTypes = ['KPI_WARNING', 'KPI_CRITICAL', 'REVIEW_OVERDUE', 'INITIATIVE_DELAYED', 'VERSION_PENDING', 'RISK_HIGH', 'HEALTH_LOW'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
        }

        const alert = await prisma.strategicAlert.create({
            data: {
                entityId,
                type,
                severity: severity || 'WARNING',
                title,
                message: message || null,
                referenceId: referenceId || null,
                referenceType: referenceType || null,
            }
        });

        res.status(201).json(alert);
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
});

// Mark alert as read
router.patch('/:id/read', verifyToken, async (req, res) => {
    try {
        const alert = await prisma.strategicAlert.findUnique({ where: { id: req.params.id } });
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        const updated = await prisma.strategicAlert.update({
            where: { id: req.params.id },
            data: { isRead: true }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error marking alert as read:', error);
        res.status(500).json({ error: 'Failed to mark alert as read' });
    }
});

// Mark all alerts as read for an entity
router.patch('/read-all/:entityId', verifyToken, async (req, res) => {
    try {
        const result = await prisma.strategicAlert.updateMany({
            where: { entityId: req.params.entityId, isRead: false },
            data: { isRead: true }
        });

        res.json({ message: `${result.count} alerts marked as read` });
    } catch (error) {
        console.error('Error marking all alerts as read:', error);
        res.status(500).json({ error: 'Failed to mark alerts as read' });
    }
});

// Dismiss alert
router.patch('/:id/dismiss', verifyToken, async (req, res) => {
    try {
        const alert = await prisma.strategicAlert.findUnique({ where: { id: req.params.id } });
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        const updated = await prisma.strategicAlert.update({
            where: { id: req.params.id },
            data: { isDismissed: true, isRead: true }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error dismissing alert:', error);
        res.status(500).json({ error: 'Failed to dismiss alert' });
    }
});

// Delete alert
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const alert = await prisma.strategicAlert.findUnique({ where: { id: req.params.id } });
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        await prisma.strategicAlert.delete({ where: { id: req.params.id } });
        res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
});

module.exports = router;
