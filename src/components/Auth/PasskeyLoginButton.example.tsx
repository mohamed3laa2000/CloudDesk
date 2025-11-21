/**
 * Example usage of PasskeyLoginButton component
 * 
 * This file demonstrates how to integrate the PasskeyLoginButton
 * into a login page or authentication flow.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasskeyLoginButton } from './PasskeyLoginButton';
import { apiService } from '../../services/api';

export function PasskeyLoginExample() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  /**
   * Handle successful passkey authentication
   * Store the JWT token and redirect to the dashboard
   */
  const handleSuccess = (accessToken: string, user: { email: string; name: string }) => {
    // Store JWT in localStorage
    localStorage.setItem('accessToken', accessToken);
    
    // Set JWT in API service for future requests
    apiService.setAuthToken(accessToken);
    
    // Log success
    console.log('Passkey authentication successful:', user);
    
    // Redirect to dashboard
    navigate('/dashboard');
  };

  /**
   * Handle authentication errors
   * Display error message to user
   */
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    console.error('Passkey authentication failed:', errorMessage);
  };

  return (
    <div className="space-y-4">
      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Passkey login button */}
      <PasskeyLoginButton
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}

/**
 * Example: Integration with existing authentication flow
 * 
 * The PasskeyLoginButton can be placed alongside other authentication
 * methods like Google OAuth:
 */
export function MultiAuthExample() {
  const handlePasskeySuccess = (_accessToken: string, user: { email: string; name: string }) => {
    // Handle passkey authentication
    console.log('Authenticated with passkey:', user);
  };

  const handleGoogleLogin = () => {
    // Handle Google OAuth
    console.log('Initiating Google login...');
  };

  return (
    <div className="space-y-4">
      {/* Passkey authentication */}
      <PasskeyLoginButton
        onSuccess={handlePasskeySuccess}
        onError={(error) => console.error(error)}
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      {/* Google authentication */}
      <button onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
    </div>
  );
}

/**
 * Browser Compatibility Check
 * 
 * The PasskeyLoginButton automatically checks for WebAuthn support.
 * You can also check manually before rendering:
 */
export function ConditionalPasskeyButton() {
  // Import passkeyService using static import
  // Note: In a real implementation, you would import at the top of the file
  // import passkeyService from '../../services/passkeyService';
  
  // For this example, we'll just show the PasskeyLoginButton
  // which has built-in WebAuthn support detection
  return (
    <PasskeyLoginButton
      onSuccess={(_token, user) => console.log('Success:', user)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
