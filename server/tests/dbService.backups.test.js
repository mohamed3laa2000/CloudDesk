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

// Test for backup-related database functions
const dbService = require('../services/dbService');
const { __testExports } = require('../services/dbService');
const { transformBackupRow } = __testExports;

describe('transformBackupRow', () => {
  test('should transform snake_case database row to camelCase', () => {
    const dbRow = {
      id: 'bak-123',
      user_email: 'test@example.com',
      instance_id: 'inst-456',
      name: 'My Backup',
      gcp_machine_image_name: 'backup-image-123',
      source_instance_name: 'my-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: 10737418240, // 10 GB in bytes
      status: 'COMPLETED',
      error_message: null,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T01:00:00Z')
    };

    const result = transformBackupRow(dbRow);

    expect(result).toEqual({
      id: 'bak-123',
      userEmail: 'test@example.com',
      instanceId: 'inst-456',
      name: 'My Backup',
      gcpMachineImageName: 'backup-image-123',
      sourceInstanceName: 'my-instance',
      sourceInstanceZone: 'us-central1-a',
      storageBytes: 10737418240,
      storageGb: 10, // Converted from bytes
      status: 'COMPLETED',
      errorMessage: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T01:00:00Z')
    });
  });

  test('should calculate storageGb correctly from storageBytes', () => {
    const dbRow = {
      id: 'bak-123',
      user_email: 'test@example.com',
      instance_id: 'inst-456',
      name: 'My Backup',
      gcp_machine_image_name: 'backup-image-123',
      source_instance_name: 'my-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: 5368709120, // 5 GB in bytes
      status: 'COMPLETED',
      error_message: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = transformBackupRow(dbRow);

    expect(result.storageGb).toBe(5);
  });

  test('should handle null storage_bytes', () => {
    const dbRow = {
      id: 'bak-123',
      user_email: 'test@example.com',
      instance_id: 'inst-456',
      name: 'My Backup',
      gcp_machine_image_name: 'backup-image-123',
      source_instance_name: 'my-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: null,
      status: 'CREATING',
      error_message: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = transformBackupRow(dbRow);

    expect(result.storageBytes).toBeNull();
    expect(result.storageGb).toBeNull();
  });

  test('should handle undefined storage_bytes', () => {
    const dbRow = {
      id: 'bak-123',
      user_email: 'test@example.com',
      instance_id: 'inst-456',
      name: 'My Backup',
      gcp_machine_image_name: 'backup-image-123',
      source_instance_name: 'my-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: undefined,
      status: 'CREATING',
      error_message: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = transformBackupRow(dbRow);

    expect(result.storageBytes).toBeUndefined();
    expect(result.storageGb).toBeNull();
  });

  test('should handle error_message correctly', () => {
    const dbRow = {
      id: 'bak-123',
      user_email: 'test@example.com',
      instance_id: 'inst-456',
      name: 'My Backup',
      gcp_machine_image_name: 'backup-image-123',
      source_instance_name: 'my-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: null,
      status: 'ERROR',
      error_message: 'Failed to create backup',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = transformBackupRow(dbRow);

    expect(result.errorMessage).toBe('Failed to create backup');
  });

  test('should return null for null input', () => {
    const result = transformBackupRow(null);
    expect(result).toBeNull();
  });

  test('should return null for undefined input', () => {
    const result = transformBackupRow(undefined);
    expect(result).toBeNull();
  });

  test('should round storageGb to 2 decimal places', () => {
    const dbRow = {
      id: 'bak-123',
      user_email: 'test@example.com',
      instance_id: 'inst-456',
      name: 'My Backup',
      gcp_machine_image_name: 'backup-image-123',
      source_instance_name: 'my-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: 1234567890, // ~1.15 GB
      status: 'COMPLETED',
      error_message: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = transformBackupRow(dbRow);

    expect(result.storageGb).toBe(1.15);
  });

  test('should handle zero storage_bytes', () => {
    const dbRow = {
      id: 'bak-123',
      user_email: 'test@example.com',
      instance_id: 'inst-456',
      name: 'My Backup',
      gcp_machine_image_name: 'backup-image-123',
      source_instance_name: 'my-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: 0,
      status: 'COMPLETED',
      error_message: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = transformBackupRow(dbRow);

    expect(result.storageBytes).toBe(0);
    expect(result.storageGb).toBe(0);
  });
});

describe('getBackupById', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock successful connection
    mockConnect.mockResolvedValue({
      release: jest.fn()
    });
    
    // Initialize the connection
    await dbService.connect();
  });

  test('should return backup when found', async () => {
    const backupId = 'bak-123456789-abc123';
    const mockResult = {
      rows: [{
        id: backupId,
        user_email: 'test@example.com',
        instance_id: 'inst-456',
        name: 'Test Backup',
        gcp_machine_image_name: 'test-backup-image',
        source_instance_name: 'test-instance',
        source_instance_zone: 'us-central1-a',
        storage_bytes: 10737418240, // 10 GB
        status: 'COMPLETED',
        error_message: null,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T01:00:00Z')
      }]
    };

    mockQuery.mockResolvedValue(mockResult);

    const backup = await dbService.getBackupById(backupId);

    expect(backup).toBeDefined();
    expect(backup.id).toBe(backupId);
    expect(backup.userEmail).toBe('test@example.com');
    expect(backup.instanceId).toBe('inst-456');
    expect(backup.name).toBe('Test Backup');
    expect(backup.gcpMachineImageName).toBe('test-backup-image');
    expect(backup.sourceInstanceName).toBe('test-instance');
    expect(backup.sourceInstanceZone).toBe('us-central1-a');
    expect(backup.storageBytes).toBe(10737418240);
    expect(backup.storageGb).toBe(10);
    expect(backup.status).toBe('COMPLETED');
    expect(backup.errorMessage).toBeNull();
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [backupId]
    );
  });

  test('should return null when backup not found', async () => {
    const backupId = 'bak-nonexistent';
    const mockResult = {
      rows: []
    };

    mockQuery.mockResolvedValue(mockResult);

    const backup = await dbService.getBackupById(backupId);

    expect(backup).toBeNull();
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [backupId]
    );
  });

  test('should return transformed backup object with camelCase fields', async () => {
    const backupId = 'bak-test-camelcase';
    const mockResult = {
      rows: [{
        id: backupId,
        user_email: 'camel@example.com',
        instance_id: 'inst-camel',
        name: 'Camel Case Backup',
        gcp_machine_image_name: 'camel-image',
        source_instance_name: 'camel-instance',
        source_instance_zone: 'us-west1-b',
        storage_bytes: 5368709120, // 5 GB
        status: 'COMPLETED',
        error_message: null,
        created_at: new Date(),
        updated_at: new Date()
      }]
    };

    mockQuery.mockResolvedValue(mockResult);

    const backup = await dbService.getBackupById(backupId);

    // Verify all fields are in camelCase
    expect(backup).toHaveProperty('id');
    expect(backup).toHaveProperty('userEmail');
    expect(backup).toHaveProperty('instanceId');
    expect(backup).toHaveProperty('gcpMachineImageName');
    expect(backup).toHaveProperty('sourceInstanceName');
    expect(backup).toHaveProperty('sourceInstanceZone');
    expect(backup).toHaveProperty('storageBytes');
    expect(backup).toHaveProperty('storageGb');
    
    // Verify no snake_case fields
    expect(backup).not.toHaveProperty('user_email');
    expect(backup).not.toHaveProperty('instance_id');
    expect(backup).not.toHaveProperty('gcp_machine_image_name');
    expect(backup).not.toHaveProperty('source_instance_name');
    expect(backup).not.toHaveProperty('source_instance_zone');
    expect(backup).not.toHaveProperty('storage_bytes');
  });

  test('should handle database errors gracefully', async () => {
    const backupId = 'bak-error-test';
    
    mockQuery.mockRejectedValue(new Error('Database connection failed'));

    await expect(dbService.getBackupById(backupId))
      .rejects.toThrow('Database query failed');
  });

  test('should handle backup with null storage_bytes', async () => {
    const backupId = 'bak-creating';
    const mockResult = {
      rows: [{
        id: backupId,
        user_email: 'test@example.com',
        instance_id: 'inst-123',
        name: 'Creating Backup',
        gcp_machine_image_name: 'creating-image',
        source_instance_name: 'creating-instance',
        source_instance_zone: 'us-central1-a',
        storage_bytes: null,
        status: 'CREATING',
        error_message: null,
        created_at: new Date(),
        updated_at: new Date()
      }]
    };

    mockQuery.mockResolvedValue(mockResult);

    const backup = await dbService.getBackupById(backupId);

    expect(backup).toBeDefined();
    expect(backup.storageBytes).toBeNull();
    expect(backup.storageGb).toBeNull();
    expect(backup.status).toBe('CREATING');
  });

  test('should handle backup with error status', async () => {
    const backupId = 'bak-error';
    const mockResult = {
      rows: [{
        id: backupId,
        user_email: 'test@example.com',
        instance_id: 'inst-error',
        name: 'Failed Backup',
        gcp_machine_image_name: 'failed-image',
        source_instance_name: 'failed-instance',
        source_instance_zone: 'us-central1-a',
        storage_bytes: null,
        status: 'ERROR',
        error_message: 'Failed to create machine image',
        created_at: new Date(),
        updated_at: new Date()
      }]
    };

    mockQuery.mockResolvedValue(mockResult);

    const backup = await dbService.getBackupById(backupId);

    expect(backup).toBeDefined();
    expect(backup.status).toBe('ERROR');
    expect(backup.errorMessage).toBe('Failed to create machine image');
  });
});

describe('createBackup', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock successful connection
    mockConnect.mockResolvedValue({
      release: jest.fn()
    });
    
    // Initialize the connection
    await dbService.connect();
  });

  test('should create a backup with CREATING status', async () => {
    const userEmail = 'test@example.com';
    const instanceId = 'inst-test-123';
    const backupData = {
      name: 'Test Backup',
      gcpMachineImageName: 'test-backup-image',
      sourceInstanceName: 'test-instance',
      sourceInstanceZone: 'us-central1-a'
    };

    const mockResult = {
      rows: [{
        id: 'bak-123456789-abc123',
        user_email: userEmail,
        instance_id: instanceId,
        name: backupData.name,
        gcp_machine_image_name: backupData.gcpMachineImageName,
        source_instance_name: backupData.sourceInstanceName,
        source_instance_zone: backupData.sourceInstanceZone,
        storage_bytes: null,
        status: 'CREATING',
        error_message: null,
        created_at: new Date(),
        updated_at: new Date()
      }]
    };

    mockQuery.mockResolvedValue(mockResult);

    const backup = await dbService.createBackup(userEmail, instanceId, backupData);

    expect(backup).toBeDefined();
    expect(backup.id).toBe('bak-123456789-abc123');
    expect(backup.userEmail).toBe(userEmail);
    expect(backup.instanceId).toBe(instanceId);
    expect(backup.name).toBe(backupData.name);
    expect(backup.gcpMachineImageName).toBe(backupData.gcpMachineImageName);
    expect(backup.sourceInstanceName).toBe(backupData.sourceInstanceName);
    expect(backup.sourceInstanceZone).toBe(backupData.sourceInstanceZone);
    expect(backup.status).toBe('CREATING');
    expect(backup.storageBytes).toBeNull();
    expect(backup.storageGb).toBeNull();
    expect(backup.errorMessage).toBeNull();
    expect(backup.createdAt).toBeDefined();
    expect(backup.updatedAt).toBeDefined();
    expect(mockQuery).toHaveBeenCalled();
  });

  test('should generate unique backup IDs', async () => {
    const userEmail = 'test@example.com';
    const instanceId = 'inst-test-456';
    const backupData1 = {
      name: 'Test Backup 1',
      gcpMachineImageName: 'test-backup-image-1',
      sourceInstanceName: 'test-instance',
      sourceInstanceZone: 'us-central1-a'
    };

    const mockResult1 = {
      rows: [{
        id: 'bak-111111111-aaa111',
        user_email: userEmail,
        instance_id: instanceId,
        name: backupData1.name,
        gcp_machine_image_name: backupData1.gcpMachineImageName,
        source_instance_name: backupData1.sourceInstanceName,
        source_instance_zone: backupData1.sourceInstanceZone,
        storage_bytes: null,
        status: 'CREATING',
        error_message: null,
        created_at: new Date(),
        updated_at: new Date()
      }]
    };

    mockQuery.mockResolvedValueOnce(mockResult1);

    const backup1 = await dbService.createBackup(userEmail, instanceId, backupData1);
    
    const backupData2 = {
      name: 'Test Backup 2',
      gcpMachineImageName: 'test-backup-image-2',
      sourceInstanceName: 'test-instance',
      sourceInstanceZone: 'us-central1-a'
    };

    const mockResult2 = {
      rows: [{
        id: 'bak-222222222-bbb222',
        user_email: userEmail,
        instance_id: instanceId,
        name: backupData2.name,
        gcp_machine_image_name: backupData2.gcpMachineImageName,
        source_instance_name: backupData2.sourceInstanceName,
        source_instance_zone: backupData2.sourceInstanceZone,
        storage_bytes: null,
        status: 'CREATING',
        error_message: null,
        created_at: new Date(),
        updated_at: new Date()
      }]
    };

    mockQuery.mockResolvedValueOnce(mockResult2);

    const backup2 = await dbService.createBackup(userEmail, instanceId, backupData2);

    expect(backup1.id).not.toBe(backup2.id);
    expect(backup1.id).toBe('bak-111111111-aaa111');
    expect(backup2.id).toBe('bak-222222222-bbb222');
  });

  test('should return transformed backup object with camelCase fields', async () => {
    const userEmail = 'test@example.com';
    const instanceId = 'inst-test-789';
    const backupData = {
      name: 'Camel Case Test',
      gcpMachineImageName: 'camel-case-image',
      sourceInstanceName: 'camel-instance',
      sourceInstanceZone: 'us-west1-b'
    };

    const mockResult = {
      rows: [{
        id: 'bak-333333333-ccc333',
        user_email: userEmail,
        instance_id: instanceId,
        name: backupData.name,
        gcp_machine_image_name: backupData.gcpMachineImageName,
        source_instance_name: backupData.sourceInstanceName,
        source_instance_zone: backupData.sourceInstanceZone,
        storage_bytes: null,
        status: 'CREATING',
        error_message: null,
        created_at: new Date(),
        updated_at: new Date()
      }]
    };

    mockQuery.mockResolvedValue(mockResult);

    const backup = await dbService.createBackup(userEmail, instanceId, backupData);

    // Verify all fields are in camelCase
    expect(backup).toHaveProperty('id');
    expect(backup).toHaveProperty('userEmail');
    expect(backup).toHaveProperty('instanceId');
    expect(backup).toHaveProperty('name');
    expect(backup).toHaveProperty('gcpMachineImageName');
    expect(backup).toHaveProperty('sourceInstanceName');
    expect(backup).toHaveProperty('sourceInstanceZone');
    expect(backup).toHaveProperty('storageBytes');
    expect(backup).toHaveProperty('storageGb');
    expect(backup).toHaveProperty('status');
    expect(backup).toHaveProperty('errorMessage');
    expect(backup).toHaveProperty('createdAt');
    expect(backup).toHaveProperty('updatedAt');
    
    // Verify no snake_case fields
    expect(backup).not.toHaveProperty('user_email');
    expect(backup).not.toHaveProperty('instance_id');
    expect(backup).not.toHaveProperty('gcp_machine_image_name');
    expect(backup).not.toHaveProperty('source_instance_name');
    expect(backup).not.toHaveProperty('source_instance_zone');
    expect(backup).not.toHaveProperty('storage_bytes');
    expect(backup).not.toHaveProperty('error_message');
    expect(backup).not.toHaveProperty('created_at');
    expect(backup).not.toHaveProperty('updated_at');
  });

  test('should handle database errors gracefully', async () => {
    const userEmail = 'nonexistent@example.com';
    const instanceId = 'inst-test-999';
    const backupData = {
      name: 'Error Test',
      gcpMachineImageName: 'error-image',
      sourceInstanceName: 'error-instance',
      sourceInstanceZone: 'us-east1-a'
    };

    mockQuery.mockRejectedValue(new Error('Foreign key constraint violation'));

    await expect(dbService.createBackup(userEmail, instanceId, backupData))
      .rejects.toThrow('Database query failed');
  });

  test('should include all required fields in database insert', async () => {
    const userEmail = 'test@example.com';
    const instanceId = 'inst-test-complete';
    const backupData = {
      name: 'Complete Test',
      gcpMachineImageName: 'complete-image',
      sourceInstanceName: 'complete-instance',
      sourceInstanceZone: 'europe-west1-a'
    };

    const mockResult = {
      rows: [{
        id: 'bak-444444444-ddd444',
        user_email: userEmail,
        instance_id: instanceId,
        name: backupData.name,
        gcp_machine_image_name: backupData.gcpMachineImageName,
        source_instance_name: backupData.sourceInstanceName,
        source_instance_zone: backupData.sourceInstanceZone,
        storage_bytes: null,
        status: 'CREATING',
        error_message: null,
        created_at: new Date(),
        updated_at: new Date()
      }]
    };

    mockQuery.mockResolvedValue(mockResult);

    await dbService.createBackup(userEmail, instanceId, backupData);

    // Verify the query was called with correct parameters
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO backups'),
      expect.arrayContaining([
        expect.stringMatching(/^bak-\d+-[a-z0-9]+$/), // ID with correct format
        userEmail,
        instanceId,
        backupData.name,
        backupData.gcpMachineImageName,
        backupData.sourceInstanceName,
        backupData.sourceInstanceZone,
        null, // storage_bytes
        'CREATING' // status
      ])
    );
  });
});

