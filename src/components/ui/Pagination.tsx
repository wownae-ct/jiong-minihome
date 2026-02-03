'use client'

import { Icon } from './Icon'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  maxVisiblePages?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const pages: number[] = []
    const half = Math.floor(maxVisiblePages / 2)

    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  const buttonClass = `
    w-9 h-9 flex items-center justify-center rounded-lg
    text-sm font-medium transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  const activeClass = 'bg-primary text-white'
  const inactiveClass =
    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'

  return (
    <div className="flex items-center justify-center gap-1">
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`${buttonClass} ${inactiveClass}`}
          aria-label="첫 페이지"
        >
          <Icon name="first_page" size="sm" />
        </button>
      )}

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${buttonClass} ${inactiveClass}`}
        aria-label="이전 페이지"
      >
        <Icon name="chevron_left" size="sm" />
      </button>

      {visiblePages[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={`${buttonClass} ${inactiveClass}`}
          >
            1
          </button>
          {visiblePages[0] > 2 && (
            <span className="w-9 h-9 flex items-center justify-center text-slate-400">
              ...
            </span>
          )}
        </>
      )}

      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`${buttonClass} ${
            page === currentPage ? activeClass : inactiveClass
          }`}
        >
          {page}
        </button>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="w-9 h-9 flex items-center justify-center text-slate-400">
              ...
            </span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className={`${buttonClass} ${inactiveClass}`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${buttonClass} ${inactiveClass}`}
        aria-label="다음 페이지"
      >
        <Icon name="chevron_right" size="sm" />
      </button>

      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`${buttonClass} ${inactiveClass}`}
          aria-label="마지막 페이지"
        >
          <Icon name="last_page" size="sm" />
        </button>
      )}
    </div>
  )
}
