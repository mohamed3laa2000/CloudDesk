import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  OnboardingLayout,
  ProgressIndicator,
  StepContent,
  NavigationControls,
} from '../components/Onboarding';
import { onboardingSteps } from '../data/onboardingSteps';
import {
  hasCompletedOnboarding,
  setOnboardingCompleted,
} from '../utils/onboardingStorage';

const TOTAL_STEPS = onboardingSteps.length;

/**
 * Validates if a step number is within valid range
 * @param step - The step number to validate
 * @returns true if step is valid (1-TOTAL_STEPS), false otherwise
 */
const isValidStep = (step: number): boolean => {
  return Number.isInteger(step) && step >= 1 && step <= TOTAL_STEPS;
};

/**
 * Extracts step number from URL search params
 * @param search - URL search string
 * @returns step number if valid, null otherwise
 */
const getStepFromUrl = (search: string): number | null => {
  const params = new URLSearchParams(search);
  const stepParam = params.get('step');
  if (!stepParam) return null;
  
  const step = parseInt(stepParam, 10);
  return isValidStep(step) ? step : null;
};

/**
 * OnboardingFlow page component
 * Manages the multi-step onboarding experience for new users
 * Features:
 * - State management for current step (1-4)
 * - Navigation handlers (next, back, skip)
 * - Keyboard shortcuts (Enter for next, Escape for skip)
 * - localStorage integration for returning users
 * - Automatic redirect to login after completion
 * - Error handling for invalid steps and localStorage unavailability
 * - Browser back/forward button support
 */
export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(() => {
    // Initialize from URL if available, otherwise default to 1
    const urlStep = getStepFromUrl(location.search);
    return urlStep || 1;
  });

  // Check if user has already completed onboarding on mount
  useEffect(() => {
    if (hasCompletedOnboarding()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Sync state with URL and handle browser back/forward navigation
  useEffect(() => {
    const urlStep = getStepFromUrl(location.search);
    
    if (urlStep !== null) {
      // Valid step in URL - sync state
      if (urlStep !== currentStep) {
        setCurrentStep(urlStep);
      }
    } else if (location.search) {
      // Invalid step parameter in URL - redirect to step 1
      navigate('/onboarding?step=1', { replace: true });
      setCurrentStep(1);
    } else {
      // No step parameter - add current step to URL
      navigate(`/onboarding?step=${currentStep}`, { replace: true });
    }
  }, [location.search, navigate]);

  // Update URL when step changes programmatically
  useEffect(() => {
    const urlStep = getStepFromUrl(location.search);
    if (urlStep !== currentStep) {
      navigate(`/onboarding?step=${currentStep}`, { replace: false });
    }
  }, [currentStep]);

  // Handle advancing to next step or completing onboarding
  const handleNext = useCallback(() => {
    // Validate current step before proceeding
    if (!isValidStep(currentStep)) {
      setCurrentStep(1);
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step - mark as completed and navigate to login
      setOnboardingCompleted();
      navigate('/login');
    }
  }, [currentStep, navigate]);

  // Handle going back to previous step
  const handleBack = useCallback(() => {
    // Validate current step before going back
    if (!isValidStep(currentStep)) {
      setCurrentStep(1);
      return;
    }

    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Handle skipping onboarding
  const handleSkip = useCallback(() => {
    // Note: We don't set completion flag when skipping
    navigate('/login');
  }, [navigate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleNext();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handleSkip]);

  // Safeguard: Ensure current step is always valid
  const safeCurrentStep = isValidStep(currentStep) ? currentStep : 1;

  // If step was invalid and corrected, update state
  useEffect(() => {
    if (currentStep !== safeCurrentStep) {
      setCurrentStep(safeCurrentStep);
    }
  }, [currentStep, safeCurrentStep]);

  return (
    <OnboardingLayout onSkip={handleSkip}>
      <div className="space-y-8">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={safeCurrentStep} totalSteps={TOTAL_STEPS} />

        {/* Step Content - key prop triggers animation on step change */}
        <section aria-live="polite" aria-atomic="true" aria-label={`Step ${safeCurrentStep} of ${TOTAL_STEPS}`}>
          <StepContent key={safeCurrentStep} step={safeCurrentStep} />
        </section>

        {/* Navigation Controls */}
        <NavigationControls
          currentStep={safeCurrentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onBack={handleBack}
        />
      </div>
    </OnboardingLayout>
  );
}
