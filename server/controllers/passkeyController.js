const webauthnService = require('../services/webauthnService');
const dbService = require('../services/dbService');

/**
 * Passkey Controller - handles WebAuthn passkey registration and authentication
 */

/**
 * Generate registration options for passkey enrollment
 * @route POST /api/auth/passkey/register-options
 * @param {Object} req.body.authenticatorType - 'platform' or 'cross-platform'
 * @returns {Object} WebAuthn registration options
 */
const registerOptions = async (req, res, next) => {
  try {
    const { authenticatorType } = req.body;
    const { email, name } = req.user; // From auth middleware

    // Validate authenticator type
    if (!authenticatorType || !['platform', 'cross-platform'].includes(authenticatorType)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'authenticatorType must be either "platform" or "cross-platform"'
      });
    }

    // Get existing credentials to exclude from registration
    let existingCredentials = [];
    try {
      const passkeys = await dbService.getPasskeysByUser(email);
      existingCredentials = passkeys.map(pk => ({
        credentialId: pk.credentialId,
        transports: pk.transports
      }));
    } catch (error) {
      console.error('Error fetching existing passkeys:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Generate registration options
    let options;
    try {
      options = await webauthnService.generateRegistrationOptions(
        { email, name },
        authenticatorType,
        existingCredentials
      );
    } catch (error) {
      console.error('Error generating registration options:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to generate registration options'
      });
    }

    // Store challenge with 5-minute expiration
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    try {
      await dbService.storeChallenge(
        options.challenge,
        email,
        'registration',
        expiresAt
      );
    } catch (error) {
      console.error('Error storing challenge:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to store challenge'
      });
    }

    // Return registration options to client
    return res.status(200).json({
      success: true,
      options
    });

  } catch (error) {
    console.error('Unexpected error in registerOptions controller:', error);
    next(error);
  }
};

/**
 * Verify registration response and store passkey
 * @route POST /api/auth/passkey/register-verify
 * @param {Object} req.body.credential - WebAuthn registration credential
 * @param {string} req.body.friendlyName - Optional friendly name for the passkey
 * @returns {Object} Created passkey object
 */
const registerVerify = async (req, res, next) => {
  try {
    const { credential, friendlyName } = req.body;
    const { email } = req.user; // From auth middleware

    // Validate request body
    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'credential is required'
      });
    }

    // Get and validate challenge
    let storedChallenge;
    try {
      storedChallenge = await dbService.getChallenge(credential.response.clientDataJSON);
    } catch (error) {
      console.error('Error retrieving challenge:', error);
    }

    // Extract challenge from credential for verification
    // The challenge is embedded in the clientDataJSON
    let expectedChallenge;
    try {
      const clientDataJSON = Buffer.from(credential.response.clientDataJSON, 'base64').toString('utf-8');
      const clientData = JSON.parse(clientDataJSON);
      expectedChallenge = clientData.challenge;
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid credential format'
      });
    }

    // Verify the challenge exists and hasn't expired
    try {
      storedChallenge = await dbService.getChallenge(expectedChallenge);
      if (!storedChallenge) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Invalid or expired challenge'
        });
      }

      // Check if challenge has expired (Requirement 11.5)
      if (new Date(storedChallenge.expiresAt) < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Challenge has expired'
        });
      }

      // Verify challenge type (check this before user session to give more specific error)
      if (storedChallenge.type !== 'registration') {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Invalid challenge type'
        });
      }

      // Verify challenge is associated with the correct user (session-bound)
      if (storedChallenge.userEmail !== email) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Challenge does not match user session'
        });
      }
    } catch (error) {
      console.error('Error validating challenge:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Verify registration response
    let verification;
    try {
      verification = await webauthnService.verifyRegistrationResponse(
        credential,
        expectedChallenge
      );
    } catch (error) {
      console.error('Error verifying registration:', error);
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Registration verification failed'
      });
    }

    // Delete the used challenge (one-time use)
    try {
      await dbService.deleteChallenge(expectedChallenge);
    } catch (error) {
      console.error('Error deleting challenge:', error);
      // Don't fail the registration if challenge deletion fails
    }

    // Prepare passkey data for storage
    const passkeyData = {
      credentialId: Buffer.from(verification.registrationInfo.credentialID).toString('base64'),
      publicKey: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64'),
      counter: verification.registrationInfo.counter,
      aaguid: verification.registrationInfo.aaguid || null,
      transports: credential.response.transports || [],
      authenticatorType: credential.authenticatorAttachment || 'cross-platform',
      friendlyName: friendlyName || undefined // Let dbService generate default if not provided
    };

    // Store passkey in database
    let passkey;
    try {
      passkey = await dbService.createPasskey(email, passkeyData);
    } catch (error) {
      console.error('Error storing passkey:', error);
      
      // Check for duplicate credential error
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'This authenticator is already registered'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to store passkey'
      });
    }

    // Return success with passkey data
    return res.status(201).json({
      success: true,
      passkey: {
        id: passkey.id,
        credentialId: passkey.credentialId,
        authenticatorType: passkey.authenticatorType,
        friendlyName: passkey.friendlyName,
        createdAt: passkey.createdAt
      }
    });

  } catch (error) {
    console.error('Unexpected error in registerVerify controller:', error);
    next(error);
  }
};