describe('isValidStatusTransition', () => {
  const { isValidStatusTransition } = require('../services/dbService').__testExports;

  test('should allow CREATING to COMPLETED transition', () => {
    expect(isValidStatusTransition('CREATING', 'COMPLETED')).toBe(true);
  });

  test('should allow CREATING to ERROR transition', () => {
    expect(isValidStatusTransition('CREATING', 'ERROR')).toBe(true);
  });

  test('should allow COMPLETED to DELETED transition', () => {
    expect(isValidStatusTransition('COMPLETED', 'DELETED')).toBe(true);
  });

  test('should allow ERROR to DELETED transition', () => {
    expect(isValidStatusTransition('ERROR', 'DELETED')).toBe(true);
  });

  test('should reject CREATING to DELETED transition', () => {
    expect(isValidStatusTransition('CREATING', 'DELETED')).toBe(false);
  });

  test('should reject COMPLETED to ERROR transition', () => {
    expect(isValidStatusTransition('COMPLETED', 'ERROR')).toBe(false);
  });

  test('should reject COMPLETED to CREATING transition', () => {
    expect(isValidStatusTransition('COMPLETED', 'CREATING')).toBe(false);
  });

  test('should reject ERROR to CREATING transition', () => {
    expect(isValidStatusTransition('ERROR', 'CREATING')).toBe(false);
  });

  test('should reject ERROR to COMPLETED transition', () => {
    expect(isValidStatusTransition('ERROR', 'COMPLETED')).toBe(false);
  });

  test('should reject any transition from DELETED', () => {
    expect(isValidStatusTransition('DELETED', 'CREATING')).toBe(false);
    expect(isValidStatusTransition('DELETED', 'COMPLETED')).toBe(false);
    expect(isValidStatusTransition('DELETED', 'ERROR')).toBe(false);
    expect(isValidStatusTransition('DELETED', 'DELETED')).toBe(false);
  });

  test('should handle invalid current status', () => {
    expect(isValidStatusTransition('INVALID', 'COMPLETED')).toBe(false);
  });

  test('should handle undefined current status', () => {
    expect(isValidStatusTransition(undefined, 'COMPLETED')).toBe(false);
  });

  test('should handle null current status', () => {
    expect(isValidStatusTransition(null, 'COMPLETED')).toBe(false);
  });
});

