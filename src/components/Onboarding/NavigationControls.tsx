import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export interface NavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
}

/**
 * NavigationControls component provides step navigation buttons
 * - Back button: Hidden on step 1, secondary variant
 * - Next button: Shown on steps 1-3, primary variant
 * - Get Started button: Shown on step 4, primary variant
 * Responsive: full-width on mobile, auto-width on desktop
 */
export function NavigationControls({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: NavigationControlsProps) {
  const isFirstStep = currentStep === 1;
  const isFinalStep = currentStep === totalSteps;

  return (
    <nav className="flex items-center justify-between gap-4 w-full max-w-md mx-auto mt-12" aria-label="Onboarding navigation">
      {/* Back Button - Hidden on step 1, ensures 44px touch target */}
      {!isFirstStep && (
        <Button
          variant="secondary"
          size="lg"
          onClick={onBack}
          className="flex-1 md:flex-initial md:min-w-[120px] min-h-[44px]"
          aria-label={`Go back to step ${currentStep - 1}`}
        >
          <ChevronLeft className="w-5 h-5 mr-2" aria-hidden="true" />
          Back
        </Button>
      )}

      {/* Next Button (steps 1-3) or Get Started Button (step 4), ensures 44px touch target */}
      <Button
        variant="primary"
        size="lg"
        onClick={onNext}
        className={`flex-1 md:flex-initial md:min-w-[160px] min-h-[44px] ${isFirstStep ? 'ml-auto' : ''}`}
        aria-label={isFinalStep ? 'Complete onboarding and get started with CloudDesk EDU' : `Continue to step ${currentStep + 1}`}
      >
        {isFinalStep ? (
          <>
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
          </>
        ) : (
          <>
            Next
            <ChevronRight className="w-5 h-5 ml-2" aria-hidden="true" />
          </>
        )}
      </Button>
    </nav>
  );
}
