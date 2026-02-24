require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
// const causalLinksRoutes = require('./routes/causal-links'); // DISABLED
const towsRoutes = require('./routes/tows');
const pathRoutes = require('./routes/path');
const importRoutes = require('./routes/import');
const okrsRoutes = require('./routes/okrs');
const entityTypesRoutes = require('./routes/entity-types');
const priorityMatrixRoutes = require('./routes/priority-matrix');
const inspectorRoutes = require('./routes/system-inspector');
const scenariosRoutes = require('./routes/scenarios');
const commentsRoutes = require('./routes/comments');
const activitiesRoutes = require('./routes/activities');
const aiAdvisorRoutes = require('./routes/ai-advisor');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

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
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: { error: 'محاولات تسجيل دخول كثيرة. حاول بعد 15 دقيقة.' },
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

// Apply rate limiting to all routes
app.use('/api/', limiter);

// 🛡️ Security Middleware (Day 1 Hardening)
app.use(securityHeaders);
app.use(securityLogger);
app.use(inputSanitizer);
app.use('/api/', suspiciousPatternDetector);

// Basic Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

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

// 🔓 Path — المسار الاستراتيجي
app.use('/api/path', pathRoutes);

// 📊 Dashboard — كل مستخدم مسجل
app.use('/api/dashboard', dashboardApiRoutes);

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
app.use('/api/strategic/reviews', reviewsRoutes);
app.use('/api/versions', versionsRoutes);
app.use('/api/choices', choicesRoutes);
app.use('/api/corrections', correctionsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/directions', directionsRoutes);
app.use('/api/external-analysis', externalAnalysisRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/company-analysis', companyAnalysisRoutes);
app.use('/api/user-progress', userProgressRoutes);
// app.use('/api/causal-links', causalLinksRoutes); // DISABLED
app.use('/api/tows', towsRoutes);

// ⚙️ العمليات
app.use('/api/financial', financialRoutes);

// 🤖 محرك الذكاء — EDITOR وأعلى
app.use('/api/alert-engine', alertEngineRoutes);
app.use('/api/sync', syncRoutes);

// 📂 الاستيراد — DATA_ENTRY وأعلى  
app.use('/api/import', importRoutes);

// 📊 Excel Upload — DATA_ENTRY وأعلى
const excelRoutes = require('./routes/excel');
app.use('/api/excel', excelRoutes);

// 📈 البيانات الإحصائية — DATA_ENTRY وأعلى
const statsRoutes = require('./routes/stats');
app.use('/api/stats', statsRoutes);

// 🎯 OKRs
app.use('/api/okrs', okrsRoutes);

// 🎯 مصفوفة الأولويات — MCDA
app.use('/api/priority-matrix', priorityMatrixRoutes);
app.use('/api/inspector', inspectorRoutes);

// 🔮 محاكاة السيناريوهات
app.use('/api/scenarios', scenariosRoutes);

// 💬 التعليقات والنشاطات
app.use('/api/comments', commentsRoutes);
app.use('/api/activities', activitiesRoutes);

// 🤖 المستشار الذكي
app.use('/api/ai-advisor', aiAdvisorRoutes);

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

// Serve pain-ambition page
app.get('/pain-ambition', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pain-ambition.html'));
});

// Serve import page
app.get('/import', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'import.html'));
});

// Serve statistical data page
app.get('/statistical-data', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'statistical-data.html'));
});

// Serve strategic tools page (redirected to canonical /tools)
app.get('/strategic-tools', (req, res) => {
  res.redirect(301, '/tools');
});

// Serve OKRs page
app.get('/okrs', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'okrs.html'));
});

// Serve Gap Analysis page
app.get('/gap-analysis', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'gap-analysis.html'));
});

// Serve Three Horizons page
app.get('/three-horizons', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'three-horizons.html'));
});

// Serve OGSM page
app.get('/ogsm', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'ogsm.html'));
});

// Serve Simulation Lab page
app.get('/simulation-lab', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'simulation-lab.html'));
});

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'login.html'));
});

// Serve signup page → redirect to unified auth page
app.get('/signup', (req, res) => {
  res.redirect('/login?tab=signup&from=landing');
});

// Serve Super Admin Dashboard (برج المراقبة)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'admin.html'));
});

// Serve dashboard/welcome page (protected by frontend)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'dashboard.html'));
});

// Serve strategic pipeline page
app.get('/tools', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'tools.html'));
});

