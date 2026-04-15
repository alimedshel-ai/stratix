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

// ============================================================
// POST /api/strategic/objectives/approve/:dept
// ✅ اعتماد مسودة الأهداف وتحويلها لأهداف استراتيجية حقيقية
// ============================================================
const PERSPECTIVE_MAP = {
    financial: 'FINANCIAL',
    customer: 'CUSTOMER',
    internal: 'INTERNAL_PROCESS',
    learning: 'LEARNING_GROWTH'
};

router.post('/approve/:dept', verifyToken, async (req, res) => {
    try {
        const dept = req.params.dept.toUpperCase();
        const entityId = req.user.activeEntityId || req.user.entityId;

        if (!entityId) {
            return res.status(400).json({ error: 'لم يتم تحديد الكيان' });
        }

        // 1. العثور على النسخة النشطة — أو إنشاء واحدة تلقائياً
        let activeVersion = await prisma.strategyVersion.findFirst({
            where: { entityId, isActive: true },
            select: { id: true }
        });
        if (!activeVersion) {
            // إنشاء نسخة استراتيجية أولية تلقائياً (للمدير المستقل وغيره)
            activeVersion = await prisma.strategyVersion.create({
                data: {
                    entityId,
                    versionNumber: 1,
                    name: 'الخطة الاستراتيجية الأولى',
                    status: 'ACTIVE',
                    isActive: true,
                    createdBy: req.user.id,
                    activatedAt: new Date()
                },
                select: { id: true }
            });
        }
        const versionId = activeVersion.id;

        // 2. جلب المسودة من DepartmentAnalysis
        const draftRec = await prisma.departmentAnalysis.findUnique({
            where: {
                entityId_department_type: { entityId, department: dept, type: 'OBJECTIVES' }
            }
        });

        if (!draftRec || !draftRec.data) {
            return res.status(404).json({ error: 'لا توجد مسودة أهداف لهذا القسم' });
        }

        let drafts = [];
        try {
            drafts = JSON.parse(draftRec.data);
            if (!Array.isArray(drafts)) drafts = [];
        } catch {
            return res.status(400).json({ error: 'بيانات المسودة تالفة' });
        }
        if (drafts.length === 0) {
            return res.status(400).json({ error: 'مسودة الأهداف فارغة' });
        }

        // 3. حذف الأهداف القديمة المولّدة تلقائياً لهذا القسم (منع التكرار)
        await prisma.strategicObjective.deleteMany({
            where: {
                versionId,
                status: 'DRAFT',
                description: { contains: dept }
            }
        });

        // 4. إنشاء الأهداف الجديدة (upsert بالعنوان)
        const results = [];
        const processedTitles = new Set();

        for (const obj of drafts) {
            const title = (obj.title || 'هدف غير مسمى').trim();
            if (processedTitles.has(title)) continue;
            processedTitles.add(title);

            const perspective = PERSPECTIVE_MAP[obj.perspective] || obj.perspective || 'INTERNAL_PROCESS';

            const existing = await prisma.strategicObjective.findFirst({
                where: { versionId, title }
            });

            let record;
            if (existing) {
                record = await prisma.strategicObjective.update({
                    where: { id: existing.id },
                    data: {
                        perspective,
                        description: obj.description || `معتمد من قسم ${dept}`,
                        status: 'APPROVED',
                        weight: obj.weight ? parseFloat(obj.weight) : 1.0,
                        progress: 0
                    }
                });
            } else {
                record = await prisma.strategicObjective.create({
                    data: {
                        versionId,
                        title,
                        perspective,
                        description: obj.description || `معتمد من قسم ${dept}`,
                        status: 'APPROVED',
                        weight: obj.weight ? parseFloat(obj.weight) : 1.0,
                        progress: 0
                    }
                });
            }
            results.push(record);
        }

        // 5. تحديث المسودة بعلامة الاعتماد
        await prisma.departmentAnalysis.update({
            where: { id: draftRec.id },
            data: {
                data: JSON.stringify(drafts.map(o => ({ ...o, _approved: true, _approvedAt: new Date().toISOString() })))
            }
        });

        res.json({
            success: true,
            count: results.length,
            message: `تم اعتماد ${results.length} هدف استراتيجي بنجاح`
        });

    } catch (error) {
        console.error('Error approving objectives:', error);
        res.status(500).json({ error: 'فشل اعتماد الأهداف', details: error.message });
    }
});

module.exports = router;