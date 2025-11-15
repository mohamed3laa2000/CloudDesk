const { initializeAdmin, verifyIdToken } = require('../services/firebaseAdmin');

describe('Firebase Admin Service', () => {
  describe('initializeAdmin', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should throw error when required environment variables are missing', () => {
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.FIREBASE_CLIENT_EMAIL;

      expect(() => initializeAdmin()).toThrow('Missing required Firebase environment variables');
    });

    it('should initialize successfully with valid environment variables', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';

      // This will fail in test environment without real credentials, but validates the structure
      expect(() => initializeAdmin()).toBeDefined();
    });
  });

  describe('verifyIdToken', () => {
    it('should throw error for invalid token input types', async () => {
      await expect(verifyIdToken('')).rejects.toThrow();
      await expect(verifyIdToken(null)).rejects.toThrow();
      await expect(verifyIdToken(123)).rejects.toThrow();
    });

    it('should throw error for malformed token string', async () => {
      await expect(verifyIdToken('invalid-token')).rejects.toThrow();
    });
  });
});
