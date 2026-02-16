const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all sectors
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    let where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
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
            select: { companies: true },
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
        companies: {
          select: { id: true, name: true, nameAr: true, code: true, status: true },
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
    const { name, nameAr, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
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
        name,
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
    const { name, nameAr, code } = req.body;

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
        ...(name && { name }),
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
    // Check if sector has companies
    const companiesCount = await prisma.company.count({
      where: { sectorId: req.params.id },
    });

    if (companiesCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete sector with companies. Please reassign or delete companies first.' 
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
