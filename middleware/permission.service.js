/**
 * permission.service.js — نظام الصلاحيات المتقدم
 * ─────────────────────────────────────────────────────────────────
 * يعمل جانباً مع middleware/permission.js (لا يستبدله)
 * permission.js     → فحص بسيط بالـ role (OWNER, ADMIN, EDITOR...)
 * permission.service.js → فحص متقدم بالـ userType + entityId + departmentId
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

const prisma = require('../lib/prisma');

// ─────────────────────────────────────────────────────────────────
// 1. أنواع المستخدمين
// ─────────────────────────────────────────────────────────────────
const USER_TYPES = {
    // مالكو المنشآت (4)
    ENTITY_PRIVATE: 'entity_private',
    ENTITY_GOVERNMENT: 'entity_government',
    ENTITY_NONPROFIT: 'entity_nonprofit',
    ENTITY_MIXED: 'entity_mixed',

    // مديرو الإدارات (12)
    DEPT_HR: 'dept_hr',
    DEPT_FINANCE: 'dept_finance',
    DEPT_MARKETING: 'dept_marketing',
    DEPT_OPS: 'dept_ops',
    DEPT_SERVICE: 'dept_service',
    DEPT_SALES: 'dept_sales',
    DEPT_IT: 'dept_it',
    DEPT_LEGAL: 'dept_legal',
    DEPT_RD: 'dept_rd',
    DEPT_PROCUREMENT: 'dept_procurement',
    DEPT_QUALITY: 'dept_quality',
    DEPT_ADMIN: 'dept_admin',

    // المستثمرون (6)
    INVESTOR_ANGEL: 'investor_angel',
    INVESTOR_VC: 'investor_vc',
    INVESTOR_PE: 'investor_pe',
    INVESTOR_CORPORATE: 'investor_corporate',
    INVESTOR_SOVEREIGN: 'investor_sovereign',
    INVESTOR_CROWDFUNDING: 'investor_crowdfunding',

    // أدوار داعمة
    SUPER_ADMIN: 'super_admin',
    EDITOR: 'editor',
    VIEWER: 'viewer',
    CONSULTANT: 'consultant',
    AUDITOR: 'auditor',
};

// ─────────────────────────────────────────────────────────────────
// 2. مصفوفة الصلاحيات
// ─────────────────────────────────────────────────────────────────
const PERMISSION_MATRIX = {
    // مالكو المنشآت — كل الصلاحيات في منشأتهم
    entity_private: ['read', 'write', 'update', 'delete', 'manage_users', 'manage_settings'],
    entity_government: ['read', 'write', 'update', 'delete', 'manage_users', 'manage_settings'],
    entity_nonprofit: ['read', 'write', 'update', 'delete', 'manage_users', 'manage_settings'],
    entity_mixed: ['read', 'write', 'update', 'delete', 'manage_users', 'manage_settings'],

    // مديرو الإدارات — صلاحيات محدودة (نفس المنشأة + نفس الإدارة)
    dept_hr: ['read', 'write', 'update', 'delete'],
    dept_finance: ['read', 'write', 'update', 'delete'],
    dept_marketing: ['read', 'write', 'update'],            // لا حذف للحملات القديمة
    dept_ops: ['read', 'write', 'update', 'delete'],
    dept_service: ['read', 'write', 'update'],
    dept_sales: ['read', 'write', 'update', 'delete'],
    dept_it: ['read', 'write', 'update', 'delete', 'manage_systems'],
    dept_legal: ['read', 'write', 'update'],            // لا حذف للعقود
    dept_rd: ['read', 'write', 'update', 'delete'],
    dept_procurement: ['read', 'write', 'update', 'delete'],
    dept_quality: ['read', 'write', 'update'],
    dept_admin: ['read', 'write', 'update'],

    // المستثمرون — قراءة + تعليق + تصويت حسب نوع الاستثمار
    investor_angel: ['read', 'comment'],
    investor_vc: ['read', 'comment', 'vote_board'],
    investor_pe: ['read', 'comment', 'vote_board', 'veto_minor'],
    investor_corporate: ['read', 'comment', 'partnership_request'],
    investor_sovereign: ['read', 'comment', 'impact_report'],
    investor_crowdfunding: ['read', 'comment_public'],

    // أدوار داعمة
    editor: ['read', 'write', 'update'],
    viewer: ['read'],
    consultant: ['read', 'write', 'update', 'comment'],
    auditor: ['read', 'export_audit'],
    super_admin: ['all'],
};

// ─────────────────────────────────────────────────────────────────
// 3. دالة التحقق المركزية
// ─────────────────────────────────────────────────────────────────
function canAccess(user, resource, action) {
    const {
        type,
        entityId,
        departmentId,
        assignedEntities,
        id: userId,
        systemRole,
        role,
    } = user;

    // الـ SUPER_ADMIN والـ OWNER الحقيقيون — يتجاوزون كل شيء
    if (type === 'super_admin' || systemRole === 'SUPER_ADMIN') return true;
    if (role === 'OWNER' || role === 'ADMIN') return resource.entityId === entityId;

    const resolvedType = (type || '').toLowerCase();
    const allowedActions = PERMISSION_MATRIX[resolvedType] || [];

    if (!allowedActions.includes(action) && !allowedActions.includes('all')) {
        return false;
    }

    // مالك منشأة → نفس المنشأة فقط
    if (resolvedType.startsWith('entity_')) {
        return resource.entityId === entityId;
    }

    // مدير إدارة → نفس المنشأة + نفس الإدارة
    if (resolvedType.startsWith('dept_')) {
        const sameEntity = resource.entityId === entityId;
        // إذا لم يكن للمورد departmentId يسمح بالوصول (مورد عام)
        const sameDept = !resource.departmentId || resource.departmentId === departmentId;
        return sameEntity && sameDept;
    }

    // مستثمر → المنشأة في قائمة استثماراته + البيانات مرئية
    if (resolvedType.startsWith('investor_')) {
        const canViewEntity = assignedEntities?.includes(resource.entityId);
        const isInvestorViewable = resource.investorViewable !== false;
        return canViewEntity && isInvestorViewable;
    }

    // محرر → نفس المنشأة + منشئ المحتوى أو مُكلف به
    if (resolvedType === 'editor') {
        return (
            resource.entityId === entityId &&
            (resource.createdBy === userId || resource.assignedTo === userId)
        );
    }

    // مشاهد → نفس المنشأة + صلاحية صريحة أو مورد عام
    if (resolvedType === 'viewer') {
        if (resource.entityId !== entityId) return false;
        const hasExplicitAccess = resource.accessList?.some(
            (a) => a.userId === userId && a.permission === 'read'
        );
        return hasExplicitAccess || resource.isPublic === true;
    }

    // مستشار → العملاء المُعين لهم
    if (resolvedType === 'consultant') {
        return assignedEntities?.includes(resource.entityId) ?? false;
    }

    // مراجع → نطاق التدقيق + بيانات التدقيق فقط
    if (resolvedType === 'auditor') {
        return (
            assignedEntities?.includes(resource.entityId) &&
            resource.auditRelevant === true
        );
    }

    return false;
}

// ─────────────────────────────────────────────────────────────────
// 4. Middleware: تحميل المورد من قاعدة البيانات
// ─────────────────────────────────────────────────────────────────
/**
 * loadResource(model, options)
 * يُحمّل المورد من DB ويضعه في req.resource
 *
 * الاستخدام:
 *   router.delete('/objectives/:id',
 *     authenticate,
 *     loadResource('strategicObjective'),
 *     requirePermission('delete'),
 *     handler
 *   )
 */
