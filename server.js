require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
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
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sectors', sectorsRoutes);
app.use('/api/industries', industriesRoutes);
app.use('/api/entities', entitiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/strategic', strategicRoutes);
app.use('/api/reviews', reviewsRoutes);

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Stratix server is running on http://localhost:${PORT}`);
  console.log(`📝 Login at http://localhost:${PORT}/login`);
});
