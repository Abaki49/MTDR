import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id || props.name
    return (
      <div className="form-group">
        {label && <label className="form-label" htmlFor={selectId}>{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className={cn('form-input', error && 'form-input-error', className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="form-error" id={`${selectId}-error`}>{error}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
