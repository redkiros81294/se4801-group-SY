import { clsx } from 'clsx'
import { useEffect } from 'react'

interface ConfirmModalProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmModal = ({ message, onConfirm, onCancel }: ConfirmModalProps) => {
  // Focus on cancel button when modal opens (safer default)
  useEffect(() => {
    const cancelButton = document.getElementById('confirm-modal-cancel')
    if (cancelButton) {
      cancelButton.focus()
    }
  }, [])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    } else if (e.key === 'Enter') {
      onConfirm()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, onConfirm, onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg0)]/50 backdrop-blur-sm"
      aria-hidden="false"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative bg-[var(--bg1)] rounded-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-[var(--red)]/20 text-[var(--red)] rounded-lg">
            <i className="ti ti-alert-triangle" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-[var(--t1)] font-semibold mb-2">Confirm Action</h3>
            <p className="text-[var(--t2)]">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            id="confirm-modal-cancel"
            onClick={onCancel}
            className="flex h-10 px-5 items-center justify-center rounded-lg border border-[var(--border)]/40 bg-[var(--bg2)]/50 text-[var(--t1)] hover:bg-[var(--bg3)]/50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex h-10 px-5 items-center justify-center rounded-lg border border-[var(--red)]/40 bg-[var(--red)]/20 text-[var(--red)] hover:bg-[var(--red)]/30 transition-colors duration-200"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