describe('updateBackupStatus', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock successful connection
    mockConnect.mockResolvedValue({
      release: jest.fn()
    });
    
    // Initialize the connection
    await dbService.connect();
  });

  test('should update backup status from CREATING to COMPLETED', async () => {
    const backupId = 'bak-update-test-1';
    
    // Mock getBackupById to return a backup with CREATING status
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-123',
      name: 'Test Backup',
      gcpMachineImageName: 'test-image',
      sourceInstanceName: 'test-instance',
      sourceInstanceZone: 'us-central1-a',
      storageBytes: null,
      storageGb: null,
      status: 'CREATING',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedBackup = {
      id: backupId,
      user_email: 'test@example.com',
      instance_id: 'inst-123',
      name: 'Test Backup',
      gcp_machine_image_name: 'test-image',
      source_instance_name: 'test-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: 10737418240, // 10 GB
      status: 'COMPLETED',
      error_message: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    // First call is for getBackupById, second is for the update
    mockQuery
      .mockResolvedValueOnce({ rows: [currentBackup] })
      .mockResolvedValueOnce({ rows: [updatedBackup] });

    const result = await dbService.updateBackupStatus(backupId, 'COMPLETED', 10737418240, null);

    expect(result).toBeDefined();
    expect(result.status).toBe('COMPLETED');
    expect(result.storageBytes).toBe(10737418240);
    expect(result.storageGb).toBe(10);
    expect(result.errorMessage).toBeNull();
  });

  test('should update backup status from CREATING to ERROR with error message', async () => {
    const backupId = 'bak-update-test-2';
    const errorMessage = 'Failed to create machine image';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-456',
      name: 'Failed Backup',
      gcpMachineImageName: 'failed-image',
      sourceInstanceName: 'failed-instance',
      sourceInstanceZone: 'us-west1-a',
      storageBytes: null,
      storageGb: null,
      status: 'CREATING',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedBackup = {
      id: backupId,
      user_email: 'test@example.com',
      instance_id: 'inst-456',
      name: 'Failed Backup',
      gcp_machine_image_name: 'failed-image',
      source_instance_name: 'failed-instance',
      source_instance_zone: 'us-west1-a',
      storage_bytes: null,
      status: 'ERROR',
      error_message: errorMessage,
      created_at: new Date(),
      updated_at: new Date()
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [currentBackup] })
      .mockResolvedValueOnce({ rows: [updatedBackup] });

    const result = await dbService.updateBackupStatus(backupId, 'ERROR', null, errorMessage);

    expect(result).toBeDefined();
    expect(result.status).toBe('ERROR');
    expect(result.errorMessage).toBe(errorMessage);
    expect(result.storageBytes).toBeNull();
  });

  test('should update backup status from COMPLETED to DELETED', async () => {
    const backupId = 'bak-update-test-3';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-789',
      name: 'Completed Backup',
      gcpMachineImageName: 'completed-image',
      sourceInstanceName: 'completed-instance',
      sourceInstanceZone: 'europe-west1-a',
      storageBytes: 5368709120,
      storageGb: 5,
      status: 'COMPLETED',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedBackup = {
      id: backupId,
      user_email: 'test@example.com',
      instance_id: 'inst-789',
      name: 'Completed Backup',
      gcp_machine_image_name: 'completed-image',
      source_instance_name: 'completed-instance',
      source_instance_zone: 'europe-west1-a',
      storage_bytes: 5368709120,
      status: 'DELETED',
      error_message: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [currentBackup] })
      .mockResolvedValueOnce({ rows: [updatedBackup] });

    const result = await dbService.updateBackupStatus(backupId, 'DELETED', null, null);

    expect(result).toBeDefined();
    expect(result.status).toBe('DELETED');
    expect(result.storageBytes).toBe(5368709120);
  });

  test('should reject invalid status transition from CREATING to DELETED', async () => {
    const backupId = 'bak-invalid-transition-1';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-invalid',
      name: 'Invalid Transition',
      gcpMachineImageName: 'invalid-image',
      sourceInstanceName: 'invalid-instance',
      sourceInstanceZone: 'us-central1-a',
      storageBytes: null,
      storageGb: null,
      status: 'CREATING',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockQuery.mockResolvedValueOnce({ rows: [currentBackup] });

    await expect(dbService.updateBackupStatus(backupId, 'DELETED', null, null))
      .rejects.toThrow('Invalid status transition from CREATING to DELETED');
  });

  test('should reject invalid status transition from COMPLETED to ERROR', async () => {
    const backupId = 'bak-invalid-transition-2';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-invalid-2',
      name: 'Invalid Transition 2',
      gcpMachineImageName: 'invalid-image-2',
      sourceInstanceName: 'invalid-instance-2',
      sourceInstanceZone: 'us-west1-a',
      storageBytes: 1073741824,
      storageGb: 1,
      status: 'COMPLETED',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockQuery.mockResolvedValueOnce({ rows: [currentBackup] });

    await expect(dbService.updateBackupStatus(backupId, 'ERROR', null, 'Some error'))
      .rejects.toThrow('Invalid status transition from COMPLETED to ERROR');
  });

  test('should reject invalid status value', async () => {
    const backupId = 'bak-invalid-status';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-test',
      name: 'Test Backup',
      gcpMachineImageName: 'test-image',
      sourceInstanceName: 'test-instance',
      sourceInstanceZone: 'us-central1-a',
      storageBytes: null,
      storageGb: null,
      status: 'CREATING',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockQuery.mockResolvedValueOnce({ rows: [currentBackup] });

    await expect(dbService.updateBackupStatus(backupId, 'INVALID_STATUS', null, null))
      .rejects.toThrow('Invalid status: INVALID_STATUS');
  });

  test('should throw error when backup not found', async () => {
    const backupId = 'bak-nonexistent';
    
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(dbService.updateBackupStatus(backupId, 'COMPLETED', null, null))
      .rejects.toThrow('Database query failed');
  });

  test('should preserve existing storage_bytes when not provided', async () => {
    const backupId = 'bak-preserve-storage';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-preserve',
      name: 'Preserve Storage',
      gcpMachineImageName: 'preserve-image',
      sourceInstanceName: 'preserve-instance',
      sourceInstanceZone: 'us-central1-a',
      storageBytes: 2147483648, // 2 GB
      storageGb: 2,
      status: 'COMPLETED',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedBackup = {
      id: backupId,
      user_email: 'test@example.com',
      instance_id: 'inst-preserve',
      name: 'Preserve Storage',
      gcp_machine_image_name: 'preserve-image',
      source_instance_name: 'preserve-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: 2147483648, // Should be preserved
      status: 'DELETED',
      error_message: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [currentBackup] })
      .mockResolvedValueOnce({ rows: [updatedBackup] });

    const result = await dbService.updateBackupStatus(backupId, 'DELETED', null, null);

    expect(result).toBeDefined();
    expect(result.status).toBe('DELETED');
    expect(result.storageBytes).toBe(2147483648);
    expect(result.storageGb).toBe(2);
  });

  test('should handle database errors gracefully', async () => {
    const backupId = 'bak-db-error';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-error',
      name: 'DB Error Test',
      gcpMachineImageName: 'error-image',
      sourceInstanceName: 'error-instance',
      sourceInstanceZone: 'us-central1-a',
      storageBytes: null,
      storageGb: null,
      status: 'CREATING',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [currentBackup] })
      .mockRejectedValueOnce(new Error('Database connection failed'));

    await expect(dbService.updateBackupStatus(backupId, 'COMPLETED', 1073741824, null))
      .rejects.toThrow('Database query failed');
  });

  test('should return transformed backup object with camelCase fields', async () => {
    const backupId = 'bak-camelcase-test';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-camel',
      name: 'CamelCase Test',
      gcpMachineImageName: 'camel-image',
      sourceInstanceName: 'camel-instance',
      sourceInstanceZone: 'us-central1-a',
      storageBytes: null,
      storageGb: null,
      status: 'CREATING',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedBackup = {
      id: backupId,
      user_email: 'test@example.com',
      instance_id: 'inst-camel',
      name: 'CamelCase Test',
      gcp_machine_image_name: 'camel-image',
      source_instance_name: 'camel-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: 3221225472, // 3 GB
      status: 'COMPLETED',
      error_message: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [currentBackup] })
      .mockResolvedValueOnce({ rows: [updatedBackup] });

    const result = await dbService.updateBackupStatus(backupId, 'COMPLETED', 3221225472, null);

    // Verify all fields are in camelCase
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('userEmail');
    expect(result).toHaveProperty('instanceId');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('gcpMachineImageName');
    expect(result).toHaveProperty('sourceInstanceName');
    expect(result).toHaveProperty('sourceInstanceZone');
    expect(result).toHaveProperty('storageBytes');
    expect(result).toHaveProperty('storageGb');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('errorMessage');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
    
    // Verify no snake_case fields
    expect(result).not.toHaveProperty('user_email');
    expect(result).not.toHaveProperty('instance_id');
    expect(result).not.toHaveProperty('gcp_machine_image_name');
    expect(result).not.toHaveProperty('source_instance_name');
    expect(result).not.toHaveProperty('source_instance_zone');
    expect(result).not.toHaveProperty('storage_bytes');
    expect(result).not.toHaveProperty('error_message');
    expect(result).not.toHaveProperty('created_at');
    expect(result).not.toHaveProperty('updated_at');
  });
});

