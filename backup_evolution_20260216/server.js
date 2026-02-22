require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./lib/prisma');
const { verifyToken } = require('./middleware/auth');
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

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for development — enable in production
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Basic Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/sectors', sectorsRoutes);
app.use('/api/industries', industriesRoutes);
app.use('/api/entities', entitiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/strategic', strategicRoutes);
app.use('/api/strategic/reviews', reviewsRoutes);
app.use('/api/versions', versionsRoutes);
app.use('/api/choices', choicesRoutes);
app.use('/api/corrections', correctionsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/directions', directionsRoutes);
app.use('/api/external-analysis', externalAnalysisRoutes);
app.use('/api/kpi-entries', kpiEntriesRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardApiRoutes);

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve dashboard/welcome page (protected by frontend)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve sectors page
app.get('/sectors', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sectors.html'));
});

// Serve industries page
app.get('/industries', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'industries.html'));
});

// Serve entities page
app.get('/entities', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'entities.html'));
});

// Serve users page
app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html'));
});

// Serve assessments page
app.get('/assessments', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assessments.html'));
});

// Serve KPIs page
app.get('/kpis', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kpis.html'));
});

// Serve settings page (placeholder)
app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html')); // Placeholder
});

// Serve versions page
app.get('/versions', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'versions.html'));
});

// Serve choices page
app.get('/choices', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'choices.html'));
});

// Serve corrections page
app.get('/corrections', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'corrections.html'));
});

// Serve analysis page
app.get('/analysis', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'analysis.html'));
});

// Serve financial page
app.get('/financial', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'financial.html'));
});

// Serve integrations page
app.get('/integrations', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'integrations.html'));
});

// Serve directions page
app.get('/directions', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'directions.html'));
});

// Serve objectives page
app.get('/objectives', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'objectives.html'));
});

// Serve initiatives page
app.get('/initiatives', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'initiatives.html'));
});

// Serve reviews page
app.get('/reviews', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reviews.html'));
});

// Serve alerts page
app.get('/alerts', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'alerts.html'));
});

// Serve KPI entries page
app.get('/kpi-entries', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kpi-entries.html'));
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/login');
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
});
