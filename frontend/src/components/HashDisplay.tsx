import { clsx } from 'clsx'
import { useState } from 'react'

interface HashDisplayProps {
  hash: string
  label?: string
  className?: string
}

export const HashDisplay = ({ hash, label, className = '' }: HashDisplayProps) => {
  const [showFullHash, setShowFullHash] = useState(false)
  
  const getDisplayValue = () => {
    if (!showFullHash && hash.length > 16) {
      return `${hash.slice(0, 8)}...${hash.slice(-8)}`
    }
    return hash
  }

  const baseClasses = 'bg-[var(--bg2)]/50 backdrop-blur-sm rounded-lg border border-[var(--border)]/20 p-4 cursor-pointer hover:bg-[var(--bg2)]/70 transition-colors'
  
  return (
    <div className={clsx(baseClasses, className)} onClick={() => setShowFullHash(!showFullHash)}>
      {label && (
        <p className="text-[var(--t2)] text-sm font-medium mb-2">
          {label}
        </p>
      )}
      <div className="flex items-center space-x-3">
        <i className={clsx('ti ti-hash', 'text-[var(--cyan)]')} aria-hidden="true" />
        <div>
          <p className="text-[var(--t1)] font-mono text-sm">{getDisplayValue()}</p>
          {!showFullHash && hash.length > 16 && (
            <p className="text-[var(--t3)] text-xs">Click to expand</p>
          )}
          {showFullHash && hash.length > 16 && (
            <p className="text-[var(--t3)] text-xs">Full length: {hash.length} chars</p>
          )}
        </div>
      </div>
      {showFullHash && hash.length > 16 && (
        <div className="mt-2 p-3 bg-[var(--bg1)]/50 backdrop-blur-sm rounded border border-[var(--border)]/20">
          <p className="text-[var(--t1)] font-mono text-xs break-all word-break">{hash}</p>
          <div className="mt-2 flex justify-end">
            <button 
              onClick={() => setShowFullHash(false)}
              className="text-[var(--cyan)] hover:text-[var(--t1)] transition-colors text-xs"
            >
              Collapse
            </button>
          </div>
        </div>
      )}
    </div>
  )
}