const fc = require('fast-check');
const { createMachineImage } = require('../services/gcpService');

// Mock child_process to control command execution
jest.mock('child_process');
const { spawn } = require('child_process');

/**
 * Feature: gcp-backup-management, Property 2: Machine image creation command format
 * Validates: Requirements 1.2
 * 
 * For any valid backup creation request with instance name, zone, and image name, 
 * the generated gcloud command should follow the format:
 * gcloud compute machine-images create IMAGE_NAME --source-instance=INSTANCE_NAME 
 * --source-instance-zone=ZONE --project=PROJECT_ID
 */
describe('GCP Service - createMachineImage Property-Based Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set required environment variables
    process.env.GCP_PROJECT_ID = 'test-project-id';
    process.env.GCP_ENABLED = 'true';
    
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.GCP_PROJECT_ID;
    delete process.env.GCP_ENABLED;
    
    // Restore console
    console.log.mockRestore();
    console.error.mockRestore();
    console.warn.mockRestore();
  });

  describe('Property 2: Machine image creation command format', () => {
    it('should generate correct gcloud command format for any valid inputs', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid image names (alphanumeric with hyphens, 1-63 chars)
          fc.stringMatching(/^[a-z][a-z0-9-]{0,62}$/),
          // Generate valid instance names (alphanumeric with hyphens, 1-63 chars)
          fc.stringMatching(/^[a-z][a-z0-9-]{0,62}$/),
          // Generate valid GCP zones
          fc.constantFrom(
            'us-central1-a',
            'us-central1-b',
            'us-east1-b',
            'us-west1-a',
            'europe-west1-b',
            'europe-west1-c',
            'asia-southeast1-a',
            'asia-southeast1-b',
            'asia-east1-a'
          ),
          async (imageName, instanceName, zone) => {
            // Clear mocks before each property test iteration
            jest.clearAllMocks();
            
            let closeCallback = null;
            let dataCallback = null;
            
            const mockImageData = {
              name: imageName,
              sourceInstance: `projects/test-project-id/zones/${zone}/instances/${instanceName}`,
              status: 'READY',
              creationTimestamp: '2024-01-01T00:00:00.000-00:00'
            };

            const mockProcess = {
              stdout: { 
                on: jest.fn((event, callback) => {
                  if (event === 'data') {
                    dataCallback = callback;
                  }
                })
              },
              stderr: { on: jest.fn() },
              on: jest.fn((event, callback) => {
                if (event === 'close') {
                  closeCallback = callback;
                }
              }),
              kill: jest.fn()
            };

            spawn.mockReturnValue(mockProcess);

            const createPromise = createMachineImage(imageName, instanceName, zone);
            
            // Simulate successful command completion
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify(mockImageData));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            await createPromise;

            // Verify spawn was called
            expect(spawn).toHaveBeenCalled();
            
            // Get the most recent call (should be the only call after clearAllMocks)
            const spawnCall = spawn.mock.calls[spawn.mock.calls.length - 1];
            const commandArgs = spawnCall[1];
            
            // Property: Command must follow the exact format
            // gcloud compute machine-images create IMAGE_NAME --source-instance=INSTANCE_NAME --source-instance-zone=ZONE
            
            // 1. Verify command structure contains required components
            expect(commandArgs).toContain('compute');
            expect(commandArgs).toContain('machine-images');
            expect(commandArgs).toContain('create');
            
            // 2. Verify image name is present
            expect(commandArgs).toContain(imageName);
            
            // 3. Verify source instance parameter format
            expect(commandArgs).toContain(`--source-instance=${instanceName}`);
            
            // 4. Verify source instance zone parameter format
            expect(commandArgs).toContain(`--source-instance-zone=${zone}`);
            
            // 5. Verify project ID is included
            expect(commandArgs.some(arg => arg.includes('--project='))).toBe(true);
            
            // 6. Verify format=json is included for parseable output
            expect(commandArgs).toContain('--format=json');
            
            // 7. Verify the order: compute, machine-images, create should come before the image name
            const computeIndex = commandArgs.indexOf('compute');
            const machineImagesIndex = commandArgs.indexOf('machine-images');
            const createIndex = commandArgs.indexOf('create');
            const imageNameIndex = commandArgs.indexOf(imageName);
            
            expect(computeIndex).toBeLessThan(machineImagesIndex);
            expect(machineImagesIndex).toBeLessThan(createIndex);
            expect(createIndex).toBeLessThan(imageNameIndex);
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design document
      );
    }, 30000); // 30 second timeout for property-based test
  });
});
