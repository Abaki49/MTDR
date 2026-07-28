import { Modal } from './Modal'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  isSubmitting?: boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  isSubmitting = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="modal-body">
        <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {message}
        </p>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn ${destructive ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
