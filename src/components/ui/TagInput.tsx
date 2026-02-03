'use client'

import { useState, useRef, useCallback, KeyboardEvent, useMemo } from 'react'
import { Icon } from './Icon'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  maxTags?: number
  placeholder?: string
  label?: string
  error?: string
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  maxTags,
  placeholder = '태그 입력 후 Enter',
  label,
  error,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isMaxReached = maxTags !== undefined && value.length >= maxTags

  const filteredSuggestions = useMemo(() => {
    if (!inputValue.trim() || suggestions.length === 0) return []
    const lower = inputValue.toLowerCase()
    return suggestions.filter(
      (s) => s.toLowerCase().includes(lower) && !value.includes(s)
    )
  }, [inputValue, suggestions, value])

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim()
      if (!trimmed) return
      if (value.includes(trimmed)) return
      if (isMaxReached) return

      onChange([...value, trimmed])
      setInputValue('')
      setShowSuggestions(false)
    },
    [value, onChange, isMaxReached]
  )

  const removeTag = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    },
    [value, onChange]
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // 쉼표가 포함되면 태그 추가
    if (newValue.includes(',')) {
      const parts = newValue.split(',')
      const tagToAdd = parts[0]
      addTag(tagToAdd)
      setInputValue(parts.slice(1).join(','))
    } else {
      setInputValue(newValue)
      setShowSuggestions(newValue.trim().length > 0)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion)
    inputRef.current?.focus()
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div
        className={`
          flex flex-wrap items-center gap-2 p-2 min-h-[42px]
          bg-white dark:bg-slate-800
          border rounded-lg
          ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}
          focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary
        `}
      >
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:bg-primary/20 rounded p-0.5 transition-colors"
              aria-label={`${tag} 삭제`}
            >
              <Icon name="close" size="sm" />
            </button>
          </span>
        ))}
        <div className="relative flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(inputValue.trim().length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={isMaxReached ? `최대 ${maxTags}개` : placeholder}
            disabled={isMaxReached}
            className={`
              w-full bg-transparent border-none outline-none
              text-slate-800 dark:text-slate-200
              placeholder:text-slate-400
              disabled:cursor-not-allowed disabled:opacity-50
            `}
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-40 overflow-auto">
              {filteredSuggestions.map((suggestion) => (
                <li
                  key={suggestion}
                  role="option"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}
