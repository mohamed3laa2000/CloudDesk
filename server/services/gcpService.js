const { spawn } = require('child_process');

/**
 * GCP Service - Manages Google Cloud Platform Compute Engine operations
 * Uses gcloud SDK to provision and manage VM instances
 */

// Configuration from environment variables
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const GCP_ENABLED = process.env.GCP_ENABLED === 'true';
const GCP_TIMEOUT_MS = parseInt(process.env.GCP_TIMEOUT_MS || '300000', 10); // Default 5 minutes

// Error codes for structured error handling
const ERROR_CODES = {
  AUTH_ERROR: 'GCP_AUTH_ERROR',
  PERMISSION_ERROR: 'GCP_PERMISSION_ERROR',
  QUOTA_ERROR: 'GCP_QUOTA_ERROR',
  NOT_FOUND: 'GCP_NOT_FOUND',
  TIMEOUT: 'GCP_TIMEOUT',
  INVALID_CONFIG: 'GCP_INVALID_CONFIG',
  COMMAND_ERROR: 'GCP_COMMAND_ERROR',
  SDK_NOT_INSTALLED: 'GCP_SDK_NOT_INSTALLED',
  ZONE_EXHAUSTED: 'GCP_ZONE_EXHAUSTED'
};

// Log levels
const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

/**
 * Structured logger for GCP operations
 * @param {string} level - Log level (INFO, WARN, ERROR)
 * @param {string} operation - Operation name
 * @param {string} message - Log message
 * @param {Object} context - Additional context data
 * @private
 */
const _logGcpOperation = (level, operation, message, context = {}) => {
  const logEntry = {
    level,
    timestamp: new Date().toISOString(),
    operation,
    message,
    ...context
  };

  // Format log output
  const logMessage = `[GCP ${level}] ${operation}: ${message}`;
  
  // Output based on level
  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(logMessage, JSON.stringify(logEntry, null, 2));
      break;
    case LOG_LEVELS.WARN:
      console.warn(logMessage, JSON.stringify(logEntry, null, 2));
      break;
    case LOG_LEVELS.INFO:
    default:
      console.log(logMessage, JSON.stringify(logEntry, null, 2));
      break;
  }
};

/**
 * Sanitize command arguments for logging (remove sensitive data)
 * @param {Array<string>} args - Command arguments
 * @returns {Object} { command: sanitized command string, parameters: sanitized args array }
 * @private
 */
const _sanitizeCommand = (args) => {
  const sanitized = args.map(arg => {
    // Sanitize password-related arguments
    if (arg.includes('password') || arg.includes('secret') || arg.includes('key')) {
      return '[REDACTED]';
    }
    return arg;
  });
  return {
    command: `gcloud ${sanitized.join(' ')}`,
    parameters: sanitized
  };
};

/**
 * Create a structured error response
 * @param {string} code - Error code from ERROR_CODES
 * @param {string} message - User-friendly error message
 * @param {Object} details - Additional error details
 * @returns {Object} Structured error object
 * @private
 */
const _createErrorResponse = (code, message, details = {}) => {
  const error = {
    success: false,
    error: code,
    message,
    details: {
      ...details,
      timestamp: new Date().toISOString()
    }
  };

  // Log error with full context using structured logging
  _logGcpOperation(
    LOG_LEVELS.ERROR,
    details.operation || 'unknown',
    message,
    {
      errorCode: code,
      ...details
    }
  );

  return error;
};

/**
 * Execute gcloud command with proper error handling and timeout
 * @param {Array<string>} args - Command arguments (e.g., ['compute', 'instances', 'list'])
 * @param {Object} options - Execution options
 * @param {number} [options.timeout] - Timeout in milliseconds (default: GCP_TIMEOUT_MS)
 * @returns {Promise<Object>} Parsed command output (JSON)
 * @private
 */