/**
 * Generate authentication options for passkey login
 * @route POST /api/auth/passkey/login-options
 * @param {string} req.body.userEmail - Optional user email for 2FA flow (from temp token)
 * @returns {Object} WebAuthn authentication options
 */
const loginOptions = async (req, res, next) => {
  try {
    const { userEmail } = req.body;
    
    // For standalone passkey login, we don't know which user is authenticating yet
    // So we allow any registered credential (empty allowCredentials array)
    // For 2FA flow, userEmail is provided from the temp token to bind the challenge
    
    // Note: We use empty allowCredentials for both flows to avoid browser compatibility issues
    // The challenge is bound to the user session for 2FA security (Requirement 11.6)
    // Verification will check that the credential belongs to the correct user
    let allowCredentials = [];
    
    // Optional: If you want to restrict to specific credentials in 2FA flow, uncomment below
    // However, this can cause NotAllowedError in some browsers/scenarios
    /*
    if (userEmail) {
      try {
        const passkeys = await dbService.getPasskeysByUser(userEmail);
        allowCredentials = passkeys.map(pk => ({
          credentialId: pk.credentialId,
          transports: pk.transports
        }));
      } catch (error) {
        console.error('Error fetching user passkeys:', error);
        return res.status(503).json({
          success: false,
          error: 'Service Unavailable',
          message: 'Database service temporarily unavailable'
        });
      }
    }
    */
    
    // Generate authentication options
    let options;
    try {
      options = await webauthnService.generateAuthenticationOptions(allowCredentials);
    } catch (error) {
      console.error('Error generating authentication options:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to generate authentication options'
      });
    }

    // Store challenge with 5-minute expiration
    // For standalone login: userEmail is null (we don't know the user yet)
    // For 2FA flow: userEmail is provided to bind the challenge to the session
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    try {
      await dbService.storeChallenge(
        options.challenge,
        userEmail || null, // Bind to user for 2FA, null for standalone login
        'authentication',
        expiresAt
      );
    } catch (error) {
      console.error('Error storing challenge:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to store challenge'
      });
    }

    // Return authentication options to client
    return res.status(200).json({
      success: true,
      options
    });

  } catch (error) {
    console.error('Unexpected error in loginOptions controller:', error);
    next(error);
  }
};

/**
 * Verify authentication response and generate JWT
 * @route POST /api/auth/passkey/login-verify
 * @param {Object} req.body.credential - WebAuthn authentication credential
 * @returns {Object} JWT access token and user data
 */
