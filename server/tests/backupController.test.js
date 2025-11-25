const backupController = require('../controllers/backupController');
const dbService = require('../services/dbService');
const gcpService = require('../services/gcpService');

// Mock the services
jest.mock('../services/dbService');
jest.mock('../services/gcpService');

describe('backupController', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock request, response, and next
    req = {
      user: { email: 'test@example.com' },
      params: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('getBackups', () => {
    it('should return backups array with 200 status', async () => {
      // Arrange
      const mockBackups = [
        {
          id: 'bak-1',
          userEmail: 'test@example.com',
          instanceId: 'inst-1',
          name: 'Test Backup 1',
          gcpMachineImageName: 'test-image-1',
          sourceInstanceName: 'test-instance-1',
          sourceInstanceZone: 'us-central1-a',
          storageBytes: 10737418240,
          storageGb: 10.00,
          status: 'COMPLETED',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'bak-2',
          userEmail: 'test@example.com',
          instanceId: 'inst-2',
          name: 'Test Backup 2',
          gcpMachineImageName: 'test-image-2',
          sourceInstanceName: 'test-instance-2',
          sourceInstanceZone: 'us-west1-b',
          storageBytes: 21474836480,
          storageGb: 20.00,
          status: 'CREATING',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z'
        }
      ];

      dbService.getBackupsByUser.mockResolvedValue(mockBackups);

      // Act
      await backupController.getBackups(req, res, next);

      // Assert
      expect(dbService.getBackupsByUser).toHaveBeenCalledWith('test@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        backups: mockBackups
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if user email not found in request', async () => {
      // Arrange
      req.user = {};

      // Act
      await backupController.getBackups(req, res, next);

      // Assert
      expect(dbService.getBackupsByUser).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'User email not found in request'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 503 on database error', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      dbService.getBackupsByUser.mockRejectedValue(dbError);

      // Act
      await backupController.getBackups(req, res, next);

      // Assert
      expect(dbService.getBackupsByUser).toHaveBeenCalledWith('test@example.com');
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no backups', async () => {
      // Arrange
      dbService.getBackupsByUser.mockResolvedValue([]);

      // Act
      await backupController.getBackups(req, res, next);

      // Assert
      expect(dbService.getBackupsByUser).toHaveBeenCalledWith('test@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        backups: []
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next on unexpected error', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected error');
      req.user = null; // This will cause an error when trying to access req.user.email

      // Act
      await backupController.getBackups(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getBackup', () => {
    it('should return backup with current cost and 200 status', async () => {
      // Arrange
      req.params = { id: 'bak-1' };

      const mockBackup = {
        id: 'bak-1',
        userEmail: 'test@example.com',
        instanceId: 'inst-1',
        name: 'Test Backup',
        gcpMachineImageName: 'test-image-1',
        sourceInstanceName: 'test-instance-1',
        sourceInstanceZone: 'us-central1-a',
        storageBytes: 10737418240,
        storageGb: 10.00,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      };

      dbService.getBackupById.mockResolvedValue(mockBackup);

      // Act
      await backupController.getBackup(req, res, next);

      // Assert
      expect(dbService.getBackupById).toHaveBeenCalledWith('bak-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        backup: expect.objectContaining({
          id: 'bak-1',
          userEmail: 'test@example.com',
          name: 'Test Backup',
          storageGb: 10.00,
          status: 'COMPLETED',
          currentCost: expect.any(Number)
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if user email not found in request', async () => {
      // Arrange
      req.user = {};
      req.params = { id: 'bak-1' };

      // Act
      await backupController.getBackup(req, res, next);

      // Assert
      expect(dbService.getBackupById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'User email not found in request'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if backup ID is missing', async () => {
      // Arrange
      req.params = {};

      // Act
      await backupController.getBackup(req, res, next);

      // Assert
      expect(dbService.getBackupById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Backup ID is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if backup not found', async () => {
      // Arrange
      req.params = { id: 'bak-nonexistent' };
      dbService.getBackupById.mockResolvedValue(null);

      // Act
      await backupController.getBackup(req, res, next);

      // Assert
      expect(dbService.getBackupById).toHaveBeenCalledWith('bak-nonexistent');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not Found',
        message: 'Backup not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not own the backup', async () => {
      // Arrange
      req.params = { id: 'bak-1' };

      const mockBackup = {
        id: 'bak-1',
        userEmail: 'other@example.com',
        instanceId: 'inst-1',
        name: 'Test Backup',
        status: 'COMPLETED'
      };

      dbService.getBackupById.mockResolvedValue(mockBackup);

      // Act
      await backupController.getBackup(req, res, next);

      // Assert
      expect(dbService.getBackupById).toHaveBeenCalledWith('bak-1');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this backup'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 503 on database error', async () => {
      // Arrange
      req.params = { id: 'bak-1' };
      const dbError = new Error('Database connection failed');
      dbService.getBackupById.mockRejectedValue(dbError);

      // Act
      await backupController.getBackup(req, res, next);

      // Assert
      expect(dbService.getBackupById).toHaveBeenCalledWith('bak-1');
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should calculate cost as 0 when storageGb is null', async () => {
      // Arrange
      req.params = { id: 'bak-1' };

      const mockBackup = {
        id: 'bak-1',
        userEmail: 'test@example.com',
        instanceId: 'inst-1',
        name: 'Test Backup',
        gcpMachineImageName: 'test-image-1',
        sourceInstanceName: 'test-instance-1',
        sourceInstanceZone: 'us-central1-a',
        storageBytes: null,
        storageGb: null,
        status: 'CREATING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      dbService.getBackupById.mockResolvedValue(mockBackup);

      // Act
      await backupController.getBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        backup: expect.objectContaining({
          id: 'bak-1',
          currentCost: 0
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should use updated_at for DELETED backups when calculating cost', async () => {
      // Arrange
      req.params = { id: 'bak-1' };

      const createdAt = new Date(Date.now() - 7200000); // 2 hours ago
      const updatedAt = new Date(Date.now() - 3600000); // 1 hour ago (deleted 1 hour ago)

      const mockBackup = {
        id: 'bak-1',
        userEmail: 'test@example.com',
        instanceId: 'inst-1',
        name: 'Test Backup',
        gcpMachineImageName: 'test-image-1',
        sourceInstanceName: 'test-instance-1',
        sourceInstanceZone: 'us-central1-a',
        storageBytes: 10737418240,
        storageGb: 10.00,
        status: 'DELETED',
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
      };

      dbService.getBackupById.mockResolvedValue(mockBackup);

      // Act
      await backupController.getBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      
      // Cost should be calculated from createdAt to updatedAt (1 hour), not to now (2 hours)
      // Expected cost: 10 GB * 1 hour * 2.306 IDR/GB/hour = 23.06 IDR
      expect(response.backup.currentCost).toBeGreaterThan(20);
      expect(response.backup.currentCost).toBeLessThan(30);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next on unexpected error', async () => {
      // Arrange
      req.params = { id: 'bak-1' };
      req.user = null; // This will cause an error when trying to access req.user.email

      // Act
      await backupController.getBackup(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('createBackup', () => {
    beforeEach(() => {
      // Mock timers for setTimeout/setImmediate
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should create backup successfully for GCP-managed instance', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1',
        name: 'My Backup'
      };

      const mockInstance = {
        id: 'inst-1',
        name: 'test-instance',
        userEmail: 'test@example.com',
        gcpInstanceId: 'gcp-inst-1',
        gcpZone: 'us-central1-a',
        status: 'RUNNING'
      };

      const mockBackup = {
        id: 'bak-123',
        userEmail: 'test@example.com',
        instanceId: 'inst-1',
        name: 'My Backup',
        gcpMachineImageName: 'backup-inst-1-1234567890',
        sourceInstanceName: 'test-instance',
        sourceInstanceZone: 'us-central1-a',
        status: 'CREATING',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      dbService.getInstanceById.mockResolvedValue(mockInstance);
      gcpService.getInstanceStatus.mockResolvedValue('RUNNING');
      dbService.createBackup.mockResolvedValue(mockBackup);
      gcpService.createMachineImage.mockResolvedValue({ success: true });

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(dbService.getInstanceById).toHaveBeenCalledWith('inst-1');
      expect(gcpService.getInstanceStatus).toHaveBeenCalledWith('gcp-inst-1', 'us-central1-a');
      expect(dbService.createBackup).toHaveBeenCalledWith(
        'test@example.com',
        'inst-1',
        expect.objectContaining({
          name: 'My Backup',
          sourceInstanceName: 'test-instance',
          sourceInstanceZone: 'us-central1-a',
          status: 'CREATING'
        })
      );
      expect(gcpService.createMachineImage).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Backup creation initiated. This may take several minutes to complete.',
        backup: mockBackup
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if instanceId is missing', async () => {
      // Arrange
      req.body = {
        name: 'My Backup'
      };

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Missing required field: instanceId'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if name is missing', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1'
      };

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Missing required field: name'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if backup name is empty', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1',
        name: ''
      };

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Backup name cannot be empty'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if backup name is only whitespace', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1',
        name: '   '
      };

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Backup name cannot be empty'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if backup name exceeds 100 characters', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1',
        name: 'a'.repeat(101)
      };

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Backup name cannot exceed 100 characters'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if backup name contains invalid characters', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1',
        name: 'My Backup @#$%'
      };

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Backup name contains invalid characters'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if instance not found', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1',
        name: 'My Backup'
      };

      dbService.getInstanceById.mockResolvedValue(null);

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(dbService.getInstanceById).toHaveBeenCalledWith('inst-1');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not Found',
        message: 'Source instance not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not own the instance', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1',
        name: 'My Backup'
      };

      const mockInstance = {
        id: 'inst-1',
        name: 'test-instance',
        userEmail: 'other@example.com',
        status: 'RUNNING'
      };

      dbService.getInstanceById.mockResolvedValue(mockInstance);

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(dbService.getInstanceById).toHaveBeenCalledWith('inst-1');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to backup this instance'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 if GCP verification fails', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1',
        name: 'My Backup'
      };

      const mockInstance = {
        id: 'inst-1',
        name: 'test-instance',
        userEmail: 'test@example.com',
        gcpInstanceId: 'gcp-inst-1',
        gcpZone: 'us-central1-a',
        status: 'RUNNING'
      };

      dbService.getInstanceById.mockResolvedValue(mockInstance);
      gcpService.getInstanceStatus.mockRejectedValue({
        error: 'GCP_NOT_FOUND',
        message: 'Instance not found in GCP'
      });

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(gcpService.getInstanceStatus).toHaveBeenCalledWith('gcp-inst-1', 'us-central1-a');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'GCP_NOT_FOUND',
        message: 'Instance not found in GCP'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 503 on database error during instance lookup', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1',
        name: 'My Backup'
      };

      dbService.getInstanceById.mockRejectedValue(new Error('Database connection failed'));

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 503 on database error during backup creation', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1',
        name: 'My Backup'
      };

      const mockInstance = {
        id: 'inst-1',
        name: 'test-instance',
        userEmail: 'test@example.com',
        gcpInstanceId: 'gcp-inst-1',
        gcpZone: 'us-central1-a',
        status: 'RUNNING'
      };

      dbService.getInstanceById.mockResolvedValue(mockInstance);
      gcpService.getInstanceStatus.mockResolvedValue('RUNNING');
      dbService.createBackup.mockRejectedValue(new Error('Database connection failed'));

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 if GCP machine image creation fails', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1',
        name: 'My Backup'
      };

      const mockInstance = {
        id: 'inst-1',
        name: 'test-instance',
        userEmail: 'test@example.com',
        gcpInstanceId: 'gcp-inst-1',
        gcpZone: 'us-central1-a',
        status: 'RUNNING'
      };

      const mockBackup = {
        id: 'bak-123',
        userEmail: 'test@example.com',
        instanceId: 'inst-1',
        name: 'My Backup',
        status: 'CREATING'
      };

      dbService.getInstanceById.mockResolvedValue(mockInstance);
      gcpService.getInstanceStatus.mockResolvedValue('RUNNING');
      dbService.createBackup.mockResolvedValue(mockBackup);
      gcpService.createMachineImage.mockRejectedValue({
        error: 'GCP_ERROR',
        message: 'Failed to create machine image'
      });
      dbService.updateBackupStatus.mockResolvedValue(mockBackup);

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(gcpService.createMachineImage).toHaveBeenCalled();
      expect(dbService.updateBackupStatus).toHaveBeenCalledWith(
        'bak-123',
        'ERROR',
        null,
        'Failed to create machine image'
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'GCP_ERROR',
        message: 'Failed to create machine image',
        backup: mockBackup
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle non-GCP instances (demo mode)', async () => {
      // Arrange
      req.body = {
        instanceId: 'inst-1',
        name: 'My Backup'
      };

      const mockInstance = {
        id: 'inst-1',
        name: 'test-instance',
        userEmail: 'test@example.com',
        gcpInstanceId: null,
        gcpZone: null,
        status: 'RUNNING'
      };

      const mockBackup = {
        id: 'bak-123',
        userEmail: 'test@example.com',
        instanceId: 'inst-1',
        name: 'My Backup',
        status: 'CREATING'
      };

      dbService.getInstanceById.mockResolvedValue(mockInstance);
      dbService.createBackup.mockResolvedValue(mockBackup);

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(dbService.getInstanceById).toHaveBeenCalledWith('inst-1');
      expect(gcpService.getInstanceStatus).not.toHaveBeenCalled();
      expect(gcpService.createMachineImage).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Backup creation initiated. This may take several minutes to complete.',
        backup: mockBackup
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if user email not found in request', async () => {
      // Arrange
      req.user = {};
      req.body = {
        instanceId: 'inst-1',
        name: 'My Backup'
      };

      // Act
      await backupController.createBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'User email not found in request'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('restoreBackup', () => {
    it('should restore backup and create new instance with 201 status', async () => {
      // Arrange
      req.params = { id: 'bak-123' };
      req.body = {
        instanceName: 'restored-instance',
        zone: 'us-central1-a'
      };

      const mockBackup = {
        id: 'bak-123',
        userEmail: 'test@example.com',
        instanceId: 'inst-1',
        name: 'Test Backup',
        gcpMachineImageName: 'backup-inst-1-123456',
        status: 'COMPLETED'
      };

      const mockOriginalInstance = {
        id: 'inst-1',
        imageId: 'windows-server-2022',
        cpuCores: 4,
        ramGb: 16,
        storageGb: 100,
        gpu: false,
        gcpMachineType: 'n1-standard-4'
      };

      const mockGcpMetadata = {
        projectId: 'test-project'
      };

      const mockCreatedInstance = {
        id: 'inst-new',
        userEmail: 'test@example.com',
        name: 'restored-instance',
        status: 'PROVISIONING'
      };

      dbService.getBackupById.mockResolvedValue(mockBackup);
      dbService.getInstanceById.mockResolvedValue(mockOriginalInstance);
      gcpService.createInstanceFromMachineImage.mockResolvedValue(mockGcpMetadata);
      dbService.createInstance.mockResolvedValue(mockCreatedInstance);

      // Act
      await backupController.restoreBackup(req, res, next);

      // Assert
      expect(dbService.getBackupById).toHaveBeenCalledWith('bak-123');
      expect(gcpService.createInstanceFromMachineImage).toHaveBeenCalledWith(
        'restored-instance',
        'us-central1-a',
        'backup-inst-1-123456'
      );
      expect(dbService.createInstance).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Instance restore initiated successfully',
        instance: mockCreatedInstance
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if instanceName is missing', async () => {
      // Arrange
      req.params = { id: 'bak-123' };
      req.body = {
        zone: 'us-central1-a'
      };

      // Act
      await backupController.restoreBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Missing required field: instanceName'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if instanceName is empty', async () => {
      // Arrange
      req.params = { id: 'bak-123' };
      req.body = {
        instanceName: '   ',
        zone: 'us-central1-a'
      };

      // Act
      await backupController.restoreBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Instance name cannot be empty'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if instanceName contains invalid characters', async () => {
      // Arrange
      req.params = { id: 'bak-123' };
      req.body = {
        instanceName: 'invalid@name!',
        zone: 'us-central1-a'
      };

      // Act
      await backupController.restoreBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Instance name contains invalid characters'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if backup not found', async () => {
      // Arrange
      req.params = { id: 'bak-nonexistent' };
      req.body = {
        instanceName: 'restored-instance',
        zone: 'us-central1-a'
      };

      dbService.getBackupById.mockResolvedValue(null);

      // Act
      await backupController.restoreBackup(req, res, next);

      // Assert
      expect(dbService.getBackupById).toHaveBeenCalledWith('bak-nonexistent');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not Found',
        message: 'Backup not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not own the backup', async () => {
      // Arrange
      req.params = { id: 'bak-123' };
      req.body = {
        instanceName: 'restored-instance',
        zone: 'us-central1-a'
      };

      const mockBackup = {
        id: 'bak-123',
        userEmail: 'other@example.com',
        status: 'COMPLETED'
      };

      dbService.getBackupById.mockResolvedValue(mockBackup);

      // Act
      await backupController.restoreBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to restore this backup'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if backup status is not COMPLETED', async () => {
      // Arrange
      req.params = { id: 'bak-123' };
      req.body = {
        instanceName: 'restored-instance',
        zone: 'us-central1-a'
      };

      const mockBackup = {
        id: 'bak-123',
        userEmail: 'test@example.com',
        status: 'CREATING'
      };

      dbService.getBackupById.mockResolvedValue(mockBackup);

      // Act
      await backupController.restoreBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'Cannot restore backup with status CREATING. Only COMPLETED backups can be restored.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 on GCP error', async () => {
      // Arrange
      req.params = { id: 'bak-123' };
      req.body = {
        instanceName: 'restored-instance',
        zone: 'us-central1-a'
      };

      const mockBackup = {
        id: 'bak-123',
        userEmail: 'test@example.com',
        instanceId: 'inst-1',
        gcpMachineImageName: 'backup-inst-1-123456',
        status: 'COMPLETED'
      };

      const gcpError = {
        error: 'GCP_ERROR',
        message: 'Failed to create instance'
      };

      dbService.getBackupById.mockResolvedValue(mockBackup);
      gcpService.createInstanceFromMachineImage.mockRejectedValue(gcpError);

      // Act
      await backupController.restoreBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'GCP_ERROR',
        message: 'Failed to create instance'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 503 on database error', async () => {
      // Arrange
      req.params = { id: 'bak-123' };
      req.body = {
        instanceName: 'restored-instance',
        zone: 'us-central1-a'
      };

      const dbError = new Error('Database connection failed');
      dbService.getBackupById.mockRejectedValue(dbError);

      // Act
      await backupController.restoreBackup(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
