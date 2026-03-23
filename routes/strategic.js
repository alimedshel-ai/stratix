const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission, checkDataEntryPermission } = require('../middleware/permission');
const enforceLimit = require('../middleware/enforce-limits');
const { checkOwnership } = require('../middleware/ownership');

const router = express.Router();


// ============ OBJECTIVES ============

/**
 * @swagger
 * /api/strategic/objectives:
 *   get:
 *     summary: جلب جميع الأهداف الاستراتيجية
 *     tags: [Strategy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: بحث بالعنوان أو الوصف
 *       - in: query
 *         name: versionId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, ACTIVE, ON_TRACK, AT_RISK, COMPLETED] }
 *     responses:
 *       200:
 *         description: قائمة الأهداف الاستراتيجية مع بيانات الصفحات
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 objectives:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Objective'
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 *   post:
 *     summary: إنشاء هدف استراتيجي جديد
 *     tags: [Strategy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateObjective'
 *     responses:
 *       201:
 *         description: تم إنشاء الهدف
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Objective'
 *       403:
 *         description: تجاوز حد الباقة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlanLimitError'
 */

/**
 * @swagger
 * /api/strategic/objectives/{id}:
 *   get:
 *     summary: جلب هدف استراتيجي واحد
 *     tags: [Strategy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: بيانات الهدف
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Objective'
 *       404:
 *         description: الهدف غير موجود
 *   patch:
 *     summary: تعديل هدف استراتيجي
 *     tags: [Strategy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateObjective'
 *     responses:
 *       200:
 *         description: تم التعديل
 *       404:
 *         description: غير موجود
 *   delete:
 *     summary: حذف هدف استراتيجي
 *     tags: [Strategy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: تم الحذف
 *       404:
 *         description: غير موجود
 */

/**
 * @swagger
 * /api/strategic/kpis:
 *   get:
 *     summary: جلب جميع مؤشرات الأداء
 *     tags: [Strategy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: versionId
 *         schema: { type: string }
 *       - in: query
 *         name: objectiveId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ON_TRACK, AT_RISK, OFF_TRACK, NOT_STARTED] }
 *     responses:
 *       200:
 *         description: قائمة المؤشرات
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 kpis:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/KPI'
 *                 total: { type: integer }
 *   post:
 *     summary: إنشاء مؤشر أداء جديد
 *     tags: [Strategy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateKPI'
 *     responses:
 *       201:
 *         description: تم إنشاء المؤشر
 *       403:
 *         description: تجاوز حد الباقة (PLAN_LIMIT_REACHED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlanLimitError'
 */

/**
 * @swagger
 * /api/strategic/kpis/{id}:
 *   get:
 *     summary: جلب مؤشر أداء واحد
 *     tags: [Strategy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: بيانات المؤشر مع آخر 12 إدخال
 *       404:
 *         description: المؤشر غير موجود
 *   patch:
 *     summary: تعديل مؤشر أداء
 *     tags: [Strategy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateKPI'
 *     responses:
 *       200:
 *         description: تم التعديل
 *   delete:
 *     summary: حذف مؤشر أداء
 *     tags: [Strategy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: تم الحذف
 */

/**
 * @swagger
 * /api/strategic/initiatives:
 *   get:
 *     summary: جلب جميع المبادرات الاستراتيجية
 *     tags: [Strategy]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: versionId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PLANNED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED] }
 *     responses:
 *       200:
 *         description: قائمة المبادرات
 *   post:
 *     summary: إنشاء مبادرة جديدة
 *     tags: [Strategy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, versionId]
 *             properties:
 *               title: { type: string, example: 'إطلاق تطبيق الجوال' }
 *               description: { type: string }
 *               versionId: { type: string }
 *               owner: { type: string }
 *               status: { type: string, default: 'PLANNED' }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *               budget: { type: number }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: تم الإنشاء
 *       403:
 *         description: تجاوز حد الباقة
 */

