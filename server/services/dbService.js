const { Pool } = require('pg');

// Database service - manages PostgreSQL database operations
let pool = null;

/**
 * Transform database row from snake_case to camelCase for frontend
 * @param {object} row - Database row with snake_case fields
 * @returns {object} - Transformed object with camelCase fields
 */
const transformInstanceRow = (row) => {
  if (!row) return null;
  
  return {
    id: row.id,
    name: row.name,
    imageId: row.image_id,
    status: row.status,
    cpuCores: row.cpu_cores,
    ramGb: row.ram_gb,
    storageGb: row.storage_gb,
    gpu: row.gpu,
    region: row.region,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userEmail: row.user_email,  // Include for backend ownership checks
    // GCP metadata fields
    gcpInstanceId: row.gcp_instance_id || null,
    gcpZone: row.gcp_zone || null,
    gcpMachineType: row.gcp_machine_type || null,
    gcpProjectId: row.gcp_project_id || null,
    gcpExternalIp: row.gcp_external_ip || null,
    errorMessage: row.error_message || null
  };
};

/**
 * Connect to PostgreSQL database with retry logic
 * Implements exponential backoff with 3 retry attempts
 */
const connect = async () => {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create connection pool if it doesn't exist
      if (!pool) {
        pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false // Required for Supabase
          },
          // Connection pool settings for Supabase
          max: 20, // Maximum number of clients in the pool
          idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
          connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
          allowExitOnIdle: false // Keep the pool alive even if all clients are idle
        });

        // Handle pool errors
        pool.on('error', (err) => {
          console.error('Unexpected error on idle database client', err);
          // Don't exit the process, just log the error
        });

        // Test the connection
        const client = await pool.connect();
        console.log('Successfully connected to PostgreSQL database');
        client.release();
      }
      
      return pool;
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff: wait 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Check if an email is approved in the database
 * @param {string} email - User email to check
 * @returns {Promise<boolean>} - True if email is approved
 */
