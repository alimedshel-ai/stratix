const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all entity types
router.get('/', verifyToken, async (req, res) => {
    try {
        const { search, limit = 100 } = req.query;
        let where = {};
        if (search) {
            where.OR = [
                { nameEn: { contains: search } },
                { nameAr: { contains: search } },
                { code: { contains: search } },
            ];
        }

        const [entityTypes, total] = await Promise.all([
            prisma.entityType.findMany({
                where,
                take: parseInt(limit),
                include: { _count: { select: { entities: true } } },
                orderBy: { nameAr: 'asc' },
            }),
            prisma.entityType.count({ where }),
        ]);

        res.json({ entityTypes, total });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching entity types', error: error.message });
    }
});

// Create entity type
router.post('/', verifyToken, async (req, res) => {
    try {
        const { nameEn, nameAr, code } = req.body;
        if (!nameEn || !nameAr) {
            return res.status(400).json({ message: 'nameEn and nameAr are required' });
        }

        const finalCode = code || nameEn.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20);

        const existing = await prisma.entityType.findFirst({
            where: { OR: [{ code: finalCode }, { nameAr }] },
        });
        if (existing) {
            return res.status(400).json({ message: 'نوع الكيان موجود مسبقاً' });
        }

        const entityType = await prisma.entityType.create({
            data: { nameEn, nameAr, code: finalCode },
        });

        res.status(201).json({ message: 'Entity type created', entityType });
    } catch (error) {
        res.status(500).json({ message: 'Error creating entity type', error: error.message });
    }
});

// Update entity type
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { nameEn, nameAr, code } = req.body;

        const updated = await prisma.entityType.update({
            where: { id: req.params.id },
            data: {
                ...(nameEn && { nameEn }),
                ...(nameAr && { nameAr }),
                ...(code && { code }),
            },
        });

        res.json({ message: 'Entity type updated', entityType: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Not found' });
        res.status(500).json({ message: 'Error updating entity type', error: error.message });
    }
});

// Delete entity type
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const count = await prisma.entity.count({ where: { entityTypeId: req.params.id } });
        if (count > 0) {
            return res.status(400).json({ message: `لا يمكن حذف نوع مرتبط بـ ${count} كيان` });
        }
        await prisma.entityType.delete({ where: { id: req.params.id } });
        res.json({ message: 'Entity type deleted' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Not found' });
        res.status(500).json({ message: 'Error deleting entity type', error: error.message });
    }
});

module.exports = router;
