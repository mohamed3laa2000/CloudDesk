import type { InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  className?: string
}

export function Input({ error = false, className = '', disabled, ...props }: InputProps) {
  const baseStyles =
    'w-full h-10 px-3 py-2 text-base font-normal text-[var(--color-text-primary)] bg-[var(--color-background)] border rounded-lg transition-colors placeholder:text-[var(--color-text-secondary)] focus:outline-none disabled:bg-[var(--color-surface)] disabled:border-[var(--color-border)] disabled:text-[var(--color-text-secondary)] disabled:cursor-not-allowed'

  const stateStyles = error
    ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)] focus:ring-offset-0'
    : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-0'

  return (
    <input
      className={`${baseStyles} ${stateStyles} ${className}`}
      disabled={disabled}
      {...props}
    />
  )
}

export interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  className?: string
  rows?: number
}

export function Textarea({
  error = false,
  className = '',
  disabled,
  rows = 4,
  ...props
}: TextareaProps) {
  const baseStyles =
    'w-full px-3 py-2 text-base font-normal text-[var(--color-text-primary)] bg-[var(--color-background)] border rounded-lg transition-colors placeholder:text-[var(--color-text-secondary)] focus:outline-none resize-y disabled:bg-[var(--color-surface)] disabled:border-[var(--color-border)] disabled:text-[var(--color-text-secondary)] disabled:cursor-not-allowed'

  const stateStyles = error
    ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)] focus:ring-offset-0'
    : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-0'

  return (
    <textarea
      className={`${baseStyles} ${stateStyles} ${className}`}
      disabled={disabled}
      rows={rows}
      {...props}
    />
  )
}

export interface LabelProps {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
  className?: string
}

export function Label({ htmlFor, children, required = false, className = '' }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-[var(--color-text-primary)] ${className}`}>
      {children}
      {required && <span className="ml-1 text-[var(--color-error)]">*</span>}
    </label>
  )
}

export interface HelperTextProps {
  children: React.ReactNode
  error?: boolean
  className?: string
}

export function HelperText({ children, error = false, className = '' }: HelperTextProps) {
  const colorClass = error ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'
  return <p className={`mt-1 text-sm ${colorClass} ${className}`}>{children}</p>
}
