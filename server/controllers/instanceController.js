const dbService = require('../services/dbService');

/**
 * Instance controller - handles instance management business logic
 */

/**
 * Get all instances for authenticated user
 * @route GET /api/instances
 * @returns {Array<Instance>} User's instances
 */
const getInstances = async (req, res, next) => {
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

    // Call dbService to get instances for this user
    let instances;
    try {
      instances = await dbService.getInstancesByUser(email);
    } catch (error) {
      console.error('Database error during getInstancesByUser:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Return instances array with 200 status
    return res.status(200).json({
      success: true,
      instances
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in getInstances controller:', error);
    next(error);
  }
};

/**
 * Create new instance
 * @route POST /api/instances
 * @body {CreateInstanceInput} Instance configuration
 * @returns {Instance} Created instance with 201 status
 */
const createInstance = async (req, res, next) => {
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
    const { name, imageId, cpuCores, ramGb, storageGb, gpu, region } = req.body;

    // Check for required fields
    const requiredFields = ['name', 'imageId', 'cpuCores', 'ramGb', 'storageGb', 'gpu', 'region'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate field types and values
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Instance name must be a non-empty string'
      });
    }

    if (typeof imageId !== 'string' || imageId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Image ID must be a non-empty string'
      });
    }

    if (typeof cpuCores !== 'number' || cpuCores <= 0 || !Number.isInteger(cpuCores)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'CPU cores must be a positive integer'
      });
    }

    if (typeof ramGb !== 'number' || ramGb <= 0 || !Number.isInteger(ramGb)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'RAM must be a positive integer (in GB)'
      });
    }

    if (typeof storageGb !== 'number' || storageGb <= 0 || !Number.isInteger(storageGb)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Storage must be a positive integer (in GB)'
      });
    }

    if (typeof gpu !== 'string' || gpu.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'GPU type must be a non-empty string'
      });
    }

    // Validate GPU type against allowed values
    const validGpuTypes = ['NONE', 'T4', 'V100', 'A10', 'A100', 'H100', 'RTX_4090', 'RTX_A6000'];
    if (!validGpuTypes.includes(gpu)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Invalid GPU type. Must be one of: ${validGpuTypes.join(', ')}`
      });
    }

    if (typeof region !== 'string' || region.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Region must be a non-empty string'
      });
    }

    // Prepare instance data for database
    const instanceData = {
      name: name.trim(),
      imageId: imageId.trim(),
      cpuCores,
      ramGb,
      storageGb,
      gpu,
      region: region.trim()
    };

    // Call dbService to create instance
    let createdInstance;
    try {
      createdInstance = await dbService.createInstance(email, instanceData);
    } catch (error) {
      console.error('Database error during createInstance:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Auto-transition from PROVISIONING to RUNNING after 3-5 seconds
    const transitionDelay = 3000 + Math.random() * 2000;
    console.log(`Scheduling auto-transition for instance ${createdInstance.id} in ${Math.round(transitionDelay)}ms`);
    
    setTimeout(async () => {
      try {
        console.log(`Starting auto-transition for instance ${createdInstance.id}`);
        await dbService.updateInstanceStatus(createdInstance.id, 'RUNNING');
        console.log(`✓ Instance ${createdInstance.id} successfully transitioned to RUNNING`);
      } catch (error) {
        console.error(`✗ Failed to auto-transition instance ${createdInstance.id}:`, error);
      }
    }, transitionDelay);

    // Return created instance with 201 status
    return res.status(201).json({
      success: true,
      instance: createdInstance
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in createInstance controller:', error);
    next(error);
  }
};

/**
 * Update instance status
 * @route PATCH /api/instances/:id/status
 * @body {string} status - New status
 * @returns {Instance} Updated instance with 200 status
 */
const updateStatus = async (req, res, next) => {
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

    // Extract instance ID from URL params
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Instance ID is required'
      });
    }

    // Extract new status from request body
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Status is required in request body'
      });
    }

    // Validate status value
    const validStatuses = ['PROVISIONING', 'RUNNING', 'STOPPED', 'DELETED', 'ERROR'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Validate instance ownership - get instance first
    let instance;
    try {
      instance = await dbService.getInstanceById(id);
    } catch (error) {
      console.error('Database error during getInstanceById:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Check if instance exists
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Instance not found'
      });
    }

    // Check if instance belongs to the authenticated user
    if (instance.userEmail !== email) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to modify this instance'
      });
    }

    // Validate status transition
    const currentStatus = instance.status;
    
    // Define valid status transitions
    const validTransitions = {
      'PROVISIONING': ['RUNNING', 'ERROR', 'DELETED'],
      'RUNNING': ['STOPPED', 'ERROR', 'DELETED'],
      'STOPPED': ['RUNNING', 'DELETED'],
      'ERROR': ['RUNNING', 'DELETED'],
      'DELETED': [] // Cannot transition from DELETED
    };

    // Check if transition is valid
    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Invalid status transition from ${currentStatus} to ${status}`
      });
    }

    // Call dbService to update instance status
    let updatedInstance;
    try {
      updatedInstance = await dbService.updateInstanceStatus(id, status);
    } catch (error) {
      console.error('Database error during updateInstanceStatus:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Return updated instance with 200 status
    return res.status(200).json({
      success: true,
      instance: updatedInstance
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in updateStatus controller:', error);
    next(error);
  }
};

/**
 * Delete instance (soft delete)
 * @route DELETE /api/instances/:id
 * @returns {Object} Success message with 200 status
 */
const deleteInstance = async (req, res, next) => {
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

    // Extract instance ID from URL params
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Instance ID is required'
      });
    }

    // Validate instance ownership - get instance first
    let instance;
    try {
      instance = await dbService.getInstanceById(id);
    } catch (error) {
      console.error('Database error during getInstanceById:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Check if instance exists
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Instance not found'
      });
    }

    // Check if instance belongs to the authenticated user
    if (instance.userEmail !== email) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to delete this instance'
      });
    }

    // Call dbService to delete instance (soft delete)
    try {
      await dbService.deleteInstance(id);
    } catch (error) {
      console.error('Database error during deleteInstance:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Return success message with 200 status
    return res.status(200).json({
      success: true,
      message: 'Instance deleted successfully'
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in deleteInstance controller:', error);
    next(error);
  }
};

/**
 * Get single instance by ID
 * @route GET /api/instances/:id
 * @returns {Instance} Instance details with 200 status
 */
const getInstance = async (req, res, next) => {
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

    // Extract instance ID from URL params
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Instance ID is required'
      });
    }

    // Call dbService to get instance by ID
    let instance;
    try {
      instance = await dbService.getInstanceById(id);
    } catch (error) {
      console.error('Database error during getInstanceById:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Check if instance exists
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Instance not found'
      });
    }

    // Validate instance ownership - check if instance belongs to the authenticated user
    if (instance.userEmail !== email) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this instance'
      });
    }

    // Return instance with 200 status
    return res.status(200).json({
      success: true,
      instance
    });

  } catch (error) {
    // Pass unexpected errors to error handling middleware
    console.error('Unexpected error in getInstance controller:', error);
    next(error);
  }
};

module.exports = {
  getInstances,
  createInstance,
  updateStatus,
  deleteInstance,
  getInstance
};