describe('deleteBackup', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock successful connection
    mockConnect.mockResolvedValue({
      release: jest.fn()
    });
    
    // Initialize the connection
    await dbService.connect();
  });

  test('should soft delete backup by setting status to DELETED', async () => {
    const backupId = 'bak-delete-test-1';
    
    // Mock getBackupById to return a backup with COMPLETED status
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-123',
      name: 'Test Backup',
      gcpMachineImageName: 'test-image',
      sourceInstanceName: 'test-instance',
      sourceInstanceZone: 'us-central1-a',
      storageBytes: 10737418240, // 10 GB
      storageGb: 10,
      status: 'COMPLETED',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const deletedBackup = {
      id: backupId,
      user_email: 'test@example.com',
      instance_id: 'inst-123',
      name: 'Test Backup',
      gcp_machine_image_name: 'test-image',
      source_instance_name: 'test-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: 10737418240,
      status: 'DELETED',
      error_message: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    // First call is for getBackupById, second is for the delete
    mockQuery
      .mockResolvedValueOnce({ rows: [currentBackup] })
      .mockResolvedValueOnce({ rows: [deletedBackup] });

    const result = await dbService.deleteBackup(backupId);

    expect(result).toBeDefined();
    expect(result.status).toBe('DELETED');
    expect(result.storageBytes).toBe(10737418240);
    expect(result.storageGb).toBe(10);
  });

  test('should delete backup with ERROR status', async () => {
    const backupId = 'bak-delete-test-2';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-456',
      name: 'Failed Backup',
      gcpMachineImageName: 'failed-image',
      sourceInstanceName: 'failed-instance',
      sourceInstanceZone: 'us-west1-a',
      storageBytes: null,
      storageGb: null,
      status: 'ERROR',
      errorMessage: 'Failed to create machine image',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const deletedBackup = {
      id: backupId,
      user_email: 'test@example.com',
      instance_id: 'inst-456',
      name: 'Failed Backup',
      gcp_machine_image_name: 'failed-image',
      source_instance_name: 'failed-instance',
      source_instance_zone: 'us-west1-a',
      storage_bytes: null,
      status: 'DELETED',
      error_message: 'Failed to create machine image',
      created_at: new Date(),
      updated_at: new Date()
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [currentBackup] })
      .mockResolvedValueOnce({ rows: [deletedBackup] });

    const result = await dbService.deleteBackup(backupId);

    expect(result).toBeDefined();
    expect(result.status).toBe('DELETED');
    expect(result.errorMessage).toBe('Failed to create machine image');
  });

  test('should reject deleting backup with CREATING status', async () => {
    const backupId = 'bak-delete-invalid-1';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-creating',
      name: 'Creating Backup',
      gcpMachineImageName: 'creating-image',
      sourceInstanceName: 'creating-instance',
      sourceInstanceZone: 'us-central1-a',
      storageBytes: null,
      storageGb: null,
      status: 'CREATING',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockQuery.mockResolvedValueOnce({ rows: [currentBackup] });

    await expect(dbService.deleteBackup(backupId))
      .rejects.toThrow('Invalid status transition from CREATING to DELETED');
  });

  test('should throw error when backup not found', async () => {
    const backupId = 'bak-nonexistent';
    
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(dbService.deleteBackup(backupId))
      .rejects.toThrow('Database query failed');
  });

  test('should update updated_at timestamp', async () => {
    const backupId = 'bak-delete-timestamp';
    const createdAt = new Date('2024-01-01T00:00:00Z');
    const updatedAt = new Date('2024-01-02T00:00:00Z');
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-timestamp',
      name: 'Timestamp Test',
      gcpMachineImageName: 'timestamp-image',
      sourceInstanceName: 'timestamp-instance',
      sourceInstanceZone: 'us-central1-a',
      storageBytes: 5368709120,
      storageGb: 5,
      status: 'COMPLETED',
      errorMessage: null,
      createdAt: createdAt,
      updatedAt: createdAt
    };

    const deletedBackup = {
      id: backupId,
      user_email: 'test@example.com',
      instance_id: 'inst-timestamp',
      name: 'Timestamp Test',
      gcp_machine_image_name: 'timestamp-image',
      source_instance_name: 'timestamp-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: 5368709120,
      status: 'DELETED',
      error_message: null,
      created_at: createdAt,
      updated_at: updatedAt
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [currentBackup] })
      .mockResolvedValueOnce({ rows: [deletedBackup] });

    const result = await dbService.deleteBackup(backupId);

    expect(result).toBeDefined();
    expect(result.updatedAt).toEqual(updatedAt);
    expect(result.updatedAt).not.toEqual(result.createdAt);
  });

  test('should return transformed backup object with camelCase fields', async () => {
    const backupId = 'bak-delete-camelcase';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-camel',
      name: 'CamelCase Test',
      gcpMachineImageName: 'camel-image',
      sourceInstanceName: 'camel-instance',
      sourceInstanceZone: 'us-central1-a',
      storageBytes: 3221225472,
      storageGb: 3,
      status: 'COMPLETED',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const deletedBackup = {
      id: backupId,
      user_email: 'test@example.com',
      instance_id: 'inst-camel',
      name: 'CamelCase Test',
      gcp_machine_image_name: 'camel-image',
      source_instance_name: 'camel-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: 3221225472,
      status: 'DELETED',
      error_message: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [currentBackup] })
      .mockResolvedValueOnce({ rows: [deletedBackup] });

    const result = await dbService.deleteBackup(backupId);

    // Verify all fields are in camelCase
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('userEmail');
    expect(result).toHaveProperty('instanceId');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('gcpMachineImageName');
    expect(result).toHaveProperty('sourceInstanceName');
    expect(result).toHaveProperty('sourceInstanceZone');
    expect(result).toHaveProperty('storageBytes');
    expect(result).toHaveProperty('storageGb');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('errorMessage');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
    
    // Verify no snake_case fields
    expect(result).not.toHaveProperty('user_email');
    expect(result).not.toHaveProperty('instance_id');
    expect(result).not.toHaveProperty('gcp_machine_image_name');
    expect(result).not.toHaveProperty('source_instance_name');
    expect(result).not.toHaveProperty('source_instance_zone');
    expect(result).not.toHaveProperty('storage_bytes');
    expect(result).not.toHaveProperty('error_message');
    expect(result).not.toHaveProperty('created_at');
    expect(result).not.toHaveProperty('updated_at');
  });

  test('should handle database errors gracefully', async () => {
    const backupId = 'bak-db-error';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'test@example.com',
      instanceId: 'inst-error',
      name: 'DB Error Test',
      gcpMachineImageName: 'error-image',
      sourceInstanceName: 'error-instance',
      sourceInstanceZone: 'us-central1-a',
      storageBytes: 1073741824,
      storageGb: 1,
      status: 'COMPLETED',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [currentBackup] })
      .mockRejectedValueOnce(new Error('Database connection failed'));

    await expect(dbService.deleteBackup(backupId))
      .rejects.toThrow('Database query failed');
  });

  test('should preserve all backup data except status and updated_at', async () => {
    const backupId = 'bak-preserve-data';
    
    const currentBackup = {
      id: backupId,
      userEmail: 'preserve@example.com',
      instanceId: 'inst-preserve',
      name: 'Preserve Data Test',
      gcpMachineImageName: 'preserve-image',
      sourceInstanceName: 'preserve-instance',
      sourceInstanceZone: 'europe-west1-a',
      storageBytes: 21474836480, // 20 GB
      storageGb: 20,
      status: 'COMPLETED',
      errorMessage: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T01:00:00Z')
    };

    const deletedBackup = {
      id: backupId,
      user_email: 'preserve@example.com',
      instance_id: 'inst-preserve',
      name: 'Preserve Data Test',
      gcp_machine_image_name: 'preserve-image',
      source_instance_name: 'preserve-instance',
      source_instance_zone: 'europe-west1-a',
      storage_bytes: 21474836480,
      status: 'DELETED',
      error_message: null,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-02T00:00:00Z')
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [currentBackup] })
      .mockResolvedValueOnce({ rows: [deletedBackup] });

    const result = await dbService.deleteBackup(backupId);

    // Verify all data is preserved
    expect(result.id).toBe(backupId);
    expect(result.userEmail).toBe('preserve@example.com');
    expect(result.instanceId).toBe('inst-preserve');
    expect(result.name).toBe('Preserve Data Test');
    expect(result.gcpMachineImageName).toBe('preserve-image');
    expect(result.sourceInstanceName).toBe('preserve-instance');
    expect(result.sourceInstanceZone).toBe('europe-west1-a');
    expect(result.storageBytes).toBe(21474836480);
    expect(result.storageGb).toBe(20);
    expect(result.status).toBe('DELETED');
    expect(result.errorMessage).toBeNull();
  });
});
