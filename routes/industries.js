const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();


// Get all industries
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, sectorId, page = 1, limit = 10 } = req.query;

    let where = {};

    if (search) {
      where.OR = [
        { nameEn: { contains: search } },
        { nameAr: { contains: search } },
        { code: { contains: search } },
      ];
    }

    // فلترة بالقطاع
    if (sectorId) {
      where.sectors = { some: { id: sectorId } };
    }

    const skip = (page - 1) * limit;

    const [industries, total] = await Promise.all([
      prisma.industry.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          sectors: { select: { id: true, nameAr: true, nameEn: true, code: true } },
          _count: {
            select: { entities: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.industry.count({ where }),
    ]);

    res.json({
      industries,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching industries', error: error.message });
  }
});

// Get single industry
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const industry = await prisma.industry.findUnique({
      where: { id: req.params.id },
      include: {
        sectors: { select: { id: true, nameAr: true, nameEn: true, code: true } },
        entities: {
          select: { id: true, legalName: true, displayName: true },
        },
      },
    });

    if (!industry) {
      return res.status(404).json({ message: 'Industry not found' });
    }

    res.json({ industry });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching industry', error: error.message });
  }
});

// Create industry
router.post('/', verifyToken, async (req, res) => {
  try {
    const { nameEn, nameAr, code, sectorIds } = req.body;

    if (!nameEn || !nameAr || !code) {
      return res.status(400).json({ message: 'nameEn, nameAr and code are required' });
    }

    // Check if code already exists
    const existingCode = await prisma.industry.findFirst({
      where: { code },
    });

    if (existingCode) {
      return res.status(400).json({ message: 'Industry code already exists' });
    }

    const industry = await prisma.industry.create({
      data: {
        nameEn,
        nameAr,
        code,
        ...(sectorIds && sectorIds.length > 0 && {
          sectors: { connect: sectorIds.map(id => ({ id })) }
        }),
      },
      include: {
        sectors: { select: { id: true, nameAr: true, nameEn: true, code: true } },
      },
    });

    res.status(201).json({ message: 'Industry created successfully', industry });
  } catch (error) {
    res.status(500).json({ message: 'Error creating industry', error: error.message });
  }
});

// Update industry
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { nameEn, nameAr, code, sectorIds } = req.body;

    // Check if code is being changed and if new code already exists
    if (code) {
      const existingIndustry = await prisma.industry.findFirst({
        where: {
          code,
          NOT: { id: req.params.id },
        },
      });

      if (existingIndustry) {
        return res.status(400).json({ message: 'Industry code already exists' });
      }
    }

    const updatedIndustry = await prisma.industry.update({
      where: { id: req.params.id },
      data: {
        ...(nameEn && { nameEn }),
        ...(nameAr && { nameAr }),
        ...(code && { code }),
        ...(sectorIds && {
          sectors: { set: sectorIds.map(id => ({ id })) }
        }),
      },
      include: {
        sectors: { select: { id: true, nameAr: true, nameEn: true, code: true } },
      },
    });

    res.json({ message: 'Industry updated successfully', industry: updatedIndustry });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Industry not found' });
    }
    res.status(500).json({ message: 'Error updating industry', error: error.message });
  }
});

// Delete industry
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if industry has entities
    const entitiesCount = await prisma.entity.count({
      where: { industryId: req.params.id },
    });

    if (entitiesCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete industry with entities. Please reassign or delete entities first.'
      });
    }

    await prisma.industry.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Industry deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Industry not found' });
    }
    res.status(500).json({ message: 'Error deleting industry', error: error.message });
  }
});

module.exports = router;
