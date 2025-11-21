/**
 * Error Scenario Tests for Passkey Authentication
 * 
 * This test suite validates error handling for:
 * - Expired challenges (Requirement 11.5)
 * - Invalid signatures (Requirement 11.4)
 * - Counter validation failures (Requirement 9.4)
 * - Unregistered credentials (Requirement 7.5)
 * - Network errors (Requirement 7.4)
 * 
 * Requirements: 7.4, 7.5, 9.4, 11.2, 11.5
 */

const passkeyController = require('../controllers/passkeyController');
const webauthnService = require('../services/webauthnService');
const dbService = require('../services/dbService');

// Mock the services
jest.mock('../services/webauthnService');
jest.mock('../services/dbService');

describe('Passkey Error Scenarios', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      user: {
        email: 'test@example.com',
        name: 'Test User'
      },
      params: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('Expired Challenge Scenarios (Requirement 11.5)', () => {
    it('should reject registration with expired challenge', async () => {
      // Arrange
      const mockCredential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'expired-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64')
        },
        authenticatorAttachment: 'platform'
      };

      req.body.credential = mockCredential;

      // Challenge not found (expired and cleaned up)
      dbService.getChallenge.mockResolvedValue(null);

      // Act
      await passkeyController.registerVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Invalid or expired challenge'
      });
      expect(webauthnService.verifyRegistrationResponse).not.toHaveBeenCalled();
    });

    it('should reject authentication with expired challenge', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('test-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'expired-auth-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      req.body.credential = mockCredential;

      // Challenge not found (expired and cleaned up)
      dbService.getChallenge.mockResolvedValue(null);

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired challenge'
      });
      expect(webauthnService.verifyAuthenticationResponse).not.toHaveBeenCalled();
    });

    it('should reject challenge that has passed 5-minute expiration', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('test-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'old-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      req.body.credential = mockCredential;

      // Challenge exists but is expired (past 5 minutes)
      const expiredChallenge = {
        challenge: 'old-challenge',
        userEmail: null,
        type: 'authentication',
        expiresAt: new Date(Date.now() - 60000) // Expired 1 minute ago
      };

      dbService.getChallenge.mockResolvedValue(expiredChallenge);

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Challenge has expired'
      });
    });
  });

  describe('Invalid Signature Scenarios (Requirement 11.4)', () => {
    it('should reject authentication with invalid signature', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('test-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'valid-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'invalid-signature-data'
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

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid signature'
      });
      expect(dbService.updatePasskeyCounter).not.toHaveBeenCalled();
    });

    it('should reject registration with invalid attestation signature', async () => {
      // Arrange
      const mockCredential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'valid-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          attestationObject: 'invalid-attestation'
        },
        authenticatorAttachment: 'platform'
      };

      req.body.credential = mockCredential;

      const mockStoredChallenge = {
        challenge: 'valid-challenge',
        userEmail: 'test@example.com',
        type: 'registration',
        expiresAt: new Date(Date.now() + 60000)
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      
      // Attestation verification fails
      webauthnService.verifyRegistrationResponse.mockRejectedValue(
        new Error('Invalid attestation signature')
      );

      // Act
      await passkeyController.registerVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Registration verification failed'
      });
      expect(dbService.createPasskey).not.toHaveBeenCalled();
    });

    it('should reject authentication with tampered clientDataJSON', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('test-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'tampered-challenge', // Different from stored challenge
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      req.body.credential = mockCredential;

      const mockStoredChallenge = {
        challenge: 'original-challenge', // Original challenge
        userEmail: null,
        type: 'authentication',
        expiresAt: new Date(Date.now() + 60000)
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Challenge mismatch'
      });
    });
  });

  describe('Counter Validation Failure Scenarios (Requirement 9.4)', () => {
    it('should reject authentication when counter does not increment', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('test-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
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

      const mockStoredCredential = {
        id: 'pk-test',
        userEmail: 'test@example.com',
        credentialId: Buffer.from('test-credential').toString('base64'),
        publicKey: 'mock-public-key',
        counter: 20, // Current counter
        authenticatorType: 'platform'
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(true);
      
      // Counter validation fails (counter did not increment)
      webauthnService.verifyAuthenticationResponse.mockRejectedValue(
        new Error('Counter validation failed - credential may be cloned')
      );

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Passkey may be cloned. Please contact support.'
      });
      expect(dbService.updatePasskeyCounter).not.toHaveBeenCalled();
    });

    it('should reject authentication when counter decreases (potential cloning)', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('test-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
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

      const mockStoredCredential = {
        id: 'pk-test',
        userEmail: 'test@example.com',
        credentialId: Buffer.from('test-credential').toString('base64'),
        publicKey: 'mock-public-key',
        counter: 100, // High counter value
        authenticatorType: 'platform'
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(true);
      
      // Counter decreased (potential cloning attack)
      webauthnService.verifyAuthenticationResponse.mockRejectedValue(
        new Error('Counter validation failed - credential may be cloned')
      );

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Passkey may be cloned. Please contact support.'
      });
    });

    it('should flag credential as potentially cloned on counter failure', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('suspicious-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
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

      const mockStoredCredential = {
        id: 'pk-suspicious',
        userEmail: 'test@example.com',
        credentialId: Buffer.from('suspicious-credential').toString('base64'),
        publicKey: 'mock-public-key',
        counter: 50,
        authenticatorType: 'cross-platform'
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(true);
      
      webauthnService.verifyAuthenticationResponse.mockRejectedValue(
        new Error('Counter validation failed - credential may be cloned')
      );

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Passkey may be cloned. Please contact support.'
      }));
      
      // Verify counter was NOT updated (security measure)
      expect(dbService.updatePasskeyCounter).not.toHaveBeenCalled();
    });
  });

  describe('Unregistered Credential Scenarios (Requirement 7.5)', () => {
    it('should reject authentication with unregistered credential', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('unregistered-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
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

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Passkey not recognized'
      });
      expect(webauthnService.verifyAuthenticationResponse).not.toHaveBeenCalled();
    });

    it('should reject authentication with credential from different user', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('other-user-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'valid-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      req.body.credential = mockCredential;

      // Challenge bound to user1
      const mockStoredChallenge = {
        challenge: 'valid-challenge',
        userEmail: 'user1@example.com',
        type: 'authentication',
        expiresAt: new Date(Date.now() + 60000)
      };

      // Credential belongs to user2
      const mockStoredCredential = {
        id: 'pk-other-user',
        userEmail: 'user2@example.com',
        credentialId: Buffer.from('other-user-credential').toString('base64'),
        publicKey: 'mock-public-key',
        counter: 5,
        authenticatorType: 'platform'
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Challenge does not match user session'
      });
      expect(webauthnService.verifyAuthenticationResponse).not.toHaveBeenCalled();
    });

    it('should reject authentication for deleted credential', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('deleted-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
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
      dbService.getPasskeyByCredentialId.mockResolvedValue(null); // Credential was deleted

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Passkey not recognized'
      });
    });
  });

  describe('Network Error Scenarios (Requirement 7.4)', () => {
    it('should handle database connection failure during registration', async () => {
      // Arrange
      req.body.authenticatorType = 'platform';
      
      dbService.getPasskeysByUser.mockRejectedValue(
        new Error('ECONNREFUSED: Connection refused')
      );

      // Act
      await passkeyController.registerOptions(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    });

    it('should handle database connection failure during authentication', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('test-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'valid-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      req.body.credential = mockCredential;

      dbService.getChallenge.mockRejectedValue(
        new Error('Database connection timeout')
      );

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    });

    it('should handle database timeout during passkey listing', async () => {
      // Arrange
      dbService.getPasskeysByUser.mockRejectedValue(
        new Error('Query timeout exceeded')
      );

      // Act
      await passkeyController.listPasskeys(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    });

    it('should handle database failure during passkey deletion', async () => {
      // Arrange
      req.params.id = 'pk-123';
      
      dbService.deletePasskey.mockRejectedValue(
        new Error('Database connection lost')
      );

      // Act
      await passkeyController.deletePasskey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    });

    it('should handle database failure during 2FA status update', async () => {
      // Arrange
      req.body.enabled = true;
      
      dbService.set2FAStatus.mockRejectedValue(
        new Error('Network error: ETIMEDOUT')
      );

      // Act
      await passkeyController.set2FAStatus(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    });

    it('should handle challenge storage failure', async () => {
      // Arrange
      const mockOptions = {
        challenge: 'test-challenge',
        rpId: 'localhost'
      };

      webauthnService.generateAuthenticationOptions.mockResolvedValue(mockOptions);
      dbService.storeChallenge.mockRejectedValue(
        new Error('Database write failed')
      );

      // Act
      await passkeyController.loginOptions(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to store challenge'
      });
    });

    it('should handle WebAuthn service failure', async () => {
      // Arrange
      webauthnService.generateAuthenticationOptions.mockRejectedValue(
        new Error('WebAuthn library error')
      );

      // Act
      await passkeyController.loginOptions(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to generate authentication options'
      });
    });
  });

  describe('Additional Error Scenarios', () => {
    it('should reject registration with wrong challenge type', async () => {
      // Arrange
      const mockCredential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'auth-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64')
        },
        authenticatorAttachment: 'platform'
      };

      req.body.credential = mockCredential;

      // Challenge is for authentication, not registration
      const wrongTypeChallenge = {
        challenge: 'auth-challenge',
        userEmail: null,
        type: 'authentication', // Wrong type
        expiresAt: new Date(Date.now() + 60000)
      };

      dbService.getChallenge.mockResolvedValue(wrongTypeChallenge);

      // Act
      await passkeyController.registerVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Invalid challenge type'
      });
    });

    it('should reject authentication with wrong challenge type', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('test-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'reg-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      req.body.credential = mockCredential;

      // Challenge is for registration, not authentication
      const wrongTypeChallenge = {
        challenge: 'reg-challenge',
        userEmail: 'test@example.com',
        type: 'registration', // Wrong type
        expiresAt: new Date(Date.now() + 60000)
      };

      dbService.getChallenge.mockResolvedValue(wrongTypeChallenge);

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid challenge type'
      });
    });

    it('should reject authentication for unapproved user account', async () => {
      // Arrange
      const mockCredential = {
        rawId: Buffer.from('test-credential').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
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

      const mockStoredCredential = {
        id: 'pk-test',
        userEmail: 'unapproved@example.com',
        credentialId: Buffer.from('test-credential').toString('base64'),
        publicKey: 'mock-public-key',
        counter: 5,
        authenticatorType: 'platform'
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(false); // User not approved

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Account not authorized'
      });
    });
  });
});
