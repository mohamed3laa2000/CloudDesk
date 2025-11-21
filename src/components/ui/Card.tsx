import type { ReactNode } from 'react'

export interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
}

export function Card({ children, className = '', onClick, interactive = false }: CardProps) {
  const baseStyles = 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm'
  const interactiveStyles = interactive
    ? 'cursor-pointer transition-all hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2'
    : ''

  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      className={`${baseStyles} ${interactiveStyles} ${className}`}
      onClick={onClick}
      {...(onClick && { type: 'button' })}
    >
      {children}
    </Component>
  )
}

export interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`px-6 py-4 border-b border-gray-200 dark:border-slate-700 ${className}`}>{children}</div>
}

export interface CardBodyProps {
  children: ReactNode
  className?: string
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

export interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return <div className={`px-6 py-4 border-t border-gray-200 dark:border-slate-700 ${className}`}>{children}</div>
}
