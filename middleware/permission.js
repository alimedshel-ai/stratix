/**
 * Middleware: checkPermission
 * Phase 8 — حماية الـ APIs بناءً على الدور
 * 
 * الاستخدام:
 *   router.post('/create', verifyToken, checkPermission('EDITOR'), handler)
 *   router.delete('/:id', verifyToken, checkPermission('ADMIN'), handler)
 *   router.get('/', verifyToken, checkPermission('VIEWER'), handler)
 */

const prisma = require('../lib/prisma');

// ترتيب الأدوار — كل دور يشمل صلاحيات الأدوار الأقل منه
const ROLE_HIERARCHY = {
    OWNER: 5,
    ADMIN: 4,
    EDITOR: 3,
    DATA_ENTRY: 1,   // دور خاص — ما يتبع التسلسل
    VIEWER: 0,
};

/**
 * checkPermission(requiredRole)
 * يتحقق إن المستخدم عنده الدور المطلوب أو أعلى
 * SUPER_ADMIN يتجاوز كل الفحوصات
 * DATA_ENTRY يُعامل كحالة خاصة
 */
function checkPermission(requiredRole) {
    return async (req, res, next) => {
        try {
            // SUPER_ADMIN يتجاوز كل شي
            if (req.user.isSuperAdmin || req.user.systemRole === 'SUPER_ADMIN') {
                return next();
            }

            const userRole = req.user.role || 'VIEWER';

            // DATA_ENTRY — حالة خاصة
            if (userRole === 'DATA_ENTRY') {
                // DATA_ENTRY يقدر فقط يدخل بيانات (KPI entries, etc.)
                // ما يقدر يعمل CRUD على الاستراتيجية أو النظام
                const allowedForDataEntry = ['VIEWER', 'DATA_ENTRY'];
                if (allowedForDataEntry.includes(requiredRole)) {
                    return next();
                }
                return res.status(403).json({
                    message: 'ليس لديك صلاحية لهذا الإجراء',
                    requiredRole,
                    yourRole: userRole,
                });
            }

            // فحص التسلسل الهرمي
            const userLevel = ROLE_HIERARCHY[userRole] || 0;
            const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

            if (userLevel >= requiredLevel) {
                return next();
            }

            return res.status(403).json({
                message: 'ليس لديك صلاحية لهذا الإجراء',
                requiredRole,
                yourRole: userRole,
            });
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({ message: 'خطأ في فحص الصلاحيات' });
        }
    };
}

/**
 * checkDataEntryPermission(permissionField)
 * يتحقق إن مُدخل البيانات عنده صلاحية محددة
 * 
 * الاستخدام:
 *   router.post('/kpi-entries', verifyToken, checkDataEntryPermission('canEnterKPI'), handler)
 */
function checkDataEntryPermission(permissionField) {
    return async (req, res, next) => {
        try {
            // SUPER_ADMIN يتجاوز كل شي
            if (req.user.isSuperAdmin || req.user.systemRole === 'SUPER_ADMIN') {
                return next();
            }

            const userRole = req.user.role || 'VIEWER';

            // لو الدور أعلى من DATA_ENTRY، مسموح تلقائياً
            if (['OWNER', 'ADMIN', 'EDITOR'].includes(userRole)) {
                return next();
            }

            // لو VIEWER — ممنوع
            if (userRole === 'VIEWER') {
                return res.status(403).json({
                    message: 'المشاهد لا يمكنه إدخال بيانات',
                });
            }

            // DATA_ENTRY — مسموح تلقائياً (DataEntryPermission model removed)
            if (userRole === 'DATA_ENTRY') {
                req.allowedDepartments = null; // كل الأقسام
                return next();
            }

            // الافتراضي — ممنوع
            return res.status(403).json({
                message: 'ليس لديك صلاحية لهذا الإجراء',
            });
        } catch (error) {
            console.error('Data entry permission check error:', error);
            return res.status(500).json({ message: 'خطأ في فحص صلاحيات الإدخال' });
        }
    };
}

/**
 * requireRole(...roles)
 * يقبل قائمة أدوار محددة (ليس تسلسل هرمي)
 * 
 * الاستخدام:
 *   router.get('/admin-only', verifyToken, requireRole('OWNER', 'ADMIN'), handler)
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (req.user.isSuperAdmin || req.user.systemRole === 'SUPER_ADMIN') {
            return next();
        }

        const userRole = req.user.role || 'VIEWER';
        if (roles.includes(userRole)) {
            return next();
        }

        return res.status(403).json({
            message: 'ليس لديك صلاحية لهذا الإجراء',
            allowedRoles: roles,
            yourRole: userRole,
        });
    };
}

module.exports = { checkPermission, checkDataEntryPermission, requireRole };
