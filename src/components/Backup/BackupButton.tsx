import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input, Label, HelperText } from '../ui/Input';
import { useBackupsDemo } from '../../hooks/useBackupsDemo';
import type { Backup } from '../../data/types';

/**
 * BackupButton Component
 * 
 * Provides a button to create backups of VM instances.
 * Shows a modal for backup name input and handles the backup creation process.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1
 */

interface BackupButtonProps {
  instanceId: string;
  instanceName: string;
  instanceZone: string;
  instanceStatus: string;
  storageGb?: number; // Optional storage size for demo mode
  onBackupCreated?: (backup: Backup) => void;
}

export function BackupButton({
  instanceId,
  instanceName,
  instanceZone,
  instanceStatus,
  storageGb = 50, // Default to 50GB if not provided
  onBackupCreated,
}: BackupButtonProps): React.JSX.Element {
  const { createBackup } = useBackupsDemo();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [backupName, setBackupName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if instance is running
  const isDisabled = instanceStatus !== 'RUNNING';

  /**
   * Validate backup name
   * Requirements: 1.4, 1.5
   */
  const validateBackupName = (name: string): string | null => {
    // Check if empty or only whitespace
    if (!name || name.trim().length === 0) {
      return 'Backup name cannot be empty';
    }

    // Check max length (100 characters)
    if (name.length > 100) {
      return 'Backup name cannot exceed 100 characters';
    }

    // Check for invalid characters (only allow alphanumeric, spaces, hyphens, underscores)
    const invalidCharsRegex = /[^a-zA-Z0-9\s\-_]/;
    if (invalidCharsRegex.test(name)) {
      return 'Backup name contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores are allowed';
    }

    return null;
  };

  /**
   * Handle opening the modal
   */
  const handleOpenModal = () => {
    setShowModal(true);
    setBackupName('');
    setError(null);
    setSuccess(null);
    setValidationError(null);
  };

  /**
   * Handle closing the modal
   */
  const handleCloseModal = () => {
    if (!loading) {
      setShowModal(false);
      setBackupName('');
      setError(null);
      setValidationError(null);
    }
  };

  /**
   * Handle backup name input change
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBackupName(value);
    
    // Clear validation error when user types
    if (validationError) {
      setValidationError(null);
    }
  };

  /**
   * Handle backup creation
   * Requirements: 1.2, 1.3, 8.1
   */
  const handleCreateBackup = async () => {
    // Validate backup name
    const validationErr = validateBackupName(backupName);
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call create backup (works for both demo and authenticated mode)
      const backup = await createBackup({
        instanceId,
        name: backupName.trim(),
        sourceInstanceName: instanceName,
        sourceInstanceZone: instanceZone,
        storageGb,
      });

      // Close modal immediately
      setShowModal(false);
      setBackupName('');
      setSuccess(null);
      setLoading(false);

      // Call callback if provided with success message
      if (onBackupCreated) {
        onBackupCreated(backup);
      }

    } catch (err: any) {
      console.error('Backup creation error:', err);
      setError(err.message || 'Failed to create backup. Please try again.');
      setLoading(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateBackup();
  };

  return (
    <>
      {/* Backup Button */}
      <Button
        type="button"
        variant="secondary"
        onClick={handleOpenModal}
        disabled={isDisabled}
        className="w-full sm:w-auto"
        aria-label="Create backup"
        title={isDisabled ? 'Instance must be running to create a backup' : 'Create a backup of this instance'}
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
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
          />
        </svg>
        Create Backup
      </Button>

      {/* Backup Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="backup-modal-title"
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mb-4">
              <h3
                id="backup-modal-title"
                className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2"
              >
                Create Backup
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-100">
                Create a backup of <span className="font-medium">{instanceName}</span>
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div
                className="mb-4 p-3 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700 rounded-lg"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-300 mt-0.5 mr-3 flex-shrink-0"
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
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {success}
                  </p>
                </div>
              </div>
            )}

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
                      Backup creation failed
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
                      Creating backup...
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      This may take several minutes. Please wait.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Label htmlFor="backupName" required>
                  Backup Name
                </Label>
                <Input
                  id="backupName"
                  type="text"
                  value={backupName}
                  onChange={handleNameChange}
                  placeholder="e.g., Before System Update"
                  disabled={loading}
                  error={!!validationError}
                  className="mt-1"
                  maxLength={100}
                  aria-label="Backup name"
                  autoFocus
                />
                {validationError ? (
                  <HelperText error>
                    {validationError}
                  </HelperText>
                ) : (
                  <HelperText>
                    Enter a descriptive name for this backup (max 100 characters)
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
                    Backup creation will take some time to complete. You can continue using the application while the backup is being created.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !backupName.trim()}
                  className="w-full sm:w-auto"
                  aria-label="Create backup"
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
                      Creating...
                    </span>
                  ) : (
                    'Create Backup'
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

export default BackupButton;
