const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// ============ OKRs ============

// Get OKR tree for a version
router.get('/:versionId', verifyToken, async (req, res) => {
    try {
        const { versionId } = req.params;
        const { quarter } = req.query;

        let where = {
            versionId,
            framework: { in: ['OKR', 'BOTH'] },
            parentId: null // top-level objectives only
        };

        if (quarter) where.quarter = quarter;

        const objectives = await prisma.strategicObjective.findMany({
            where,
            include: {
                children: {
                    include: {
                        kpis: { select: { id: true, name: true, nameAr: true, actual: true, target: true, status: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                kpis: { select: { id: true, name: true, nameAr: true, actual: true, target: true, status: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Calculate progress for each objective from its key results
        const withProgress = objectives.map(obj => {
            const keyResults = obj.children || [];
            let calculatedProgress = 0;

            if (keyResults.length > 0) {
                const totalProgress = keyResults.reduce((sum, kr) => {
                    let krProgress = kr.progress || 0;
                    // If KR is linked to a KPI, calculate from actual/target
                    if (kr.kpis?.length > 0) {
                        const kpi = kr.kpis[0];
                        if (kpi.target > 0 && kpi.actual !== null) {
                            krProgress = Math.min(100, Math.round((kpi.actual / kpi.target) * 100));
                        }
                    }
                    return sum + krProgress;
                }, 0);
                calculatedProgress = Math.round(totalProgress / keyResults.length);
            } else {
                calculatedProgress = obj.progress || 0;
            }

            return {
                ...obj,
                calculatedProgress,
                keyResultsCount: keyResults.length,
                completedCount: keyResults.filter(kr => (kr.progress || 0) >= 100).length
            };
        });

        // Stats
        const totalObjectives = withProgress.length;
        const totalKRs = withProgress.reduce((sum, o) => sum + o.keyResultsCount, 0);
        const avgProgress = totalObjectives > 0
            ? Math.round(withProgress.reduce((sum, o) => sum + o.calculatedProgress, 0) / totalObjectives)
            : 0;

        res.json({
            objectives: withProgress,
            stats: {
                totalObjectives,
                totalKeyResults: totalKRs,
                averageProgress: avgProgress,
                completedObjectives: withProgress.filter(o => o.calculatedProgress >= 100).length
            }
        });
    } catch (error) {
        console.error('Error fetching OKRs:', error);
        res.status(500).json({ error: 'Failed to fetch OKRs' });
    }
});

// Create Objective with Key Results
router.post('/', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { versionId, title, description, quarter, deadline, ownerId, keyResults } = req.body;

        if (!versionId || !title) {
            return res.status(400).json({ error: 'versionId and title are required' });
        }

        // Create the Objective
        const objective = await prisma.strategicObjective.create({
            data: {
                versionId,
                title,
                description: description || null,
                framework: 'OKR',
                quarter: quarter || null,
                deadline: deadline ? new Date(deadline) : null,
                ownerId: ownerId || null,
                progress: 0,
                status: 'DRAFT'
            }
        });

        // Create Key Results as child objectives
        if (keyResults && keyResults.length > 0) {
            for (const kr of keyResults) {
                const keyResult = await prisma.strategicObjective.create({
                    data: {
                        versionId,
                        parentId: objective.id,
                        title: kr.title,
                        description: kr.description || null,
                        framework: 'OKR',
                        quarter: quarter || null,
                        baselineValue: kr.baselineValue ? parseFloat(kr.baselineValue) : null,
                        targetValue: kr.targetValue ? parseFloat(kr.targetValue) : null,
                        deadline: deadline ? new Date(deadline) : null,
                        ownerId: kr.ownerId || ownerId || null,
                        progress: 0,
                        status: 'DRAFT'
                    }
                });

                // Link to existing KPI if specified
                if (kr.kpiId) {
                    await prisma.kPI.update({
                        where: { id: kr.kpiId },
                        data: { objectiveId: keyResult.id }
                    });
                }
            }
        }

        // Fetch the complete objective with key results
        const full = await prisma.strategicObjective.findUnique({
            where: { id: objective.id },
            include: {
                children: {
                    include: { kpis: true },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        res.status(201).json(full);
    } catch (error) {
        console.error('Error creating OKR:', error);
        res.status(500).json({ error: 'Failed to create OKR' });
    }
});

// Update progress for a Key Result
router.patch('/:id/progress', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { id } = req.params;
        const { progress, status } = req.body;

        const existing = await prisma.strategicObjective.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Key Result not found' });
        }

        const updateData = {};
        if (progress !== undefined) {
            updateData.progress = parseFloat(progress);
            // Auto-update status based on progress
            if (parseFloat(progress) >= 100) updateData.status = 'COMPLETED';
            else if (parseFloat(progress) > 0) updateData.status = 'IN_PROGRESS';
        }
        if (status) updateData.status = status;

        const updated = await prisma.strategicObjective.update({
            where: { id },
            data: updateData
        });

        // If this is a key result, update parent objective's progress
        if (updated.parentId) {
            const siblings = await prisma.strategicObjective.findMany({
                where: { parentId: updated.parentId },
                include: {
                    kpis: { select: { actual: true, target: true } }
                }
            });

            const totalProgress = siblings.reduce((sum, kr) => {
                let krProgress = kr.progress || 0;
                if (kr.kpis?.length > 0) {
                    const kpi = kr.kpis[0];
                    if (kpi.target > 0 && kpi.actual !== null) {
                        krProgress = Math.min(100, Math.round((kpi.actual / kpi.target) * 100));
                    }
                }
                return sum + krProgress;
            }, 0);

            const avgProgress = Math.round(totalProgress / siblings.length);

            await prisma.strategicObjective.update({
                where: { id: updated.parentId },
                data: {
                    progress: avgProgress,
                    status: avgProgress >= 100 ? 'COMPLETED' : avgProgress > 0 ? 'IN_PROGRESS' : 'DRAFT'
                }
            });
        }

        res.json(updated);
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Update OKR
router.patch('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, quarter, deadline, ownerId, status, baselineValue, targetValue } = req.body;

        const existing = await prisma.strategicObjective.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'OKR not found' });
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (quarter) updateData.quarter = quarter;
        if (deadline) updateData.deadline = new Date(deadline);
        if (ownerId !== undefined) updateData.ownerId = ownerId;
        if (status) updateData.status = status;
        if (baselineValue !== undefined) updateData.baselineValue = parseFloat(baselineValue);
        if (targetValue !== undefined) updateData.targetValue = parseFloat(targetValue);

        const updated = await prisma.strategicObjective.update({
            where: { id },
            data: updateData,
            include: {
                children: { include: { kpis: true } }
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating OKR:', error);
        res.status(500).json({ error: 'Failed to update OKR' });
    }
});

// Delete OKR (and its key results)
router.delete('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const existing = await prisma.strategicObjective.findUnique({
            where: { id: req.params.id },
            include: { children: true }
        });
        if (!existing) {
            return res.status(404).json({ error: 'OKR not found' });
        }

        // Delete children first
        if (existing.children.length > 0) {
            await prisma.strategicObjective.deleteMany({
                where: { parentId: existing.id }
            });
        }

        await prisma.strategicObjective.delete({ where: { id: req.params.id } });
        res.json({ message: 'OKR deleted successfully' });
    } catch (error) {
        console.error('Error deleting OKR:', error);
        res.status(500).json({ error: 'Failed to delete OKR' });
    }
});

// Get KPIs available for linking
router.get('/:versionId/available-kpis', verifyToken, async (req, res) => {
    try {
        const kpis = await prisma.kPI.findMany({
            where: {
                versionId: req.params.versionId,
                objectiveId: null // only unlinked KPIs
            },
            select: { id: true, name: true, nameAr: true, target: true, actual: true, unit: true, status: true }
        });
        res.json({ kpis });
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({ error: 'Failed to fetch KPIs' });
    }
});

module.exports = router;
