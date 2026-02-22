const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();


// Get all sectors
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    let where = {};

    if (search) {
      where.OR = [
        { nameEn: { contains: search } },
        { nameAr: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [sectors, total] = await Promise.all([
      prisma.sector.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: { entities: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sector.count({ where }),
    ]);

    res.json({
      sectors,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sectors', error: error.message });
  }
});

// Get single sector
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const sector = await prisma.sector.findUnique({
      where: { id: req.params.id },
      include: {
        entities: {
          select: { id: true, legalName: true, displayName: true },
        },
      },
    });

    if (!sector) {
      return res.status(404).json({ message: 'Sector not found' });
    }

    res.json({ sector });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sector', error: error.message });
  }
});

// Create sector
router.post('/', verifyToken, async (req, res) => {
  try {
    const { nameEn, nameAr, code } = req.body;

    if (!nameEn || !nameAr || !code) {
      return res.status(400).json({ message: 'nameEn, nameAr and code are required' });
    }

    // Check if code already exists
    const existingCode = await prisma.sector.findFirst({
      where: { code },
    });

    if (existingCode) {
      return res.status(400).json({ message: 'Sector code already exists' });
    }

    const sector = await prisma.sector.create({
      data: {
        nameEn,
        nameAr,
        code,
      },
    });

    res.status(201).json({ message: 'Sector created successfully', sector });
  } catch (error) {
    res.status(500).json({ message: 'Error creating sector', error: error.message });
  }
});

// Update sector
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { nameEn, nameAr, code } = req.body;

    // Check if code is being changed and if new code already exists
    if (code) {
      const existingSector = await prisma.sector.findFirst({
        where: {
          code,
          NOT: { id: req.params.id },
        },
      });

      if (existingSector) {
        return res.status(400).json({ message: 'Sector code already exists' });
      }
    }

    const updatedSector = await prisma.sector.update({
      where: { id: req.params.id },
      data: {
        ...(nameEn && { nameEn }),
        ...(nameAr && { nameAr }),
        ...(code && { code }),
      },
    });

    res.json({ message: 'Sector updated successfully', sector: updatedSector });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Sector not found' });
    }
    res.status(500).json({ message: 'Error updating sector', error: error.message });
  }
});

// Delete sector
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if sector has entities
    const entitiesCount = await prisma.entity.count({
      where: { sectorId: req.params.id },
    });

    if (entitiesCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete sector with entities. Please reassign or delete entities first.'
      });
    }

    await prisma.sector.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Sector deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Sector not found' });
    }
    res.status(500).json({ message: 'Error deleting sector', error: error.message });
  }
});

module.exports = router;