const _executeGcloudCommand = async (args, options = {}) => {
  const timeout = options.timeout || GCP_TIMEOUT_MS;
  
  return new Promise((resolve, reject) => {
    // Add common flags to all gcloud commands
    const fullArgs = [
      ...args,
      '--format=json',
      `--project=${GCP_PROJECT_ID}`
    ];

    // Log command execution (sanitized)
    const sanitized = _sanitizeCommand(args);
    const startTime = Date.now();
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'executeGcloudCommand',
      'Executing gcloud command',
      {
        command: sanitized.command,
        parameters: sanitized.parameters,
        projectId: GCP_PROJECT_ID,
        timeout
      }
    );

    // Spawn gcloud process
    const childProcess = spawn('gcloud', fullArgs, {
      shell: true,
      env: { ...process.env }
    });

    // If autoConfirm is enabled, write "Y" to stdin to confirm prompts
    if (options.autoConfirm) {
      childProcess.stdin.write('Y\n');
      childProcess.stdin.end();
    }

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Set timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      childProcess.kill('SIGTERM');
      
      const duration = Date.now() - startTime;
      
      reject(_createErrorResponse(
        ERROR_CODES.TIMEOUT,
        'Operation timed out. Please try again.',
        {
          command: `gcloud ${args.join(' ')}`,
          timeout,
          duration
        }
      ));
    }, timeout);

    // Collect stdout
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle process completion
    childProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      
      // If already timed out, don't process further
      if (timedOut) {
        return;
      }

      // Success case
      if (code === 0) {
        const sanitized = _sanitizeCommand(args);
        
        _logGcpOperation(
          LOG_LEVELS.INFO,
          'executeGcloudCommand',
          'Command completed successfully',
          {
            command: sanitized.command,
            duration,
            exitCode: code
          }
        );
        
        try {
          // Parse JSON output - extract JSON from output (may contain text before/after JSON)
          let jsonOutput = stdout.trim();
          
          // Find the start of JSON (either { or [)
          const objectStart = jsonOutput.indexOf('{');
          const arrayStart = jsonOutput.indexOf('[');
          
          let jsonStart = -1;
          if (objectStart !== -1 && arrayStart !== -1) {
            jsonStart = Math.min(objectStart, arrayStart);
          } else if (objectStart !== -1) {
            jsonStart = objectStart;
          } else if (arrayStart !== -1) {
            jsonStart = arrayStart;
          }
          
          if (jsonStart !== -1) {
            jsonOutput = jsonOutput.substring(jsonStart);
            
            // Try to find the end of JSON by parsing incrementally
            // This handles cases where there's text after the JSON
            let parsed = null;
            let endPos = jsonOutput.length;
            
            while (endPos > 0 && !parsed) {
              try {
                parsed = JSON.parse(jsonOutput.substring(0, endPos));
                break;
              } catch (e) {
                endPos--;
              }
            }
            
            if (parsed) {
              resolve(parsed);
              return;
            }
          }
          
          // Fallback: try to parse the entire output
          const result = jsonOutput ? JSON.parse(jsonOutput) : {};
          resolve(result);
        } catch (parseError) {
          reject(_createErrorResponse(
            ERROR_CODES.COMMAND_ERROR,
            'Failed to parse gcloud command output',
            {
              operation: 'parseOutput',
              command: `gcloud ${args.join(' ')}`,
              parseError: parseError.message,
              stdout: stdout.substring(0, 500) // Limit output size
            }
          ));
        }
        return;
      }

      // Error case - categorize the error
      const errorLower = stderr.toLowerCase();
      let errorCode = ERROR_CODES.COMMAND_ERROR;
      let errorMessage = 'GCP command failed';

      // Categorize error based on stderr content
      if (errorLower.includes('authentication') || errorLower.includes('not authenticated') || errorLower.includes('credentials')) {
        errorCode = ERROR_CODES.AUTH_ERROR;
        errorMessage = 'GCP authentication required. Please run "gcloud auth login"';
      } else if (errorLower.includes('permission') || errorLower.includes('forbidden') || errorLower.includes('access denied')) {
        errorCode = ERROR_CODES.PERMISSION_ERROR;
        errorMessage = 'Insufficient GCP permissions. Contact administrator.';
      } else if (errorLower.includes('zone_resource_pool_exhausted') || errorLower.includes('resource_availability') || errorLower.includes('currently unavailable in the')) {
        errorCode = ERROR_CODES.ZONE_EXHAUSTED;
        errorMessage = 'The selected machine configuration is currently unavailable in this zone. Please try a different region or try again later.';
      } else if (errorLower.includes('quota') || errorLower.includes('limit exceeded') || errorLower.includes('resource exhausted')) {
        errorCode = ERROR_CODES.QUOTA_ERROR;
        errorMessage = 'GCP quota exceeded. Please try a different region or contact support.';
      } else if (errorLower.includes('not found') || errorLower.includes('does not exist') || errorLower.includes('could not be found')) {
        errorCode = ERROR_CODES.NOT_FOUND;
        errorMessage = 'VM instance not found in GCP. It may have been deleted externally.';
      } else if (errorLower.includes('invalid') || errorLower.includes('bad request') || errorLower.includes('malformed')) {
        errorCode = ERROR_CODES.INVALID_CONFIG;
        errorMessage = 'Invalid VM configuration. Please check your settings.';
      }

      reject(_createErrorResponse(
        errorCode,
        errorMessage,
        {
          operation: 'executeCommand',
          command: `gcloud ${args.join(' ')}`,
          exitCode: code,
          stderr: stderr.substring(0, 1000), // Limit error output size
          duration
        }
      ));
    });

    // Handle process errors (e.g., gcloud not found)
    childProcess.on('error', (error) => {
      clearTimeout(timeoutId);
      
      // Check if error is due to gcloud not being installed
      const isNotInstalled = error.code === 'ENOENT' || 
                            error.message.includes('not found') ||
                            error.message.includes('ENOENT');
      
      const errorCode = isNotInstalled ? ERROR_CODES.SDK_NOT_INSTALLED : ERROR_CODES.COMMAND_ERROR;
      const errorMessage = isNotInstalled 
        ? 'gcloud SDK is not installed or not in PATH. Please install the Google Cloud SDK.'
        : 'Failed to execute gcloud command. Please check your configuration.';
      
      reject(_createErrorResponse(
        errorCode,
        errorMessage,
        {
          operation: 'spawnProcess',
          command: `gcloud ${args.join(' ')}`,
          error: error.message,
          errorCode: error.code
        }
      ));
    });
  });
};

