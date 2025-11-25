import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input, Label, HelperText } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { useInstancesDemo } from '../../hooks/useInstancesDemo';
import type { Instance } from '../../data/types';

/**
 * RestoreButton Component
 * 
 * Provides a button to restore backups to create new instances.
 * Shows a modal for instance name input and handles the restore process.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.5, 12.6, 12.7, 12.8
 */

interface RestoreButtonProps {
  backupId: string;
  machineImageName: string; // Reserved for future use - backend looks up from backup record
  defaultZone: string;
  onRestoreInitiated?: (instanceId: string) => void;
}

export function RestoreButton({
  backupId,
  machineImageName: _machineImageName, // Prefixed with _ to indicate intentionally unused
  defaultZone,
  onRestoreInitiated,
}: RestoreButtonProps): React.JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { createInstance } = useInstancesDemo();
  const isDemo = !isAuthenticated;
  
  const [showModal, setShowModal] = useState<boolean>(false);
  const [instanceName, setInstanceName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Validate instance name
   * Requirements: 12.6, 12.7
   */
  const validateInstanceName = (name: string): string | null => {
    // Check if empty or only whitespace
    if (!name || name.trim().length === 0) {
      return 'Instance name cannot be empty';
    }

    // Check for invalid characters (only allow lowercase alphanumeric and hyphens)
    // GCP instance names must start with a letter and can only contain lowercase letters, numbers, and hyphens
    const invalidCharsRegex = /[^a-z0-9\-]/;
    if (invalidCharsRegex.test(name)) {
      return 'Instance name contains invalid characters. Only lowercase letters, numbers, and hyphens are allowed';
    }

    // Check if starts with a letter
    if (!/^[a-z]/.test(name)) {
      return 'Instance name must start with a lowercase letter';
    }

    // Check if ends with alphanumeric (not hyphen)
    if (/-$/.test(name)) {
      return 'Instance name cannot end with a hyphen';
    }

    return null;
  };

  /**
   * Handle opening the modal
   */
  const handleOpenModal = () => {
    setShowModal(true);
    setInstanceName('');
    setError(null);
    setValidationError(null);
  };

  /**
   * Handle closing the modal
   */
  const handleCloseModal = () => {
    if (!loading) {
      setShowModal(false);
      setInstanceName('');
      setError(null);
      setValidationError(null);
    }
  };

  /**
   * Handle instance name input change
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase(); // Force lowercase
    setInstanceName(value);
    
    // Clear validation error when user types
    if (validationError) {
      setValidationError(null);
    }
  };

  /**
   * Handle restore operation
   * Requirements: 12.2, 12.3, 12.4, 12.5, 12.8
   */
  const handleRestore = async () => {
    // Validate instance name
    const validationErr = validateInstanceName(instanceName);
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let createdInstance: Instance;

      if (isDemo) {
        // Demo mode: Create instance directly using useInstancesDemo
        // In demo mode, we don't have actual machine images, so we create a regular instance
        createdInstance = await createInstance({
          name: instanceName.trim(),
          imageId: 'windows-server-2022',
          cpuCores: 4,
          ramGb: 16,
          storageGb: 100,
          gpu: 'NONE',
          region: 'SINGAPORE',
        });
      } else {
        // Authenticated mode: Use API to restore from backup
        createdInstance = await apiService.restoreBackup(backupId, {
          instanceName: instanceName.trim(),
          zone: defaultZone,
        });
      }

      // Close modal
      setShowModal(false);
      setInstanceName('');
      setLoading(false);

      // Call callback if provided
      if (onRestoreInitiated) {
        onRestoreInitiated(createdInstance.id);
      }

      // Show success notification and redirect to dashboard
      // Requirement 12.5: Redirect to dashboard on success
      setTimeout(() => {
        navigate(isDemo ? '/demo/dashboard' : '/dashboard');
      }, 100);

    } catch (err: any) {
      console.error('Restore error:', err);
      setError(err.message || 'Failed to restore backup. Please try again.');
      setLoading(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRestore();
  };

  return (
    <>
      {/* Restore Button */}
      <Button
        type="button"
        variant="primary"
        onClick={handleOpenModal}
        className="w-full sm:w-auto"
        aria-label="Restore backup"
        title="Restore this backup to create a new instance"
      >
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Restore Backup
      </Button>

      {/* Restore Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-modal-title"
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mb-4">
              <h3
                id="restore-modal-title"
                className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2"
              >
                Restore Backup
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-100">
                Create a new instance from this backup
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="mb-4 p-3 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-300 mt-0.5 mr-3 flex-shrink-0"
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
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Restore failed
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-200 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div
                className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-300 mt-0.5 mr-3 flex-shrink-0"
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
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Restoring backup...
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      Creating new instance. This may take a few moments.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Label htmlFor="instanceName" required>
                  New Instance Name
                </Label>
                <Input
                  id="instanceName"
                  type="text"
                  value={instanceName}
                  onChange={handleNameChange}
                  placeholder="e.g., restored-desktop-01"
                  disabled={loading}
                  error={!!validationError}
                  className="mt-1"
                  aria-label="Instance name"
                  autoFocus
                />
                {validationError ? (
                  <HelperText error>
                    {validationError}
                  </HelperText>
                ) : (
                  <HelperText>
                    Enter a name for the new instance (lowercase letters, numbers, and hyphens only)
                  </HelperText>
                )}
              </div>

              {/* Info Message */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-300 mt-0.5 mr-3 flex-shrink-0"
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
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    A new instance will be created from this backup in zone <span className="font-medium">{defaultZone}</span>. You'll be redirected to the dashboard once the restore begins.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !instanceName.trim()}
                  className="w-full sm:w-auto"
                  aria-label="Restore backup"
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
                      Restoring...
                    </span>
                  ) : (
                    'Restore Backup'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="w-full sm:w-auto"
                  aria-label="Cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default RestoreButton;
