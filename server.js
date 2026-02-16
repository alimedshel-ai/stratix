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

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
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

// Protected route - Get profile
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

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