// E2 custom machine type configuration
// E2 supports custom CPU (2-32 vCPUs in increments of 2) and memory (0.5-8 GB per vCPU)
const E2_MACHINE_FAMILY = 'e2';

// Region to GCP zone mapping
const REGION_ZONE_MAPPING = {
  'SINGAPORE': { region: 'asia-southeast1', zone: 'asia-southeast1-a' },
  'IOWA': { region: 'us-central1', zone: 'us-central1-a' },
};

// Windows image family mapping
const WINDOWS_IMAGE_FAMILIES = {
  'windows-general': 'windows-2025',
  'windows-server': 'windows-2025',
  'dev-engineering': 'windows-2025',
  'general-purpose': 'windows-2025',
};

/**
 * Generate E2 custom machine type string
 * E2 custom machines support 2-32 vCPUs (in increments of 2) and 0.5-8 GB per vCPU
 * @param {number} cpuCores - Number of CPU cores
 * @param {number} ramGb - RAM in GB
 * @returns {string} GCP custom machine type (e.g., 'e2-custom-4-8192')
 * @private
 */
const _mapToMachineType = (cpuCores, ramGb) => {
  // Ensure CPU is even (E2 requirement)
  const adjustedCpu = cpuCores % 2 === 0 ? cpuCores : cpuCores + 1;
  
  // Convert GB to MB for GCP custom machine type format
  const ramMb = ramGb * 1024;
  
  // E2 custom machine type format: e2-custom-{cpus}-{memory_mb}
  const machineType = `${E2_MACHINE_FAMILY}-custom-${adjustedCpu}-${ramMb}`;
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    '_mapToMachineType',
    'Generated E2 custom machine type',
    {
      requestedCpu: cpuCores,
      adjustedCpu,
      ramGb,
      ramMb,
      machineType
    }
  );
  
  return machineType;
};

/**
 * Map CloudDesk region to GCP zone
 * @param {string} region - CloudDesk region (SINGAPORE or IOWA)
 * @returns {string} GCP zone (e.g., 'asia-southeast1-a')
 * @throws {Error} If region is not supported
 * @private
 */
const _mapToGcpZone = (region) => {
  const mapping = REGION_ZONE_MAPPING[region];
  
  if (!mapping) {
    _logGcpOperation(
      LOG_LEVELS.ERROR,
      '_mapToGcpZone',
      'Unsupported region',
      {
        region,
        supportedRegions: Object.keys(REGION_ZONE_MAPPING)
      }
    );
    throw new Error(`Unsupported region: ${region}. Only SINGAPORE and IOWA are supported.`);
  }
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    '_mapToGcpZone',
    'Mapped region to zone',
    {
      region,
      zone: mapping.zone,
      gcpRegion: mapping.region
    }
  );
  
  return mapping.zone;
};

/**
 * Map CloudDesk image preset to GCP Windows image family
 * @param {string} imageId - CloudDesk image preset ID
 * @returns {string} GCP image family (e.g., 'windows-2022')
 * @throws {Error} If image preset is not supported
 * @private
 */
const _mapToGcpImage = (imageId) => {
  const imageFamily = WINDOWS_IMAGE_FAMILIES[imageId];
  
  if (!imageFamily) {
    _logGcpOperation(
      LOG_LEVELS.ERROR,
      '_mapToGcpImage',
      'Unsupported image preset',
      {
        imageId,
        supportedPresets: Object.keys(WINDOWS_IMAGE_FAMILIES)
      }
    );
    throw new Error(`Unsupported image preset: ${imageId}`);
  }
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    '_mapToGcpImage',
    'Mapped image preset to Windows image family',
    {
      imageId,
      imageFamily
    }
  );
  
  return imageFamily;
};

/**
 * Create a new GCP Compute Engine VM instance
 * @param {Object} config - Instance configuration
 * @param {string} config.name - Instance name (CloudDesk ID)
 * @param {number} config.cpuCores - Number of CPU cores
 * @param {number} config.ramGb - RAM in GB
 * @param {number} config.storageGb - Boot disk size in GB
 * @param {string} config.gpu - GPU type (optional)
 * @param {string} config.region - CloudDesk region (SINGAPORE or IOWA)
 * @param {string} config.imageId - CloudDesk image preset ID
 * @returns {Promise<Object>} GCP instance metadata
 * @throws {Error} If instance creation fails
 */
