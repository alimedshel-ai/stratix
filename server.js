require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const prisma = require('./lib/prisma');
const { verifyToken } = require('./middleware/auth');
const { inputSanitizer, suspiciousPatternDetector, securityHeaders, securityLogger } = require('./middleware/security');
const authRoutes = require('./routes/auth');
const sectorsRoutes = require('./routes/sectors');
const industriesRoutes = require('./routes/industries');
const entitiesRoutes = require('./routes/entities');
const usersRoutes = require('./routes/users');
const assessmentsRoutes = require('./routes/assessments');
const strategicRoutes = require('./routes/strategic');
const reviewsRoutes = require('./routes/reviews');
const versionsRoutes = require('./routes/versions');
const choicesRoutes = require('./routes/choices');
const correctionsRoutes = require('./routes/corrections');
const analysisRoutes = require('./routes/analysis');
const financialRoutes = require('./routes/financial');
const integrationsRoutes = require('./routes/integrations');
const directionsRoutes = require('./routes/directions');
const externalAnalysisRoutes = require('./routes/external-analysis');
const kpiEntriesRoutes = require('./routes/kpi-entries');
const alertsRoutes = require('./routes/alerts');
const auditRoutes = require('./routes/audit');
const dashboardApiRoutes = require('./routes/dashboard-api');
const companiesRoutes = require('./routes/companies');
const toolsRoutes = require('./routes/tools');
const companyAnalysisRoutes = require('./routes/company-analysis');
const userProgressRoutes = require('./routes/user-progress');
const syncRoutes = require('./routes/sync');
const alertEngineRoutes = require('./routes/alert-engine');
// TODO: [DEFERRED] causal-links — جاهز للتفعيل عند تطبيق Strategy Map
// const causalLinksRoutes = require('./routes/causal-links');
const towsRoutes = require('./routes/tows');
const pathRoutes = require('./routes/path');
const importRoutes = require('./routes/import');
const webhooksRoutes = require('./routes/webhooks');
const entityTypesRoutes = require('./routes/entity-types');
const priorityMatrixRoutes = require('./routes/priority-matrix');
const inspectorRoutes = require('./routes/system-inspector');
const commentsRoutes = require('./routes/comments');
const activitiesRoutes = require('./routes/activities');
const aiAdvisorRoutes = require('./routes/ai-advisor');
const aiInsightRoutes = require('./routes/ai-insight');
const adminRoutes = require('./routes/admin');
const financialEngineRoutes = require('./routes/financial-engine');
const execDashboardApiRoutes = require('./routes/exec-dashboard-api');
const companyHealthRoutes = require('./routes/company-health');
const dimensionsRoutes = require('./routes/dimensions');
const deptDataRoutes = require('./routes/dept-data');  // ✅ استبيان الإدارات
const departmentsRoutes = require('./routes/departments'); // ✅ بيانات الأقسام
const issuesRoutes = require('./routes/issues'); // ✨ متتبع المشاكل الاستراتيجية
const scenariosRoutes = require('./routes/scenarios');
const pestelRoutes = require('./routes/pestel');
const swotRoutes = require('./routes/swot');
const okrRoutes = require('./routes/okrs');
const kpisRoutes = require('./routes/kpis');
const initiativesRoutes = require('./routes/initiatives');
const deptHealthRoutes = require('./routes/dept-health');
const progressRoutes = require('./routes/progress');
const deptAnalysisRoutes = require('./routes/dept-analysis');
const diagnosticApiRoutes = require('./routes/diagnostic-api');
const proEntitiesRoutes = require('./routes/pro-entities'); // 🏢 عملاء المدير المستقل



const app = express();
const PORT = process.env.PORT || 3000;

// ============ STARTUP VALIDATION ============
// 🔒 إصلاح #1: التحقق من JWT_SECRET عند التشغيل
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('💀 [FATAL] JWT_SECRET is missing or too short (min 32 chars).');
  console.error('   Set it in .env: JWT_SECRET=your-very-long-secret-key-here-min-32-chars');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1); // في الإنتاج: لا تشغّل بدون مفتاح آمن
  } else {
    console.warn('⚠️  [DEV MODE] Continuing with weak JWT_SECRET — NOT safe for production!');
  }
}

