/**
 * middleware/enforce-limits.js — فرض حدود الباقة على مستوى Backend
 * 
 * الاستخدام:
 *   const enforceLimit = require('../middleware/enforce-limits');
 *   router.post('/', requireAuth, enforceLimit('maxKpis'), controller);
 * 
 * المسار: Entity → Company → Subscription → plan → PLAN_LIMITS
 */

const prisma = require('../lib/prisma');
const { PLAN_LIMITS, RESOURCE_LABELS } = require('../config/plans');

/**
 * خريطة العلاقة بين نوع المورد والعدّاد الفعلي في Prisma
 * كل مورد يحتاج: model (اسم الـ model في Prisma) + whereField (الحقل المستخدم للفلترة)
 */
const RESOURCE_COUNTERS = {
    maxUsers: {
        count: (entityId) => prisma.member.count({ where: { entityId } }),
    },
    maxObjectives: {
        count: async (entityId) => {
            const version = await prisma.strategyVersion.findFirst({
                where: { entityId, isActive: true },
                select: { id: true }
            });
            if (!version) return 0;
            return prisma.strategicObjective.count({ where: { versionId: version.id } });
        },
    },
    maxKpis: {
        count: async (entityId) => {
            const version = await prisma.strategyVersion.findFirst({
                where: { entityId, isActive: true },
                select: { id: true }
            });
            if (!version) return 0;
            return prisma.kPI.count({ where: { versionId: version.id } });
        },
    },
    maxInitiatives: {
        count: async (entityId) => {
            const version = await prisma.strategyVersion.findFirst({
                where: { entityId, isActive: true },
                select: { id: true }
            });
            if (!version) return 0;
            return prisma.strategicInitiative.count({ where: { versionId: version.id } });
        },
    },
    maxAssessments: {
        count: (entityId) => prisma.assessment.count({ where: { entityId } }),
    },
    maxEntities: {
        // خاص: يعدّ كيانات الشركة مش الكيان الواحد
        count: async (entityId) => {
            const entity = await prisma.entity.findUnique({
                where: { id: entityId },
                select: { companyId: true }
            });
            if (!entity?.companyId) return 0;
            return prisma.entity.count({ where: { companyId: entity.companyId } });
        },
    },
    maxIntegrations: {
        count: (entityId) => prisma.integration.count({ where: { entityId } }),
    },
};

/**
 * Middleware Factory: ينتج middleware يفحص حد مورد معيّن
 * @param {string} resourceType - نوع المورد (مفتاح من PLAN_LIMITS مثل 'maxKpis')
 */
const enforceLimit = (resourceType) => {
    return async (req, res, next) => {
        try {
            // 1. استخلاص entityId من الطلب (عدة مسارات)
            let entityId = req.body.entityId || req.params.entityId || req.query.entityId;

            // مسار ثاني: إذا أرسل versionId نستخلص entityId منه
            if (!entityId && (req.body.versionId || req.params.versionId)) {
                try {
                    const version = await prisma.strategyVersion.findUnique({
                        where: { id: req.body.versionId || req.params.versionId },
                        select: { entityId: true }
                    });
                    if (version) entityId = version.entityId;
                } catch (e) { /* ignore */ }
            }

            // مسار ثالث: من الـ token/session
            if (!entityId) entityId = req.user?.activeEntityId || req.user?.entityId;

            if (!entityId) {
                // إذا ما فيه entityId === SuperAdmin أو endpoint عام → نمرّر
                if (req.user?.systemRole === 'SUPER_ADMIN' || req.user?.isSuperAdmin) return next();
                return res.status(400).json({
                    success: false,
                    error: 'معرّف الكيان (entityId) مطلوب',
                });
            }

            // 2. SuperAdmin يتخطى كل الحدود
            if (req.user?.systemRole === 'SUPER_ADMIN' || req.user?.isSuperAdmin) return next();

            // 3. جلب الباقة عبر: Entity → Company → Subscription
            const entity = await prisma.entity.findUnique({
                where: { id: entityId },
                select: {
                    id: true,
                    companyId: true,
                    company: {
                        select: {
                            subscription: {
                                select: { plan: true, status: true, endDate: true }
                            }
                        }
                    }
                }
            });

            if (!entity) {
                return res.status(404).json({ success: false, error: 'الكيان غير موجود' });
            }

            const subscription = entity.company?.subscription;
            const plan = subscription?.plan || 'TRIAL';

            // 4. التحقق من صلاحية الاشتراك
            if (subscription?.status === 'EXPIRED' || subscription?.status === 'CANCELLED') {
                return res.status(403).json({
                    success: false,
                    errorCode: 'SUBSCRIPTION_EXPIRED',
                    message: 'اشتراكك منتهي — يرجى التجديد للاستمرار',
                    upgradeUrl: '/pricing.html',
                });
            }

            if (subscription?.endDate && new Date(subscription.endDate) < new Date()) {
                return res.status(403).json({
                    success: false,
                    errorCode: 'SUBSCRIPTION_EXPIRED',
                    message: 'اشتراكك منتهي — يرجى التجديد للاستمرار',
                    upgradeUrl: '/pricing.html',
                });
            }

            // 5. جلب حد المورد من خريطة الباقات
            const planLimits = PLAN_LIMITS[plan];
            if (!planLimits) {
                console.warn(`[enforce-limits] Unknown plan: ${plan}, defaulting to TRIAL`);
            }
            const limit = (planLimits || PLAN_LIMITS.TRIAL)[resourceType];

            if (limit === undefined) {
                console.error(`[enforce-limits] Unknown resource type: ${resourceType}`);
                return next(); // لا نوقف الطلب بسبب مورد غير معرّف
            }

            // 6. لا محدود → نمرّر
            if (limit === Infinity) {
                req.planInfo = { plan, limit: Infinity, currentCount: 0 };
                return next();
            }

            // 7. حساب الاستهلاك الحالي
            const counter = RESOURCE_COUNTERS[resourceType];
            if (!counter) {
                console.warn(`[enforce-limits] No counter for: ${resourceType}`);
                return next();
            }

            const currentCount = await counter.count(entityId);

            // 8. التحقق من الحد
            if (currentCount >= limit) {
                const label = RESOURCE_LABELS[resourceType] || resourceType;
                return res.status(403).json({
                    success: false,
                    errorCode: 'PLAN_LIMIT_REACHED',
                    message: `وصلت للحد الأقصى من ${label} (${limit}) في باقة ${plan}`,
                    upgradeUrl: `/pricing.html?highlight=${plan}&resource=${resourceType}`,
                    details: {
                        resource: resourceType,
                        resourceLabel: label,
                        currentUsage: currentCount,
                        limit,
                        plan,
                        entityId,
                    },
                });
            }

            // 9. تمرير البيانات للـ controller
            req.planInfo = { plan, limit, currentCount, remaining: limit - currentCount };
            next();

        } catch (error) {
            console.error(`[enforce-limits] Error checking ${resourceType}:`, error.message);
            // في حالة خطأ — نمرّر (fail-open) حتى لا نعطّل الخدمة
            next();
        }
    };
};

module.exports = enforceLimit;