const createInstance = async (config) => {
  const startTime = Date.now();
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'createInstance',
    'Starting instance creation',
    {
      instanceName: config.name,
      cpuCores: config.cpuCores,
      ramGb: config.ramGb,
      storageGb: config.storageGb,
      region: config.region,
      imageId: config.imageId,
      gpu: config.gpu
    }
  );

  try {
    // Build instance name (must be lowercase, alphanumeric with hyphens)
    const instanceName = config.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Use instance template with custom machine type and disk size
    const machineType = _mapToMachineType(config.cpuCores, config.ramGb);
    
    // Template is always in Singapore region (asia-southeast1-b)
    const zone = 'asia-southeast1-b';

    // Build gcloud compute instances create command using regional template
    const args = [
      'compute',
      'instances',
      'create',
      instanceName,
      `--source-instance-template=projects/${GCP_PROJECT_ID}/regions/asia-southeast1/instanceTemplates/win-vm-standard`,
      `--zone=${zone}`,
      `--machine-type=${machineType}`,
      `--boot-disk-size=${config.storageGb}GB`
    ];

    // Add GPU if specified (skip if NONE)
    if (config.gpu && config.gpu !== 'NONE' && config.gpu.toLowerCase() !== 'none') {
      // Map GPU type to GCP accelerator
      const gpuMapping = {
        'nvidia-t4': 'nvidia-tesla-t4',
        'nvidia-v100': 'nvidia-tesla-v100',
        'nvidia-p4': 'nvidia-tesla-p4',
        'T4': 'nvidia-tesla-t4',
        'V100': 'nvidia-tesla-v100',
        'A10': 'nvidia-tesla-a100',
        'A100': 'nvidia-tesla-a100',
        'H100': 'nvidia-tesla-h100',
        'RTX_4090': 'nvidia-tesla-t4', // Fallback to T4 for consumer GPUs
        'RTX_A6000': 'nvidia-tesla-a100' // Fallback to A100 for workstation GPUs
      };
      
      const gcpGpuType = gpuMapping[config.gpu] || config.gpu;
      args.push(`--accelerator=type=${gcpGpuType},count=1`);
      args.push('--maintenance-policy=TERMINATE'); // Required for GPU instances
    }

    // Execute gcloud command
    const result = await _executeGcloudCommand(args, { timeout: GCP_TIMEOUT_MS });

    // Parse instance metadata from result
    // gcloud returns an array with a single instance object
    const instanceData = Array.isArray(result) ? result[0] : result;

    if (!instanceData) {
      throw new Error('No instance data returned from gcloud command');
    }

    // Extract metadata
    const metadata = {
      gcpInstanceId: instanceData.name,
      gcpZone: zone,
      gcpMachineType: machineType,
      gcpProjectId: process.env.GCP_PROJECT_ID, // Read dynamically for testing
      gcpExternalIp: null // Will be assigned after instance starts
    };

    // Try to extract external IP if available
    if (instanceData.networkInterfaces && instanceData.networkInterfaces.length > 0) {
      const networkInterface = instanceData.networkInterfaces[0];
      if (networkInterface.accessConfigs && networkInterface.accessConfigs.length > 0) {
        metadata.gcpExternalIp = networkInterface.accessConfigs[0].natIP || null;
      }
    }

    // Log successful operation with context
    const duration = Date.now() - startTime;
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'createInstance',
      'Instance created successfully',
      {
        instanceId: config.name,
        gcpInstanceId: metadata.gcpInstanceId,
        zone: metadata.gcpZone,
        machineType: metadata.gcpMachineType,
        externalIp: metadata.gcpExternalIp,
        duration
      }
    );
    
    return metadata;

  } catch (error) {
    // If error is already structured, rethrow it
    if (error.success === false && error.error) {
      throw error;
    }
    
    // Otherwise, wrap it in a structured error
    throw _createErrorResponse(
      ERROR_CODES.COMMAND_ERROR,
      error.message || 'Failed to create GCP instance',
      {
        operation: 'createInstance',
        config: {
          name: config.name,
          cpuCores: config.cpuCores,
          ramGb: config.ramGb,
          storageGb: config.storageGb,
          region: config.region,
          imageId: config.imageId
        },
        error: error.message
      }
    );
  }
};

/**
 * Start a stopped VM instance
 * @param {string} instanceName - GCP instance name
 * @param {string} zone - GCP zone
 * @returns {Promise<void>}
 * @throws {Error} If start operation fails
 */
const startInstance = async (instanceName, zone) => {
  const startTime = Date.now();
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'startInstance',
    'Starting instance',
    {
      instanceName,
      zone
    }
  );

  try {
    const args = [
      'compute',
      'instances',
      'start',
      instanceName,
      `--zone=${zone}`
    ];

    await _executeGcloudCommand(args, { timeout: 120000 }); // 2 minute timeout

    // Verify status with retry
    await _waitForStatus(instanceName, zone, 'RUNNING', 3, 2000);
    
    // Log successful operation with context
    const duration = Date.now() - startTime;
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'startInstance',
      'Instance started successfully',
      {
        instanceName,
        zone,
        duration
      }
    );

  } catch (error) {
    // If error is already structured, rethrow it
    if (error.success === false && error.error) {
      throw error;
    }
    
    throw _createErrorResponse(
      ERROR_CODES.COMMAND_ERROR,
      error.message || 'Failed to start GCP instance',
      {
        operation: 'startInstance',
        instanceName,
        zone,
        error: error.message
      }
    );
  }
};

