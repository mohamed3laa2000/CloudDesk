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

describe('calculateUsageSummary with backup costs', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock successful connection
    mockConnect.mockResolvedValue({
      release: jest.fn()
    });
    
    // Initialize the connection
    await dbService.connect();
  });

  test('should include backup costs in total cost when user has backups', async () => {
    const userEmail = 'test@example.com';
    
    // Mock instance query - return one instance
    const mockInstance = {
      id: 'inst-123',
      user_email: userEmail,
      name: 'Test Instance',
      image_id: 'windows-general',
      status: 'RUNNING',
      cpu_cores: 2,
      ram_gb: 4,
      storage_gb: 50,
      gpu: 'NONE',
      region: 'SINGAPORE',
      created_at: new Date(Date.now() - 3600000), // 1 hour ago
      updated_at: new Date(),
      gcp_instance_id: 'gcp-inst-123',
      gcp_zone: 'asia-southeast1-a',
      gcp_machine_type: 'e2-medium',
      gcp_project_id: 'test-project',
      gcp_external_ip: '1.2.3.4',
      error_message: null
    };

    // Mock backup query - return one backup
    const mockBackup = {
      id: 'bak-123',
      user_email: userEmail,
      instance_id: 'inst-123',
      name: 'Test Backup',
      gcp_machine_image_name: 'test-backup-image',
      source_instance_name: 'Test Instance',
      source_instance_zone: 'asia-southeast1-a',
      storage_bytes: 10737418240, // 10 GB
      status: 'COMPLETED',
      error_message: null,
      created_at: new Date(Date.now() - 3600000), // 1 hour ago
      updated_at: new Date()
    };

    // Setup mock responses
    mockQuery
      .mockResolvedValueOnce({ rows: [mockInstance] }) // First call for instances
      .mockResolvedValueOnce({ rows: [mockBackup] });  // Second call for backups

    const result = await dbService.calculateUsageSummary(userEmail);

    // Verify backup costs are included
    expect(result).toHaveProperty('backupStorageCost');
    expect(result).toHaveProperty('backupStorageGb');
    expect(result).toHaveProperty('backupCount');
    
    // Verify backup costs are added to total
    expect(result.backupCount).toBe(1);
    expect(result.backupStorageGb).toBe(10);
    expect(result.backupStorageCost).toBeGreaterThan(0);
    
    // Verify total cost includes both instance and backup costs
    expect(result.totalCost).toBeGreaterThan(0);
    expect(result.totalStorageCost).toBeGreaterThan(0);
  });

  test('should handle zero backups correctly', async () => {
    const userEmail = 'test@example.com';
    
    // Mock instance query - return one instance
    const mockInstance = {
      id: 'inst-123',
      user_email: userEmail,
      name: 'Test Instance',
      image_id: 'windows-general',
      status: 'RUNNING',
      cpu_cores: 2,
      ram_gb: 4,
      storage_gb: 50,
      gpu: 'NONE',
      region: 'SINGAPORE',
      created_at: new Date(Date.now() - 3600000),
      updated_at: new Date(),
      gcp_instance_id: 'gcp-inst-123',
      gcp_zone: 'asia-southeast1-a',
      gcp_machine_type: 'e2-medium',
      gcp_project_id: 'test-project',
      gcp_external_ip: '1.2.3.4',
      error_message: null
    };

    // Setup mock responses
    mockQuery
      .mockResolvedValueOnce({ rows: [mockInstance] }) // First call for instances
      .mockResolvedValueOnce({ rows: [] });  // Second call for backups (empty)

    const result = await dbService.calculateUsageSummary(userEmail);

    // Verify backup costs are zero
    expect(result.backupStorageCost).toBe(0);
    expect(result.backupStorageGb).toBe(0);
    expect(result.backupCount).toBe(0);
    
    // Verify total cost only includes instance costs
    expect(result.totalCost).toBeGreaterThan(0);
  });

  test('should include backup costs even when no instances exist', async () => {
    const userEmail = 'test@example.com';
    
    // Mock backup with storage
    const mockBackup = {
      id: 'bak-123',
      user_email: userEmail,
      instance_id: null,
      name: 'Test Backup',
      gcp_machine_image_name: 'test-backup-image',
      source_instance_name: 'Deleted Instance',
      source_instance_zone: 'asia-southeast1-a',
      storage_bytes: 10737418240, // 10 GB
      status: 'COMPLETED',
      error_message: null,
      created_at: new Date(Date.now() - 3600000), // 1 hour ago
      updated_at: new Date()
    };

    // Setup mock responses
    mockQuery
      .mockResolvedValueOnce({ rows: [] })  // First call for instances (empty)
      .mockResolvedValueOnce({ rows: [mockBackup] });  // Second call for backups

    const result = await dbService.calculateUsageSummary(userEmail);

    // Verify backup costs are included even with no instances
    expect(result.backupCount).toBe(1);
    expect(result.backupStorageGb).toBe(10);
    expect(result.backupStorageCost).toBeGreaterThan(0);
    expect(result.totalCost).toBe(result.backupStorageCost);
    expect(result.totalStorageCost).toBe(result.backupStorageCost);
  });
});
