import { cn } from '../../lib/utils'

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function Alert({ variant = 'info', title, message, onRetry, onDismiss, className }: AlertProps) {
  return (
    <div className={cn('alert', `alert-${variant}`, className)} role="alert">
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-message">{message}</div>
      </div>
      <div className="alert-actions">
        {onRetry && (
          <button type="button" className="alert-btn" onClick={onRetry}>Retry</button>
        )}
        {onDismiss && (
          <button type="button" className="alert-btn alert-btn-close" onClick={onDismiss} aria-label="Dismiss">&times;</button>
        )}
      </div>
    </div>
  )
}
