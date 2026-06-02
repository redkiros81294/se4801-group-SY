import { clsx } from 'clsx'

interface StatCardProps {
  value: string | number
  label: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  className?: string
}

export const StatCard = ({ 
  value, 
  label, 
  trend, 
  icon, 
  className = '' 
}: StatCardProps) => {
  const getTrendColor = (t: StatCardProps['trend'] | undefined) => {
    switch (t) {
      case 'up':
        return 'text-[var(--green)]'
      case 'down':
        return 'text-[var(--red)]'
      case 'neutral':
        return 'text-[var(--blue)]'
      default:
        return 'text-[var(--t2)]'
    }
  }

  const getTrendIcon = (t: StatCardProps['trend'] | undefined) => {
    switch (t) {
      case 'up':
        return <i className="ti ti-arrow-up" aria-hidden="true" />
      case 'down':
        return <i className="ti ti-arrow-down" aria-hidden="true" />
      case 'neutral':
        return <i className="ti ti-minus" aria-hidden="true" />
      default:
        return null
    }
  }

  return (
    <div className={clsx(
      'bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6',
      className
    )}>
      <div className="flex items-center space-x-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg2)]/50">
          {icon}
        </div>
        <div>
          <p className="text-[var(--t1)] font-semibold">{value}</p>
          <p className="text-[var(--t2)] text-sm">{label}</p>
        </div>
      </div>
      {trend && (
        <div className={clsx(
          'mt-4 flex items-center space-x-2 text-sm',
          getTrendColor(trend)
        )}>
          {getTrendIcon(trend)}
          <span>
            {trend === 'up' && 'Increasing'}
            {trend === 'down' && 'Decreasing'}
            {trend === 'neutral' && 'Stable'}
          </span>
        </div>
      )}
    </div>
  )
}