const isEmailApproved = async (email) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = 'SELECT email FROM approved_users WHERE email = $1';
    const result = await pool.query(query, [email]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if email is approved:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Update the last login timestamp for a user
 * @param {string} email - User email
 * @returns {Promise<object>} - Updated user record
 */
const updateLastLogin = async (email) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      UPDATE approved_users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE email = $1 
      RETURNING id, email, name, last_login
    `;
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      throw new Error(`User with email ${email} not found in approved_users table`);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating last login:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Get all instances for a user
 * @param {string} email - User email
 * @returns {Promise<Array>} - Array of instance objects
 */
const getInstancesByUser = async (email) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      SELECT 
        id,
        user_email,
        name,
        image_id,
        status,
        cpu_cores,
        ram_gb,
        storage_gb,
        gpu,
        region,
        created_at,
        updated_at,
        gcp_instance_id,
        gcp_zone,
        gcp_machine_type,
        gcp_project_id,
        gcp_external_ip,
        error_message
      FROM instances 
      WHERE user_email = $1 AND status != 'DELETED'
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [email]);
    
    return result.rows.map(transformInstanceRow);
  } catch (error) {
    console.error('Error getting instances by user:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Create a new instance
 * @param {string} email - User email
 * @param {object} instanceData - Instance configuration
 * @param {string} instanceData.name - Instance name
 * @param {string} instanceData.imageId - Image ID
 * @param {number} instanceData.cpuCores - Number of CPU cores
 * @param {number} instanceData.ramGb - RAM in GB
 * @param {number} instanceData.storageGb - Storage in GB
 * @param {string} instanceData.gpu - GPU type
 * @param {string} instanceData.region - Region
 * @param {object|null} gcpMetadata - Optional GCP metadata
 * @param {string} gcpMetadata.gcpInstanceId - GCP instance name
 * @param {string} gcpMetadata.gcpZone - GCP zone
 * @param {string} gcpMetadata.gcpMachineType - GCP machine type
 * @param {string} gcpMetadata.gcpProjectId - GCP project ID
 * @param {string} gcpMetadata.gcpExternalIp - GCP external IP address
 * @returns {Promise<object>} - Created instance object
 */
const createInstance = async (email, instanceData, gcpMetadata = null) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Generate unique instance ID
    const instanceId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const query = `
      INSERT INTO instances (
        id,
        user_email,
        name,
        image_id,
        status,
        cpu_cores,
        ram_gb,
        storage_gb,
        gpu,
        region,
        gcp_instance_id,
        gcp_zone,
        gcp_machine_type,
        gcp_project_id,
        gcp_external_ip,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING 
        id,
        user_email,
        name,
        image_id,
        status,
        cpu_cores,
        ram_gb,
        storage_gb,
        gpu,
        region,
        created_at,
        updated_at,
        gcp_instance_id,
        gcp_zone,
        gcp_machine_type,
        gcp_project_id,
        gcp_external_ip,
        error_message
    `;

    const values = [
      instanceId,
      email,
      instanceData.name,
      instanceData.imageId,
      'PROVISIONING',
      instanceData.cpuCores,
      instanceData.ramGb,
      instanceData.storageGb,
      instanceData.gpu,
      instanceData.region,
      gcpMetadata?.gcpInstanceId || null,
      gcpMetadata?.gcpZone || null,
      gcpMetadata?.gcpMachineType || null,
      gcpMetadata?.gcpProjectId || null,
      gcpMetadata?.gcpExternalIp || null
    ];

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to create instance');
    }
    
    return transformInstanceRow(result.rows[0]);
  } catch (error) {
    console.error('Error creating instance:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Update instance status
 * @param {string} id - Instance ID
 * @param {string} status - New status (PROVISIONING, RUNNING, STOPPED, DELETED, ERROR)
 * @param {string|null} errorMessage - Optional error message (used when status is ERROR)
 * @returns {Promise<object>} - Updated instance object
 */
const updateInstanceStatus = async (id, status, errorMessage = null) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Validate status
    const validStatuses = ['PROVISIONING', 'RUNNING', 'STOPPED', 'DELETED', 'ERROR'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const query = `
      UPDATE instances 
      SET 
        status = $1,
        error_message = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING 
        id,
        user_email,
        name,
        image_id,
        status,
        cpu_cores,
        ram_gb,
        storage_gb,
        gpu,
        region,
        created_at,
        updated_at,
        gcp_instance_id,
        gcp_zone,
        gcp_machine_type,
        gcp_project_id,
        gcp_external_ip,
        error_message
    `;

    const result = await pool.query(query, [status, errorMessage, id]);
    
    if (result.rows.length === 0) {
      throw new Error(`Instance with id ${id} not found`);
    }
    
    return transformInstanceRow(result.rows[0]);
  } catch (error) {
    console.error('Error updating instance status:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Update instance GCP metadata (e.g., external IP)
 * @param {string} id - Instance ID
 * @param {object} gcpMetadata - GCP metadata to update
 * @param {string} gcpMetadata.gcpExternalIp - External IP address
 * @returns {Promise<object>} - Updated instance object
 */
const updateInstanceGcpMetadata = async (id, gcpMetadata) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (gcpMetadata.gcpExternalIp !== undefined) {
      updates.push(`gcp_external_ip = $${paramIndex++}`);
      values.push(gcpMetadata.gcpExternalIp);
    }

    if (updates.length === 0) {
      throw new Error('No GCP metadata fields to update');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id); // Add id as the last parameter

    const query = `
      UPDATE instances 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        user_email,
        name,
        image_id,
        status,
        cpu_cores,
        ram_gb,
        storage_gb,
        gpu,
        region,
        created_at,
        updated_at,
        gcp_instance_id,
        gcp_zone,
        gcp_machine_type,
        gcp_project_id,
        gcp_external_ip,
        error_message
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error(`Instance with id ${id} not found`);
    }
    
    return transformInstanceRow(result.rows[0]);
  } catch (error) {
    console.error('Error updating instance GCP metadata:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Delete instance (soft delete by setting status to DELETED)
 * @param {string} id - Instance ID
 * @returns {Promise<object>} - Updated instance object with DELETED status
 */
const deleteInstance = async (id) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      UPDATE instances 
      SET 
        status = 'DELETED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING 
        id,
        user_email,
        name,
        image_id,
        status,
        cpu_cores,
        ram_gb,
        storage_gb,
        gpu,
        region,
        created_at,
        updated_at,
        gcp_instance_id,
        gcp_zone,
        gcp_machine_type,
        gcp_project_id,
        gcp_external_ip,
        error_message
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error(`Instance with id ${id} not found`);
    }
    
    return transformInstanceRow(result.rows[0]);
  } catch (error) {
    console.error('Error deleting instance:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Get instance by ID
 * @param {string} id - Instance ID
 * @returns {Promise<object|null>} - Instance object or null if not found
 */
const getInstanceById = async (id) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      SELECT 
        id,
        user_email,
        name,
        image_id,
        status,
        cpu_cores,
        ram_gb,
        storage_gb,
        gpu,
        region,
        created_at,
        updated_at,
        gcp_instance_id,
        gcp_zone,
        gcp_machine_type,
        gcp_project_id,
        gcp_external_ip,
        error_message
      FROM instances 
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    
    // Return null if instance not found, otherwise return the transformed instance object
    return result.rows.length > 0 ? transformInstanceRow(result.rows[0]) : null;
  } catch (error) {
    console.error('Error getting instance by ID:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Calculate usage summary for a user
 * @param {string} email - User email
 * @returns {Promise<object>} - Usage summary with totalHours, totalCost, averageCostPerDesktop, activeDesktops
 */
const calculateUsageSummary = async (email) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Get ALL user instances including DELETED ones for billing history
    const query = `
      SELECT 
        id,
        user_email,
        name,
        image_id,
        status,
        cpu_cores,
        ram_gb,
        storage_gb,
        gpu,
        region,
        created_at,
        updated_at,
        gcp_instance_id,
        gcp_zone,
        gcp_machine_type,
        gcp_project_id,
        gcp_external_ip,
        error_message
      FROM instances 
      WHERE user_email = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [email]);
    const allInstances = result.rows.map(transformInstanceRow);

    // If no instances, still check for backup costs
    if (allInstances.length === 0) {
      const backupCosts = await calculateBackupCosts(email);
      
      return {
        totalHours: 0,
        totalCost: backupCosts.totalBackupStorageCost,
        totalComputeCost: 0,
        totalStorageCost: backupCosts.totalBackupStorageCost,
        averageCostPerDesktop: 0,
        activeDesktops: 0,
        usageByInstance: [],
        backupStorageCost: backupCosts.totalBackupStorageCost,
        backupStorageGb: backupCosts.totalBackupStorageGb,
        backupCount: backupCosts.backupCount
      };
    }

    // Pricing configuration (matching frontend pricing.ts)
    // All prices in IDR (Indonesian Rupiah) - Conversion rate: 1 USD = 16,600 IDR
    const PRICING_CONFIG = {
      basePerCpuPerHour: 788.5, // Rp 788.5 per vCPU per hour (0.0475 USD * 16600)
      basePerRamGbPerHour: 107.9, // Rp 107.9 per GB RAM per hour (0.0065 USD * 16600)
      basePerStorageGbPerHour: 2.324, // Rp 2.324 per GB storage per hour (~Rp 1,660/GB/month)
      gpuExtraPerHour: {
        NONE: 0.0,
        T4: 5810,           // Entry-level ML/inference (0.35 USD * 16600)
        V100: 41168,        // Professional deep learning (2.48 USD * 16600)
        A10: 29880,         // Professional graphics/AI (1.80 USD * 16600)
        A100: 60922,        // Enterprise AI training (3.67 USD * 16600)
        H100: 132800,       // Next-gen enterprise AI (8.00 USD * 16600)
        RTX_4090: 46480,    // Workstation rendering (2.80 USD * 16600)
        RTX_A6000: 53120,   // Professional visualization (3.20 USD * 16600)
      },
      markupRate: 1.0,
    };

    /**
     * Calculate hourly costs for an instance (split into compute and storage)
     */
    const calculateHourlyCost = (instance) => {
      // Compute costs: CPU + RAM + GPU
      const cpuCost = instance.cpuCores * PRICING_CONFIG.basePerCpuPerHour;
      const ramCost = instance.ramGb * PRICING_CONFIG.basePerRamGbPerHour;
      const gpuCost = PRICING_CONFIG.gpuExtraPerHour[instance.gpu] || 0;
      const computeHourlyRate = (cpuCost + ramCost + gpuCost) * PRICING_CONFIG.markupRate;

      // Storage costs: Disk only
      const storageHourlyRate = instance.storageGb * PRICING_CONFIG.basePerStorageGbPerHour * PRICING_CONFIG.markupRate;

      // Total hourly rate
      const totalHourlyRate = computeHourlyRate + storageHourlyRate;

      return {
        computeHourlyRate: Math.round(computeHourlyRate * 100) / 100,
        storageHourlyRate: Math.round(storageHourlyRate * 100) / 100,
        totalHourlyRate: Math.round(totalHourlyRate * 100) / 100
      };
    };

    /**
     * Calculate billable hours for an instance
     * For DELETED instances: from created_at to updated_at (deletion time)
     * For active instances: from created_at to now
     */
    const calculateBillableHours = (instance) => {
      const created = new Date(instance.createdAt);
      const endTime = instance.status === 'DELETED' 
        ? new Date(instance.updatedAt)  // Use deletion time for deleted instances
        : new Date();  // Use current time for active instances
      
      const diffMs = endTime - created;
      const diffHours = diffMs / (1000 * 60 * 60);
      return Math.max(0, Math.round(diffHours * 100) / 100); // Round to 2 decimal places
    };

    // Calculate usage for each instance
    let totalHours = 0;
    let totalCost = 0;
    let totalComputeCost = 0;
    let totalStorageCost = 0;
    const usageByInstance = [];

    for (const instance of allInstances) {
      const costs = calculateHourlyCost(instance);
      const hours = calculateBillableHours(instance);
      
      // Calculate separate compute and storage costs
      const computeCost = Math.round(costs.computeHourlyRate * hours * 100) / 100;
      const storageCost = Math.round(costs.storageHourlyRate * hours * 100) / 100;
      const estimatedCost = Math.round(costs.totalHourlyRate * hours * 100) / 100;

      totalHours += hours;
      totalCost += estimatedCost;
      totalComputeCost += computeCost;
      totalStorageCost += storageCost;

      usageByInstance.push({
        instanceId: instance.id,
        instanceName: instance.name,
        status: instance.status,
        hours: hours,
        computeHourlyRate: costs.computeHourlyRate,
        storageHourlyRate: costs.storageHourlyRate,
        avgHourlyRate: costs.totalHourlyRate,  // Backward compatibility
        computeCost: computeCost,
        storageCost: storageCost,
        estimatedCost: estimatedCost  // Backward compatibility
      });
    }

    // Count active desktops (RUNNING or PROVISIONING) - exclude DELETED and STOPPED
    const activeDesktops = allInstances.filter(
      inst => inst.status === 'RUNNING' || inst.status === 'PROVISIONING'
    ).length;

    // Calculate average cost per desktop (only for instances that have accumulated cost)
    const averageCostPerDesktop = allInstances.length > 0 
      ? Math.round((totalCost / allInstances.length) * 100) / 100 
      : 0;

    // Calculate backup storage costs
    const backupCosts = await calculateBackupCosts(email);
    
    // Add backup storage costs to total cost
    totalCost += backupCosts.totalBackupStorageCost;
    totalStorageCost += backupCosts.totalBackupStorageCost;

    // Round totals
    totalHours = Math.round(totalHours * 100) / 100;
    totalCost = Math.round(totalCost * 100) / 100;
    totalComputeCost = Math.round(totalComputeCost * 100) / 100;
    totalStorageCost = Math.round(totalStorageCost * 100) / 100;

    return {
      totalHours,
      totalCost,
      totalComputeCost,
      totalStorageCost,
      averageCostPerDesktop,
      activeDesktops,
      usageByInstance,
      // Add backup costs as separate line item in breakdown
      backupStorageCost: backupCosts.totalBackupStorageCost,
      backupStorageGb: backupCosts.totalBackupStorageGb,
      backupCount: backupCosts.backupCount
    };
  } catch (error) {
    console.error('Error calculating usage summary:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Get user preferences
 * @param {string} email - User email
 * @returns {Promise<object|null>} - User preferences object or null if not found
 */
const getUserPreferences = async (email) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      SELECT 
        user_email,
        theme,
        accent_color,
        created_at,
        updated_at
      FROM user_preferences 
      WHERE user_email = $1
    `;

    const result = await pool.query(query, [email]);
    
    // Return null if preferences not found
    if (result.rows.length === 0) {
      return null;
    }

    // Transform snake_case to camelCase
    const row = result.rows[0];
    return {
      userEmail: row.user_email,
      theme: row.theme,
      accentColor: row.accent_color,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (error) {
    console.error('Error getting user preferences:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Update user preferences (creates if doesn't exist)
 * @param {string} email - User email
 * @param {object} preferencesData - Preferences to update
 * @param {string} [preferencesData.theme] - Theme preference (light, dark, system)
 * @param {string} [preferencesData.accentColor] - Accent color hex code
 * @returns {Promise<object>} - Updated preferences object
 */
const updateUserPreferences = async (email, preferencesData) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Use INSERT ... ON CONFLICT to upsert preferences
    // This creates a new record if none exists, or updates if it does
    const query = `
      INSERT INTO user_preferences (user_email, theme, accent_color, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_email) 
      DO UPDATE SET
        theme = COALESCE($2, user_preferences.theme),
        accent_color = COALESCE($3, user_preferences.accent_color),
        updated_at = CURRENT_TIMESTAMP
      RETURNING 
        user_email,
        theme,
        accent_color,
        created_at,
        updated_at
    `;

    const values = [
      email,
      preferencesData.theme || null,
      preferencesData.accentColor || null
    ];

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to update user preferences');
    }

    // Transform snake_case to camelCase
    const row = result.rows[0];
    return {
      userEmail: row.user_email,
      theme: row.theme,
      accentColor: row.accent_color,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (error) {
    console.error('Error updating user preferences:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Update user profile information
 * @param {string} email - User email
 * @param {object} profileData - Profile data to update
 * @param {string} [profileData.name] - User's display name
 * @returns {Promise<object>} - Updated user object
 */
const updateUserProfile = async (email, profileData) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Validate that name is provided and not empty
    if (!profileData.name || profileData.name.trim() === '') {
      throw new Error('Name cannot be empty');
    }

    const query = `
      UPDATE approved_users 
      SET 
        name = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = $2
      RETURNING email, name, updated_at
    `;

    const result = await pool.query(query, [profileData.name.trim(), email]);
    
    if (result.rows.length === 0) {
      throw new Error(`User with email ${email} not found in approved_users table`);
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating user profile:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Transform database row from snake_case to camelCase for passkey data
 * @param {object} row - Database row with snake_case fields
 * @returns {object} - Transformed object with camelCase fields
 */
const transformPasskeyRow = (row) => {
  if (!row) return null;
  
  return {
    id: row.id,
    userEmail: row.user_email,
    credentialId: row.credential_id,
    publicKey: row.public_key,
    counter: parseInt(row.counter, 10),
    aaguid: row.aaguid,
    transports: row.transports || [],
    authenticatorType: row.authenticator_type,
    friendlyName: row.friendly_name,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

/**
 * Transform database row from snake_case to camelCase for backup data
 * @param {object} row - Database row with snake_case fields
 * @returns {object} - Transformed object with camelCase fields
 */
const transformBackupRow = (row) => {
  if (!row) return null;
  
  // Calculate storageGb from storageBytes (handle null values)
  const storageGb = row.storage_bytes !== null && row.storage_bytes !== undefined
    ? Math.round((row.storage_bytes / (1024 ** 3)) * 100) / 100  // Convert bytes to GB, round to 2 decimals
    : null;
  
  return {
    id: row.id,
    userEmail: row.user_email,
    instanceId: row.instance_id,
    name: row.name,
    gcpMachineImageName: row.gcp_machine_image_name,
    sourceInstanceName: row.source_instance_name,
    sourceInstanceZone: row.source_instance_zone,
    storageBytes: row.storage_bytes,
    storageGb: storageGb,
    status: row.status,
    errorMessage: row.error_message || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

/**
 * Create a new passkey credential
 * @param {string} userEmail - User email
 * @param {object} passkeyData - Passkey credential data
 * @param {string} passkeyData.credentialId - WebAuthn credential ID (base64url encoded)
 * @param {string} passkeyData.publicKey - Public key (base64url encoded)
 * @param {number} passkeyData.counter - Initial signature counter
 * @param {string} passkeyData.aaguid - Authenticator AAGUID
 * @param {string[]} passkeyData.transports - Transport types (usb, nfc, ble, internal)
 * @param {string} passkeyData.authenticatorType - 'platform' or 'cross-platform'
 * @param {string} [passkeyData.friendlyName] - Optional user-defined name
 * @returns {Promise<object>} - Created passkey object
 */
/**
 * Validate and sanitize friendly name for passkeys
 * @param {string} name - The friendly name to validate
 * @param {boolean} throwOnError - Whether to throw errors or return null
 * @returns {string|null} - Sanitized name or null if invalid/empty
 * @throws {Error} - If throwOnError is true and validation fails
 */
const validateFriendlyName = (name, throwOnError = false) => {
  // Reject empty names
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    if (throwOnError) {
      throw new Error('Friendly name cannot be empty');
    }
    return null;
  }

  // Trim whitespace
  let sanitized = name.trim();

  // Reject names exceeding 100 characters
  if (sanitized.length > 100) {
    if (throwOnError) {
      throw new Error('Friendly name cannot exceed 100 characters');
    }
    return null;
  }

  // Sanitize special characters - allow alphanumeric, spaces, hyphens, underscores, and common punctuation
  // Remove control characters and other potentially problematic characters
  sanitized = sanitized.replace(/[^\w\s\-.,!?()&@#]/g, '');

  // Collapse multiple spaces into single space
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // If sanitization resulted in empty string, reject
  if (sanitized.length === 0) {
    if (throwOnError) {
      throw new Error('Friendly name cannot contain only special characters');
    }
    return null;
  }

  return sanitized;
};

const createPasskey = async (userEmail, passkeyData) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Generate unique passkey ID
    const passkeyId = `pk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Validate and sanitize friendly name, or generate default if not provided/invalid
    const validatedName = validateFriendlyName(passkeyData.friendlyName);
    const friendlyName = validatedName || 
      `${passkeyData.authenticatorType === 'platform' ? 'Platform' : 'Security Key'} - ${new Date().toLocaleDateString()}`;

    const query = `
      INSERT INTO passkeys (
        id,
        user_email,
        credential_id,
        public_key,
        counter,
        aaguid,
        transports,
        authenticator_type,
        friendly_name,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING 
        id,
        user_email,
        credential_id,
        public_key,
        counter,
        aaguid,
        transports,
        authenticator_type,
        friendly_name,
        last_used_at,
        created_at,
        updated_at
    `;

    const values = [
      passkeyId,
      userEmail,
      passkeyData.credentialId,
      passkeyData.publicKey,
      passkeyData.counter || 0,
      passkeyData.aaguid || null,
      passkeyData.transports || [],
      passkeyData.authenticatorType,
      friendlyName
    ];

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to create passkey');
    }
    
    return transformPasskeyRow(result.rows[0]);
  } catch (error) {
    console.error('Error creating passkey:', error.message);
    
    // Check for duplicate credential_id constraint violation
    if (error.code === '23505' && error.constraint === 'passkeys_credential_id_key') {
      throw new Error('A passkey with this credential ID already exists');
    }
    
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Get all passkeys for a user
 * @param {string} userEmail - User email
 * @returns {Promise<Array>} - Array of passkey objects
 */
const getPasskeysByUser = async (userEmail) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      SELECT 
        id,
        user_email,
        credential_id,
        public_key,
        counter,
        aaguid,
        transports,
        authenticator_type,
        friendly_name,
        last_used_at,
        created_at,
        updated_at
      FROM passkeys 
      WHERE user_email = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userEmail]);
    
    return result.rows.map(transformPasskeyRow);
  } catch (error) {
    console.error('Error getting passkeys by user:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Get a passkey by credential ID
 * @param {string} credentialId - WebAuthn credential ID
 * @returns {Promise<object|null>} - Passkey object or null if not found
 */
const getPasskeyByCredentialId = async (credentialId) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      SELECT 
        id,
        user_email,
        credential_id,
        public_key,
        counter,
        aaguid,
        transports,
        authenticator_type,
        friendly_name,
        last_used_at,
        created_at,
        updated_at
      FROM passkeys 
      WHERE credential_id = $1
    `;

    const result = await pool.query(query, [credentialId]);
    
    return result.rows.length > 0 ? transformPasskeyRow(result.rows[0]) : null;
  } catch (error) {
    console.error('Error getting passkey by credential ID:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Update passkey signature counter
 * @param {string} credentialId - WebAuthn credential ID
 * @param {number} counter - New counter value
 * @returns {Promise<object>} - Updated passkey object
 */
const updatePasskeyCounter = async (credentialId, counter) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      UPDATE passkeys 
      SET 
        counter = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE credential_id = $2
      RETURNING 
        id,
        user_email,
        credential_id,
        public_key,
        counter,
        aaguid,
        transports,
        authenticator_type,
        friendly_name,
        last_used_at,
        created_at,
        updated_at
    `;

    const result = await pool.query(query, [counter, credentialId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Passkey with credential ID ${credentialId} not found`);
    }
    
    return transformPasskeyRow(result.rows[0]);
  } catch (error) {
    console.error('Error updating passkey counter:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Update passkey last used timestamp
 * @param {string} credentialId - WebAuthn credential ID
 * @returns {Promise<object>} - Updated passkey object
 */
const updatePasskeyLastUsed = async (credentialId) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      UPDATE passkeys 
      SET 
        last_used_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE credential_id = $1
      RETURNING 
        id,
        user_email,
        credential_id,
        public_key,
        counter,
        aaguid,
        transports,
        authenticator_type,
        friendly_name,
        last_used_at,
        created_at,
        updated_at
    `;

    const result = await pool.query(query, [credentialId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Passkey with credential ID ${credentialId} not found`);
    }
    
    return transformPasskeyRow(result.rows[0]);
  } catch (error) {
    console.error('Error updating passkey last used:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Update passkey friendly name
 * @param {string} id - Passkey ID
 * @param {string} name - New friendly name
 * @returns {Promise<object>} - Updated passkey object
 */
const updatePasskeyName = async (id, name) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Validate and sanitize the friendly name (throws on error)
    const sanitizedName = validateFriendlyName(name, true);

    const query = `
      UPDATE passkeys 
      SET 
        friendly_name = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING 
        id,
        user_email,
        credential_id,
        public_key,
        counter,
        aaguid,
        transports,
        authenticator_type,
        friendly_name,
        last_used_at,
        created_at,
        updated_at
    `;

    const result = await pool.query(query, [sanitizedName, id]);
    
    if (result.rows.length === 0) {
      throw new Error(`Passkey with id ${id} not found`);
    }
    
    return transformPasskeyRow(result.rows[0]);
  } catch (error) {
    console.error('Error updating passkey name:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Delete a passkey
 * @param {string} id - Passkey ID
 * @param {string} userEmail - User email (for ownership verification)
 * @returns {Promise<object>} - Deleted passkey object
 */
const deletePasskey = async (id, userEmail) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Delete and return the passkey, but only if it belongs to the user
    const query = `
      DELETE FROM passkeys 
      WHERE id = $1 AND user_email = $2
      RETURNING 
        id,
        user_email,
        credential_id,
        public_key,
        counter,
        aaguid,
        transports,
        authenticator_type,
        friendly_name,
        last_used_at,
        created_at,
        updated_at
    `;

    const result = await pool.query(query, [id, userEmail]);
    
    if (result.rows.length === 0) {
      throw new Error(`Passkey with id ${id} not found or does not belong to user`);
    }
    
    const deletedPasskey = transformPasskeyRow(result.rows[0]);
    
    // Check if user has any remaining passkeys
    const remainingPasskeys = await getPasskeysByUser(userEmail);
    
    // If no passkeys remain, automatically disable 2FA
    if (remainingPasskeys.length === 0) {
      await set2FAStatus(userEmail, false);
    }
    
    return deletedPasskey;
  } catch (error) {
    console.error('Error deleting passkey:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Get user's 2FA status
 * @param {string} userEmail - User email
 * @returns {Promise<object>} - Object with enabled boolean
 */
const get2FAStatus = async (userEmail) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      SELECT passkey_2fa_enabled
      FROM approved_users 
      WHERE email = $1
    `;

    const result = await pool.query(query, [userEmail]);
    
    if (result.rows.length === 0) {
      throw new Error(`User with email ${userEmail} not found`);
    }
    
    return {
      enabled: result.rows[0].passkey_2fa_enabled || false
    };
  } catch (error) {
    console.error('Error getting 2FA status:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Set user's 2FA status
 * @param {string} userEmail - User email
 * @param {boolean} enabled - Whether to enable or disable 2FA
 * @returns {Promise<object>} - Object with enabled boolean
 */
const set2FAStatus = async (userEmail, enabled) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // If enabling 2FA, verify user has at least one passkey
    if (enabled) {
      const passkeys = await getPasskeysByUser(userEmail);
      if (passkeys.length === 0) {
        throw new Error('Cannot enable 2FA: user must have at least one enrolled passkey');
      }
    }

    const query = `
      UPDATE approved_users 
      SET 
        passkey_2fa_enabled = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = $2
      RETURNING passkey_2fa_enabled
    `;

    const result = await pool.query(query, [enabled, userEmail]);
    
    if (result.rows.length === 0) {
      throw new Error(`User with email ${userEmail} not found`);
    }
    
    return {
      enabled: result.rows[0].passkey_2fa_enabled
    };
  } catch (error) {
    console.error('Error setting 2FA status:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Store a WebAuthn challenge
 * @param {string} challenge - Base64url encoded challenge string
 * @param {string|null} userEmail - User email (nullable for authentication)
 * @param {string} type - Challenge type: 'registration' or 'authentication'
 * @param {Date} expiresAt - Expiration timestamp
 * @returns {Promise<object>} - Created challenge object
 */
const storeChallenge = async (challenge, userEmail, type, expiresAt) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Validate type
    if (!['registration', 'authentication'].includes(type)) {
      throw new Error('Challenge type must be either "registration" or "authentication"');
    }

    const query = `
      INSERT INTO webauthn_challenges (
        challenge,
        user_email,
        type,
        expires_at,
        created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING 
        id,
        challenge,
        user_email,
        type,
        expires_at,
        created_at
    `;

    const values = [
      challenge,
      userEmail,
      type,
      expiresAt
    ];

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to store challenge');
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      challenge: row.challenge,
      userEmail: row.user_email,
      type: row.type,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    };
  } catch (error) {
    console.error('Error storing challenge:', error.message);
    
    // Check for duplicate challenge constraint violation
    if (error.code === '23505' && error.constraint === 'webauthn_challenges_challenge_key') {
      throw new Error('A challenge with this value already exists');
    }
    
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Get a challenge by its value
 * @param {string} challenge - Base64url encoded challenge string
 * @returns {Promise<object|null>} - Challenge object or null if not found or expired
 */
const getChallenge = async (challenge) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      SELECT 
        id,
        challenge,
        user_email,
        type,
        expires_at,
        created_at
      FROM webauthn_challenges 
      WHERE challenge = $1 AND expires_at > CURRENT_TIMESTAMP
    `;

    const result = await pool.query(query, [challenge]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      challenge: row.challenge,
      userEmail: row.user_email,
      type: row.type,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    };
  } catch (error) {
    console.error('Error getting challenge:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Delete a challenge by its value
 * @param {string} challenge - Base64url encoded challenge string
 * @returns {Promise<boolean>} - True if challenge was deleted, false if not found
 */
const deleteChallenge = async (challenge) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      DELETE FROM webauthn_challenges 
      WHERE challenge = $1
      RETURNING id
    `;

    const result = await pool.query(query, [challenge]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting challenge:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Clean up expired challenges
 * @returns {Promise<number>} - Number of challenges deleted
 */
const cleanupExpiredChallenges = async () => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      DELETE FROM webauthn_challenges 
      WHERE expires_at <= CURRENT_TIMESTAMP
      RETURNING id
    `;

    const result = await pool.query(query);
    
    const deletedCount = result.rows.length;
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired challenge(s)`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired challenges:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Create a new backup record
 * @param {string} userEmail - User email
 * @param {string} instanceId - Source instance ID
 * @param {object} backupData - Backup configuration
 * @param {string} backupData.name - User-defined backup name
 * @param {string} backupData.gcpMachineImageName - GCP machine image name
 * @param {string} backupData.sourceInstanceName - Source instance name
 * @param {string} backupData.sourceInstanceZone - Source instance zone
 * @returns {Promise<object>} - Created backup object
 */
const createBackup = async (userEmail, instanceId, backupData) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Generate unique backup ID (format: bak-{timestamp}-{random})
    const backupId = `bak-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const query = `
      INSERT INTO backups (
        id,
        user_email,
        instance_id,
        name,
        gcp_machine_image_name,
        source_instance_name,
        source_instance_zone,
        storage_bytes,
        status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING 
        id,
        user_email,
        instance_id,
        name,
        gcp_machine_image_name,
        source_instance_name,
        source_instance_zone,
        storage_bytes,
        status,
        error_message,
        created_at,
        updated_at
    `;

    const values = [
      backupId,
      userEmail,
      instanceId,
      backupData.name,
      backupData.gcpMachineImageName,
      backupData.sourceInstanceName,
      backupData.sourceInstanceZone,
      null, // storage_bytes - will be updated after backup completes
      'CREATING' // Initial status
    ];

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to create backup');
    }
    
    return transformBackupRow(result.rows[0]);
  } catch (error) {
    console.error('Error creating backup:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Get all backups for a user
 * @param {string} userEmail - User email
 * @returns {Promise<Array>} - Array of backup objects
 */
const getBackupsByUser = async (userEmail) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      SELECT 
        id,
        user_email,
        instance_id,
        name,
        gcp_machine_image_name,
        source_instance_name,
        source_instance_zone,
        storage_bytes,
        status,
        error_message,
        created_at,
        updated_at
      FROM backups 
      WHERE user_email = $1 AND status != 'DELETED'
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userEmail]);
    
    return result.rows.map(transformBackupRow);
  } catch (error) {
    console.error('Error getting backups by user:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Get backup by ID
 * @param {string} id - Backup ID
 * @returns {Promise<object|null>} - Backup object or null if not found
 */
const getBackupById = async (id) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      SELECT 
        id,
        user_email,
        instance_id,
        name,
        gcp_machine_image_name,
        source_instance_name,
        source_instance_zone,
        storage_bytes,
        status,
        error_message,
        created_at,
        updated_at
      FROM backups 
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    
    // Return null if backup not found, otherwise return the transformed backup object
    return result.rows.length > 0 ? transformBackupRow(result.rows[0]) : null;
  } catch (error) {
    console.error('Error getting backup by ID:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Validate backup status transition
 * Valid transitions: CREATING → COMPLETED, CREATING → ERROR, COMPLETED → DELETED, ERROR → DELETED
 * @param {string} currentStatus - Current backup status
 * @param {string} newStatus - New backup status
 * @returns {boolean} - True if transition is valid
 */
const isValidStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    'CREATING': ['COMPLETED', 'ERROR'],
    'COMPLETED': ['DELETED'],
    'ERROR': ['DELETED'],
    'DELETED': [] // No transitions from DELETED
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Update backup status and metadata
 * @param {string} id - Backup ID
 * @param {string} status - New status
 * @param {number|null} storageBytes - Storage size in bytes (optional)
 * @param {string|null} errorMessage - Error message (optional)
 * @returns {Promise<object>} - Updated backup object
 */
const updateBackupStatus = async (id, status, storageBytes = null, errorMessage = null) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Validate status
    const validStatuses = ['CREATING', 'COMPLETED', 'ERROR', 'DELETED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Get current backup to validate status transition
    const currentBackup = await getBackupById(id);
    if (!currentBackup) {
      throw new Error(`Backup with id ${id} not found`);
    }

    // Validate status transition
    if (!isValidStatusTransition(currentBackup.status, status)) {
      throw new Error(`Invalid status transition from ${currentBackup.status} to ${status}`);
    }

    const query = `
      UPDATE backups 
      SET 
        status = $1,
        storage_bytes = COALESCE($2, storage_bytes),
        error_message = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING 
        id,
        user_email,
        instance_id,
        name,
        gcp_machine_image_name,
        source_instance_name,
        source_instance_zone,
        storage_bytes,
        status,
        error_message,
        created_at,
        updated_at
    `;

    const result = await pool.query(query, [status, storageBytes, errorMessage, id]);
    
    if (result.rows.length === 0) {
      throw new Error(`Failed to update backup with id ${id}`);
    }
    
    return transformBackupRow(result.rows[0]);
  } catch (error) {
    console.error('Error updating backup status:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Delete backup (soft delete by setting status to DELETED)
 * @param {string} id - Backup ID
 * @returns {Promise<object>} - Updated backup object with DELETED status
 */
const deleteBackup = async (id) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Get current backup to validate status transition
    const currentBackup = await getBackupById(id);
    if (!currentBackup) {
      throw new Error(`Backup with id ${id} not found`);
    }

    // Validate status transition to DELETED
    if (!isValidStatusTransition(currentBackup.status, 'DELETED')) {
      throw new Error(`Invalid status transition from ${currentBackup.status} to DELETED`);
    }

    const query = `
      UPDATE backups 
      SET 
        status = 'DELETED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING 
        id,
        user_email,
        instance_id,
        name,
        gcp_machine_image_name,
        source_instance_name,
        source_instance_zone,
        storage_bytes,
        status,
        error_message,
        created_at,
        updated_at
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error(`Failed to delete backup with id ${id}`);
    }
    
    return transformBackupRow(result.rows[0]);
  } catch (error) {
    console.error('Error deleting backup:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Calculate backup storage costs for usage summary
 * @param {string} userEmail - User email
 * @returns {Promise<object>} - Backup cost summary with totalBackupStorageCost, totalBackupStorageGb, backupCount, costByBackup
 */
const calculateBackupCosts = async (userEmail) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    // Query ALL user backups including DELETED ones for historical costs
    const query = `
      SELECT 
        id,
        user_email,
        instance_id,
        name,
        gcp_machine_image_name,
        source_instance_name,
        source_instance_zone,
        storage_bytes,
        status,
        error_message,
        created_at,
        updated_at
      FROM backups 
      WHERE user_email = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userEmail]);
    const allBackups = result.rows.map(transformBackupRow);

    // If no backups, return zero summary
    if (allBackups.length === 0) {
      return {
        totalBackupStorageCost: 0,
        totalBackupStorageGb: 0,
        backupCount: 0,
        costByBackup: []
      };
    }

    // Pricing configuration - storage cost per GiB-hour in IDR
    // Based on pricing: Rp 1,200 per GiB per month
    // Monthly rate / 730 hours = 1200 / 730 ≈ 1.64 IDR per GiB-hour
    const STORAGE_RATE_PER_GB_HOUR = 1.64; // IDR per GiB per hour

    /**
     * Calculate hours elapsed since backup creation
     * For DELETED backups: from created_at to updated_at (deletion time)
     * For active backups: from created_at to now
     */
    const calculateHoursElapsed = (backup) => {
      const created = new Date(backup.createdAt);
      const endTime = backup.status === 'DELETED' 
        ? new Date(backup.updatedAt)  // Use deletion time for deleted backups
        : new Date();  // Use current time for active backups
      
      const diffMs = endTime - created;
      const diffHours = diffMs / (1000 * 60 * 60);
      return Math.max(0, diffHours); // Ensure non-negative
    };

    /**
     * Calculate cost for a single backup
     * Formula: storageGb × hours × rate
     */
    const calculateBackupCost = (backup) => {
      // If storage size is not yet available (backup still creating), cost is 0
      if (backup.storageGb === null || backup.storageGb === undefined) {
        return 0;
      }

      const hours = calculateHoursElapsed(backup);
      const cost = backup.storageGb * hours * STORAGE_RATE_PER_GB_HOUR;
      return Math.round(cost * 100) / 100; // Round to 2 decimal places
    };

    // Calculate costs for each backup
    let totalBackupStorageCost = 0;
    let totalBackupStorageGb = 0;
    const costByBackup = [];

    for (const backup of allBackups) {
      const cost = calculateBackupCost(backup);
      const storageGb = backup.storageGb || 0;

      totalBackupStorageCost += cost;
      totalBackupStorageGb += storageGb;

      costByBackup.push({
        backupId: backup.id,
        backupName: backup.name,
        storageGb: storageGb,
        cost: cost
      });
    }

    // Round totals
    totalBackupStorageCost = Math.round(totalBackupStorageCost * 100) / 100;
    totalBackupStorageGb = Math.round(totalBackupStorageGb * 100) / 100;

    return {
      totalBackupStorageCost,
      totalBackupStorageGb,
      backupCount: allBackups.length,
      costByBackup
    };
  } catch (error) {
    console.error('Error calculating backup costs:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Disconnect from the database and close the connection pool
 */
const disconnect = async () => {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      console.log('Database connection pool closed');
    } catch (error) {
      console.error('Error closing database connection:', error.message);
      throw error;
    }
  }
};

module.exports = {
  connect,
  isEmailApproved,
  updateLastLogin,
  getInstancesByUser,
  createInstance,
  updateInstanceStatus,
  updateInstanceGcpMetadata,
  deleteInstance,
  getInstanceById,
  calculateUsageSummary,
  getUserPreferences,
  updateUserPreferences,
  updateUserProfile,
  // Passkey methods
  createPasskey,
  getPasskeysByUser,
  getPasskeyByCredentialId,
  updatePasskeyCounter,
  updatePasskeyLastUsed,
  updatePasskeyName,
  deletePasskey,
  get2FAStatus,
  set2FAStatus,
  // Challenge methods
  storeChallenge,
  getChallenge,
  deleteChallenge,
  cleanupExpiredChallenges,
  // Backup methods
  createBackup,
  getBackupsByUser,
  getBackupById,
  updateBackupStatus,
  deleteBackup,
  calculateBackupCosts,
  disconnect,
  // Test exports
  __testExports: {
    validateFriendlyName,
    transformBackupRow,
    isValidStatusTransition
  }
};
