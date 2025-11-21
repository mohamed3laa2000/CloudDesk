import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed'

  const variantStyles = {
    primary:
      'text-white shadow-sm focus-visible:ring-teal-600 focus-visible:ring-offset-2',
    secondary:
      'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-600 focus-visible:ring-teal-600 focus-visible:ring-offset-2 border border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500',
    ghost:
      'bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:hover:bg-transparent focus-visible:ring-teal-600 focus-visible:ring-offset-2',
    destructive:
      'bg-red-600 dark:bg-red-600 text-white shadow-sm hover:bg-red-700 dark:hover:bg-red-700 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:hover:opacity-60',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[44px]',
  }

  // Apply accent color background for primary variant
  const primaryBgStyle = variant === 'primary' ? {
    backgroundColor: 'var(--color-accent)',
  } : undefined

  const primaryHoverStyle = variant === 'primary' ? {
    '--tw-hover-bg': 'var(--color-accent-hover)',
  } as React.CSSProperties : undefined

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${variant === 'primary' ? 'hover:bg-[var(--color-accent-hover)]' : ''} ${className}`}
      style={{ ...primaryBgStyle, ...primaryHoverStyle }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
