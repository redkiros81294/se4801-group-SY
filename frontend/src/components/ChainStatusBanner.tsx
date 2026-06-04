import { clsx } from 'clsx'

interface ChainStatusBannerProps {
  chainValid: boolean
  flagged?: boolean
  className?: string
}

export const ChainStatusBanner = ({ chainValid, flagged = false, className = '' }: ChainStatusBannerProps) => {
  // Determine status based on props
  let status: 'VERIFIED' | 'COMPROMISED' | 'FLAGGED' | 'PENDING'
  let bgColor: string
  let textColor: string
  let iconName: string
  
  if (flagged) {
    status = 'FLAGGED'
    bgColor = 'bg-[var(--purple)]/20'
    textColor = 'text-[var(--purple)]'
    iconName = 'ti ti-alert-triangle'
  } else if (chainValid) {
    status = 'VERIFIED'
    bgColor = 'bg-[var(--green)]/20'
    textColor = 'text-[var(--green)]'
    iconName = 'ti ti-check-circle'
  } else {
    status = 'COMPROMISED'
    bgColor = 'bg-[var(--red)]/20'
    textColor = 'text-[var(--red)]'
    iconName = 'ti ti-alert-octagon'
  }
  
  const statusText = {
    VERIFIED: 'VERIFIED',
    COMPROMISED: 'COMPROMISED',
    FLAGGED: 'FLAGGED',
    PENDING: 'PENDING'
  }[status]

  return (
    <div className={clsx(
      'flex items-center space-x-3 px-4 py-3 rounded-lg',
      bgColor,
      className
    )}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg2)]/50">
        <i className={`${iconName} ${textColor}`} aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold text-[var(--t1)]">{statusText}</p>
        {!chainValid && !flagged && (
          <p className="text-[var(--t2)] text-sm">Chain has been tampered with</p>
        )}
        {flagged && (
          <p className="text-[var(--t2)] text-sm">Requires manual review</p>
        )}
      </div>
    </div>
  )
}