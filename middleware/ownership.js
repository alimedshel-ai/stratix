const prisma = require('../lib/prisma');

/**
 * درع حماية الملكية (Multi-tenant Isolation)
 * يتحقق من أن المورد المطلوب يتبع لنفس الكيان (Entity) الخاص بالمستخدم
 */
function checkOwnership(modelName, idParamName = 'id') {
    return async (req, res, next) => {
        try {
            // 1. السماح لمدير النظام (Super Admin) بتجاوز الحماية (لأغراض الدعم الفني)
            if (req.user?.systemRole === 'SUPER_ADMIN') {
                return next();
            }

            const userEntityId = req.user?.activeEntityId || req.user?.entityId;
            if (!userEntityId) {
                return res.status(403).json({ error: 'مستخدم غير مرتبط بكيان صالح' });
            }

            const resourceId = req.params[idParamName];

            // 2. معالجة طلبات الإنشاء (POST) — التحقق من أن النسخة تتبع لكيان المستخدم
            if (req.method === 'POST' && !resourceId) {
                const versionId = req.body.versionId || req.query.versionId;
                if (versionId) {
                    const version = await prisma.strategyVersion.findUnique({
                        where: { id: versionId },
                        select: { entityId: true }
                    });
                    if (!version || version.entityId !== userEntityId) {
                        return res.status(403).json({ error: 'غير مصرح لك بإضافة بيانات في هذه النسخة الاستراتيجية' });
                    }
                }
                return next();
            }

            // إذا لم يكن هناك ID في المسار (مثل GET /objectives الشاملة)، يتم الفلترة في الـ Controller
            if (!resourceId) return next();

            // 3. تتبع شجرة العلاقات للوصول إلى entityId حسب نوع المودل
            let includeQuery = { version: { select: { entityId: true } } };
            if (modelName === 'kPIEntry' || modelName === 'kpiDiagnosis') {
                includeQuery = { kpi: { include: { version: { select: { entityId: true } } } } };
            } else if (modelName === 'correctionAction') {
                includeQuery = { diagnosis: { include: { kpi: { include: { version: { select: { entityId: true } } } } } } };
            }

            const resource = await prisma[modelName].findUnique({
                where: { id: resourceId },
                include: includeQuery
            });

            // 4. المطابقة الأمنية
            if (!resource) {
                return res.status(404).json({ error: 'المورد غير موجود' });
            }

            let resourceEntityId;
            if (modelName === 'kPIEntry' || modelName === 'kpiDiagnosis') {
                resourceEntityId = resource.kpi?.version?.entityId;
            } else if (modelName === 'correctionAction') {
                resourceEntityId = resource.diagnosis?.kpi?.version?.entityId;
            } else {
                resourceEntityId = resource.version?.entityId;
            }

            if (resourceEntityId !== userEntityId) {
                console.warn(`🚨 [Security] IDOR attempt blocked: User ${req.user.id} tried to access ${modelName} ${resourceId}`);
                return res.status(403).json({ error: 'وصول غير مصرح: هذا العنصر يتبع لشركة أخرى' });
            }

            // حقن المورد في الطلب لتحسين الأداء (يمكن للـ Controller استخدامه بدلاً من إعادة البحث عنه)
            req.resource = resource;
            next();
        } catch (err) {
            console.error('[Ownership Guard] Error:', err);
            res.status(500).json({ error: 'خطأ في التحقق من أمن البيانات' });
        }
    };
}

module.exports = { checkOwnership };