import type { ReactNode } from 'react'

export interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'running' | 'stopped' | 'provisioning' | 'error'
  children: ReactNode
  className?: string
  icon?: ReactNode
}

export function Badge({ variant = 'neutral', children, className = '', icon }: BadgeProps) {
  const baseStyles =
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border'

  const variantStyles = {
    neutral: 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    // Instance status variants
    running: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    stopped: 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
    provisioning: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  }

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

export interface CountBadgeProps {
  count: number
  variant?: 'primary' | 'neutral'
  className?: string
}

export function CountBadge({ count, variant = 'primary', className = '' }: CountBadgeProps) {
  const baseStyles =
    'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold'

  const variantStyles = {
    primary: 'bg-[var(--color-error)] text-white',
    neutral: 'bg-[var(--color-text-secondary)] text-white',
  }

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}