/**
 * Stop a running VM instance
 * @param {string} instanceName - GCP instance name
 * @param {string} zone - GCP zone
 * @returns {Promise<void>}
 * @throws {Error} If stop operation fails
 */
const stopInstance = async (instanceName, zone) => {
  const startTime = Date.now();
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'stopInstance',
    'Stopping instance',
    {
      instanceName,
      zone
    }
  );

  try {
    const args = [
      'compute',
      'instances',
      'stop',
      instanceName,
      `--zone=${zone}`
    ];

    await _executeGcloudCommand(args, { timeout: 120000 }); // 2 minute timeout

    // Verify status with retry
    await _waitForStatus(instanceName, zone, 'TERMINATED', 3, 2000);
    
    // Log successful operation with context
    const duration = Date.now() - startTime;
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'stopInstance',
      'Instance stopped successfully',
      {
        instanceName,
        zone,
        duration
      }
    );

  } catch (error) {
    // If error is already structured, rethrow it
    if (error.success === false && error.error) {
      throw error;
    }
    
    throw _createErrorResponse(
      ERROR_CODES.COMMAND_ERROR,
      error.message || 'Failed to stop GCP instance',
      {
        operation: 'stopInstance',
        instanceName,
        zone,
        error: error.message
      }
    );
  }
};

/**
 * Delete a VM instance
 * @param {string} instanceName - GCP instance name
 * @param {string} zone - GCP zone
 * @returns {Promise<void>}
 * @throws {Error} If delete operation fails
 */
const deleteInstance = async (instanceName, zone) => {
  const startTime = Date.now();
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'deleteInstance',
    'Deleting instance',
    {
      instanceName,
      zone
    }
  );

  try {
    const args = [
      'compute',
      'instances',
      'delete',
      instanceName,
      `--zone=${zone}`,
      '--quiet' // Skip confirmation prompt
    ];

    await _executeGcloudCommand(args, { timeout: 120000 }); // 2 minute timeout
    
    // Log successful operation with context
    const duration = Date.now() - startTime;
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'deleteInstance',
      'Instance deleted successfully',
      {
        instanceName,
        zone,
        duration
      }
    );

  } catch (error) {
    // If error is already structured, rethrow it
    if (error.success === false && error.error) {
      throw error;
    }
    
    throw _createErrorResponse(
      ERROR_CODES.COMMAND_ERROR,
      error.message || 'Failed to delete GCP instance',
      {
        operation: 'deleteInstance',
        instanceName,
        zone,
        error: error.message
      }
    );
  }
};

/**
 * Get current status of a VM instance
 * @param {string} instanceName - GCP instance name
 * @param {string} zone - GCP zone
 * @returns {Promise<string>} Status (RUNNING, STOPPED, PROVISIONING, TERMINATED, etc.)
 * @throws {Error} If status query fails
 */
const getInstanceStatus = async (instanceName, zone) => {
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'getInstanceStatus',
    'Querying instance status',
    {
      instanceName,
      zone
    }
  );

  try {
    const args = [
      'compute',
      'instances',
      'describe',
      instanceName,
      `--zone=${zone}`
    ];

    const result = await _executeGcloudCommand(args, { timeout: 30000 }); // 30 second timeout
    
    const status = result.status;
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'getInstanceStatus',
      'Status retrieved',
      {
        instanceName,
        zone,
        status
      }
    );
    
    return status;

  } catch (error) {
    // If error is already structured, rethrow it
    if (error.success === false && error.error) {
      throw error;
    }
    
    throw _createErrorResponse(
      ERROR_CODES.COMMAND_ERROR,
      error.message || 'Failed to get GCP instance status',
      {
        operation: 'getInstanceStatus',
        instanceName,
        zone,
        error: error.message
      }
    );
  }
};

/**
 * Get full instance details from GCP
 * @param {string} instanceName - GCP instance name
 * @param {string} zone - GCP zone
 * @returns {Promise<Object>} Full instance details including status, IP, etc.
 * @throws {Error} If instance describe fails
 */
const describeInstance = async (instanceName, zone) => {
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'describeInstance',
    'Getting instance details',
    {
      instanceName,
      zone
    }
  );

  try {
    const args = [
      'compute',
      'instances',
      'describe',
      instanceName,
      `--zone=${zone}`
    ];

    const result = await _executeGcloudCommand(args, { timeout: 30000 }); // 30 second timeout
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'describeInstance',
      'Instance details retrieved',
      {
        instanceName,
        zone,
        status: result.status
      }
    );
    
    return result;

  } catch (error) {
    // If error is already structured, rethrow it
    if (error.success === false && error.error) {
      throw error;
    }
    
    throw _createErrorResponse(
      ERROR_CODES.COMMAND_ERROR,
      error.message || 'Failed to get instance details',
      {
        operation: 'describeInstance',
        instanceName,
        zone,
        error: error.message
      }
    );
  }
};

