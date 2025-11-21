import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input, Label, HelperText } from '../ui/Input';
import passkeyService from '../../services/passkeyService';

/**
 * PasskeyEnrollment Component
 * 
 * Manages passkey enrollment on the profile page.
 * Allows users to enroll platform authenticators (biometrics) or cross-platform authenticators (security keys).
 * 
 * Requirements: 1.1, 2.1, 10.1, 12.1, 12.3, 12.4
 */

interface PasskeyEnrollmentProps {
  userEmail: string;
  onEnrollmentComplete: () => void;
}

export const PasskeyEnrollment: React.FC<PasskeyEnrollmentProps> = ({
  userEmail: _userEmail, // Reserved for future server-side validation
  onEnrollmentComplete,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [enrollmentType, setEnrollmentType] = useState<'platform' | 'cross-platform' | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState<boolean>(false);
  const [friendlyName, setFriendlyName] = useState<string>('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState<boolean>(true);

  // Check platform authenticator availability on mount
  React.useEffect(() => {
    const checkPlatformAvailability = async () => {
      const available = await passkeyService.isPlatformAuthenticatorAvailable();
      setIsPlatformAvailable(available);
    };
    checkPlatformAvailability();
  }, []);

  /**
   * Handle passkey enrollment
   * @param type - Type of authenticator to enroll ('platform' or 'cross-platform')
   */
  const handleEnroll = async (type: 'platform' | 'cross-platform') => {
    // Clear previous messages
    setSuccess(null);
    setError(null);
    setEnrollmentType(type);
    setShowNamePrompt(true);
  };

  /**
   * Complete enrollment with optional friendly name
   */
  const completeEnrollment = async () => {
    if (!enrollmentType) return;

    setLoading(true);
    setError(null);

    try {
      // Register the passkey with optional friendly name
      await passkeyService.registerPasskey(
        enrollmentType,
        friendlyName.trim() || undefined
      );

      // Show success message
      const typeLabel = enrollmentType === 'platform' ? 'Platform Passkey' : 'Security Key';
      setSuccess(`${typeLabel} enrolled successfully!`);
      
      // Reset form
      setShowNamePrompt(false);
      setFriendlyName('');
      setEnrollmentType(null);

      // Notify parent component
      onEnrollmentComplete();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err: any) {
      console.error('Passkey enrollment error:', err);
      setError(err.message || 'Failed to enroll passkey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel enrollment
   */
  const cancelEnrollment = () => {
    setShowNamePrompt(false);
    setFriendlyName('');
    setEnrollmentType(null);
    setError(null);
  };

  // Check if WebAuthn is supported
  if (!passkeyService.isWebAuthnSupported()) {
    return (
      <div className="w-full max-w-2xl">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1 sm:mb-2">
            Passkey Authentication
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100">
            Enroll passkeys for secure, passwordless authentication.
          </p>
        </div>

        {/* Compatibility Message */}
        <div
          className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-700 rounded-lg"
          role="alert"
        >
          <div className="flex items-start">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-300 mt-0.5 mr-2 sm:mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Passkeys not supported
              </p>
              <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                Your browser doesn't support passkeys. Please use a modern browser like Chrome, Firefox, Safari, or Edge.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Section Header */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1 sm:mb-2">
          Passkey Authentication
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100">
          Enroll passkeys for secure, passwordless authentication.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div
          className="mb-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-300 mt-0.5 mr-2 sm:mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-200">
                {success}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-300 mt-0.5 mr-2 sm:mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-200">
                Enrollment failed
              </p>
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-200 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Name Prompt Modal */}
      {showNamePrompt && (
        <div className="mb-4 p-4 sm:p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">
            Name Your Passkey
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100 mb-4">
            Give your passkey a friendly name to help you identify it later (optional).
          </p>

          <div className="mb-4">
            <Label htmlFor="friendlyName">
              Friendly Name (Optional)
            </Label>
            <Input
              id="friendlyName"
              type="text"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              placeholder={`e.g., "My ${enrollmentType === 'platform' ? 'iPhone' : 'YubiKey'}"`}
              disabled={loading}
              className="mt-1"
              maxLength={100}
              aria-label="Passkey friendly name"
            />
            <HelperText className="mt-1">
              If left empty, a default name will be generated.
            </HelperText>
          </div>

          {/* Loading State with Instructions */}
          {loading && (
            <div
              className="mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start">
                <svg
                  className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-300 mt-0.5 mr-2 sm:mr-3 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                    Waiting for authenticator...
                  </p>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-200 mt-1">
                    {enrollmentType === 'platform'
                      ? 'Follow the prompts on your device to complete enrollment using your biometric sensor or device PIN.'
                      : 'Insert your security key and follow the prompts to complete enrollment.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={completeEnrollment}
              disabled={loading}
              className="w-full sm:w-auto"
              aria-label="Continue with enrollment"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Enrolling...
                </span>
              ) : (
                'Continue'
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={cancelEnrollment}
              disabled={loading}
              className="w-full sm:w-auto"
              aria-label="Cancel enrollment"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Enrollment Buttons */}
      {!showNamePrompt && (
        <div className="space-y-3">
          {/* Platform Passkey Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg">
            <div className="mb-3 sm:mb-0 sm:mr-4">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-50 mb-1">
                Platform Passkey
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100">
                Use your device's built-in biometric sensor (Face ID, Touch ID, Windows Hello)
              </p>
              {!isPlatformAvailable && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Platform authenticator not available on this device
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleEnroll('platform')}
              disabled={loading || !isPlatformAvailable}
              className="w-full sm:w-auto whitespace-nowrap"
              aria-label="Add platform passkey"
            >
              Add Platform Passkey
            </Button>
          </div>

          {/* Security Key Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg">
            <div className="mb-3 sm:mb-0 sm:mr-4">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-50 mb-1">
                Security Key
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100">
                Use a physical security key (YubiKey, Titan Key, etc.)
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleEnroll('cross-platform')}
              disabled={loading}
              className="w-full sm:w-auto whitespace-nowrap"
              aria-label="Add security key"
            >
              Add Security Key
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasskeyEnrollment;