// ============ PROCESS SAFETY HANDLERS ============
process.on('unhandledRejection', (reason) => {
  console.error('❌ [Process] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('💀 [Process] Uncaught Exception:', err);
  process.exit(1);
});

async function gracefulShutdown(signal) {
  console.log(`\n📴 [Process] ${signal} received — shutting down gracefully...`);
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com", "https://unpkg.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Prevent clickjacking
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // دقيقة واحدة بدلاً من 15
  max: 2000, // 2000 طلب في الدقيقة (كافية جداً للتطوير)
  message: 'محاولات كثيرة جداً. يرجى الانتظار قليلاً.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1000, // ارفع الحد لعمليات الدخول
  message: { error: 'محاولات تسجيل دخول كثيرة. حاول بعد 5 دقائق.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// API-specific stricter limiter for sensitive operations
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 300,
  message: { error: 'طلبات كثيرة. حاول لاحقاً.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Financial Engine limiter (guest-accessible, moderate protection)
const engineLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 200,
  message: { error: 'طلبات تحليل كثيرة. حاول بعد 15 دقيقة.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// 🛡️ Security Middleware (Day 1 Hardening)
app.use(securityHeaders);
app.use(securityLogger);
app.use(inputSanitizer);
app.use('/api/', suspiciousPatternDetector);

// Basic Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS Configuration
// 🔒 إصلاح #2: رفض origins غير معروفة في Production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : false) // 🔒 false = يرفض كل الطلبات cross-origin إذا لم يُحدد ALLOWED_ORIGINS
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
  console.warn('⚠️  [CORS] No ALLOWED_ORIGINS set — cross-origin requests will be blocked in production.');
  console.warn('   Set it in .env: ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com');
}

// Serve static files with explicit MIME types to prevent browser blocking
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) res.setHeader('Content-Type', 'text/javascript');
  if (req.path.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
  next();
});

app.use(express.static(path.join(__dirname, 'src')));

// =========================================
// 📚 Swagger API Documentation
// =========================================
const setupSwagger = require('./config/swagger');
setupSwagger(app);

// =========================================
// API Routes — مع حماية الصلاحيات (Phase 8)
// =========================================
const { checkPermission, checkDataEntryPermission, requireRole } = require('./middleware/permission');

// 🔓 Auth — بدون حماية (login/register)
app.use('/api/auth', authLimiter, authRoutes);

// 🔒 GET /api/user/me — المستخدم الحالي من HttpOnly Cookie
// نقطة النهاية الأساسية للتحقق من الجلسة بدلاً من localStorage
app.get('/api/user/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        systemRole: true,
        userCategory: true,
        onboardingCompleted: true,
        isProManager: true,
        disabled: true,
        memberships: {
          select: {
            id: true,
            role: true,
            userType: true,
            entity: {
              select: {
                id: true,
                legalName: true,
                displayName: true,
                size: true,
                metadata: true,
                company: { select: { id: true, nameAr: true, nameEn: true } }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.disabled) {
      return res.status(403).json({ suspended: true, reason: 'الحساب معلّق' });
    }

    // بناء الـ response بنفس الشكل المعتاد
    const primaryMembership = user.memberships[0] || null;
    const isSA = user.systemRole === 'SUPER_ADMIN';
    const primaryRole = primaryMembership?.role || (isSA ? 'OWNER' : 'VIEWER');

    // 🛡️ تحديد userType بأولوية صحيحة:
    // 0. المدير المستقل (pro_manager) يبقى DEPT_MANAGER حتى لو role=OWNER
    // 1. OWNER/ADMIN/SUPER_ADMIN → COMPANY_MANAGER (لغير المستقل)
    // 2. membership.userType → استخدمه
    // 3. استنتاج من userCategory كـ fallback
    let _entityMeta = {};
    try { _entityMeta = JSON.parse(primaryMembership?.entity?.metadata || '{}'); } catch(e) {}
    const _isProEntity = _entityMeta.createdBy === 'pro_manager' && primaryMembership?.userType === 'DEPT_MANAGER';

    let uType;
    // المستقل: isProManager + (عضوية DEPT_MANAGER أو userCategory يبدأ بـ DEPT_)
    if (_isProEntity || (user.isProManager && (primaryMembership?.userType === 'DEPT_MANAGER' || (user.userCategory || '').startsWith('DEPT_')))) {
      uType = 'DEPT_MANAGER'; // المستقل يبقى DEPT_MANAGER
    } else if (['OWNER', 'ADMIN'].includes(primaryRole) || isSA) {
      uType = 'COMPANY_MANAGER';
    } else if (primaryMembership?.userType) {
      uType = primaryMembership.userType;
    } else {
      const cat = user.userCategory || '';
      if (cat.startsWith('DEPT_')) uType = 'DEPT_MANAGER';
      else if (cat.startsWith('INDIVIDUAL_') || cat === 'CONSULTANT_SOLO') uType = 'INDIVIDUAL';
      else if (cat === 'CONSULTANT_AGENCY') uType = 'CONSULTANT';
      else if (['COMPANY_MICRO', 'COMPANY_SMALL', 'COMPANY_MEDIUM', 'COMPANY_LARGE', 'COMPANY_ENTERPRISE', 'NEW_PROJECT', 'CEO'].includes(cat)) uType = 'COMPANY_MANAGER';
      else uType = 'EXPLORER';
    }

    // استنتاج deptCode من userCategory أو من المسار التشخيصي
    const deptCode = (user.userCategory || '').startsWith('DEPT_')
      ? user.userCategory.replace('DEPT_', '').toLowerCase()
      : user.diagnosticData?.department || null;

    // حساب isProManager النهائي
    const isProManager = !!user.isProManager || _isProEntity
      || (!primaryMembership && (user.userCategory || '').startsWith('DEPT_'));

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      systemRole: user.systemRole || 'USER',
      role: primaryMembership?.role || (isSA ? 'OWNER' : 'VIEWER'),
      userType: uType,
      deptCode,
      userCategory: user.userCategory || null,
      onboardingCompleted: user.onboardingCompleted || false,
      isProManager,
      entity: primaryMembership?.entity || null,
      memberships: user.memberships,
      authenticated: true
    });
  } catch (error) {
    console.error('[/api/user/me] Error:', error.message);
    res.status(500).json({ message: 'خطأ في جلب بيانات المستخدم' });
  }
});

// 🔓 Path — المسار الاستراتيجي
app.use('/api/path', pathRoutes);
app.use('/api/diagnostic', diagnosticApiRoutes);

// 🧠 Financial Engine — محرك الترجمة المالية (Guest-accessible — بدون login)
app.use('/api/financial-engine', engineLimiter, financialEngineRoutes);

// 📊 Dashboard — كل مستخدم مسجل
app.use('/api/dashboard', dashboardApiRoutes);

// 🏥 صحة الشركة — لوحة أم تستقبل بيانات الإدارات
app.use('/api/company-health', companyHealthRoutes);
app.use('/api/issues', issuesRoutes);

app.use('/api/dimensions', dimensionsRoutes); // ✨ الأبعاد الثلاثة
app.use('/api/dept-data', deptDataRoutes);    // ✅ استبيان الإدارات ومؤشراتها
app.use('/api/departments', departmentsRoutes); // ✅ بيانات الأقسام

// 📍 تتبع تقدم رحلة مدير الإدارة (localStorage-first)
app.use('/api/dept/analysis', deptAnalysisRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/user-progress', userProgressRoutes);
app.use('/api/pestel', pestelRoutes);
app.use('/api/swot', swotRoutes);
app.use('/api/tows', towsRoutes);
app.use('/api/dept-health', deptHealthRoutes);
app.use('/api/scenarios', scenariosRoutes);
app.use('/api/okrs', okrRoutes);
app.use('/api/kpis', kpisRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/initiatives', initiativesRoutes);
app.use('/api/corrections', correctionsRoutes);






// 🎯 Executive Dashboard API v1 — BSC-Driven
app.use('/api/v1', execDashboardApiRoutes);

// 🔔 Alerts — كل مستخدم مسجل (قراءة)
app.use('/api/alerts', alertsRoutes);

// 📈 KPI Entries — DATA_ENTRY وأعلى
app.use('/api/kpi-entries', kpiEntriesRoutes);

// 🔧 النظام — OWNER/ADMIN فقط
app.use('/api/sectors', sectorsRoutes);
app.use('/api/industries', industriesRoutes);
app.use('/api/entity-types', entityTypesRoutes);
app.use('/api/entities', entitiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/audit', auditRoutes);

// 🎯 الاستراتيجية — EDITOR وأعلى (القراءة متاحة للـ VIEWER)
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/strategic', strategicRoutes);
// strategic/reviews handled via root /api/reviews for departmental consistency
const objectivesSyncRoutes = require('./routes/objectives-sync');
app.use('/api/strategic/objectives', objectivesSyncRoutes);
app.use('/api/versions', versionsRoutes);
app.use('/api/choices', choicesRoutes);
const projectsRoutes = require('./routes/projects');
app.use('/api/projects', projectsRoutes);
// corrections handled via root consolidate section
app.use('/api/analysis', analysisRoutes);
app.use('/api/directions', directionsRoutes);
app.use('/api/external-analysis', externalAnalysisRoutes);
app.use('/api/tools', toolsRoutes.router);
app.use('/api/company-analysis', companyAnalysisRoutes);
// user-progress already registered above (line 331)
// TODO: [DEFERRED] causal-links — يُفعّل مع Strategy Map
// app.use('/api/causal-links', causalLinksRoutes);
// tows handled via root consolidate section

// ⚙️ العمليات
app.use('/api/financial', financialRoutes);

// 🤖 محرك الذكاء — EDITOR وأعلى
app.use('/api/alert-engine', alertEngineRoutes);
app.use('/api/sync', syncRoutes);

// 🔔 Webhooks & Integrations
app.use('/api/webhooks', webhooksRoutes);

// 📂 الاستيراد — DATA_ENTRY وأعلى  
app.use('/api/import', importRoutes);

// 📊 Excel Upload — DATA_ENTRY وأعلى
const excelRoutes = require('./routes/excel');
app.use('/api/excel', excelRoutes);

// 📈 البيانات الإحصائية — DATA_ENTRY وأعلى
const statsRoutes = require('./routes/stats');
app.use('/api/stats', statsRoutes);

// OKRs are handled above in the department managers section

// initiatives and kpis handled via root consolidate section

// ✅ مهام المبادرات (Tasks)
const tasksRoutes = require('./routes/tasks');
app.use('/api/tasks', tasksRoutes);

// 🎯 مصفوفة الأولويات — MCDA
app.use('/api/priority-matrix', priorityMatrixRoutes);
app.use('/api/inspector', inspectorRoutes);

// 🔮 محاكاة السيناريوهات
// Removed duplicate scenarios use

// 💬 التعليقات والنشاطات
app.use('/api/comments', commentsRoutes);
app.use('/api/activities', activitiesRoutes);

// 🤖 المستشار الذكي
app.use('/api/ai-advisor', aiAdvisorRoutes);
app.use('/api/ai-insight', aiInsightRoutes); // Public — no auth (lead gen page)
app.use('/api/leads', require('./routes/leads')); // Public — no auth (lead gen page)

// 👥 أصحاب المصلحة + ⚠️ المخاطر (NEW — التكامل)
const stakeholdersRoutes = require('./routes/stakeholders');
const risksRoutes = require('./routes/risks');
app.use('/api/stakeholders', stakeholdersRoutes);
app.use('/api/risks', risksRoutes);

// 🧩 نمط الشركة — pain & ambition
const companyPatternRoutes = require('./routes/company-pattern');
app.use('/api/company-pattern', companyPatternRoutes);

// 📊 حدود الباقة — Plan Limits
const planLimitsRoutes = require('./routes/plan-limits');
app.use('/api/plan-limits', planLimitsRoutes);

// 🏢 الفريق الاستراتيجي — Phase 0
const invitationsRoutes = require('./routes/invitations');
const deptDeepRoutes = require('./routes/dept-deep'); // 📊 المرحلة 3: نقل localStorage → DB
const rulesEngineRoutes = require('./routes/rules-engine');
const sectorConfigsRoutes = require('./routes/sector-configs');
const breakEvenRoutes = require('./routes/break-even');
const cfoAuditRoutes = require('./routes/cfo-audit');
app.use('/api/invitations', invitationsRoutes);
app.use('/api/dept-deep', deptDeepRoutes); // 📊 المرحلة 3
app.use('/api/pro/entities', proEntitiesRoutes); // 🏢 عملاء المدير المستقل
app.use('/api/rules-engine', rulesEngineRoutes);
app.use('/api/sector-configs', sectorConfigsRoutes);
app.use('/api/break-even', breakEvenRoutes);
app.use('/api/cfo', cfoAuditRoutes);

// 💰 الفرص الاستثمارية — Investment Deal Pipeline
const dealsRoutes = require('./routes/deals');
const notificationsRoutes = require('./routes/notifications');
app.use('/api/deals', dealsRoutes);
app.use('/api/notifications', notificationsRoutes);


// =========================================
// 🔒 إصلاح #3: تحويل ~95 route يدوي إلى auto-serve
// =========================================

// التحويلات (Redirects) — يجب أن تكون صريحة
const REDIRECTS = {
  '/diagnostic-center': '/select-type',            // ← الجديد: يروح لشاشة اختيار الفئة
  // '/pain-ambition' — يُعالج يدوياً أسفل (مع query params)
  '/strategic-tools': '/tools',
  '/signup': '/login?tab=signup&from=landing',
  '/founder-diagnostic': '/select-type',            // ← الجديد: بدل V10
  '/path1': '/',
  '/alerts': '/intelligence',
  '/free-diagnostic': '/select-type',               // ← الجديد: بدل V10
  // '/select-type' — يُخدم تلقائياً من auto-serve (select-type.html)
  // '/diagnostic-result' — يُخدم تلقائياً من auto-serve (diagnostic-result.html)
  '/cfo-board-pitch': '/finance-audit',
};

for (const [from, to] of Object.entries(REDIRECTS)) {
  app.get(from, (req, res) => {
    const qs = new URLSearchParams(req.query).toString();
    res.redirect(to + (qs ? (to.includes('?') ? '&' : '?') + qs : ''));
  });
  // .html compat for old links
  if (!from.endsWith('.html')) {
    app.get(from + '.html', (req, res) => {
      const qs = new URLSearchParams(req.query).toString();
      res.redirect(to + (qs ? (to.includes('?') ? '&' : '?') + qs : ''));
    });
  }
}

// خاص: pain-ambition يمرر query params
const buildPainRedirect = (req) => {
  const qs = new URLSearchParams(req.query).toString();
  return '/select-type' + (qs ? '?' + qs : '');
};
app.get('/pain-ambition', (req, res) => res.redirect(buildPainRedirect(req)));
app.get('/pain-ambition.html', (req, res) => res.redirect(buildPainRedirect(req)));

// الأسماء الخاصة: URL ≠ اسم الملف
const SPECIAL_FILE_MAP = {
  '/tool': 'tool-detail.html',
  '/api-docs-page': 'api-docs.html',
};

for (const [route, file] of Object.entries(SPECIAL_FILE_MAP)) {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', file));
  });
}

// 🔒 Auto-Serve: أي URL يطابق ملف HTML في src/ يُقدّم تلقائياً
// هذا يستبدل ~80 سطر app.get يدوي
const fs = require('fs');
const htmlFilesCache = new Set();

// بناء cache لملفات HTML الموجودة
try {
  const srcDir = path.join(__dirname, 'src');
  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    if (file.endsWith('.html') && !file.startsWith('.')) {
      // /dept-deep → dept-deep.html
      htmlFilesCache.add(file.replace('.html', ''));
    }
  }
  console.log(`📂 [Auto-Serve] ${htmlFilesCache.size} HTML pages indexed`);
} catch (err) {
  console.error('❌ [Auto-Serve] Failed to index src/ directory:', err.message);
}

// Auto-serve middleware — يجب أن يكون بعد API routes وقبل 404
app.get('/:page', (req, res, next) => {
  const page = req.params.page;

  // تجاهل: API, الملفات الثابتة, المسارات المسجلة مسبقاً
  if (page.includes('.') || page.startsWith('api')) {
    return next();
  }

  // هل يوجد ملف HTML مطابق؟
  if (htmlFilesCache.has(page)) {
    return res.sendFile(path.join(__dirname, 'src', `${page}.html`));
  }

  // .html compat: /dept-deep.html → /dept-deep
  next();
});

// compat: /page.html → sendFile (for direct .html links)
app.get('/:page.html', (req, res, next) => {
  const page = req.params.page;
  if (htmlFilesCache.has(page)) {
    return res.sendFile(path.join(__dirname, 'src', `${page}.html`));
  }
  next();
});

// 🏥 Health check endpoint (for Railway)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Landing page (public homepage)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'landing.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Start the server
async function startServer() {
  console.log('⏳ جاري تحميل بيانات النظام الأساسية...');

  // ✅ انتظار تحميل بيانات الأدوات قبل تشغيل الخادم
  const toolsLoaded = await toolsRoutes.loadToolsData();
  if (!toolsLoaded) {
    console.error('❌ [FATAL] فشل تحميل بيانات tools-data.json، إيقاف التشغيل.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Stratix server is running on http://localhost:${PORT}`);
    console.log(`📝 Login at http://localhost:${PORT}/login`);

    // ============ AUTO-SCAN SCHEDULER ============
    const SCAN_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours
    let scanRunning = false;
    let scanFailCount = 0;

    async function autoScan() {
      if (scanRunning) {
        console.log('⏭️ [Auto-Scan] Already running, skipping...');
        return;
      }
      scanRunning = true;
      try {
        console.log('🔍 [Auto-Scan] Starting scheduled alert engine scan...');
        const entities = await prisma.entity.findMany({
          select: { id: true }
        });
        let totalAlerts = 0;

        for (const entity of entities) {
          const activeVersion = await prisma.strategyVersion.findFirst({
            where: { entityId: entity.id, isActive: true },
            select: { id: true }
          });
          if (!activeVersion) continue;

          const kpis = await prisma.kPI.findMany({
            where: { versionId: activeVersion.id },
            select: { id: true, name: true, actual: true, target: true, criticalThreshold: true }
          });

          for (const kpi of kpis) {
            if (!kpi.target || kpi.target === 0 || kpi.actual == null) continue;
            const ratio = kpi.actual / kpi.target;
            if (ratio >= 0.9) continue;

            const existing = await prisma.strategicAlert.findFirst({
              where: { entityId: entity.id, referenceId: kpi.id, referenceType: 'KPI', isDismissed: false, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
            });
            if (existing) continue;

            const critThresh = kpi.criticalThreshold || 0.5;
            if (ratio <= critThresh) {
              await prisma.strategicAlert.create({ data: { entityId: entity.id, type: 'KPI_CRITICAL', severity: 'CRITICAL', title: `⛔ مؤشر "${kpi.name}" في وضع حرج`, message: `الأداء (${(ratio * 100).toFixed(1)}%) — ${kpi.actual} من ${kpi.target}`, referenceId: kpi.id, referenceType: 'KPI' } });
              totalAlerts++;
            }
          }
        }

        scanFailCount = 0;
        console.log(`✅ [Auto-Scan] Complete — ${totalAlerts} new alerts generated`);
      } catch (err) {
        scanFailCount++;
        console.error(`❌ [Auto-Scan] Error (fail #${scanFailCount}):`, err.message);
        if (scanFailCount >= 3) {
          console.error('🚨 [Auto-Scan] 3 consecutive failures — possible DB issue');
        }
      } finally {
        scanRunning = false;
      }
    }

    setTimeout(autoScan, 30000);
    setInterval(autoScan, SCAN_INTERVAL);
  });
}

startServer();
