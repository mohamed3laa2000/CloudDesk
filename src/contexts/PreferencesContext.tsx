import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';
import type { UserPreferences } from '../types/preferences';
import { DEFAULT_PREFERENCES, ACCENT_COLORS, type ThemeMode } from '../types/preferences';

export interface PreferencesContextValue {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  applyTheme: (theme: ThemeMode, accentColor: string) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

interface PreferencesProviderProps {
  children: ReactNode;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const applyTheme = (theme: ThemeMode, accentColor: string): void => {
    const root = document.documentElement;
    let effectiveTheme = theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', effectiveTheme);
    const accentClass = ACCENT_COLORS.find((c) => c.value === accentColor)?.class || 'accent-teal';
    root.className = accentClass;
    localStorage.setItem('theme', theme);
    localStorage.setItem('accentColor', accentColor);
  };

  const loadPreferences = async (): Promise<void> => {
    if (!isAuthenticated) {
      const storedTheme = localStorage.getItem('theme') as ThemeMode | null;
      const storedAccentColor = localStorage.getItem('accentColor');
      if (storedTheme || storedAccentColor) {
        const prefs: UserPreferences = {
          theme: storedTheme || DEFAULT_PREFERENCES.theme,
          accentColor: storedAccentColor || DEFAULT_PREFERENCES.accentColor,
        };
        setPreferences(prefs);
        applyTheme(prefs.theme, prefs.accentColor);
      } else {
        applyTheme(DEFAULT_PREFERENCES.theme, DEFAULT_PREFERENCES.accentColor);
      }
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userPrefs = await apiService.getUserPreferences();
      setPreferences(userPrefs);
      applyTheme(userPrefs.theme, userPrefs.accentColor);
    } catch (err: any) {
      console.error('Failed to load preferences:', err);
      if (err.response?.status === 404) {
        setPreferences(DEFAULT_PREFERENCES);
        applyTheme(DEFAULT_PREFERENCES.theme, DEFAULT_PREFERENCES.accentColor);
      } else {
        setError(err.message || 'Failed to load preferences');
        const storedTheme = localStorage.getItem('theme') as ThemeMode | null;
        const storedAccentColor = localStorage.getItem('accentColor');
        if (storedTheme || storedAccentColor) {
          const prefs: UserPreferences = {
            theme: storedTheme || DEFAULT_PREFERENCES.theme,
            accentColor: storedAccentColor || DEFAULT_PREFERENCES.accentColor,
          };
          setPreferences(prefs);
          applyTheme(prefs.theme, prefs.accentColor);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      if (!isAuthenticated) {
        const updatedPrefs = { ...preferences, ...prefs };
        setPreferences(updatedPrefs);
        applyTheme(updatedPrefs.theme, updatedPrefs.accentColor);
        return;
      }
      const updatedPrefs = await apiService.updateUserPreferences(prefs);
      setPreferences(updatedPrefs);
      applyTheme(updatedPrefs.theme, updatedPrefs.accentColor);
    } catch (err: any) {
      console.error('Failed to update preferences:', err);
      setError(err.message || 'Failed to update preferences');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPreferences = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      if (!isAuthenticated) {
        setPreferences(DEFAULT_PREFERENCES);
        applyTheme(DEFAULT_PREFERENCES.theme, DEFAULT_PREFERENCES.accentColor);
        return;
      }
      const resetPrefs = await apiService.updateUserPreferences(DEFAULT_PREFERENCES);
      setPreferences(resetPrefs);
      applyTheme(resetPrefs.theme, resetPrefs.accentColor);
    } catch (err: any) {
      console.error('Failed to reset preferences:', err);
      setError(err.message || 'Failed to reset preferences');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (preferences.theme !== 'system') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme(preferences.theme, preferences.accentColor);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [preferences.theme, preferences.accentColor]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' || e.key === 'accentColor') {
        const theme = (localStorage.getItem('theme') as ThemeMode) || preferences.theme;
        const accentColor = localStorage.getItem('accentColor') || preferences.accentColor;
        setPreferences({ theme, accentColor });
        applyTheme(theme, accentColor);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [preferences]);

  const value: PreferencesContextValue = {
    preferences,
    loading,
    error,
    updatePreferences,
    resetPreferences,
    applyTheme,
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = (): PreferencesContextValue => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
