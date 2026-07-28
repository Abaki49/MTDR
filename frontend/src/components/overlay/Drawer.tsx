import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  width?: number
  children: React.ReactNode
}

export function Drawer({ open, onClose, title, width = 480, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="drawer-overlay" onClick={onClose}>
      <div
        className="drawer"
        style={{ width, maxWidth: '100vw' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="drawer-header">
          <h3 className="drawer-title">{title}</h3>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="drawer-body">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
