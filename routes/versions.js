const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// Get all strategy versions with pagination
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, entityId, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        // Auto-filter by user's entity for non-admin users
        if (req.user.activeEntityId) {
            where.entityId = req.user.activeEntityId;
        } else if (entityId) {
            where.entityId = entityId;
        }

        if (status) {
            where.status = status;
        }

        const versions = await prisma.strategyVersion.findMany({
            where,
            include: {
                entity: { select: { id: true, legalName: true, displayName: true, company: { select: { id: true, nameAr: true, nameEn: true } } } },
                _count: {
                    select: {
                        directions: true,
                        externalAnalyses: true,
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
                entity: { select: { id: true, legalName: true, displayName: true, company: { select: { id: true, nameAr: true, nameEn: true } } } },
                directions: { orderBy: { order: 'asc' } },
                externalAnalyses: true,
                objectives: { include: { kpis: true, children: true } },
                kpis: true,
                initiatives: true,
                reviews: { orderBy: { reviewDate: 'desc' } },
                choices: { include: { risks: true } },
                risks: true,
                prevVersion: { select: { id: true, versionNumber: true, name: true } },
                nextVersions: { select: { id: true, versionNumber: true, name: true } }
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
router.post('/', verifyToken, checkPermission('ADMIN'), async (req, res) => {
    try {
        const { entityId, status, pivotedFromId, name, description, isActive, createdBy, approvedBy } = req.body;

        if (!entityId) {
            return res.status(400).json({ error: 'entityId is required' });
        }

        // Get next version number for entity
        const lastVersion = await prisma.strategyVersion.findFirst({
            where: { entityId },
            orderBy: { versionNumber: 'desc' }
        });

        const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

        // If activating this version, deactivate others
        if (isActive || status === 'ACTIVE') {
            await prisma.strategyVersion.updateMany({
                where: { entityId, isActive: true },
                data: { isActive: false }
            });
        }

        const version = await prisma.strategyVersion.create({
            data: {
                entityId,
                versionNumber,
                status: status || 'DRAFT',
                pivotedFromId: pivotedFromId || null,
                name: name || `الإصدار ${versionNumber}`,
                description: description || null,
                isActive: isActive || status === 'ACTIVE' || false,
                createdBy: createdBy || null,
                approvedBy: approvedBy || null,
                approvedAt: approvedBy ? new Date() : null,
                activatedAt: (isActive || status === 'ACTIVE') ? new Date() : null,
            },
            include: {
                entity: { select: { id: true, legalName: true, displayName: true, company: { select: { id: true, nameAr: true, nameEn: true } } } },
                _count: { select: { directions: true, objectives: true, kpis: true, initiatives: true } }
            }
        });

        res.status(201).json(version);
    } catch (error) {
        console.error('Error creating version:', error);
        res.status(500).json({ error: 'Failed to create version' });
    }
});

// Update version (including activate)
router.patch('/:id', verifyToken, checkPermission('ADMIN'), async (req, res) => {
    try {
        const { status, name, description, isActive, approvedBy } = req.body;

        const existing = await prisma.strategyVersion.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Version not found' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (approvedBy !== undefined) {
            updateData.approvedBy = approvedBy;
            updateData.approvedAt = approvedBy ? new Date() : null;
        }

        if (status) {
            updateData.status = status;
            if (status === 'ACTIVE' && !existing.activatedAt) {
                updateData.activatedAt = new Date();
                updateData.isActive = true;
                // Deactivate other versions for same entity
                await prisma.strategyVersion.updateMany({
                    where: { entityId: existing.entityId, id: { not: existing.id } },
                    data: { status: 'ARCHIVED', isActive: false }
                });
            }
        }

        if (isActive !== undefined) {
            updateData.isActive = isActive;
            if (isActive) {
                // Deactivate other versions
                await prisma.strategyVersion.updateMany({
                    where: { entityId: existing.entityId, id: { not: existing.id } },
                    data: { isActive: false }
                });
            }
        }

        const version = await prisma.strategyVersion.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                entity: { select: { id: true, legalName: true, displayName: true, company: { select: { id: true, nameAr: true, nameEn: true } } } },
                _count: { select: { directions: true, objectives: true, kpis: true, initiatives: true, reviews: true } }
            }
        });

        res.json(version);
    } catch (error) {
        console.error('Error updating version:', error);
        res.status(500).json({ error: 'Failed to update version' });
    }
});

// Delete version
router.delete('/:id', verifyToken, checkPermission('ADMIN'), async (req, res) => {
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
