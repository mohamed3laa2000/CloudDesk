const { describeMachineImage, ERROR_CODES } = require('../services/gcpService');

// Mock child_process to control command execution
jest.mock('child_process');
const { spawn } = require('child_process');

describe('GCP Service - describeMachineImage', () => {
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

  test('should describe machine image and extract totalStorageBytes', async () => {
    const imageName = 'test-backup-image';

    let closeCallback = null;
    let dataCallback = null;
    
    const mockImageData = {
      name: imageName,
      totalStorageBytes: '10737418240', // 10 GB in bytes
      status: 'READY',
      creationTimestamp: '2024-01-01T00:00:00.000-00:00',
      sourceInstance: 'projects/test-project-id/zones/asia-southeast1-a/instances/test-instance'
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

    const describePromise = describeMachineImage(imageName);
    
    // Simulate successful command completion
    setTimeout(() => {
      if (dataCallback) {
        dataCallback(JSON.stringify(mockImageData));
      }
      if (closeCallback) {
        closeCallback(0);
      }
    }, 10);

    const result = await describePromise;

    // Verify the result contains expected metadata
    expect(result).toBeDefined();
    expect(result.name).toBe(imageName);
    expect(result.totalStorageBytes).toBe(10737418240);
    expect(result.status).toBe('READY');
    expect(result.creationTimestamp).toBeDefined();
    expect(result.sourceInstance).toBeDefined();

    // Verify the gcloud command was called with correct parameters
    expect(spawn).toHaveBeenCalled();
    const spawnCall = spawn.mock.calls[0];
    const commandArgs = spawnCall[1];
    
    // Verify command structure: gcloud compute machine-images describe IMAGE_NAME
    expect(commandArgs).toContain('compute');
    expect(commandArgs).toContain('machine-images');
    expect(commandArgs).toContain('describe');
    expect(commandArgs).toContain(imageName);
    expect(commandArgs).toContain('--format=json');
  });

  test('should handle missing totalStorageBytes field', async () => {
    const imageName = 'test-backup-image';

    let closeCallback = null;
    let dataCallback = null;
    
    const mockImageData = {
      name: imageName,
      status: 'CREATING',
      creationTimestamp: '2024-01-01T00:00:00.000-00:00',
      sourceInstance: 'projects/test-project-id/zones/asia-southeast1-a/instances/test-instance'
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

    const describePromise = describeMachineImage(imageName);
    
    // Simulate successful command completion
    setTimeout(() => {
      if (dataCallback) {
        dataCallback(JSON.stringify(mockImageData));
      }
      if (closeCallback) {
        closeCallback(0);
      }
    }, 10);

    const result = await describePromise;

    // Verify the result handles missing totalStorageBytes
    expect(result).toBeDefined();
    expect(result.name).toBe(imageName);
    expect(result.totalStorageBytes).toBeNull();
    expect(result.status).toBe('CREATING');
  });

  test('should handle malformed totalStorageBytes value', async () => {
    const imageName = 'test-backup-image';

    let closeCallback = null;
    let dataCallback = null;
    
    const mockImageData = {
      name: imageName,
      totalStorageBytes: 'invalid-value',
      status: 'READY',
      creationTimestamp: '2024-01-01T00:00:00.000-00:00',
      sourceInstance: 'projects/test-project-id/zones/asia-southeast1-a/instances/test-instance'
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

    const describePromise = describeMachineImage(imageName);
    
    // Simulate successful command completion
    setTimeout(() => {
      if (dataCallback) {
        dataCallback(JSON.stringify(mockImageData));
      }
      if (closeCallback) {
        closeCallback(0);
      }
    }, 10);

    const result = await describePromise;

    // Verify the result handles malformed value
    expect(result).toBeDefined();
    expect(result.name).toBe(imageName);
    // Should be NaN when parsed, but we still return it
    expect(isNaN(result.totalStorageBytes)).toBe(true);
  });

  test('should handle invalid response structure', async () => {
    const imageName = 'test-backup-image';

    let closeCallback = null;
    let dataCallback = null;

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

    const describePromise = describeMachineImage(imageName);
    
    // Simulate command returning null
    setTimeout(() => {
      if (dataCallback) {
        dataCallback('null');
      }
      if (closeCallback) {
        closeCallback(0);
      }
    }, 10);

    await expect(describePromise).rejects.toMatchObject({
      success: false,
      error: ERROR_CODES.COMMAND_ERROR,
      message: expect.stringContaining('Invalid response')
    });
  });

  test('should handle errors from gcloud command', async () => {
    const imageName = 'test-backup-image';

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

    const describePromise = describeMachineImage(imageName);
    
    // Simulate command failure
    setTimeout(() => {
      if (stderrCallback) {
        stderrCallback('ERROR: Machine image not found');
      }
      if (closeCallback) {
        closeCallback(1); // Non-zero exit code
      }
    }, 10);

    await expect(describePromise).rejects.toMatchObject({
      success: false,
      error: ERROR_CODES.NOT_FOUND
    });
  });

  test('should parse numeric totalStorageBytes correctly', async () => {
    const imageName = 'test-backup-image';

    let closeCallback = null;
    let dataCallback = null;
    
    const mockImageData = {
      name: imageName,
      totalStorageBytes: 5368709120, // Already a number
      status: 'READY',
      creationTimestamp: '2024-01-01T00:00:00.000-00:00',
      sourceInstance: 'projects/test-project-id/zones/asia-southeast1-a/instances/test-instance'
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

    const describePromise = describeMachineImage(imageName);
    
    // Simulate successful command completion
    setTimeout(() => {
      if (dataCallback) {
        dataCallback(JSON.stringify(mockImageData));
      }
      if (closeCallback) {
        closeCallback(0);
      }
    }, 10);

    const result = await describePromise;

    // Verify the result parses numeric value correctly
    expect(result).toBeDefined();
    expect(result.totalStorageBytes).toBe(5368709120);
  });
});
