const crypto = require('crypto');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

/**
 * WebAuthn Service - handles WebAuthn cryptographic operations
 * Uses @simplewebauthn/server library for registration and authentication
 * 
 * Configuration is loaded from environment variables:
 * - RP_ID: Relying Party ID (domain name, e.g., 'clouddesk.com' or 'localhost')
 * - RP_NAME: Relying Party Name (displayed to users, e.g., 'CloudDesk')
 * - ORIGIN: Expected origin for WebAuthn (e.g., 'https://clouddesk.com' or 'http://localhost:5173')
 */
class WebAuthnService {
  constructor() {
    // Load configuration from environment variables
    this.rpName = process.env.RP_NAME || 'CloudDesk';
    this.rpID = process.env.RP_ID || 'localhost';
    this.origin = process.env.ORIGIN || 'http://localhost:5173';
    
    // Validate configuration
    if (!process.env.RP_ID) {
      console.warn('RP_ID not configured, using default: localhost');
    }
    if (!process.env.RP_NAME) {
      console.warn('RP_NAME not configured, using default: CloudDesk');
    }
    if (!process.env.ORIGIN) {
      console.warn('ORIGIN not configured, using default: http://localhost:5173');
    }
  }

  /**
   * Generate registration options for WebAuthn credential creation
   * @param {Object} user - User information
   * @param {string} user.email - User email address
   * @param {string} user.name - User display name
   * @param {string} authenticatorType - 'platform' or 'cross-platform'
   * @param {Array} existingCredentials - Array of existing credential descriptors to exclude
   * @returns {Object} Registration options to send to client
   */
  async generateRegistrationOptions(user, authenticatorType, existingCredentials = []) {
    // Generate cryptographically random challenge (32 bytes)
    const challenge = this.generateChallenge();
    
    // Configure authenticator selection based on type
    const authenticatorSelection = {
      requireResidentKey: false,
      residentKey: 'preferred',
      userVerification: 'preferred'
    };
    
    // Set authenticator attachment if specified
    if (authenticatorType === 'platform') {
      authenticatorSelection.authenticatorAttachment = 'platform';
    } else if (authenticatorType === 'cross-platform') {
      authenticatorSelection.authenticatorAttachment = 'cross-platform';
    }
    
    // Generate registration options using SimpleWebAuthn
    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: user.email, // Use email as user ID
      userName: user.email,
      userDisplayName: user.name,
      challenge,
      attestationType: 'none', // We don't need attestation verification for now
      excludeCredentials: existingCredentials.map(cred => ({
        id: cred.credentialId,
        type: 'public-key',
        transports: cred.transports || []
      })),
      authenticatorSelection,
      timeout: 60000 // 60 seconds
    });
    
    return options;
  }

  /**
   * Verify registration response from client
   * @param {Object} credential - Registration credential from client
   * @param {string} expectedChallenge - Expected challenge value
   * @returns {Object} Verification result with credential data
   * @throws {Error} If verification fails
   */
  async verifyRegistrationResponse(credential, expectedChallenge) {
    // Extract and validate origin from clientDataJSON before verification
    this.validateOriginFromCredential(credential);
    
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      requireUserVerification: false // Allow both verified and non-verified
    });
    
    if (!verification.verified) {
      throw new Error('Registration verification failed');
    }
    
    return verification;
  }

  /**
   * Generate authentication options for WebAuthn assertion
   * @param {Array} allowCredentials - Array of allowed credential descriptors
   * @returns {Object} Authentication options to send to client
   */
  async generateAuthenticationOptions(allowCredentials = []) {
    // Generate cryptographically random challenge (32 bytes)
    const challenge = this.generateChallenge();
    
    // Generate authentication options using SimpleWebAuthn
    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      challenge,
      allowCredentials: allowCredentials.map(cred => ({
        id: cred.credentialId,
        type: 'public-key',
        transports: cred.transports || []
      })),
      userVerification: 'preferred',
      timeout: 60000 // 60 seconds
    });
    
    return options;
  }

  /**
   * Verify authentication response from client
   * @param {Object} credential - Authentication credential from client
   * @param {Object} storedCredential - Stored credential data from database
   * @param {string} expectedChallenge - Expected challenge value
   * @returns {Object} Verification result with new counter
   * @throws {Error} If verification fails
   */
  async verifyAuthenticationResponse(credential, storedCredential, expectedChallenge) {
    // Extract and validate origin from clientDataJSON before verification
    this.validateOriginFromCredential(credential);
    
    // Prepare authenticator data for verification
    const authenticator = {
      credentialID: Buffer.from(storedCredential.credentialId, 'base64'),
      credentialPublicKey: Buffer.from(storedCredential.publicKey, 'base64'),
      counter: storedCredential.counter
    };
    
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      authenticator,
      requireUserVerification: false // Allow both verified and non-verified
    });
    
    if (!verification.verified) {
      throw new Error('Authentication verification failed');
    }
    
    // Validate counter increment to prevent replay attacks and detect cloned credentials
    const newCounter = verification.authenticationInfo.newCounter;
    if (!this.validateCounter(newCounter, storedCredential.counter)) {
      throw new Error('Counter validation failed - credential may be cloned');
    }
    
    return verification;
  }

  /**
   * Generate a cryptographically random challenge
   * @returns {string} Base64-encoded challenge (32 bytes)
   */
  generateChallenge() {
    // Generate 32 bytes of cryptographically secure random data
    const challenge = crypto.randomBytes(32);
    return challenge.toString('base64');
  }

  /**
   * Validate that a counter has incremented
   * @param {number} newCounter - New counter value from authentication
   * @param {number} storedCounter - Stored counter value from database
   * @returns {boolean} True if counter is valid
   */
  validateCounter(newCounter, storedCounter) {
    // Counter must increment (or be 0 if authenticator doesn't support counters)
    if (newCounter === 0 && storedCounter === 0) {
      // Some authenticators don't use counters
      return true;
    }
    
    // Counter must be greater than stored counter
    return newCounter > storedCounter;
  }

  /**
   * Validate origin from credential's clientDataJSON
   * Extracts the origin from the credential and verifies it matches the expected origin
   * This provides an additional layer of validation before the main verification
   * @param {Object} credential - WebAuthn credential with response.clientDataJSON
   * @throws {Error} If origin doesn't match or clientDataJSON is invalid
   */
  validateOriginFromCredential(credential) {
    try {
      // Extract clientDataJSON from credential
      if (!credential.response || !credential.response.clientDataJSON) {
        throw new Error('Invalid credential: missing clientDataJSON');
      }

      // Decode clientDataJSON (it's base64 encoded)
      const clientDataJSON = Buffer.from(
        credential.response.clientDataJSON,
        'base64'
      ).toString('utf-8');
      
      // Parse the JSON
      const clientData = JSON.parse(clientDataJSON);
      
      // Verify origin matches expected origin
      if (clientData.origin !== this.origin) {
        throw new Error(
          `Origin mismatch: expected '${this.origin}', got '${clientData.origin}'`
        );
      }
      
      // Verify type is either 'webauthn.create' or 'webauthn.get'
      if (clientData.type !== 'webauthn.create' && clientData.type !== 'webauthn.get') {
        throw new Error(
          `Invalid credential type: expected 'webauthn.create' or 'webauthn.get', got '${clientData.type}'`
        );
      }
      
      return true;
    } catch (error) {
      // Re-throw with more context if it's not already our error
      if (error.message.includes('Origin mismatch') || error.message.includes('Invalid credential')) {
        throw error;
      }
      throw new Error(`Failed to validate origin: ${error.message}`);
    }
  }

  /**
   * Get Relying Party configuration
   * @returns {Object} RP configuration
   */
  getRPConfig() {
    return {
      rpName: this.rpName,
      rpID: this.rpID,
      origin: this.origin
    };
  }
}

// Export singleton instance
module.exports = new WebAuthnService();