/**
 * Wait for instance to reach expected status with retry logic
 * @param {string} instanceName - GCP instance name
 * @param {string} zone - GCP zone
 * @param {string} expectedStatus - Expected status (RUNNING, TERMINATED, etc.)
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} delayMs - Delay between retries in milliseconds (default: 2000)
 * @returns {Promise<void>}
 * @throws {Error} If status doesn't match after all retries
 * @private
 */
const _waitForStatus = async (instanceName, zone, expectedStatus, maxRetries = 3, delayMs = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const status = await getInstanceStatus(instanceName, zone);
      
      if (status === expectedStatus) {
        _logGcpOperation(
          LOG_LEVELS.INFO,
          '_waitForStatus',
          'Instance reached expected status',
          {
            instanceName,
            zone,
            expectedStatus,
            actualStatus: status,
            attempt,
            maxRetries
          }
        );
        return;
      }
      
      _logGcpOperation(
        LOG_LEVELS.WARN,
        '_waitForStatus',
        'Status mismatch, retrying',
        {
          instanceName,
          zone,
          expectedStatus,
          actualStatus: status,
          attempt,
          maxRetries
        }
      );
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      _logGcpOperation(
        LOG_LEVELS.ERROR,
        '_waitForStatus',
        'Error checking status',
        {
          instanceName,
          zone,
          expectedStatus,
          attempt,
          maxRetries,
          error: error.message
        }
      );
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw _createErrorResponse(
    ERROR_CODES.TIMEOUT,
    `Instance did not reach expected status after ${maxRetries} attempts`,
    {
      operation: '_waitForStatus',
      instanceName,
      zone,
      expectedStatus,
      maxRetries
    }
  );
};

/**
 * Reset Windows password for a VM instance
 * @param {string} instanceName - GCP instance name
 * @param {string} zone - GCP zone
 * @param {string} username - Windows username
 * @returns {Promise<Object>} { username, password, ipAddress }
 * @throws {Error} If password reset fails
 */
const resetWindowsPassword = async (instanceName, zone, username) => {
  const startTime = Date.now();
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'resetWindowsPassword',
    'Resetting Windows password',
    {
      instanceName,
      zone,
      username
    }
  );

  try {
    const args = [
      'compute',
      'reset-windows-password',
      instanceName,
      `--zone=${zone}`,
      `--user=${username}`
    ];

    const result = await _executeGcloudCommand(args, { timeout: 300000, autoConfirm: true }); // 5 minute timeout for Windows password reset
    
    // Parse password data from result
    // gcloud returns: { ip_address, password, username }
    if (!result || !result.password) {
      throw new Error('No password data returned from gcloud command');
    }

    const passwordData = {
      username: result.username,
      password: result.password,
      ipAddress: result.ip_address
    };

    // Log successful operation with context (DO NOT log password)
    const duration = Date.now() - startTime;
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'resetWindowsPassword',
      'Windows password reset successful',
      {
        instanceName,
        zone,
        username: passwordData.username,
        ipAddress: passwordData.ipAddress,
        duration
      }
    );
    
    return passwordData;

  } catch (error) {
    // If error is already structured, rethrow it
    if (error.success === false && error.error) {
      throw error;
    }
    
    throw _createErrorResponse(
      ERROR_CODES.COMMAND_ERROR,
      error.message || 'Failed to reset Windows password',
      {
        operation: 'resetWindowsPassword',
        instanceName,
        zone,
        username,
        error: error.message
      }
    );
  }
};

/**
 * Create a machine image backup of an instance
 * @param {string} imageName - Name for the machine image
 * @param {string} instanceName - Source instance name
 * @param {string} zone - GCP zone of the instance
 * @returns {Promise<Object>} Machine image metadata
 * @throws {Error} If machine image creation fails
 */
const createMachineImage = async (imageName, instanceName, zone) => {
  const startTime = Date.now();
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'createMachineImage',
    'Creating machine image backup',
    {
      imageName,
      instanceName,
      zone
    }
  );

  try {
    const args = [
      'compute',
      'machine-images',
      'create',
      imageName,
      `--source-instance=${instanceName}`,
      `--source-instance-zone=${zone}`
    ];

    const result = await _executeGcloudCommand(args, { timeout: GCP_TIMEOUT_MS });

    // Parse machine image metadata from result
    const imageData = Array.isArray(result) ? result[0] : result;

    if (!imageData) {
      throw new Error('No machine image data returned from gcloud command');
    }

    // Extract metadata
    const metadata = {
      name: imageData.name,
      sourceInstance: imageData.sourceInstance,
      status: imageData.status,
      creationTimestamp: imageData.creationTimestamp
    };

    // Log successful operation with context
    const duration = Date.now() - startTime;
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'createMachineImage',
      'Machine image created successfully',
      {
        imageName: metadata.name,
        sourceInstance: instanceName,
        zone,
        status: metadata.status,
        duration
      }
    );
    
    return metadata;

  } catch (error) {
    // If error is already structured, rethrow it
    if (error.success === false && error.error) {
      throw error;
    }
    
    throw _createErrorResponse(
      ERROR_CODES.COMMAND_ERROR,
      error.message || 'Failed to create machine image',
      {
        operation: 'createMachineImage',
        imageName,
        instanceName,
        zone,
        error: error.message
      }
    );
  }
};

