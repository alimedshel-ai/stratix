const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============ FINANCIAL DECISIONS ============

// Get all financial decisions
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, entityId, type, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { impact: { contains: search } }
            ];
        }

        if (entityId) where.entityId = entityId;
        if (type) where.type = type;
        if (status) where.status = status;

        const decisions = await prisma.financialDecision.findMany({
            where,
            include: {
                entity: {
                    select: { id: true, legalName: true, displayName: true }
                }
            },
            skip,
            take: parseInt(limit),
            orderBy: [{ createdAt: 'desc' }]
        });

        const total = await prisma.financialDecision.count({ where });

        // Summary stats
        const summaryAgg = await prisma.financialDecision.groupBy({
            by: ['status'],
            where: entityId ? { entityId } : {},
            _count: { id: true },
            _sum: { amount: true }
        });

        const totalAmount = await prisma.financialDecision.aggregate({
            where: entityId ? { entityId } : {},
            _sum: { amount: true }
        });

        res.json({
            decisions,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalAmount: totalAmount._sum.amount || 0,
            summary: summaryAgg.reduce((acc, s) => {
                acc[s.status] = { count: s._count.id, amount: s._sum.amount || 0 };
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('Error fetching financial decisions:', error);
        res.status(500).json({ error: 'Failed to fetch financial decisions' });
    }
});

// Get single decision
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const decision = await prisma.financialDecision.findUnique({
            where: { id: req.params.id },
            include: {
                entity: { select: { id: true, legalName: true, displayName: true } }
            }
        });

        if (!decision) return res.status(404).json({ error: 'Decision not found' });
        res.json(decision);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch decision' });
    }
});

// Create financial decision
router.post('/', verifyToken, async (req, res) => {
    try {
        const { entityId, title, description, amount, currency, type, status, impact, decisionDate } = req.body;

        if (!entityId || !title) {
            return res.status(400).json({ error: 'entityId and title are required' });
        }

        const decision = await prisma.financialDecision.create({
            data: {
                entityId,
                title,
                description: description || null,
                amount: amount ? parseFloat(amount) : null,
                currency: currency || 'SAR',
                type: type || 'INVESTMENT',
                status: status || 'PROPOSED',
                impact: impact || null,
                decisionDate: decisionDate ? new Date(decisionDate) : null
            },
            include: {
                entity: { select: { id: true, legalName: true } }
            }
        });

        res.status(201).json(decision);
    } catch (error) {
        console.error('Error creating financial decision:', error);
        res.status(500).json({ error: 'Failed to create financial decision' });
    }
});

// Update financial decision
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { title, description, amount, currency, type, status, impact, decisionDate } = req.body;

        const existing = await prisma.financialDecision.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Decision not found' });

        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (amount !== undefined) updateData.amount = amount ? parseFloat(amount) : null;
        if (currency) updateData.currency = currency;
        if (type) updateData.type = type;
        if (status) updateData.status = status;
        if (impact !== undefined) updateData.impact = impact;
        if (decisionDate !== undefined) updateData.decisionDate = decisionDate ? new Date(decisionDate) : null;

        const decision = await prisma.financialDecision.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                entity: { select: { id: true, legalName: true } }
            }
        });

        res.json(decision);
    } catch (error) {
        console.error('Error updating financial decision:', error);
        res.status(500).json({ error: 'Failed to update financial decision' });
    }
});

// Delete financial decision
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const existing = await prisma.financialDecision.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Decision not found' });

        await prisma.financialDecision.delete({ where: { id: req.params.id } });
        res.json({ message: 'Financial decision deleted successfully' });
    } catch (error) {
        console.error('Error deleting financial decision:', error);
        res.status(500).json({ error: 'Failed to delete financial decision' });
    }
});

module.exports = router;
