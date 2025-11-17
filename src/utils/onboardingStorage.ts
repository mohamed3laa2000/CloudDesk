import type { OnboardingStorage } from '../types/onboarding';

const ONBOARDING_STORAGE_KEY = 'clouddesk_onboarding';
const ONBOARDING_VERSION = '1.0';

/**
 * Checks if the user has completed the onboarding flow
 * @returns true if onboarding is completed, false otherwise
 */
export const hasCompletedOnboarding = (): boolean => {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) return false;

    const data: OnboardingStorage = JSON.parse(stored);
    return data.onboardingCompleted === true && data.version === ONBOARDING_VERSION;
  } catch (error) {
    console.error('Error reading onboarding status from localStorage:', error);
    return false;
  }
};

/**
 * Marks the onboarding flow as completed
 */
export const setOnboardingCompleted = (): void => {
  try {
    const data: OnboardingStorage = {
      onboardingCompleted: true,
      completedAt: new Date().toISOString(),
      version: ONBOARDING_VERSION
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving onboarding status to localStorage:', error);
  }
};

/**
 * Resets the onboarding completion status
 * Useful for testing or allowing users to view the onboarding again
 */
export const resetOnboarding = (): void => {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
  }
};

/**
 * Gets the full onboarding storage data
 * @returns OnboardingStorage object or null if not found
 */
export const getOnboardingData = (): OnboardingStorage | null => {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) return null;

    return JSON.parse(stored) as OnboardingStorage;
  } catch (error) {
    console.error('Error reading onboarding data from localStorage:', error);
    return null;
  }
};
