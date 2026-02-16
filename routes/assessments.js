const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();


// Get all assessments with pagination and search
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, entityId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search,  } },
        { description: { contains: search,  } }
      ];
    }
    
    if (entityId) {
      where.entityId = entityId;
    }
    
    if (status) {
      where.status = status;
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: { dimensions: true }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    const total = await prisma.assessment.count({ where });

    res.json({
      assessments,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// Get single assessment with dimensions and criteria
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            code: true,
            industry: {
              select: {
                id: true,
                name: true,
                sector: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        dimensions: {
          include: {
            criteria: {
              orderBy: [
                { createdAt: 'asc' }
              ]
            }
          },
          orderBy: [
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// Create assessment
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, entityId, status } = req.body;

    // Validation
    if (!title || !entityId) {
      return res.status(400).json({ error: 'Title and entityId are required' });
    }

    // Verify entity exists
    const entity = await prisma.entity.findUnique({ where: { id: entityId } });
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        title,
        description: description || null,
        entityId,
        status: status || 'DRAFT'
      },
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        dimensions: true
      }
    });

    res.status(201).json(assessment);
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// Update assessment
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const assessmentId = req.params.id;

    // Check if assessment exists
    const existing = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!existing) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const assessment = await prisma.assessment.update({
      where: { id: assessmentId },
      data: updateData,
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        dimensions: true
      }
    });

    res.json(assessment);
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

// Delete assessment
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const assessmentId = req.params.id;

    // Check if assessment exists
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Delete assessment (cascade delete dimensions and criteria)
    await prisma.assessment.delete({ where: { id: assessmentId } });

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// Dimensions CRUD

// Create dimension
router.post('/:assessmentId/dimensions', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const { assessmentId } = req.params;

    if (!name) {
      return res.status(400).json({ error: 'Dimension name is required' });
    }

    // Verify assessment exists
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const dimension = await prisma.dimension.create({
      data: {
        name,
        description: description || null,
        assessmentId
      },
      include: {
        criteria: true
      }
    });

    res.status(201).json(dimension);
  } catch (error) {
    console.error('Error creating dimension:', error);
    res.status(500).json({ error: 'Failed to create dimension' });
  }
});

// Update dimension
router.patch('/dimensions/:id', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const dimensionId = req.params.id;

    const existing = await prisma.dimension.findUnique({ where: { id: dimensionId } });
    if (!existing) {
      return res.status(404).json({ error: 'Dimension not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const dimension = await prisma.dimension.update({
      where: { id: dimensionId },
      data: updateData,
      include: {
        criteria: true
      }
    });

    res.json(dimension);
  } catch (error) {
    console.error('Error updating dimension:', error);
    res.status(500).json({ error: 'Failed to update dimension' });
  }
});

// Delete dimension
router.delete('/dimensions/:id', verifyToken, async (req, res) => {
  try {
    const dimensionId = req.params.id;

    const dimension = await prisma.dimension.findUnique({ where: { id: dimensionId } });
    if (!dimension) {
      return res.status(404).json({ error: 'Dimension not found' });
    }

    await prisma.dimension.delete({ where: { id: dimensionId } });

    res.json({ message: 'Dimension deleted successfully' });
  } catch (error) {
    console.error('Error deleting dimension:', error);
    res.status(500).json({ error: 'Failed to delete dimension' });
  }
});

// Criteria CRUD

// Create criterion
router.post('/dimensions/:dimensionId/criteria', verifyToken, async (req, res) => {
  try {
    const { name, score, maxScore } = req.body;
    const { dimensionId } = req.params;

    if (!name) {
      return res.status(400).json({ error: 'Criterion name is required' });
    }

    // Verify dimension exists
    const dimension = await prisma.dimension.findUnique({ where: { id: dimensionId } });
    if (!dimension) {
      return res.status(404).json({ error: 'Dimension not found' });
    }

    const criterion = await prisma.criterion.create({
      data: {
        name,
        score: score || null,
        maxScore: maxScore || 100,
        dimensionId
      }
    });

    res.status(201).json(criterion);
  } catch (error) {
    console.error('Error creating criterion:', error);
    res.status(500).json({ error: 'Failed to create criterion' });
  }
});

// Update criterion
router.patch('/criteria/:id', verifyToken, async (req, res) => {
  try {
    const { name, score, maxScore } = req.body;
    const criterionId = req.params.id;

    const existing = await prisma.criterion.findUnique({ where: { id: criterionId } });
    if (!existing) {
      return res.status(404).json({ error: 'Criterion not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (score !== undefined) updateData.score = score;
    if (maxScore) updateData.maxScore = maxScore;

    const criterion = await prisma.criterion.update({
      where: { id: criterionId },
      data: updateData
    });

    res.json(criterion);
  } catch (error) {
    console.error('Error updating criterion:', error);
    res.status(500).json({ error: 'Failed to update criterion' });
  }
});

// Delete criterion
router.delete('/criteria/:id', verifyToken, async (req, res) => {
  try {
    const criterionId = req.params.id;

    const criterion = await prisma.criterion.findUnique({ where: { id: criterionId } });
    if (!criterion) {
      return res.status(404).json({ error: 'Criterion not found' });
    }

    await prisma.criterion.delete({ where: { id: criterionId } });

    res.json({ message: 'Criterion deleted successfully' });
  } catch (error) {
    console.error('Error deleting criterion:', error);
    res.status(500).json({ error: 'Failed to delete criterion' });
  }
});

module.exports = router;
