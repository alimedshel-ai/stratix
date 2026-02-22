/**
 * =========================================
 * Stakeholders API — أصحاب المصلحة
 * CRUD + ربط بالمخاطر + مصفوفة القوة/الاهتمام
 * =========================================
 */
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// ============ CRUD: أصحاب المصلحة ============

/**
 * GET /api/stakeholders
 * قائمة أصحاب المصلحة — مع فلترة + pagination
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 50, search, type, strategy, position } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const entityId = req.user.activeEntityId;

        if (!entityId) {
            return res.status(400).json({ error: 'No active entity selected' });
        }

        let where = { entityId };

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { role: { contains: search } },
                { needs: { contains: search } }
            ];
        }

        if (type) where.type = type;
        if (strategy) where.strategy = strategy;
        if (position) where.position = position;

        const [stakeholders, total] = await Promise.all([
            prisma.stakeholder.findMany({
                where,
                include: {
                    risks: {
                        include: {
                            risk: {
                                select: {
                                    id: true,
                                    title: true,
                                    probabilityScore: true,
                                    impactScore: true,
                                    riskScore: true,
                                    status: true,
                                    category: true,
                                }
                            }
                        }
                    },
                    _count: { select: { risks: true } }
                },
                skip,
                take: parseInt(limit),
                orderBy: [{ influence: 'desc' }, { interest: 'desc' }]
            }),
            prisma.stakeholder.count({ where })
        ]);

        res.json({
            stakeholders,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching stakeholders:', error);
        res.status(500).json({ error: 'Failed to fetch stakeholders' });
    }
});

/**
 * GET /api/stakeholders/matrix
 * بيانات مصفوفة القوة/الاهتمام للعرض البصري
 */
router.get('/matrix', verifyToken, async (req, res) => {
    try {
        const entityId = req.user.activeEntityId;
        if (!entityId) {
            return res.status(400).json({ error: 'No active entity selected' });
        }

        const stakeholders = await prisma.stakeholder.findMany({
            where: { entityId },
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
                _count: { select: { risks: true } }
            },
            orderBy: [{ influence: 'desc' }, { interest: 'desc' }]
        });

        // حساب إحصائيات المصفوفة
        const matrix = {
            manage: stakeholders.filter(s => s.influence >= 4 && s.interest >= 4),     // قوة عالية + اهتمام عالي
            satisfy: stakeholders.filter(s => s.influence >= 4 && s.interest < 4),     // قوة عالية + اهتمام منخفض
            inform: stakeholders.filter(s => s.influence < 4 && s.interest >= 4),      // قوة منخفضة + اهتمام عالي
            monitor: stakeholders.filter(s => s.influence < 4 && s.interest < 4),      // قوة منخفضة + اهتمام منخفض
        };

        const stats = {
            total: stakeholders.length,
            byType: {
                INTERNAL: stakeholders.filter(s => s.type === 'INTERNAL').length,
                EXTERNAL: stakeholders.filter(s => s.type === 'EXTERNAL').length,
                REGULATOR: stakeholders.filter(s => s.type === 'REGULATOR').length,
                PARTNER: stakeholders.filter(s => s.type === 'PARTNER').length,
                COMPETITOR: stakeholders.filter(s => s.type === 'COMPETITOR').length,
                COMMUNITY: stakeholders.filter(s => s.type === 'COMMUNITY').length,
            },
            byPosition: {
                SUPPORTIVE: stakeholders.filter(s => s.position === 'SUPPORTIVE').length,
                NEUTRAL: stakeholders.filter(s => s.position === 'NEUTRAL').length,
                RESISTANT: stakeholders.filter(s => s.position === 'RESISTANT').length,
            },
            byStrategy: {
                manage: matrix.manage.length,
                satisfy: matrix.satisfy.length,
                inform: matrix.inform.length,
                monitor: matrix.monitor.length,
            },
            avgEngagement: stakeholders.length > 0
                ? Math.round(stakeholders.reduce((sum, s) => sum + s.engagement, 0) / stakeholders.length)
                : 0,
            totalRisks: stakeholders.reduce((sum, s) => sum + s._count.risks, 0),
        };

        res.json({ stakeholders, matrix, stats });
    } catch (error) {
        console.error('Error fetching stakeholder matrix:', error);
        res.status(500).json({ error: 'Failed to fetch stakeholder matrix' });
    }
});

