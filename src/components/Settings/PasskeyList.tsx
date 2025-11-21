import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input, Label } from '../ui/Input';
import passkeyService, { type Passkey } from '../../services/passkeyService';

/**
 * PasskeyList Component
 * 
 * Displays and manages enrolled passkeys on the profile page.
 * Shows friendly name, type, enrollment date, and last used timestamp.
 * Allows users to delete and rename passkeys.
 * 
 * Requirements: 3.1, 3.2, 3.3, 4.1
 */

interface PasskeyListProps {
  userEmail: string;
  onPasskeyDeleted?: () => void;
}

export const PasskeyList: React.FC<PasskeyListProps> = ({
  userEmail,
  onPasskeyDeleted,
}) => {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  /**
   * Load passkeys from the server
   */
  const loadPasskeys = async () => {
    setLoading(true);
    setError(null);

    try {
      const passkeyList = await passkeyService.listPasskeys();
      setPasskeys(passkeyList);
    } catch (err: any) {
      console.error('Error loading passkeys:', err);
      setError(err.message || 'Failed to load passkeys. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load passkeys on mount
  useEffect(() => {
    loadPasskeys();
  }, [userEmail]);

  /**
   * Start editing a passkey name
   */
  const startEditing = (passkey: Passkey) => {
    setEditingId(passkey.id);
    setEditingName(passkey.friendlyName);
  };

  /**
   * Cancel editing
   */
  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  /**
   * Save the edited passkey name
   */
  const saveEdit = async (id: string) => {
    if (!editingName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await passkeyService.updatePasskeyName(id, editingName.trim());
      
      // Update local state
      setPasskeys(passkeys.map(pk => 
        pk.id === id ? { ...pk, friendlyName: editingName.trim() } : pk
      ));
      
      setEditingId(null);
      setEditingName('');
    } catch (err: any) {
      console.error('Error updating passkey name:', err);
      setError(err.message || 'Failed to update passkey name. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Start deletion confirmation
   */
  const startDeletion = (id: string) => {
    setDeletingId(id);
  };

  /**
   * Cancel deletion
   */
  const cancelDeletion = () => {
    setDeletingId(null);
  };

  /**
   * Confirm and delete passkey
   */
  const confirmDeletion = async (id: string) => {
    setActionLoading(true);
    setError(null);

    try {
      await passkeyService.deletePasskey(id);
      
      // Update local state
      setPasskeys(passkeys.filter(pk => pk.id !== id));
      setDeletingId(null);

      // Notify parent component
      if (onPasskeyDeleted) {
        onPasskeyDeleted();
      }
    } catch (err: any) {
      console.error('Error deleting passkey:', err);
      setError(err.message || 'Failed to delete passkey. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Format relative time for last used
   */
  const formatLastUsed = (date: Date | null): string => {
    if (!date) return 'Never used';
    
    const now = new Date();
    const lastUsed = new Date(date);
    const diffMs = now.getTime() - lastUsed.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(date);
  };

  /**
   * Get authenticator type label
   */
  const getTypeLabel = (type: 'platform' | 'cross-platform'): string => {
    return type === 'platform' ? 'Platform' : 'Security Key';
  };

  /**
   * Get authenticator type badge color
   */
  const getTypeBadgeColor = (type: 'platform' | 'cross-platform'): string => {
    return type === 'platform'
      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
      : 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200';
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-2xl">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1 sm:mb-2">
            Your Passkeys
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100">
            Manage your enrolled passkeys.
          </p>
        </div>

        <div className="flex items-center justify-center p-8">
          <svg
            className="animate-spin h-8 w-8 text-gray-400 dark:text-gray-500"
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
          <span className="ml-3 text-sm text-gray-600 dark:text-gray-100">Loading passkeys...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Section Header */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1 sm:mb-2">
          Your Passkeys
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100">
          Manage your enrolled passkeys.
        </p>
      </div>

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

      {/* Empty State */}
      {passkeys.length === 0 && (
        <div className="p-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-50 mb-2">
            No passkeys enrolled
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100">
            You haven't enrolled any passkeys yet. Add a passkey above to get started.
          </p>
        </div>
      )}

      {/* Passkey List */}
      {passkeys.length > 0 && (
        <div className="space-y-3">
          {passkeys.map((passkey) => (
            <div
              key={passkey.id}
              className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg"
            >
              {/* Deletion Confirmation */}
              {deletingId === passkey.id ? (
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-50 mb-2">
                    Delete this passkey?
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-100 mb-4">
                    This action cannot be undone. You will need to re-enroll this passkey if you want to use it again.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDeletion(passkey.id)}
                      disabled={actionLoading}
                      className="w-full sm:w-auto"
                      aria-label="Confirm deletion"
                    >
                      {actionLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={cancelDeletion}
                      disabled={actionLoading}
                      className="w-full sm:w-auto"
                      aria-label="Cancel deletion"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Passkey Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      {/* Editing Mode */}
                      {editingId === passkey.id ? (
                        <div className="space-y-2">
                          <Label htmlFor={`edit-name-${passkey.id}`} className="sr-only">
                            Edit passkey name
                          </Label>
                          <Input
                            id={`edit-name-${passkey.id}`}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            disabled={actionLoading}
                            maxLength={100}
                            className="text-sm"
                            aria-label="Passkey name"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => saveEdit(passkey.id)}
                              disabled={actionLoading || !editingName.trim()}
                              aria-label="Save name"
                            >
                              {actionLoading ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={cancelEditing}
                              disabled={actionLoading}
                              aria-label="Cancel editing"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Display Mode */}
                          <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-50 mb-1 truncate">
                            {passkey.friendlyName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-100">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(
                                passkey.authenticatorType
                              )}`}
                            >
                              {getTypeLabel(passkey.authenticatorType)}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500">•</span>
                            <span>Enrolled {formatDate(passkey.createdAt)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action Buttons (only show when not editing) */}
                    {editingId !== passkey.id && (
                      <div className="flex gap-2 ml-4">
                        <button
                          type="button"
                          onClick={() => startEditing(passkey)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                          aria-label="Edit passkey name"
                          title="Edit name"
                        >
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => startDeletion(passkey.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                          aria-label="Delete passkey"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Last Used (only show when not editing) */}
                  {editingId !== passkey.id && (
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Last used: {formatLastUsed(passkey.lastUsedAt)}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasskeyList;
