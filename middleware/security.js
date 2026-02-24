/**
 * 🛡️ Security Middleware — Phase: Day 1 Security Hardening
 * 
 * يوفر حماية إضافية فوق Helmet + Rate Limiting:
 *  1. تنظيف المدخلات (XSS Prevention)
 *  2. حماية ضد SQL Injection patterns
 *  3. فحص الأنماط المشبوهة
 *  4. حد حجم الطلبات
 *  5. إخفاء معلومات النظام
 */

// === 1. Input Sanitizer — تنظيف المدخلات من XSS ===
function sanitizeValue(value) {
    if (typeof value === 'string') {
        return value
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:\s*text\/html/gi, '')
            .replace(/vbscript:/gi, '');
    }
    return value;
}

function sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return sanitizeValue(obj);
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeObject);

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[sanitizeValue(key)] = sanitizeObject(value);
    }
    return sanitized;
}

function inputSanitizer(req, res, next) {
    // تنظيف body
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    // تنظيف query
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    // تنظيف params
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }
    next();
}

// === 2. Suspicious Pattern Detector — كشف الأنماط المشبوهة ===
const SUSPICIOUS_PATTERNS = [
    /(\bunion\b.*\bselect\b)/i,
    /(\bdrop\b.*\btable\b)/i,
    /(\bdelete\b.*\bfrom\b)/i,
    /(\binsert\b.*\binto\b)/i,
    /(\'|\")\s*(;|--)/,
    /(\bexec\b|\bexecute\b)\s*\(/i,
    /<script[^>]*>/i,
    /(\balert\b|\bprompt\b|\bconfirm\b)\s*\(/i,
];

function suspiciousPatternDetector(req, res, next) {
    const checkString = (str) => {
        if (typeof str !== 'string') return false;
        return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(str));
    };

    const checkObject = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        for (const value of Object.values(obj)) {
            if (typeof value === 'string' && checkString(value)) return true;
            if (typeof value === 'object' && checkObject(value)) return true;
        }
        return false;
    };

    // فحص URL
    if (checkString(req.url)) {
        console.warn(`🚨 Suspicious URL detected: ${req.ip} → ${req.url}`);
        return res.status(400).json({ error: 'طلب غير صالح' });
    }

    // فحص body
    if (req.body && checkObject(req.body)) {
        console.warn(`🚨 Suspicious body detected: ${req.ip} → ${req.method} ${req.path}`);
        return res.status(400).json({ error: 'محتوى غير مسموح' });
    }

    // فحص query
    if (req.query && checkObject(req.query)) {
        console.warn(`🚨 Suspicious query detected: ${req.ip} → ${req.url}`);
        return res.status(400).json({ error: 'استعلام غير صالح' });
    }

    next();
}

// === 3. Security Headers — ترويسات أمان إضافية ===
function securityHeaders(req, res, next) {
    // منع تخزين البيانات الحساسة
    if (req.path.startsWith('/api/auth')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
    }

    // إخفاء تقنية الخادم
    res.removeHeader('X-Powered-By');

    // حماية إضافية
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    next();
}

// === 4. Request Logger — تسجيل للأنشطة المشبوهة ===
function securityLogger(req, res, next) {
    const start = Date.now();

    // تسجيل محاولات الوصول المشبوهة
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        // تسجيل فقط الحالات المشبوهة
        if (statusCode === 401 || statusCode === 403) {
            console.warn(`🔒 [${new Date().toISOString()}] ${statusCode} ${req.method} ${req.path} — IP: ${req.ip} — ${duration}ms`);
        }

        // تحذير عن الطلبات البطيئة جداً
        if (duration > 10000) {
            console.warn(`⏰ [${new Date().toISOString()}] Slow request: ${req.method} ${req.path} — ${duration}ms`);
        }
    });

    next();
}

// === 5. API Key للـ Production ===
function apiKeyGuard(req, res, next) {
    // فقط في بيئة الإنتاج
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }

    // التجاوز لصفحات الويب والملفات الثابتة
    if (!req.path.startsWith('/api/')) {
        return next();
    }

    // التجاوز لـ auth endpoints
    if (req.path.startsWith('/api/auth/')) {
        return next();
    }

    // التحقق من وجود API Key أو Bearer Token
    const hasAuth = req.headers.authorization || req.headers['x-api-key'];
    if (!hasAuth) {
        return res.status(401).json({ error: 'مطلوب توثيق' });
    }

    next();
}

module.exports = {
    inputSanitizer,
    suspiciousPatternDetector,
    securityHeaders,
    securityLogger,
    apiKeyGuard,
};
