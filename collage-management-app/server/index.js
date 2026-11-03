const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const commonRoutes = require('./routes/common');
const adminRoutes = require('./routes/admin');
const facultyRoutes = require('./routes/faculty');
const studentRoutes = require('./routes/student');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Express built-in body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes Mounting (support both with and without /api prefix for Vercel compatibility)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/common', '/common'], commonRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/faculty', '/faculty'], facultyRoutes);
app.use(['/api/student', '/student'], studentRoutes);

// Serve static frontend assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Simple Health Check & API Status
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'OK', message: 'College Management System API is running smoothly.' });
});

// Single Page Application (SPA) fallback: serve frontend index.html for all non-API GET requests
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api/')) {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    return res.sendFile(indexPath);
  }
  next();
});

// 404 Route handler for unknown endpoints
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server (only when executed directly, not when imported as serverless function)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  College Management Server running on port ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/health`);
    console.log(`==================================================`);
  });
}

// Export Express app for Vercel Serverless Functions
module.exports = app;
