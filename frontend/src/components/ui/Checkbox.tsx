import { type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const inputId = id || props.name
  return (
    <label className={cn('checkbox', className)} htmlFor={inputId}>
      <input id={inputId} type="checkbox" className="checkbox-input" {...props} />
      <span className="checkbox-indicator" />
      <span className="checkbox-label">{label}</span>
    </label>
  )
}