function loadResource(model, options = {}) {
    return async (req, res, next) => {
        try {
            const { idParam = 'id', include = {}, checkAccess = false } = options;
            const resourceId = req.params[idParam];

            if (!resourceId) {
                return res.status(400).json({ error: 'Resource ID required' });
            }

            const resource = await prisma[model].findUnique({
                where: { id: resourceId },
                include: {
                    ...include,
                    ...(checkAccess && {
                        accessList: {
                            where: { userId: req.user.id }
                        }
                    })
                }
            });

            if (!resource) {
                return res.status(404).json({ error: 'Resource not found' });
            }

            req.resource = resource;
            next();
        } catch (err) {
            console.error('[loadResource] error:', err.message);
            res.status(500).json({ error: 'Failed to load resource' });
        }
    };
}

// ─────────────────────────────────────────────────────────────────
// 5. Middleware: التحقق من الصلاحية على المورد المحمّل
// ─────────────────────────────────────────────────────────────────
/**
 * requirePermission(action)
 * يجب استخدامه بعد loadResource
 *
 * الاستخدام:
 *   router.delete('/:id',
 *     authenticate,
 *     loadResource('strategicObjective'),
 *     requirePermission('delete'),
 *     handler
 *   )
 */
function requirePermission(action) {
    return (req, res, next) => {
        if (!req.resource) {
            return res.status(500).json({
                error: 'Resource not loaded — use loadResource middleware first'
            });
        }

        if (!canAccess(req.user, req.resource, action)) {
            return res.status(403).json({
                error: 'Access denied',
                required: action,
                userType: req.user.type,
                userRole: req.user.role,
                resourceId: req.resource.id,
                resourceEntity: req.resource.entityId,
                userEntity: req.user.entityId,
            });
        }

        next();
    };
}

