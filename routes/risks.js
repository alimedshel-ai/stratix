/**
 * =========================================
 * Risks API — المخاطر الاستراتيجية (مستقل)
 * CRUD + خريطة حرارية + ربط بأصحاب المصلحة
 * =========================================
 * ملاحظة: يوجد routes أساسية للمخاطر في choices.js (كـ sub-resource)
 * هذا الملف يوفر واجهة مستقلة مخصصة لصفحة risk-map.html
 */
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// ============ CRUD: المخاطر ============

/**
 * GET /api/risks
 * قائمة المخاطر — مع فلترة + أصحاب المصلحة + pagination
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 100, search, category, status, minScore, maxScore, stakeholderId } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        // Filter by user's entity
        if (req.user.activeEntityId) {
            where.version = { entityId: req.user.activeEntityId };
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { mitigation: { contains: search } },
            ];
        }

        if (category) where.category = category;
        if (status) where.status = status;

        // Filter by stakeholder
        if (stakeholderId) {
            where.stakeholders = {
                some: { stakeholderId }
            };
        }

        const [risks, total] = await Promise.all([
            prisma.strategicRisk.findMany({
                where,
                include: {
                    choice: { select: { id: true, title: true } },
                    version: {
                        select: {
                            id: true,
                            versionNumber: true,
                            entity: { select: { id: true, legalName: true, displayName: true } }
                        }
                    },
                    stakeholders: {
                        include: {
                            stakeholder: {
                                select: {
                                    id: true,
                                    name: true,
                                    role: true,
                                    type: true,
                                    influence: true,
                                    interest: true,
                                    color: true,
                                }
                            }
                        }
                    },
                    _count: { select: { stakeholders: true } }
                },
                skip,
                take: parseInt(limit),
                orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }]
            }),
            prisma.strategicRisk.count({ where })
        ]);

        // Post-filter by score range (since Prisma w/ SQLite doesn't support computed fields well)
        let filteredRisks = risks;
        if (minScore) {
            filteredRisks = filteredRisks.filter(r => (r.riskScore || 0) >= parseInt(minScore));
        }
        if (maxScore) {
            filteredRisks = filteredRisks.filter(r => (r.riskScore || 0) <= parseInt(maxScore));
        }

        res.json({
            risks: filteredRisks,
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

/**
 * GET /api/risks/heatmap
 * بيانات الخريطة الحرارية — مُنظّمة حسب probability × impact
 */
router.get('/heatmap', verifyToken, async (req, res) => {
    try {
        let where = {};
        if (req.user.activeEntityId) {
            where.version = { entityId: req.user.activeEntityId };
        }

        const risks = await prisma.strategicRisk.findMany({
            where,
            select: {
                id: true,
                title: true,
                probabilityScore: true,
                impactScore: true,
                riskScore: true,
                status: true,
                category: true,
                _count: { select: { stakeholders: true } }
            }
        });

        // بناء مصفوفة 5×5
        const heatmap = {};
        for (let p = 1; p <= 5; p++) {
            for (let i = 1; i <= 5; i++) {
                heatmap[`${p}_${i}`] = [];
            }
        }

        risks.forEach(r => {
            const p = r.probabilityScore || 3; // default to middle
            const i = r.impactScore || 3;
            const key = `${Math.min(5, Math.max(1, p))}_${Math.min(5, Math.max(1, i))}`;
            heatmap[key].push(r);
        });

        // إحصائيات
        const stats = {
            total: risks.length,
            critical: risks.filter(r => (r.riskScore || 0) >= 16).length,
            high: risks.filter(r => { const s = r.riskScore || 0; return s >= 10 && s < 16; }).length,
            medium: risks.filter(r => { const s = r.riskScore || 0; return s >= 5 && s < 10; }).length,
            low: risks.filter(r => (r.riskScore || 0) < 5).length,
            byCategory: {},
            byStatus: {},
        };

        risks.forEach(r => {
            const cat = r.category || 'UNCATEGORIZED';
            stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
            stats.byStatus[r.status] = (stats.byStatus[r.status] || 0) + 1;
        });

        res.json({ heatmap, stats, risks });
    } catch (error) {
        console.error('Error fetching heatmap:', error);
        res.status(500).json({ error: 'Failed to fetch heatmap data' });
    }
});

/**
 * GET /api/risks/stats
 * إحصائيات سريعة للمخاطر
 */
