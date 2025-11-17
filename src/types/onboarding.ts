import type { LucideIcon } from 'lucide-react';

/**
 * Represents a single step in the onboarding flow
 */
export interface OnboardingStep {
  id: number;
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
  illustration?: string;
}

/**
 * Schema for onboarding completion data stored in localStorage
 */
export interface OnboardingStorage {
  onboardingCompleted: boolean;
  completedAt: string;
  version: string;
}
