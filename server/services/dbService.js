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

    // If no instances, return zero summary
    if (allInstances.length === 0) {
      return {
        totalHours: 0,
        totalCost: 0,
        totalComputeCost: 0,
        totalStorageCost: 0,
        averageCostPerDesktop: 0,
        activeDesktops: 0,
        usageByInstance: []
      };
    }

    // Pricing configuration (matching frontend pricing.ts)
    const PRICING_CONFIG = {
      basePerCpuPerHour: 0.04,
      basePerRamGbPerHour: 0.01,
      basePerStorageGbPerHour: 0.001,
      gpuExtraPerHour: {
        NONE: 0.0,
        T4: 0.50,
        V100: 2.50,
        A10: 1.80,
        A100: 4.00,
        H100: 8.00,
        RTX_4090: 2.80,
        RTX_A6000: 3.20,
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
      usageByInstance
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
  deleteInstance,
  getInstanceById,
  calculateUsageSummary,
  getUserPreferences,
  updateUserPreferences,
  updateUserProfile,
  disconnect
};
