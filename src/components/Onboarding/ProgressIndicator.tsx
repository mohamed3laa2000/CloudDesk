import { Check } from 'lucide-react';

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * ProgressIndicator component displays the user's position in the onboarding flow
 * Shows horizontal step indicators with visual states for active, completed, and upcoming steps
 * Responsive: full labels on desktop, compact on mobile
 */
export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <nav aria-label="Onboarding progress" className="w-full">
      {/* Mobile: Compact text display */}
      <div className="md:hidden text-center mb-8">
        <p className="text-sm font-medium text-gray-600" role="status" aria-live="polite" aria-atomic="true">
          Step {currentStep} of {totalSteps}
        </p>
      </div>

      {/* Desktop: Full step indicators */}
      <ol className="hidden md:flex items-center justify-center mb-12 list-none">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <li key={stepNumber} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                    ${isCompleted ? 'bg-teal-600 border-teal-600' : ''}
                    ${isActive ? 'bg-teal-600 border-teal-600 ring-4 ring-teal-100' : ''}
                    ${isUpcoming ? 'bg-white border-gray-300' : ''}
                  `}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Step ${stepNumber}${isActive ? ', current step' : ''}${isCompleted ? ', completed' : ''}${isUpcoming ? ', upcoming' : ''}`}
                  role="img"
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" aria-hidden="true" />
                  ) : (
                    <span
                      className={`
                        text-sm font-semibold
                        ${isActive ? 'text-white' : ''}
                        ${isUpcoming ? 'text-gray-400' : ''}
                      `}
                      aria-hidden="true"
                    >
                      {stepNumber}
                    </span>
                  )}
                </div>
                
                {/* Step Label */}
                <span
                  className={`
                    mt-2 text-xs font-medium whitespace-nowrap
                    ${isActive || isCompleted ? 'text-teal-600' : 'text-gray-400'}
                  `}
                  aria-hidden="true"
                >
                  Step {stepNumber}
                </span>
              </div>

              {/* Connecting Line */}
              {stepNumber < totalSteps && (
                <div
                  className={`
                    w-16 h-0.5 mx-2 transition-all duration-300 ease-in-out
                    ${stepNumber < currentStep ? 'bg-teal-600' : 'bg-gray-200'}
                  `}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