const loginVerify = async (req, res, next) => {
  try {
    const { credential } = req.body;

    // Validate request body
    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'credential is required'
      });
    }

    // Extract challenge from credential for verification
    let expectedChallenge;
    try {
      const clientDataJSON = Buffer.from(credential.response.clientDataJSON, 'base64').toString('utf-8');
      const clientData = JSON.parse(clientDataJSON);
      expectedChallenge = clientData.challenge;
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid credential format'
      });
    }

    // Verify the challenge exists and hasn't expired
    let storedChallenge;
    try {
      storedChallenge = await dbService.getChallenge(expectedChallenge);
      if (!storedChallenge) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired challenge'
        });
      }

      // Verify challenge matches (Requirement 11.2)
      if (storedChallenge.challenge !== expectedChallenge) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Challenge mismatch'
        });
      }

      // Check if challenge has expired (Requirement 11.5)
      if (new Date(storedChallenge.expiresAt) < new Date()) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Challenge has expired'
        });
      }

      // Verify challenge type
      if (storedChallenge.type !== 'authentication') {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid challenge type'
        });
      }
    } catch (error) {
      console.error('Error validating challenge:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Get the credential ID from the response
    const credentialId = Buffer.from(credential.rawId, 'base64').toString('base64');

    // Look up the stored credential
    let storedCredential;
    try {
      storedCredential = await dbService.getPasskeyByCredentialId(credentialId);
      if (!storedCredential) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Passkey not recognized'
        });
      }
    } catch (error) {
      console.error('Error retrieving stored credential:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Validate session-bound challenge (Requirement 11.6, Property 32)
    // If the challenge was generated for a specific user (2FA flow), verify the credential belongs to that user
    if (storedChallenge.userEmail && storedChallenge.userEmail !== storedCredential.userEmail) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Challenge does not match user session'
      });
    }

    // Verify the user is approved
    let isApproved;
    try {
      isApproved = await dbService.isEmailApproved(storedCredential.userEmail);
      if (!isApproved) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Account not authorized'
        });
      }
    } catch (error) {
      console.error('Error checking user approval:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Verify authentication response
    let verification;
    try {
      verification = await webauthnService.verifyAuthenticationResponse(
        credential,
        storedCredential,
        expectedChallenge
      );
    } catch (error) {
      console.error('Error verifying authentication:', error);
      
      // Check if it's a counter validation failure (potential cloned credential)
      if (error.message.includes('Counter validation failed') || error.message.includes('cloned')) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Passkey may be cloned. Please contact support.'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: error.message || 'Invalid passkey signature'
      });
    }

    // Delete the used challenge (one-time use)
    try {
      await dbService.deleteChallenge(expectedChallenge);
    } catch (error) {
      console.error('Error deleting challenge:', error);
      // Don't fail the authentication if challenge deletion fails
    }

    // Update counter and last_used_at timestamp
    try {
      await dbService.updatePasskeyCounter(
        credentialId,
        verification.authenticationInfo.newCounter
      );
      await dbService.updatePasskeyLastUsed(credentialId);
    } catch (error) {
      console.error('Error updating passkey metadata:', error);
      // Don't fail the authentication if metadata update fails
    }

    // Update last login timestamp
    try {
      await dbService.updateLastLogin(storedCredential.userEmail);
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't fail the authentication if last login update fails
    }

    // Generate JWT token
    const jwtService = require('../services/jwtService');
    let accessToken;
    let userName;
    try {
      // Get user name from approved_users table
      const userQuery = await dbService.connect();
      const result = await userQuery.query(
        'SELECT name FROM approved_users WHERE email = $1',
        [storedCredential.userEmail]
      );
      
      userName = result.rows[0]?.name || storedCredential.userEmail;
      
      accessToken = jwtService.generateAccessToken({
        email: storedCredential.userEmail,
        name: userName
      });
    } catch (error) {
      console.error('Error generating JWT:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to generate access token'
      });
    }

    // Return success with JWT and user data
    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        email: storedCredential.userEmail,
        name: userName
      }
    });

  } catch (error) {
    console.error('Unexpected error in loginVerify controller:', error);
    next(error);
  }
};

/**
 * List all passkeys for the authenticated user
 * @route GET /api/auth/passkey/list
 * @returns {Array} Array of passkey objects
 */
const listPasskeys = async (req, res, next) => {
  try {
    const { email } = req.user; // From auth middleware

    // Get all passkeys for the user
    let passkeys;
    try {
      passkeys = await dbService.getPasskeysByUser(email);
    } catch (error) {
      console.error('Error fetching passkeys:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Return passkeys (excluding sensitive data like public keys)
    const sanitizedPasskeys = passkeys.map(pk => ({
      id: pk.id,
      authenticatorType: pk.authenticatorType,
      friendlyName: pk.friendlyName,
      lastUsedAt: pk.lastUsedAt,
      createdAt: pk.createdAt
    }));

    return res.status(200).json({
      success: true,
      passkeys: sanitizedPasskeys
    });

  } catch (error) {
    console.error('Unexpected error in listPasskeys controller:', error);
    next(error);
  }
};

/**
 * Delete a passkey
 * @route DELETE /api/auth/passkey/:id
 * @returns {Object} Success message
 */
const deletePasskey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.user; // From auth middleware

    // Validate passkey ID
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Passkey ID is required'
      });
    }

    // Delete the passkey (dbService verifies ownership and auto-disables 2FA if last passkey)
    let deletedPasskey;
    try {
      deletedPasskey = await dbService.deletePasskey(id, email);
    } catch (error) {
      console.error('Error deleting passkey:', error);
      
      // Check if passkey not found or doesn't belong to user
      if (error.message.includes('not found') || error.message.includes('does not belong')) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Passkey not found'
        });
      }
      
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Check if 2FA was auto-disabled (no remaining passkeys)
    let twoFADisabled = false;
    try {
      const passkeys = await dbService.getPasskeysByUser(email);
      if (passkeys.length === 0) {
        twoFADisabled = true;
      }
    } catch (error) {
      console.error('Error checking remaining passkeys:', error);
      // Don't fail the deletion if this check fails
    }

    return res.status(200).json({
      success: true,
      message: twoFADisabled 
        ? 'Passkey deleted. 2FA has been automatically disabled as you have no remaining passkeys.'
        : 'Passkey deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error in deletePasskey controller:', error);
    next(error);
  }
};

