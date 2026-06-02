import { clsx } from 'clsx'

interface StatusBadgeProps {
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPROMISED'
  className?: string
}

export const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const getVariant = (status: StatusBadgeProps['status']) => {
    switch (status) {
      case 'CREATED':
        return 'bg-[var(--cyan)]/20 text-[var(--cyan)]'
      case 'IN_TRANSIT':
        return 'bg-[var(--amber)]/20 text-[var(--amber)]'
      case 'DELIVERED':
        return 'bg-[var(--green)]/20 text-[var(--green)]'
      case 'COMPROMISED':
        return 'bg-[var(--red)]/20 text-[var(--red)]'
      default:
        return 'bg-[var(--t2)]/20 text-[var(--t2)]'
    }
  }

  return (
    <span
      className={clsx(
        'px-2.5 py-0.5 rounded text-xs font-medium',
        getVariant(status),
        className
      )}
    >
      {status}
    </span>
  )
}