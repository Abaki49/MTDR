import { type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-icon" onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface SelectFieldProps {
  label: string
  name: string
  value: string | number
  onChange: (value: string) => void
  options: { value: string | number; label: string }[]
  required?: boolean
}

export function SelectField({ label, name, value, onChange, options, required }: SelectFieldProps) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>{label}</label>
      <select
        id={name}
        className="form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">-- Select --</option>
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
