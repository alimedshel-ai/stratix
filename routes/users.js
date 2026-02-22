const express = require('express');
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();


// Get all users with pagination and search
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, entityId, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    // Filter by entity membership
    if (entityId || role) {
      where.memberships = {
        some: {
          ...(entityId && { entityId }),
          ...(role && { role })
        }
      };
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        memberships: {
          include: {
            entity: {
              select: {
                id: true,
                legalName: true,
                displayName: true
              }
            }
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    // Remove password from results
    const safeUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    const total = await prisma.user.count({ where });

    res.json({
      users: safeUsers,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        memberships: {
          include: {
            entity: {
              include: {
                sector: {
                  select: {
                    id: true,
                    nameEn: true,
                    nameAr: true
                  }
                },
                industry: {
                  select: {
                    id: true,
                    nameEn: true,
                    nameAr: true
                  }
                },
                entityType: {
                  select: {
                    id: true,
                    nameEn: true,
                    nameAr: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't return password
    const { password, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user with membership (ADMIN only)
router.post('/', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const { email, password, name, entityId, role = 'VIEWER' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with optional membership
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        ...(entityId && {
          memberships: {
            create: {
              entityId,
              role
            }
          }
        })
      },
      include: {
        memberships: {
          include: {
            entity: {
              select: {
                id: true,
                legalName: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    // Don't return password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (ADMIN only)
router.patch('/:id', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        memberships: {
          include: {
            entity: {
              select: {
                id: true,
                legalName: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    // Don't return password
    const { password: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Add user to entity (create membership) (ADMIN only)
router.post('/:userId/memberships', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { entityId, role = 'VIEWER' } = req.body;

    if (!entityId) {
      return res.status(400).json({ error: 'entityId is required' });
    }

    // Check if membership already exists
    const existingMembership = await prisma.member.findUnique({
      where: {
        userId_entityId: {
          userId,
          entityId
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already a member of this entity' });
    }

    const membership = await prisma.member.create({
      data: {
        userId,
        entityId,
        role
      },
      include: {
        entity: {
          select: {
            id: true,
            legalName: true,
            displayName: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(membership);
  } catch (error) {
    console.error('Error creating membership:', error);
    res.status(500).json({ error: 'Failed to create membership' });
  }
});

// Update user membership role (ADMIN only)
router.patch('/:userId/memberships/:membershipId', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const { membershipId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'role is required' });
    }

    const membership = await prisma.member.update({
      where: { id: membershipId },
      data: { role },
      include: {
        entity: {
          select: {
            id: true,
            legalName: true,
            displayName: true
          }
        }
      }
    });

    res.json(membership);
  } catch (error) {
    console.error('Error updating membership:', error);
    res.status(500).json({ error: 'Failed to update membership' });
  }
});

// Remove user from entity (delete membership) (ADMIN only)
router.delete('/:userId/memberships/:membershipId', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    const { membershipId } = req.params;

    await prisma.member.delete({
      where: { id: membershipId }
    });

    res.json({ message: 'Membership removed successfully' });
  } catch (error) {
    console.error('Error deleting membership:', error);
    res.status(500).json({ error: 'Failed to delete membership' });
  }
});

// Delete user (ADMIN only)
router.delete('/:id', verifyToken, checkPermission('ADMIN'), async (req, res) => {
  try {
    // Memberships will be deleted automatically (cascade)
    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
