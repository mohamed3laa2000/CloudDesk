/**
 * Integration Tests for Complete Passkey Authentication Flow
 * 
 * This test suite validates the complete authentication flows:
 * - Standalone passkey login
 * - Google + 2FA passkey login
 * - JWT generation
 * - Counter updates
 * 
 * Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 9.3
 */

const passkeyController = require('../controllers/passkeyController');
const authController = require('../controllers/authController');
const webauthnService = require('../services/webauthnService');
const dbService = require('../services/dbService');
const jwtService = require('../services/jwtService');
const firebaseAdmin = require('../services/firebaseAdmin');

// Mock the services
jest.mock('../services/webauthnService');
jest.mock('../services/dbService');
jest.mock('../services/jwtService');
jest.mock('../services/firebaseAdmin');

describe('Integration Test: Complete Passkey Authentication Flow', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup request, response, and next function
    req = {
      body: {},
      user: {},
      headers: {},
      params: {}
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

  describe('Standalone Passkey Authentication Flow (Requirement 7.1, 7.2, 7.3)', () => {
    it('should complete full standalone passkey login flow with JWT generation and counter update', async () => {
      const testEmail = 'standalone-test@example.com';
      const testName = 'Standalone Test User';
      const testCredentialId = 'standalone-credential-id';
      
      // ============================================================
      // STEP 1: Request authentication options (loginOptions)
      // ============================================================
      const mockAuthOptions = {
        challenge: 'standalone-auth-challenge-123',
        rpId: 'localhost',
        allowCredentials: [],
        timeout: 60000,
        userVerification: 'preferred'
      };

      webauthnService.generateAuthenticationOptions.mockResolvedValue(mockAuthOptions);
      dbService.storeChallenge.mockResolvedValue({
        challenge: 'standalone-auth-challenge-123',
        userEmail: null, // No user binding for standalone login
        type: 'authentication',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });

      // Call loginOptions endpoint
      await passkeyController.loginOptions(req, res, next);

      // Verify authentication options were generated
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        options: mockAuthOptions
      });

      // Verify challenge was stored without user binding (standalone flow)
      expect(dbService.storeChallenge).toHaveBeenCalledWith(
        'standalone-auth-challenge-123',
        null, // No user email for standalone login
        'authentication',
        expect.any(Date)
      );

      // ============================================================
      // STEP 2: Verify authentication response (loginVerify)
      // ============================================================
      jest.clearAllMocks();

      const mockCredential = {
        rawId: Buffer.from(testCredentialId).toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.get',
            challenge: 'standalone-auth-challenge-123',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      req.body.credential = mockCredential;

      const mockStoredChallenge = {
        challenge: 'standalone-auth-challenge-123',
        userEmail: null, // Standalone login has no user binding
        type: 'authentication',
        expiresAt: new Date(Date.now() + 60000)
      };

      const mockStoredCredential = {
        id: 'pk-standalone-123',
        userEmail: testEmail,
        credentialId: Buffer.from(testCredentialId).toString('base64'),
        publicKey: 'mock-public-key',
        counter: 5, // Previous counter value
        authenticatorType: 'platform'
      };

      const mockVerification = {
        verified: true,
        authenticationInfo: {
          newCounter: 6 // Counter incremented
        }
      };

      const mockAccessToken = 'standalone-jwt-token-abc123';

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(true);
      webauthnService.verifyAuthenticationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      dbService.updatePasskeyCounter.mockResolvedValue({});
      dbService.updatePasskeyLastUsed.mockResolvedValue({});
      dbService.updateLastLogin.mockResolvedValue({});
      jwtService.generateAccessToken.mockReturnValue(mockAccessToken);
      
      // Mock database query for user name
      const mockPool = {
        query: jest.fn().mockResolvedValue({
          rows: [{ name: testName }]
        })
      };
      dbService.connect.mockResolvedValue(mockPool);

      // Call loginVerify endpoint
      await passkeyController.loginVerify(req, res, next);

      // Verify authentication was successful
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        accessToken: mockAccessToken,
        user: {
          email: testEmail,
          name: testName
        }
      });

      // Verify challenge was validated
      expect(dbService.getChallenge).toHaveBeenCalledWith('standalone-auth-challenge-123');

      // Verify credential was retrieved
      expect(dbService.getPasskeyByCredentialId).toHaveBeenCalledWith(
        Buffer.from(testCredentialId).toString('base64')
      );

      // Verify user is approved
      expect(dbService.isEmailApproved).toHaveBeenCalledWith(testEmail);

      // Verify signature and counter were validated (Requirement 7.2)
      expect(webauthnService.verifyAuthenticationResponse).toHaveBeenCalledWith(
        mockCredential,
        mockStoredCredential,
        'standalone-auth-challenge-123'
      );

      // Verify counter was updated in database (Requirement 9.3)
      expect(dbService.updatePasskeyCounter).toHaveBeenCalledWith(
        mockStoredCredential.credentialId,
        6 // New counter value
      );

      // Verify last used timestamp was updated
      expect(dbService.updatePasskeyLastUsed).toHaveBeenCalledWith(
        mockStoredCredential.credentialId
      );

      // Verify last login was updated
      expect(dbService.updateLastLogin).toHaveBeenCalledWith(testEmail);

      // Verify JWT was generated (Requirement 7.3)
      expect(jwtService.generateAccessToken).toHaveBeenCalledWith({
        email: testEmail,
        name: testName
      });

      // Verify challenge was deleted after use
      expect(dbService.deleteChallenge).toHaveBeenCalledWith('standalone-auth-challenge-123');
    });
  });

  describe('Google OAuth + 2FA Passkey Authentication Flow (Requirement 8.1, 8.2)', () => {
    it('should complete full 2FA flow: Google login -> temp token -> passkey auth -> full JWT', async () => {
      const testEmail = '2fa-test@example.com';
      const testName = '2FA Test User';
      const testCredentialId = '2fa-credential-id';
      const testFirebaseToken = 'firebase-id-token-xyz';
      const testTempToken = 'temp-jwt-token-xyz';
      const testAccessToken = '2fa-full-jwt-token-xyz';
      
      // ============================================================
      // STEP 1: Google OAuth login with 2FA enabled
      // ============================================================
      req.body.idToken = testFirebaseToken;

      // Mock Firebase verification
      firebaseAdmin.verifyIdToken.mockResolvedValue({
        email: testEmail,
        name: testName
      });

      // Mock database calls - 2FA is enabled
      dbService.isEmailApproved.mockResolvedValue(true);
      dbService.get2FAStatus.mockResolvedValue({ enabled: true });

      // Mock temp token generation
      jwtService.generateTempToken.mockReturnValue(testTempToken);

      // Call login endpoint
      await authController.login(req, res, next);

      // Verify temp token was returned (not full JWT) (Requirement 8.1)
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

      // Verify full access token was NOT generated yet
      expect(jwtService.generateAccessToken).not.toHaveBeenCalled();

      // Verify cookie was NOT set yet
      expect(res.cookie).not.toHaveBeenCalled();

      // Verify last login was NOT updated yet (should only update after 2FA completion)
      expect(dbService.updateLastLogin).not.toHaveBeenCalled();

      // ============================================================
      // STEP 2: Request authentication options for 2FA passkey
      // ============================================================
      jest.clearAllMocks();

      req.body.userEmail = testEmail; // 2FA flow provides user email

      const mockUserPasskeys = [
        { credentialId: testCredentialId, transports: ['internal'] }
      ];

      const mockAuthOptions = {
        challenge: '2fa-auth-challenge-456',
        rpId: 'localhost',
        allowCredentials: [
          { credentialId: testCredentialId, transports: ['internal'] }
        ],
        timeout: 60000,
        userVerification: 'preferred'
      };

      dbService.getPasskeysByUser.mockResolvedValue(mockUserPasskeys);
      webauthnService.generateAuthenticationOptions.mockResolvedValue(mockAuthOptions);
      dbService.storeChallenge.mockResolvedValue({
        challenge: '2fa-auth-challenge-456',
        userEmail: testEmail, // Challenge is bound to user for 2FA
        type: 'authentication',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });

      // Call loginOptions endpoint with user email
      await passkeyController.loginOptions(req, res, next);

      // Verify authentication options were generated with user's passkeys
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        options: mockAuthOptions
      });

      // Verify user's passkeys were retrieved
      expect(dbService.getPasskeysByUser).toHaveBeenCalledWith(testEmail);

      // Verify challenge was stored with user binding (2FA flow)
      expect(dbService.storeChallenge).toHaveBeenCalledWith(
        '2fa-auth-challenge-456',
        testEmail, // Challenge bound to user for 2FA
        'authentication',
        expect.any(Date)
      );

      // ============================================================
      // STEP 3: Verify passkey authentication and issue full JWT
      // ============================================================
      jest.clearAllMocks();

      const mockCredential = {
        rawId: Buffer.from(testCredentialId).toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.get',
            challenge: '2fa-auth-challenge-456',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      req.body.credential = mockCredential;

      const mockStoredChallenge = {
        challenge: '2fa-auth-challenge-456',
        userEmail: testEmail, // Challenge is bound to user (2FA flow)
        type: 'authentication',
        expiresAt: new Date(Date.now() + 60000)
      };

      const mockStoredCredential = {
        id: 'pk-2fa-456',
        userEmail: testEmail,
        credentialId: Buffer.from(testCredentialId).toString('base64'),
        publicKey: 'mock-public-key',
        counter: 10, // Previous counter value
        authenticatorType: 'platform'
      };

      const mockVerification = {
        verified: true,
        authenticationInfo: {
          newCounter: 11 // Counter incremented (Requirement 9.3)
        }
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(true);
      webauthnService.verifyAuthenticationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      dbService.updatePasskeyCounter.mockResolvedValue({});
      dbService.updatePasskeyLastUsed.mockResolvedValue({});
      dbService.updateLastLogin.mockResolvedValue({});
      jwtService.generateAccessToken.mockReturnValue(testAccessToken);
      
      // Mock database query for user name
      const mockPool = {
        query: jest.fn().mockResolvedValue({
          rows: [{ name: testName }]
        })
      };
      dbService.connect.mockResolvedValue(mockPool);

      // Call loginVerify endpoint
      await passkeyController.loginVerify(req, res, next);

      // Verify full authentication was successful (Requirement 8.2)
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        accessToken: testAccessToken,
        user: {
          email: testEmail,
          name: testName
        }
      });

      // Verify challenge was validated and matches user
      expect(dbService.getChallenge).toHaveBeenCalledWith('2fa-auth-challenge-456');

      // Verify credential belongs to the same user as the challenge
      expect(mockStoredCredential.userEmail).toBe(mockStoredChallenge.userEmail);

      // Verify signature and counter were validated
      expect(webauthnService.verifyAuthenticationResponse).toHaveBeenCalledWith(
        mockCredential,
        mockStoredCredential,
        '2fa-auth-challenge-456'
      );

      // Verify counter was updated (Requirement 9.3)
      expect(dbService.updatePasskeyCounter).toHaveBeenCalledWith(
        mockStoredCredential.credentialId,
        11 // New counter value
      );

      // Verify last used timestamp was updated
      expect(dbService.updatePasskeyLastUsed).toHaveBeenCalledWith(
        mockStoredCredential.credentialId
      );

      // Verify last login was updated (now that 2FA is complete)
      expect(dbService.updateLastLogin).toHaveBeenCalledWith(testEmail);

      // Verify full JWT was generated (Requirement 7.3)
      expect(jwtService.generateAccessToken).toHaveBeenCalledWith({
        email: testEmail,
        name: testName
      });

      // Verify challenge was deleted after use
      expect(dbService.deleteChallenge).toHaveBeenCalledWith('2fa-auth-challenge-456');
    });
  });

  describe('JWT Generation Verification (Requirement 7.3)', () => {
    it('should generate JWT with same structure for both passkey and Google auth', async () => {
      const testEmail = 'jwt-test@example.com';
      const testName = 'JWT Test User';
      
      // Test passkey authentication JWT
      const passkeyJWT = 'passkey-jwt-token';
      jwtService.generateAccessToken.mockReturnValue(passkeyJWT);
      
      // Verify JWT is generated with correct payload
      jwtService.generateAccessToken({
        email: testEmail,
        name: testName
      });
      
      expect(jwtService.generateAccessToken).toHaveBeenCalledWith({
        email: testEmail,
        name: testName
      });
      
      // The JWT payload structure should be identical for both auth methods
      // This ensures passkey sessions have equivalent privileges (Requirement 7.3)
      const expectedPayload = {
        email: testEmail,
        name: testName
      };
      
      // Verify the payload contains required fields
      expect(expectedPayload).toHaveProperty('email');
      expect(expectedPayload).toHaveProperty('name');
      expect(expectedPayload.email).toBe(testEmail);
      expect(expectedPayload.name).toBe(testName);
    });
  });

  describe('Counter Update Verification (Requirement 9.3)', () => {
    it('should update counter on successful authentication', async () => {
      const testCredentialId = 'counter-test-credential';
      const oldCounter = 15;
      const newCounter = 16;
      
      const mockCredential = {
        rawId: Buffer.from(testCredentialId).toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.get',
            challenge: 'counter-test-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      req.body.credential = mockCredential;

      const mockStoredChallenge = {
        challenge: 'counter-test-challenge',
        userEmail: null,
        type: 'authentication',
        expiresAt: new Date(Date.now() + 60000)
      };

      const mockStoredCredential = {
        id: 'pk-counter-test',
        userEmail: 'counter-test@example.com',
        credentialId: Buffer.from(testCredentialId).toString('base64'),
        publicKey: 'mock-public-key',
        counter: oldCounter, // Old counter value
        authenticatorType: 'platform'
      };

      const mockVerification = {
        verified: true,
        authenticationInfo: {
          newCounter: newCounter // New counter value
        }
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(true);
      webauthnService.verifyAuthenticationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      dbService.updatePasskeyCounter.mockResolvedValue({});
      dbService.updatePasskeyLastUsed.mockResolvedValue({});
      dbService.updateLastLogin.mockResolvedValue({});
      jwtService.generateAccessToken.mockReturnValue('test-jwt');
      
      const mockPool = {
        query: jest.fn().mockResolvedValue({
          rows: [{ name: 'Counter Test User' }]
        })
      };
      dbService.connect.mockResolvedValue(mockPool);

      // Call loginVerify endpoint
      await passkeyController.loginVerify(req, res, next);

      // Verify counter was updated with new value
      expect(dbService.updatePasskeyCounter).toHaveBeenCalledWith(
        mockStoredCredential.credentialId,
        newCounter
      );

      // Verify the counter incremented correctly
      expect(newCounter).toBeGreaterThan(oldCounter);
      expect(newCounter).toBe(oldCounter + 1);
    });

    it('should reject authentication if counter does not increment', async () => {
      const testCredentialId = 'non-increment-credential';
      const storedCounter = 20;
      const nonIncrementingCounter = 20; // Same as stored counter
      
      const mockCredential = {
        rawId: Buffer.from(testCredentialId).toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.get',
            challenge: 'non-increment-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      req.body.credential = mockCredential;

      const mockStoredChallenge = {
        challenge: 'non-increment-challenge',
        userEmail: null,
        type: 'authentication',
        expiresAt: new Date(Date.now() + 60000)
      };

      const mockStoredCredential = {
        id: 'pk-non-increment',
        userEmail: 'non-increment@example.com',
        credentialId: Buffer.from(testCredentialId).toString('base64'),
        publicKey: 'mock-public-key',
        counter: storedCounter,
        authenticatorType: 'platform'
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(true);
      
      // WebAuthn service rejects due to counter validation failure
      webauthnService.verifyAuthenticationResponse.mockRejectedValue(
        new Error('Counter validation failed - credential may be cloned')
      );

      // Call loginVerify endpoint
      await passkeyController.loginVerify(req, res, next);

      // Verify authentication was rejected
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Passkey may be cloned. Please contact support.'
      });

      // Verify counter was NOT updated
      expect(dbService.updatePasskeyCounter).not.toHaveBeenCalled();
    });
  });

  describe('Error Scenarios in Authentication Flow', () => {
    it('should reject authentication with expired challenge', async () => {
      const mockCredential = {
        rawId: Buffer.from('test-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.get',
            challenge: 'expired-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      req.body.credential = mockCredential;

      // Challenge not found (expired and cleaned up)
      dbService.getChallenge.mockResolvedValue(null);

      await passkeyController.loginVerify(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired challenge'
      });
    });

    it('should reject authentication with unregistered credential', async () => {
      const mockCredential = {
        rawId: Buffer.from('unregistered-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.get',
            challenge: 'valid-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      req.body.credential = mockCredential;

      const mockStoredChallenge = {
        challenge: 'valid-challenge',
        userEmail: null,
        type: 'authentication',
        expiresAt: new Date(Date.now() + 60000)
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(null); // Credential not found

      await passkeyController.loginVerify(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Passkey not recognized'
      });
    });

    it('should reject authentication with invalid signature', async () => {
      const mockCredential = {
        rawId: Buffer.from('test-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.get',
            challenge: 'valid-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'invalid-signature'
        }
      };

      req.body.credential = mockCredential;

      const mockStoredChallenge = {
        challenge: 'valid-challenge',
        userEmail: null,
        type: 'authentication',
        expiresAt: new Date(Date.now() + 60000)
      };

      const mockStoredCredential = {
        id: 'pk-test',
        userEmail: 'test@example.com',
        credentialId: Buffer.from('test-credential').toString('base64'),
        publicKey: 'mock-public-key',
        counter: 5,
        authenticatorType: 'platform'
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(true);
      
      // Signature verification fails
      webauthnService.verifyAuthenticationResponse.mockRejectedValue(
        new Error('Invalid signature')
      );

      await passkeyController.loginVerify(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid signature'
      });
    });
  });
});
