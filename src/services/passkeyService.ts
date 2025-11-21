import {
  startRegistration as startWebAuthnRegistration,
  startAuthentication as startWebAuthnAuthentication,
} from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';
import apiClient from './api';

/**
 * Passkey data returned from the server
 */
export interface Passkey {
  id: string;
  userEmail: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  aaguid: string | null;
  transports: AuthenticatorTransportFuture[];
  authenticatorType: 'platform' | 'cross-platform';
  friendlyName: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User data returned from authentication
 */
export interface User {
  email: string;
  name: string;
}

/**
 * Service for handling WebAuthn passkey operations
 */
class PasskeyService {
  /**
   * Check if WebAuthn is supported in the current browser
   * @returns true if WebAuthn is supported, false otherwise
   */
  isWebAuthnSupported(): boolean {
    return (
      window.PublicKeyCredential !== undefined &&
      navigator.credentials !== undefined
    );
  }

  /**
   * Check if platform authenticator is available (e.g., Touch ID, Face ID, Windows Hello)
   * @returns Promise that resolves to true if platform authenticator is available
   */
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isWebAuthnSupported()) {
      return false;
    }

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.error('Error checking platform authenticator availability:', error);
      return false;
    }
  }

  /**
   * Start passkey registration process
   * @param authenticatorType - Type of authenticator to register ('platform' or 'cross-platform')
   * @returns Promise with registration options from server
   */
  async startRegistration(
    authenticatorType: 'platform' | 'cross-platform'
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const response = await apiClient.post('/api/auth/passkey/register-options', {
      authenticatorType,
    });
    // Server returns { success: true, options: {...} }
    return response.data.options || response.data;
  }

  /**
   * Complete passkey registration process
   * @param credential - The credential response from the authenticator
   * @param friendlyName - Optional friendly name for the passkey
   * @returns Promise that resolves when registration is complete
   */
  async completeRegistration(
    credential: RegistrationResponseJSON,
    friendlyName?: string
  ): Promise<void> {
    await apiClient.post('/api/auth/passkey/register-verify', {
      credential,
      friendlyName,
    });
  }

  /**
   * Register a new passkey
   * @param authenticatorType - Type of authenticator to register ('platform' or 'cross-platform')
   * @param friendlyName - Optional friendly name for the passkey
   * @returns Promise that resolves when registration is complete
   * @throws Error with user-friendly message if registration fails
   */
  async registerPasskey(
    authenticatorType: 'platform' | 'cross-platform',
    friendlyName?: string
  ): Promise<void> {
    try {
      // Get registration options from server
      const options = await this.startRegistration(authenticatorType);

      // Validate options before passing to WebAuthn
      if (!options || typeof options !== 'object') {
        throw new Error('Invalid registration options received from server');
      }

      // Start WebAuthn registration ceremony with validated options
      let credential;
      try {
        credential = await startWebAuthnRegistration(options);
      } catch (webauthnError: any) {
        // Wrap WebAuthn library errors
        console.error('WebAuthn library error:', webauthnError);
        throw webauthnError;
      }

      // Send credential to server for verification
      await this.completeRegistration(credential, friendlyName);
    } catch (error: any) {
      console.error('Passkey registration error:', error);
      throw this.handleWebAuthnError(error, 'registration');
    }
  }

  /**
   * Start passkey authentication process
   * @param userEmail - Optional user email for 2FA flow (binds challenge to user session)
   * @returns Promise with authentication options from server
   */
  async startAuthentication(userEmail?: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const response = await apiClient.post('/api/auth/passkey/login-options', {
      userEmail: userEmail || undefined,
    });
    return response.data.options;
  }

  /**
   * Complete passkey authentication process
   * @param credential - The credential response from the authenticator
   * @returns Promise with access token and user data
   */
  async completeAuthentication(
    credential: AuthenticationResponseJSON
  ): Promise<{ accessToken: string; user: User }> {
    const response = await apiClient.post('/api/auth/passkey/login-verify', {
      credential,
    });
    return response.data;
  }

  /**
   * Authenticate with a passkey
   * @param userEmail - Optional user email for 2FA flow (binds challenge to user session)
   * @returns Promise with access token and user data
   * @throws Error with user-friendly message if authentication fails
   */
  async authenticateWithPasskey(userEmail?: string): Promise<{ accessToken: string; user: User }> {
    try {
      // Get authentication options from server
      // For 2FA flow, pass userEmail to bind challenge to the session
      const options = await this.startAuthentication(userEmail);

      // Validate options before passing to WebAuthn
      if (!options || typeof options !== 'object') {
        throw new Error('Invalid authentication options received from server');
      }

      // Start WebAuthn authentication ceremony with validated options
      let credential;
      try {
        credential = await startWebAuthnAuthentication(options);
      } catch (webauthnError: any) {
        // Wrap WebAuthn library errors
        console.error('WebAuthn library error:', webauthnError);
        throw webauthnError;
      }

      // Send credential to server for verification
      return await this.completeAuthentication(credential);
    } catch (error: any) {
      console.error('Passkey authentication error:', error);
      throw this.handleWebAuthnError(error, 'authentication');
    }
  }

  /**
   * Get list of enrolled passkeys for the current user
   * @returns Promise with array of passkeys
   * @throws Error with user-friendly message if request fails
   */
  async listPasskeys(): Promise<Passkey[]> {
    try {
      const response = await apiClient.get('/api/auth/passkey/list');
      return response.data.passkeys;
    } catch (error: any) {
      console.error('Error listing passkeys:', error);
      throw this.handleNetworkError(error);
    }
  }

  /**
   * Delete a passkey
   * @param id - Passkey ID to delete
   * @returns Promise that resolves when deletion is complete
   * @throws Error with user-friendly message if deletion fails
   */
  async deletePasskey(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/auth/passkey/${id}`);
    } catch (error: any) {
      console.error('Error deleting passkey:', error);
      throw this.handleNetworkError(error);
    }
  }

  /**
   * Update passkey friendly name
   * @param id - Passkey ID to update
   * @param name - New friendly name
   * @returns Promise with updated passkey
   * @throws Error with user-friendly message if update fails
   */
  async updatePasskeyName(id: string, name: string): Promise<Passkey> {
    try {
      const response = await apiClient.patch(`/api/auth/passkey/${id}/name`, {
        name,
      });
      return response.data.passkey;
    } catch (error: any) {
      console.error('Error updating passkey name:', error);
      throw this.handleNetworkError(error);
    }
  }

  /**
   * Get 2FA status for the current user
   * @returns Promise with 2FA enabled status
   * @throws Error with user-friendly message if request fails
   */
  async get2FAStatus(): Promise<{ enabled: boolean }> {
    try {
      const response = await apiClient.get('/api/auth/passkey/2fa-status');
      return response.data;
    } catch (error: any) {
      console.error('Error getting 2FA status:', error);
      throw this.handleNetworkError(error);
    }
  }

  /**
   * Set 2FA status for the current user
   * @param enabled - Whether to enable or disable 2FA
   * @returns Promise that resolves when status is updated
   * @throws Error with user-friendly message if update fails
   */
  async set2FAStatus(enabled: boolean): Promise<void> {
    try {
      await apiClient.put('/api/auth/passkey/2fa-status', { enabled });
    } catch (error: any) {
      console.error('Error setting 2FA status:', error);
      throw this.handleNetworkError(error);
    }
  }

  /**
   * Handle WebAuthn errors and convert to user-friendly messages
   * @param error - The error from WebAuthn API or server
   * @param context - The context of the operation ('registration' or 'authentication')
   * @returns Error with user-friendly message
   */
  private handleWebAuthnError(error: any, context: 'registration' | 'authentication' = 'authentication'): Error {
    // Safely get error properties
    const errorName = error?.name || '';
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';
    
    // Handle WebAuthn API errors
    if (errorName === 'NotAllowedError') {
      const action = context === 'registration' ? 'Registration' : 'Authentication';
      // This error occurs when user cancels, times out, or browser blocks the operation
      return new Error(
        `${action} was cancelled or timed out. This can happen if:\n` +
        `• You cancelled the prompt\n` +
        `• The operation timed out (try again)\n` +
        `• Your browser blocked the request\n\n` +
        `Please try again and respond to the prompt quickly.`
      );
    }
    
    if (errorName === 'NotSupportedError') {
      return new Error("Your browser doesn't support passkeys. Please use a modern browser like Chrome, Firefox, Safari, or Edge.");
    }
    
    if (errorName === 'InvalidStateError') {
      if (context === 'registration') {
        return new Error('This authenticator is already registered. Please use a different authenticator or sign in with your existing passkey.');
      }
      return new Error('Invalid authenticator state. Please try again.');
    }
    
    if (errorName === 'SecurityError') {
      return new Error('Security error occurred. This may be due to an insecure connection. Please contact support if the problem persists.');
    }
    
    if (errorName === 'AbortError') {
      return new Error('Operation was aborted. Please try again.');
    }
    
    if (errorName === 'ConstraintError') {
      return new Error('The authenticator does not meet the requirements. Please try a different authenticator.');
    }
    
    if (errorName === 'NotReadableError') {
      return new Error('Unable to read from the authenticator. Please try again.');
    }
    
    if (errorName === 'UnknownError') {
      return new Error('An unknown error occurred. Please try again or contact support.');
    }

    // Handle network/server errors
    if (error?.response) {
      return this.handleNetworkError(error);
    }

    // Handle network timeout or connection errors
    if (errorCode === 'ECONNABORTED' || errorMessage.includes('timeout')) {
      return new Error('Connection timeout. Please check your internet connection and try again.');
    }
    
    if (errorCode === 'ERR_NETWORK' || errorMessage.includes('Network Error')) {
      return new Error('Network error. Please check your internet connection and try again.');
    }

    // Default error
    return new Error(errorMessage || 'An error occurred. Please try again.');
  }

  /**
   * Handle network/server errors and convert to user-friendly messages
   * @param error - The error from the API request
   * @returns Error with user-friendly message
   */
  private handleNetworkError(error: any): Error {
    // Safely get error properties
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';
    
    // Handle HTTP response errors
    if (error?.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      switch (status) {
        case 400:
          return new Error(message || 'Invalid request. Please check your input and try again.');
        
        case 401:
          return new Error(message || 'Authentication failed. Please sign in again.');
        
        case 403:
          return new Error(message || "You don't have permission to perform this action.");
        
        case 404:
          return new Error(message || 'Passkey not found. It may have been deleted.');
        
        case 409:
          return new Error(message || 'This passkey is already registered.');
        
        case 429:
          return new Error('Too many requests. Please wait a moment and try again.');
        
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error. Please try again later.');
        
        default:
          return new Error(message || 'An error occurred. Please try again.');
      }
    }

    // Handle network timeout or connection errors
    if (errorCode === 'ECONNABORTED' || errorMessage.includes('timeout')) {
      return new Error('Connection timeout. Please check your internet connection and try again.');
    }
    
    if (errorCode === 'ERR_NETWORK' || errorMessage.includes('Network Error')) {
      return new Error('Network error. Please check your internet connection and try again.');
    }

    // Default error
    return new Error(errorMessage || 'An error occurred. Please try again.');
  }
}

// Export singleton instance
export const passkeyService = new PasskeyService();
export default passkeyService;
