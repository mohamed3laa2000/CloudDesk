const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');
const { initializeAdmin } = require('./services/firebaseAdmin');
const dbService = require('./services/dbService');

// Initialize Firebase Admin SDK
try {
  initializeAdmin();
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

// Initialize database connection
(async () => {
  try {
    await dbService.connect();
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
  }
})();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
