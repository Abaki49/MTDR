import { type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function Toggle({ label, className, id, ...props }: ToggleProps) {
  const inputId = id || props.name
  return (
    <label className={cn('toggle', className)} htmlFor={inputId}>
      <input id={inputId} type="checkbox" className="toggle-input" {...props} />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-label">{label}</span>
    </label>
  )
}
