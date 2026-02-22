const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============ DIAGNOSES ============

// Get all diagnoses
router.get('/diagnoses', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, kpiId, severity } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        if (search) {
            where.OR = [
                { diagnosis: { contains: search } },
                { rootCause: { contains: search } }
            ];
        }

        if (kpiId) where.kpiId = kpiId;
        if (severity) where.severity = severity;

        const diagnoses = await prisma.kpiDiagnosis.findMany({
            where,
            include: {
                kpi: {
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                        target: true,
                        actual: true,
                        unit: true,
                        status: true,
                        version: {
                            select: {
                                id: true,
                                versionNumber: true,
                                entity: { select: { id: true, legalName: true, displayName: true } }
                            }
                        }
                    }
                },
                _count: { select: { corrections: true } }
            },
            skip,
            take: parseInt(limit),
            orderBy: [{ createdAt: 'desc' }]
        });

        const total = await prisma.kpiDiagnosis.count({ where });

        res.json({
            diagnoses,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching diagnoses:', error);
        res.status(500).json({ error: 'Failed to fetch diagnoses' });
    }
});

// Get single diagnosis
router.get('/diagnoses/:id', verifyToken, async (req, res) => {
    try {
        const diagnosis = await prisma.kpiDiagnosis.findUnique({
            where: { id: req.params.id },
            include: {
                kpi: {
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                        target: true,
                        actual: true,
                        unit: true,
                        status: true
                    }
                },
                corrections: true
            }
        });

        if (!diagnosis) {
            return res.status(404).json({ error: 'Diagnosis not found' });
        }

        res.json(diagnosis);
    } catch (error) {
        console.error('Error fetching diagnosis:', error);
        res.status(500).json({ error: 'Failed to fetch diagnosis' });
    }
});

// Create diagnosis
router.post('/diagnoses', verifyToken, async (req, res) => {
    try {
        const { kpiId, diagnosis, severity, rootCause } = req.body;

        if (!kpiId || !diagnosis) {
            return res.status(400).json({ error: 'kpiId and diagnosis are required' });
        }

        const result = await prisma.kpiDiagnosis.create({
            data: {
                kpiId,
                diagnosis,
                severity: severity || 'MEDIUM',
                rootCause: rootCause || null
            },
            include: {
                kpi: { select: { id: true, name: true, nameAr: true } },
                _count: { select: { corrections: true } }
            }
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating diagnosis:', error);
        res.status(500).json({ error: 'Failed to create diagnosis' });
    }
});

// Update diagnosis
router.patch('/diagnoses/:id', verifyToken, async (req, res) => {
    try {
        const { diagnosis, severity, rootCause } = req.body;

        const existing = await prisma.kpiDiagnosis.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Diagnosis not found' });
        }

        const updateData = {};
        if (diagnosis) updateData.diagnosis = diagnosis;
        if (severity) updateData.severity = severity;
        if (rootCause !== undefined) updateData.rootCause = rootCause;

        const result = await prisma.kpiDiagnosis.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                kpi: { select: { id: true, name: true, nameAr: true } },
                _count: { select: { corrections: true } }
            }
        });

        res.json(result);
    } catch (error) {
        console.error('Error updating diagnosis:', error);
        res.status(500).json({ error: 'Failed to update diagnosis' });
    }
});

// Delete diagnosis
router.delete('/diagnoses/:id', verifyToken, async (req, res) => {
    try {
        const existing = await prisma.kpiDiagnosis.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Diagnosis not found' });
        }

        await prisma.kpiDiagnosis.delete({ where: { id: req.params.id } });
        res.json({ message: 'Diagnosis deleted successfully' });
    } catch (error) {
        console.error('Error deleting diagnosis:', error);
        res.status(500).json({ error: 'Failed to delete diagnosis' });
    }
});

// ============ CORRECTIONS ============

// Get all corrections
router.get('/corrections', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, diagnosisId, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } }
            ];
        }

        if (diagnosisId) where.diagnosisId = diagnosisId;
        if (status) where.status = status;

        const corrections = await prisma.correctionAction.findMany({
            where,
            include: {
                diagnosis: {
                    select: {
                        id: true,
                        diagnosis: true,
                        severity: true,
                        kpi: {
                            select: { id: true, name: true, nameAr: true }
                        }
                    }
                }
            },
            skip,
            take: parseInt(limit),
            orderBy: [{ createdAt: 'desc' }]
        });

        const total = await prisma.correctionAction.count({ where });

        res.json({
            corrections,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching corrections:', error);
        res.status(500).json({ error: 'Failed to fetch corrections' });
    }
});

// Create correction
router.post('/corrections', verifyToken, async (req, res) => {
    try {
        const { diagnosisId, title, description, assignee, status, dueDate } = req.body;

        if (!diagnosisId || !title) {
            return res.status(400).json({ error: 'diagnosisId and title are required' });
        }

        const correction = await prisma.correctionAction.create({
            data: {
                diagnosisId,
                title,
                description: description || null,
                assignee: assignee || null,
                status: status || 'PENDING',
                dueDate: dueDate ? new Date(dueDate) : null
            },
            include: {
                diagnosis: {
                    select: { id: true, diagnosis: true, kpi: { select: { id: true, name: true } } }
                }
            }
        });

        res.status(201).json(correction);
    } catch (error) {
        console.error('Error creating correction:', error);
        res.status(500).json({ error: 'Failed to create correction' });
    }
});

// Update correction
router.patch('/corrections/:id', verifyToken, async (req, res) => {
    try {
        const { title, description, assignee, status, dueDate } = req.body;

        const existing = await prisma.correctionAction.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Correction not found' });
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (assignee !== undefined) updateData.assignee = assignee;
        if (status) {
            updateData.status = status;
            if (status === 'COMPLETED' && !existing.completedAt) {
                updateData.completedAt = new Date();
            }
        }
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

        const correction = await prisma.correctionAction.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                diagnosis: {
                    select: { id: true, diagnosis: true, kpi: { select: { id: true, name: true } } }
                }
            }
        });

        res.json(correction);
    } catch (error) {
        console.error('Error updating correction:', error);
        res.status(500).json({ error: 'Failed to update correction' });
    }
});

// Delete correction
router.delete('/corrections/:id', verifyToken, async (req, res) => {
    try {
        const existing = await prisma.correctionAction.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Correction not found' });
        }

        await prisma.correctionAction.delete({ where: { id: req.params.id } });
        res.json({ message: 'Correction deleted successfully' });
    } catch (error) {
        console.error('Error deleting correction:', error);
        res.status(500).json({ error: 'Failed to delete correction' });
    }
});

module.exports = router;
