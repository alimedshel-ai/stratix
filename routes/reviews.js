const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();


// ============ REVIEWS ============

// Get all reviews
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, versionId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search,  } },
        { notes: { contains: search,  } }
      ];
    }
    
    if (versionId) {
      where.versionId = versionId;
    }
    
    if (status) {
      where.status = status;
    }

    const reviews = await prisma.strategicReview.findMany({
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
      orderBy: [{ reviewDate: 'desc' }]
    });

    const total = await prisma.strategicReview.count({ where });

    res.json({
      reviews,
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

// Create review
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, reviewDate, versionId, notes, status } = req.body;

    if (!title || !versionId) {
      return res.status(400).json({ error: 'Title and versionId are required' });
    }

    const review = await prisma.strategicReview.create({
      data: {
        title,
        reviewDate: new Date(reviewDate),
        versionId,
        notes: notes || null,
        status: status || 'PENDING'
      },
      include: {
        version: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update review
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { title, reviewDate, notes, status } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (reviewDate) updateData.reviewDate = new Date(reviewDate);
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;

    const review = await prisma.strategicReview.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        version: { select: { id: true, name: true } }
      }
    });

    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete review
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await prisma.strategicReview.delete({ where: { id: req.params.id } });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
