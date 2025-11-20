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

// Validate GCP configuration
function validateGcpConfiguration() {
  const gcpEnabled = process.env.GCP_ENABLED === 'true';
  const gcpProjectId = process.env.GCP_PROJECT_ID;

  if (gcpEnabled) {
    if (!gcpProjectId || gcpProjectId === 'your-gcp-project-id') {
      console.warn('⚠️  WARNING: GCP_ENABLED is true but GCP_PROJECT_ID is not configured.');
      console.warn('⚠️  Falling back to demo mode. Set GCP_PROJECT_ID in .env to enable real VM provisioning.');
      process.env.GCP_ENABLED = 'false';
      return false;
    }
    console.log('✓ GCP integration enabled');
    console.log(`✓ GCP Project ID: ${gcpProjectId}`);
    return true;
  } else {
    console.log('ℹ️  GCP integration disabled - running in demo mode');
    console.log('ℹ️  Set GCP_ENABLED=true and configure GCP_PROJECT_ID to enable real VM provisioning');
    return false;
  }
}

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

// Validate GCP configuration on startup
validateGcpConfiguration();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Allow all origins for development
app.use(cors({
  origin: true, // Allow all origins
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
  const gcpEnabled = process.env.GCP_ENABLED === 'true';
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    database: 'connected',
    gcpEnabled: gcpEnabled,
    mode: gcpEnabled ? 'production' : 'demo'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
