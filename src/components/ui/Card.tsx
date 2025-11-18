import type { ReactNode } from 'react'

export interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
}

export function Card({ children, className = '', onClick, interactive = false }: CardProps) {
  const baseStyles = 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm'
  const interactiveStyles = interactive
    ? 'cursor-pointer transition-all hover:border-[var(--color-text-secondary)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2'
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
  return <div className={`px-6 py-4 border-b border-[var(--color-border)] ${className}`}>{children}</div>
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
  return <div className={`px-6 py-4 border-t border-[var(--color-border)] ${className}`}>{children}</div>
}
