import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input, Label, HelperText } from '../ui/Input';
import type { ProfileUpdateData } from '../../types/preferences';
import { PasskeyEnrollment } from './PasskeyEnrollment';
import { PasskeyList } from './PasskeyList';
import { Passkey2FAToggle } from './Passkey2FAToggle';

/**
 * ProfileSection Component
 * 
 * Displays and manages user profile information including name and email.
 * Allows authenticated users to update their profile name.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.2, 7.3, 7.4, 7.5
 */
export const ProfileSection: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [passkeyRefreshKey, setPasskeyRefreshKey] = useState<number>(0);
  const [hasPasskeys, setHasPasskeys] = useState<boolean>(false);
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState<boolean>(false);

  // Initialize name from user context
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  // Check WebAuthn support on mount
  useEffect(() => {
    const checkWebAuthnSupport = async () => {
      try {
        const passkeyService = (await import('../../services/passkeyService')).default;
        setIsWebAuthnSupported(passkeyService.isWebAuthnSupported());
      } catch (err) {
        console.error('Error checking WebAuthn support:', err);
        setIsWebAuthnSupported(false);
      }
    };
    checkWebAuthnSupport();
  }, []);

  // Track if there are unsaved changes
  useEffect(() => {
    setHasChanges(name !== user?.name && name.trim() !== '');
  }, [name, user?.name]);

  /**
   * Check if user has passkeys
   */
  const checkPasskeys = async () => {
    try {
      const passkeyService = (await import('../../services/passkeyService')).default;
      const passkeys = await passkeyService.listPasskeys();
      setHasPasskeys(passkeys.length > 0);
    } catch (err) {
      console.error('Error checking passkeys:', err);
      setHasPasskeys(false);
    }
  };

  // Check passkeys on mount and when refresh key changes
  useEffect(() => {
    checkPasskeys();
  }, [passkeyRefreshKey]);

  /**
   * Handle form submission
   * Validates input and calls API to update profile
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setSuccess(false);
    setError(null);

    // Validate name is not empty
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name cannot be empty');
      return;
    }

    // Check if there are actual changes
    if (trimmedName === user?.name) {
      setError('No changes to save');
      return;
    }

    setLoading(true);

    try {
      // Call API to update profile
      const profileData: ProfileUpdateData = { name: trimmedName };
      const updatedUser = await apiService.updateUserProfile(profileData);

      // Update AuthContext user state with new name
      updateUser({ name: updatedUser.name });
      
      setName(updatedUser.name);
      setSuccess(true);
      setHasChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle name input change
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Section Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-1 sm:mb-2">
          Profile
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100">
          Manage your personal information and account details.
        </p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Name Field */}
        <div>
          <Label htmlFor="name" required>
            Name
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Enter your name"
            disabled={loading}
            error={!!error && error.includes('Name')}
            className="mt-1"
            aria-label="Name"
            aria-describedby={error && error.includes('Name') ? 'name-error' : undefined}
          />
          {error && error.includes('Name') && (
            <HelperText error>
              <span id="name-error">{error}</span>
            </HelperText>
          )}
        </div>

        {/* Email Field (Read-only) */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email}
            disabled
            readOnly
            className="mt-1 bg-gray-50"
            aria-label="Email (read-only)"
          />
          <HelperText className="mt-1">
            Your email address cannot be changed.
          </HelperText>
        </div>

        {/* Success Message */}
        {success && (
          <div
            className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700 rounded-lg"
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
                  Profile updated successfully
                </p>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-200 mt-1">
                  Your changes have been saved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !error.includes('Name') && (
          <div
            className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg"
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
                  Failed to update profile
                </p>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-200 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !hasChanges}
            className="w-full sm:w-auto sm:min-w-[120px]"
            aria-label="Save profile changes"
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
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </Button>
          
          {hasChanges && !loading && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100 text-center sm:text-left">
              You have unsaved changes
            </p>
          )}
        </div>
      </form>

      {/* Passkey Management Section */}
      <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-gray-200 dark:border-gray-600">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1 sm:mb-2">
            Passkey Authentication
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100">
            Use biometrics or security keys for secure, passwordless authentication.
          </p>
        </div>

        {!isWebAuthnSupported ? (
          /* WebAuthn Not Supported Message */
          <div
            className="p-4 sm:p-5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg"
            role="alert"
          >
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0"
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
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Passkeys Not Available
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Your browser doesn't support passkey authentication. To use passkeys, please update to the latest version of Chrome, Firefox, Safari, or Edge.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <PasskeyEnrollment
              userEmail={user.email}
              onEnrollmentComplete={() => setPasskeyRefreshKey(prev => prev + 1)}
            />

            <div className="mt-8 sm:mt-12">
              <PasskeyList
                key={passkeyRefreshKey}
                userEmail={user.email}
                onPasskeyDeleted={() => setPasskeyRefreshKey(prev => prev + 1)}
              />
            </div>

            {/* 2FA Toggle Section */}
            <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-gray-200 dark:border-gray-600">
              <Passkey2FAToggle
                userEmail={user.email}
                hasPasskeys={hasPasskeys}
                onToggleChange={() => {
                  // Optionally handle toggle change
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;
