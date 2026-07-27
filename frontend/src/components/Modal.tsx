import { useState, type FormEvent, type ReactNode } from 'react'

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: 24,
  minWidth: 360,
  maxWidth: 480,
  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>
            &times;
          </button>
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
    <div style={{ marginBottom: 12 }}>
      <label htmlFor={name}>{label}</label><br />
      <select
        id={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ width: '100%', padding: 8, marginTop: 4 }}
      >
        <option value="">-- Select --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
