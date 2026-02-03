'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export type TabId = 'intro' | 'career' | 'portfolio' | 'community' | 'diary' | 'guestbook' | 'admin' | 'settings'

interface TabContextType {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  portfolioDetailId: number | null
  setPortfolioDetail: (id: number | null) => void
  welcomeDetailOpen: boolean
  setWelcomeDetail: (open: boolean) => void
  goBack: () => void
}

const TabContext = createContext<TabContextType | null>(null)

interface TabProviderProps {
  children: ReactNode
  initialTab?: TabId
}

function parseHash(hash: string): { tab: TabId; detailId: number | null; welcomeDetail: boolean } {
  const cleanHash = hash.replace('#', '')

  // 환영 섹션 상세 보기
  if (cleanHash === 'intro-detail') {
    return {
      tab: 'intro',
      detailId: null,
      welcomeDetail: true,
    }
  }

  // 포트폴리오 상세 보기 형식: portfolio-{id}
  const portfolioMatch = cleanHash.match(/^portfolio-(\d+)$/)
  if (portfolioMatch) {
    return {
      tab: 'portfolio',
      detailId: parseInt(portfolioMatch[1], 10),
      welcomeDetail: false,
    }
  }

  // 탭 형식
  const validTabs: TabId[] = ['intro', 'career', 'portfolio', 'community', 'diary', 'guestbook', 'admin', 'settings']
  if (validTabs.includes(cleanHash as TabId)) {
    return {
      tab: cleanHash as TabId,
      detailId: null,
      welcomeDetail: false,
    }
  }

  // 기본값
  return {
    tab: 'intro',
    detailId: null,
    welcomeDetail: false,
  }
}

export function TabProvider({ children, initialTab = 'intro' }: TabProviderProps) {
  const [activeTab, setActiveTabState] = useState<TabId>(initialTab)
  const [portfolioDetailId, setPortfolioDetailIdState] = useState<number | null>(null)
  const [welcomeDetailOpen, setWelcomeDetailOpenState] = useState(false)

  // 초기 해시 파싱
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { tab, detailId, welcomeDetail } = parseHash(window.location.hash)
      setActiveTabState(tab)
      setPortfolioDetailIdState(detailId)
      setWelcomeDetailOpenState(welcomeDetail)
    }
  }, [])

  // 해시 변경 감지 (브라우저 뒤로가기/앞으로가기)
  useEffect(() => {
    const handleHashChange = () => {
      const { tab, detailId, welcomeDetail } = parseHash(window.location.hash)
      setActiveTabState(tab)
      setPortfolioDetailIdState(detailId)
      setWelcomeDetailOpenState(welcomeDetail)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // 탭 변경 (URL 해시 업데이트)
  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabState(tab)
    setPortfolioDetailIdState(null)
    setWelcomeDetailOpenState(false)

    if (tab === 'intro') {
      window.history.pushState(null, '', window.location.pathname)
    } else {
      window.history.pushState(null, '', `#${tab}`)
    }
  }, [])

  // 포트폴리오 상세 보기 설정
  const setPortfolioDetail = useCallback((id: number | null) => {
    setPortfolioDetailIdState(id)

    if (id === null) {
      window.history.pushState(null, '', '#portfolio')
    } else {
      setActiveTabState('portfolio')
      window.history.pushState(null, '', `#portfolio-${id}`)
    }
  }, [])

  // 환영 섹션 상세 보기 설정
  const setWelcomeDetail = useCallback((open: boolean) => {
    setWelcomeDetailOpenState(open)

    if (open) {
      setActiveTabState('intro')
      window.history.pushState(null, '', '#intro-detail')
    } else {
      window.history.pushState(null, '', window.location.pathname)
    }
  }, [])

  // 뒤로가기
  const goBack = useCallback(() => {
    window.history.back()
  }, [])

  return (
    <TabContext.Provider
      value={{
        activeTab,
        setActiveTab,
        portfolioDetailId,
        setPortfolioDetail,
        welcomeDetailOpen,
        setWelcomeDetail,
        goBack,
      }}
    >
      {children}
    </TabContext.Provider>
  )
}

export function useTab() {
  const context = useContext(TabContext)
  if (!context) {
    throw new Error('useTab must be used within a TabProvider')
  }
  return context
}