// ─────────────────────────────────────────────────────────────────
// 6. Middleware: التحقق من ملكية المنشأة
// ─────────────────────────────────────────────────────────────────
/**
 * requireEntityOwnership()
 * يتحقق أن المستخدم ينتمي للمنشأة المُستهدفة
 * يبحث عن entityId في: req.params → req.body → req.resource
 */
function requireEntityOwnership() {
    return (req, res, next) => {
        const user = req.user;

        // SUPER_ADMIN يتجاوز كل شيء
        if (user.systemRole === 'SUPER_ADMIN') return next();

        const targetEntityId =
            req.params.entityId || req.body?.entityId || req.resource?.entityId;

        if (!targetEntityId) {
            return res.status(400).json({ error: 'Entity ID required' });
        }

        if (user.entityId !== targetEntityId) {
            return res.status(403).json({
                error: 'Not your entity',
                userEntity: user.entityId,
                targetEntity: targetEntityId,
            });
        }

        next();
    };
}

// ─────────────────────────────────────────────────────────────────
// 7. Helper: Map من userCategory الحالي → user type
// ─────────────────────────────────────────────────────────────────
/**
 * يُحوّل userCategory أو role من النظام الحالي إلى user type للـ PERMISSION_MATRIX
 * هذا يضمن التوافق مع قاعدة البيانات الحالية
 */
function resolveUserType(user) {
    const role = user.role || 'VIEWER';
    const uType = user.userType || '';
    const uCategory = (user.userCategory || '').toUpperCase();

    if (user.systemRole === 'SUPER_ADMIN') return 'super_admin';
    if (role === 'OWNER') return 'entity_private'; // افتراضي — يمكن تحسينه
    if (role === 'ADMIN') return 'entity_private';
    if (role === 'CONSULTANT') return 'consultant';
    if (role === 'VIEWER') return 'viewer';
    if (role === 'DATA_ENTRY') return 'viewer'; // DATA_ENTRY → viewer في هذا النظام

    if (uType === 'DEPT_MANAGER' || uCategory.startsWith('DEPT_')) {
        const deptKey = uCategory.replace('DEPT_', '').toLowerCase();
        const deptType = `dept_${deptKey}`;
        return PERMISSION_MATRIX[deptType] ? deptType : 'editor';
    }

    if (uCategory.startsWith('INVESTOR')) return 'investor_vc'; // افتراضي
    if (uType === 'CONSULTANT') return 'consultant';

    return 'editor'; // EDITOR أو COMPANY_MANAGER → editor
}

module.exports = {
    USER_TYPES,
    PERMISSION_MATRIX,
    canAccess,
    loadResource,
    requirePermission,
    requireEntityOwnership,
    resolveUserType,
};
