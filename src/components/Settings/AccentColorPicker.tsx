import React from 'react';
import { ACCENT_COLORS } from '../../types/preferences';

/**
 * AccentColorPicker Component Props
 */
interface AccentColorPickerProps {
  /** Currently selected accent color hex value */
  value: string;
  /** Callback when a color is selected */
  onChange: (color: string) => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
}

/**
 * AccentColorPicker Component
 * 
 * Displays a grid of accent color options for user selection.
 * Shows color name and preview circle for each option.
 * Highlights the currently selected accent color.
 * 
 * Responsive grid layout:
 * - Mobile (< 640px): 1 column
 * - Tablet (640px - 1024px): 2 columns
 * - Desktop (> 1024px): 3 columns
 * 
 * Requirements: 3.5
 */
export const AccentColorPicker: React.FC<AccentColorPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  /**
   * Handle color selection
   */
  const handleColorSelect = (colorValue: string) => {
    if (!disabled) {
      onChange(colorValue);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
      {ACCENT_COLORS.map((color) => {
        const isSelected = value === color.value;

        return (
          <button
            key={color.value}
            type="button"
            onClick={() => handleColorSelect(color.value)}
            disabled={disabled}
            className="flex flex-col items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: isSelected ? color.value : '#e5e7eb',
              backgroundColor: isSelected ? `${color.value}10` : 'transparent',
            }}
            aria-label={`${color.name} accent color`}
            aria-pressed={isSelected}
          >
            {/* Color Preview Circle */}
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-1.5 sm:mb-2 shadow-md"
              style={{ backgroundColor: color.value }}
              aria-hidden="true"
            />
            
            {/* Color Name */}
            <span className="text-xs sm:text-sm font-medium text-gray-900">
              {color.name}
            </span>
            
            {/* Selected Indicator */}
            {isSelected && (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 sm:mt-1"
                style={{ color: color.value }}
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
          </button>
        );
      })}
    </div>
  );
};

export default AccentColorPicker;