/**
 * Update passkey friendly name
 * @route PATCH /api/auth/passkey/:id/name
 * @param {string} req.body.name - New friendly name
 * @returns {Object} Updated passkey object
 */
const updatePasskeyName = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const { email } = req.user; // From auth middleware

    // Validate passkey ID
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Passkey ID is required'
      });
    }

    // Validate name (basic check - detailed validation happens in dbService)
    if (typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name is required and must be a string'
      });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name cannot be empty'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name must be 100 characters or less'
      });
    }

    // First verify the passkey belongs to the user
    let passkey;
    try {
      const userPasskeys = await dbService.getPasskeysByUser(email);
      passkey = userPasskeys.find(pk => pk.id === id);
      
      if (!passkey) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Passkey not found'
        });
      }
    } catch (error) {
      console.error('Error verifying passkey ownership:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Update the passkey name
    let updatedPasskey;
    try {
      updatedPasskey = await dbService.updatePasskeyName(id, name);
    } catch (error) {
      console.error('Error updating passkey name:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Passkey not found'
        });
      }
      
      if (error.message.includes('cannot be empty') || error.message.includes('special characters')) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: error.message
        });
      }
      
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    // Return sanitized passkey data
    return res.status(200).json({
      success: true,
      passkey: {
        id: updatedPasskey.id,
        authenticatorType: updatedPasskey.authenticatorType,
        friendlyName: updatedPasskey.friendlyName,
        lastUsedAt: updatedPasskey.lastUsedAt,
        createdAt: updatedPasskey.createdAt,
        updatedAt: updatedPasskey.updatedAt
      }
    });

  } catch (error) {
    console.error('Unexpected error in updatePasskeyName controller:', error);
    next(error);
  }
};

/**
 * Get user's 2FA status
 * @route GET /api/auth/passkey/2fa-status
 * @returns {Object} 2FA status with enabled boolean
 */
const get2FAStatus = async (req, res, next) => {
  try {
    const { email } = req.user; // From auth middleware

    // Get 2FA status from database
    let status;
    try {
      status = await dbService.get2FAStatus(email);
    } catch (error) {
      console.error('Error getting 2FA status:', error);
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    return res.status(200).json({
      success: true,
      enabled: status.enabled
    });

  } catch (error) {
    console.error('Unexpected error in get2FAStatus controller:', error);
    next(error);
  }
};

/**
 * Update user's 2FA status
 * @route PUT /api/auth/passkey/2fa-status
 * @param {boolean} req.body.enabled - Whether to enable or disable 2FA
 * @returns {Object} Updated 2FA status
 */
const set2FAStatus = async (req, res, next) => {
  try {
    const { email } = req.user; // From auth middleware
    const { enabled } = req.body;

    // Validate request body
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'enabled must be a boolean value'
      });
    }

    // Update 2FA status (dbService will validate passkey requirement)
    let status;
    try {
      status = await dbService.set2FAStatus(email, enabled);
    } catch (error) {
      console.error('Error setting 2FA status:', error);
      
      // Check if error is due to missing passkeys
      if (error.message.includes('must have at least one enrolled passkey')) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Cannot enable 2FA without at least one enrolled passkey'
        });
      }
      
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database service temporarily unavailable'
      });
    }

    return res.status(200).json({
      success: true,
      enabled: status.enabled
    });

  } catch (error) {
    console.error('Unexpected error in set2FAStatus controller:', error);
    next(error);
  }
};

module.exports = {
  registerOptions,
  registerVerify,
  loginOptions,
  loginVerify,
  listPasskeys,
  deletePasskey,
  updatePasskeyName,
  get2FAStatus,
  set2FAStatus
};
