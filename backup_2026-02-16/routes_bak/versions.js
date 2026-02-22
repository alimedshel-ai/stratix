const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all strategy versions with pagination
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, entityId, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        if (entityId) {
            where.entityId = entityId;
        }

        if (status) {
            where.status = status;
        }

        const versions = await prisma.strategyVersion.findMany({
            where,
            include: {
                entity: { select: { id: true, legalName: true, displayName: true } },
                _count: {
                    select: {
                        objectives: true,
                        kpis: true,
                        initiatives: true,
                        reviews: true,
                        choices: true,
                        risks: true
                    }
                }
            },
            skip,
            take: parseInt(limit),
            orderBy: [{ versionNumber: 'desc' }]
        });

        const total = await prisma.strategyVersion.count({ where });

        res.json({
            versions,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching versions:', error);
        res.status(500).json({ error: 'Failed to fetch versions' });
    }
});

// Get single version
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const version = await prisma.strategyVersion.findUnique({
            where: { id: req.params.id },
            include: {
                entity: { select: { id: true, legalName: true, displayName: true } },
                objectives: true,
                kpis: true,
                initiatives: true,
                reviews: true,
                choices: { include: { risks: true } },
                risks: true,
                prevVersion: { select: { id: true, versionNumber: true } },
                nextVersions: { select: { id: true, versionNumber: true } }
            }
        });

        if (!version) {
            return res.status(404).json({ error: 'Version not found' });
        }

        res.json(version);
    } catch (error) {
        console.error('Error fetching version:', error);
        res.status(500).json({ error: 'Failed to fetch version' });
    }
});

// Create version
router.post('/', verifyToken, async (req, res) => {
    try {
        const { entityId, status, pivotedFromId } = req.body;

        if (!entityId) {
            return res.status(400).json({ error: 'entityId is required' });
        }

        // Get next version number for entity
        const lastVersion = await prisma.strategyVersion.findFirst({
            where: { entityId },
            orderBy: { versionNumber: 'desc' }
        });

        const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

        const version = await prisma.strategyVersion.create({
            data: {
                entityId,
                versionNumber,
                status: status || 'DRAFT',
                pivotedFromId: pivotedFromId || null
            },
            include: {
                entity: { select: { id: true, legalName: true, displayName: true } },
                _count: { select: { objectives: true, kpis: true, initiatives: true } }
            }
        });

        res.status(201).json(version);
    } catch (error) {
        console.error('Error creating version:', error);
        res.status(500).json({ error: 'Failed to create version' });
    }
});

// Update version (including activate)
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;

        const existing = await prisma.strategyVersion.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Version not found' });
        }

        const updateData = {};
        if (status) {
            updateData.status = status;
            if (status === 'ACTIVE' && !existing.activatedAt) {
                updateData.activatedAt = new Date();
                // Deactivate other versions for same entity
                await prisma.strategyVersion.updateMany({
                    where: { entityId: existing.entityId, id: { not: existing.id }, status: 'ACTIVE' },
                    data: { status: 'ARCHIVED' }
                });
            }
        }

        const version = await prisma.strategyVersion.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                entity: { select: { id: true, legalName: true, displayName: true } },
                _count: { select: { objectives: true, kpis: true, initiatives: true, reviews: true } }
            }
        });

        res.json(version);
    } catch (error) {
        console.error('Error updating version:', error);
        res.status(500).json({ error: 'Failed to update version' });
    }
});

// Delete version
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const version = await prisma.strategyVersion.findUnique({ where: { id: req.params.id } });
        if (!version) {
            return res.status(404).json({ error: 'Version not found' });
        }

        await prisma.strategyVersion.delete({ where: { id: req.params.id } });
        res.json({ message: 'Version deleted successfully' });
    } catch (error) {
        console.error('Error deleting version:', error);
        res.status(500).json({ error: 'Failed to delete version' });
    }
});

module.exports = router;
