import { useState, type ChangeEvent } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { cn } from '../../lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [local, setLocal] = useState(value)
  useDebounce(local, debounceMs) // triggers effect

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocal(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div className={cn('search-input', className)}>
      <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        className="form-input search-input-field"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {local && (
        <button
          type="button"
          className="search-clear"
          onClick={() => { setLocal(''); onChange('') }}
          aria-label="Clear search"
        >
          &times;
        </button>
      )}
    </div>
  )
}
