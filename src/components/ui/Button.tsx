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
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

  const variantStyles = {
    primary:
      'bg-teal-600 text-white shadow-sm hover:bg-teal-700 disabled:hover:bg-teal-600',
    secondary:
      'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300 disabled:hover:bg-white disabled:hover:border-gray-200',
    ghost:
      'bg-transparent text-gray-900 hover:bg-gray-50 disabled:hover:bg-transparent',
    destructive:
      'bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-600 disabled:hover:bg-red-600',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[44px]',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
