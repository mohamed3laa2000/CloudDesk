import type { ReactNode } from 'react';
import { Button } from '../ui/Button';

export interface OnboardingLayoutProps {
  children: ReactNode;
  onSkip: () => void;
}

/**
 * OnboardingLayout component provides consistent layout structure for all onboarding steps
 * Features:
 * - Full-screen layout with header, content area, and footer
 * - CloudDesk logo in header
 * - Skip button in header
 * - Responsive padding (4-8 on mobile, 8-16 on desktop)
 * - White background with centered content
 */
export function OnboardingLayout({ children, onSkip }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-8 md:px-16 flex items-center justify-between">
          {/* CloudDesk Logo */}
          <div className="flex items-center">
            <img
              src="/logo-clouddesk.png"
              alt="CloudDesk EDU"
              className="h-8 w-auto transition-opacity duration-150"
            />
          </div>

          {/* Skip Button - Ensure minimum touch target on mobile */}
          <Button
            variant="ghost"
            size="md"
            onClick={onSkip}
            aria-label="Skip onboarding and go to login"
            className="min-w-[44px] min-h-[44px]"
          >
            Skip
          </Button>
        </div>
      </header>

      {/* Main Content Area - Responsive padding following design system */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-8 md:px-16 md:py-16">
        <div className="w-full max-w-4xl">
          {children}
        </div>
      </main>

      {/* Footer (optional, can be used for additional info) */}
      <footer className="w-full py-4">
        {/* Empty footer for spacing, can be extended in the future */}
      </footer>
    </div>
  );
}
