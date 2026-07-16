import type { ReactNode } from 'react'
import { Button } from './Button'

interface ModalProps {
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  children?: ReactNode
  onClose: () => void
  onConfirm?: () => void
}

export function Modal({ title, description, confirmLabel = 'Confirm', danger, children, onClose, onConfirm }: ModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <Button icon="x" variant="ghost" aria-label="Close dialog" onClick={onClose} />
        </div>
        {children ? <div className="modal-body">{children}</div> : null}
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {onConfirm ? (
            <Button icon={danger ? 'alert' : 'check'} variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  )
}

