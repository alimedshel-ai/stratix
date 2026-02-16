const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all industries
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

    const [industries, total] = await Promise.all([
      prisma.industry.findMany({
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
        entities: {
          select: { id: true, name: true, nameAr: true, code: true, type: true },
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
    const { name, nameAr, code, description, sectorId } = req.body;

    if (!name || !code || !sectorId) {
      return res.status(400).json({ message: 'Name, code and sector are required' });
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
        name,
        nameAr,
        code,
        description,
        sectorId,
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
    const { name, nameAr, code, description } = req.body;

    const updatedIndustry = await prisma.industry.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(nameAr && { nameAr }),
        ...(code && { code }),
        ...(description && { description }),
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
