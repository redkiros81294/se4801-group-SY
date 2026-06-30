import { clsx } from 'clsx'
import { HashDisplay } from './HashDisplay'
import { getEventTypeMeta } from '../lib/eventTypes'

interface ProvenanceTimelineProps {
  transactions: Array<{
    id: string
    eventType: string
    timestamp: string
    fromOrgName?: string
    toOrgName?: string
    quantity: number
    signatureHash: string
    previousHash: string
  }>
  chainValid: boolean
  className?: string
}

export const ProvenanceTimeline = ({ transactions, chainValid, className = '' }: ProvenanceTimelineProps) => {
  if (transactions.length === 0) {
    return (
      <div className={clsx('text-center py-8', className)}>
        <p className="text-[var(--t2)]">No transaction history available</p>
      </div>
    )
  }

  return (
    <div className={clsx('relative', className)}>
      {/* Chain line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5">
        <div className="h-0.5 w-full bg-[var(--border)]/20" />
        {/* Dots on the chain line */}
        {transactions.map((_, index) => (
          <div key={index} className="absolute left-0 -top-1.5 h-3 w-3 rounded-full bg-[var(--cyan)]" />
        ))}
      </div>
      
      {/* Transactions with stagger animation */}
      <div className="ml-10">
        {transactions.map((tx, index) => {
          const meta = getEventTypeMeta(tx.eventType);
          return (
          <div key={tx.id} className={`mb-6`}>
            {/* Transaction card with stagger animation */}
            <div className={clsx(
              'bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6',
              `transition-all duration-300 ease-out`,
              `delay-[${index * 100}ms]`
            )}>
              <div className="mb-3 flex items-center space-x-3">
                <div className={clsx(
                  'flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg2)]/50',
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
              </div>
            </div>
          </div>
          );
        })}
        
        {/* Animation trigger - useEffect would be better but for simplicity using inline style with delay */}
        <div className="absolute left-0 top-0 h-0 w-0" />
      </div>
      
      {/* Status indicator at the bottom */}
      <div className="absolute left-3 bottom-0 flex h-8 w-8 items-center justify-center rounded-full">
        <div className={clsx(
          'h-6 w-6 rounded-full',
          chainValid ? 'bg-[var(--green)]/20' : 'bg-[var(--red)]/20',
          chainValid ? 'border-[var(--green)]/30' : 'border-[var(--red)]/30'
        )}>
          <i className={clsx(
            chainValid ? 'ti ti-check-circle' : 'ti ti-alert-triangle',
            chainValid ? 'text-[var(--green)]' : 'text-[var(--red)]'
          )} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}