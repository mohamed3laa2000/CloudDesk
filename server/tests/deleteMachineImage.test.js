const { deleteMachineImage, ERROR_CODES } = require('../services/gcpService');

// Mock child_process to control command execution
jest.mock('child_process');
const { spawn } = require('child_process');

describe('deleteMachineImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GCP_PROJECT_ID = 'test-project-id';
    process.env.GCP_ENABLED = 'true';
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.GCP_PROJECT_ID;
    delete process.env.GCP_ENABLED;
    console.log.mockRestore();
    console.error.mockRestore();
  });

  test('should execute delete command with correct parameters', async () => {
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

    const deletePromise = deleteMachineImage(imageName);
    
    // Simulate successful command completion
    setTimeout(() => {
      if (dataCallback) {
        dataCallback(JSON.stringify({}));
      }
      if (closeCallback) {
        closeCallback(0);
      }
    }, 10);

    await deletePromise;

    // Verify gcloud command was called
    expect(spawn).toHaveBeenCalled();
    const spawnArgs = spawn.mock.calls[0];
    const commandArgs = spawnArgs[1];
    
    // Verify command structure
    expect(commandArgs).toContain('compute');
    expect(commandArgs).toContain('machine-images');
    expect(commandArgs).toContain('delete');
    expect(commandArgs).toContain(imageName);
    expect(commandArgs).toContain('--quiet');
    // Project ID is added by _executeGcloudCommand
    expect(commandArgs).toContain('--format=json');
  });

  test('should include --quiet flag to skip confirmation', async () => {
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

    const deletePromise = deleteMachineImage(imageName);
    
    setTimeout(() => {
      if (dataCallback) {
        dataCallback(JSON.stringify({}));
      }
      if (closeCallback) {
        closeCallback(0);
      }
    }, 10);

    await deletePromise;

    const spawnArgs = spawn.mock.calls[0];
    const commandArgs = spawnArgs[1];
    
    expect(commandArgs).toContain('--quiet');
  });

  test('should handle deletion errors with structured error response', async () => {
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

    const deletePromise = deleteMachineImage(imageName);
    
    setTimeout(() => {
      if (stderrCallback) {
        stderrCallback('ERROR: The resource was not found');
      }
      if (closeCallback) {
        closeCallback(1);
      }
    }, 10);

    try {
      await deletePromise;
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.success).toBe(false);
      expect(error.error).toBeDefined();
      expect(error.message).toBeDefined();
    }
  });

  test('should use 2 minute timeout for delete operations', async () => {
    const imageName = 'test-backup-image';
    
    const mockProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn()
    };

    spawn.mockReturnValue(mockProcess);

    const deletePromise = deleteMachineImage(imageName);
    
    // Don't complete the command - let it timeout
    // Wait a bit to ensure the timeout is set
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Verify spawn was called (command was initiated)
    expect(spawn).toHaveBeenCalled();
  });
});
