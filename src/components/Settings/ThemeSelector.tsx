import React from 'react';
import type { ThemeMode } from '../../types/preferences';

/**
 * ThemeSelector Component
 * 
 * Displays a radio group for selecting theme preferences (Light, Dark, System).
 * Shows visual previews and icons for each theme option.
 * 
 * Requirements: 3.1, 3.2
 */

export interface ThemeSelectorProps {
  /** Currently selected theme */
  value: ThemeMode;
  /** Callback when theme selection changes */
  onChange: (theme: ThemeMode) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

interface ThemeOption {
  value: ThemeMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const themeOptions: ThemeOption[] = [
    {
      value: 'light',
      label: 'Light',
      description: 'Use light mode',
      icon: (
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Use dark mode',
      icon: (
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ),
    },
    {
      value: 'system',
      label: 'System',
      description: 'Sync with system settings',
      icon: (
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  const handleChange = (theme: ThemeMode) => {
    if (!disabled) {
      onChange(theme);
    }
  };

  return (
    <div
      className="space-y-2 sm:space-y-3"
      role="radiogroup"
      aria-label="Theme selection"
    >
      {themeOptions.map((option) => {
        const isSelected = value === option.value;
        
        return (
          <label
            key={option.value}
            className={`
              flex items-center p-3 sm:p-4 border-2 rounded-lg transition-all
              ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-teal-500'}
              ${isSelected ? 'border-teal-600 bg-teal-50' : 'border-gray-200 bg-white'}
            `}
            style={{
              borderColor: isSelected ? 'var(--color-accent)' : '#e5e7eb',
              backgroundColor: isSelected ? 'rgba(20, 184, 166, 0.05)' : 'transparent',
            }}
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={isSelected}
              onChange={() => handleChange(option.value)}
              disabled={disabled}
              className="w-4 h-4 text-teal-600 focus:ring-teal-500 focus:ring-2 focus:ring-offset-2 flex-shrink-0"
              aria-label={`${option.label} theme`}
            />
            
            <div className="ml-2 sm:ml-3 flex-1 min-w-0">
              <div className="flex items-center">
                <span className="mr-1.5 sm:mr-2 flex-shrink-0">{option.icon}</span>
                <span className="text-sm sm:text-base font-medium text-gray-900">
                  {option.label}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                {option.description}
              </p>
            </div>

            {/* Visual Preview - Hidden on mobile, shown on tablet+ */}
            <div className="hidden sm:flex ml-3 md:ml-4 items-center gap-1 flex-shrink-0" aria-hidden="true">
              {option.value === 'light' && (
                <div className="flex gap-1">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded border border-gray-300 bg-white" />
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded border border-gray-300 bg-gray-100" />
                </div>
              )}
              {option.value === 'dark' && (
                <div className="flex gap-1">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded border border-gray-600 bg-gray-900" />
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded border border-gray-600 bg-gray-800" />
                </div>
              )}
              {option.value === 'system' && (
                <div className="flex gap-1">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded border border-gray-300 bg-gradient-to-br from-white to-gray-900" />
                </div>
              )}
            </div>

            {/* Selected Indicator */}
            {isSelected && (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0"
                style={{ color: 'var(--color-accent)' }}
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
            )}
          </label>
        );
      })}
    </div>
  );
};

export default ThemeSelector;
