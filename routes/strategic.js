const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ============ OBJECTIVES ============

// Get all objectives with pagination
router.get('/objectives', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, versionId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (versionId) {
      where.versionId = versionId;
    }
    
    if (status) {
      where.status = status;
    }

    const objectives = await prisma.strategicObjective.findMany({
      where,
      include: {
        version: {
          select: {
            id: true,
            name: true,
            entity: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: { kpis: true }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: [{ createdAt: 'desc' }]
    });

    const total = await prisma.strategicObjective.count({ where });

    res.json({
      objectives,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching objectives:', error);
    res.status(500).json({ error: 'Failed to fetch objectives' });
  }
});

// Get single objective
router.get('/objectives/:id', verifyToken, async (req, res) => {
  try {
    const objective = await prisma.strategicObjective.findUnique({
      where: { id: req.params.id },
      include: {
        version: {
          include: {
            entity: {
              select: { id: true, name: true, code: true }
            }
          }
        },
        kpis: {
          orderBy: [{ createdAt: 'asc' }]
        }
      }
    });

    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }

    res.json(objective);
  } catch (error) {
    console.error('Error fetching objective:', error);
    res.status(500).json({ error: 'Failed to fetch objective' });
  }
});

// Create objective
router.post('/objectives', verifyToken, async (req, res) => {
  try {
    const { title, description, versionId, status } = req.body;

    if (!title || !versionId) {
      return res.status(400).json({ error: 'Title and versionId are required' });
    }

    // Verify version exists
    const version = await prisma.strategicVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const objective = await prisma.strategicObjective.create({
      data: {
        title,
        description: description || null,
        versionId,
        status: status || 'DRAFT'
      },
      include: {
        version: {
          select: {
            id: true,
            name: true,
            entity: { select: { id: true, name: true } }
          }
        },
        kpis: true
      }
    });

    res.status(201).json(objective);
  } catch (error) {
    console.error('Error creating objective:', error);
    res.status(500).json({ error: 'Failed to create objective' });
  }
});

// Update objective
router.patch('/objectives/:id', verifyToken, async (req, res) => {
  try {
    const { title, description, status } = req.body;

    const existing = await prisma.strategicObjective.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Objective not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const objective = await prisma.strategicObjective.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        version: { select: { id: true, name: true } },
        kpis: true
      }
    });

    res.json(objective);
  } catch (error) {
    console.error('Error updating objective:', error);
    res.status(500).json({ error: 'Failed to update objective' });
  }
});

// Delete objective
router.delete('/objectives/:id', verifyToken, async (req, res) => {
  try {
    const objective = await prisma.strategicObjective.findUnique({ where: { id: req.params.id } });
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }

    // Detach KPIs and delete objective
    await prisma.strategicObjective.delete({ where: { id: req.params.id } });

    res.json({ message: 'Objective deleted successfully' });
  } catch (error) {
    console.error('Error deleting objective:', error);
    res.status(500).json({ error: 'Failed to delete objective' });
  }
});

// ============ KPIs ============

