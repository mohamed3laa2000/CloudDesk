/**
 * Integration Tests for Passkey Management
 * 
 * This test suite validates the complete passkey management flows:
 * - Listing passkeys
 * - Deleting passkeys
 * - Renaming passkeys
 * - 2FA enable/disable
 * - Auto-disable 2FA on last passkey deletion
 * 
 * Requirements: 3.1, 4.2, 4.4, 5.1, 6.1
 */

const passkeyController = require('../controllers/passkeyController');
const dbService = require('../services/dbService');

// Mock the services
jest.mock('../services/dbService');

describe('Integration Test: Passkey Management', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup request, response, and next function
    req = {
      body: {},
      user: {
        email: 'management-test@example.com',
        name: 'Management Test User'
      },
      params: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('List Passkeys Flow (Requirement 3.1)', () => {
    it('should list all passkeys for authenticated user with complete information', async () => {
      // Arrange - User has multiple passkeys enrolled
      const mockPasskeys = [
        {
          id: 'pk-platform-1',
          userEmail: 'management-test@example.com',
          credentialId: 'cred-platform-1',
          publicKey: 'public-key-1',
          counter: 10,
          aaguid: 'platform-aaguid',
          transports: ['internal'],
          authenticatorType: 'platform',
          friendlyName: 'iPhone Touch ID',
          lastUsedAt: new Date('2024-01-20T10:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-20T10:00:00Z')
        },
        {
          id: 'pk-cross-platform-1',
          userEmail: 'management-test@example.com',
          credentialId: 'cred-yubikey-1',
          publicKey: 'public-key-2',
          counter: 5,
          aaguid: 'yubikey-aaguid',
          transports: ['usb', 'nfc'],
          authenticatorType: 'cross-platform',
          friendlyName: 'YubiKey 5 NFC',
          lastUsedAt: new Date('2024-01-15T10:00:00Z'),
          createdAt: new Date('2024-01-05T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: 'pk-platform-2',
          userEmail: 'management-test@example.com',
          credentialId: 'cred-platform-2',
          publicKey: 'public-key-3',
          counter: 0,
          aaguid: 'platform-aaguid-2',
          transports: ['internal'],
          authenticatorType: 'platform',
          friendlyName: 'MacBook Touch ID',
          lastUsedAt: null, // Never used
          createdAt: new Date('2024-01-18T10:00:00Z'),
          updatedAt: new Date('2024-01-18T10:00:00Z')
        }
      ];

      dbService.getPasskeysByUser.mockResolvedValue(mockPasskeys);

      // Act
      await passkeyController.listPasskeys(req, res, next);

      // Assert
      expect(dbService.getPasskeysByUser).toHaveBeenCalledWith('management-test@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      
      // Verify response contains all passkeys with required information
      const responseCall = res.json.mock.calls[0][0];
      expect(responseCall.success).toBe(true);
      expect(responseCall.passkeys).toHaveLength(3);
      
      // Verify first passkey (platform)
      expect(responseCall.passkeys[0]).toEqual({
        id: 'pk-platform-1',
        authenticatorType: 'platform',
        friendlyName: 'iPhone Touch ID',
        lastUsedAt: mockPasskeys[0].lastUsedAt,
        createdAt: mockPasskeys[0].createdAt
      });
      
      // Verify second passkey (cross-platform)
      expect(responseCall.passkeys[1]).toEqual({
        id: 'pk-cross-platform-1',
        authenticatorType: 'cross-platform',
        friendlyName: 'YubiKey 5 NFC',
        lastUsedAt: mockPasskeys[1].lastUsedAt,
        createdAt: mockPasskeys[1].createdAt
      });
      
      // Verify third passkey (never used)
      expect(responseCall.passkeys[2]).toEqual({
        id: 'pk-platform-2',
        authenticatorType: 'platform',
        friendlyName: 'MacBook Touch ID',
        lastUsedAt: null,
        createdAt: mockPasskeys[2].createdAt
      });
      
      // Verify sensitive data is NOT included in response
      expect(responseCall.passkeys[0]).not.toHaveProperty('publicKey');
      expect(responseCall.passkeys[0]).not.toHaveProperty('credentialId');
      expect(responseCall.passkeys[0]).not.toHaveProperty('counter');
    });

    it('should return empty array when user has no passkeys', async () => {
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
  });

  describe('Delete Passkey Flow (Requirement 4.2)', () => {
    it('should delete a passkey and maintain other passkeys', async () => {
      // Arrange
      req.params.id = 'pk-to-delete';
      
      const mockDeletedPasskey = {
        id: 'pk-to-delete',
        userEmail: 'management-test@example.com',
        friendlyName: 'Old Phone'
      };
      
      const mockRemainingPasskeys = [
        { id: 'pk-remaining-1', userEmail: 'management-test@example.com' },
        { id: 'pk-remaining-2', userEmail: 'management-test@example.com' }
      ];

      dbService.deletePasskey.mockResolvedValue(mockDeletedPasskey);
      dbService.getPasskeysByUser.mockResolvedValue(mockRemainingPasskeys);

      // Act
      await passkeyController.deletePasskey(req, res, next);

      // Assert
      expect(dbService.deletePasskey).toHaveBeenCalledWith('pk-to-delete', 'management-test@example.com');
      expect(dbService.getPasskeysByUser).toHaveBeenCalledWith('management-test@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Passkey deleted successfully'
      });
      
      // Verify 2FA was NOT auto-disabled (user still has passkeys)
      expect(dbService.set2FAStatus).not.toHaveBeenCalled();
    });

    it('should prevent user from deleting another users passkey', async () => {
      // Arrange
      req.params.id = 'pk-other-user';
      
      // Simulate database error for unauthorized deletion
      dbService.deletePasskey.mockRejectedValue(
        new Error('Passkey with id pk-other-user not found or does not belong to user')
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
  });

  describe('Rename Passkey Flow (Requirement 4.4)', () => {
    it('should rename a passkey successfully', async () => {
      // Arrange
      req.params.id = 'pk-to-rename';
      req.body.name = 'My New Passkey Name';
      
      const mockUserPasskeys = [
        { id: 'pk-to-rename', userEmail: 'management-test@example.com', friendlyName: 'Old Name' },
        { id: 'pk-other', userEmail: 'management-test@example.com', friendlyName: 'Other Passkey' }
      ];
      
      const mockUpdatedPasskey = {
        id: 'pk-to-rename',
        userEmail: 'management-test@example.com',
        authenticatorType: 'platform',
        friendlyName: 'My New Passkey Name',
        lastUsedAt: new Date('2024-01-15T10:00:00Z'),
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-22T10:00:00Z')
      };

      dbService.getPasskeysByUser.mockResolvedValue(mockUserPasskeys);
      dbService.updatePasskeyName.mockResolvedValue(mockUpdatedPasskey);

      // Act
      await passkeyController.updatePasskeyName(req, res, next);

      // Assert
      expect(dbService.getPasskeysByUser).toHaveBeenCalledWith('management-test@example.com');
      expect(dbService.updatePasskeyName).toHaveBeenCalledWith('pk-to-rename', 'My New Passkey Name');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        passkey: {
          id: 'pk-to-rename',
          authenticatorType: 'platform',
          friendlyName: 'My New Passkey Name',
          lastUsedAt: mockUpdatedPasskey.lastUsedAt,
          createdAt: mockUpdatedPasskey.createdAt,
          updatedAt: mockUpdatedPasskey.updatedAt
        }
      });
    });

    it('should reject name that exceeds 100 characters', async () => {
      // Arrange
      req.params.id = 'pk-to-rename';
      req.body.name = 'a'.repeat(101); // 101 characters

      // Act
      await passkeyController.updatePasskeyName(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Name must be 100 characters or less'
      });
      
      // Verify database was not called
      expect(dbService.updatePasskeyName).not.toHaveBeenCalled();
    });

    it('should reject empty name', async () => {
      // Arrange
      req.params.id = 'pk-to-rename';
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
      
      // Verify database was not called
      expect(dbService.updatePasskeyName).not.toHaveBeenCalled();
    });

    it('should prevent renaming another users passkey', async () => {
      // Arrange
      req.params.id = 'pk-other-user';
      req.body.name = 'Attempted Rename';
      
      const mockUserPasskeys = [
        { id: 'pk-my-passkey', userEmail: 'management-test@example.com' }
        // pk-other-user is not in this user's passkeys
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
      
      // Verify update was not attempted
      expect(dbService.updatePasskeyName).not.toHaveBeenCalled();
    });
  });

  describe('2FA Enable/Disable Flow (Requirements 5.1, 6.1)', () => {
    it('should enable 2FA when user has enrolled passkeys', async () => {
      // Arrange
      req.body.enabled = true;
      
      const mockStatus = { enabled: true };
      dbService.set2FAStatus.mockResolvedValue(mockStatus);

      // Act
      await passkeyController.set2FAStatus(req, res, next);

      // Assert
      expect(dbService.set2FAStatus).toHaveBeenCalledWith('management-test@example.com', true);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        enabled: true
      });
    });

    it('should reject enabling 2FA when user has no passkeys (Requirement 5.1)', async () => {
      // Arrange
      req.body.enabled = true;
      
      // Database service rejects because user has no passkeys
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

    it('should disable 2FA successfully', async () => {
      // Arrange
      req.body.enabled = false;
      
      const mockStatus = { enabled: false };
      dbService.set2FAStatus.mockResolvedValue(mockStatus);

      // Act
      await passkeyController.set2FAStatus(req, res, next);

      // Assert
      expect(dbService.set2FAStatus).toHaveBeenCalledWith('management-test@example.com', false);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        enabled: false
      });
    });

    it('should retrieve current 2FA status', async () => {
      // Arrange
      const mockStatus = { enabled: true };
      dbService.get2FAStatus.mockResolvedValue(mockStatus);

      // Act
      await passkeyController.get2FAStatus(req, res, next);

      // Assert
      expect(dbService.get2FAStatus).toHaveBeenCalledWith('management-test@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        enabled: true
      });
    });
  });

  describe('Auto-Disable 2FA on Last Passkey Deletion (Requirement 4.4)', () => {
    it('should automatically disable 2FA when last passkey is deleted', async () => {
      // Arrange
      req.params.id = 'pk-last-passkey';
      
      const mockDeletedPasskey = {
        id: 'pk-last-passkey',
        userEmail: 'management-test@example.com',
        friendlyName: 'Last Passkey'
      };
      
      // After deletion, user has no remaining passkeys
      const mockRemainingPasskeys = [];

      dbService.deletePasskey.mockResolvedValue(mockDeletedPasskey);
      dbService.getPasskeysByUser.mockResolvedValue(mockRemainingPasskeys);

      // Act
      await passkeyController.deletePasskey(req, res, next);

      // Assert
      expect(dbService.deletePasskey).toHaveBeenCalledWith('pk-last-passkey', 'management-test@example.com');
      expect(dbService.getPasskeysByUser).toHaveBeenCalledWith('management-test@example.com');
      
      // Verify response includes warning about 2FA auto-disable
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Passkey deleted. 2FA has been automatically disabled as you have no remaining passkeys.'
      });
    });

    it('should complete full flow: enable 2FA -> delete all passkeys -> verify 2FA disabled', async () => {
      // ============================================================
      // STEP 1: User has passkeys and enables 2FA
      // ============================================================
      req.body.enabled = true;
      
      const mockEnabledStatus = { enabled: true };
      dbService.set2FAStatus.mockResolvedValue(mockEnabledStatus);

      await passkeyController.set2FAStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        enabled: true
      });

      // ============================================================
      // STEP 2: User deletes their last passkey
      // ============================================================
      jest.clearAllMocks();
      
      req.params.id = 'pk-only-passkey';
      req.body = {};
      
      const mockDeletedPasskey = {
        id: 'pk-only-passkey',
        userEmail: 'management-test@example.com',
        friendlyName: 'Only Passkey'
      };
      
      dbService.deletePasskey.mockResolvedValue(mockDeletedPasskey);
      dbService.getPasskeysByUser.mockResolvedValue([]); // No remaining passkeys

      await passkeyController.deletePasskey(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Passkey deleted. 2FA has been automatically disabled as you have no remaining passkeys.'
      });

      // ============================================================
      // STEP 3: Verify 2FA status is now disabled
      // ============================================================
      jest.clearAllMocks();
      
      req.params = {};
      req.body = {};
      
      const mockDisabledStatus = { enabled: false };
      dbService.get2FAStatus.mockResolvedValue(mockDisabledStatus);

      await passkeyController.get2FAStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        enabled: false
      });
    });
  });

  describe('Complete Passkey Management Workflow', () => {
    it('should handle full lifecycle: list -> rename -> delete -> list again', async () => {
      const testEmail = 'management-test@example.com';
      
      // ============================================================
      // STEP 1: List initial passkeys
      // ============================================================
      const mockInitialPasskeys = [
        {
          id: 'pk-1',
          userEmail: testEmail,
          credentialId: 'cred-1',
          publicKey: 'key-1',
          counter: 5,
          authenticatorType: 'platform',
          friendlyName: 'iPhone',
          lastUsedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: 'pk-2',
          userEmail: testEmail,
          credentialId: 'cred-2',
          publicKey: 'key-2',
          counter: 3,
          authenticatorType: 'cross-platform',
          friendlyName: 'YubiKey',
          lastUsedAt: new Date('2024-01-10'),
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-10')
        }
      ];

      dbService.getPasskeysByUser.mockResolvedValue(mockInitialPasskeys);

      await passkeyController.listPasskeys(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const listResponse1 = res.json.mock.calls[0][0];
      expect(listResponse1.passkeys).toHaveLength(2);
      expect(listResponse1.passkeys[0].friendlyName).toBe('iPhone');
      expect(listResponse1.passkeys[1].friendlyName).toBe('YubiKey');

      // ============================================================
      // STEP 2: Rename first passkey
      // ============================================================
      jest.clearAllMocks();
      
      req.params.id = 'pk-1';
      req.body.name = 'My iPhone 15 Pro';
      
      const mockUpdatedPasskey = {
        ...mockInitialPasskeys[0],
        friendlyName: 'My iPhone 15 Pro',
        updatedAt: new Date('2024-01-22')
      };

      dbService.getPasskeysByUser.mockResolvedValue(mockInitialPasskeys);
      dbService.updatePasskeyName.mockResolvedValue(mockUpdatedPasskey);

      await passkeyController.updatePasskeyName(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const renameResponse = res.json.mock.calls[0][0];
      expect(renameResponse.passkey.friendlyName).toBe('My iPhone 15 Pro');

      // ============================================================
      // STEP 3: Delete second passkey
      // ============================================================
      jest.clearAllMocks();
      
      req.params.id = 'pk-2';
      req.body = {};
      
      const mockDeletedPasskey = mockInitialPasskeys[1];
      const mockRemainingPasskeys = [mockUpdatedPasskey];

      dbService.deletePasskey.mockResolvedValue(mockDeletedPasskey);
      dbService.getPasskeysByUser.mockResolvedValue(mockRemainingPasskeys);

      await passkeyController.deletePasskey(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Passkey deleted successfully'
      });

      // ============================================================
      // STEP 4: List passkeys again - should only show one
      // ============================================================
      jest.clearAllMocks();
      
      req.params = {};
      req.body = {};

      dbService.getPasskeysByUser.mockResolvedValue(mockRemainingPasskeys);

      await passkeyController.listPasskeys(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const listResponse2 = res.json.mock.calls[0][0];
      expect(listResponse2.passkeys).toHaveLength(1);
      expect(listResponse2.passkeys[0].id).toBe('pk-1');
      expect(listResponse2.passkeys[0].friendlyName).toBe('My iPhone 15 Pro');
    });
  });

  describe('Error Handling in Management Operations', () => {
    it('should handle database errors gracefully during list operation', async () => {
      // Arrange
      dbService.getPasskeysByUser.mockRejectedValue(new Error('Database connection failed'));

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

    it('should handle database errors gracefully during delete operation', async () => {
      // Arrange
      req.params.id = 'pk-test';
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

    it('should handle database errors gracefully during rename operation', async () => {
      // Arrange
      req.params.id = 'pk-test';
      req.body.name = 'New Name';
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

    it('should handle database errors gracefully during 2FA status operations', async () => {
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
});
