'use client'

import { useEffect, useCallback } from 'react'
import {
  useNavigation,
  usePortfolioView,
  type TabId,
} from '@/components/providers/tab'

const TAB_SHORTCUTS: Record<string, TabId> = {
  '1': 'intro',
  '2': 'career',
  '3': 'portfolio',
  '4': 'community',
  '5': 'diary',
  '6': 'guestbook',
}

export function useKeyboardNavigation() {
  const { activeTab, setActiveTab } = useNavigation()
  const { portfolioDetailId, setPortfolioDetail } = usePortfolioView()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ctrl/Cmd + 숫자키로 탭 전환
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
        const tabId = TAB_SHORTCUTS[event.key]
        if (tabId) {
          event.preventDefault()
          setActiveTab(tabId)
          return
        }
      }

      // Escape로 상세 보기 닫기 또는 이전으로 이동
      if (event.key === 'Escape') {
        if (portfolioDetailId !== null) {
          event.preventDefault()
          setPortfolioDetail(null)
        } else if (activeTab !== 'intro') {
          event.preventDefault()
          setActiveTab('intro')
        }
        return
      }

      // Alt + 좌/우 화살표로 히스토리 네비게이션 (브라우저 히스토리 기반)
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          if (typeof window !== 'undefined') {
            window.history.back()
          }
        }
      }
    },
    [activeTab, portfolioDetailId, setActiveTab, setPortfolioDetail]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