router.get('/stats', verifyToken, async (req, res) => {
    try {
        let where = {};
        if (req.user.activeEntityId) {
            where.version = { entityId: req.user.activeEntityId };
        }

        const risks = await prisma.strategicRisk.findMany({
            where,
            select: {
                riskScore: true,
                status: true,
                category: true,
                _count: { select: { stakeholders: true } }
            }
        });

        res.json({
            total: risks.length,
            critical: risks.filter(r => (r.riskScore || 0) >= 16).length,
            high: risks.filter(r => { const s = r.riskScore || 0; return s >= 10 && s < 16; }).length,
            medium: risks.filter(r => { const s = r.riskScore || 0; return s >= 5 && s < 10; }).length,
            low: risks.filter(r => (r.riskScore || 0) < 5).length,
            open: risks.filter(r => r.status === 'OPEN' || r.status === 'IDENTIFIED').length,
            mitigated: risks.filter(r => r.status === 'MITIGATED' || r.status === 'MONITORING').length,
            closed: risks.filter(r => r.status === 'CLOSED').length,
            withStakeholders: risks.filter(r => r._count.stakeholders > 0).length,
        });
    } catch (error) {
        console.error('Error fetching risk stats:', error);
        res.status(500).json({ error: 'Failed to fetch risk stats' });
    }
});

/**
 * GET /api/risks/:id
 * تفاصيل خطر واحد مع أصحاب المصلحة
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const risk = await prisma.strategicRisk.findUnique({
            where: { id: req.params.id },
            include: {
                choice: { select: { id: true, title: true } },
                version: {
                    select: {
                        id: true,
                        versionNumber: true,
                        entity: { select: { id: true, legalName: true, displayName: true } }
                    }
                },
                stakeholders: {
                    include: {
                        stakeholder: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                                type: true,
                                influence: true,
                                interest: true,
                                position: true,
                                engagement: true,
                                color: true,
                            }
                        }
                    }
                }
            }
        });

        if (!risk) {
            return res.status(404).json({ error: 'Risk not found' });
        }

        res.json(risk);
    } catch (error) {
        console.error('Error fetching risk:', error);
        res.status(500).json({ error: 'Failed to fetch risk' });
    }
});

/**
 * POST /api/risks
 * إنشاء خطر جديد (مع ربط اختياري بأصحاب المصلحة)
 */
router.post('/', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const {
            title, description, versionId, choiceId,
            probability, impact, mitigation, owner, status,
            category, probabilityScore, impactScore, contingency,
            stakeholderIds  // ← مصفوفة اختيارية من IDs أصحاب المصلحة
        } = req.body;

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
                // ربط أصحاب المصلحة إذا وُجدوا
                stakeholders: stakeholderIds && stakeholderIds.length > 0
                    ? {
                        create: stakeholderIds.map(shId => ({
                            stakeholderId: shId,
                            impactLevel: 'MEDIUM',
                            impactType: 'AFFECTED_BY',
                        }))
                    }
                    : undefined,
            },
            include: {
                choice: { select: { id: true, title: true } },
                version: { select: { id: true, versionNumber: true } },
                stakeholders: {
                    include: {
                        stakeholder: { select: { id: true, name: true, color: true } }
                    }
                },
                _count: { select: { stakeholders: true } }
            }
        });

        res.status(201).json(risk);
    } catch (error) {
        console.error('Error creating risk:', error);
        res.status(500).json({ error: 'Failed to create risk' });
    }
});

/**
 * PATCH /api/risks/:id
 * تعديل خطر
 */
router.patch('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const existing = await prisma.strategicRisk.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Risk not found' });
        }

        const {
            title, description, probability, impact,
            mitigation, owner, status, choiceId,
            category, probabilityScore, impactScore, contingency
        } = req.body;

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
                version: { select: { id: true, versionNumber: true } },
                stakeholders: {
                    include: {
                        stakeholder: { select: { id: true, name: true, color: true } }
                    }
                },
                _count: { select: { stakeholders: true } }
            }
        });

        res.json(risk);
    } catch (error) {
        console.error('Error updating risk:', error);
        res.status(500).json({ error: 'Failed to update risk' });
    }
});

/**
 * DELETE /api/risks/:id
 * حذف خطر (والارتباطات مع أصحاب المصلحة)
 */
