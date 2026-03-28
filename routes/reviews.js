const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();


// ============ STRATEGIC REVIEWS — Enhanced with Decision Engine ============

// Get all reviews
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, versionId, status, decision, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};

    // Auto-filter by user's entity
    if (req.user.activeEntityId) {
      where.version = { entityId: req.user.activeEntityId };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { notes: { contains: search } },
        { summary: { contains: search } },
        { findings: { contains: search } },
      ];
    }

    if (versionId) where.versionId = versionId;
    if (status) where.status = status;
    if (decision) where.decision = decision;
    if (type) where.type = type;

    const reviews = await prisma.strategicReview.findMany({
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
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: [{ reviewDate: 'desc' }]
    });

    const total = await prisma.strategicReview.count({ where });

    // Stats summary
    const stats = {
      total,
      completed: await prisma.strategicReview.count({ where: { ...where, status: 'COMPLETED' } }),
      byContinue: await prisma.strategicReview.count({ where: { ...where, decision: 'CONTINUE' } }),
      byAdjust: await prisma.strategicReview.count({ where: { ...where, decision: 'ADJUST' } }),
      byPivot: await prisma.strategicReview.count({ where: { ...where, decision: 'PIVOT' } }),
    };

    res.json({
      reviews,
      stats,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get single review
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const review = await prisma.strategicReview.findUnique({
      where: { id: req.params.id },
      include: {
        version: {
          include: {
            entity: { select: { id: true, legalName: true, displayName: true } },
            objectives: {
              include: { kpis: true }
            }
          }
        }
      }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Create review — with full decision engine support
router.post('/', verifyToken, checkPermission('EDITOR'), async (req, res) => {
  try {
    const { title, reviewDate, versionId, notes, status,
      type, decision, summary, findings, recommendations, overallScore, conductedBy } = req.body;

    if (!title || !versionId) {
      return res.status(400).json({ error: 'Title and versionId are required' });
    }

    // Verify version exists
    const version = await prisma.strategyVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const review = await prisma.strategicReview.create({
      data: {
        title,
        reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
        versionId,
        notes: notes || null,
        status: status || 'PENDING',
        type: type || 'QUARTERLY_REVIEW',
        decision: decision || null,
        summary: summary || null,
        findings: findings || null,
        recommendations: recommendations || null,
        overallScore: overallScore ? parseFloat(overallScore) : null,
        conductedBy: conductedBy || null,
      },
      include: {
        version: {
          select: {
            id: true,
            versionNumber: true,
            name: true,
            status: true,
            entity: { select: { id: true, legalName: true, displayName: true } }
          }
        }
      }
    });

    // If decision is PIVOT, auto-create new version
    if (decision === 'PIVOT') {
      const lastVersion = await prisma.strategyVersion.findFirst({
        where: { entityId: version.entityId },
        orderBy: { versionNumber: 'desc' }
      });
      const newVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

      await prisma.strategyVersion.create({
        data: {
          entityId: version.entityId,
          versionNumber: newVersionNumber,
          status: 'DRAFT',
          name: `نسخة بعد Pivot — مراجعة: ${title}`,
          pivotedFromId: versionId,
          createdBy: conductedBy || null,
        }
      });
    }

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update review
router.patch('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
  try {
    const { title, reviewDate, notes, status,
      type, decision, summary, findings, recommendations, overallScore, conductedBy } = req.body;

    const existing = await prisma.strategicReview.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (reviewDate) updateData.reviewDate = new Date(reviewDate);
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    if (type !== undefined) updateData.type = type;
    if (decision !== undefined) updateData.decision = decision;
    if (summary !== undefined) updateData.summary = summary;
    if (findings !== undefined) updateData.findings = findings;
    if (recommendations !== undefined) updateData.recommendations = recommendations;
    if (overallScore !== undefined) updateData.overallScore = overallScore ? parseFloat(overallScore) : null;
    if (conductedBy !== undefined) updateData.conductedBy = conductedBy;

    const review = await prisma.strategicReview.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        version: {
          select: {
            id: true,
            versionNumber: true,
            name: true,
            status: true,
            entity: { select: { id: true, legalName: true, displayName: true } }
          }
        }
      }
    });

    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete review
router.delete('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
  try {
    const review = await prisma.strategicReview.findUnique({ where: { id: req.params.id } });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await prisma.strategicReview.delete({ where: { id: req.params.id } });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ──────────────────────────────────────────────────────
// GET /api/reviews/:dept — جلب مراجعات القسم (Wizard)
// ──────────────────────────────────────────────────────
router.get('/:dept', verifyToken, async (req, res) => {
  try {
    const { dept } = req.params;
    const entityId = req.user.entityId;

    const analysis = await prisma.departmentAnalysis.findFirst({
      where: {
        entityId,
        department: dept.toUpperCase(),
        type: 'REVIEWS'
      }
    });

    if (!analysis) return res.json({});
    res.json(JSON.parse(analysis.data));
  } catch (error) {
    console.error('Error fetching departmental reviews:', error);
    res.status(500).json({ error: 'Failed to fetch departmental reviews' });
  }
});

// ──────────────────────────────────────────────────────
// POST /api/reviews/:dept — حفظ مراجعات القسم (Wizard)
// ──────────────────────────────────────────────────────
router.post('/:dept', verifyToken, async (req, res) => {
  try {
    const { dept } = req.params;
    const data = req.body;
    const entityId = req.user.entityId;

    await prisma.departmentAnalysis.upsert({
      where: {
        entityId_department_type: {
          entityId,
          department: dept.toUpperCase(),
          type: 'REVIEWS'
        }
      },
      update: {
        data: JSON.stringify(data),
        updatedAt: new Date()
      },
      create: {
        entityId,
        department: dept.toUpperCase(),
        type: 'REVIEWS',
        data: JSON.stringify(data)
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving departmental reviews:', error);
    res.status(500).json({ error: 'Failed to save departmental reviews' });
  }
});

module.exports = router;
