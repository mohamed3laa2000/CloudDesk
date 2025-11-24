const fc = require('fast-check');
const backupController = require('../controllers/backupController');
const dbService = require('../services/dbService');
const gcpService = require('../services/gcpService');

// Mock the services
jest.mock('../services/dbService');
jest.mock('../services/gcpService');

/**
 * Feature: gcp-backup-management, Property 6: Backup ownership validation
 * Validates: Requirements 7.3
 * 
 * For any backup operation (view, delete), if the backup's user_email does not match 
 * the authenticated user's email, the system should return a 403 Forbidden error.
 */
describe('Backup Controller - Backup Ownership Validation Property-Based Tests', () => {
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

    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console
    console.log.mockRestore();
    console.error.mockRestore();
    console.warn.mockRestore();
  });

  describe('Property 6: Backup ownership validation', () => {
    it('should return 403 when viewing backup owned by different user', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two different email addresses
          fc.tuple(
            fc.emailAddress(),
            fc.emailAddress()
          ).filter(([email1, email2]) => email1 !== email2),
          async ([authenticatedUserEmail, backupOwnerEmail]) => {
            // Arrange
            jest.clearAllMocks();
            
            req.user = { email: authenticatedUserEmail };
            req.params = { id: 'bak-123' };

            const mockBackup = {
              id: 'bak-123',
              userEmail: backupOwnerEmail,
              instanceId: 'inst-1',
              name: 'Test Backup',
              gcpMachineImageName: 'test-image',
              sourceInstanceName: 'test-instance',
              sourceInstanceZone: 'us-central1-a',
              storageBytes: 10737418240,
              storageGb: 10.00,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            dbService.getBackupById.mockResolvedValue(mockBackup);

            // Act
            await backupController.getBackup(req, res, next);

            // Assert - should return 403 Forbidden
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
              success: false,
              error: 'Forbidden',
              message: 'You do not have permission to access this backup'
            });
            
            // Verify database was called but no further operations
            expect(dbService.getBackupById).toHaveBeenCalledWith('bak-123');
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 200 when viewing backup owned by same user', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a single email address for both authenticated user and backup owner
          fc.emailAddress(),
          async (userEmail) => {
            // Arrange
            jest.clearAllMocks();
            
            req.user = { email: userEmail };
            req.params = { id: 'bak-123' };

            const mockBackup = {
              id: 'bak-123',
              userEmail: userEmail,
              instanceId: 'inst-1',
              name: 'Test Backup',
              gcpMachineImageName: 'test-image',
              sourceInstanceName: 'test-instance',
              sourceInstanceZone: 'us-central1-a',
              storageBytes: 10737418240,
              storageGb: 10.00,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            dbService.getBackupById.mockResolvedValue(mockBackup);

            // Act
            await backupController.getBackup(req, res, next);

            // Assert - should return 200 OK
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
              success: true,
              backup: expect.objectContaining({
                id: 'bak-123',
                userEmail: userEmail,
                currentCost: expect.any(Number)
              })
            });
            
            // Verify database was called
            expect(dbService.getBackupById).toHaveBeenCalledWith('bak-123');
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 403 when creating backup for instance owned by different user', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two different email addresses
          fc.tuple(
            fc.emailAddress(),
            fc.emailAddress()
          ).filter(([email1, email2]) => email1 !== email2),
          // Generate a valid backup name
          fc.array(
            fc.constantFrom(
              ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_ '.split('')
            ),
            { minLength: 1, maxLength: 100 }
          ).map(chars => chars.join(''))
           .filter(s => s.trim().length > 0),
          async ([authenticatedUserEmail, instanceOwnerEmail], backupName) => {
            // Arrange
            jest.clearAllMocks();
            
            req.user = { email: authenticatedUserEmail };
            req.body = {
              instanceId: 'inst-1',
              name: backupName
            };

            const mockInstance = {
              id: 'inst-1',
              name: 'test-instance',
              userEmail: instanceOwnerEmail,
              gcpInstanceId: 'gcp-inst-1',
              gcpZone: 'us-central1-a',
              status: 'RUNNING'
            };

            dbService.getInstanceById.mockResolvedValue(mockInstance);

            // Act
            await backupController.createBackup(req, res, next);

            // Assert - should return 403 Forbidden
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
              success: false,
              error: 'Forbidden',
              message: 'You do not have permission to backup this instance'
            });
            
            // Verify database was called but no GCP operations
            expect(dbService.getInstanceById).toHaveBeenCalledWith('inst-1');
            expect(gcpService.getInstanceStatus).not.toHaveBeenCalled();
            expect(dbService.createBackup).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 201 when creating backup for instance owned by same user', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a single email address for both authenticated user and instance owner
          fc.emailAddress(),
          // Generate a valid backup name
          fc.array(
            fc.constantFrom(
              ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_ '.split('')
            ),
            { minLength: 1, maxLength: 100 }
          ).map(chars => chars.join(''))
           .filter(s => s.trim().length > 0),
          async (userEmail, backupName) => {
            // Arrange
            jest.clearAllMocks();
            
            req.user = { email: userEmail };
            req.body = {
              instanceId: 'inst-1',
              name: backupName
            };

            const mockInstance = {
              id: 'inst-1',
              name: 'test-instance',
              userEmail: userEmail,
              gcpInstanceId: null,
              gcpZone: null,
              status: 'RUNNING'
            };

            const mockBackup = {
              id: 'bak-123',
              userEmail: userEmail,
              instanceId: 'inst-1',
              name: backupName.trim(),
              gcpMachineImageName: 'backup-inst-1-1234567890',
              sourceInstanceName: 'test-instance',
              sourceInstanceZone: 'us-central1-a',
              status: 'CREATING',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            dbService.getInstanceById.mockResolvedValue(mockInstance);
            dbService.createBackup.mockResolvedValue(mockBackup);

            // Act
            await backupController.createBackup(req, res, next);

            // Assert - should return 201 Created
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
              success: true,
              message: 'Backup creation initiated. This may take several minutes to complete.',
              backup: mockBackup
            });
            
            // Verify database operations were performed
            expect(dbService.getInstanceById).toHaveBeenCalledWith('inst-1');
            expect(dbService.createBackup).toHaveBeenCalledWith(
              userEmail,
              'inst-1',
              expect.objectContaining({
                name: backupName.trim()
              })
            );
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
