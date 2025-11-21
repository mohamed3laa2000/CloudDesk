const passkeyController = require('../controllers/passkeyController');
const webauthnService = require('../services/webauthnService');
const dbService = require('../services/dbService');

// Mock the services
jest.mock('../services/webauthnService');
jest.mock('../services/dbService');

describe('Passkey Controller - Registration Endpoints', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup request, response, and next function
    req = {
      body: {},
      user: {
        email: 'test@example.com',
        name: 'Test User'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('registerOptions', () => {
    it('should generate registration options for platform authenticator', async () => {
      // Arrange
      req.body.authenticatorType = 'platform';
      
      const mockPasskeys = [];
      const mockOptions = {
        challenge: 'mock-challenge-123',
        rp: { name: 'CloudDesk', id: 'localhost' },
        user: { id: 'test@example.com', name: 'test@example.com', displayName: 'Test User' }
      };

      dbService.getPasskeysByUser.mockResolvedValue(mockPasskeys);
      webauthnService.generateRegistrationOptions.mockResolvedValue(mockOptions);
      dbService.storeChallenge.mockResolvedValue({});

      // Act
      await passkeyController.registerOptions(req, res, next);

      // Assert
      expect(dbService.getPasskeysByUser).toHaveBeenCalledWith('test@example.com');
      expect(webauthnService.generateRegistrationOptions).toHaveBeenCalledWith(
        { email: 'test@example.com', name: 'Test User' },
        'platform',
        []
      );
      expect(dbService.storeChallenge).toHaveBeenCalledWith(
        'mock-challenge-123',
        'test@example.com',
        'registration',
        expect.any(Date)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        options: mockOptions
      });
    });

    it('should generate registration options for cross-platform authenticator', async () => {
      // Arrange
      req.body.authenticatorType = 'cross-platform';
      
      const mockPasskeys = [];
      const mockOptions = {
        challenge: 'mock-challenge-456',
        rp: { name: 'CloudDesk', id: 'localhost' }
      };

      dbService.getPasskeysByUser.mockResolvedValue(mockPasskeys);
      webauthnService.generateRegistrationOptions.mockResolvedValue(mockOptions);
      dbService.storeChallenge.mockResolvedValue({});

      // Act
      await passkeyController.registerOptions(req, res, next);

      // Assert
      expect(webauthnService.generateRegistrationOptions).toHaveBeenCalledWith(
        { email: 'test@example.com', name: 'Test User' },
        'cross-platform',
        []
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should exclude existing credentials from registration', async () => {
      // Arrange
      req.body.authenticatorType = 'platform';
      
      const mockPasskeys = [
        { credentialId: 'cred-1', transports: ['internal'] },
        { credentialId: 'cred-2', transports: ['usb', 'nfc'] }
      ];
      const mockOptions = { challenge: 'mock-challenge' };

      dbService.getPasskeysByUser.mockResolvedValue(mockPasskeys);
      webauthnService.generateRegistrationOptions.mockResolvedValue(mockOptions);
      dbService.storeChallenge.mockResolvedValue({});

      // Act
      await passkeyController.registerOptions(req, res, next);

      // Assert
      expect(webauthnService.generateRegistrationOptions).toHaveBeenCalledWith(
        expect.any(Object),
        'platform',
        [
          { credentialId: 'cred-1', transports: ['internal'] },
          { credentialId: 'cred-2', transports: ['usb', 'nfc'] }
        ]
      );
    });

    it('should return 400 if authenticatorType is missing', async () => {
      // Arrange
      req.body.authenticatorType = undefined;

      // Act
      await passkeyController.registerOptions(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'authenticatorType must be either "platform" or "cross-platform"'
      });
    });

    it('should return 400 if authenticatorType is invalid', async () => {
      // Arrange
      req.body.authenticatorType = 'invalid-type';

      // Act
      await passkeyController.registerOptions(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'authenticatorType must be either "platform" or "cross-platform"'
      });
    });

    it('should return 503 if database is unavailable', async () => {
      // Arrange
      req.body.authenticatorType = 'platform';
      dbService.getPasskeysByUser.mockRejectedValue(new Error('Database connection failed'));

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
  });

  describe('registerVerify', () => {
    it('should verify registration and store passkey', async () => {
      // Arrange
      const mockCredential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'mock-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          transports: ['internal']
        },
        authenticatorAttachment: 'platform'
      };

      req.body.credential = mockCredential;
      req.body.friendlyName = 'My Phone';

      const mockStoredChallenge = {
        challenge: 'mock-challenge',
        userEmail: 'test@example.com',
        type: 'registration',
        expiresAt: new Date(Date.now() + 60000)
      };

      const mockVerification = {
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from('credential-id-123'),
          credentialPublicKey: Buffer.from('public-key-data'),
          counter: 0,
          aaguid: 'aaguid-123'
        }
      };

      const mockPasskey = {
        id: 'pk-123',
        credentialId: 'Y3JlZGVudGlhbC1pZC0xMjM=',
        authenticatorType: 'platform',
        friendlyName: 'My Phone',
        createdAt: new Date()
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      webauthnService.verifyRegistrationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      dbService.createPasskey.mockResolvedValue(mockPasskey);

      // Act
      await passkeyController.registerVerify(req, res, next);

      // Assert
      expect(dbService.getChallenge).toHaveBeenCalledWith('mock-challenge');
      expect(webauthnService.verifyRegistrationResponse).toHaveBeenCalledWith(
        mockCredential,
        'mock-challenge'
      );
      expect(dbService.deleteChallenge).toHaveBeenCalledWith('mock-challenge');
      expect(dbService.createPasskey).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          credentialId: 'Y3JlZGVudGlhbC1pZC0xMjM=',
          authenticatorType: 'platform',
          friendlyName: 'My Phone'
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        passkey: expect.objectContaining({
          id: 'pk-123',
          friendlyName: 'My Phone'
        })
      });
    });

    it('should return 400 if credential is missing', async () => {
      // Arrange
      req.body.credential = undefined;

      // Act
      await passkeyController.registerVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'credential is required'
      });
    });

    it('should return 400 if challenge is invalid or expired', async () => {
      // Arrange
      const mockCredential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'invalid-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64')
        }
      };

      req.body.credential = mockCredential;
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
    });

    it('should return 400 if challenge does not match user session', async () => {
      // Arrange
      const mockCredential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'mock-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64')
        }
      };

      req.body.credential = mockCredential;

      const mockStoredChallenge = {
        challenge: 'mock-challenge',
        userEmail: 'different@example.com', // Different user
        type: 'registration',
        expiresAt: new Date(Date.now() + 60000)
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);

      // Act
      await passkeyController.registerVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Challenge does not match user session'
      });
    });

    it('should return 409 if credential already exists', async () => {
      // Arrange
      const mockCredential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'mock-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64')
        },
        authenticatorAttachment: 'platform'
      };

      req.body.credential = mockCredential;

      const mockStoredChallenge = {
        challenge: 'mock-challenge',
        userEmail: 'test@example.com',
        type: 'registration',
        expiresAt: new Date(Date.now() + 60000)
      };

      const mockVerification = {
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from('credential-id-123'),
          credentialPublicKey: Buffer.from('public-key-data'),
          counter: 0
        }
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      webauthnService.verifyRegistrationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      dbService.createPasskey.mockRejectedValue(new Error('A passkey with this credential ID already exists'));

      // Act
      await passkeyController.registerVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conflict',
        message: 'This authenticator is already registered'
      });
    });
  });

  describe('loginOptions', () => {
    it('should generate authentication options', async () => {
      // Arrange
      const mockOptions = {
        challenge: 'mock-auth-challenge-123',
        rpId: 'localhost',
        allowCredentials: [],
        timeout: 60000,
        userVerification: 'preferred'
      };

      webauthnService.generateAuthenticationOptions.mockResolvedValue(mockOptions);
      dbService.storeChallenge.mockResolvedValue({});

      // Act
      await passkeyController.loginOptions(req, res, next);

      // Assert
      expect(webauthnService.generateAuthenticationOptions).toHaveBeenCalledWith([]);
      expect(dbService.storeChallenge).toHaveBeenCalledWith(
        'mock-auth-challenge-123',
        null, // No user email for authentication
        'authentication',
        expect.any(Date)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        options: mockOptions
      });
    });

    it('should return 500 if authentication options generation fails', async () => {
      // Arrange
      webauthnService.generateAuthenticationOptions.mockRejectedValue(
        new Error('Failed to generate options')
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

    it('should return 500 if challenge storage fails', async () => {
      // Arrange
      const mockOptions = { challenge: 'mock-challenge' };
      webauthnService.generateAuthenticationOptions.mockResolvedValue(mockOptions);
      dbService.storeChallenge.mockRejectedValue(new Error('Database error'));

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
  });

  describe('loginVerify', () => {
    let mockCredential;
    let mockStoredChallenge;
    let mockStoredCredential;
    let mockVerification;

    beforeEach(() => {
      mockCredential = {
        rawId: Buffer.from('credential-id-123').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            challenge: 'mock-auth-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          authenticatorData: 'mock-auth-data',
          signature: 'mock-signature'
        }
      };

      mockStoredChallenge = {
        challenge: 'mock-auth-challenge',
        userEmail: null,
        type: 'authentication',
        expiresAt: new Date(Date.now() + 60000)
      };

      mockStoredCredential = {
        id: 'pk-123',
        userEmail: 'test@example.com',
        credentialId: Buffer.from('credential-id-123').toString('base64'),
        publicKey: 'mock-public-key',
        counter: 5,
        authenticatorType: 'platform'
      };

      mockVerification = {
        verified: true,
        authenticationInfo: {
          newCounter: 6
        }
      };

      // Mock JWT service
      jest.mock('../services/jwtService', () => ({
        generateAccessToken: jest.fn().mockReturnValue('mock-jwt-token')
      }));
    });

    it('should verify authentication and generate JWT', async () => {
      // Arrange
      req.body.credential = mockCredential;

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(true);
      webauthnService.verifyAuthenticationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      dbService.updatePasskeyCounter.mockResolvedValue({});
      dbService.updatePasskeyLastUsed.mockResolvedValue({});
      dbService.updateLastLogin.mockResolvedValue({});
      
      // Mock database query for user name
      const mockPool = {
        query: jest.fn().mockResolvedValue({
          rows: [{ name: 'Test User' }]
        })
      };
      dbService.connect.mockResolvedValue(mockPool);

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(dbService.getChallenge).toHaveBeenCalledWith('mock-auth-challenge');
      expect(dbService.getPasskeyByCredentialId).toHaveBeenCalledWith(
        Buffer.from('credential-id-123').toString('base64')
      );
      expect(dbService.isEmailApproved).toHaveBeenCalledWith('test@example.com');
      expect(webauthnService.verifyAuthenticationResponse).toHaveBeenCalledWith(
        mockCredential,
        mockStoredCredential,
        'mock-auth-challenge'
      );
      expect(dbService.updatePasskeyCounter).toHaveBeenCalledWith(
        mockStoredCredential.credentialId,
        6
      );
      expect(dbService.updatePasskeyLastUsed).toHaveBeenCalledWith(
        mockStoredCredential.credentialId
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        accessToken: expect.any(String),
        user: {
          email: 'test@example.com',
          name: 'Test User'
        }
      });
    });

    it('should return 400 if credential is missing', async () => {
      // Arrange
      req.body.credential = undefined;

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'credential is required'
      });
    });

    it('should return 401 if challenge is invalid or expired', async () => {
      // Arrange
      req.body.credential = mockCredential;
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
    });

    it('should return 401 if challenge type is not authentication', async () => {
      // Arrange
      req.body.credential = mockCredential;
      const wrongTypeChallenge = { ...mockStoredChallenge, type: 'registration' };
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

    it('should return 401 if passkey is not recognized', async () => {
      // Arrange
      req.body.credential = mockCredential;
      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(null);

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

    it('should return 403 if user account is not authorized', async () => {
      // Arrange
      req.body.credential = mockCredential;
      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(false);

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

    it('should return 401 if signature verification fails', async () => {
      // Arrange
      req.body.credential = mockCredential;
      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(true);
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
    });

    it('should return 401 with specific message if counter validation fails', async () => {
      // Arrange
      req.body.credential = mockCredential;
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
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Passkey may be cloned. Please contact support.'
      });
    });

    it('should reject authentication if challenge is bound to different user (session-bound validation)', async () => {
      // Arrange - Challenge is bound to user1@example.com but credential belongs to user2@example.com
      req.body.credential = mockCredential;
      
      const sessionBoundChallenge = {
        ...mockStoredChallenge,
        userEmail: 'user1@example.com' // Challenge bound to user1
      };
      
      const differentUserCredential = {
        ...mockStoredCredential,
        userEmail: 'user2@example.com' // Credential belongs to user2
      };

      dbService.getChallenge.mockResolvedValue(sessionBoundChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(differentUserCredential);

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Challenge does not match user session'
      });
      
      // Verify that verification was not attempted
      expect(webauthnService.verifyAuthenticationResponse).not.toHaveBeenCalled();
    });

    it('should allow authentication if challenge is bound to same user (2FA flow)', async () => {
      // Arrange - Challenge is bound to test@example.com and credential also belongs to test@example.com
      req.body.credential = mockCredential;
      
      const sessionBoundChallenge = {
        ...mockStoredChallenge,
        userEmail: 'test@example.com' // Challenge bound to this user (2FA flow)
      };

      dbService.getChallenge.mockResolvedValue(sessionBoundChallenge);
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(true);
      webauthnService.verifyAuthenticationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      dbService.updatePasskeyCounter.mockResolvedValue({});
      dbService.updatePasskeyLastUsed.mockResolvedValue({});
      dbService.updateLastLogin.mockResolvedValue({});
      
      // Mock database query for user name
      const mockPool = {
        query: jest.fn().mockResolvedValue({
          rows: [{ name: 'Test User' }]
        })
      };
      dbService.connect.mockResolvedValue(mockPool);

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(webauthnService.verifyAuthenticationResponse).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        accessToken: expect.any(String),
        user: {
          email: 'test@example.com',
          name: 'Test User'
        }
      });
    });

    it('should allow authentication if challenge has no user binding (standalone login)', async () => {
      // Arrange - Challenge has userEmail = null (standalone login flow)
      req.body.credential = mockCredential;

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge); // userEmail is null
      dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
      dbService.isEmailApproved.mockResolvedValue(true);
      webauthnService.verifyAuthenticationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      dbService.updatePasskeyCounter.mockResolvedValue({});
      dbService.updatePasskeyLastUsed.mockResolvedValue({});
      dbService.updateLastLogin.mockResolvedValue({});
      
      // Mock database query for user name
      const mockPool = {
        query: jest.fn().mockResolvedValue({
          rows: [{ name: 'Test User' }]
        })
      };
      dbService.connect.mockResolvedValue(mockPool);

      // Act
      await passkeyController.loginVerify(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(webauthnService.verifyAuthenticationResponse).toHaveBeenCalled();
    });
  });

  describe('loginOptions with 2FA user binding', () => {
    it('should generate authentication options with user binding for 2FA flow', async () => {
      // Arrange
      req.body.userEmail = 'test@example.com'; // 2FA flow provides user email
      
      const mockPasskeys = [
        { credentialId: 'cred-1', transports: ['internal'] },
        { credentialId: 'cred-2', transports: ['usb'] }
      ];
      
      const mockOptions = {
        challenge: 'mock-2fa-challenge-123',
        rpId: 'localhost',
        allowCredentials: [
          { credentialId: 'cred-1', transports: ['internal'] },
          { credentialId: 'cred-2', transports: ['usb'] }
        ],
        timeout: 60000,
        userVerification: 'preferred'
      };

      dbService.getPasskeysByUser.mockResolvedValue(mockPasskeys);
      webauthnService.generateAuthenticationOptions.mockResolvedValue(mockOptions);
      dbService.storeChallenge.mockResolvedValue({});

      // Act
      await passkeyController.loginOptions(req, res, next);

      // Assert
      expect(dbService.getPasskeysByUser).toHaveBeenCalledWith('test@example.com');
      expect(webauthnService.generateAuthenticationOptions).toHaveBeenCalledWith(mockPasskeys);
      expect(dbService.storeChallenge).toHaveBeenCalledWith(
        'mock-2fa-challenge-123',
        'test@example.com', // Challenge is bound to user for 2FA
        'authentication',
        expect.any(Date)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should generate authentication options without user binding for standalone login', async () => {
      // Arrange - No userEmail provided (standalone login)
      req.body = {}; // No userEmail
      
      const mockOptions = {
        challenge: 'mock-standalone-challenge-123',
        rpId: 'localhost',
        allowCredentials: [],
        timeout: 60000,
        userVerification: 'preferred'
      };

      webauthnService.generateAuthenticationOptions.mockResolvedValue(mockOptions);
      dbService.storeChallenge.mockResolvedValue({});

      // Act
      await passkeyController.loginOptions(req, res, next);

      // Assert
      expect(dbService.getPasskeysByUser).not.toHaveBeenCalled();
      expect(webauthnService.generateAuthenticationOptions).toHaveBeenCalledWith([]);
      expect(dbService.storeChallenge).toHaveBeenCalledWith(
        'mock-standalone-challenge-123',
        null, // No user binding for standalone login
        'authentication',
        expect.any(Date)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Management Endpoints', () => {
    describe('listPasskeys', () => {
      it('should list all passkeys for authenticated user', async () => {
        // Arrange
        const mockPasskeys = [
          {
            id: 'pk-1',
            userEmail: 'test@example.com',
            credentialId: 'cred-1',
            publicKey: 'public-key-1',
            counter: 5,
            authenticatorType: 'platform',
            friendlyName: 'My Phone',
            lastUsedAt: new Date('2024-01-15'),
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-15')
          },
          {
            id: 'pk-2',
            userEmail: 'test@example.com',
            credentialId: 'cred-2',
            publicKey: 'public-key-2',
            counter: 3,
            authenticatorType: 'cross-platform',
            friendlyName: 'YubiKey',
            lastUsedAt: new Date('2024-01-10'),
            createdAt: new Date('2024-01-05'),
            updatedAt: new Date('2024-01-10')
          }
        ];

        dbService.getPasskeysByUser.mockResolvedValue(mockPasskeys);

        // Act
        await passkeyController.listPasskeys(req, res, next);

        // Assert
        expect(dbService.getPasskeysByUser).toHaveBeenCalledWith('test@example.com');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          passkeys: [
            {
              id: 'pk-1',
              authenticatorType: 'platform',
              friendlyName: 'My Phone',
              lastUsedAt: mockPasskeys[0].lastUsedAt,
              createdAt: mockPasskeys[0].createdAt
            },
            {
              id: 'pk-2',
              authenticatorType: 'cross-platform',
              friendlyName: 'YubiKey',
              lastUsedAt: mockPasskeys[1].lastUsedAt,
              createdAt: mockPasskeys[1].createdAt
            }
          ]
        });
      });

      it('should return empty array if user has no passkeys', async () => {
        // Arrange
        dbService.getPasskeysByUser.mockResolvedValue([]);

        // Act
        await passkeyController.listPasskeys(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          passkeys: []
        });
      });

      it('should return 503 if database is unavailable', async () => {
        // Arrange
        dbService.getPasskeysByUser.mockRejectedValue(new Error('Database error'));

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
    });

    describe('deletePasskey', () => {
      beforeEach(() => {
        req.params = { id: 'pk-123' };
      });

      it('should delete a passkey successfully', async () => {
        // Arrange
        const mockDeletedPasskey = {
          id: 'pk-123',
          userEmail: 'test@example.com',
          friendlyName: 'My Phone'
        };

        const mockRemainingPasskeys = [
          { id: 'pk-456', userEmail: 'test@example.com' }
        ];

        dbService.deletePasskey.mockResolvedValue(mockDeletedPasskey);
        dbService.getPasskeysByUser.mockResolvedValue(mockRemainingPasskeys);

        // Act
        await passkeyController.deletePasskey(req, res, next);

        // Assert
        expect(dbService.deletePasskey).toHaveBeenCalledWith('pk-123', 'test@example.com');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Passkey deleted successfully'
        });
      });

      it('should auto-disable 2FA when last passkey is deleted', async () => {
        // Arrange
        const mockDeletedPasskey = {
          id: 'pk-123',
          userEmail: 'test@example.com',
          friendlyName: 'My Phone'
        };

        dbService.deletePasskey.mockResolvedValue(mockDeletedPasskey);
        dbService.getPasskeysByUser.mockResolvedValue([]); // No remaining passkeys

        // Act
        await passkeyController.deletePasskey(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Passkey deleted. 2FA has been automatically disabled as you have no remaining passkeys.'
        });
      });

      it('should return 400 if passkey ID is missing', async () => {
        // Arrange
        req.params.id = undefined;

        // Act
        await passkeyController.deletePasskey(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Bad Request',
          message: 'Passkey ID is required'
        });
      });

      it('should return 404 if passkey not found', async () => {
        // Arrange
        dbService.deletePasskey.mockRejectedValue(
          new Error('Passkey with id pk-123 not found or does not belong to user')
        );

        // Act
        await passkeyController.deletePasskey(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Not Found',
          message: 'Passkey not found'
        });
      });

      it('should return 503 if database is unavailable', async () => {
        // Arrange
        dbService.deletePasskey.mockRejectedValue(new Error('Database connection failed'));

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
    });

    describe('updatePasskeyName', () => {
      beforeEach(() => {
        req.params = { id: 'pk-123' };
        req.body = { name: 'Updated Name' };
      });

      it('should update passkey name successfully', async () => {
        // Arrange
        const mockUserPasskeys = [
          { id: 'pk-123', userEmail: 'test@example.com', friendlyName: 'Old Name' }
        ];

        const mockUpdatedPasskey = {
          id: 'pk-123',
          userEmail: 'test@example.com',
          authenticatorType: 'platform',
          friendlyName: 'Updated Name',
          lastUsedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-20')
        };

        dbService.getPasskeysByUser.mockResolvedValue(mockUserPasskeys);
        dbService.updatePasskeyName.mockResolvedValue(mockUpdatedPasskey);

        // Act
        await passkeyController.updatePasskeyName(req, res, next);

        // Assert
        expect(dbService.getPasskeysByUser).toHaveBeenCalledWith('test@example.com');
        expect(dbService.updatePasskeyName).toHaveBeenCalledWith('pk-123', 'Updated Name');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          passkey: {
            id: 'pk-123',
            authenticatorType: 'platform',
            friendlyName: 'Updated Name',
            lastUsedAt: mockUpdatedPasskey.lastUsedAt,
            createdAt: mockUpdatedPasskey.createdAt,
            updatedAt: mockUpdatedPasskey.updatedAt
          }
        });
      });

      it('should return 400 if passkey ID is missing', async () => {
        // Arrange
        req.params.id = undefined;

        // Act
        await passkeyController.updatePasskeyName(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Bad Request',
          message: 'Passkey ID is required'
        });
      });

      it('should return 400 if name is empty', async () => {
        // Arrange
        req.body.name = '';

        // Act
        await passkeyController.updatePasskeyName(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Bad Request',
          message: 'Name cannot be empty'
        });
      });

      it('should return 400 if name exceeds 100 characters', async () => {
        // Arrange
        req.body.name = 'a'.repeat(101);

        // Act
        await passkeyController.updatePasskeyName(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Bad Request',
          message: 'Name must be 100 characters or less'
        });
      });

      it('should return 404 if passkey does not belong to user', async () => {
        // Arrange
        const mockUserPasskeys = [
          { id: 'pk-456', userEmail: 'test@example.com' } // Different passkey
        ];

        dbService.getPasskeysByUser.mockResolvedValue(mockUserPasskeys);

        // Act
        await passkeyController.updatePasskeyName(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Not Found',
          message: 'Passkey not found'
        });
      });

      it('should return 503 if database is unavailable', async () => {
        // Arrange
        dbService.getPasskeysByUser.mockRejectedValue(new Error('Database error'));

        // Act
        await passkeyController.updatePasskeyName(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Service Unavailable',
          message: 'Database service temporarily unavailable'
        });
      });
    });

    describe('get2FAStatus', () => {
      it('should return 2FA status for authenticated user', async () => {
        // Arrange
        const mockStatus = { enabled: true };
        dbService.get2FAStatus.mockResolvedValue(mockStatus);

        // Act
        await passkeyController.get2FAStatus(req, res, next);

        // Assert
        expect(dbService.get2FAStatus).toHaveBeenCalledWith('test@example.com');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          enabled: true
        });
      });

      it('should return false when 2FA is disabled', async () => {
        // Arrange
        const mockStatus = { enabled: false };
        dbService.get2FAStatus.mockResolvedValue(mockStatus);

        // Act
        await passkeyController.get2FAStatus(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          enabled: false
        });
      });

      it('should return 503 if database is unavailable', async () => {
        // Arrange
        dbService.get2FAStatus.mockRejectedValue(new Error('Database error'));

        // Act
        await passkeyController.get2FAStatus(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Service Unavailable',
          message: 'Database service temporarily unavailable'
        });
      });
    });

    describe('set2FAStatus', () => {
      it('should enable 2FA when user has passkeys', async () => {
        // Arrange
        req.body.enabled = true;
        const mockStatus = { enabled: true };
        dbService.set2FAStatus.mockResolvedValue(mockStatus);

        // Act
        await passkeyController.set2FAStatus(req, res, next);

        // Assert
        expect(dbService.set2FAStatus).toHaveBeenCalledWith('test@example.com', true);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          enabled: true
        });
      });

      it('should disable 2FA successfully', async () => {
        // Arrange
        req.body.enabled = false;
        const mockStatus = { enabled: false };
        dbService.set2FAStatus.mockResolvedValue(mockStatus);

        // Act
        await passkeyController.set2FAStatus(req, res, next);

        // Assert
        expect(dbService.set2FAStatus).toHaveBeenCalledWith('test@example.com', false);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          enabled: false
        });
      });

      it('should return 400 if enabled is not a boolean', async () => {
        // Arrange
        req.body.enabled = 'true'; // String instead of boolean

        // Act
        await passkeyController.set2FAStatus(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Bad Request',
          message: 'enabled must be a boolean value'
        });
      });

      it('should return 400 if enabled is undefined', async () => {
        // Arrange
        req.body.enabled = undefined;

        // Act
        await passkeyController.set2FAStatus(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Bad Request',
          message: 'enabled must be a boolean value'
        });
      });

      it('should return 400 when trying to enable 2FA without passkeys', async () => {
        // Arrange
        req.body.enabled = true;
        dbService.set2FAStatus.mockRejectedValue(
          new Error('Cannot enable 2FA: user must have at least one enrolled passkey')
        );

        // Act
        await passkeyController.set2FAStatus(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Bad Request',
          message: 'Cannot enable 2FA without at least one enrolled passkey'
        });
      });

      it('should return 503 if database is unavailable', async () => {
        // Arrange
        req.body.enabled = true;
        dbService.set2FAStatus.mockRejectedValue(new Error('Database connection failed'));

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
    });
  });
});
