const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// ============ DIAGNOSES ============

// Get all diagnoses
router.get('/diagnoses', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, kpiId, severity } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        // Auto-filter by user's entity
        if (req.user.activeEntityId) {
            where.kpi = { version: { entityId: req.user.activeEntityId } };
        }

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
router.post('/diagnoses', verifyToken, checkPermission('EDITOR'), async (req, res) => {
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
router.patch('/diagnoses/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
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
router.delete('/diagnoses/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
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

        // Auto-filter by user's entity
        if (req.user.activeEntityId) {
            where.diagnosis = { kpi: { version: { entityId: req.user.activeEntityId } } };
        }

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
                },
                analysisPoint: {
                    select: { id: true, code: true, title: true, type: true }
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

// Create correction — ✨ with SWOT link
router.post('/corrections', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { diagnosisId, title, description, assignee, status, dueDate, analysisPointId } = req.body;

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
                dueDate: dueDate ? new Date(dueDate) : null,
                analysisPointId: analysisPointId || null
            },
            include: {
                diagnosis: {
                    select: { id: true, diagnosis: true, kpi: { select: { id: true, name: true } } }
                },
                analysisPoint: {
                    select: { id: true, code: true, title: true, type: true }
                }
            }
        });

        res.status(201).json(correction);
    } catch (error) {
        console.error('Error creating correction:', error);
        res.status(500).json({ error: 'Failed to create correction' });
    }
});

// Update correction — ✨ closed-loop: alert when SWOT weakness addressed
router.patch('/corrections/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { title, description, assignee, status, dueDate, analysisPointId } = req.body;

        const existing = await prisma.correctionAction.findUnique({
            where: { id: req.params.id },
            include: {
                analysisPoint: { select: { id: true, code: true, title: true, type: true } },
                diagnosis: {
                    select: {
                        kpi: {
                            select: {
                                id: true, name: true,
                                version: { select: { entityId: true } }
                            }
                        }
                    }
                }
            }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Correction not found' });
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (assignee !== undefined) updateData.assignee = assignee;
        if (analysisPointId !== undefined) updateData.analysisPointId = analysisPointId || null;
        if (status) {
            updateData.status = status;
            if (status === 'COMPLETED' && !existing.completedAt) {
                updateData.completedAt = new Date();

                // ✨ CLOSED LOOP: If correction is linked to SWOT point, create success alert
                const linkedPoint = existing.analysisPoint;
                if (linkedPoint) {
                    const entityId = existing.diagnosis?.kpi?.version?.entityId;
                    if (entityId) {
                        try {
                            await prisma.strategicAlert.create({
                                data: {
                                    entityId,
                                    type: 'CORRECTION_SUCCESS',
                                    severity: 'INFO',
                                    title: `✅ تصحيح ناجح: نقطة ${linkedPoint.type === 'WEAKNESS' ? 'ضعف' : 'تهديد'} "${linkedPoint.code || ''}" قد عُولجت`,
                                    message: `الإجراء التصحيحي "${existing.title}" اكتمل بنجاح. النقطة المرتبطة: ${linkedPoint.title}`,
                                    referenceId: existing.id,
                                    referenceType: 'CORRECTION'
                                }
                            });
                        } catch (e) { console.error('Failed to create success alert:', e); }
                    }
                }
            }
        }
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

        const correction = await prisma.correctionAction.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                diagnosis: {
                    select: { id: true, diagnosis: true, kpi: { select: { id: true, name: true } } }
                },
                analysisPoint: {
                    select: { id: true, code: true, title: true, type: true }
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
router.delete('/corrections/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
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

// ============ NERVOUS SYSTEM — Phase 7 ============

// ✨ Suggest SWOT weaknesses/threats for a diagnosis
// GET /api/corrections/suggest-swot/:diagnosisId
router.get('/suggest-swot/:diagnosisId', verifyToken, async (req, res) => {
    try {
        const diagnosis = await prisma.kpiDiagnosis.findUnique({
            where: { id: req.params.diagnosisId },
            include: {
                kpi: {
                    select: {
                        id: true, name: true, nameAr: true,
                        objective: { select: { title: true, perspective: true } },
                        version: {
                            select: {
                                entityId: true,
                                entity: { select: { id: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!diagnosis) {
            return res.status(404).json({ error: 'Diagnosis not found' });
        }

        const entityId = diagnosis.kpi?.version?.entityId;
        if (!entityId) {
            return res.json({ suggestions: [], message: 'لا يمكن تحديد الكيان' });
        }

        // Get weaknesses and threats from SWOT
        const swotPoints = await prisma.analysisPoint.findMany({
            where: {
                assessment: { entityId },
                type: { in: ['WEAKNESS', 'THREAT'] }
            },
            select: { id: true, code: true, title: true, type: true, impact: true },
            orderBy: [{ impact: 'desc' }, { createdAt: 'desc' }]
        });

        // Score relevance based on keyword matching
        const kpiName = (diagnosis.kpi?.name || '').toLowerCase();
        const diagnosisText = (diagnosis.diagnosis || '').toLowerCase();
        const rootCause = (diagnosis.rootCause || '').toLowerCase();

        const scored = swotPoints.map(point => {
            let relevance = 0;
            const pointTitle = (point.title || '').toLowerCase();

            // Simple keyword matching
            const words = [...kpiName.split(/\s+/), ...diagnosisText.split(/\s+/), ...rootCause.split(/\s+/)]
                .filter(w => w.length > 2);

            for (const word of words) {
                if (pointTitle.includes(word)) relevance += 2;
            }

            // Boost HIGH impact points
            if (point.impact === 'HIGH') relevance += 3;
            if (point.impact === 'MEDIUM') relevance += 1;

            return { ...point, relevance };
        });

        const suggestions = scored
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 10);

        res.json({
            suggestions,
            kpiName: diagnosis.kpi?.name,
            diagnosisText: diagnosis.diagnosis,
            message: `تم العثور على ${suggestions.length} نقطة ضعف/تهديد مقترحة`
        });
    } catch (error) {
        console.error('Error suggesting SWOT points:', error);
        res.status(500).json({ error: 'Failed to suggest SWOT points' });
    }
});

// ✨ Get corrections linked to a specific review period
// GET /api/corrections/for-review/:versionId
router.get('/for-review/:versionId', verifyToken, async (req, res) => {
    try {
        const { versionId } = req.params;
        const { since } = req.query; // optional: corrections since date

        const sinceDate = since ? new Date(since) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // default: last 90 days

        const corrections = await prisma.correctionAction.findMany({
            where: {
                diagnosis: {
                    kpi: { versionId }
                },
                createdAt: { gte: sinceDate }
            },
            include: {
                diagnosis: {
                    select: {
                        diagnosis: true,
                        severity: true,
                        kpi: { select: { name: true, nameAr: true, actual: true, target: true } }
                    }
                },
                analysisPoint: {
                    select: { id: true, code: true, title: true, type: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const stats = {
            total: corrections.length,
            completed: corrections.filter(c => c.status === 'COMPLETED').length,
            pending: corrections.filter(c => c.status === 'PENDING').length,
            inProgress: corrections.filter(c => c.status === 'IN_PROGRESS').length,
            linkedToSWOT: corrections.filter(c => c.analysisPointId).length
        };

        res.json({ corrections, stats });
    } catch (error) {
        console.error('Error fetching corrections for review:', error);
        res.status(500).json({ error: 'Failed to fetch corrections for review' });
    }
});

module.exports = router;
