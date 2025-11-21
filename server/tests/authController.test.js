const authController = require('../controllers/authController');
const firebaseAdmin = require('../services/firebaseAdmin');
const jwtService = require('../services/jwtService');
const dbService = require('../services/dbService');

// Mock dependencies
jest.mock('../services/firebaseAdmin');
jest.mock('../services/jwtService');
jest.mock('../services/dbService');

describe('Auth Controller - 2FA Flow', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup request, response, and next mocks
    req = {
      body: {},
      headers: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    // Set up test environment
    process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
  });

  describe('login with 2FA enabled', () => {
    test('should return temp token when 2FA is enabled', async () => {
      // Setup test data
      const testEmail = 'test@example.com';
      const testName = 'Test User';
      const testIdToken = 'firebase-id-token';
      const testTempToken = 'temp-jwt-token';

      req.body.idToken = testIdToken;

      // Mock Firebase verification
      firebaseAdmin.verifyIdToken.mockResolvedValue({
        email: testEmail,
        name: testName
      });

      // Mock database calls
      dbService.isEmailApproved.mockResolvedValue(true);
      dbService.get2FAStatus.mockResolvedValue({ enabled: true });

      // Mock JWT generation
      jwtService.generateTempToken.mockReturnValue(testTempToken);

      // Execute login
      await authController.login(req, res, next);

      // Verify the response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        requires2FA: true,
        tempToken: testTempToken,
        user: {
          email: testEmail,
          name: testName
        }
      });

      // Verify temp token was generated
      expect(jwtService.generateTempToken).toHaveBeenCalledWith({
        email: testEmail,
        name: testName
      });

      // Verify full access token was NOT generated
      expect(jwtService.generateAccessToken).not.toHaveBeenCalled();

      // Verify cookie was NOT set
      expect(res.cookie).not.toHaveBeenCalled();

      // Verify last login was NOT updated (should only update after 2FA completion)
      expect(dbService.updateLastLogin).not.toHaveBeenCalled();
    });

    test('should return full JWT when 2FA is disabled', async () => {
      // Setup test data
      const testEmail = 'test@example.com';
      const testName = 'Test User';
      const testIdToken = 'firebase-id-token';
      const testAccessToken = 'full-jwt-token';

      req.body.idToken = testIdToken;

      // Mock Firebase verification
      firebaseAdmin.verifyIdToken.mockResolvedValue({
        email: testEmail,
        name: testName
      });

      // Mock database calls
      dbService.isEmailApproved.mockResolvedValue(true);
      dbService.get2FAStatus.mockResolvedValue({ enabled: false });
      dbService.updateLastLogin.mockResolvedValue();

      // Mock JWT generation
      jwtService.generateAccessToken.mockReturnValue(testAccessToken);

      // Execute login
      await authController.login(req, res, next);

      // Verify the response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        accessToken: testAccessToken,
        user: {
          email: testEmail,
          name: testName
        }
      });

      // Verify full access token was generated
      expect(jwtService.generateAccessToken).toHaveBeenCalledWith({
        email: testEmail,
        name: testName
      });

      // Verify temp token was NOT generated
      expect(jwtService.generateTempToken).not.toHaveBeenCalled();

      // Verify cookie was set
      expect(res.cookie).toHaveBeenCalledWith('accessToken', testAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 3600000
      });

      // Verify last login was updated
      expect(dbService.updateLastLogin).toHaveBeenCalledWith(testEmail);
    });

    test('should handle database error when checking 2FA status', async () => {
      // Setup test data
      const testEmail = 'test@example.com';
      const testName = 'Test User';
      const testIdToken = 'firebase-id-token';

      req.body.idToken = testIdToken;

      // Mock Firebase verification
      firebaseAdmin.verifyIdToken.mockResolvedValue({
        email: testEmail,
        name: testName
      });

      // Mock database calls
      dbService.isEmailApproved.mockResolvedValue(true);
      dbService.get2FAStatus.mockRejectedValue(new Error('Database connection failed'));

      // Execute login
      await authController.login(req, res, next);

      // Verify error response
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    });
  });
});
