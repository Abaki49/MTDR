import { type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
  className?: string
}

export function FormField({ label, required, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('form-group', className)}>
      <label className="form-label">
        {label}
        {required && <span className="form-required">*</span>}
      </label>
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
