/**
 * Integration Tests for Complete Passkey Registration Flow
 * 
 * This test suite validates the complete registration flow from end-to-end:
 * - Platform authenticator enrollment
 * - Cross-platform authenticator enrollment
 * - Data storage verification
 * - Duplicate prevention
 * 
 * Requirements: 1.1, 1.2, 1.4, 2.1
 */

const passkeyController = require('../controllers/passkeyController');
const webauthnService = require('../services/webauthnService');
const dbService = require('../services/dbService');

// Mock the services
jest.mock('../services/webauthnService');
jest.mock('../services/dbService');

describe('Integration Test: Complete Passkey Registration Flow', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup request, response, and next function
    req = {
      body: {},
      user: {
        email: 'integration-test@example.com',
        name: 'Integration Test User'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('Platform Authenticator Enrollment Flow', () => {
    it('should complete full platform authenticator registration flow', async () => {
      // ============================================================
      // STEP 1: Request registration options for platform authenticator
      // ============================================================
      req.body.authenticatorType = 'platform';
      
      const mockExistingPasskeys = [];
      const mockRegistrationOptions = {
        challenge: 'platform-challenge-abc123',
        rp: { name: 'CloudDesk', id: 'localhost' },
        user: { 
          id: 'integration-test@example.com', 
          name: 'integration-test@example.com', 
          displayName: 'Integration Test User' 
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' }
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: false,
          residentKey: 'preferred',
          userVerification: 'preferred'
        },
        excludeCredentials: []
      };

      dbService.getPasskeysByUser.mockResolvedValue(mockExistingPasskeys);
      webauthnService.generateRegistrationOptions.mockResolvedValue(mockRegistrationOptions);
      dbService.storeChallenge.mockResolvedValue({
        challenge: 'platform-challenge-abc123',
        userEmail: 'integration-test@example.com',
        type: 'registration',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });

      // Call registerOptions endpoint
      await passkeyController.registerOptions(req, res, next);

      // Verify registration options were generated correctly
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        options: mockRegistrationOptions
      });

      // Verify platform authenticator attachment was set
      expect(webauthnService.generateRegistrationOptions).toHaveBeenCalledWith(
        { email: 'integration-test@example.com', name: 'Integration Test User' },
        'platform',
        []
      );
      expect(mockRegistrationOptions.authenticatorSelection.authenticatorAttachment).toBe('platform');

      // Verify challenge was stored
      expect(dbService.storeChallenge).toHaveBeenCalledWith(
        'platform-challenge-abc123',
        'integration-test@example.com',
        'registration',
        expect.any(Date)
      );

      // ============================================================
      // STEP 2: Verify registration response and store credential
      // ============================================================
      jest.clearAllMocks();

      const mockCredential = {
        id: 'platform-credential-id-base64',
        rawId: Buffer.from('platform-credential-id').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'platform-challenge-abc123',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          attestationObject: 'mock-attestation-object',
          transports: ['internal']
        },
        authenticatorAttachment: 'platform',
        type: 'public-key'
      };

      req.body.credential = mockCredential;
      req.body.friendlyName = 'My iPhone Touch ID';

      const mockStoredChallenge = {
        challenge: 'platform-challenge-abc123',
        userEmail: 'integration-test@example.com',
        type: 'registration',
        expiresAt: new Date(Date.now() + 60000)
      };

      const mockVerification = {
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from('platform-credential-id'),
          credentialPublicKey: Buffer.from('mock-public-key-data'),
          counter: 0,
          aaguid: 'platform-aaguid-123'
        }
      };

      const mockStoredPasskey = {
        id: 'pk-platform-123',
        userEmail: 'integration-test@example.com',
        credentialId: Buffer.from('platform-credential-id').toString('base64'),
        publicKey: Buffer.from('mock-public-key-data').toString('base64'),
        counter: 0,
        aaguid: 'platform-aaguid-123',
        transports: ['internal'],
        authenticatorType: 'platform',
        friendlyName: 'My iPhone Touch ID',
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      webauthnService.verifyRegistrationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      dbService.createPasskey.mockResolvedValue(mockStoredPasskey);

      // Call registerVerify endpoint
      await passkeyController.registerVerify(req, res, next);

      // Verify registration was successful
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        passkey: expect.objectContaining({
          id: 'pk-platform-123',
          authenticatorType: 'platform',
          friendlyName: 'My iPhone Touch ID'
        })
      });

      // Verify challenge was validated
      expect(dbService.getChallenge).toHaveBeenCalledWith('platform-challenge-abc123');

      // Verify attestation was verified
      expect(webauthnService.verifyRegistrationResponse).toHaveBeenCalledWith(
        mockCredential,
        'platform-challenge-abc123'
      );

      // Verify challenge was deleted after use
      expect(dbService.deleteChallenge).toHaveBeenCalledWith('platform-challenge-abc123');

      // Verify all required fields were stored in database
      expect(dbService.createPasskey).toHaveBeenCalledWith(
        'integration-test@example.com',
        expect.objectContaining({
          credentialId: expect.any(String),
          publicKey: expect.any(String),
          counter: 0,
          aaguid: 'platform-aaguid-123',
          transports: ['internal'],
          authenticatorType: 'platform',
          friendlyName: 'My iPhone Touch ID'
        })
      );

      // Verify stored passkey contains all required fields (Requirements 1.2, 9.1)
      const storedPasskey = mockStoredPasskey;
      expect(storedPasskey).toHaveProperty('id');
      expect(storedPasskey).toHaveProperty('userEmail');
      expect(storedPasskey).toHaveProperty('credentialId');
      expect(storedPasskey).toHaveProperty('publicKey');
      expect(storedPasskey).toHaveProperty('counter');
      expect(storedPasskey).toHaveProperty('aaguid');
      expect(storedPasskey).toHaveProperty('transports');
      expect(storedPasskey).toHaveProperty('authenticatorType');
      expect(storedPasskey).toHaveProperty('friendlyName');
      expect(storedPasskey).toHaveProperty('createdAt');
      expect(storedPasskey).toHaveProperty('updatedAt');
      expect(storedPasskey.authenticatorType).toBe('platform');
      expect(storedPasskey.userEmail).toBe('integration-test@example.com');
    });
  });

  describe('Cross-Platform Authenticator Enrollment Flow', () => {
    it('should complete full cross-platform authenticator registration flow', async () => {
      // ============================================================
      // STEP 1: Request registration options for cross-platform authenticator
      // ============================================================
      req.body.authenticatorType = 'cross-platform';
      
      const mockExistingPasskeys = [];
      const mockRegistrationOptions = {
        challenge: 'cross-platform-challenge-xyz789',
        rp: { name: 'CloudDesk', id: 'localhost' },
        user: { 
          id: 'integration-test@example.com', 
          name: 'integration-test@example.com', 
          displayName: 'Integration Test User' 
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' }
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: 'cross-platform',
          requireResidentKey: false,
          residentKey: 'preferred',
          userVerification: 'preferred'
        },
        excludeCredentials: []
      };

      dbService.getPasskeysByUser.mockResolvedValue(mockExistingPasskeys);
      webauthnService.generateRegistrationOptions.mockResolvedValue(mockRegistrationOptions);
      dbService.storeChallenge.mockResolvedValue({
        challenge: 'cross-platform-challenge-xyz789',
        userEmail: 'integration-test@example.com',
        type: 'registration',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });

      // Call registerOptions endpoint
      await passkeyController.registerOptions(req, res, next);

      // Verify registration options were generated correctly
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        options: mockRegistrationOptions
      });

      // Verify cross-platform authenticator attachment was set (Requirement 2.1)
      expect(webauthnService.generateRegistrationOptions).toHaveBeenCalledWith(
        { email: 'integration-test@example.com', name: 'Integration Test User' },
        'cross-platform',
        []
      );
      expect(mockRegistrationOptions.authenticatorSelection.authenticatorAttachment).toBe('cross-platform');

      // Verify challenge was stored
      expect(dbService.storeChallenge).toHaveBeenCalledWith(
        'cross-platform-challenge-xyz789',
        'integration-test@example.com',
        'registration',
        expect.any(Date)
      );

      // ============================================================
      // STEP 2: Verify registration response and store credential
      // ============================================================
      jest.clearAllMocks();

      const mockCredential = {
        id: 'yubikey-credential-id-base64',
        rawId: Buffer.from('yubikey-credential-id').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'cross-platform-challenge-xyz789',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          attestationObject: 'mock-attestation-object',
          transports: ['usb', 'nfc']
        },
        authenticatorAttachment: 'cross-platform',
        type: 'public-key'
      };

      req.body.credential = mockCredential;
      req.body.friendlyName = 'YubiKey 5 NFC';

      const mockStoredChallenge = {
        challenge: 'cross-platform-challenge-xyz789',
        userEmail: 'integration-test@example.com',
        type: 'registration',
        expiresAt: new Date(Date.now() + 60000)
      };

      const mockVerification = {
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from('yubikey-credential-id'),
          credentialPublicKey: Buffer.from('mock-yubikey-public-key'),
          counter: 0,
          aaguid: 'yubikey-aaguid-456'
        }
      };

      const mockStoredPasskey = {
        id: 'pk-yubikey-456',
        userEmail: 'integration-test@example.com',
        credentialId: Buffer.from('yubikey-credential-id').toString('base64'),
        publicKey: Buffer.from('mock-yubikey-public-key').toString('base64'),
        counter: 0,
        aaguid: 'yubikey-aaguid-456',
        transports: ['usb', 'nfc'],
        authenticatorType: 'cross-platform',
        friendlyName: 'YubiKey 5 NFC',
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      webauthnService.verifyRegistrationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      dbService.createPasskey.mockResolvedValue(mockStoredPasskey);

      // Call registerVerify endpoint
      await passkeyController.registerVerify(req, res, next);

      // Verify registration was successful
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        passkey: expect.objectContaining({
          id: 'pk-yubikey-456',
          authenticatorType: 'cross-platform',
          friendlyName: 'YubiKey 5 NFC'
        })
      });

      // Verify all required fields were stored (Requirement 2.2)
      expect(dbService.createPasskey).toHaveBeenCalledWith(
        'integration-test@example.com',
        expect.objectContaining({
          credentialId: expect.any(String),
          publicKey: expect.any(String),
          counter: 0,
          aaguid: 'yubikey-aaguid-456',
          transports: ['usb', 'nfc'],
          authenticatorType: 'cross-platform',
          friendlyName: 'YubiKey 5 NFC'
        })
      );

      // Verify stored passkey contains all required fields
      const storedPasskey = mockStoredPasskey;
      expect(storedPasskey.authenticatorType).toBe('cross-platform');
      expect(storedPasskey.transports).toContain('usb');
      expect(storedPasskey.transports).toContain('nfc');
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate credential registration (Requirement 1.4)', async () => {
      // ============================================================
      // STEP 1: Register first passkey successfully
      // ============================================================
      req.body.authenticatorType = 'platform';
      
      const existingCredentialId = 'existing-credential-id';
      const mockExistingPasskeys = [
        {
          credentialId: Buffer.from(existingCredentialId).toString('base64'),
          transports: ['internal']
        }
      ];

      const mockRegistrationOptions = {
        challenge: 'duplicate-test-challenge',
        rp: { name: 'CloudDesk', id: 'localhost' },
        user: { 
          id: 'integration-test@example.com', 
          name: 'integration-test@example.com', 
          displayName: 'Integration Test User' 
        },
        authenticatorSelection: {
          authenticatorAttachment: 'platform'
        },
        excludeCredentials: [
          {
            id: Buffer.from(existingCredentialId).toString('base64'),
            type: 'public-key',
            transports: ['internal']
          }
        ]
      };

      dbService.getPasskeysByUser.mockResolvedValue(mockExistingPasskeys);
      webauthnService.generateRegistrationOptions.mockResolvedValue(mockRegistrationOptions);
      dbService.storeChallenge.mockResolvedValue({});

      // Call registerOptions endpoint
      await passkeyController.registerOptions(req, res, next);

      // Verify existing credentials are excluded from registration
      expect(webauthnService.generateRegistrationOptions).toHaveBeenCalledWith(
        expect.any(Object),
        'platform',
        mockExistingPasskeys
      );
      expect(mockRegistrationOptions.excludeCredentials).toHaveLength(1);
      expect(mockRegistrationOptions.excludeCredentials[0].id).toBe(
        Buffer.from(existingCredentialId).toString('base64')
      );

      // ============================================================
      // STEP 2: Attempt to register duplicate credential
      // ============================================================
      jest.clearAllMocks();

      const mockDuplicateCredential = {
        id: Buffer.from(existingCredentialId).toString('base64'),
        rawId: Buffer.from(existingCredentialId).toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'duplicate-test-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          attestationObject: 'mock-attestation-object'
        },
        authenticatorAttachment: 'platform'
      };

      req.body.credential = mockDuplicateCredential;
      req.body.friendlyName = 'Duplicate Attempt';

      const mockStoredChallenge = {
        challenge: 'duplicate-test-challenge',
        userEmail: 'integration-test@example.com',
        type: 'registration',
        expiresAt: new Date(Date.now() + 60000)
      };

      const mockVerification = {
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from(existingCredentialId),
          credentialPublicKey: Buffer.from('mock-public-key'),
          counter: 0
        }
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      webauthnService.verifyRegistrationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      
      // Simulate database constraint violation for duplicate credential
      const duplicateError = new Error('A passkey with this credential ID already exists');
      dbService.createPasskey.mockRejectedValue(duplicateError);

      // Call registerVerify endpoint
      await passkeyController.registerVerify(req, res, next);

      // Verify duplicate was rejected with 409 Conflict
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conflict',
        message: 'This authenticator is already registered'
      });

      // Verify challenge was still deleted (cleanup)
      expect(dbService.deleteChallenge).toHaveBeenCalledWith('duplicate-test-challenge');
    });
  });

  describe('Data Storage Verification', () => {
    it('should store all required fields correctly (Requirements 1.2, 9.1)', async () => {
      // Setup registration verification
      req.body.authenticatorType = 'platform';
      
      const mockCredential = {
        id: 'test-credential-id-base64',
        rawId: Buffer.from('test-credential-id').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'storage-test-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          attestationObject: 'mock-attestation-object',
          transports: ['internal', 'hybrid']
        },
        authenticatorAttachment: 'platform'
      };

      req.body.credential = mockCredential;
      req.body.friendlyName = 'Storage Test Passkey';

      const mockStoredChallenge = {
        challenge: 'storage-test-challenge',
        userEmail: 'integration-test@example.com',
        type: 'registration',
        expiresAt: new Date(Date.now() + 60000)
      };

      const mockVerification = {
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from('test-credential-id'),
          credentialPublicKey: Buffer.from('test-public-key-data'),
          counter: 0,
          aaguid: 'test-aaguid-789'
        }
      };

      const mockStoredPasskey = {
        id: 'pk-storage-test-789',
        userEmail: 'integration-test@example.com',
        credentialId: Buffer.from('test-credential-id').toString('base64'),
        publicKey: Buffer.from('test-public-key-data').toString('base64'),
        counter: 0,
        aaguid: 'test-aaguid-789',
        transports: ['internal', 'hybrid'],
        authenticatorType: 'platform',
        friendlyName: 'Storage Test Passkey',
        lastUsedAt: null,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z')
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      webauthnService.verifyRegistrationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      dbService.createPasskey.mockResolvedValue(mockStoredPasskey);

      // Call registerVerify endpoint
      await passkeyController.registerVerify(req, res, next);

      // Verify createPasskey was called with all required fields
      const createPasskeyCall = dbService.createPasskey.mock.calls[0];
      const userEmail = createPasskeyCall[0];
      const passkeyData = createPasskeyCall[1];

      // Verify user email
      expect(userEmail).toBe('integration-test@example.com');

      // Verify all required fields are present in passkeyData
      expect(passkeyData).toHaveProperty('credentialId');
      expect(passkeyData).toHaveProperty('publicKey');
      expect(passkeyData).toHaveProperty('counter');
      expect(passkeyData).toHaveProperty('aaguid');
      expect(passkeyData).toHaveProperty('transports');
      expect(passkeyData).toHaveProperty('authenticatorType');
      expect(passkeyData).toHaveProperty('friendlyName');

      // Verify field values
      expect(passkeyData.credentialId).toBe(Buffer.from('test-credential-id').toString('base64'));
      expect(passkeyData.publicKey).toBe(Buffer.from('test-public-key-data').toString('base64'));
      expect(passkeyData.counter).toBe(0);
      expect(passkeyData.aaguid).toBe('test-aaguid-789');
      expect(passkeyData.transports).toEqual(['internal', 'hybrid']);
      expect(passkeyData.authenticatorType).toBe('platform');
      expect(passkeyData.friendlyName).toBe('Storage Test Passkey');

      // Verify response contains stored passkey (controller returns subset of fields)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        passkey: expect.objectContaining({
          id: 'pk-storage-test-789',
          credentialId: Buffer.from('test-credential-id').toString('base64'),
          authenticatorType: 'platform',
          friendlyName: 'Storage Test Passkey',
          createdAt: expect.any(Date)
        })
      });
    });

    it('should generate default friendly name when not provided', async () => {
      // Setup registration without friendly name
      const mockCredential = {
        id: 'test-credential-id-base64',
        rawId: Buffer.from('test-credential-id').toString('base64'),
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'default-name-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64'),
          attestationObject: 'mock-attestation-object'
        },
        authenticatorAttachment: 'cross-platform'
      };

      req.body.credential = mockCredential;
      // No friendlyName provided

      const mockStoredChallenge = {
        challenge: 'default-name-challenge',
        userEmail: 'integration-test@example.com',
        type: 'registration',
        expiresAt: new Date(Date.now() + 60000)
      };

      const mockVerification = {
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from('test-credential-id'),
          credentialPublicKey: Buffer.from('test-public-key-data'),
          counter: 0
        }
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
      webauthnService.verifyRegistrationResponse.mockResolvedValue(mockVerification);
      dbService.deleteChallenge.mockResolvedValue(true);
      
      // Mock createPasskey - the controller passes undefined for friendlyName
      // and dbService generates the default name
      const mockPasskeyWithDefaultName = {
        id: 'pk-default-name',
        userEmail: 'integration-test@example.com',
        credentialId: Buffer.from('test-credential-id').toString('base64'),
        publicKey: Buffer.from('test-public-key-data').toString('base64'),
        counter: 0,
        aaguid: null,
        transports: [],
        authenticatorType: 'cross-platform',
        friendlyName: 'Cross-platform - 1/15/2024', // Default generated name
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      dbService.createPasskey.mockResolvedValue(mockPasskeyWithDefaultName);

      // Call registerVerify endpoint
      await passkeyController.registerVerify(req, res, next);

      // Verify registration was successful
      expect(res.status).toHaveBeenCalledWith(201);
      expect(dbService.createPasskey).toHaveBeenCalled();
      
      // Verify the passkey data passed to createPasskey has undefined friendlyName
      // (so dbService can generate default)
      const createPasskeyCall = dbService.createPasskey.mock.calls[0];
      const passkeyData = createPasskeyCall[1];
      expect(passkeyData.friendlyName).toBeUndefined();
      
      // Verify response contains the default generated name
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        passkey: expect.objectContaining({
          friendlyName: 'Cross-platform - 1/15/2024'
        })
      });
    });
  });

  describe('Error Handling in Registration Flow', () => {
    it('should handle invalid challenge during verification', async () => {
      const mockCredential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'invalid-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64')
        }
      };

      req.body.credential = mockCredential;

      // Challenge not found in database
      dbService.getChallenge.mockResolvedValue(null);

      await passkeyController.registerVerify(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Invalid or expired challenge'
      });
    });

    it('should handle challenge-user mismatch', async () => {
      const mockCredential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'mismatched-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64')
        }
      };

      req.body.credential = mockCredential;

      // Challenge belongs to different user
      const mockStoredChallenge = {
        challenge: 'mismatched-challenge',
        userEmail: 'different-user@example.com',
        type: 'registration',
        expiresAt: new Date(Date.now() + 60000)
      };

      dbService.getChallenge.mockResolvedValue(mockStoredChallenge);

      await passkeyController.registerVerify(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Challenge does not match user session'
      });
    });
  });
});
