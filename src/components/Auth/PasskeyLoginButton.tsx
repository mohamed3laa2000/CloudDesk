import { useState } from 'react';
import { Button } from '../ui/Button';
import { Loader2, Fingerprint } from 'lucide-react';
import { passkeyService } from '../../services/passkeyService';

/**
 * Props for PasskeyLoginButton component
 */
export interface PasskeyLoginButtonProps {
  onSuccess: (accessToken: string, user: { email: string; name: string }) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

/**
 * PasskeyLoginButton component for standalone passkey authentication
 * 
 * Provides a button to sign in using WebAuthn passkeys without requiring
 * Google OAuth. Shows loading state during authentication and handles errors.
 * 
 * Requirements: 7.1, 12.1, 12.2, 12.4
 */
export const PasskeyLoginButton: React.FC<PasskeyLoginButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  /**
   * Handle passkey login button click
   * Initiates WebAuthn authentication ceremony and handles the response
   */
  const handlePasskeyLogin = async () => {
    // Check if WebAuthn is supported
    if (!passkeyService.isWebAuthnSupported()) {
      const errorMsg = "Your browser doesn't support passkeys. Please use a modern browser like Chrome, Firefox, Safari, or Edge.";
      onError?.(errorMsg);
      return;
    }

    setLoading(true);
    setShowInstructions(true);

    try {
      // Authenticate with passkey
      const { accessToken, user } = await passkeyService.authenticateWithPasskey();

      // Call success callback with token and user data
      onSuccess(accessToken, user);
    } catch (error: any) {
      console.error('Passkey login error:', error);
      
      // Extract user-friendly error message
      const errorMessage = error.message || 'Authentication failed. Please try again.';
      
      // Call error callback if provided
      onError?.(errorMessage);
    } finally {
      setLoading(false);
      setShowInstructions(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={handlePasskeyLogin}
        disabled={disabled || loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Authenticating...
          </>
        ) : (
          <>
            <Fingerprint className="mr-2 h-5 w-5" />
            Sign in with Passkey
          </>
        )}
      </Button>

      {/* Device-specific instructions shown during authentication */}
      {showInstructions && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Follow the prompts on your device to authenticate with your passkey.
            You may need to use your fingerprint, face recognition, or security key.
          </p>
        </div>
      )}
    </div>
  );
};
