const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check SUPER_ADMIN role
const checkSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Access denied. Only SUPER_ADMIN can manage companies.' });
  }
  next();
};

// Get all companies
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    let where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          nameAr: true,
          code: true,
          status: true,
          createdAt: true,
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    res.json({
      companies,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching companies', error: error.message });
  }
});

// Get single company
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ company });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching company', error: error.message });
  }
});

// Create company
router.post('/', verifyToken, checkSuperAdmin, async (req, res) => {
  try {
    const { name, nameAr, code, status = 'ACTIVE' } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }

    // Check if code already exists
    const existingCode = await prisma.company.findUnique({
      where: { code },
    });

    if (existingCode) {
      return res.status(400).json({ message: 'Company code already exists' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        nameAr,
        code,
        status,
      },
    });

    res.status(201).json({ message: 'Company created successfully', company });
  } catch (error) {
    res.status(500).json({ message: 'Error creating company', error: error.message });
  }
});

// Update company
router.patch('/:id', verifyToken, checkSuperAdmin, async (req, res) => {
  try {
    const { name, nameAr, code, status } = req.body;

    // Check if code is being changed and if new code already exists
    if (code) {
      const existingCompany = await prisma.company.findFirst({
        where: {
          code,
          NOT: { id: req.params.id },
        },
      });

      if (existingCompany) {
        return res.status(400).json({ message: 'Company code already exists' });
      }
    }

    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(nameAr && { nameAr }),
        ...(code && { code }),
        ...(status && { status }),
      },
    });

    res.json({ message: 'Company updated successfully', company });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.status(500).json({ message: 'Error updating company', error: error.message });
  }
});

// Delete company
router.delete('/:id', verifyToken, checkSuperAdmin, async (req, res) => {
  try {
    // Check if company has users
    const usersCount = await prisma.user.count({
      where: { companyId: req.params.id },
    });

    if (usersCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete company with users. Please reassign or delete users first.' 
      });
    }

    await prisma.company.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.status(500).json({ message: 'Error deleting company', error: error.message });
  }
});

module.exports = router;
