import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface DropdownItem {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function listener(e: MouseEvent | TouchEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('dropdown', className)}>
      <button
        type="button"
        className="dropdown-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open && (
        <div
          className={cn('dropdown-menu', align === 'left' ? 'dropdown-left' : 'dropdown-right')}
          role="menu"
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              className={cn('dropdown-item', item.danger && 'dropdown-item-danger')}
              disabled={item.disabled}
              role="menuitem"
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
