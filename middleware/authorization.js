const { verifyToken } = require('./auth');

// Middleware: يتأكد إن المستخدم SUPER_ADMIN
const requireSuperAdmin = (req, res, next) => {
    if (req.user.systemRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'هذا الإجراء متاح فقط لمدير النظام' });
    }
    next();
};

// Middleware: يستخرج entityId من التوكن أو الـ header (للفلترة)
const extractEntityContext = (req, res, next) => {
    // لو SUPER_ADMIN يتصفح كشركة (Impersonation)
    const impersonateEntity = req.headers['x-entity-id'];
    const impersonateCompany = req.headers['x-company-id'];

    if (req.user.systemRole === 'SUPER_ADMIN') {
        // SUPER_ADMIN يشوف كل شي، إلا لو يتصفح كشركة
        req.entityId = impersonateEntity || null;
        req.companyId = impersonateCompany || null;
        req.isSuperAdmin = true;
    } else {
        // مستخدم عادي — يشوف بياناته فقط
        req.entityId = req.user.entityId || null;
        req.companyId = req.user.companyId || null;
        req.isSuperAdmin = false;
    }
    next();
};

module.exports = { requireSuperAdmin, extractEntityContext };
