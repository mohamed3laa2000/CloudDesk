const fc = require('fast-check');
const backupController = require('../controllers/backupController');
const dbService = require('../services/dbService');
const gcpService = require('../services/gcpService');

// Mock the services
jest.mock('../services/dbService');
jest.mock('../services/gcpService');

/**
 * Feature: gcp-backup-management, Property 1: Backup name validation rejects invalid inputs
 * Validates: Requirements 1.4, 1.5
 * 
 * For any backup name input that is empty, contains only whitespace, exceeds 100 characters, 
 * or contains invalid characters, the system should reject the input and return a validation error.
 */
describe('Backup Controller - Backup Name Validation Property-Based Tests', () => {
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

  describe('Property 1: Backup name validation rejects invalid inputs', () => {
    it('should reject empty strings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(''),
          async (name) => {
            // Arrange
            jest.clearAllMocks();
            req.body = {
              instanceId: 'inst-1',
              name: name
            };

            // Act
            await backupController.createBackup(req, res, next);

            // Assert - should return 400 with appropriate error message
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
              success: false,
              error: 'Bad Request',
              message: 'Backup name cannot be empty'
            });
            
            // Verify no database or GCP calls were made
            expect(dbService.getInstanceById).not.toHaveBeenCalled();
            expect(gcpService.createMachineImage).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject whitespace-only strings', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate strings with only whitespace characters (spaces, tabs, newlines)
          fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 })
            .map(chars => chars.join('')),
          async (name) => {
            // Arrange
            jest.clearAllMocks();
            req.body = {
              instanceId: 'inst-1',
              name: name
            };

            // Act
            await backupController.createBackup(req, res, next);

            // Assert - should return 400 with appropriate error message
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
              success: false,
              error: 'Bad Request',
              message: 'Backup name cannot be empty'
            });
            
            // Verify no database or GCP calls were made
            expect(dbService.getInstanceById).not.toHaveBeenCalled();
            expect(gcpService.createMachineImage).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject strings exceeding 100 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid characters but with length > 100
          fc.array(
            fc.constantFrom(
              ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_ '.split('')
            ),
            { minLength: 101, maxLength: 200 }
          ).map(chars => chars.join('')),
          async (name) => {
            // Arrange
            jest.clearAllMocks();
            req.body = {
              instanceId: 'inst-1',
              name: name
            };

            // Act
            await backupController.createBackup(req, res, next);

            // Assert - should return 400 with appropriate error message
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
              success: false,
              error: 'Bad Request',
              message: 'Backup name cannot exceed 100 characters'
            });
            
            // Verify no database or GCP calls were made
            expect(dbService.getInstanceById).not.toHaveBeenCalled();
            expect(gcpService.createMachineImage).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject strings with invalid characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate strings that contain at least one invalid character
          fc.tuple(
            // Valid prefix (can be empty)
            fc.array(
              fc.constantFrom(
                ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_ '.split('')
              ),
              { maxLength: 40 }
            ).map(chars => chars.join('')),
            // Invalid character
            fc.constantFrom(
              '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', 
              '[', ']', '{', '}', '|', '\\', '/', ':', ';', '"', "'", 
              '<', '>', ',', '.', '?', '!', '~', '`'
            ),
            // Valid suffix (can be empty)
            fc.array(
              fc.constantFrom(
                ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_ '.split('')
              ),
              { maxLength: 40 }
            ).map(chars => chars.join(''))
          ).map(([prefix, invalidChar, suffix]) => prefix + invalidChar + suffix),
          async (name) => {
            // Skip if the name is too long (that's tested separately)
            if (name.length > 100) {
              return;
            }

            // Arrange
            jest.clearAllMocks();
            req.body = {
              instanceId: 'inst-1',
              name: name
            };

            // Act
            await backupController.createBackup(req, res, next);

            // Assert - should return 400 with appropriate error message
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
              success: false,
              error: 'Bad Request',
              message: 'Backup name contains invalid characters'
            });
            
            // Verify no database or GCP calls were made
            expect(dbService.getInstanceById).not.toHaveBeenCalled();
            expect(gcpService.createMachineImage).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid backup names', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid backup names: alphanumeric, hyphens, underscores, spaces, 1-100 chars
          fc.array(
            fc.constantFrom(
              ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_ '.split('')
            ),
            { minLength: 1, maxLength: 100 }
          ).map(chars => chars.join(''))
           .filter(s => s.trim().length > 0), // Ensure not just whitespace
          async (name) => {
            // Arrange
            jest.clearAllMocks();
            
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
              name: name.trim(),
              status: 'CREATING'
            };

            dbService.getInstanceById.mockResolvedValue(mockInstance);
            dbService.createBackup.mockResolvedValue(mockBackup);

            req.body = {
              instanceId: 'inst-1',
              name: name
            };

            // Act
            await backupController.createBackup(req, res, next);

            // Assert - should return 201 (created) for valid names
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
              success: true,
              message: 'Backup creation initiated. This may take several minutes to complete.',
              backup: mockBackup
            });
            
            // Verify database was called with trimmed name
            expect(dbService.createBackup).toHaveBeenCalledWith(
              'test@example.com',
              'inst-1',
              expect.objectContaining({
                name: name.trim()
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
