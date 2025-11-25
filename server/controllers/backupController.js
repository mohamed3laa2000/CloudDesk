const dbService = require('../services/dbService');
const gcpService = require('../services/gcpService');

/**
 * Backup controller - handles backup management business logic
 */

/**
 * Get all backups for authenticated user
 * @route GET /api/backups
 * @returns {Array<Backup>} User's backups
 */
const getBackups = async (req, res, next) => {
  try {
    // Extract user email from JWT (attached by authMiddleware)
    const { email } = req.user;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'User email not found in request'
      });
    }

    // Call dbService to get backups for this user
    let backups;
    try {
      backups = await dbService.getBackupsByUser(email);
    } catch (error) {
      console.error('Database error during getBackupsByUser:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Return backups array with 200 status
    return res.status(200).json({
      success: true,
      backups
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in getBackups controller:', error);
    next(error);
  }
};

/**
 * Create new backup
 * @route POST /api/backups
 * @body {instanceId, name}
 * @returns {Backup} Created backup with 201 status
 */
const createBackup = async (req, res, next) => {
  try {
    // Extract user email from JWT (attached by authMiddleware)
    const { email } = req.user;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'User email not found in request'
      });
    }

    // Validate request body fields
    const { instanceId, name } = req.body;

    // Check for required fields
    if (!instanceId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Missing required field: instanceId'
      });
    }

    if (!name && name !== '') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Missing required field: name'
      });
    }

    // Validate backup name (not empty, no invalid chars, max length)
    // Step 1: Check if name is empty or only whitespace after trimming
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Backup name cannot be empty'
      });
    }

    // Step 2: Validate max length (100 characters) - check before trimming
    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Backup name cannot exceed 100 characters'
      });
    }

    // Step 3: Validate no invalid characters (only alphanumeric, hyphens, underscores, spaces)
    const invalidCharsRegex = /[^a-zA-Z0-9\-_ ]/;
    if (invalidCharsRegex.test(name)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Backup name contains invalid characters'
      });
    }

    // Get instance from database
    let instance;
    try {
      instance = await dbService.getInstanceById(instanceId);
    } catch (error) {
      console.error('Database error during getInstanceById:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Verify instance exists
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Source instance not found'
      });
    }

    // Verify instance ownership
    if (instance.userEmail !== email) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to backup this instance'
      });
    }

    // Verify instance exists in GCP (if GCP-managed)
    const isGcpManaged = instance.gcpInstanceId && instance.gcpZone;
    
    if (isGcpManaged) {
      try {
        console.log(`Verifying GCP instance ${instance.gcpInstanceId} exists`);
        const gcpStatus = await gcpService.getInstanceStatus(instance.gcpInstanceId, instance.gcpZone);
        console.log(`✓ GCP instance verified with status: ${gcpStatus}`);
      } catch (error) {
        console.error('GCP verification error:', error);
        return res.status(500).json({
          success: false,
          error: error.error || 'GCP_ERROR',
          message: error.message || 'Failed to verify instance in GCP'
        });
      }
    }

    // Generate unique machine image name (format: backup-{instanceId}-{timestamp})
    const timestamp = Date.now();
    const gcpMachineImageName = `backup-${instanceId}-${timestamp}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Create backup record in database with CREATING status
    let createdBackup;
    try {
      createdBackup = await dbService.createBackup(email, instanceId, {
        name: name.trim(),
        gcpMachineImageName,
        sourceInstanceName: instance.name,
        sourceInstanceZone: instance.gcpZone || 'us-central1-a',
        status: 'CREATING'
      });
      console.log(`✓ Backup record created in database: ${createdBackup.id}`);
    } catch (error) {
      console.error('Database error during createBackup:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Call gcpService.createMachineImage (if GCP-managed)
    if (isGcpManaged) {
      // Start machine image creation in background without blocking the response
      console.log(`Creating machine image ${gcpMachineImageName} for instance ${instance.gcpInstanceId}`);
      
      // Schedule background task immediately without waiting for gcloud command
      setImmediate(async () => {
        try {
          // Start the machine image creation (this will block in background)
          await gcpService.createMachineImage(
            gcpMachineImageName,
            instance.gcpInstanceId,
            instance.gcpZone
          );
          console.log(`✓ Machine image creation command completed`);
        } catch (createError) {
          console.error('Machine image creation command failed:', createError);
          // Update backup to ERROR status
          try {
            await dbService.updateBackupStatus(
              createdBackup.id,
              'ERROR',
              null,
              createError.message || 'Failed to create machine image'
            );
          } catch (updateError) {
            console.error('Failed to update backup error status:', updateError);
          }
          return; // Exit early on creation failure
        }

        // Now poll for completion
        setImmediate(async () => {
          try {
            // Wait a bit for the machine image to be created
            console.log(`Waiting for machine image ${gcpMachineImageName} to complete...`);
            
            // Poll for completion (no timeout - poll indefinitely every 5 seconds)
            let attempt = 0;
            let completed = false;

            while (!completed) {
              await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
              attempt++;

              try {
                // Try to describe the machine image
                const imageDetails = await gcpService.describeMachineImage(gcpMachineImageName);
                
                if (imageDetails && imageDetails.totalStorageBytes !== undefined) {
                  // Machine image is ready
                  console.log(`✓ Machine image ${gcpMachineImageName} completed with ${imageDetails.totalStorageBytes} bytes after ${attempt} attempts`);
                  
                  // Update backup record with storage_bytes and COMPLETED status
                  await dbService.updateBackupStatus(
                    createdBackup.id,
                    'COMPLETED',
                    imageDetails.totalStorageBytes,
                    null
                  );
                  
                  completed = true;
                  console.log(`✓ Backup ${createdBackup.id} marked as COMPLETED`);
                }
              } catch (describeError) {
                // Machine image not ready yet, continue polling
                console.log(`Attempt ${attempt}: Machine image not ready yet, will retry in 5 seconds...`);
              }
            }
          } catch (pollError) {
            console.error('Error during backup completion polling:', pollError);
            try {
              await dbService.updateBackupStatus(
                createdBackup.id,
                'ERROR',
                null,
                pollError.message || 'Failed to complete backup'
              );
            } catch (updateError) {
              console.error('Failed to update backup error status:', updateError);
            }
          }
        });
      });
    } else {
      // For non-GCP instances (demo mode), simulate completion after a delay
      setTimeout(async () => {
        try {
          // Simulate storage size (random between 10-50 GB)
          const simulatedStorageBytes = (10 + Math.random() * 40) * 1024 * 1024 * 1024;
          
          await dbService.updateBackupStatus(
            createdBackup.id,
            'COMPLETED',
            simulatedStorageBytes,
            null
          );
          console.log(`✓ Demo backup ${createdBackup.id} marked as COMPLETED`);
        } catch (error) {
          console.error('Failed to complete demo backup:', error);
        }
      }, 3000 + Math.random() * 2000);
    }

    // Return backup with 201 status
    return res.status(201).json({
      success: true,
      message: 'Backup creation initiated. This may take several minutes to complete.',
      backup: createdBackup
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in createBackup controller:', error);
    next(error);
  }
};

/**
 * Get single backup by ID
 * @route GET /api/backups/:id
 * @returns {Backup} Backup details with current cost
 */
const getBackup = async (req, res, next) => {
  try {
    // Extract user email from JWT (attached by authMiddleware)
    const { email } = req.user;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'User email not found in request'
      });
    }

    // Extract backup ID from URL params
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Backup ID is required'
      });
    }

    // Call dbService.getBackupById
    let backup;
    try {
      backup = await dbService.getBackupById(id);
    } catch (error) {
      console.error('Database error during getBackupById:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Verify backup exists (404 if not)
    if (!backup) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Backup not found'
      });
    }

    // Verify backup ownership (403 if not)
    if (backup.userEmail !== email) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this backup'
      });
    }

    // Calculate current cost
    // Pricing configuration - storage cost per GB-hour in IDR
    const STORAGE_RATE_PER_GB_HOUR = 2.306; // IDR per GB per hour

    let currentCost = 0;
    if (backup.storageGb !== null && backup.storageGb !== undefined) {
      // Calculate hours elapsed since backup creation
      const created = new Date(backup.createdAt);
      const endTime = backup.status === 'DELETED' 
        ? new Date(backup.updatedAt)  // Use deletion time for deleted backups
        : new Date();  // Use current time for active backups
      
      const diffMs = endTime - created;
      const diffHours = Math.max(0, diffMs / (1000 * 60 * 60)); // Ensure non-negative

      // Formula: storageGb × hours × rate
      currentCost = backup.storageGb * diffHours * STORAGE_RATE_PER_GB_HOUR;
      currentCost = Math.round(currentCost * 100) / 100; // Round to 2 decimal places
    }

    // Add current cost to backup object
    const backupWithCost = {
      ...backup,
      currentCost
    };

    // Return backup with 200 status
    return res.status(200).json({
      success: true,
      backup: backupWithCost
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in getBackup controller:', error);
    next(error);
  }
};

/**
 * Delete backup
 * @route DELETE /api/backups/:id
 * @returns {Object} Success message with 200 status
 */
const deleteBackup = async (req, res, next) => {
  try {
    // Extract user email from JWT (attached by authMiddleware)
    const { email } = req.user;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'User email not found in request'
      });
    }

    // Extract backup ID from URL params
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Backup ID is required'
      });
    }

    // Get backup from database
    let backup;
    try {
      backup = await dbService.getBackupById(id);
    } catch (error) {
      console.error('Database error during getBackupById:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Verify backup exists (404 if not)
    if (!backup) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Backup not found'
      });
    }

    // Verify backup ownership (403 if not)
    if (backup.userEmail !== email) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to delete this backup'
      });
    }

    // Call gcpService.deleteMachineImage
    try {
      console.log(`Deleting machine image ${backup.gcpMachineImageName}`);
      await gcpService.deleteMachineImage(backup.gcpMachineImageName);
      console.log(`✓ Machine image ${backup.gcpMachineImageName} deleted successfully`);
    } catch (error) {
      console.error('GCP machine image deletion error:', error);
      // Handle GCP errors with 500
      return res.status(500).json({
        success: false,
        error: error.error || 'GCP_ERROR',
        message: error.message || 'Failed to delete machine image'
      });
    }

    // Call dbService.deleteBackup (soft delete)
    let deletedBackup;
    try {
      deletedBackup = await dbService.deleteBackup(id);
      console.log(`✓ Backup ${id} marked as DELETED in database`);
    } catch (error) {
      console.error('Database error during deleteBackup:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Return success message with 200 status
    return res.status(200).json({
      success: true,
      message: 'Backup deleted successfully',
      backup: deletedBackup
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in deleteBackup controller:', error);
    next(error);
  }
};

module.exports = {
  getBackups,
  createBackup,
  getBackup,
  deleteBackup
};
