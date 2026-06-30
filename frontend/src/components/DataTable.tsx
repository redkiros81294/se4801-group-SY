import { clsx } from 'clsx'
import { useState, useMemo } from 'react'

interface DataTableProps<T> {
  columns: Array<{
    key: keyof T
    label: string
    sortable?: boolean
    sortDirection?: 'asc' | 'desc'
  }>
  data: T[]
  pagination?: {
    currentPage: number
    itemsPerPage: number
    onPageChange: (page: number) => void
  }
  emptyState?: {
    title: string
    description: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  className?: string
}

export const DataTable = <T extends object>({
  columns,
  data,
  pagination,
  emptyState,
  className = ''
}: DataTableProps<T>) => {
  // Sorting logic - Hooks run unconditionally
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  })

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return []
    if (!sortConfig.key) return data

    return [...data].sort((a, b) => {
      const key = sortConfig.key as keyof T;
      const aValue = a[key];
      const bValue = b[key];

      // Handle different types of values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
      }

      // Fallback for other types
      return String(aValue).localeCompare(String(bValue)) * (sortConfig.direction === 'asc' ? 1 : -1);
    })
  }, [data, sortConfig])

  // Handle empty state - AFTER hooks
  if (!data || data.length === 0) {
    return (
      <div className={clsx(
        'text-center py-12',
        className
      )}>
        {emptyState && (
          <>
            <h3 className="text-[var(--t1)] font-semibold mb-4">
              {emptyState.title}
            </h3>
            <p className="text-[var(--t2)] mb-6">
              {emptyState.description}
            </p>
            {emptyState.action && (
              <button
                onClick={emptyState.action.onClick}
                className="flex h-10 px-5 items-center justify-center rounded-lg border border-[var(--border)]/40 bg-[var(--bg2)]/50 text-[var(--t1)] hover:bg-[var(--bg3)]/50 transition-colors duration-200"
              >
                {emptyState.action.label}
              </button>
            )}
          </>
        )}
      </div>
    )
  }

  // Pagination logic
  const itemsPerPage = pagination?.itemsPerPage ?? 10
  const currentPage = pagination?.currentPage ?? 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = sortedData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  return (
    <div className={clsx('w-full', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[var(--bg2)]/50">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={clsx(
                  'px-6 py-3 text-left text-[var(--t2)] font-medium text-sm',
                  column.sortable ? 'cursor-pointer hover:bg-[var(--bg3)]/50 transition-colors' : ''
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-2">
                  <span>{column.label}</span>
                  {column.sortable && sortConfig.key === column.key && (
                    <i className={clsx(
                      `ti ti-${sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'}`,
                      'text-[var(--t2)]'
                    )} aria-hidden="true" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, index) => (
            <tr
              key={`${index}-${String(row[columns[0].key])}`}
              className={clsx(
                'border-t border-[var(--border)]/20',
                index % 2 === 1 ? 'bg-[var(--bg2)]/20' : 'bg-[var(--bg2)]/10'
              )}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-6 py-4 text-[var(--t1)] whitespace-nowrap"
                >
                  {String(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination controls */}
      {pagination && (
        <div className={clsx(
          'flex items-center justify-between mt-6 px-6 py-4 bg-[var(--bg2)]/50 rounded-lg',
          className
        )}>
          <div className="text-[var(--t2)] text-sm">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => pagination.onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className={clsx(
                'flex h-9 px-4 items-center justify-center rounded-lg border border-[var(--border)]/40',
                currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg3)]/50 transition-colors'
              )}
            >
              <i className="ti ti-chevron-left" aria-hidden="true" />
            </button>
            
            <span className="px-3 text-[var(--t2)]">
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => pagination.onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className={clsx(
                'flex h-9 px-4 items-center justify-center rounded-lg border border-[var(--border)]/40',
                currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg3)]/50 transition-colors'
              )}
            >
              <i className="ti ti-chevron-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
