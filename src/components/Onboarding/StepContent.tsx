import { onboardingSteps } from '../../data/onboardingSteps';

export interface StepContentProps {
  step: number;
}

/**
 * StepContent component renders the content for a specific onboarding step
 * Displays icon, heading, description, and optional feature list
 * Content is dynamically loaded based on the step number
 */
export function StepContent({ step }: StepContentProps) {
  // Get the step data (step is 1-indexed, array is 0-indexed)
  const stepData = onboardingSteps[step - 1];

  // If step is invalid, return null
  if (!stepData) {
    return null;
  }

  const IconComponent = stepData.icon;

  return (
    <div className="flex flex-col items-center text-center max-w-3xl mx-auto px-4 animate-fadeIn">
      {/* Icon Container */}
      <div 
        className="flex items-center justify-center w-20 h-20 rounded-lg bg-teal-50 mb-6 transition-all duration-200"
        aria-hidden="true"
      >
        <IconComponent className="w-10 h-10 text-teal-600" aria-hidden="true" />
      </div>

      {/* Heading - Responsive typography */}
      <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
        {stepData.title}
      </h2>

      {/* Description - Responsive typography */}
      <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-2xl">
        {stepData.description}
      </p>

      {/* Optional Feature List */}
      {stepData.features && stepData.features.length > 0 && (
        <ul className="space-y-3 text-left w-full max-w-md" aria-label="Key features">
          {stepData.features.map((feature, index) => (
            <li
              key={index}
              className="flex items-start text-base text-gray-700"
            >
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 mr-3" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
