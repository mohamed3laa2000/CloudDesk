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
      'text-white shadow-sm disabled:hover:bg-[var(--color-accent)] focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
    secondary:
      'bg-[var(--color-background)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] disabled:hover:bg-[var(--color-background)] focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 border border-[var(--color-border)] hover:border-[var(--color-text-secondary)]',
    ghost:
      'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] disabled:hover:bg-transparent focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
    destructive:
      'bg-[var(--color-error)] text-white shadow-sm hover:opacity-90 focus-visible:ring-[var(--color-error)] focus-visible:ring-offset-2 disabled:hover:opacity-60',
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
