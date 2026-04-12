/**
 * middleware/dept-isolation.js
 * ════════════════════════════════════════════════════════════════
 * درع عزل مسار مدير الإدارة (DEPT_MANAGER)
 *
 * يضمن:
 *   1. DEPT_MANAGER لا يقدر يستدعي API خاصة بالمالك
 *   2. DEPT_MANAGER محجوز على entityId قسمه فقط
 *   3. لا يقدر يتجاوز deptCode المحفوظ في التوكن
 *
 * الاستخدام في الـ routes:
 *   const { deptOnly, ownerOnly, injectDeptScope } = require('../middleware/dept-isolation');
 *
 *   // يسمح لـ DEPT_MANAGER و OWNER/EXEC_MANAGER معاً — مع عزل القسم
 *   router.get('/', verifyToken, injectDeptScope, handler);
 *
 *   // يسمح فقط للمالك/المدير التنفيذي (يمنع DEPT_MANAGER)
 *   router.get('/summary', verifyToken, ownerOnly, handler);
 *
 *   // يسمح فقط لـ DEPT_MANAGER (يمنع المالك من API الأقسام المباشرة)
 *   router.post('/submit', verifyToken, deptOnly, handler);
 */

// أنواع المالك والمدير التنفيذي
const OWNER_TYPES = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_MANAGER', 'EXEC_MANAGER'];

/**
 * injectDeptScope
 * يحقن req.deptScope بالمعلومات اللازمة لعزل البيانات في الـ handlers
 * - إذا DEPT_MANAGER: { isDeptManager: true, deptCode: 'HR', entityId: '...' }
 * - إذا غيره:          { isDeptManager: false, deptCode: null, entityId: '...' }
 */
function injectDeptScope(req, res, next) {
    const uType     = (req.user?.userType || '').toUpperCase();
    const entityId  = req.user?.activeEntityId || req.user?.entityId;
    const deptCode  = req.user?.deptCode || null;

    req.deptScope = {
        isDeptManager: uType === 'DEPT_MANAGER',
        isOwner:       OWNER_TYPES.includes(uType),
        isConsultant:  uType === 'CONSULTANT',
        deptCode:      deptCode ? deptCode.toUpperCase() : null,
        entityId
    };

    // DEPT_MANAGER بدون deptCode في التوكن → خطأ حرج
    if (req.deptScope.isDeptManager && !deptCode) {
        console.warn(`[deptIsolation] DEPT_MANAGER ${req.user?.id} has no deptCode in token`);
        return res.status(403).json({
            error: 'توكن مدير الإدارة لا يحتوي على رمز القسم — يرجى إعادة تسجيل الدخول'
        });
    }

    next();
}

/**
 * ownerOnly
 * يمنع DEPT_MANAGER و CONSULTANT من الوصول لـ API خاصة بالمالك/المدير التنفيذي
 */
function ownerOnly(req, res, next) {
    const uType = (req.user?.userType || '').toUpperCase();

    if (!OWNER_TYPES.includes(uType) && req.user?.systemRole !== 'SUPER_ADMIN') {
        console.warn(`[ownerOnly] Blocked: ${uType} tried to access owner-only route ${req.path}`);
        return res.status(403).json({
            error: 'هذه البيانات متاحة للمالك والمدير التنفيذي فقط'
        });
    }

    next();
}

/**
 * deptOnly
 * يقبل DEPT_MANAGER فقط (يمنع المالك من استخدام API الأقسام مباشرة)
 * ملاحظة: المالك يرى بيانات الأقسام عبر company-health وليس عبر dept APIs مباشرة
 */
function deptOnly(req, res, next) {
    const uType = (req.user?.userType || '').toUpperCase();

    if (uType !== 'DEPT_MANAGER' && req.user?.systemRole !== 'SUPER_ADMIN') {
        return res.status(403).json({
            error: 'هذه النقطة مخصصة لمدير الإدارة فقط'
        });
    }

    // حقن deptScope تلقائياً
    injectDeptScope(req, res, next);
}

/**
 * enforceDeptParam
 * يتحقق أن الـ dept في URL/query يطابق deptCode في توكن DEPT_MANAGER
 * يُستخدم في routes التي تقبل ?dept= parameter
 */
function enforceDeptParam(req, res, next) {
    const uType = (req.user?.userType || '').toUpperCase();

    if (uType !== 'DEPT_MANAGER') return next(); // المالك وغيره يعدّون

    const tokenDept = (req.user?.deptCode || '').toUpperCase();
    const paramDept = (
        req.params.dept   ||
        req.query.dept    ||
        req.body?.dept    ||
        ''
    ).toUpperCase();

    if (paramDept && paramDept !== tokenDept) {
        console.warn(`[enforceDeptParam] DEPT_MANAGER ${req.user?.id} tried dept=${paramDept} but has ${tokenDept}`);
        return res.status(403).json({
            error: 'لا يمكن الوصول لبيانات قسم آخر'
        });
    }

    next();
}

module.exports = { injectDeptScope, ownerOnly, deptOnly, enforceDeptParam };
