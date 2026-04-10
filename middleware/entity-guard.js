const prisma = require('../lib/prisma');

/**
 * Entity Guard — حماية عزل البيانات بين المنشآت (Multi-tenant Isolation)
 *
 * يتحقق إن المستخدم عضو فعلي في الـ entity المطلوب.
 * يمنع أي مستخدم من الوصول لبيانات منشأة غير منشأته.
 *
 * الاستخدام:
 *   router.get('/:entityId', verifyToken, entityGuard('entityId'), handler)
 *   router.get('/:departmentId/data', verifyToken, deptGuard('departmentId'), handler)
 */

/**
 * حماية على مستوى Entity — يتحقق من العضوية
 * @param {string} paramName - اسم الـ param اللي فيه entityId (افتراضي: 'entityId')
 */
function entityGuard(paramName = 'entityId') {
    return async (req, res, next) => {
        try {
            // Super Admin يتجاوز الحماية
            if (req.user?.systemRole === 'SUPER_ADMIN') return next();

            const requestedEntityId = req.params[paramName] || req.query[paramName] || req.body?.[paramName];
            if (!requestedEntityId) return next(); // لا يوجد entityId — يمر (الفلترة تتم بالـ controller)

            const userEntityId = req.user?.activeEntityId || req.user?.entityId;

            // تحقق سريع: إذا نفس الـ entity → يمر
            if (userEntityId === requestedEntityId) return next();

            // تحقق عميق: هل عنده membership في هالـ entity؟
            const membership = await prisma.member.findFirst({
                where: {
                    userId: req.user.id,
                    entityId: requestedEntityId
                },
                select: { id: true, role: true }
            });

            if (!membership) {
                console.warn(`🚨 [Entity Guard] BLOCKED: User ${req.user.id} tried to access entity ${requestedEntityId}`);
                return res.status(403).json({ error: 'غير مصرح لك بالوصول لبيانات هذه المنشأة' });
            }

            // حقن بيانات العضوية للـ controller
            req.entityMembership = membership;
            next();
        } catch (err) {
            console.error('[Entity Guard] Error:', err);
            res.status(500).json({ error: 'خطأ في التحقق من صلاحيات الوصول' });
        }
    };
}

/**
 * حماية على مستوى Department — يتحقق إن القسم يتبع لمنشأة المستخدم
 * @param {string} paramName - اسم الـ param اللي فيه departmentId (افتراضي: 'departmentId')
 */
function deptGuard(paramName = 'departmentId') {
    return async (req, res, next) => {
        try {
            if (req.user?.systemRole === 'SUPER_ADMIN') return next();

            const deptId = req.params[paramName];
            if (!deptId) return next();

            const userEntityId = req.user?.activeEntityId || req.user?.entityId;
            if (!userEntityId) {
                return res.status(403).json({ error: 'مستخدم غير مرتبط بمنشأة' });
            }

            // تحقق إن القسم يتبع لمنشأة المستخدم
            const dept = await prisma.department.findUnique({
                where: { id: deptId },
                select: { entityId: true }
            });

            if (!dept) {
                return res.status(404).json({ error: 'القسم غير موجود' });
            }

            if (dept.entityId !== userEntityId) {
                // تحقق عميق: ممكن يكون عضو في منشأة ثانية
                const membership = await prisma.member.findFirst({
                    where: { userId: req.user.id, entityId: dept.entityId },
                    select: { id: true }
                });

                if (!membership) {
                    console.warn(`🚨 [Dept Guard] BLOCKED: User ${req.user.id} tried to access dept ${deptId} (entity: ${dept.entityId})`);
                    return res.status(403).json({ error: 'غير مصرح لك بالوصول لبيانات هذا القسم' });
                }
            }

            next();
        } catch (err) {
            console.error('[Dept Guard] Error:', err);
            res.status(500).json({ error: 'خطأ في التحقق من صلاحيات الوصول' });
        }
    };
}

module.exports = { entityGuard, deptGuard };
