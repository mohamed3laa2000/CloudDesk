/**
 * User preferences types and constants
 * Requirements: 3.1, 3.5
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: ThemeMode;
  accentColor: string;
}

export interface ProfileUpdateData {
  name: string;
}

export const ACCENT_COLORS = [
  { name: 'Teal', value: '#14b8a6', class: 'accent-teal' },
  { name: 'Indigo', value: '#6366f1', class: 'accent-indigo' },
  { name: 'Purple', value: '#a855f7', class: 'accent-purple' },
  { name: 'Pink', value: '#ec4899', class: 'accent-pink' },
  { name: 'Orange', value: '#f97316', class: 'accent-orange' },
] as const;

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  accentColor: '#14b8a6', // Teal (current primary color)
};
