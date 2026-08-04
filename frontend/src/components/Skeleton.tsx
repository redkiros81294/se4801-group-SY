import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
}

/**
 * Pulsing placeholder used during loading states. Give it a width/height via
 * className (e.g. "h-4 w-24") or use the shorthand `count` variants below.
 */
export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div
    aria-hidden="true"
    className={clsx(
      'animate-pulse rounded-lg bg-[var(--bg2)]/60',
      className
    )}
  />
)

/** A card-shaped skeleton used to placeholder dashboard stat cards. */
export const SkeletonCard = () => (
  <div className="bg-[var(--bg1)]/50 border border-[var(--border)]/20 rounded-xl p-6 space-y-3">
    <div className="flex items-center space-x-3">
      <Skeleton className="h-9 w-9" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <Skeleton className="h-3 w-28" />
  </div>
)
