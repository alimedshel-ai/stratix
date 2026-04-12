/**
 * 🏢 Pro Entities API — إدارة عملاء المدير المستقل
 *
 * POST   /api/pro/entities          → إنشاء عميل جديد (entity + member)
 * GET    /api/pro/entities          → جلب كل عملاء المستخدم
 * PATCH  /api/pro/entities/:id/activate → تفعيل عميل كـ active
 */

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const MAX_CLIENTS = 10;

// ── POST /api/pro/entities — إنشاء عميل جديد ──
router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, sector, size, dept } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'اسم الشركة مطلوب' });
        }

        // التحقق من الحد الأقصى
        const count = await prisma.member.count({ where: { userId } });
        if (count >= MAX_CLIENTS) {
            return res.status(400).json({ success: false, message: `الحد الأقصى ${MAX_CLIENTS} عملاء` });
        }

        // إنشاء Entity
        const entity = await prisma.entity.create({
            data: {
                legalName: name.trim(),
                displayName: name.trim(),
                size: size || 'medium',
                sectorKey: sector || null,
                metadata: JSON.stringify({ createdBy: 'pro_manager', dept: dept || 'sales' })
            }
        });

        // إنشاء Member — ربط المستخدم بالعميل
        await prisma.member.create({
            data: {
                userId,
                entityId: entity.id,
                role: 'OWNER',
                userType: 'DEPT_MANAGER',
                departmentRole: (dept || 'sales').toUpperCase()
            }
        });

        res.json({
            success: true,
            entity: {
                id: entity.id,
                name: entity.legalName,
                size: entity.size,
                sector: entity.sectorKey,
                dept: dept || 'sales'
            }
        });

    } catch (err) {
        console.error('❌ [pro-entities] POST error:', err.message);
        res.status(500).json({ success: false, message: 'فشل إنشاء العميل' });
    }
});

// ── GET /api/pro/entities — جلب كل عملاء المستخدم ──
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const memberships = await prisma.member.findMany({
            where: { userId },
            include: {
                entity: {
                    select: {
                        id: true,
                        legalName: true,
                        displayName: true,
                        size: true,
                        sectorKey: true,
                        metadata: true,
                        createdAt: true
                    }
                }
            },
            orderBy: { joinedAt: 'desc' }
        });

        const clients = memberships.map(m => {
            let meta = {};
            try { meta = JSON.parse(m.entity.metadata || '{}'); } catch(e) {}
            return {
                id: m.entity.id,
                name: m.entity.displayName || m.entity.legalName,
                size: m.entity.size,
                sector: m.entity.sectorKey,
                dept: meta.dept || m.departmentRole?.toLowerCase() || 'sales',
                role: m.role,
                createdAt: m.entity.createdAt
            };
        });

        res.json({ success: true, clients });

    } catch (err) {
        console.error('❌ [pro-entities] GET error:', err.message);
        res.status(500).json({ success: false, message: 'فشل جلب العملاء' });
    }
});

// ── PATCH /api/pro/entities/:id/activate — تفعيل عميل ──
router.patch('/:id/activate', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const entityId = req.params.id;

        // التحقق من أن المستخدم عضو في هذا الـ entity (مع جلب بيانات الشركة)
        const membership = await prisma.member.findUnique({
            where: { userId_entityId: { userId, entityId } },
            include: {
                entity: {
                    select: { id: true, legalName: true, displayName: true }
                }
            }
        });

        if (!membership) {
            return res.status(403).json({ success: false, message: 'ليس لديك صلاحية على هذا العميل' });
        }

        // نرجع الـ entityId للفرونت ليحفظه في localStorage كسياق نشط
        res.json({
            success: true,
            activeEntityId: entityId,
            client: {
                id: entityId,
                name: membership.entity?.displayName || membership.entity?.legalName,
                dept: membership.departmentRole?.toLowerCase()
            }
        });

    } catch (err) {
        console.error('❌ [pro-entities] PATCH activate error:', err.message);
        res.status(500).json({ success: false, message: 'فشل تفعيل العميل' });
    }
});

// ── PATCH /api/pro/entities/:id — تعديل بيانات عميل ──
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const entityId = req.params.id;
        const { name, sector, size } = req.body;

        // التحقق من العضوية
        const membership = await prisma.member.findUnique({
            where: { userId_entityId: { userId, entityId } }
        });
        if (!membership) {
            return res.status(403).json({ success: false, message: 'ليس لديك صلاحية على هذا العميل' });
        }

        // تحديث البيانات
        const updateData = {};
        if (name && name.trim()) {
            updateData.legalName = name.trim();
            updateData.displayName = name.trim();
        }
        if (size) updateData.size = size;
        if (sector !== undefined) updateData.sectorKey = sector || null;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'لا توجد بيانات للتحديث' });
        }

        const updated = await prisma.entity.update({
            where: { id: entityId },
            data: updateData
        });

        res.json({
            success: true,
            entity: {
                id: updated.id,
                name: updated.displayName || updated.legalName,
                size: updated.size,
                sector: updated.sectorKey
            }
        });

    } catch (err) {
        console.error('❌ [pro-entities] PATCH error:', err.message);
        res.status(500).json({ success: false, message: 'فشل تحديث العميل' });
    }
});

// ── DELETE /api/pro/entities/:id — حذف عميل وبياناته ──
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const entityId = req.params.id;

        // التحقق من العضوية
        const membership = await prisma.member.findUnique({
            where: { userId_entityId: { userId, entityId } }
        });
        if (!membership) {
            return res.status(403).json({ success: false, message: 'ليس لديك صلاحية على هذا العميل' });
        }

        // التأكيد عبر query param
        if (req.query.confirm !== 'true') {
            return res.status(400).json({ success: false, message: 'أضف ?confirm=true للتأكيد — الحذف لا يمكن التراجع عنه' });
        }

        // حذف Entity (cascade يحذف Members + البيانات المرتبطة)
        await prisma.entity.delete({ where: { id: entityId } });

        res.json({ success: true, message: 'تم حذف العميل وجميع بياناته' });

    } catch (err) {
        console.error('❌ [pro-entities] DELETE error:', err.message);
        res.status(500).json({ success: false, message: 'فشل حذف العميل' });
    }
});

module.exports = router;
