import type { ReactNode } from 'react'

export interface DemoModeBadgeProps {
  className?: string
}

/**
 * DemoModeBadge component displays a visual indicator when the user is in demo mode
 * Shows "Demo Mode" text with an eye icon in a yellow/blue color scheme
 */
export function DemoModeBadge({ className = '' }: DemoModeBadgeProps) {
  // Eye icon for demo/viewing
  const eyeIcon: ReactNode = (
    <svg 
      className="w-3.5 h-3.5 flex-shrink-0" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
      />
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
      />
    </svg>
  )

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 
        rounded-md text-xs font-semibold border
        bg-gradient-to-r from-amber-50 to-blue-50 
        text-blue-700 border-blue-300
        shadow-sm
        transition-all duration-200
        hover:shadow-md hover:border-blue-400
        ${className}
      `}
      role="status"
      aria-label="Demo Mode Active"
    >
      {eyeIcon}
      <span className="whitespace-nowrap">Demo Mode</span>
    </span>
  )
}
