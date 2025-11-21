import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader2, Fingerprint, X } from 'lucide-react';
import { passkeyService } from '../../services/passkeyService';

/**
 * Props for Passkey2FAPrompt component
 */
export interface Passkey2FAPromptProps {
  tempToken: string; // Temporary token from Google login (for future use/validation)
  userEmail: string;
  onSuccess: (accessToken: string, user: { email: string; name: string }) => void;
  onCancel: () => void;
}

/**
 * Passkey2FAPrompt component for 2FA passkey authentication after Google login
 * 
 * Prompts user to authenticate with their passkey after successful Google OAuth
 * when 2FA mode is enabled. Shows loading state, error messages, and allows retry.
 * 
 * Requirements: 8.1, 8.3, 8.5
 */
export const Passkey2FAPrompt: React.FC<Passkey2FAPromptProps> = ({
  tempToken: _tempToken, // Reserved for future validation use
  userEmail,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  /**
   * Handle passkey authentication for 2FA
   * Initiates WebAuthn authentication ceremony and handles the response
   * Passes userEmail to bind the challenge to this user's session (Requirement 11.6)
   */
  const handlePasskeyAuth = async () => {
    setLoading(true);
    setError(null);
    setShowInstructions(true);

    try {
      // Authenticate with passkey, passing userEmail to bind challenge to session
      // This prevents cross-session attacks (Requirement 11.6, Property 32)
      const { accessToken, user } = await passkeyService.authenticateWithPasskey(userEmail);

      // Call success callback with token and user data
      onSuccess(accessToken, user);
    } catch (err: any) {
      console.error('2FA passkey authentication error:', err);
      
      // Extract user-friendly error message
      const errorMessage = err.message || 'Authentication failed. Please try again.';
      
      // Set error state to allow retry
      setError(errorMessage);
    } finally {
      setLoading(false);
      setShowInstructions(false);
    }
  };

  /**
   * Handle cancel button click
   * Returns user to login page
   */
  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <img 
              src="/logo-clouddesk.png" 
              alt="CloudDesk EDU" 
              className="h-8 sm:h-9 w-auto object-contain" 
            />
          </div>
        </div>
      </nav>

      {/* 2FA Prompt Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Fingerprint className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
              Two-Factor Authentication
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Verify your identity with your passkey
            </p>
          </div>

          {/* 2FA Card */}
          <Card className="p-6 sm:p-8">
            <div className="space-y-4">
              {/* User Email Display */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Signing in as:</p>
                <p className="text-base font-medium text-gray-900">{userEmail}</p>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Your account has two-factor authentication enabled. Please authenticate with your passkey to complete sign-in.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Device-specific instructions shown during authentication */}
              {showInstructions && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Follow the prompts on your device to authenticate with your passkey.
                    You may need to use your fingerprint, face recognition, or security key.
                  </p>
                </div>
              )}

              {/* Authenticate Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handlePasskeyAuth}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-5 w-5" />
                    Authenticate with Passkey
                  </>
                )}
              </Button>

              {/* Cancel Button */}
              <Button
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="mr-2 h-5 w-5" />
                Cancel and Return to Login
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500">
                If you've lost access to your passkeys, please contact your administrator for assistance.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
