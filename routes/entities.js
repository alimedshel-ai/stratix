const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all entities
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, industryId, page = 1, limit = 10 } = req.query;

    let where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (industryId) {
      where.industryId = industryId;
    }

    const skip = (page - 1) * limit;

    const [entities, total] = await Promise.all([
      prisma.entity.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          industry: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: { users: true, strategyVersions: true },
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
        industry: true,
        users: {
          select: { id: true, name: true, email: true, role: true },
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

// Create entity
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, nameAr, code, type, description, industryId } = req.body;

    if (!name || !code || !industryId) {
      return res.status(400).json({ message: 'Name, code and industry are required' });
    }

    const entity = await prisma.entity.create({
      data: {
        name,
        nameAr,
        code,
        type,
        description,
        industryId,
      },
    });

    res.status(201).json({ message: 'Entity created successfully', entity });
  } catch (error) {
    res.status(500).json({ message: 'Error creating entity', error: error.message });
  }
});

// Update entity
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { name, nameAr, code, type, description } = req.body;

    const updatedEntity = await prisma.entity.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(nameAr && { nameAr }),
        ...(code && { code }),
        ...(type && { type }),
        ...(description && { description }),
      },
    });

    res.json({ message: 'Entity updated successfully', entity: updatedEntity });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Entity not found' });
    }
    res.status(500).json({ message: 'Error updating entity', error: error.message });
  }
});

// Delete entity
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if entity has users
    const usersCount = await prisma.user.count({
      where: { entityId: req.params.id },
    });

    if (usersCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete entity with users. Please reassign or delete users first.' 
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
