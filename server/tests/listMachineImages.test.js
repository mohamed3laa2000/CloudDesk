const { listMachineImages, ERROR_CODES } = require('../services/gcpService');

// Mock child_process to control command execution
jest.mock('child_process');
const { spawn } = require('child_process');

describe('GCP Service - listMachineImages', () => {
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

  test('should list machine images and return array', async () => {
    let closeCallback = null;
    let dataCallback = null;
    
    const mockImageList = [
      {
        name: 'backup-image-1',
        status: 'READY',
        creationTimestamp: '2024-01-01T00:00:00.000-00:00',
        sourceInstance: 'projects/test-project-id/zones/asia-southeast1-a/instances/test-instance-1'
      },
      {
        name: 'backup-image-2',
        status: 'READY',
        creationTimestamp: '2024-01-02T00:00:00.000-00:00',
        sourceInstance: 'projects/test-project-id/zones/asia-southeast1-a/instances/test-instance-2'
      }
    ];

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

    const listPromise = listMachineImages();
    
    // Simulate successful command completion
    setTimeout(() => {
      if (dataCallback) {
        dataCallback(JSON.stringify(mockImageList));
      }
      if (closeCallback) {
        closeCallback(0);
      }
    }, 10);

    const result = await listPromise;

    // Verify the result is an array with expected images
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('backup-image-1');
    expect(result[1].name).toBe('backup-image-2');

    // Verify the gcloud command was called with correct parameters
    expect(spawn).toHaveBeenCalled();
    const spawnCall = spawn.mock.calls[0];
    const commandArgs = spawnCall[1];
    
    // Verify command structure: gcloud compute machine-images list
    expect(commandArgs).toContain('compute');
    expect(commandArgs).toContain('machine-images');
    expect(commandArgs).toContain('list');
    expect(commandArgs).toContain('--format=json');
  });

  test('should return empty array when no machine images exist', async () => {
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

    const listPromise = listMachineImages();
    
    // Simulate successful command completion with empty array
    setTimeout(() => {
      if (dataCallback) {
        dataCallback(JSON.stringify([]));
      }
      if (closeCallback) {
        closeCallback(0);
      }
    }, 10);

    const result = await listPromise;

    // Verify the result is an empty array
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test('should handle non-array response by returning empty array', async () => {
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

    const listPromise = listMachineImages();
    
    // Simulate command returning an object instead of array
    setTimeout(() => {
      if (dataCallback) {
        dataCallback(JSON.stringify({ message: 'No images found' }));
      }
      if (closeCallback) {
        closeCallback(0);
      }
    }, 10);

    const result = await listPromise;

    // Verify the result is an empty array when response is not an array
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test('should handle errors from gcloud command', async () => {
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

    const listPromise = listMachineImages();
    
    // Simulate command failure
    setTimeout(() => {
      if (stderrCallback) {
        stderrCallback('ERROR: Permission denied');
      }
      if (closeCallback) {
        closeCallback(1); // Non-zero exit code
      }
    }, 10);

    await expect(listPromise).rejects.toMatchObject({
      success: false,
      error: ERROR_CODES.PERMISSION_ERROR
    });
  });

  test('should handle authentication errors', async () => {
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

    const listPromise = listMachineImages();
    
    // Simulate authentication error
    setTimeout(() => {
      if (stderrCallback) {
        stderrCallback('ERROR: Not authenticated');
      }
      if (closeCallback) {
        closeCallback(1); // Non-zero exit code
      }
    }, 10);

    await expect(listPromise).rejects.toMatchObject({
      success: false,
      error: ERROR_CODES.AUTH_ERROR
    });
  });

  test('should include structured logging context', async () => {
    let closeCallback = null;
    let dataCallback = null;
    
    const mockImageList = [
      {
        name: 'backup-image-1',
        status: 'READY'
      }
    ];

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

    const listPromise = listMachineImages();
    
    // Simulate successful command completion
    setTimeout(() => {
      if (dataCallback) {
        dataCallback(JSON.stringify(mockImageList));
      }
      if (closeCallback) {
        closeCallback(0);
      }
    }, 10);

    const result = await listPromise;

    // Verify structured logging was called
    expect(console.log).toHaveBeenCalled();
    
    // Check that logging includes operation name
    const logCalls = console.log.mock.calls;
    const hasListOperation = logCalls.some(call => 
      call.some(arg => typeof arg === 'string' && arg.includes('listMachineImages'))
    );
    expect(hasListOperation).toBe(true);
  });
});
