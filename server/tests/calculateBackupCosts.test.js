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

const dbService = require('../services/dbService');

describe('calculateBackupCosts', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock successful connection
    mockConnect.mockResolvedValue({
      release: jest.fn()
    });
    
    // Initialize the connection
    await dbService.connect();
  });

  test('should return zero summary when user has no backups', async () => {
    const userEmail = 'nobackups@example.com';
    
    mockQuery.mockResolvedValue({ rows: [] });

    const result = await dbService.calculateBackupCosts(userEmail);

    expect(result).toEqual({
      totalBackupStorageCost: 0,
      totalBackupStorageGb: 0,
      backupCount: 0,
      costByBackup: []
    });
  });

  test('should calculate cost for a single active backup', async () => {
    const userEmail = 'test@example.com';
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const mockBackup = {
      id: 'bak-123',
      user_email: userEmail,
      instance_id: 'inst-456',
      name: 'Test Backup',
      gcp_machine_image_name: 'test-image',
      source_instance_name: 'test-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: 10737418240, // 10 GB
      status: 'COMPLETED',
      error_message: null,
      created_at: oneHourAgo,
      updated_at: now
    };

    mockQuery.mockResolvedValue({ rows: [mockBackup] });

    const result = await dbService.calculateBackupCosts(userEmail);

    expect(result.backupCount).toBe(1);
    expect(result.totalBackupStorageGb).toBe(10);
    expect(result.costByBackup).toHaveLength(1);
    expect(result.costByBackup[0].backupId).toBe('bak-123');
    expect(result.costByBackup[0].backupName).toBe('Test Backup');
    expect(result.costByBackup[0].storageGb).toBe(10);
    // Cost should be approximately 10 GB * 1 hour * 2.306 IDR/GB/hour = 23.06 IDR
    expect(result.costByBackup[0].cost).toBeGreaterThan(20);
    expect(result.costByBackup[0].cost).toBeLessThan(25);
    expect(result.totalBackupStorageCost).toBeGreaterThan(20);
    expect(result.totalBackupStorageCost).toBeLessThan(25);
  });

  test('should include DELETED backups in cost calculation', async () => {
    const userEmail = 'test@example.com';
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const mockBackups = [
      {
        id: 'bak-active',
        user_email: userEmail,
        instance_id: 'inst-1',
        name: 'Active Backup',
        gcp_machine_image_name: 'active-image',
        source_instance_name: 'active-instance',
        source_instance_zone: 'us-central1-a',
        storage_bytes: 5368709120, // 5 GB
        status: 'COMPLETED',
        error_message: null,
        created_at: twoHoursAgo,
        updated_at: now
      },
      {
        id: 'bak-deleted',
        user_email: userEmail,
        instance_id: 'inst-2',
        name: 'Deleted Backup',
        gcp_machine_image_name: 'deleted-image',
        source_instance_name: 'deleted-instance',
        source_instance_zone: 'us-west1-a',
        storage_bytes: 10737418240, // 10 GB
        status: 'DELETED',
        error_message: null,
        created_at: twoHoursAgo,
        updated_at: oneHourAgo // Deleted after 1 hour
      }
    ];

    mockQuery.mockResolvedValue({ rows: mockBackups });

    const result = await dbService.calculateBackupCosts(userEmail);

    expect(result.backupCount).toBe(2);
    expect(result.totalBackupStorageGb).toBe(15); // 5 + 10
    expect(result.costByBackup).toHaveLength(2);
    
    // Active backup: 5 GB * 2 hours * 2.306 = ~23.06 IDR
    const activeBackupCost = result.costByBackup.find(b => b.backupId === 'bak-active');
    expect(activeBackupCost.cost).toBeGreaterThan(20);
    expect(activeBackupCost.cost).toBeLessThan(25);
    
    // Deleted backup: 10 GB * 1 hour * 2.306 = ~23.06 IDR
    const deletedBackupCost = result.costByBackup.find(b => b.backupId === 'bak-deleted');
    expect(deletedBackupCost.cost).toBeGreaterThan(20);
    expect(deletedBackupCost.cost).toBeLessThan(25);
  });

  test('should handle backups with null storage_bytes (CREATING status)', async () => {
    const userEmail = 'test@example.com';
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const mockBackups = [
      {
        id: 'bak-creating',
        user_email: userEmail,
        instance_id: 'inst-1',
        name: 'Creating Backup',
        gcp_machine_image_name: 'creating-image',
        source_instance_name: 'creating-instance',
        source_instance_zone: 'us-central1-a',
        storage_bytes: null,
        status: 'CREATING',
        error_message: null,
        created_at: oneHourAgo,
        updated_at: now
      },
      {
        id: 'bak-completed',
        user_email: userEmail,
        instance_id: 'inst-2',
        name: 'Completed Backup',
        gcp_machine_image_name: 'completed-image',
        source_instance_name: 'completed-instance',
        source_instance_zone: 'us-west1-a',
        storage_bytes: 5368709120, // 5 GB
        status: 'COMPLETED',
        error_message: null,
        created_at: oneHourAgo,
        updated_at: now
      }
    ];

    mockQuery.mockResolvedValue({ rows: mockBackups });

    const result = await dbService.calculateBackupCosts(userEmail);

    expect(result.backupCount).toBe(2);
    expect(result.totalBackupStorageGb).toBe(5); // Only completed backup
    expect(result.costByBackup).toHaveLength(2);
    
    // Creating backup should have 0 cost
    const creatingBackupCost = result.costByBackup.find(b => b.backupId === 'bak-creating');
    expect(creatingBackupCost.cost).toBe(0);
    expect(creatingBackupCost.storageGb).toBe(0);
    
    // Completed backup should have cost
    const completedBackupCost = result.costByBackup.find(b => b.backupId === 'bak-completed');
    expect(completedBackupCost.cost).toBeGreaterThan(0);
  });

  test('should calculate costs correctly for multiple backups', async () => {
    const userEmail = 'test@example.com';
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    
    const mockBackups = [
      {
        id: 'bak-1',
        user_email: userEmail,
        instance_id: 'inst-1',
        name: 'Backup 1',
        gcp_machine_image_name: 'image-1',
        source_instance_name: 'instance-1',
        source_instance_zone: 'us-central1-a',
        storage_bytes: 10737418240, // 10 GB
        status: 'COMPLETED',
        error_message: null,
        created_at: threeHoursAgo,
        updated_at: now
      },
      {
        id: 'bak-2',
        user_email: userEmail,
        instance_id: 'inst-2',
        name: 'Backup 2',
        gcp_machine_image_name: 'image-2',
        source_instance_name: 'instance-2',
        source_instance_zone: 'us-west1-a',
        storage_bytes: 5368709120, // 5 GB
        status: 'COMPLETED',
        error_message: null,
        created_at: threeHoursAgo,
        updated_at: now
      }
    ];

    mockQuery.mockResolvedValue({ rows: mockBackups });

    const result = await dbService.calculateBackupCosts(userEmail);

    expect(result.backupCount).toBe(2);
    expect(result.totalBackupStorageGb).toBe(15); // 10 + 5
    expect(result.costByBackup).toHaveLength(2);
    
    // Total cost should be sum of individual costs
    const totalCalculated = result.costByBackup.reduce((sum, b) => sum + b.cost, 0);
    expect(Math.abs(result.totalBackupStorageCost - totalCalculated)).toBeLessThan(0.01);
  });

  test('should handle database errors gracefully', async () => {
    const userEmail = 'error@example.com';
    
    mockQuery.mockRejectedValue(new Error('Database connection failed'));

    await expect(dbService.calculateBackupCosts(userEmail))
      .rejects.toThrow('Database query failed');
  });

  test('should round costs to 2 decimal places', async () => {
    const userEmail = 'test@example.com';
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const mockBackup = {
      id: 'bak-round',
      user_email: userEmail,
      instance_id: 'inst-round',
      name: 'Rounding Test',
      gcp_machine_image_name: 'round-image',
      source_instance_name: 'round-instance',
      source_instance_zone: 'us-central1-a',
      storage_bytes: 1234567890, // ~1.15 GB
      status: 'COMPLETED',
      error_message: null,
      created_at: oneHourAgo,
      updated_at: now
    };

    mockQuery.mockResolvedValue({ rows: [mockBackup] });

    const result = await dbService.calculateBackupCosts(userEmail);

    // Check that costs are rounded to 2 decimal places
    expect(result.totalBackupStorageCost).toEqual(
      Math.round(result.totalBackupStorageCost * 100) / 100
    );
    expect(result.costByBackup[0].cost).toEqual(
      Math.round(result.costByBackup[0].cost * 100) / 100
    );
  });
});
