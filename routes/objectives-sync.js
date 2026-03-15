const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// POST /api/strategic/objectives/auto-generate
// 🎯 المرحلة 3: التوريث التلقائي للأهداف والمؤشرات (DRAFT)
// ============================================================
router.post('/auto-generate', verifyToken, async (req, res) => {
    try {
        const { sourceDept, objectives } = req.body;
        const entityId = req.user.activeEntityId;

        if (!entityId || !objectives || !Array.isArray(objectives)) {
            return res.status(400).json({ error: 'entityId and objectives array are required' });
        }

        // حماية الأداء: حد أقصى للمصفوفة
        if (objectives.length > 20) {
            return res.status(400).json({ error: 'الحد الأقصى 20 هدفاً في كل طلب' });
        }

        // حماية الصلاحيات: التأكد من عضوية المستخدم الفعلي في الكيان (أو كونه مدير نظام)
        const membership = await prisma.member.findFirst({
            where: { entityId, userId: req.user.id }
        });
        if (!membership && req.user.systemRole !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'غير مصرح لك بالإضافة في هذا الكيان' });
        }

        // Get active strategy version
        const activeVersion = await prisma.strategyVersion.findFirst({
            where: { entityId, isActive: true },
            select: { id: true }
        });

        if (!activeVersion) {
            return res.status(404).json({ error: 'لا يوجد إصدار استراتيجي نشط للكيان' });
        }

        const createdObjectives = [];

        // Transaction for atomicity
        await prisma.$transaction(async (tx) => {
            for (const obj of objectives) {
                const newObj = await tx.strategicObjective.create({
                    data: {
                        versionId: activeVersion.id,
                        title: obj.title,
                        perspective: obj.perspective || 'INTERNAL_PROCESS',
                        status: 'DRAFT', // ✨ إنشاء كمسودة (Draft)
                        progress: 0,
                        description: `تم توليده تلقائياً من فحص إدارة: ${sourceDept}`,
                    }
                });

                // Create associated KPIs if provided
                if (obj.kpis && Array.isArray(obj.kpis)) {
                    for (const kpi of obj.kpis) {
                        await tx.kPI.create({
                            data: {
                                versionId: activeVersion.id,
                                objectiveId: newObj.id,
                                name: kpi.name,
                                target: parseFloat(kpi.target) || 0,
                                unit: kpi.unit || null,
                                status: 'DRAFT', // ✨ مسودة
                                actual: 0,
                            }
                        });
                    }
                }
                createdObjectives.push(newObj);
            }
        });

        res.status(201).json({ success: true, objectives: createdObjectives });
    } catch (error) {
        console.error('Error auto-generating objectives:', error);
        res.status(500).json({ error: 'Failed to auto-generate objectives' });
    }
});

module.exports = router;