// Serve tool detail page
app.get('/tool', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'tool-detail.html'));
});

// Serve sectors page
app.get('/sectors', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'sectors.html'));
});

// Serve industries page
app.get('/industries', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'industries.html'));
});

// Serve entities page
app.get('/entities', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'entities.html'));
});

// Serve users page
app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'users.html'));
});

// Serve assessments page
app.get('/assessments', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'assessments.html'));
});

// Serve KPIs page
app.get('/kpis', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'kpis.html'));
});

// Serve settings page
app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'settings.html'));
});

// Serve settings-data page
app.get('/settings-data', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'settings-data.html'));
});

// Serve onboarding wizard
app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'onboarding.html'));
});

// Serve versions page
app.get('/versions', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'versions.html'));
});

// Serve choices page
app.get('/choices', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'choices.html'));
});

// Serve corrections page
app.get('/corrections', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'corrections.html'));
});

// Serve analysis page
app.get('/analysis', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'analysis.html'));
});

// Serve financial page
app.get('/financial', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'financial.html'));
});

// Serve integrations page
app.get('/integrations', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'integrations.html'));
});

// Serve directions page
app.get('/directions', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'directions.html'));
});

// Serve objectives page
app.get('/objectives', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'objectives.html'));
});

// Serve initiatives page
app.get('/initiatives', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'initiatives.html'));
});

// Serve reviews page
app.get('/reviews', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'reviews.html'));
});

// Redirect alerts to intelligence page (alerts are shown there)
app.get('/alerts', (req, res) => {
  res.redirect('/intelligence');
});

// Serve TOWS Matrix page
app.get('/tows', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'tows.html'));
});

// Serve Strategy Map / Causal Links page
app.get('/strategy-map', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'strategy-map.html'));
});

// Serve KPI entries page
app.get('/kpi-entries', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'kpi-entries.html'));
});

// Serve Priority Matrix page
app.get('/priority-matrix', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'priority-matrix.html'));
});
app.get('/inspector', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'inspector.html'));
});

// Serve Intelligence Dashboard
app.get('/intelligence', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'intelligence.html'));
});

// Serve Beginner Path
app.get('/beginner-path', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'beginner-path.html'));
});

// Serve Path 1 journey (moved) — redirect to landing
app.get('/path1', (req, res) => {
  res.redirect(302, '/');
});

// Serve Guided Journey
app.get('/journey', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'journey.html'));
});

// Serve Pricing page
app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pricing.html'));
});

// Serve Projects page
app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'projects.html'));
});

// Serve Tasks page
app.get('/tasks', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'tasks.html'));
});

// Serve Admin Decisions page
app.get('/admin-decisions', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'admin-decisions.html'));
});

// Serve SWOT page (moved) — redirect to canonical tool detail
app.get('/swot', (req, res) => {
  res.redirect(301, '/tool?code=SWOT');
});

// Serve Operations page
app.get('/operations', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'operations.html'));
});

// Serve CEO Executive Dashboard
app.get('/ceo-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'ceo-dashboard.html'));
});

// Serve Achievements page
app.get('/achievements', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'achievements.html'));
});

// Serve Strategic Calendar
app.get('/strategic-calendar', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'strategic-calendar.html'));
});

// Serve Activity Feed
app.get('/activity-feed', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'activity-feed.html'));
});

// Serve Auto Reports
app.get('/auto-reports', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'auto-reports.html'));
});

// Serve Risk Map
app.get('/risk-map', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'risk-map.html'));
});

// Serve Org DNA
app.get('/org-dna', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'org-dna.html'));
});

// Serve Benchmarking
app.get('/benchmarking', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'benchmarking.html'));
});

// Serve Stakeholders
app.get('/stakeholders', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'stakeholders.html'));
});

// Serve AI Presentation
app.get('/ai-presentation', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'ai-presentation.html'));
});

// Serve Live Board
app.get('/live-board', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'live-board.html'));
});

// Serve API Docs
app.get('/api-docs-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'api-docs.html'));
});

// Serve Webhooks
app.get('/webhooks', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'webhooks.html'));
});

// Serve Companies page (SUPER_ADMIN)
app.get('/companies', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'companies.html'));
});

// Serve AI Center
app.get('/ai-center', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'ai-center.html'));
});

// Serve Internal Environment Analysis
app.get('/internal-env', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'internal-env.html'));
});

// Serve Admin Panel
app.get('/admin-panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'admin-panel.html'));
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
