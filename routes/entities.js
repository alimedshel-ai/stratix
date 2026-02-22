const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { validateEntity } = require('../middleware/validation');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();


// Get all entities
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, industryId, sectorId, typeId, page = 1, limit = 10 } = req.query;

    let where = {};

    // Auto-filter by user's entity for non-admin users
    if (req.user.activeEntityId) {
      where.id = req.user.activeEntityId;
    }

    if (search) {
      where.OR = [
        { legalName: { contains: search } },
        { displayName: { contains: search } },
      ];
    }

    if (industryId) {
      where.industryId = industryId;
    }

    if (sectorId) {
      where.sectorId = sectorId;
    }

    if (typeId) {
      where.typeId = typeId;
    }

    const skip = (page - 1) * limit;

    const [entities, total] = await Promise.all([
      prisma.entity.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          company: {
            select: { id: true, nameAr: true, nameEn: true },
          },
          sector: {
            select: { id: true, nameEn: true, nameAr: true },
          },
          industry: {
            select: { id: true, nameEn: true, nameAr: true },
          },
          entityType: {
            select: { id: true, nameEn: true, nameAr: true },
          },
          _count: {
            select: { members: true, strategyVersions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.entity.count({ where }),
    ]);

    res.json({
      entities,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching entities', error: error.message });
  }
});

// Get single entity
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const entity = await prisma.entity.findUnique({
      where: { id: req.params.id },
      include: {
        sector: true,
        industry: true,
        entityType: true,
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        strategyVersions: true,
        assessments: true,
      },
    });

    if (!entity) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    res.json({ entity });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching entity', error: error.message });
  }
});

// Create entity (ADMIN only)
router.post('/', verifyToken, checkPermission('ADMIN'), validateEntity, async (req, res) => {
  try {
    const { legalName, displayName, sectorId, industryId, typeId, logoUrl, size, school } = req.body;

    if (!legalName) {
      return res.status(400).json({ message: 'legalName is required' });
    }

    const entity = await prisma.entity.create({
      data: {
        legalName,
        displayName,
        sectorId,
        industryId,
        typeId,
        logoUrl,
        size: size || null,
        school: school || null,
      },
      include: {
        sector: true,
        industry: true,
        entityType: true,
      },
    });

    res.status(201).json({ message: 'Entity created successfully', entity });
  } catch (error) {
    res.status(500).json({ message: 'Error creating entity', error: error.message });
  }
});

// Update entity (ADMIN only)
router.patch('/:id', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const { legalName, displayName, sectorId, industryId, typeId, logoUrl, isActive, size, school } = req.body;

    const updateData = {};
    if (legalName !== undefined) updateData.legalName = legalName;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (sectorId !== undefined) updateData.sectorId = sectorId;
    if (industryId !== undefined) updateData.industryId = industryId;
    if (typeId !== undefined) updateData.typeId = typeId;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (size !== undefined) updateData.size = size;
    if (school !== undefined) updateData.school = school;

    const entity = await prisma.entity.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        sector: true,
        industry: true,
        entityType: true,
      },
    });

    res.json({ message: 'Entity updated successfully', entity });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Entity not found' });
    }
    res.status(500).json({ message: 'Error updating entity', error: error.message });
  }
});

// Delete entity (ADMIN only)
router.delete('/:id', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    // Check if entity has members
    const membersCount = await prisma.member.count({
      where: { entityId: req.params.id },
    });

    if (membersCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete entity with members. Please remove members first.'
      });
    }

    await prisma.entity.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Entity deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Entity not found' });
    }
    res.status(500).json({ message: 'Error deleting entity', error: error.message });
  }
});

module.exports = router;
