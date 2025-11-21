import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import passkeyService from '../../services/passkeyService';

/**
 * Passkey2FAToggle Component
 * 
 * Toggle switch for enabling/disabling 2FA passkey mode.
 * When enabled, users must authenticate with a passkey after Google login.
 * Requires at least one enrolled passkey to enable.
 * 
 * Requirements: 5.1, 5.3, 6.1
 */

interface Passkey2FAToggleProps {
  userEmail: string;
  hasPasskeys: boolean;
  onToggleChange?: (enabled: boolean) => void;
}

export const Passkey2FAToggle: React.FC<Passkey2FAToggleProps> = ({
  userEmail,
  hasPasskeys,
  onToggleChange,
}) => {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Load 2FA status from server
   */
  const load2FAStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const status = await passkeyService.get2FAStatus();
      setEnabled(status.enabled);
    } catch (err: any) {
      console.error('Error loading 2FA status:', err);
      setError(err.message || 'Failed to load 2FA status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load 2FA status on mount
  useEffect(() => {
    load2FAStatus();
  }, [userEmail]);

  /**
   * Handle toggle click
   */
  const handleToggleClick = () => {
    // Clear previous messages
    setError(null);
    setSuccess(null);

    // If trying to enable, check if user has passkeys
    if (!enabled && !hasPasskeys) {
      setError('You must enroll at least one passkey before enabling 2FA.');
      return;
    }

    // If enabling, show confirmation dialog
    if (!enabled) {
      setShowConfirmation(true);
    } else {
      // If disabling, do it immediately
      toggle2FA(false);
    }
  };

  /**
   * Confirm enabling 2FA
   */
  const confirmEnable = () => {
    setShowConfirmation(false);
    toggle2FA(true);
  };

  /**
   * Cancel enabling 2FA
   */
  const cancelEnable = () => {
    setShowConfirmation(false);
  };

  /**
   * Toggle 2FA status
   */
  const toggle2FA = async (newStatus: boolean) => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await passkeyService.set2FAStatus(newStatus);
      setEnabled(newStatus);
      
      // Show success message
      const message = newStatus
        ? '2FA enabled successfully. You will now need to authenticate with a passkey after Google login.'
        : '2FA disabled. You can now sign in with only Google authentication.';
      setSuccess(message);

      // Notify parent component
      if (onToggleChange) {
        onToggleChange(newStatus);
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);

    } catch (err: any) {
      console.error('Error toggling 2FA:', err);
      setError(err.message || 'Failed to update 2FA setting. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center p-4">
          <svg
            className="animate-spin h-5 w-5 text-gray-400 dark:text-gray-500"
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
          <span className="ml-3 text-sm text-gray-600 dark:text-gray-100">Loading 2FA settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Section Header */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1 sm:mb-2">
          Two-Factor Authentication
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100">
          Require passkey authentication after Google login for enhanced security.
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
                Error
              </p>
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-200 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="mb-4 p-4 sm:p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">
            Enable Two-Factor Authentication?
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100 mb-4">
            When 2FA is enabled, you will need to authenticate with a passkey every time you sign in with Google. 
            This provides an additional layer of security for your account.
          </p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100 mb-4">
            Make sure you have access to your enrolled passkeys before enabling this feature.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={confirmEnable}
              disabled={actionLoading}
              className="w-full sm:w-auto"
              aria-label="Confirm enable 2FA"
            >
              {actionLoading ? (
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
                  Enabling...
                </span>
              ) : (
                'Enable 2FA'
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={cancelEnable}
              disabled={actionLoading}
              className="w-full sm:w-auto"
              aria-label="Cancel enable 2FA"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Toggle Switch */}
      {!showConfirmation && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg">
          <div className="mb-3 sm:mb-0 sm:mr-4">
            <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-50 mb-1">
              Passkey 2FA Mode
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100">
              {enabled
                ? 'Passkey authentication is required after Google login.'
                : 'Require passkey authentication after Google login for additional security.'}
            </p>
            {!hasPasskeys && !enabled && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                You must enroll at least one passkey before enabling 2FA.
              </p>
            )}
          </div>

          {/* Toggle Button */}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Toggle 2FA mode"
            onClick={handleToggleClick}
            disabled={actionLoading || (!hasPasskeys && !enabled)}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
              ${actionLoading || (!hasPasskeys && !enabled) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className="sr-only">Toggle 2FA mode</span>
            <span
              aria-hidden="true"
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                transition duration-200 ease-in-out
                ${enabled ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>
      )}

      {/* Instructional Message */}
      {!hasPasskeys && !enabled && !showConfirmation && (
        <div
          className="mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg"
          role="status"
        >
          <div className="flex items-start">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-300 mt-0.5 mr-2 sm:mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                How to enable 2FA
              </p>
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-200 mt-1">
                To enable two-factor authentication, you must first enroll at least one passkey using the options above. 
                Once you have a passkey enrolled, you can enable 2FA mode.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Passkey2FAToggle;
