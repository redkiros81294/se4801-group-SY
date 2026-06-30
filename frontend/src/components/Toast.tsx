import { clsx } from 'clsx'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
  // Auto-close after 5 seconds
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  const getVariant = (type: ToastProps['type']) => {
    switch (type) {
      case 'success':
        return 'bg-[var(--green)]/20 text-[var(--green)] border-[var(--green)]/40'
      case 'error':
        return 'bg-[var(--red)]/20 text-[var(--red)] border-[var(--red)]/40'
      case 'info':
        return 'bg-[var(--blue)]/20 text-[var(--blue)] border-[var(--blue)]/40'
      default:
        return 'bg-[var(--t2)]/20 text-[var(--t2)] border-[var(--t2)]/40'
    }
  }

  const getIcon = (type: ToastProps['type']) => {
    switch (type) {
      case 'success':
        return <i className="ti ti-check-circle" aria-hidden="true" />
      case 'error':
        return <i className="ti ti-x-circle" aria-hidden="true" />
      case 'info':
        return <i className="ti ti-info-circle" aria-hidden="true" />
      default:
        return <i className="ti ti-info-circle" aria-hidden="true" />
    }
  }

  return (
    <div
      className={clsx(
        'fixed bottom-4 right-4 mx-4 max-w-sm w-full z-50',
        getVariant(type),
        'border rounded-lg px-6 py-4 flex items-center space-x-4',
        'opacity-0 translate-y-[20px]',
        'transition-opacity transition-transform duration-300 ease-out',
        'animate-toast-in'
      )}
      role="alert"
    >
      <div className="flex-shrink-0">
        {getIcon(type)}
      </div>
      <div className="flex-1">
        <p className="text-[var(--t1)] font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--bg3)]/50 transition-colors duration-200"
        aria-label="Close toast"
      >
        <i className="ti ti-x" aria-hidden="true" />
      </button>
    </div>
  )
}
