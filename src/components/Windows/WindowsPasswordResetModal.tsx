import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input, Label, HelperText } from '../ui/Input';
import type { WindowsPasswordResetResponse } from '../../data/types';

export interface WindowsPasswordResetModalProps {
  instanceId: string;
  instanceName: string;
  isOpen: boolean;
  onClose: () => void;
  onResetPassword: (username: string) => Promise<WindowsPasswordResetResponse>;
}

export function WindowsPasswordResetModal({
  instanceName,
  isOpen,
  onClose,
  onResetPassword,
}: WindowsPasswordResetModalProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState<WindowsPasswordResetResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setError(null);
      setPasswordData(null);
      setCopied(false);
      setValidationError(null);
    }
  }, [isOpen]);

  // Validate Windows username format
  const validateUsername = (value: string): boolean => {
    if (!value || value.trim().length === 0) {
      setValidationError('Username is required');
      return false;
    }

    // Windows username rules:
    // - Cannot contain: " / \ [ ] : ; | = , + * ? < > @
    // - Cannot be only periods or spaces
    // - Max 20 characters
    const invalidChars = /["\/\\[\]:;|=,+*?<>@]/;
    const onlyPeriodsOrSpaces = /^[.\s]+$/;

    if (invalidChars.test(value)) {
      setValidationError('Username contains invalid characters');
      return false;
    }

    if (onlyPeriodsOrSpaces.test(value)) {
      setValidationError('Username cannot be only periods or spaces');
      return false;
    }

    if (value.length > 20) {
      setValidationError('Username must be 20 characters or less');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (value) {
      validateUsername(value);
    } else {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUsername(username)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onResetPassword(username);
      setPasswordData(result);
    } catch (err: any) {
      // Use the error message from the API service (which handles GCP errors)
      const errorMessage = err?.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      
      console.error('Password reset failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (passwordData?.password) {
      try {
        await navigator.clipboard.writeText(passwordData.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy password:', err);
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h2
            id="modal-title"
            className="text-xl font-semibold text-[var(--color-text-primary)]"
          >
            Reset Windows Password
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {instanceName}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {!passwordData ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" required>
                    Windows Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="e.g., Administrator"
                    disabled={isLoading}
                    error={!!validationError}
                    className="mt-1"
                    autoFocus
                  />
                  {validationError && (
                    <HelperText error>{validationError}</HelperText>
                  )}
                  {!validationError && (
                    <HelperText>
                      Enter the Windows username for which you want to reset the password
                    </HelperText>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)] rounded-lg">
                    <p className="text-sm text-[var(--color-error)]">{error}</p>
                  </div>
                )}

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Note:</strong> This will generate a new password for the specified user account.
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading || !username || !!validationError}
                  className="flex-1"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Password reset successful!
                </p>
              </div>

              {/* Password Display */}
              <div>
                <Label htmlFor="display-username">Username</Label>
                <Input
                  id="display-username"
                  type="text"
                  value={passwordData.username}
                  readOnly
                  className="mt-1 bg-[var(--color-background)]"
                />
              </div>

              <div>
                <Label htmlFor="display-password">Password</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="display-password"
                    type="text"
                    value={passwordData.password}
                    readOnly
                    className="flex-1 font-mono bg-[var(--color-background)]"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCopyPassword}
                    className="px-4"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="display-ip">IP Address</Label>
                <Input
                  id="display-ip"
                  type="text"
                  value={passwordData.ipAddress}
                  readOnly
                  className="mt-1 bg-[var(--color-background)]"
                />
              </div>

              {/* Security Warning */}
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
                  ⚠️ Security Warning
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Save this password immediately. It cannot be retrieved again. Store it securely and do not share it with others.
                </p>
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-6">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleClose}
                  className="min-w-[120px]"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