/**
 * GET /api/stakeholders/stats
 * إحصائيات سريعة
 */
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const entityId = req.user.activeEntityId;
        if (!entityId) {
            return res.status(400).json({ error: 'No active entity selected' });
        }

        const stakeholders = await prisma.stakeholder.findMany({
            where: { entityId },
            select: {
                type: true,
                influence: true,
                interest: true,
                strategy: true,
                position: true,
                engagement: true,
                _count: { select: { risks: true } }
            }
        });

        res.json({
            total: stakeholders.length,
            manage: stakeholders.filter(s => s.influence >= 4 && s.interest >= 4).length,
            supportive: stakeholders.filter(s => s.position === 'SUPPORTIVE').length,
            avgEngagement: stakeholders.length > 0
                ? Math.round(stakeholders.reduce((sum, s) => sum + s.engagement, 0) / stakeholders.length)
                : 0,
            withRisks: stakeholders.filter(s => s._count.risks > 0).length,
        });
    } catch (error) {
        console.error('Error fetching stakeholder stats:', error);
        res.status(500).json({ error: 'Failed to fetch stakeholder stats' });
    }
});

/**
 * GET /api/stakeholders/:id
 * تفاصيل صاحب مصلحة مع مخاطره
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const stakeholder = await prisma.stakeholder.findUnique({
            where: { id: req.params.id },
            include: {
                entity: { select: { id: true, legalName: true, displayName: true } },
                risks: {
                    include: {
                        risk: {
                            select: {
                                id: true,
                                title: true,
                                description: true,
                                probabilityScore: true,
                                impactScore: true,
                                riskScore: true,
                                status: true,
                                category: true,
                                mitigation: true,
                                owner: true,
                            }
                        }
                    }
                }
            }
        });

        if (!stakeholder) {
            return res.status(404).json({ error: 'Stakeholder not found' });
        }

        res.json(stakeholder);
    } catch (error) {
        console.error('Error fetching stakeholder:', error);
        res.status(500).json({ error: 'Failed to fetch stakeholder' });
    }
});

/**
 * POST /api/stakeholders
 * إنشاء صاحب مصلحة جديد
 */
router.post('/', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const entityId = req.user.activeEntityId;
        if (!entityId) {
            return res.status(400).json({ error: 'No active entity selected' });
        }

        const {
            name, role, type,
            influence, interest, strategy,
            position, engagement,
            needs, expectations, contactInfo,
            color
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // حساب الاستراتيجية التلقائية إذا لم تُحدد
        const inf = influence ? parseInt(influence) : 3;
        const int = interest ? parseInt(interest) : 3;
        let autoStrategy = strategy;
        if (!autoStrategy) {
            if (inf >= 4 && int >= 4) autoStrategy = 'manage';
            else if (inf >= 4 && int < 4) autoStrategy = 'satisfy';
            else if (inf < 4 && int >= 4) autoStrategy = 'inform';
            else autoStrategy = 'monitor';
        }

        const stakeholder = await prisma.stakeholder.create({
            data: {
                entityId,
                name,
                role: role || null,
                type: type || 'EXTERNAL',
                influence: inf,
                interest: int,
                strategy: autoStrategy,
                position: position || 'NEUTRAL',
                engagement: engagement ? parseInt(engagement) : 50,
                needs: needs || null,
                expectations: expectations || null,
                contactInfo: contactInfo || null,
                color: color || null,
                createdBy: req.user.id || null,
            },
            include: {
                entity: { select: { id: true, legalName: true } },
                _count: { select: { risks: true } }
            }
        });

        res.status(201).json(stakeholder);
    } catch (error) {
        console.error('Error creating stakeholder:', error);
        res.status(500).json({ error: 'Failed to create stakeholder' });
    }
});

/**
 * PATCH /api/stakeholders/:id
 * تعديل صاحب مصلحة
 */
router.patch('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const existing = await prisma.stakeholder.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Stakeholder not found' });
        }

        const {
            name, role, type,
            influence, interest, strategy,
            position, engagement,
            needs, expectations, contactInfo, lastContactAt,
            meetingsCount, color
        } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (role !== undefined) updateData.role = role || null;
        if (type) updateData.type = type;
        if (influence !== undefined) updateData.influence = parseInt(influence);
        if (interest !== undefined) updateData.interest = parseInt(interest);
        if (strategy) updateData.strategy = strategy;
        if (position) updateData.position = position;
        if (engagement !== undefined) updateData.engagement = parseInt(engagement);
        if (needs !== undefined) updateData.needs = needs || null;
        if (expectations !== undefined) updateData.expectations = expectations || null;
        if (contactInfo !== undefined) updateData.contactInfo = contactInfo || null;
        if (lastContactAt !== undefined) updateData.lastContactAt = lastContactAt ? new Date(lastContactAt) : null;
        if (meetingsCount !== undefined) updateData.meetingsCount = parseInt(meetingsCount);
        if (color !== undefined) updateData.color = color || null;

        // إعادة حساب الاستراتيجية تلقائياً إذا تغيرت القوة أو الاهتمام
        if ((influence !== undefined || interest !== undefined) && !strategy) {
            const inf = updateData.influence !== undefined ? updateData.influence : existing.influence;
            const int = updateData.interest !== undefined ? updateData.interest : existing.interest;
            if (inf >= 4 && int >= 4) updateData.strategy = 'manage';
            else if (inf >= 4 && int < 4) updateData.strategy = 'satisfy';
            else if (inf < 4 && int >= 4) updateData.strategy = 'inform';
            else updateData.strategy = 'monitor';
        }

        const stakeholder = await prisma.stakeholder.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                entity: { select: { id: true, legalName: true } },
                risks: {
                    include: {
                        risk: { select: { id: true, title: true, riskScore: true, status: true } }
                    }
                },
                _count: { select: { risks: true } }
            }
        });

        res.json(stakeholder);
    } catch (error) {
        console.error('Error updating stakeholder:', error);
        res.status(500).json({ error: 'Failed to update stakeholder' });
    }
});

