const fc = require('fast-check');
const { 
  createMachineImage, 
  describeMachineImage, 
  deleteMachineImage, 
  listMachineImages,
  ERROR_CODES 
} = require('../services/gcpService');

// Mock child_process to control command execution
jest.mock('child_process');
const { spawn } = require('child_process');

/**
 * Feature: gcp-backup-management, Property 11: GCP error handling consistency
 * Validates: Requirements 9.1, 9.5
 * 
 * For any GCP error response during backup operations, the error code categorization 
 * and structured error format should match the patterns used for instance operations.
 */
describe('GCP Service - Error Handling Consistency Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GCP_PROJECT_ID = 'test-project-id';
    process.env.GCP_ENABLED = 'true';
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.GCP_PROJECT_ID;
    delete process.env.GCP_ENABLED;
    console.log.mockRestore();
    console.error.mockRestore();
    console.warn.mockRestore();
  });

  describe('Property 11: GCP error handling consistency', () => {
    // Define error scenarios that should be consistently handled across all operations
    const errorScenarios = [
      {
        name: 'authentication errors',
        stderrPattern: 'not authenticated',
        expectedErrorCode: ERROR_CODES.AUTH_ERROR,
        expectedMessagePattern: /authentication/i
      },
      {
        name: 'permission errors',
        stderrPattern: 'permission denied',
        expectedErrorCode: ERROR_CODES.PERMISSION_ERROR,
        expectedMessagePattern: /permission/i
      },
      {
        name: 'quota errors',
        stderrPattern: 'quota exceeded',
        expectedErrorCode: ERROR_CODES.QUOTA_ERROR,
        expectedMessagePattern: /quota/i
      },
      {
        name: 'not found errors',
        stderrPattern: 'not found',
        expectedErrorCode: ERROR_CODES.NOT_FOUND,
        expectedMessagePattern: /not found/i
      }
    ];

    // Helper to create mock process that fails with specific error
    const createFailingMockProcess = (stderrMessage) => {
      let closeCallback = null;
      let stderrCallback = null;
      
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              stderrCallback = callback;
            }
          })
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            closeCallback = callback;
          }
        }),
        kill: jest.fn()
      };

      // Simulate command failure
      setTimeout(() => {
        if (stderrCallback) {
          stderrCallback(stderrMessage);
        }
        if (closeCallback) {
          closeCallback(1); // Non-zero exit code
        }
      }, 10);

      return mockProcess;
    };

    it('should handle errors consistently across createMachineImage operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...errorScenarios),
          fc.stringMatching(/^[a-z][a-z0-9-]{0,30}$/), // imageName
          fc.stringMatching(/^[a-z][a-z0-9-]{0,30}$/), // instanceName
          fc.constantFrom('us-central1-a', 'asia-southeast1-a', 'europe-west1-b'), // zone
          async (errorScenario, imageName, instanceName, zone) => {
            jest.clearAllMocks();

            const mockProcess = createFailingMockProcess(
              `ERROR: ${errorScenario.stderrPattern}`
            );
            spawn.mockReturnValue(mockProcess);

            try {
              await createMachineImage(imageName, instanceName, zone);
              throw new Error('Expected createMachineImage to throw an error');
            } catch (error) {
              // Verify structured error format
              expect(error).toHaveProperty('success', false);
              expect(error).toHaveProperty('error');
              expect(error).toHaveProperty('message');
              expect(error).toHaveProperty('details');
              
              // Verify error code matches expected categorization
              expect(error.error).toBe(errorScenario.expectedErrorCode);
              
              // Verify error message matches expected pattern
              expect(error.message).toMatch(errorScenario.expectedMessagePattern);
              
              // Verify details contain timestamp
              expect(error.details).toHaveProperty('timestamp');
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    it('should handle errors consistently across describeMachineImage operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...errorScenarios),
          fc.stringMatching(/^[a-z][a-z0-9-]{0,30}$/), // imageName
          async (errorScenario, imageName) => {
            jest.clearAllMocks();

            const mockProcess = createFailingMockProcess(
              `ERROR: ${errorScenario.stderrPattern}`
            );
            spawn.mockReturnValue(mockProcess);

            try {
              await describeMachineImage(imageName);
              throw new Error('Expected describeMachineImage to throw an error');
            } catch (error) {
              // Verify structured error format
              expect(error).toHaveProperty('success', false);
              expect(error).toHaveProperty('error');
              expect(error).toHaveProperty('message');
              expect(error).toHaveProperty('details');
              
              // Verify error code matches expected categorization
              expect(error.error).toBe(errorScenario.expectedErrorCode);
              
              // Verify error message matches expected pattern
              expect(error.message).toMatch(errorScenario.expectedMessagePattern);
              
              // Verify details contain timestamp
              expect(error.details).toHaveProperty('timestamp');
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    it('should handle errors consistently across deleteMachineImage operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...errorScenarios),
          fc.stringMatching(/^[a-z][a-z0-9-]{0,30}$/), // imageName
          async (errorScenario, imageName) => {
            jest.clearAllMocks();

            const mockProcess = createFailingMockProcess(
              `ERROR: ${errorScenario.stderrPattern}`
            );
            spawn.mockReturnValue(mockProcess);

            try {
              await deleteMachineImage(imageName);
              throw new Error('Expected deleteMachineImage to throw an error');
            } catch (error) {
              // Verify structured error format
              expect(error).toHaveProperty('success', false);
              expect(error).toHaveProperty('error');
              expect(error).toHaveProperty('message');
              expect(error).toHaveProperty('details');
              
              // Verify error code matches expected categorization
              expect(error.error).toBe(errorScenario.expectedErrorCode);
              
              // Verify error message matches expected pattern
              expect(error.message).toMatch(errorScenario.expectedMessagePattern);
              
              // Verify details contain timestamp
              expect(error.details).toHaveProperty('timestamp');
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    it('should handle errors consistently across listMachineImages operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...errorScenarios),
          async (errorScenario) => {
            jest.clearAllMocks();

            const mockProcess = createFailingMockProcess(
              `ERROR: ${errorScenario.stderrPattern}`
            );
            spawn.mockReturnValue(mockProcess);

            try {
              await listMachineImages();
              throw new Error('Expected listMachineImages to throw an error');
            } catch (error) {
              // Verify structured error format
              expect(error).toHaveProperty('success', false);
              expect(error).toHaveProperty('error');
              expect(error).toHaveProperty('message');
              expect(error).toHaveProperty('details');
              
              // Verify error code matches expected categorization
              expect(error.error).toBe(errorScenario.expectedErrorCode);
              
              // Verify error message matches expected pattern
              expect(error.message).toMatch(errorScenario.expectedMessagePattern);
              
              // Verify details contain timestamp
              expect(error.details).toHaveProperty('timestamp');
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    it('should maintain consistent error structure across all backup operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...errorScenarios),
          async (errorScenario) => {
            jest.clearAllMocks();

            // Test all operations with the same error scenario
            const operations = [
              { fn: () => createMachineImage('img-1', 'inst-1', 'us-central1-a'), name: 'createMachineImage' },
              { fn: () => describeMachineImage('img-1'), name: 'describeMachineImage' },
              { fn: () => deleteMachineImage('img-1'), name: 'deleteMachineImage' },
              { fn: () => listMachineImages(), name: 'listMachineImages' }
            ];

            const errors = [];

            for (const operation of operations) {
              jest.clearAllMocks();
              
              const mockProcess = createFailingMockProcess(
                `ERROR: ${errorScenario.stderrPattern}`
              );
              spawn.mockReturnValue(mockProcess);

              try {
                await operation.fn();
                throw new Error(`Expected ${operation.name} to throw an error`);
              } catch (error) {
                errors.push({ operation: operation.name, error });
              }
            }

            // Verify all operations returned the same error code
            const errorCodes = errors.map(e => e.error.error);
            const uniqueErrorCodes = [...new Set(errorCodes)];
            expect(uniqueErrorCodes).toHaveLength(1);
            expect(uniqueErrorCodes[0]).toBe(errorScenario.expectedErrorCode);

            // Verify all operations have consistent error structure
            for (const { operation, error } of errors) {
              expect(error).toHaveProperty('success', false);
              expect(error).toHaveProperty('error');
              expect(error).toHaveProperty('message');
              expect(error).toHaveProperty('details');
              expect(error.details).toHaveProperty('timestamp');
              expect(error.message).toMatch(errorScenario.expectedMessagePattern);
            }
          }
        ),
        { numRuns: 50 } // Reduced runs since this tests multiple operations per iteration
      );
    }, 60000); // Longer timeout for comprehensive test
  });
});
