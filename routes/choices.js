const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// ============ STRATEGIC CHOICES ============

// Get all choices with pagination
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, versionId, status, priority } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        // Auto-filter by user's entity
        if (req.user.activeEntityId) {
            where.version = { entityId: req.user.activeEntityId };
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } }
            ];
        }

        if (versionId) where.versionId = versionId;
        if (status) where.status = status;
        if (priority) where.priority = priority;

        const choices = await prisma.strategicChoice.findMany({
            where,
            include: {
                version: {
                    select: {
                        id: true,
                        versionNumber: true,
                        entity: { select: { id: true, legalName: true, displayName: true } }
                    }
                },
                _count: { select: { risks: true } }
            },
            skip,
            take: parseInt(limit),
            orderBy: [{ createdAt: 'desc' }]
        });

        const total = await prisma.strategicChoice.count({ where });

        res.json({
            choices,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching choices:', error);
        res.status(500).json({ error: 'Failed to fetch choices' });
    }
});

// Get single choice
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const choice = await prisma.strategicChoice.findUnique({
            where: { id: req.params.id },
            include: {
                version: {
                    select: {
                        id: true,
                        versionNumber: true,
                        entity: { select: { id: true, legalName: true, displayName: true } }
                    }
                },
                risks: true
            }
        });

        if (!choice) {
            return res.status(404).json({ error: 'Choice not found' });
        }

        res.json(choice);
    } catch (error) {
        console.error('Error fetching choice:', error);
        res.status(500).json({ error: 'Failed to fetch choice' });
    }
});

// Create choice
router.post('/', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { title, description, versionId, status, priority, choiceType, marketAttractiveness, competitiveAdvantage, feasibility, riskLevel, isSelected, requiredCapabilities } = req.body;

        if (!title || !versionId) {
            return res.status(400).json({ error: 'Title and versionId are required' });
        }

        const choice = await prisma.strategicChoice.create({
            data: {
                title,
                description: description || null,
                versionId,
                status: status || 'ACTIVE',
                priority: priority || 'MEDIUM',
                choiceType: choiceType || null,
                marketAttractiveness: marketAttractiveness ? parseInt(marketAttractiveness) : null,
                competitiveAdvantage: competitiveAdvantage ? parseInt(competitiveAdvantage) : null,
                feasibility: feasibility ? parseInt(feasibility) : null,
                riskLevel: riskLevel || null,
                isSelected: isSelected || false,
                requiredCapabilities: requiredCapabilities || null,
            },
            include: {
                version: {
                    select: { id: true, versionNumber: true }
                },
                _count: { select: { risks: true } }
            }
        });

        res.status(201).json(choice);
    } catch (error) {
        console.error('Error creating choice:', error);
        res.status(500).json({ error: 'Failed to create choice' });
    }
});

// Update choice
router.patch('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { title, description, status, priority, choiceType, marketAttractiveness, competitiveAdvantage, feasibility, riskLevel, isSelected, requiredCapabilities } = req.body;

        const existing = await prisma.strategicChoice.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Choice not found' });
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (choiceType !== undefined) updateData.choiceType = choiceType || null;
        if (marketAttractiveness !== undefined) updateData.marketAttractiveness = marketAttractiveness ? parseInt(marketAttractiveness) : null;
        if (competitiveAdvantage !== undefined) updateData.competitiveAdvantage = competitiveAdvantage ? parseInt(competitiveAdvantage) : null;
        if (feasibility !== undefined) updateData.feasibility = feasibility ? parseInt(feasibility) : null;
        if (riskLevel !== undefined) updateData.riskLevel = riskLevel || null;
        if (isSelected !== undefined) updateData.isSelected = isSelected;
        if (requiredCapabilities !== undefined) updateData.requiredCapabilities = requiredCapabilities || null;

        const choice = await prisma.strategicChoice.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                version: { select: { id: true, versionNumber: true } },
                _count: { select: { risks: true } }
            }
        });

        res.json(choice);
    } catch (error) {
        console.error('Error updating choice:', error);
        res.status(500).json({ error: 'Failed to update choice' });
    }
});

// Delete choice
router.delete('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const choice = await prisma.strategicChoice.findUnique({ where: { id: req.params.id } });
        if (!choice) {
            return res.status(404).json({ error: 'Choice not found' });
        }

        await prisma.strategicChoice.delete({ where: { id: req.params.id } });
        res.json({ message: 'Choice deleted successfully' });
    } catch (error) {
        console.error('Error deleting choice:', error);
        res.status(500).json({ error: 'Failed to delete choice' });
    }
});

