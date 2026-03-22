const jwt = require('jsonwebtoken');

/**
 * دالة مساعدة لقراءة الكوكيز من الـ header يدوياً (fallback)
 * تتجنب مشكلة split('=') عند وجود = داخل قيمة الكوكي
 */
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split('; ').forEach(cookie => {
    const idx = cookie.indexOf('=');
    if (idx > 0) {
      const key = cookie.slice(0, idx);
      const val = cookie.slice(idx + 1);
      cookies[key] = val;
    }
  });
  return cookies;
}

const verifyToken = (req, res, next) => {
  let token = null;

  // 1. الأولوية: HttpOnly Cookie (via cookie-parser)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Fallback: manual cookie parsing (إذا لم يُفعّل cookie-parser)
  if (!token && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies.token;
  }

  // 3. Authorization header (legacy support for old pages)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // أكثر أماناً من split
    }
  }

  // ✅ لا نقبل التوكن من query string لأسباب أمنية

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // دعم Impersonation – فقط للمشرفين
    req.user.isSuperAdmin = (decoded.systemRole === 'SUPER_ADMIN');

    const impersonateEntity = req.headers['x-entity-id'];
    const impersonateCompany = req.headers['x-company-id'];

    if (req.user.isSuperAdmin && impersonateEntity) {
      req.user.activeEntityId = impersonateEntity;
      req.user.activeCompanyId = impersonateCompany || null;
      // تسجيل في بيئة التطوير فقط (لتجنب ملء السجلات)
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[Impersonation] SUPER_ADMIN ${decoded.id} → Entity ${impersonateEntity}`);
      }
    } else if (!req.user.isSuperAdmin) {
      req.user.activeEntityId = decoded.entityId || null;
      req.user.activeCompanyId = decoded.companyId || null;
    } else {
      req.user.activeEntityId = null;
      req.user.activeCompanyId = null;
    }

    next();
  } catch (error) {
    // ✅ تمييز خطأ انتهاء الصلاحية
    const message = error.name === 'TokenExpiredError'
      ? 'Token expired'
      : 'Invalid token';
    return res.status(401).json({ message });
  }
};

module.exports = { verifyToken };