/**
 * Get machine image details including storage size
 * @param {string} imageName - Machine image name
 * @returns {Promise<Object>} Machine image details with totalStorageBytes
 * @throws {Error} If describe operation fails
 */
const describeMachineImage = async (imageName) => {
  const startTime = Date.now();
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'describeMachineImage',
    'Describing machine image',
    {
      imageName
    }
  );

  try {
    const args = [
      'compute',
      'machine-images',
      'describe',
      imageName
    ];

    const result = await _executeGcloudCommand(args, { timeout: 30000 }); // 30 second timeout

    // Validate response structure
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from gcloud command: expected object');
    }

    // Extract totalStorageBytes from response
    // The field may be missing if the machine image is still being created
    const totalStorageBytes = result.totalStorageBytes || null;

    // Parse to number if it's a string
    const storageBytesNumber = totalStorageBytes ? parseInt(totalStorageBytes, 10) : null;

    // Validate storage bytes is a valid number
    if (totalStorageBytes !== null && (isNaN(storageBytesNumber) || storageBytesNumber < 0)) {
      _logGcpOperation(
        LOG_LEVELS.WARN,
        'describeMachineImage',
        'Invalid totalStorageBytes value in response',
        {
          imageName,
          totalStorageBytes,
          parsedValue: storageBytesNumber
        }
      );
    }

    // Build metadata object
    const metadata = {
      name: result.name,
      totalStorageBytes: storageBytesNumber,
      status: result.status,
      creationTimestamp: result.creationTimestamp,
      sourceInstance: result.sourceInstance
    };

    // Log successful operation with context
    const duration = Date.now() - startTime;
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'describeMachineImage',
      'Machine image described successfully',
      {
        imageName: metadata.name,
        totalStorageBytes: metadata.totalStorageBytes,
        status: metadata.status,
        duration
      }
    );
    
    return metadata;

  } catch (error) {
    // If error is already structured, rethrow it
    if (error.success === false && error.error) {
      throw error;
    }
    
    throw _createErrorResponse(
      ERROR_CODES.COMMAND_ERROR,
      error.message || 'Failed to describe machine image',
      {
        operation: 'describeMachineImage',
        imageName,
        error: error.message
      }
    );
  }
};

/**
 * Delete a machine image
 * @param {string} imageName - Machine image name
 * @returns {Promise<void>}
 * @throws {Error} If delete operation fails
 */
const deleteMachineImage = async (imageName) => {
  const startTime = Date.now();
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'deleteMachineImage',
    'Deleting machine image',
    {
      imageName
    }
  );

  try {
    const args = [
      'compute',
      'machine-images',
      'delete',
      imageName,
      '--quiet' // Skip confirmation prompt
    ];

    await _executeGcloudCommand(args, { timeout: 120000 }); // 2 minute timeout
    
    // Log successful operation with context
    const duration = Date.now() - startTime;
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'deleteMachineImage',
      'Machine image deleted successfully',
      {
        imageName,
        duration
      }
    );

  } catch (error) {
    // If error is already structured, rethrow it
    if (error.success === false && error.error) {
      throw error;
    }
    
    throw _createErrorResponse(
      ERROR_CODES.COMMAND_ERROR,
      error.message || 'Failed to delete machine image',
      {
        operation: 'deleteMachineImage',
        imageName,
        error: error.message
      }
    );
  }
};

/**
 * List all machine images in the project
 * @returns {Promise<Array>} Array of machine image objects
 * @throws {Error} If list operation fails
 */
const listMachineImages = async () => {
  const startTime = Date.now();
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'listMachineImages',
    'Listing machine images',
    {}
  );

  try {
    const args = [
      'compute',
      'machine-images',
      'list'
    ];

    const result = await _executeGcloudCommand(args, { timeout: 30000 }); // 30 second timeout

    // Result should be an array of machine image objects
    const images = Array.isArray(result) ? result : [];

    // Log successful operation with context
    const duration = Date.now() - startTime;
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'listMachineImages',
      'Machine images listed successfully',
      {
        imageCount: images.length,
        duration
      }
    );
    
    return images;

  } catch (error) {
    // If error is already structured, rethrow it
    if (error.success === false && error.error) {
      throw error;
    }
    
    throw _createErrorResponse(
      ERROR_CODES.COMMAND_ERROR,
      error.message || 'Failed to list machine images',
      {
        operation: 'listMachineImages',
        error: error.message
      }
    );
  }
};

/**
 * Create an instance from a machine image
 * @param {string} instanceName - Name for the new instance
 * @param {string} zone - GCP zone for the instance
 * @param {string} machineImageName - Source machine image name
 * @returns {Promise<Object>} Instance creation metadata
 * @throws {Error} If instance creation fails
 */
