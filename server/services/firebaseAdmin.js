const admin = require('firebase-admin');

let isInitialized = false;

/**
 * Initialize Firebase Admin SDK with credentials from environment variables
 * This should be called once when the server starts
 */
const initializeAdmin = () => {
  if (isInitialized) {
    console.log('Firebase Admin already initialized');
    return;
  }

  try {
    // Validate required environment variables
    const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
    }

    // Initialize Firebase Admin with service account credentials
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    isInitialized = true;
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error.message);
    throw new Error(`Firebase Admin initialization failed: ${error.message}`);
  }
};

/**
 * Verify a Firebase ID token
 * @param {string} idToken - The Firebase ID token to verify
 * @returns {Promise<Object>} - The decoded token containing user information
 * @throws {Error} - If token is invalid, expired, or verification fails
 */
const verifyIdToken = async (idToken) => {
  if (!isInitialized) {
    throw new Error('Firebase Admin not initialized. Call initializeAdmin() first.');
  }

  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Invalid token: Token must be a non-empty string');
  }

  try {
    // Verify the ID token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Return decoded token with user information
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split('@')[0],
      emailVerified: decodedToken.email_verified,
    };
  } catch (error) {
    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Firebase token has expired');
    } else if (error.code === 'auth/argument-error') {
      throw new Error('Invalid Firebase token format');
    } else if (error.code === 'auth/invalid-id-token') {
      throw new Error('Invalid Firebase token');
    } else {
      throw new Error(`Firebase token verification failed: ${error.message}`);
    }
  }
};

module.exports = {
  initializeAdmin,
  verifyIdToken,
};
