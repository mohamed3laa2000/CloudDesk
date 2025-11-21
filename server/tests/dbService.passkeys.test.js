// Mock the database pool before requiring the service
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockEnd = jest.fn();
const mockOn = jest.fn();

jest.mock('pg', () => {
  return {
    Pool: jest.fn(() => ({
      query: mockQuery,
      connect: mockConnect,
      end: mockEnd,
      on: mockOn
    }))
  };
});

const {
  connect,
  createPasskey,
  getPasskeysByUser,
  getPasskeyByCredentialId,
  updatePasskeyCounter,
  updatePasskeyLastUsed,
  updatePasskeyName,
  deletePasskey,
  get2FAStatus,
  set2FAStatus,
  storeChallenge,
  getChallenge,
  deleteChallenge,
  cleanupExpiredChallenges
} = require('../services/dbService');

describe('Passkey Database Service', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock successful connection
    mockConnect.mockResolvedValue({
      release: jest.fn()
    });
    
    // Initialize the connection
    await connect();
  });

  describe('createPasskey', () => {
    test('should create a passkey with all required fields', async () => {
      const userEmail = 'test@example.com';
      const passkeyData = {
        credentialId: 'test-credential-id',
        publicKey: 'test-public-key',
        counter: 0,
        aaguid: 'test-aaguid',
        transports: ['usb', 'nfc'],
        authenticatorType: 'cross-platform',
        friendlyName: 'My Security Key'
      };

      const mockResult = {
        rows: [{
          id: 'pk-123',
          user_email: userEmail,
          credential_id: passkeyData.credentialId,
          public_key: passkeyData.publicKey,
          counter: passkeyData.counter,
          aaguid: passkeyData.aaguid,
          transports: passkeyData.transports,
          authenticator_type: passkeyData.authenticatorType,
          friendly_name: passkeyData.friendlyName,
          last_used_at: null,
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await createPasskey(userEmail, passkeyData);

      expect(result).toHaveProperty('id');
      expect(result.userEmail).toBe(userEmail);
      expect(result.credentialId).toBe(passkeyData.credentialId);
      expect(result.publicKey).toBe(passkeyData.publicKey);
      expect(result.authenticatorType).toBe(passkeyData.authenticatorType);
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should generate default friendly name if not provided', async () => {
      const userEmail = 'test@example.com';
      const passkeyData = {
        credentialId: 'test-credential-id',
        publicKey: 'test-public-key',
        counter: 0,
        authenticatorType: 'platform'
      };

      const mockResult = {
        rows: [{
          id: 'pk-123',
          user_email: userEmail,
          credential_id: passkeyData.credentialId,
          public_key: passkeyData.publicKey,
          counter: 0,
          aaguid: null,
          transports: [],
          authenticator_type: 'platform',
          friendly_name: 'Platform - 1/1/2024',
          last_used_at: null,
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await createPasskey(userEmail, passkeyData);

      expect(result.friendlyName).toContain('Platform');
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should throw error for duplicate credential ID', async () => {
      const userEmail = 'test@example.com';
      const passkeyData = {
        credentialId: 'duplicate-credential-id',
        publicKey: 'test-public-key',
        authenticatorType: 'platform'
      };

      const duplicateError = new Error('duplicate key value');
      duplicateError.code = '23505';
      duplicateError.constraint = 'passkeys_credential_id_key';

      mockQuery.mockRejectedValue(duplicateError);

      await expect(createPasskey(userEmail, passkeyData))
        .rejects.toThrow('A passkey with this credential ID already exists');
    });
  });

  describe('getPasskeysByUser', () => {
    test('should return all passkeys for a user', async () => {
      const userEmail = 'test@example.com';
      const mockResult = {
        rows: [
          {
            id: 'pk-1',
            user_email: userEmail,
            credential_id: 'cred-1',
            public_key: 'key-1',
            counter: 5,
            aaguid: 'aaguid-1',
            transports: ['usb'],
            authenticator_type: 'cross-platform',
            friendly_name: 'Security Key 1',
            last_used_at: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 'pk-2',
            user_email: userEmail,
            credential_id: 'cred-2',
            public_key: 'key-2',
            counter: 3,
            aaguid: 'aaguid-2',
            transports: ['internal'],
            authenticator_type: 'platform',
            friendly_name: 'Touch ID',
            last_used_at: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await getPasskeysByUser(userEmail);

      expect(result).toHaveLength(2);
      expect(result[0].credentialId).toBe('cred-1');
      expect(result[1].credentialId).toBe('cred-2');
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should return empty array if user has no passkeys', async () => {
      const userEmail = 'test@example.com';
      const mockResult = { rows: [] };

      mockQuery.mockResolvedValue(mockResult);

      const result = await getPasskeysByUser(userEmail);

      expect(result).toHaveLength(0);
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('getPasskeyByCredentialId', () => {
    test('should return passkey by credential ID', async () => {
      const credentialId = 'test-credential-id';
      const mockResult = {
        rows: [{
          id: 'pk-123',
          user_email: 'test@example.com',
          credential_id: credentialId,
          public_key: 'test-public-key',
          counter: 5,
          aaguid: 'test-aaguid',
          transports: ['usb'],
          authenticator_type: 'cross-platform',
          friendly_name: 'My Key',
          last_used_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await getPasskeyByCredentialId(credentialId);

      expect(result).not.toBeNull();
      expect(result.credentialId).toBe(credentialId);
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should return null if credential not found', async () => {
      const credentialId = 'non-existent-id';
      const mockResult = { rows: [] };

      mockQuery.mockResolvedValue(mockResult);

      const result = await getPasskeyByCredentialId(credentialId);

      expect(result).toBeNull();
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('updatePasskeyCounter', () => {
    test('should update counter value', async () => {
      const credentialId = 'test-credential-id';
      const newCounter = 10;
      const mockResult = {
        rows: [{
          id: 'pk-123',
          user_email: 'test@example.com',
          credential_id: credentialId,
          public_key: 'test-public-key',
          counter: newCounter,
          aaguid: 'test-aaguid',
          transports: ['usb'],
          authenticator_type: 'cross-platform',
          friendly_name: 'My Key',
          last_used_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await updatePasskeyCounter(credentialId, newCounter);

      expect(result.counter).toBe(newCounter);
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('updatePasskeyLastUsed', () => {
    test('should update last used timestamp', async () => {
      const credentialId = 'test-credential-id';
      const now = new Date();
      const mockResult = {
        rows: [{
          id: 'pk-123',
          user_email: 'test@example.com',
          credential_id: credentialId,
          public_key: 'test-public-key',
          counter: 5,
          aaguid: 'test-aaguid',
          transports: ['usb'],
          authenticator_type: 'cross-platform',
          friendly_name: 'My Key',
          last_used_at: now,
          created_at: new Date(),
          updated_at: now
        }]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await updatePasskeyLastUsed(credentialId);

      expect(result.lastUsedAt).toEqual(now);
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('updatePasskeyName', () => {
    test('should update friendly name', async () => {
      const passkeyId = 'pk-123';
      const newName = 'Updated Key Name';
      const mockResult = {
        rows: [{
          id: passkeyId,
          user_email: 'test@example.com',
          credential_id: 'test-credential-id',
          public_key: 'test-public-key',
          counter: 5,
          aaguid: 'test-aaguid',
          transports: ['usb'],
          authenticator_type: 'cross-platform',
          friendly_name: newName,
          last_used_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await updatePasskeyName(passkeyId, newName);

      expect(result.friendlyName).toBe(newName);
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should reject empty name', async () => {
      const passkeyId = 'pk-123';
      const emptyName = '   ';

      await expect(updatePasskeyName(passkeyId, emptyName))
        .rejects.toThrow('Friendly name cannot be empty');
    });

    test('should reject name exceeding 100 characters', async () => {
      const passkeyId = 'pk-123';
      const longName = 'a'.repeat(101);

      await expect(updatePasskeyName(passkeyId, longName))
        .rejects.toThrow('Friendly name cannot exceed 100 characters');
    });
  });

  describe('deletePasskey', () => {
    test('should delete passkey and auto-disable 2FA if last passkey', async () => {
      const passkeyId = 'pk-123';
      const userEmail = 'test@example.com';
      
      const mockDeleteResult = {
        rows: [{
          id: passkeyId,
          user_email: userEmail,
          credential_id: 'test-credential-id',
          public_key: 'test-public-key',
          counter: 5,
          aaguid: 'test-aaguid',
          transports: ['usb'],
          authenticator_type: 'cross-platform',
          friendly_name: 'My Key',
          last_used_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      const mockRemainingPasskeys = { rows: [] };
      const mock2FAResult = { rows: [{ passkey_2fa_enabled: false }] };

      mockQuery
        .mockResolvedValueOnce(mockDeleteResult)
        .mockResolvedValueOnce(mockRemainingPasskeys)
        .mockResolvedValueOnce(mock2FAResult);

      const result = await deletePasskey(passkeyId, userEmail);

      expect(result.id).toBe(passkeyId);
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    test('should throw error if passkey not found', async () => {
      const passkeyId = 'pk-123';
      const userEmail = 'test@example.com';
      const mockResult = { rows: [] };

      mockQuery.mockResolvedValue(mockResult);

      await expect(deletePasskey(passkeyId, userEmail))
        .rejects.toThrow('Passkey with id pk-123 not found or does not belong to user');
    });
  });

  describe('get2FAStatus', () => {
    test('should return 2FA status for user', async () => {
      const userEmail = 'test@example.com';
      const mockResult = {
        rows: [{ passkey_2fa_enabled: true }]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await get2FAStatus(userEmail);

      expect(result.enabled).toBe(true);
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should return false if 2FA not enabled', async () => {
      const userEmail = 'test@example.com';
      const mockResult = {
        rows: [{ passkey_2fa_enabled: false }]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await get2FAStatus(userEmail);

      expect(result.enabled).toBe(false);
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('set2FAStatus', () => {
    test('should enable 2FA when user has passkeys', async () => {
      const userEmail = 'test@example.com';
      
      const mockPasskeysResult = {
        rows: [{
          id: 'pk-123',
          user_email: userEmail,
          credential_id: 'test-credential-id',
          public_key: 'test-public-key',
          counter: 5,
          aaguid: 'test-aaguid',
          transports: ['usb'],
          authenticator_type: 'cross-platform',
          friendly_name: 'My Key',
          last_used_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      const mockUpdateResult = {
        rows: [{ passkey_2fa_enabled: true }]
      };

      mockQuery
        .mockResolvedValueOnce(mockPasskeysResult)
        .mockResolvedValueOnce(mockUpdateResult);

      const result = await set2FAStatus(userEmail, true);

      expect(result.enabled).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    test('should throw error when enabling 2FA without passkeys', async () => {
      const userEmail = 'test@example.com';
      const mockPasskeysResult = { rows: [] };

      mockQuery.mockResolvedValueOnce(mockPasskeysResult);

      await expect(set2FAStatus(userEmail, true))
        .rejects.toThrow('Cannot enable 2FA: user must have at least one enrolled passkey');
    });

    test('should disable 2FA without checking passkeys', async () => {
      const userEmail = 'test@example.com';
      const mockUpdateResult = {
        rows: [{ passkey_2fa_enabled: false }]
      };

      mockQuery.mockResolvedValueOnce(mockUpdateResult);

      const result = await set2FAStatus(userEmail, false);

      expect(result.enabled).toBe(false);
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('storeChallenge', () => {
    test('should store a registration challenge', async () => {
      const challenge = 'test-challenge-base64url';
      const userEmail = 'test@example.com';
      const type = 'registration';
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      const mockResult = {
        rows: [{
          id: 1,
          challenge: challenge,
          user_email: userEmail,
          type: type,
          expires_at: expiresAt,
          created_at: new Date()
        }]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await storeChallenge(challenge, userEmail, type, expiresAt);

      expect(result.challenge).toBe(challenge);
      expect(result.userEmail).toBe(userEmail);
      expect(result.type).toBe(type);
      expect(result.expiresAt).toEqual(expiresAt);
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should store an authentication challenge with null userEmail', async () => {
      const challenge = 'test-challenge-base64url';
      const userEmail = null;
      const type = 'authentication';
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const mockResult = {
        rows: [{
          id: 1,
          challenge: challenge,
          user_email: null,
          type: type,
          expires_at: expiresAt,
          created_at: new Date()
        }]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await storeChallenge(challenge, userEmail, type, expiresAt);

      expect(result.challenge).toBe(challenge);
      expect(result.userEmail).toBeNull();
      expect(result.type).toBe(type);
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should throw error for invalid challenge type', async () => {
      const challenge = 'test-challenge-base64url';
      const userEmail = 'test@example.com';
      const type = 'invalid-type';
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await expect(storeChallenge(challenge, userEmail, type, expiresAt))
        .rejects.toThrow('Challenge type must be either "registration" or "authentication"');
    });

    test('should throw error for duplicate challenge', async () => {
      const challenge = 'duplicate-challenge';
      const userEmail = 'test@example.com';
      const type = 'registration';
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const duplicateError = new Error('duplicate key value');
      duplicateError.code = '23505';
      duplicateError.constraint = 'webauthn_challenges_challenge_key';

      mockQuery.mockRejectedValue(duplicateError);

      await expect(storeChallenge(challenge, userEmail, type, expiresAt))
        .rejects.toThrow('A challenge with this value already exists');
    });
  });

  describe('getChallenge', () => {
    test('should return challenge if not expired', async () => {
      const challenge = 'test-challenge-base64url';
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      const mockResult = {
        rows: [{
          id: 1,
          challenge: challenge,
          user_email: 'test@example.com',
          type: 'registration',
          expires_at: expiresAt,
          created_at: new Date()
        }]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await getChallenge(challenge);

      expect(result).not.toBeNull();
      expect(result.challenge).toBe(challenge);
      expect(result.type).toBe('registration');
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should return null if challenge not found', async () => {
      const challenge = 'non-existent-challenge';
      const mockResult = { rows: [] };

      mockQuery.mockResolvedValue(mockResult);

      const result = await getChallenge(challenge);

      expect(result).toBeNull();
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should return null if challenge is expired', async () => {
      const challenge = 'expired-challenge';
      const mockResult = { rows: [] }; // Query filters out expired challenges

      mockQuery.mockResolvedValue(mockResult);

      const result = await getChallenge(challenge);

      expect(result).toBeNull();
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('deleteChallenge', () => {
    test('should delete challenge and return true', async () => {
      const challenge = 'test-challenge-base64url';
      const mockResult = {
        rows: [{ id: 1 }]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await deleteChallenge(challenge);

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should return false if challenge not found', async () => {
      const challenge = 'non-existent-challenge';
      const mockResult = { rows: [] };

      mockQuery.mockResolvedValue(mockResult);

      const result = await deleteChallenge(challenge);

      expect(result).toBe(false);
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredChallenges', () => {
    test('should delete expired challenges and return count', async () => {
      const mockResult = {
        rows: [
          { id: 1 },
          { id: 2 },
          { id: 3 }
        ]
      };

      mockQuery.mockResolvedValue(mockResult);

      const result = await cleanupExpiredChallenges();

      expect(result).toBe(3);
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should return 0 if no expired challenges', async () => {
      const mockResult = { rows: [] };

      mockQuery.mockResolvedValue(mockResult);

      const result = await cleanupExpiredChallenges();

      expect(result).toBe(0);
      expect(mockQuery).toHaveBeenCalled();
    });
  });
});
