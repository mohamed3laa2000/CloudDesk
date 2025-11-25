const fc = require('fast-check');
const backupController = require('../controllers/backupController');
const dbService = require('../services/dbService');

// Mock the services
jest.mock('../services/dbService');

/**
 * Feature: gcp-backup-management, Property 4: Backup detail display completeness
 * Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6
 * 
 * For any backup displayed in the detail view, all required fields (name, source instance name, 
 * creation date/time, storage size in GB, current cost) should be present and correctly formatted.
 */
describe('Backup Controller - Backup Detail Display Completeness Property-Based Tests', () => {
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

  describe('Property 4: Backup detail display completeness', () => {
    it('should display all required fields for any backup', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random backup data
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 50 }),
            userEmail: fc.emailAddress(),
            instanceId: fc.string({ minLength: 5, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            gcpMachineImageName: fc.string({ minLength: 5, maxLength: 100 }),
            sourceInstanceName: fc.string({ minLength: 1, maxLength: 100 }),
            sourceInstanceZone: fc.constantFrom('us-central1-a', 'us-west1-b', 'us-east1-c'),
            storageBytes: fc.integer({ min: 1, max: 1000000000000 }), // 1 byte to 1TB
            status: fc.constantFrom('CREATING', 'COMPLETED', 'ERROR', 'DELETED'),
            errorMessage: fc.option(fc.string(), { nil: null }),
            // Generate creation time in the past (up to 30 days ago)
            createdAtOffset: fc.integer({ min: 0, max: 30 * 24 * 60 * 60 * 1000 })
          }),
          async (backupData) => {
            // Arrange
            jest.clearAllMocks();
            
            // Calculate createdAt timestamp
            const createdAt = new Date(Date.now() - backupData.createdAtOffset);
            const updatedAt = new Date(createdAt.getTime() + 1000); // 1 second after creation
            
            // Calculate storageGb from storageBytes
            const storageGb = Math.round((backupData.storageBytes / (1024 * 1024 * 1024)) * 100) / 100;
            
            const mockBackup = {
              id: backupData.id,
              userEmail: req.user.email, // Must match authenticated user
              instanceId: backupData.instanceId,
              name: backupData.name,
              gcpMachineImageName: backupData.gcpMachineImageName,
              sourceInstanceName: backupData.sourceInstanceName,
              sourceInstanceZone: backupData.sourceInstanceZone,
              storageBytes: backupData.storageBytes,
              storageGb: storageGb,
              status: backupData.status,
              errorMessage: backupData.errorMessage,
              createdAt: createdAt.toISOString(),
              updatedAt: updatedAt.toISOString()
            };

            req.params = { id: backupData.id };
            dbService.getBackupById.mockResolvedValue(mockBackup);

            // Act
            await backupController.getBackup(req, res, next);

            // Assert - should return 200 OK
            expect(res.status).toHaveBeenCalledWith(200);
            
            // Get the response
            const responseCall = res.json.mock.calls[0];
            expect(responseCall).toBeDefined();
            
            const response = responseCall[0];
            expect(response.success).toBe(true);
            expect(response.backup).toBeDefined();
            
            const returnedBackup = response.backup;
            
            // Requirement 4.2: Backup name should be present
            expect(returnedBackup.name).toBeDefined();
            expect(returnedBackup.name).toBe(backupData.name);
            
            // Requirement 4.3: Source instance name should be present
            expect(returnedBackup.sourceInstanceName).toBeDefined();
            expect(returnedBackup.sourceInstanceName).toBe(backupData.sourceInstanceName);
            
            // Requirement 4.4: Creation date and time should be present and correctly formatted
            expect(returnedBackup.createdAt).toBeDefined();
            expect(returnedBackup.createdAt).toBe(createdAt.toISOString());
            // Verify it's a valid ISO 8601 date string
            expect(new Date(returnedBackup.createdAt).toISOString()).toBe(returnedBackup.createdAt);
            
            // Requirement 4.5: Storage size in GB should be present
            expect(returnedBackup.storageGb).toBeDefined();
            expect(typeof returnedBackup.storageGb).toBe('number');
            expect(returnedBackup.storageGb).toBe(storageGb);
            expect(returnedBackup.storageGb).toBeGreaterThanOrEqual(0);
            
            // Requirement 4.6: Current cost should be present
            expect(returnedBackup.currentCost).toBeDefined();
            expect(typeof returnedBackup.currentCost).toBe('number');
            expect(returnedBackup.currentCost).toBeGreaterThanOrEqual(0);
            
            // Verify database was called
            expect(dbService.getBackupById).toHaveBeenCalledWith(backupData.id);
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly format creation date/time as ISO 8601 string', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random timestamps
          fc.date({ min: new Date('2020-01-01'), max: new Date() }),
          fc.string({ minLength: 5, maxLength: 50 }),
          async (createdDate, backupId) => {
            // Arrange
            jest.clearAllMocks();
            
            const mockBackup = {
              id: backupId,
              userEmail: req.user.email,
              instanceId: 'inst-1',
              name: 'Test Backup',
              gcpMachineImageName: 'test-image',
              sourceInstanceName: 'test-instance',
              sourceInstanceZone: 'us-central1-a',
              storageBytes: 10737418240,
              storageGb: 10.00,
              status: 'COMPLETED',
              errorMessage: null,
              createdAt: createdDate.toISOString(),
              updatedAt: createdDate.toISOString()
            };

            req.params = { id: backupId };
            dbService.getBackupById.mockResolvedValue(mockBackup);

            // Act
            await backupController.getBackup(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            
            const response = res.json.mock.calls[0][0];
            const returnedBackup = response.backup;
            
            // Verify creation date is in ISO 8601 format
            expect(returnedBackup.createdAt).toBe(createdDate.toISOString());
            
            // Verify it can be parsed back to the same date
            const parsedDate = new Date(returnedBackup.createdAt);
            expect(parsedDate.getTime()).toBe(createdDate.getTime());
            
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display storage size in GB with proper precision', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random storage sizes in bytes
          fc.integer({ min: 1, max: 10000000000000 }), // 1 byte to 10TB
          fc.string({ minLength: 5, maxLength: 50 }),
          async (storageBytes, backupId) => {
            // Arrange
            jest.clearAllMocks();
            
            // Calculate expected storageGb (same calculation as dbService)
            const expectedStorageGb = Math.round((storageBytes / (1024 * 1024 * 1024)) * 100) / 100;
            
            const mockBackup = {
              id: backupId,
              userEmail: req.user.email,
              instanceId: 'inst-1',
              name: 'Test Backup',
              gcpMachineImageName: 'test-image',
              sourceInstanceName: 'test-instance',
              sourceInstanceZone: 'us-central1-a',
              storageBytes: storageBytes,
              storageGb: expectedStorageGb,
              status: 'COMPLETED',
              errorMessage: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            req.params = { id: backupId };
            dbService.getBackupById.mockResolvedValue(mockBackup);

            // Act
            await backupController.getBackup(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            
            const response = res.json.mock.calls[0][0];
            const returnedBackup = response.backup;
            
            // Verify storage size is present and matches expected value
            expect(returnedBackup.storageGb).toBe(expectedStorageGb);
            expect(typeof returnedBackup.storageGb).toBe('number');
            expect(returnedBackup.storageGb).toBeGreaterThanOrEqual(0);
            
            // Verify precision (should be rounded to 2 decimal places)
            const decimalPlaces = (returnedBackup.storageGb.toString().split('.')[1] || '').length;
            expect(decimalPlaces).toBeLessThanOrEqual(2);
            
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate and display current cost for any backup age', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random storage size and age
          fc.record({
            storageGb: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
            ageHours: fc.float({ min: Math.fround(0), max: Math.fround(8760), noNaN: true }), // Up to 1 year
            backupId: fc.string({ minLength: 5, maxLength: 50 })
          }),
          async ({ storageGb, ageHours, backupId }) => {
            // Arrange
            jest.clearAllMocks();
            
            const STORAGE_RATE_PER_GB_HOUR = 2.306; // IDR per GB per hour
            
            // Calculate creation time based on age
            const createdAt = new Date(Date.now() - (ageHours * 60 * 60 * 1000));
            const storageBytes = Math.round(storageGb * 1024 * 1024 * 1024);
            
            const mockBackup = {
              id: backupId,
              userEmail: req.user.email,
              instanceId: 'inst-1',
              name: 'Test Backup',
              gcpMachineImageName: 'test-image',
              sourceInstanceName: 'test-instance',
              sourceInstanceZone: 'us-central1-a',
              storageBytes: storageBytes,
              storageGb: storageGb,
              status: 'COMPLETED',
              errorMessage: null,
              createdAt: createdAt.toISOString(),
              updatedAt: createdAt.toISOString()
            };

            req.params = { id: backupId };
            dbService.getBackupById.mockResolvedValue(mockBackup);

            // Act
            await backupController.getBackup(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            
            const response = res.json.mock.calls[0][0];
            const returnedBackup = response.backup;
            
            // Verify current cost is present
            expect(returnedBackup.currentCost).toBeDefined();
            expect(typeof returnedBackup.currentCost).toBe('number');
            expect(returnedBackup.currentCost).toBeGreaterThanOrEqual(0);
            
            // Calculate expected cost
            const actualAgeMs = Date.now() - createdAt.getTime();
            const actualAgeHours = actualAgeMs / (1000 * 60 * 60);
            const expectedCost = Math.round(storageGb * actualAgeHours * STORAGE_RATE_PER_GB_HOUR * 100) / 100;
            
            // Verify cost is within reasonable range (accounting for time elapsed during test)
            // Allow 1% tolerance for timing differences
            expect(returnedBackup.currentCost).toBeGreaterThanOrEqual(expectedCost * 0.99);
            expect(returnedBackup.currentCost).toBeLessThanOrEqual(expectedCost * 1.01);
            
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle backups with null storage (CREATING status)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }),
          async (backupId) => {
            // Arrange
            jest.clearAllMocks();
            
            const mockBackup = {
              id: backupId,
              userEmail: req.user.email,
              instanceId: 'inst-1',
              name: 'Test Backup',
              gcpMachineImageName: 'test-image',
              sourceInstanceName: 'test-instance',
              sourceInstanceZone: 'us-central1-a',
              storageBytes: null,
              storageGb: null,
              status: 'CREATING',
              errorMessage: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            req.params = { id: backupId };
            dbService.getBackupById.mockResolvedValue(mockBackup);

            // Act
            await backupController.getBackup(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            
            const response = res.json.mock.calls[0][0];
            const returnedBackup = response.backup;
            
            // All required fields should still be present
            expect(returnedBackup.name).toBeDefined();
            expect(returnedBackup.sourceInstanceName).toBeDefined();
            expect(returnedBackup.createdAt).toBeDefined();
            
            // Storage and cost should be present but may be null/0
            expect(returnedBackup.storageGb).toBe(null);
            expect(returnedBackup.currentCost).toBe(0);
            
            expect(next).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
