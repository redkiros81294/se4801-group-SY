import { clsx } from 'clsx'
import { HashDisplay } from './HashDisplay'
import { getEventTypeMeta } from '../lib/eventTypes'

interface TransactionCardProps {
  tx: {
    id: string
    eventType: string
    timestamp: string
    fromOrgName?: string
    toOrgName?: string
    quantity: number
    signatureHash: string
    previousHash: string
    hashVerified?: boolean
  }
  index?: number
  className?: string
}

export const TransactionCard = ({ tx, index, className = '' }: TransactionCardProps) => {
  const meta = getEventTypeMeta(tx.eventType);

  return (
      <div className={clsx(
        'bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6 hover:bg-[var(--bg1)]/70 transition-colors',
        `transition-delay-[${(index || 0) * 50}ms]`,
        className
      )}>
      <div className="mb-4 flex items-center space-x-3">
        <div className={clsx(
          'flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg2)]/50',
          `bg-[var(--${meta.colorVar})]/20 text-[var(--${meta.colorVar})]`
        )}>
          <i className={`ti ${meta.icon}`} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[var(--t1)] font-semibold">{meta.label}</p>
          <p className="text-[var(--t2)] text-sm">{new Date(tx.timestamp).toLocaleString()}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-[var(--t2)] text-sm">
          <div>
            <p className="font-medium">From:</p>
            <p className="text-[var(--t1)]">{tx.fromOrgName || 'Genesis'}</p>
          </div>
          <div>
            <p className="font-medium">To:</p>
            <p className="text-[var(--t1)]">{tx.toOrgName || 'Pending'}</p>
          </div>
          <div>
            <p className="font-medium">Quantity:</p>
            <p className="text-[var(--t1)] font-mono">{tx.quantity}</p>
          </div>
          <div>
            <p className="font-medium">Batch ID:</p>
            <p className="text-[var(--t1)] font-mono truncate">{tx.id}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-[var(--border)]/20">
          <p className="text-[var(--t2)] text-xs">Chain Links</p>
          <div className="mt-2 space-y-1 text-[var(--t3)] text-xs font-mono">
            <div className="flex justify-between">
              <span>Previous Hash:</span>
              <span className="text-[var(--t1)]">{tx.previousHash.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Signature Hash:</span>
              <HashDisplay hash={tx.signatureHash} />
            </div>
          </div>
        </div>
        
        {tx.hashVerified !== undefined && (
          <div className="mt-3 flex items-center space-x-2 text-[var(--green)]">
            <i className="ti ti-check" aria-hidden="true" />
            <span className="text-[var(--t1)] font-medium">Hash Verified</span>
          </div>
        )}
      </div>
    </div>
  )
}