// Get all KPIs with pagination
router.get('/kpis', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, versionId, objectiveId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (versionId) {
      where.versionId = versionId;
    }
    
    if (objectiveId) {
      where.objectiveId = objectiveId;
    }
    
    if (status) {
      where.status = status;
    }

    const kpis = await prisma.kpi.findMany({
      where,
      include: {
        version: {
          select: {
            id: true,
            name: true,
            entity: { select: { id: true, name: true } }
          }
        },
        objective: {
          select: {
            id: true,
            title: true
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: [{ createdAt: 'desc' }]
    });

    const total = await prisma.kpi.count({ where });

    res.json({
      kpis,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

// Get single KPI
router.get('/kpis/:id', verifyToken, async (req, res) => {
  try {
    const kpi = await prisma.kpi.findUnique({
      where: { id: req.params.id },
      include: {
        version: {
          include: {
            entity: { select: { id: true, name: true, code: true } }
          }
        },
        objective: true
      }
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    res.json(kpi);
  } catch (error) {
    console.error('Error fetching KPI:', error);
    res.status(500).json({ error: 'Failed to fetch KPI' });
  }
});

// Create KPI
router.post('/kpis', verifyToken, async (req, res) => {
  try {
    const { name, nameAr, description, target, unit, versionId, objectiveId, status } = req.body;

    if (!name || !versionId || target === undefined) {
      return res.status(400).json({ error: 'Name, versionId, and target are required' });
    }

    // Verify version exists
    const version = await prisma.strategicVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const kpi = await prisma.kpi.create({
      data: {
        name,
        nameAr: nameAr || null,
        description: description || null,
        target: parseFloat(target),
        actual: null,
        unit: unit || '%',
        versionId,
        objectiveId: objectiveId || null,
        status: status || 'ON_TRACK'
      },
      include: {
        version: { select: { id: true, name: true } },
        objective: true
      }
    });

    res.status(201).json(kpi);
  } catch (error) {
    console.error('Error creating KPI:', error);
    res.status(500).json({ error: 'Failed to create KPI' });
  }
});

// Update KPI
router.patch('/kpis/:id', verifyToken, async (req, res) => {
  try {
    const { name, nameAr, description, target, actual, unit, status, objectiveId } = req.body;

    const existing = await prisma.kpi.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (description !== undefined) updateData.description = description;
    if (target !== undefined) updateData.target = parseFloat(target);
    if (actual !== undefined) updateData.actual = actual ? parseFloat(actual) : null;
    if (unit) updateData.unit = unit;
    if (status) updateData.status = status;
    if (objectiveId !== undefined) updateData.objectiveId = objectiveId || null;

    const kpi = await prisma.kpi.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        version: { select: { id: true, name: true } },
        objective: true
      }
    });

    res.json(kpi);
  } catch (error) {
    console.error('Error updating KPI:', error);
    res.status(500).json({ error: 'Failed to update KPI' });
  }
});

// Delete KPI
router.delete('/kpis/:id', verifyToken, async (req, res) => {
  try {
    const kpi = await prisma.kpi.findUnique({ where: { id: req.params.id } });
    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    await prisma.kpi.delete({ where: { id: req.params.id } });

    res.json({ message: 'KPI deleted successfully' });
  } catch (error) {
    console.error('Error deleting KPI:', error);
    res.status(500).json({ error: 'Failed to delete KPI' });
  }
});

// ============ INITIATIVES ============

// Get all initiatives
router.get('/initiatives', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, versionId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (versionId) {
      where.versionId = versionId;
    }
    
    if (status) {
      where.status = status;
    }

    const initiatives = await prisma.strategicInitiative.findMany({
      where,
      include: {
        version: {
          select: {
            id: true,
            name: true,
            entity: { select: { id: true, name: true } }
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: [{ createdAt: 'desc' }]
    });

    const total = await prisma.strategicInitiative.count({ where });

    res.json({
      initiatives,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching initiatives:', error);
    res.status(500).json({ error: 'Failed to fetch initiatives' });
  }
});

// Create initiative
router.post('/initiatives', verifyToken, async (req, res) => {
  try {
    const { title, description, versionId, owner, status } = req.body;

    if (!title || !versionId) {
      return res.status(400).json({ error: 'Title and versionId are required' });
    }

    const initiative = await prisma.strategicInitiative.create({
      data: {
        title,
        description: description || null,
        versionId,
        owner: owner || null,
        status: status || 'PLANNED'
      },
      include: {
        version: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(initiative);
  } catch (error) {
    console.error('Error creating initiative:', error);
    res.status(500).json({ error: 'Failed to create initiative' });
  }
});

// Update initiative
router.patch('/initiatives/:id', verifyToken, async (req, res) => {
  try {
    const { title, description, status, owner } = req.body;

    const existing = await prisma.strategicInitiative.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Initiative not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (owner !== undefined) updateData.owner = owner;

    const initiative = await prisma.strategicInitiative.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        version: { select: { id: true, name: true } }
      }
    });

    res.json(initiative);
  } catch (error) {
    console.error('Error updating initiative:', error);
    res.status(500).json({ error: 'Failed to update initiative' });
  }
});

// Delete initiative
router.delete('/initiatives/:id', verifyToken, async (req, res) => {
  try {
    const initiative = await prisma.strategicInitiative.findUnique({ where: { id: req.params.id } });
    if (!initiative) {
      return res.status(404).json({ error: 'Initiative not found' });
    }

    await prisma.strategicInitiative.delete({ where: { id: req.params.id } });

    res.json({ message: 'Initiative deleted successfully' });
  } catch (error) {
    console.error('Error deleting initiative:', error);
    res.status(500).json({ error: 'Failed to delete initiative' });
  }
});

module.exports = router;
