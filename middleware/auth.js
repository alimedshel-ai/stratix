const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // دعم Impersonation — SUPER_ADMIN يتصفح كشركة
    const impersonateEntity = req.headers['x-entity-id'];
    const impersonateCompany = req.headers['x-company-id'];

    req.user.isSuperAdmin = (decoded.systemRole === 'SUPER_ADMIN');

    if (req.user.isSuperAdmin && impersonateEntity) {
      // SUPER_ADMIN يتصفح كشركة محددة
      req.user.activeEntityId = impersonateEntity;
      req.user.activeCompanyId = impersonateCompany || null;
    } else if (!req.user.isSuperAdmin) {
      // مستخدم عادي — يشوف بياناته فقط
      req.user.activeEntityId = decoded.entityId || null;
      req.user.activeCompanyId = decoded.companyId || null;
    } else {
      // SUPER_ADMIN بدون impersonation — يشوف كل شي
      req.user.activeEntityId = null;
      req.user.activeCompanyId = null;
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { verifyToken };