const createInstanceFromMachineImage = async (instanceName, zone, machineImageName) => {
  const startTime = Date.now();
  
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'createInstanceFromMachineImage',
    'Creating instance from machine image',
    {
      instanceName,
      zone,
      machineImageName
    }
  );

  try {
    const args = [
      'compute',
      'instances',
      'create',
      instanceName,
      `--zone=${zone}`,
      `--source-machine-image=${machineImageName}`
    ];

    const result = await _executeGcloudCommand(args, { timeout: GCP_TIMEOUT_MS });

    // Parse instance metadata from result
    // gcloud returns an array with a single instance object
    const instanceData = Array.isArray(result) ? result[0] : result;

    if (!instanceData) {
      throw new Error('No instance data returned from gcloud command');
    }

    // Extract metadata
    const metadata = {
      gcpInstanceId: instanceData.name,
      gcpZone: zone,
      gcpMachineType: instanceData.machineType,
      gcpProjectId: GCP_PROJECT_ID,
      gcpExternalIp: null // Will be assigned after instance starts
    };

    // Try to extract external IP if available
    if (instanceData.networkInterfaces && instanceData.networkInterfaces.length > 0) {
      const networkInterface = instanceData.networkInterfaces[0];
      if (networkInterface.accessConfigs && networkInterface.accessConfigs.length > 0) {
        metadata.gcpExternalIp = networkInterface.accessConfigs[0].natIP || null;
      }
    }

    // Log successful operation with context
    const duration = Date.now() - startTime;
    
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'createInstanceFromMachineImage',
      'Instance created from machine image successfully',
      {
        instanceName: metadata.gcpInstanceId,
        zone: metadata.gcpZone,
        machineImageName,
        machineType: metadata.gcpMachineType,
        externalIp: metadata.gcpExternalIp,
        duration
      }
    );
    
    return metadata;

  } catch (error) {
    // If error is already structured, rethrow it
    if (error.success === false && error.error) {
      throw error;
    }
    
    throw _createErrorResponse(
      ERROR_CODES.COMMAND_ERROR,
      error.message || 'Failed to create instance from machine image',
      {
        operation: 'createInstanceFromMachineImage',
        instanceName,
        zone,
        machineImageName,
        error: error.message
      }
    );
  }
};

/**
 * Check if GCP is enabled and configured
 * @returns {boolean} True if GCP is enabled and configured
 */
const isGcpEnabled = () => {
  if (!GCP_ENABLED) {
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'isGcpEnabled',
      'GCP integration is disabled',
      {
        gcpEnabled: GCP_ENABLED
      }
    );
    return false;
  }

  if (!GCP_PROJECT_ID) {
    _logGcpOperation(
      LOG_LEVELS.WARN,
      'isGcpEnabled',
      'GCP_PROJECT_ID not configured. Falling back to demo mode',
      {
        gcpEnabled: GCP_ENABLED,
        projectIdConfigured: false
      }
    );
    return false;
  }

  return true;
};

/**
 * Validate GCP configuration on startup
 * Logs warnings if configuration is incomplete
 */
const validateConfiguration = () => {
  _logGcpOperation(
    LOG_LEVELS.INFO,
    'validateConfiguration',
    'Validating GCP configuration',
    {
      gcpEnabled: GCP_ENABLED,
      projectIdConfigured: !!GCP_PROJECT_ID,
      timeout: GCP_TIMEOUT_MS
    }
  );
  
  if (!GCP_ENABLED) {
    _logGcpOperation(
      LOG_LEVELS.INFO,
      'validateConfiguration',
      'GCP integration disabled. Running in demo mode',
      {
        gcpEnabled: GCP_ENABLED
      }
    );
    return;
  }

  if (!GCP_PROJECT_ID) {
    _logGcpOperation(
      LOG_LEVELS.WARN,
      'validateConfiguration',
      'GCP_PROJECT_ID not set. GCP operations will fail',
      {
        gcpEnabled: GCP_ENABLED,
        projectIdConfigured: false,
        recommendation: 'Set GCP_PROJECT_ID in environment variables or disable GCP with GCP_ENABLED=false'
      }
    );
    return;
  }

  _logGcpOperation(
    LOG_LEVELS.INFO,
    'validateConfiguration',
    'Configuration valid',
    {
      projectId: GCP_PROJECT_ID,
      timeout: GCP_TIMEOUT_MS
    }
  );
};

module.exports = {
  createInstance,
  startInstance,
  stopInstance,
  deleteInstance,
  getInstanceStatus,
  describeInstance,
  resetWindowsPassword,
  createMachineImage,
  describeMachineImage,
  deleteMachineImage,
  listMachineImages,
  createInstanceFromMachineImage,
  isGcpEnabled,
  validateConfiguration,
  _executeGcloudCommand, // Exported for testing
  _mapToMachineType, // Exported for testing
  _mapToGcpZone, // Exported for testing
  _mapToGcpImage, // Exported for testing
  _waitForStatus, // Exported for testing
  ERROR_CODES
};