// Get all objectives with pagination
router.get('/objectives', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, versionId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};

    // Auto-filter by user's entity
    if (req.user.activeEntityId) {
      where.version = { entityId: req.user.activeEntityId };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, } },
        { description: { contains: search, } }
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
            versionNumber: true,
            name: true,
            status: true,
            entity: {
              select: {
                id: true,
                legalName: true,
                displayName: true
              }
            }
          }
        },
        parent: { select: { id: true, title: true } },
        _count: {
          select: { kpis: true, children: true }
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
router.get('/objectives/:id', verifyToken, checkOwnership('strategicObjective'), async (req, res) => {
  try {
    const objective = await prisma.strategicObjective.findUnique({
      where: { id: req.params.id },
      include: {
        version: {
          include: {
            entity: {
              select: { id: true, legalName: true, displayName: true }
            }
          }
        },
        parent: { select: { id: true, title: true } },
        children: { select: { id: true, title: true, status: true, perspective: true } },
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
router.post('/objectives', verifyToken, checkPermission('EDITOR'), checkOwnership('strategicObjective'), enforceLimit('maxObjectives'), async (req, res) => {
  try {
    const { title, description, versionId, status, parentId, perspective, weight, baselineValue, targetValue, deadline, ownerId } = req.body;

    if (!title || !versionId) {
      return res.status(400).json({ error: 'Title and versionId are required' });
    }

    // Verify version exists
    const version = await prisma.strategyVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const objective = await prisma.strategicObjective.create({
      data: {
        title,
        description: description || null,
        versionId,
        status: status || 'DRAFT',
        parentId: parentId || null,
        perspective: perspective || null,
        weight: weight ? parseFloat(weight) : null,
        baselineValue: baselineValue ? parseFloat(baselineValue) : null,
        targetValue: targetValue ? parseFloat(targetValue) : null,
        deadline: deadline ? new Date(deadline) : null,
        ownerId: ownerId || null,
      },
      include: {
        version: {
          select: {
            id: true,
            versionNumber: true,
            status: true,
            entity: { select: { id: true, legalName: true, displayName: true } }
          }
        },
        parent: { select: { id: true, title: true } },
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
router.patch('/objectives/:id', verifyToken, checkPermission('EDITOR'), checkOwnership('strategicObjective'), async (req, res) => {
  try {
    const { title, description, status, parentId, perspective, weight, baselineValue, targetValue, deadline, ownerId } = req.body;

    const existing = await prisma.strategicObjective.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Objective not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (perspective !== undefined) updateData.perspective = perspective;
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
    if (baselineValue !== undefined) updateData.baselineValue = baselineValue ? parseFloat(baselineValue) : null;
    if (targetValue !== undefined) updateData.targetValue = targetValue ? parseFloat(targetValue) : null;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (ownerId !== undefined) updateData.ownerId = ownerId || null;

    const objective = await prisma.strategicObjective.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        version: { select: { id: true, versionNumber: true, status: true } },
        parent: { select: { id: true, title: true } },
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
router.delete('/objectives/:id', verifyToken, checkPermission('EDITOR'), checkOwnership('strategicObjective'), async (req, res) => {
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
    const { page = 1, limit = 10, search, versionId, objectiveId, status, kpiType, bscPerspective } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};

    // Auto-filter by user's entity
    if (req.user.activeEntityId) {
      where.version = { entityId: req.user.activeEntityId };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, } },
        { nameAr: { contains: search, } },
        { description: { contains: search, } }
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

    if (kpiType) {
      where.kpiType = kpiType;
    }

    if (bscPerspective) {
      where.bscPerspective = bscPerspective;
    }

    const kpis = await prisma.kPI.findMany({
      where,
      include: {
        version: {
          select: {
            id: true,
            versionNumber: true,
            name: true,
            status: true,
            entity: { select: { id: true, legalName: true, displayName: true } }
          }
        },
        objective: {
          select: {
            id: true,
            title: true,
            perspective: true
          }
        },
        _count: { select: { entries: true } }
      },
      skip,
      take: parseInt(limit),
      orderBy: [{ createdAt: 'desc' }]
    });

    const total = await prisma.kPI.count({ where });

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
router.get('/kpis/:id', verifyToken, checkOwnership('kPI'), async (req, res) => {
  try {
    const kpi = await prisma.kPI.findUnique({
      where: { id: req.params.id },
      include: {
        version: {
          include: {
            entity: { select: { id: true, legalName: true, displayName: true } }
          }
        },
        objective: { select: { id: true, title: true, perspective: true } },
        entries: { orderBy: { periodStart: 'desc' }, take: 12 },
        diagnoses: { include: { corrections: true } }
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
router.post('/kpis', verifyToken, checkPermission('EDITOR'), checkOwnership('kPI'), enforceLimit('maxKpis'), async (req, res) => {
  try {
    const { name, nameAr, description, target, unit, versionId, objectiveId, status,
      formula, dataSource, frequency, warningThreshold, criticalThreshold, kpiType, bscPerspective } = req.body;

    if (!name || !versionId || target === undefined) {
      return res.status(400).json({ error: 'Name, versionId, and target are required' });
    }

    // Verify version exists
    const version = await prisma.strategyVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const kpi = await prisma.kPI.create({
      data: {
        name,
        nameAr: nameAr || null,
        description: description || null,
        target: parseFloat(target),
        actual: null,
        unit: unit || '%',
        versionId,
        objectiveId: objectiveId || null,
        status: status || 'ON_TRACK',
        formula: formula || null,
        dataSource: dataSource || null,
        frequency: frequency || 'MONTHLY',
        warningThreshold: warningThreshold ? parseFloat(warningThreshold) : null,
        criticalThreshold: criticalThreshold ? parseFloat(criticalThreshold) : null,
        kpiType: kpiType || null,
        bscPerspective: bscPerspective || null,
      },
      include: {
        version: { select: { id: true, versionNumber: true, status: true } },
        objective: { select: { id: true, title: true, perspective: true } }
      }
    });

    res.status(201).json(kpi);
  } catch (error) {
    console.error('Error creating KPI:', error);
    res.status(500).json({ error: 'Failed to create KPI' });
  }
});

// Update KPI
router.patch('/kpis/:id', verifyToken, checkPermission('EDITOR'), checkOwnership('kPI'), async (req, res) => {
  try {
    const { name, nameAr, description, target, actual, unit, status, objectiveId,
      formula, dataSource, frequency, warningThreshold, criticalThreshold, kpiType, bscPerspective } = req.body;

    const existing = await prisma.kPI.findUnique({ where: { id: req.params.id } });
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
    if (formula !== undefined) updateData.formula = formula;
    if (dataSource !== undefined) updateData.dataSource = dataSource;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (warningThreshold !== undefined) updateData.warningThreshold = warningThreshold ? parseFloat(warningThreshold) : null;
    if (criticalThreshold !== undefined) updateData.criticalThreshold = criticalThreshold ? parseFloat(criticalThreshold) : null;
    if (kpiType !== undefined) updateData.kpiType = kpiType || null;
    if (bscPerspective !== undefined) updateData.bscPerspective = bscPerspective || null;

    const kpi = await prisma.kPI.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        version: { select: { id: true, versionNumber: true, status: true } },
        objective: { select: { id: true, title: true, perspective: true } }
      }
    });

    res.json(kpi);
  } catch (error) {
    console.error('Error updating KPI:', error);
    res.status(500).json({ error: 'Failed to update KPI' });
  }
});

// Delete KPI
router.delete('/kpis/:id', verifyToken, checkPermission('EDITOR'), checkOwnership('kPI'), async (req, res) => {
  try {
    const kpi = await prisma.kPI.findUnique({ where: { id: req.params.id } });
    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    await prisma.kPI.delete({ where: { id: req.params.id } });

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

    // Auto-filter by user's entity
    if (req.user.activeEntityId) {
      where.version = { entityId: req.user.activeEntityId };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, } },
        { description: { contains: search, } }
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
            versionNumber: true,
            status: true,
            entity: { select: { id: true, legalName: true, displayName: true } }
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
router.post('/initiatives', verifyToken, checkPermission('EDITOR'), checkOwnership('strategicInitiative'), enforceLimit('maxInitiatives'), async (req, res) => {
  try {
    const { title, description, versionId, owner, status, startDate, endDate, progress, budget, priority, kpiId } = req.body;

    if (!title || !versionId) {
      return res.status(400).json({ error: 'Title and versionId are required' });
    }

    const initiative = await prisma.strategicInitiative.create({
      data: {
        title,
        description: description || null,
        versionId,
        owner: owner || null,
        status: status || 'PLANNED',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        progress: progress ? parseFloat(progress) : 0,
        budget: budget ? parseFloat(budget) : null,
        priority: priority || 'MEDIUM',
        kpiId: kpiId || null,
      },
      include: {
        version: { select: { id: true, versionNumber: true, name: true, status: true } }
      }
    });

    res.status(201).json(initiative);
  } catch (error) {
    console.error('Error creating initiative:', error);
    res.status(500).json({ error: 'Failed to create initiative' });
  }
});

// Update initiative progress (DATA_ENTRY can update progress only)
router.patch('/initiatives/:id/progress', verifyToken, checkDataEntryPermission('canEnterKPI'), checkOwnership('strategicInitiative'), async (req, res) => {
  try {
    const { progress, status, notes } = req.body;

    const existing = await prisma.strategicInitiative.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Initiative not found' });
    }

    const updateData = {};
    if (progress !== undefined) updateData.progress = Math.min(100, Math.max(0, parseFloat(progress)));
    if (status && ['PLANNED', 'IN_PROGRESS', 'ON_HOLD'].includes(status)) updateData.status = status;
    // auto-complete at 100%
    if (updateData.progress === 100) updateData.status = 'COMPLETED';

    const initiative = await prisma.strategicInitiative.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ message: 'تم تحديث التقدم', initiative });
  } catch (error) {
    console.error('Error updating initiative progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Update initiative (EDITOR+)
router.patch('/initiatives/:id', verifyToken, checkPermission('EDITOR'), checkOwnership('strategicInitiative'), async (req, res) => {
  try {
    const { title, description, status, owner, startDate, endDate, progress, budget, priority, kpiId } = req.body;

    const existing = await prisma.strategicInitiative.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Initiative not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (owner !== undefined) updateData.owner = owner;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (progress !== undefined) updateData.progress = parseFloat(progress);
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (kpiId !== undefined) updateData.kpiId = kpiId || null;

    const initiative = await prisma.strategicInitiative.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        version: { select: { id: true, versionNumber: true, name: true, status: true } }
      }
    });

    res.json(initiative);
  } catch (error) {
    console.error('Error updating initiative:', error);
    res.status(500).json({ error: 'Failed to update initiative' });
  }
});

// Delete initiative
router.delete('/initiatives/:id', verifyToken, checkPermission('EDITOR'), checkOwnership('strategicInitiative'), async (req, res) => {
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

// ============ SCENARIOS ============

// GET all scenarios
router.get('/scenarios', verifyToken, async (req, res) => {
  try {
    const { versionId, type, status } = req.query;
    const where = {};
    if (versionId) where.versionId = versionId;
    if (type) where.type = type;
    if (status) where.status = status;

    const scenarios = await prisma.scenario.findMany({
      where,
      include: {
        version: { select: { id: true, versionNumber: true, entity: { select: { id: true, legalName: true } } } },
        variables: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ scenarios });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// GET single scenario
router.get('/scenarios/:id', verifyToken, checkOwnership('scenario'), async (req, res) => {
  try {
    const scenario = await prisma.scenario.findUnique({
      where: { id: req.params.id },
      include: { version: { select: { id: true, versionNumber: true } }, variables: true },
    });
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });
    res.json(scenario);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scenario' });
  }
});

// POST create scenario
router.post('/scenarios', verifyToken, checkPermission('EDITOR'), checkOwnership('scenario'), async (req, res) => {
  try {
    const { name, versionId, type, description, probability, impact, status, notes } = req.body;
    if (!name || !versionId) return res.status(400).json({ error: 'name and versionId are required' });

    const version = await prisma.strategyVersion.findUnique({ where: { id: versionId } });
    if (!version) return res.status(404).json({ error: 'Version not found' });

    const scenario = await prisma.scenario.create({
      data: {
        name,
        versionId,
        type: type || 'BASELINE',
        description: description || null,
        probability: probability != null ? parseFloat(probability) : 50,
        impact: impact || 'MEDIUM',
        status: status || 'DRAFT',
        notes: notes || null,
        createdBy: req.user?.id || null,
      },
      include: { version: { select: { id: true, versionNumber: true, entity: { select: { id: true, legalName: true } } } } },
    });
    res.status(201).json(scenario);
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(500).json({ error: 'Failed to create scenario' });
  }
});

// PATCH update scenario
router.patch('/scenarios/:id', verifyToken, checkPermission('EDITOR'), checkOwnership('scenario'), async (req, res) => {
  try {
    const existing = await prisma.scenario.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Scenario not found' });

    const { name, type, description, probability, impact, status, notes } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (description !== undefined) data.description = description;
    if (probability !== undefined) data.probability = parseFloat(probability);
    if (impact !== undefined) data.impact = impact;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;

    const scenario = await prisma.scenario.update({ where: { id: req.params.id }, data });
    res.json(scenario);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update scenario' });
  }
});

// DELETE scenario
router.delete('/scenarios/:id', verifyToken, checkPermission('EDITOR'), checkOwnership('scenario'), async (req, res) => {
  try {
    const existing = await prisma.scenario.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Scenario not found' });
    await prisma.scenario.delete({ where: { id: req.params.id } });
    res.json({ message: 'Scenario deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete scenario' });
  }
});

module.exports = router;
