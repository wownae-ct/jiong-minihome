'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'

export type SearchType = 'title' | 'content' | 'author' | 'titleComment'

const SEARCH_TYPE_OPTIONS: { value: SearchType; label: string }[] = [
  { value: 'title', label: '제목' },
  { value: 'titleComment', label: '제목+댓글' },
  { value: 'content', label: '내용' },
  { value: 'author', label: '작성자' },
]

interface PostSearchBarProps {
  onSearch: (query: string, searchType: SearchType) => void
  initialQuery?: string
  initialSearchType?: SearchType
  className?: string
}

export function PostSearchBar({
  onSearch,
  initialQuery = '',
  initialSearchType = 'title',
  className = '',
}: PostSearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState<SearchType>(initialSearchType)

  const handleSearch = () => {
    onSearch(query, searchType)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={`flex flex-wrap sm:flex-nowrap gap-2 ${className}`}>
      <select
        value={searchType}
        onChange={(e) => setSearchType(e.target.value as SearchType)}
        className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shrink-0"
      >
        {SEARCH_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="flex-1 relative min-w-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="검색어를 입력하세요"
          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>
      <button
        onClick={handleSearch}
        aria-label="검색"
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1 text-sm font-medium whitespace-nowrap shrink-0"
      >
        <Icon name="search" size="sm" />
        검색
      </button>
    </div>
  )
}
