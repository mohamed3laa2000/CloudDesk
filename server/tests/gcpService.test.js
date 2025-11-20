const fc = require('fast-check');
const { 
  createInstance,
  startInstance,
  stopInstance,
  deleteInstance,
  getInstanceStatus,
  resetWindowsPassword,
  _executeGcloudCommand, 
  _mapToMachineType,
  _mapToGcpZone,
  _mapToGcpImage,
  _waitForStatus,
  ERROR_CODES 
} = require('../services/gcpService');

// Mock child_process to control command execution
jest.mock('child_process');
const { spawn } = require('child_process');

describe('GCP Service - Property-Based Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set required environment variables
    process.env.GCP_PROJECT_ID = 'test-project-id';
    process.env.GCP_ENABLED = 'true';
    
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.GCP_PROJECT_ID;
    delete process.env.GCP_ENABLED;
    
    // Restore console
    console.log.mockRestore();
    console.error.mockRestore();
  });

  /**
   * Property 1: Command execution timeout enforcement
   * Feature: gcp-compute-integration, Property 1: Command execution timeout enforcement
   * Validates: Requirements 4.2
   * 
   * For any gcloud command with a specified timeout, if the command execution
   * exceeds that timeout, the system SHALL terminate the process and return
   * a timeout error.
   */
  describe('Property 1: Command execution timeout enforcement', () => {
    test('should enforce timeout for any command that exceeds the specified duration', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random command arguments
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          // Generate random timeout values (small for testing: 50-200ms)
          fc.integer({ min: 50, max: 200 }),
          async (commandArgs, timeoutMs) => {
            // Mock a process that never completes (simulates hanging command)
            const mockProcess = {
              stdout: { on: jest.fn() },
              stderr: { on: jest.fn() },
              on: jest.fn(),
              kill: jest.fn()
            };

            spawn.mockReturnValue(mockProcess);

            // Execute command with timeout
            const startTime = Date.now();
            
            try {
              await _executeGcloudCommand(commandArgs, { timeout: timeoutMs });
              
              // If we reach here, the command didn't timeout (test should fail)
              throw new Error('Command should have timed out but did not');
            } catch (error) {
              const duration = Date.now() - startTime;
              
              // Verify timeout error was returned
              expect(error.code).toBe(ERROR_CODES.TIMEOUT);
              expect(error.message).toContain('timed out');
              
              // Verify the timeout was enforced (with some tolerance for execution overhead)
              // Duration should be close to timeout (within 100ms tolerance)
              expect(duration).toBeGreaterThanOrEqual(timeoutMs);
              expect(duration).toBeLessThan(timeoutMs + 100);
              
              // Verify process was killed
              expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 60000); // 60 second timeout for this test (100 iterations with timeouts)

    test('should not timeout for commands that complete within the timeout period', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random command arguments
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          // Generate random timeout values (larger: 200-500ms)
          fc.integer({ min: 200, max: 500 }),
          // Generate random completion time (smaller than timeout: 10-50ms to avoid race conditions)
          fc.integer({ min: 10, max: 50 }),
          async (commandArgs, timeoutMs, completionTimeMs) => {
            let closeCallback = null;
            let dataCallback = null;
            
            // Mock a process that completes successfully within timeout
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

            // Start the command execution
            const commandPromise = _executeGcloudCommand(commandArgs, { timeout: timeoutMs });
            const startTime = Date.now();
            
            // Simulate command completion after a delay
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify({ success: true }));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, completionTimeMs);
            
            try {
              const result = await commandPromise;
              const duration = Date.now() - startTime;
              
              // Verify command completed successfully
              expect(result).toEqual({ success: true });
              
              // Verify it completed within timeout
              expect(duration).toBeLessThan(timeoutMs);
              
              // Verify process was NOT killed
              expect(mockProcess.kill).not.toHaveBeenCalled();
            } catch (error) {
              // Command should not have timed out
              if (error.code === ERROR_CODES.TIMEOUT) {
                throw new Error(`Command timed out unexpectedly: ${error.message}`);
              }
              throw error;
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });
  });

  /**
   * Property 2: Region Restriction Enforcement
   * Feature: gcp-compute-integration, Property 2: Region Restriction Enforcement
   * Validates: Requirements 2.2, 2.3, 2.5
   * 
   * For any instance creation request, the system SHALL only accept Singapore or Iowa
   * as valid regions, and SHALL map these to asia-southeast1 or us-central1 GCP regions
   * respectively.
   */
  describe('Property 2: Region Restriction Enforcement', () => {
    const validRegions = [
      { region: 'SINGAPORE', expectedZone: 'asia-southeast1-a', expectedRegion: 'asia-southeast1' },
      { region: 'IOWA', expectedZone: 'us-central1-a', expectedRegion: 'us-central1' },
    ];

    test('should only accept SINGAPORE and IOWA as valid regions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...validRegions),
          async (config) => {
            // Should successfully map valid regions
            const zone = _mapToGcpZone(config.region);
            
            // Verify zone was returned
            expect(zone).toBeDefined();
            expect(typeof zone).toBe('string');
            expect(zone).toBe(config.expectedZone);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should reject all other region values', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random strings that are NOT valid regions
          fc.string({ minLength: 1, maxLength: 20 }),
          async (region) => {
            // Skip if this happens to be a valid region
            if (region === 'SINGAPORE' || region === 'IOWA') {
              return;
            }
            
            // Should throw error for invalid regions
            expect(() => {
              _mapToGcpZone(region);
            }).toThrow(/Unsupported region/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should map SINGAPORE to asia-southeast1-a zone', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant('SINGAPORE'),
          async (region) => {
            const zone = _mapToGcpZone(region);
            
            expect(zone).toBe('asia-southeast1-a');
            expect(zone).toContain('asia-southeast1');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should map IOWA to us-central1-a zone', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant('IOWA'),
          async (region) => {
            const zone = _mapToGcpZone(region);
            
            expect(zone).toBe('us-central1-a');
            expect(zone).toContain('us-central1');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should consistently return the same zone for the same region', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...validRegions),
          async (config) => {
            // Call multiple times with same input
            const result1 = _mapToGcpZone(config.region);
            const result2 = _mapToGcpZone(config.region);
            const result3 = _mapToGcpZone(config.region);
            
            // All results should be identical
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Machine Type Mapping Consistency
   * Feature: gcp-compute-integration, Property 7: Machine Type Mapping Consistency
   * Validates: Requirements 1.2, 6.1
   * 
   * For any combination of CPU cores and RAM specified in the CloudDesk configuration,
   * the system SHALL map to a valid GCP machine type that provides at least the
   * requested resources.
   */
  describe('Property 7: Machine Type Mapping Consistency', () => {
    // Define valid CPU/RAM combinations that should map to machine types
    const validCombinations = [
      { cpu: 1, ram: 2, expectedType: 'e2-small' },
      { cpu: 1, ram: 4, expectedType: 'e2-medium' },
      { cpu: 2, ram: 4, expectedType: 'e2-standard-2' },
      { cpu: 2, ram: 8, expectedType: 'e2-standard-2' },
      { cpu: 4, ram: 8, expectedType: 'n1-standard-4' },
      { cpu: 4, ram: 16, expectedType: 'n1-standard-4' },
      { cpu: 8, ram: 16, expectedType: 'n1-standard-8' },
      { cpu: 8, ram: 32, expectedType: 'n1-standard-8' },
      { cpu: 16, ram: 32, expectedType: 'n1-standard-16' },
      { cpu: 16, ram: 64, expectedType: 'n1-standard-16' },
    ];

    test('should map all valid CPU/RAM combinations to appropriate GCP machine types', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate from valid combinations
          fc.constantFrom(...validCombinations),
          async (config) => {
            // Map to machine type
            const machineType = _mapToMachineType(config.cpu, config.ram);
            
            // Verify a machine type was returned
            expect(machineType).toBeDefined();
            expect(typeof machineType).toBe('string');
            expect(machineType.length).toBeGreaterThan(0);
            
            // Verify it matches the expected type
            expect(machineType).toBe(config.expectedType);
            
            // Verify the machine type follows GCP naming convention (e.g., e2-small, n1-standard-4)
            expect(machineType).toMatch(/^[a-z0-9]+-[a-z0-9]+(-[0-9]+)?$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should throw error for invalid CPU/RAM combinations', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid combinations (not in our mapping)
          fc.integer({ min: 1, max: 32 }),
          fc.integer({ min: 1, max: 128 }),
          async (cpu, ram) => {
            // Skip if this is a valid combination
            const isValid = validCombinations.some(
              combo => combo.cpu === cpu && combo.ram === ram
            );
            
            if (isValid) {
              return; // Skip this iteration
            }
            
            // Should throw error for invalid combinations
            expect(() => {
              _mapToMachineType(cpu, ram);
            }).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should consistently return the same machine type for the same input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...validCombinations),
          async (config) => {
            // Call multiple times with same input
            const result1 = _mapToMachineType(config.cpu, config.ram);
            const result2 = _mapToMachineType(config.cpu, config.ram);
            const result3 = _mapToMachineType(config.cpu, config.ram);
            
            // All results should be identical
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 1: GCP VM Creation Consistency
   * Feature: gcp-compute-integration, Property 1: GCP VM Creation Consistency
   * Validates: Requirements 1.1, 1.2, 1.3
   * 
   * For any valid instance configuration submitted through the CloudDesk UI,
   * when the system provisions a GCP VM, the database record SHALL contain
   * matching GCP metadata (instance ID, zone, machine type) that corresponds
   * to the actual VM created in GCP.
   */
  describe('Property 1: GCP VM Creation Consistency', () => {
    // Define valid configurations for testing
    const validConfigs = [
      { cpuCores: 1, ramGb: 2, region: 'SINGAPORE', imageId: 'windows-general' },
      { cpuCores: 1, ramGb: 4, region: 'IOWA', imageId: 'windows-server' },
      { cpuCores: 2, ramGb: 4, region: 'SINGAPORE', imageId: 'dev-engineering' },
      { cpuCores: 2, ramGb: 8, region: 'IOWA', imageId: 'general-purpose' },
      { cpuCores: 4, ramGb: 8, region: 'SINGAPORE', imageId: 'windows-general' },
      { cpuCores: 4, ramGb: 16, region: 'IOWA', imageId: 'windows-server' },
      { cpuCores: 8, ramGb: 16, region: 'SINGAPORE', imageId: 'dev-engineering' },
      { cpuCores: 8, ramGb: 32, region: 'IOWA', imageId: 'general-purpose' },
    ];

    test('should return GCP metadata that matches the requested configuration', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid instance configurations
          fc.constantFrom(...validConfigs),
          fc.string({ minLength: 5, maxLength: 20 }), // instance name
          fc.integer({ min: 50, max: 500 }), // storage GB
          fc.constantFrom('none', 'nvidia-t4', 'nvidia-v100'), // GPU options
          async (baseConfig, name, storageGb, gpu) => {
            // Build full configuration
            const config = {
              name,
              cpuCores: baseConfig.cpuCores,
              ramGb: baseConfig.ramGb,
              storageGb,
              gpu,
              region: baseConfig.region,
              imageId: baseConfig.imageId
            };

            // Clear mocks for this iteration
            jest.clearAllMocks();

            // Calculate expected values
            const expectedMachineType = _mapToMachineType(config.cpuCores, config.ramGb);
            const expectedZone = _mapToGcpZone(config.region);
            const expectedInstanceName = config.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

            // Mock gcloud command to return consistent instance data
            let closeCallback = null;
            let dataCallback = null;
            
            const mockInstanceData = {
              name: expectedInstanceName,
              zone: `projects/test-project-id/zones/${expectedZone}`,
              machineType: `projects/test-project-id/zones/${expectedZone}/machineTypes/${expectedMachineType}`,
              networkInterfaces: [
                {
                  accessConfigs: [
                    { natIP: '34.87.123.45' }
                  ]
                }
              ]
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

            // Start instance creation
            const createPromise = createInstance(config);
            
            // Simulate successful command completion
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify([mockInstanceData]));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            // Wait for creation to complete
            const metadata = await createPromise;

            // Verify metadata matches the configuration
            expect(metadata).toBeDefined();
            expect(metadata.gcpInstanceId).toBe(expectedInstanceName);
            expect(metadata.gcpZone).toBe(expectedZone);
            expect(metadata.gcpMachineType).toBe(expectedMachineType);
            expect(metadata.gcpProjectId).toBe('test-project-id');
            
            // Verify external IP was extracted
            expect(metadata.gcpExternalIp).toBe('34.87.123.45');

            // Verify the gcloud command was called with correct parameters
            expect(spawn).toHaveBeenCalled();
            // Find the createInstance call (should contain 'compute', 'instances', 'create')
            const createCall = spawn.mock.calls.find(call => {
              const args = call[1];
              return args.includes('compute') && args.includes('instances') && args.includes('create');
            });
            expect(createCall).toBeDefined();
            const commandArgs = createCall[1];
            
            // Verify command includes correct parameters
            expect(commandArgs).toContain('compute');
            expect(commandArgs).toContain('instances');
            expect(commandArgs).toContain('create');
            // The instance name should be in the command args (it's the 4th argument after compute, instances, create)
            const instanceNameInCommand = commandArgs[3];
            expect(instanceNameInCommand).toBe(expectedInstanceName);
            expect(commandArgs.some(arg => arg.includes(expectedZone))).toBe(true);
            expect(commandArgs.some(arg => arg.includes(expectedMachineType))).toBe(true);
            expect(commandArgs.some(arg => arg.includes(`${storageGb}GB`))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle instance creation without external IP', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...validConfigs),
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.integer({ min: 50, max: 500 }),
          async (baseConfig, name, storageGb) => {
            const config = {
              name,
              cpuCores: baseConfig.cpuCores,
              ramGb: baseConfig.ramGb,
              storageGb,
              gpu: 'none',
              region: baseConfig.region,
              imageId: baseConfig.imageId
            };

            const expectedInstanceName = config.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            const expectedZone = _mapToGcpZone(config.region);

            // Mock instance data without external IP
            const mockInstanceData = {
              name: expectedInstanceName,
              zone: `projects/test-project-id/zones/${expectedZone}`,
              machineType: `projects/test-project-id/zones/${expectedZone}/machineTypes/n1-standard-4`,
              networkInterfaces: [] // No network interfaces
            };

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

            const createPromise = createInstance(config);
            
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify([mockInstanceData]));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            const metadata = await createPromise;

            // Verify metadata is returned even without external IP
            expect(metadata).toBeDefined();
            expect(metadata.gcpInstanceId).toBe(expectedInstanceName);
            expect(metadata.gcpExternalIp).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should include GPU configuration in command when GPU is specified', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...validConfigs),
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.constantFrom('nvidia-t4', 'nvidia-v100', 'nvidia-p4'),
          async (baseConfig, name, gpu) => {
            const config = {
              name,
              cpuCores: baseConfig.cpuCores,
              ramGb: baseConfig.ramGb,
              storageGb: 100,
              gpu,
              region: baseConfig.region,
              imageId: baseConfig.imageId
            };

            const expectedInstanceName = config.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            const expectedZone = _mapToGcpZone(config.region);

            const mockInstanceData = {
              name: expectedInstanceName,
              zone: `projects/test-project-id/zones/${expectedZone}`,
              machineType: `projects/test-project-id/zones/${expectedZone}/machineTypes/n1-standard-4`,
              networkInterfaces: []
            };

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

            const createPromise = createInstance(config);
            
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify([mockInstanceData]));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            await createPromise;

            // Verify GPU was included in command
            const spawnArgs = spawn.mock.calls[0];
            const commandArgs = spawnArgs[1];
            
            // Should include accelerator flag
            const hasAccelerator = commandArgs.some(arg => arg.includes('--accelerator'));
            expect(hasAccelerator).toBe(true);
            
            // Should include maintenance policy for GPU instances
            const hasMaintenancePolicy = commandArgs.some(arg => arg.includes('--maintenance-policy=TERMINATE'));
            expect(hasMaintenancePolicy).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should properly sanitize instance names', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...validConfigs),
          // Generate names with special characters that need sanitization
          fc.string({ minLength: 5, maxLength: 20 }),
          async (baseConfig, rawName) => {
            const config = {
              name: rawName,
              cpuCores: baseConfig.cpuCores,
              ramGb: baseConfig.ramGb,
              storageGb: 100,
              gpu: 'none',
              region: baseConfig.region,
              imageId: baseConfig.imageId
            };

            // Expected sanitized name (lowercase, only alphanumeric and hyphens)
            const expectedInstanceName = rawName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

            const mockInstanceData = {
              name: expectedInstanceName,
              zone: 'projects/test-project-id/zones/asia-southeast1-a',
              machineType: 'projects/test-project-id/zones/asia-southeast1-a/machineTypes/n1-standard-4',
              networkInterfaces: []
            };

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

            const createPromise = createInstance(config);
            
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify([mockInstanceData]));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            const metadata = await createPromise;

            // Verify the instance name was properly sanitized
            expect(metadata.gcpInstanceId).toBe(expectedInstanceName);
            expect(metadata.gcpInstanceId).toMatch(/^[a-z0-9-]+$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

  /**
   * Property 3: Status Transition Validity
   * Feature: gcp-compute-integration, Property 3: Status Transition Validity
   * Validates: Requirements 5.1, 5.2, 5.4
   * 
   * For any GCP-managed instance, when a status change operation completes successfully,
   * the status in the database SHALL match the actual VM status in GCP as verified by
   * a subsequent status query.
   */
  describe('Property 3: Status Transition Validity', () => {
    const validZones = ['asia-southeast1-a', 'us-central1-a'];
    
    test('should verify RUNNING status after successful start operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random instance names
          fc.string({ minLength: 5, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
          // Generate random zones
          fc.constantFrom(...validZones),
          async (instanceName, zone) => {
            jest.clearAllMocks();

            let commandCount = 0;
            
            // Mock gcloud commands
            spawn.mockImplementation((command, args) => {
              commandCount++;
              
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

              // Simulate command completion
              setTimeout(() => {
                if (args.includes('start')) {
                  // Start command returns empty result
                  if (dataCallback) {
                    dataCallback(JSON.stringify({}));
                  }
                  if (closeCallback) {
                    closeCallback(0);
                  }
                } else if (args.includes('describe')) {
                  // Status query returns RUNNING status
                  if (dataCallback) {
                    dataCallback(JSON.stringify({ status: 'RUNNING' }));
                  }
                  if (closeCallback) {
                    closeCallback(0);
                  }
                }
              }, 10);

              return mockProcess;
            });

            // Execute start operation
            await startInstance(instanceName, zone);

            // Verify that status was queried (at least once for verification)
            expect(commandCount).toBeGreaterThanOrEqual(2); // start + at least one describe
            
            // Verify the describe command was called
            const describeCalls = spawn.mock.calls.filter(call => 
              call[1].includes('describe')
            );
            expect(describeCalls.length).toBeGreaterThan(0);
            
            // Verify the start command was called with correct parameters
            const startCalls = spawn.mock.calls.filter(call => 
              call[1].includes('start')
            );
            expect(startCalls.length).toBe(1);
            expect(startCalls[0][1]).toContain(instanceName);
            expect(startCalls[0][1].some(arg => arg.includes(zone))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should verify TERMINATED status after successful stop operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
          fc.constantFrom(...validZones),
          async (instanceName, zone) => {
            jest.clearAllMocks();

            let commandCount = 0;
            
            spawn.mockImplementation((command, args) => {
              commandCount++;
              
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

              setTimeout(() => {
                if (args.includes('stop')) {
                  // Stop command returns empty result
                  if (dataCallback) {
                    dataCallback(JSON.stringify({}));
                  }
                  if (closeCallback) {
                    closeCallback(0);
                  }
                } else if (args.includes('describe')) {
                  // Status query returns TERMINATED status
                  if (dataCallback) {
                    dataCallback(JSON.stringify({ status: 'TERMINATED' }));
                  }
                  if (closeCallback) {
                    closeCallback(0);
                  }
                }
              }, 10);

              return mockProcess;
            });

            // Execute stop operation
            await stopInstance(instanceName, zone);

            // Verify that status was queried
            expect(commandCount).toBeGreaterThanOrEqual(2); // stop + at least one describe
            
            // Verify the describe command was called
            const describeCalls = spawn.mock.calls.filter(call => 
              call[1].includes('describe')
            );
            expect(describeCalls.length).toBeGreaterThan(0);
            
            // Verify the stop command was called with correct parameters
            const stopCalls = spawn.mock.calls.filter(call => 
              call[1].includes('stop')
            );
            expect(stopCalls.length).toBe(1);
            expect(stopCalls[0][1]).toContain(instanceName);
            expect(stopCalls[0][1].some(arg => arg.includes(zone))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should retry status queries when status does not match expected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => s.length > 0).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'test-instance'),
          fc.constantFrom(...validZones),
          fc.constantFrom('RUNNING', 'TERMINATED'),
          async (instanceName, zone, expectedStatus) => {
            // Skip if instance name is empty after sanitization
            if (!instanceName || instanceName.length === 0) {
              return;
            }
            
            jest.clearAllMocks();

            let statusQueryCount = 0;
            
            spawn.mockImplementation((command, args) => {
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

              setTimeout(() => {
                if (args.includes('describe')) {
                  statusQueryCount++;
                  
                  // Return wrong status first 2 times, then correct status
                  const wrongStatus = expectedStatus === 'RUNNING' ? 'PROVISIONING' : 'STOPPING';
                  const status = statusQueryCount < 3 ? wrongStatus : expectedStatus;
                  
                  if (dataCallback) {
                    dataCallback(JSON.stringify({ status }));
                  }
                  if (closeCallback) {
                    closeCallback(0);
                  }
                }
              }, 10);

              return mockProcess;
            });

            // Execute _waitForStatus directly to test retry logic
            await _waitForStatus(instanceName, zone, expectedStatus, 3, 100);

            // Verify that status was queried multiple times (retries occurred)
            expect(statusQueryCount).toBeGreaterThanOrEqual(3);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should throw error when status does not reach expected state after max retries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
          fc.constantFrom(...validZones),
          fc.constantFrom('RUNNING', 'TERMINATED'),
          async (instanceName, zone, expectedStatus) => {
            jest.clearAllMocks();

            const wrongStatus = expectedStatus === 'RUNNING' ? 'PROVISIONING' : 'STOPPING';
            
            spawn.mockImplementation((command, args) => {
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

              setTimeout(() => {
                if (args.includes('describe')) {
                  // Always return wrong status
                  if (dataCallback) {
                    dataCallback(JSON.stringify({ status: wrongStatus }));
                  }
                  if (closeCallback) {
                    closeCallback(0);
                  }
                }
              }, 10);

              return mockProcess;
            });

            // Execute _waitForStatus and expect it to throw
            try {
              await _waitForStatus(instanceName, zone, expectedStatus, 3, 50);
              
              // Should not reach here
              throw new Error('Expected _waitForStatus to throw but it did not');
            } catch (error) {
              // Verify error is about status not matching
              expect(error.code).toBe(ERROR_CODES.COMMAND_ERROR);
              expect(error.message).toContain('did not reach expected status');
              expect(error.details.expectedStatus).toBe(expectedStatus);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return correct status from getInstanceStatus', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
          fc.constantFrom(...validZones),
          fc.constantFrom('RUNNING', 'TERMINATED', 'PROVISIONING', 'STOPPING', 'SUSPENDED'),
          async (instanceName, zone, expectedStatus) => {
            jest.clearAllMocks();

            spawn.mockImplementation((command, args) => {
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

              setTimeout(() => {
                if (args.includes('describe')) {
                  if (dataCallback) {
                    dataCallback(JSON.stringify({ status: expectedStatus }));
                  }
                  if (closeCallback) {
                    closeCallback(0);
                  }
                }
              }, 10);

              return mockProcess;
            });

            // Get instance status
            const status = await getInstanceStatus(instanceName, zone);

            // Verify status matches expected
            expect(status).toBe(expectedStatus);
            
            // Verify describe command was called with correct parameters
            expect(spawn).toHaveBeenCalled();
            const describeCall = spawn.mock.calls.find(call => 
              call[1].includes('describe')
            );
            expect(describeCall).toBeDefined();
            expect(describeCall[1]).toContain(instanceName);
            expect(describeCall[1].some(arg => arg.includes(zone))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Deletion Cleanup
   * Feature: gcp-compute-integration, Property 10: Deletion Cleanup
   * Validates: Requirements 5.3
   * 
   * For any GCP-managed instance deletion, the system SHALL both delete the VM in GCP
   * and update the database status to DELETED, ensuring no orphaned resources remain.
   */
  describe('Property 10: Deletion Cleanup', () => {
    const validZones = ['asia-southeast1-a', 'us-central1-a'];
    
    test('should successfully execute delete command for any valid instance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
          fc.constantFrom(...validZones),
          async (instanceName, zone) => {
            jest.clearAllMocks();

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

            // Start delete operation
            const deletePromise = deleteInstance(instanceName, zone);
            
            // Simulate successful deletion
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify({}));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            // Wait for deletion to complete
            await deletePromise;

            // Verify delete command was called
            expect(spawn).toHaveBeenCalled();
            const deleteCall = spawn.mock.calls.find(call => 
              call[1].includes('delete')
            );
            expect(deleteCall).toBeDefined();
            
            // Verify correct parameters
            const commandArgs = deleteCall[1];
            expect(commandArgs).toContain('compute');
            expect(commandArgs).toContain('instances');
            expect(commandArgs).toContain('delete');
            expect(commandArgs).toContain(instanceName);
            expect(commandArgs.some(arg => arg.includes(zone))).toBe(true);
            expect(commandArgs).toContain('--quiet'); // Should skip confirmation
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should include --quiet flag to skip confirmation prompt', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
          fc.constantFrom(...validZones),
          async (instanceName, zone) => {
            jest.clearAllMocks();

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

            const deletePromise = deleteInstance(instanceName, zone);
            
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify({}));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            await deletePromise;

            // Verify --quiet flag is present
            const deleteCall = spawn.mock.calls.find(call => 
              call[1].includes('delete')
            );
            expect(deleteCall[1]).toContain('--quiet');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should throw structured error when deletion fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => s.length > 0).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'test-instance'),
          fc.constantFrom(...validZones),
          fc.constantFrom(
            'not found',
            'permission denied',
            'quota exceeded',
            'invalid request'
          ),
          async (instanceName, zone, errorType) => {
            // Skip if instance name is empty after sanitization
            if (!instanceName || instanceName.length === 0) {
              return;
            }
            
            jest.clearAllMocks();

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

            const deletePromise = deleteInstance(instanceName, zone);
            
            // Simulate error
            setTimeout(() => {
              if (stderrCallback) {
                stderrCallback(`ERROR: ${errorType}`);
              }
              if (closeCallback) {
                closeCallback(1); // Non-zero exit code
              }
            }, 10);

            // Expect deletion to throw error
            try {
              await deletePromise;
              throw new Error('Expected deleteInstance to throw but it did not');
            } catch (error) {
              // Verify error is structured
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();
              expect(error.details).toBeDefined();
              expect(error.details.operation).toBe('deleteInstance');
              expect(error.details.instanceName).toBe(instanceName);
              expect(error.details.zone).toBe(zone);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle deletion of non-existent instances gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => s.length > 0).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'test-instance'),
          fc.constantFrom(...validZones),
          async (instanceName, zone) => {
            // Skip if instance name is empty after sanitization
            if (!instanceName || instanceName.length === 0) {
              return;
            }
            
            jest.clearAllMocks();

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

            const deletePromise = deleteInstance(instanceName, zone);
            
            // Simulate "not found" error
            setTimeout(() => {
              if (stderrCallback) {
                stderrCallback('ERROR: The resource does not exist');
              }
              if (closeCallback) {
                closeCallback(1);
              }
            }, 10);

            // Expect error with NOT_FOUND code
            try {
              await deletePromise;
              throw new Error('Expected deleteInstance to throw but it did not');
            } catch (error) {
              expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
              expect(error.message.toLowerCase()).toContain('not found');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should use appropriate timeout for delete operations', async () => {
      // Test with a shorter timeout for testing purposes
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => s.length > 0 && s !== 'toString' && s !== 'valueOf').map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'test-instance'),
          fc.constantFrom(...validZones),
          async (instanceName, zone) => {
            // Skip if instance name is empty or a reserved word
            if (!instanceName || instanceName.length === 0 || instanceName === 'tostring' || instanceName === 'valueof') {
              return;
            }
            
            jest.clearAllMocks();

            // Mock a process that never completes (to test timeout)
            const mockProcess = {
              stdout: { on: jest.fn() },
              stderr: { on: jest.fn() },
              on: jest.fn(),
              kill: jest.fn()
            };

            spawn.mockReturnValue(mockProcess);

            const startTime = Date.now();
            
            try {
              // Use a shorter timeout for testing (100ms instead of 2 minutes)
              // We're testing that timeout enforcement works, not the actual timeout value
              await _executeGcloudCommand(['compute', 'instances', 'delete', instanceName, `--zone=${zone}`, '--quiet'], { timeout: 100 });
              throw new Error('Expected command to timeout but it did not');
            } catch (error) {
              const duration = Date.now() - startTime;
              
              // Verify timeout occurred
              expect(error.code).toBe(ERROR_CODES.TIMEOUT);
              
              // Verify timeout was enforced (with tolerance for execution overhead)
              expect(duration).toBeGreaterThanOrEqual(100);
              expect(duration).toBeLessThan(200);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 4: Windows Password Reset Preconditions
   * Feature: gcp-compute-integration, Property 4: Windows Password Reset Preconditions
   * Validates: Requirements 3.1, 3.2
   * 
   * For any Windows password reset request, the system SHALL only execute the reset
   * if the instance is both Windows-based (determined by image_id) and in RUNNING status.
   * 
   * Note: This property test validates the resetWindowsPassword function itself.
   * The validation logic for Windows-based and RUNNING status will be implemented
   * in the controller layer (instanceController.js).
   */
  describe('Property 4: Windows Password Reset Preconditions', () => {
    const validZones = ['asia-southeast1-a', 'us-central1-a'];
    
    test('should successfully reset password for any valid instance and username', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random instance names
          fc.string({ minLength: 5, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
          // Generate random zones
          fc.constantFrom(...validZones),
          // Generate random Windows usernames
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          async (instanceName, zone, username) => {
            jest.clearAllMocks();

            // Mock successful password reset
            let closeCallback = null;
            let dataCallback = null;
            
            const mockPasswordData = {
              username: username,
              password: 'GeneratedPassword123!',
              ip_address: '34.87.123.45'
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

            // Start password reset
            const resetPromise = resetWindowsPassword(instanceName, zone, username);
            
            // Simulate successful command completion
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify(mockPasswordData));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            // Wait for reset to complete
            const result = await resetPromise;

            // Verify result contains all required fields
            expect(result).toBeDefined();
            expect(result.username).toBe(username);
            expect(result.password).toBeDefined();
            expect(result.ipAddress).toBeDefined();

            // Verify the gcloud command was called with correct parameters
            expect(spawn).toHaveBeenCalled();
            const resetCall = spawn.mock.calls.find(call => 
              call[1].includes('reset-windows-password')
            );
            expect(resetCall).toBeDefined();
            
            const commandArgs = resetCall[1];
            expect(commandArgs).toContain('compute');
            expect(commandArgs).toContain('reset-windows-password');
            expect(commandArgs).toContain(instanceName);
            expect(commandArgs.some(arg => arg.includes(zone))).toBe(true);
            expect(commandArgs.some(arg => arg.includes(username))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should throw error when password reset fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => s.length > 0).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'test-instance'),
          fc.constantFrom(...validZones),
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.constantFrom(
            'not found',
            'permission denied',
            'instance not running',
            'invalid request'
          ),
          async (instanceName, zone, username, errorType) => {
            // Skip if instance name is empty after sanitization
            if (!instanceName || instanceName.length === 0) {
              return;
            }
            
            jest.clearAllMocks();

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

            const resetPromise = resetWindowsPassword(instanceName, zone, username);
            
            // Simulate error
            setTimeout(() => {
              if (stderrCallback) {
                stderrCallback(`ERROR: ${errorType}`);
              }
              if (closeCallback) {
                closeCallback(1); // Non-zero exit code
              }
            }, 10);

            // Expect password reset to throw error
            try {
              await resetPromise;
              throw new Error('Expected resetWindowsPassword to throw but it did not');
            } catch (error) {
              // Verify error is structured
              expect(error.code).toBeDefined();
              expect(error.message).toBeDefined();
              expect(error.details).toBeDefined();
              expect(error.details.operation).toBe('resetWindowsPassword');
              expect(error.details.instanceName).toBe(instanceName);
              expect(error.details.zone).toBe(zone);
              expect(error.details.username).toBe(username);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle various username formats', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
          fc.constantFrom(...validZones),
          // Generate various username formats (alphanumeric, with underscores, with hyphens)
          fc.oneof(
            fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)), // Start with letter
            fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)), // With underscores
            fc.constant('Administrator'), // Common Windows username
            fc.constant('admin'),
            fc.constant('user123')
          ),
          async (instanceName, zone, username) => {
            jest.clearAllMocks();

            const mockPasswordData = {
              username: username,
              password: 'GeneratedPassword123!',
              ip_address: '34.87.123.45'
            };

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

            const resetPromise = resetWindowsPassword(instanceName, zone, username);
            
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify(mockPasswordData));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            const result = await resetPromise;

            // Verify username is preserved in result
            expect(result.username).toBe(username);
            
            // Verify username was passed to gcloud command
            const resetCall = spawn.mock.calls.find(call => 
              call[1].includes('reset-windows-password')
            );
            expect(resetCall[1].some(arg => arg.includes(username))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Password Reset Output Completeness
   * Feature: gcp-compute-integration, Property 5: Password Reset Output Completeness
   * Validates: Requirements 3.3, 3.4
   * 
   * For any successful Windows password reset operation, the returned data SHALL
   * contain all three required fields: username, password, and IP address.
   */
  describe('Property 5: Password Reset Output Completeness', () => {
    const validZones = ['asia-southeast1-a', 'us-central1-a'];
    
    test('should return all three required fields for any successful password reset', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
          fc.constantFrom(...validZones),
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          // Generate random password and IP address
          fc.string({ minLength: 12, maxLength: 32 }),
          fc.tuple(
            fc.integer({ min: 1, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 1, max: 255 })
          ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
          async (instanceName, zone, username, password, ipAddress) => {
            jest.clearAllMocks();

            // Mock gcloud response with all three fields
            const mockPasswordData = {
              username: username,
              password: password,
              ip_address: ipAddress
            };

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

            const resetPromise = resetWindowsPassword(instanceName, zone, username);
            
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify(mockPasswordData));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            const result = await resetPromise;

            // Verify all three required fields are present
            expect(result).toBeDefined();
            expect(result).toHaveProperty('username');
            expect(result).toHaveProperty('password');
            expect(result).toHaveProperty('ipAddress');
            
            // Verify field values match the mock data
            expect(result.username).toBe(username);
            expect(result.password).toBe(password);
            expect(result.ipAddress).toBe(ipAddress);
            
            // Verify fields are not null or undefined
            expect(result.username).not.toBeNull();
            expect(result.username).not.toBeUndefined();
            expect(result.password).not.toBeNull();
            expect(result.password).not.toBeUndefined();
            expect(result.ipAddress).not.toBeNull();
            expect(result.ipAddress).not.toBeUndefined();
            
            // Verify fields are strings
            expect(typeof result.username).toBe('string');
            expect(typeof result.password).toBe('string');
            expect(typeof result.ipAddress).toBe('string');
            
            // Verify fields are not empty
            expect(result.username.length).toBeGreaterThan(0);
            expect(result.password.length).toBeGreaterThan(0);
            expect(result.ipAddress.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should throw error when password field is missing from gcloud response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => s.length > 0).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'test-instance'),
          fc.constantFrom(...validZones),
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          async (instanceName, zone, username) => {
            // Skip if instance name is empty after sanitization
            if (!instanceName || instanceName.length === 0) {
              return;
            }
            
            jest.clearAllMocks();

            // Mock incomplete response (missing password field)
            const incompleteData = {
              username: username,
              ip_address: '34.87.123.45'
              // password field is missing
            };

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

            const resetPromise = resetWindowsPassword(instanceName, zone, username);
            
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify(incompleteData));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            // Expect error due to missing password field
            try {
              await resetPromise;
              throw new Error('Expected resetWindowsPassword to throw but it did not');
            } catch (error) {
              // Verify error indicates missing password data
              expect(error.message).toContain('No password data');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should throw error when gcloud returns empty response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => s.length > 0).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'test-instance'),
          fc.constantFrom(...validZones),
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          async (instanceName, zone, username) => {
            // Skip if instance name is empty after sanitization
            if (!instanceName || instanceName.length === 0) {
              return;
            }
            
            jest.clearAllMocks();

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

            const resetPromise = resetWindowsPassword(instanceName, zone, username);
            
            setTimeout(() => {
              if (dataCallback) {
                // Return empty object
                dataCallback(JSON.stringify({}));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            // Expect error due to empty response
            try {
              await resetPromise;
              throw new Error('Expected resetWindowsPassword to throw but it did not');
            } catch (error) {
              expect(error.message).toContain('No password data');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should correctly map ip_address field to ipAddress in result', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
          fc.constantFrom(...validZones),
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.tuple(
            fc.integer({ min: 1, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 1, max: 255 })
          ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
          async (instanceName, zone, username, ipAddress) => {
            jest.clearAllMocks();

            // Mock gcloud response with ip_address field (snake_case)
            const mockPasswordData = {
              username: username,
              password: 'TestPassword123!',
              ip_address: ipAddress // Note: snake_case from gcloud
            };

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

            const resetPromise = resetWindowsPassword(instanceName, zone, username);
            
            setTimeout(() => {
              if (dataCallback) {
                dataCallback(JSON.stringify(mockPasswordData));
              }
              if (closeCallback) {
                closeCallback(0);
              }
            }, 10);

            const result = await resetPromise;

            // Verify ip_address is correctly mapped to ipAddress (camelCase)
            expect(result.ipAddress).toBe(ipAddress);
            expect(result).not.toHaveProperty('ip_address'); // Should not have snake_case version
          }
        ),
        { numRuns: 100 }
      );
    });
  });