router.delete('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
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

// ============ ربط أصحاب المصلحة بالمخاطر (من جهة المخاطر) ============

/**
 * POST /api/risks/:id/stakeholders
 * ربط أصحاب مصلحة بخطر
 */
router.post('/:id/stakeholders', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { stakeholderId, impactLevel, impactType, notes } = req.body;

        if (!stakeholderId) {
            return res.status(400).json({ error: 'stakeholderId is required' });
        }

        const [risk, stakeholder] = await Promise.all([
            prisma.strategicRisk.findUnique({ where: { id: req.params.id } }),
            prisma.stakeholder.findUnique({ where: { id: stakeholderId } })
        ]);

        if (!risk) return res.status(404).json({ error: 'Risk not found' });
        if (!stakeholder) return res.status(404).json({ error: 'Stakeholder not found' });

        // Check existing link
        const existing = await prisma.stakeholderRisk.findUnique({
            where: { stakeholderId_riskId: { stakeholderId, riskId: req.params.id } }
        });
        if (existing) {
            return res.status(409).json({ error: 'This stakeholder is already linked to this risk' });
        }

        const link = await prisma.stakeholderRisk.create({
            data: {
                stakeholderId,
                riskId: req.params.id,
                impactLevel: impactLevel || 'MEDIUM',
                impactType: impactType || null,
                notes: notes || null,
            },
            include: {
                stakeholder: { select: { id: true, name: true, role: true, type: true, color: true } },
                risk: { select: { id: true, title: true } }
            }
        });

        res.status(201).json(link);
    } catch (error) {
        console.error('Error linking stakeholder to risk:', error);
        res.status(500).json({ error: 'Failed to link stakeholder to risk' });
    }
});

/**
 * GET /api/risks/:id/stakeholders
 * أصحاب المصلحة المرتبطين بخطر معين
 */
router.get('/:id/stakeholders', verifyToken, async (req, res) => {
    try {
        const risk = await prisma.strategicRisk.findUnique({
            where: { id: req.params.id },
            select: { id: true, title: true }
        });

        if (!risk) {
            return res.status(404).json({ error: 'Risk not found' });
        }

        const links = await prisma.stakeholderRisk.findMany({
            where: { riskId: req.params.id },
            include: {
                stakeholder: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        type: true,
                        influence: true,
                        interest: true,
                        strategy: true,
                        position: true,
                        engagement: true,
                        color: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            risk,
            stakeholders: links.map(l => ({
                ...l.stakeholder,
                impactLevel: l.impactLevel,
                impactType: l.impactType,
                linkNotes: l.notes,
                linkId: l.id,
            }))
        });
    } catch (error) {
        console.error('Error fetching risk stakeholders:', error);
        res.status(500).json({ error: 'Failed to fetch risk stakeholders' });
    }
});

/**
 * DELETE /api/risks/:id/stakeholders/:stakeholderId
 * فك ربط صاحب مصلحة من خطر
 */
router.delete('/:id/stakeholders/:stakeholderId', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const existing = await prisma.stakeholderRisk.findUnique({
            where: {
                stakeholderId_riskId: {
                    stakeholderId: req.params.stakeholderId,
                    riskId: req.params.id
                }
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Link not found' });
        }

        await prisma.stakeholderRisk.delete({ where: { id: existing.id } });
        res.json({ message: 'Stakeholder unlinked from risk successfully' });
    } catch (error) {
        console.error('Error unlinking stakeholder from risk:', error);
        res.status(500).json({ error: 'Failed to unlink stakeholder from risk' });
    }
});

/**
 * GET /api/risks/by-stakeholder/:stakeholderId
 * المخاطر المرتبطة بصاحب مصلحة (عرض من جهة المخاطر)
 */
router.get('/by-stakeholder/:stakeholderId', verifyToken, async (req, res) => {
    try {
        const links = await prisma.stakeholderRisk.findMany({
            where: { stakeholderId: req.params.stakeholderId },
            include: {
                risk: {
                    include: {
                        choice: { select: { id: true, title: true } },
                        _count: { select: { stakeholders: true } }
                    }
                },
                stakeholder: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            stakeholder: links[0]?.stakeholder || null,
            risks: links.map(l => ({
                ...l.risk,
                impactLevel: l.impactLevel,
                impactType: l.impactType,
            }))
        });
    } catch (error) {
        console.error('Error fetching risks by stakeholder:', error);
        res.status(500).json({ error: 'Failed to fetch risks by stakeholder' });
    }
});

module.exports = router;