// ============ RISKS ============

// Get all risks
router.get('/risks/all', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, versionId, choiceId, status, probability, impact } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        // Auto-filter by user's entity
        if (req.user.activeEntityId) {
            where.version = { entityId: req.user.activeEntityId };
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } }
            ];
        }

        if (versionId) where.versionId = versionId;
        if (choiceId) where.choiceId = choiceId;
        if (status) where.status = status;
        if (probability) where.probability = probability;
        if (impact) where.impact = impact;

        const risks = await prisma.strategicRisk.findMany({
            where,
            include: {
                choice: { select: { id: true, title: true } },
                version: {
                    select: {
                        id: true,
                        versionNumber: true,
                        entity: { select: { id: true, legalName: true, displayName: true } }
                    }
                }
            },
            skip,
            take: parseInt(limit),
            orderBy: [{ createdAt: 'desc' }]
        });

        const total = await prisma.strategicRisk.count({ where });

        res.json({
            risks,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching risks:', error);
        res.status(500).json({ error: 'Failed to fetch risks' });
    }
});

// Create risk
router.post('/risks', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { title, description, versionId, choiceId, probability, impact, mitigation, owner, status, category, probabilityScore, impactScore, contingency } = req.body;

        if (!title || !versionId) {
            return res.status(400).json({ error: 'Title and versionId are required' });
        }

        const pScore = probabilityScore ? parseInt(probabilityScore) : null;
        const iScore = impactScore ? parseInt(impactScore) : null;

        const risk = await prisma.strategicRisk.create({
            data: {
                title,
                description: description || null,
                versionId,
                choiceId: choiceId || null,
                probability: probability || 'MEDIUM',
                impact: impact || 'MEDIUM',
                mitigation: mitigation || null,
                owner: owner || null,
                status: status || 'OPEN',
                category: category || null,
                probabilityScore: pScore,
                impactScore: iScore,
                riskScore: (pScore && iScore) ? pScore * iScore : null,
                contingency: contingency || null,
            },
            include: {
                choice: { select: { id: true, title: true } },
                version: { select: { id: true, versionNumber: true } }
            }
        });

        res.status(201).json(risk);
    } catch (error) {
        console.error('Error creating risk:', error);
        res.status(500).json({ error: 'Failed to create risk' });
    }
});

// Update risk
router.patch('/risks/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { title, description, probability, impact, mitigation, owner, status, choiceId, category, probabilityScore, impactScore, contingency } = req.body;

        const existing = await prisma.strategicRisk.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Risk not found' });
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (probability) updateData.probability = probability;
        if (impact) updateData.impact = impact;
        if (mitigation !== undefined) updateData.mitigation = mitigation;
        if (owner !== undefined) updateData.owner = owner;
        if (status) updateData.status = status;
        if (choiceId !== undefined) updateData.choiceId = choiceId || null;
        if (category !== undefined) updateData.category = category || null;
        if (probabilityScore !== undefined) updateData.probabilityScore = probabilityScore ? parseInt(probabilityScore) : null;
        if (impactScore !== undefined) updateData.impactScore = impactScore ? parseInt(impactScore) : null;
        if (contingency !== undefined) updateData.contingency = contingency || null;
        // Auto-calculate riskScore
        const pS = updateData.probabilityScore !== undefined ? updateData.probabilityScore : existing.probabilityScore;
        const iS = updateData.impactScore !== undefined ? updateData.impactScore : existing.impactScore;
        if (pS && iS) updateData.riskScore = pS * iS;

        const risk = await prisma.strategicRisk.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                choice: { select: { id: true, title: true } },
                version: { select: { id: true, versionNumber: true } }
            }
        });

        res.json(risk);
    } catch (error) {
        console.error('Error updating risk:', error);
        res.status(500).json({ error: 'Failed to update risk' });
    }
});

// Delete risk
router.delete('/risks/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const risk = await prisma.strategicRisk.findUnique({ where: { id: req.params.id } });
        if (!risk) {
            return res.status(404).json({ error: 'Risk not found' });
        }

        await prisma.strategicRisk.delete({ where: { id: req.params.id } });
        res.json({ message: 'Risk deleted successfully' });
    } catch (error) {
        console.error('Error deleting risk:', error);
        res.status(500).json({ error: 'Failed to delete risk' });
    }
});

module.exports = router;
