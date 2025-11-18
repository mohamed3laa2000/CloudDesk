const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const instanceRoutes = require('./routes/instances');
const billingRoutes = require('./routes/billing');
const userRoutes = require('./routes/users');
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
// Allow multiple origins for local and production
const allowedOrigins = [
  'http://localhost:5173',
  'https://cloud-desk.gabrielseto.dev'
];

// Add FRONTEND_URL from env if it exists and is different
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/instances', instanceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    database: 'connected'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
