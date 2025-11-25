const { createMachineImage, _executeGcloudCommand, ERROR_CODES } = require('../services/gcpService');

// Mock child_process to control command execution
jest.mock('child_process');
const { spawn } = require('child_process');

describe('GCP Service - createMachineImage', () => {
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

  test('should create machine image with correct gcloud command format', async () => {
    const imageName = 'test-backup-image';
    const instanceName = 'test-instance';
    const zone = 'asia-southeast1-a';

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

    const result = await createPromise;

    // Verify the result contains expected metadata
    expect(result).toBeDefined();
    expect(result.name).toBe(imageName);
    expect(result.sourceInstance).toBe(mockImageData.sourceInstance);
    expect(result.status).toBe('READY');
    expect(result.creationTimestamp).toBeDefined();

    // Verify the gcloud command was called with correct parameters
    expect(spawn).toHaveBeenCalled();
    const spawnCall = spawn.mock.calls[0];
    const commandArgs = spawnCall[1];
    
    // Verify command structure: gcloud compute machine-images create IMAGE_NAME --source-instance=INSTANCE_NAME --source-instance-zone=ZONE
    expect(commandArgs).toContain('compute');
    expect(commandArgs).toContain('machine-images');
    expect(commandArgs).toContain('create');
    expect(commandArgs).toContain(imageName);
    expect(commandArgs).toContain(`--source-instance=${instanceName}`);
    expect(commandArgs).toContain(`--source-instance-zone=${zone}`);
    expect(commandArgs).toContain('--format=json');
    // Project ID is set in environment, verify it's included
    expect(commandArgs.some(arg => arg.includes('--project='))).toBe(true);
  });

  test('should handle array response from gcloud command', async () => {
    const imageName = 'test-backup-image';
    const instanceName = 'test-instance';
    const zone = 'asia-southeast1-a';

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
    
    // Simulate successful command completion with array response
    setTimeout(() => {
      if (dataCallback) {
        dataCallback(JSON.stringify([mockImageData]));
      }
      if (closeCallback) {
        closeCallback(0);
      }
    }, 10);

    const result = await createPromise;

    // Verify the result is extracted from array
    expect(result).toBeDefined();
    expect(result.name).toBe(imageName);
  });

  test('should handle errors from gcloud command', async () => {
    const imageName = 'test-backup-image';
    const instanceName = 'test-instance';
    const zone = 'asia-southeast1-a';

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

    spawn.mockReturnValue(mockProcess);

    const createPromise = createMachineImage(imageName, instanceName, zone);
    
    // Simulate command failure
    setTimeout(() => {
      if (stderrCallback) {
        stderrCallback('ERROR: Instance not found');
      }
      if (closeCallback) {
        closeCallback(1); // Non-zero exit code
      }
    }, 10);

    await expect(createPromise).rejects.toMatchObject({
      success: false,
      error: expect.any(String)
    });
  });

  test('should handle timeout correctly', async () => {
    const imageName = 'test-backup-image';
    const instanceName = 'test-instance';
    const zone = 'asia-southeast1-a';

    const mockProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn()
    };

    spawn.mockReturnValue(mockProcess);

    // Start the command (it will timeout after default timeout)
    const createPromise = createMachineImage(imageName, instanceName, zone);

    // Wait for timeout to trigger
    await expect(createPromise).rejects.toMatchObject({
      error: ERROR_CODES.TIMEOUT
    });

    // Verify process was killed
    expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
  }, 310000); // Set test timeout to 310 seconds (longer than default GCP timeout of 300s)
});
