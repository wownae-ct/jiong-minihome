'use client'

import { Icon } from '@/components/ui/Icon'

interface SearchFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  tags?: string[]
  selectedTags?: string[]
  onTagToggle?: (tag: string) => void
  onClearFilters?: () => void
  placeholder?: string
  className?: string
}

export function SearchFilter({
  searchQuery,
  onSearchChange,
  tags = [],
  selectedTags = [],
  onTagToggle,
  onClearFilters,
  placeholder = '검색...',
  className = '',
}: SearchFilterProps) {
  const hasFilters = searchQuery || selectedTags.length > 0

  return (
    <div className={`mb-6 space-y-4 ${className}`}>
      {/* 검색 입력 */}
      <div className="relative">
        <Icon
          name="search"
          size="sm"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <Icon name="close" size="sm" />
          </button>
        )}
      </div>

      {/* 태그 필터 */}
      {tags.length > 0 && onTagToggle && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {tag}
              </button>
            )
          })}

          {/* 필터 초기화 */}
          {hasFilters && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="px-3 py-1 text-sm text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
            >
              <Icon name="refresh" size="sm" />
              초기화
            </button>
          )}
        </div>
      )}
    </div>
  )
}