/**
 * DELETE /api/stakeholders/:id
 * حذف صاحب مصلحة (والارتباطات مع المخاطر)
 */
router.delete('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const existing = await prisma.stakeholder.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Stakeholder not found' });
        }

        await prisma.stakeholder.delete({ where: { id: req.params.id } });
        res.json({ message: 'Stakeholder deleted successfully' });
    } catch (error) {
        console.error('Error deleting stakeholder:', error);
        res.status(500).json({ error: 'Failed to delete stakeholder' });
    }
});

// ============ ربط المخاطر بأصحاب المصلحة ============

/**
 * POST /api/stakeholders/:id/risks
 * ربط خطر بصاحب مصلحة
 */
router.post('/:id/risks', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const { riskId, impactLevel, impactType, notes } = req.body;

        if (!riskId) {
            return res.status(400).json({ error: 'riskId is required' });
        }

        // التأكد من وجود صاحب المصلحة والخطر
        const [stakeholder, risk] = await Promise.all([
            prisma.stakeholder.findUnique({ where: { id: req.params.id } }),
            prisma.strategicRisk.findUnique({ where: { id: riskId } })
        ]);

        if (!stakeholder) return res.status(404).json({ error: 'Stakeholder not found' });
        if (!risk) return res.status(404).json({ error: 'Risk not found' });

        // التأكد من عدم وجود ربط سابق
        const existing = await prisma.stakeholderRisk.findUnique({
            where: { stakeholderId_riskId: { stakeholderId: req.params.id, riskId } }
        });
        if (existing) {
            return res.status(409).json({ error: 'This risk is already linked to this stakeholder' });
        }

        const link = await prisma.stakeholderRisk.create({
            data: {
                stakeholderId: req.params.id,
                riskId,
                impactLevel: impactLevel || 'MEDIUM',
                impactType: impactType || null,
                notes: notes || null,
            },
            include: {
                risk: { select: { id: true, title: true, riskScore: true, status: true, category: true } },
                stakeholder: { select: { id: true, name: true } }
            }
        });

        res.status(201).json(link);
    } catch (error) {
        console.error('Error linking risk to stakeholder:', error);
        res.status(500).json({ error: 'Failed to link risk to stakeholder' });
    }
});

/**
 * DELETE /api/stakeholders/:id/risks/:riskId
 * فك ربط خطر من صاحب مصلحة
 */
router.delete('/:id/risks/:riskId', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const existing = await prisma.stakeholderRisk.findUnique({
            where: { stakeholderId_riskId: { stakeholderId: req.params.id, riskId: req.params.riskId } }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Link not found' });
        }

        await prisma.stakeholderRisk.delete({
            where: { id: existing.id }
        });

        res.json({ message: 'Risk unlinked from stakeholder successfully' });
    } catch (error) {
        console.error('Error unlinking risk from stakeholder:', error);
        res.status(500).json({ error: 'Failed to unlink risk from stakeholder' });
    }
});

/**
 * GET /api/stakeholders/:id/risks
 * المخاطر المرتبطة بصاحب مصلحة معين
 */
router.get('/:id/risks', verifyToken, async (req, res) => {
    try {
        const stakeholder = await prisma.stakeholder.findUnique({
            where: { id: req.params.id },
            select: { id: true, name: true }
        });

        if (!stakeholder) {
            return res.status(404).json({ error: 'Stakeholder not found' });
        }

        const links = await prisma.stakeholderRisk.findMany({
            where: { stakeholderId: req.params.id },
            include: {
                risk: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        probabilityScore: true,
                        impactScore: true,
                        riskScore: true,
                        status: true,
                        category: true,
                        mitigation: true,
                        owner: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            stakeholder,
            risks: links.map(l => ({
                ...l.risk,
                impactLevel: l.impactLevel,
                impactType: l.impactType,
                linkNotes: l.notes,
                linkId: l.id,
            }))
        });
    } catch (error) {
        console.error('Error fetching stakeholder risks:', error);
        res.status(500).json({ error: 'Failed to fetch stakeholder risks' });
    }
});

module.exports = router;
