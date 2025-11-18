import React, { useState, useEffect } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import { Button } from '../ui/Button';
import { ThemeSelector } from './ThemeSelector';
import { AccentColorPicker } from './AccentColorPicker';
import type { UserPreferences, ThemeMode } from '../../types/preferences';

/**
 * AppearanceSection Component
 * 
 * Displays and manages user appearance preferences including theme and accent color.
 * Allows authenticated users to customize the visual appearance of the application.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */
export const AppearanceSection: React.FC = () => {
  const { preferences, loading: contextLoading, updatePreferences, resetPreferences, applyTheme } = usePreferences();
  
  // Local state for form values (for live preview)
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(preferences.theme);
  const [selectedAccentColor, setSelectedAccentColor] = useState<string>(preferences.accentColor);
  
  // UI state
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [showResetDialog, setShowResetDialog] = useState<boolean>(false);

  // Sync local state with context preferences
  useEffect(() => {
    setSelectedTheme(preferences.theme);
    setSelectedAccentColor(preferences.accentColor);
  }, [preferences]);

  // Track if there are unsaved changes
  useEffect(() => {
    const themeChanged = selectedTheme !== preferences.theme;
    const colorChanged = selectedAccentColor !== preferences.accentColor;
    setHasChanges(themeChanged || colorChanged);
  }, [selectedTheme, selectedAccentColor, preferences]);

  /**
   * Handle theme selection change
   * Apply theme immediately for live preview
   */
  const handleThemeChange = (theme: ThemeMode) => {
    setSelectedTheme(theme);
    // Apply theme immediately for live preview
    applyTheme(theme, selectedAccentColor);
    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  /**
   * Handle accent color selection change
   * Apply color immediately for live preview
   */
  const handleAccentColorChange = (color: string) => {
    setSelectedAccentColor(color);
    // Apply color immediately for live preview
    applyTheme(selectedTheme, color);
    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  /**
   * Handle save button click
   * Persist preferences to backend
   */
  const handleSave = async () => {
    // Clear previous messages
    setSuccess(false);
    setError(null);

    // Check if there are actual changes
    if (!hasChanges) {
      setError('No changes to save');
      return;
    }

    setSaving(true);

    try {
      // Update preferences via context
      const updatedPrefs: Partial<UserPreferences> = {
        theme: selectedTheme,
        accentColor: selectedAccentColor,
      };
      
      await updatePreferences(updatedPrefs);
      
      setSuccess(true);
      setHasChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      console.error('Preferences update error:', err);
      setError(err.message || 'Failed to update preferences. Please try again.');
      
      // Revert to saved preferences on error
      setSelectedTheme(preferences.theme);
      setSelectedAccentColor(preferences.accentColor);
      applyTheme(preferences.theme, preferences.accentColor);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle reset to defaults button click
   * Show confirmation dialog
   */
  const handleResetClick = () => {
    setShowResetDialog(true);
  };

  /**
   * Handle reset confirmation
   * Reset preferences to default values
   */
  const handleResetConfirm = async () => {
    setShowResetDialog(false);
    setSuccess(false);
    setError(null);
    setSaving(true);

    try {
      // Reset preferences via context
      await resetPreferences();
      
      setSuccess(true);
      setHasChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      console.error('Preferences reset error:', err);
      setError(err.message || 'Failed to reset preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle reset cancellation
   */
  const handleResetCancel = () => {
    setShowResetDialog(false);
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Section Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
          Appearance
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          Customize the look and feel of your CloudDesk EDU experience.
        </p>
      </div>

      {/* Appearance Form */}
      <div className="space-y-6 sm:space-y-8">
        {/* Theme Selector Section */}
        <div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">
            Theme
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Choose your preferred color scheme or sync with your system settings.
          </p>
          
          <ThemeSelector
            value={selectedTheme}
            onChange={handleThemeChange}
            disabled={saving || contextLoading}
          />
        </div>

        {/* Accent Color Picker Section */}
        <div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-3">
            Accent Color
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Choose an accent color to personalize your interface.
          </p>
          
          <AccentColorPicker
            value={selectedAccentColor}
            onChange={handleAccentColorChange}
            disabled={saving || contextLoading}
          />
        </div>

        {/* Success Message */}
        {success && (
          <div
            className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0"
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
                <p className="text-xs sm:text-sm font-medium text-green-800">
                  Preferences updated successfully
                </p>
                <p className="text-xs sm:text-sm text-green-700 mt-1">
                  Your appearance settings have been saved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0"
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
                <p className="text-xs sm:text-sm font-medium text-red-800">
                  Failed to update preferences
                </p>
                <p className="text-xs sm:text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={saving || contextLoading || !hasChanges}
            className="w-full sm:w-auto sm:min-w-[120px]"
            aria-label="Save appearance preferences"
          >
            {saving ? (
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

          <Button
            type="button"
            variant="secondary"
            onClick={handleResetClick}
            disabled={saving || contextLoading}
            className="w-full sm:w-auto"
            aria-label="Reset to default preferences"
          >
            Reset to Defaults
          </Button>
          
          {hasChanges && !saving && (
            <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              You have unsaved changes
            </p>
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
            <h3
              id="reset-dialog-title"
              className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2"
            >
              Reset to Defaults
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              Are you sure you want to reset all appearance preferences to their default values? This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleResetCancel}
                className="w-full sm:w-auto"
                aria-label="Cancel reset"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleResetConfirm}
                className="w-full sm:w-auto"
                aria-label="Confirm reset to defaults"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppearanceSection;
