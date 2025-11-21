import type { InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  className?: string
}

export function Input({ error = false, className = '', disabled, ...props }: InputProps) {
  const baseStyles =
    'w-full h-10 px-3 py-2 text-base font-normal text-gray-900 dark:text-gray-50 bg-white dark:bg-slate-700 border rounded-lg transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline-none disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:border-gray-200 dark:disabled:border-slate-700 disabled:text-gray-400 dark:disabled:text-gray-400 disabled:cursor-not-allowed'

  const stateStyles = error
    ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-offset-0'
    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 focus:border-teal-600 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-400 focus:ring-offset-0'

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
