'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export type TabId = 'intro' | 'career' | 'portfolio' | 'community' | 'diary' | 'guestbook' | 'admin' | 'settings'

interface TabContextType {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  portfolioDetailId: number | null
  setPortfolioDetail: (id: number | null) => void
  communityPostId: number | null
  setCommunityPost: (id: number | null, categorySlug?: string) => void
  communityCategory: string | null
  welcomeDetailOpen: boolean
  setWelcomeDetail: (open: boolean) => void
  goBack: () => void
}

const TabContext = createContext<TabContextType | null>(null)

interface TabProviderProps {
  children: ReactNode
  initialTab?: TabId
}

interface ParsedHash {
  tab: TabId
  detailId: number | null
  welcomeDetail: boolean
  communityPostId: number | null
}

interface ParsedUrl extends ParsedHash {
  communityCategory: string | null
}

function parseHash(hash: string): ParsedHash {
  const cleanHash = hash.replace('#', '')

  // 환영 섹션 상세 보기
  if (cleanHash === 'intro-detail') {
    return {
      tab: 'intro',
      detailId: null,
      welcomeDetail: true,
      communityPostId: null,
    }
  }

  // 포트폴리오 상세 보기 형식: portfolio-{id}
  const portfolioMatch = cleanHash.match(/^portfolio-(\d+)$/)
  if (portfolioMatch) {
    return {
      tab: 'portfolio',
      detailId: parseInt(portfolioMatch[1], 10),
      welcomeDetail: false,
      communityPostId: null,
    }
  }

  // 커뮤니티 게시글 상세 보기 형식: community-{id}
  const communityMatch = cleanHash.match(/^community-(\d+)$/)
  if (communityMatch) {
    return {
      tab: 'community',
      detailId: null,
      welcomeDetail: false,
      communityPostId: parseInt(communityMatch[1], 10),
    }
  }

  // 탭 형식
  const validTabs: TabId[] = ['intro', 'career', 'portfolio', 'community', 'diary', 'guestbook', 'admin', 'settings']
  if (validTabs.includes(cleanHash as TabId)) {
    return {
      tab: cleanHash as TabId,
      detailId: null,
      welcomeDetail: false,
      communityPostId: null,
    }
  }

  // 기본값
  return {
    tab: 'intro',
    detailId: null,
    welcomeDetail: false,
    communityPostId: null,
  }
}

function parsePathname(pathname: string): ParsedUrl | null {
  const communityMatch = pathname.match(/^\/community\/([a-z]+)\/(\d+)$/)
  if (communityMatch) {
    return {
      tab: 'community',
      detailId: null,
      welcomeDetail: false,
      communityPostId: parseInt(communityMatch[2], 10),
      communityCategory: communityMatch[1],
    }
  }
  return null
}

function parseUrl(pathname: string, hash: string): ParsedUrl {
  const pathResult = parsePathname(pathname)
  if (pathResult) return pathResult

  const hashResult = parseHash(hash)
  return {
    ...hashResult,
    communityCategory: null,
  }
}

export function TabProvider({ children, initialTab = 'intro' }: TabProviderProps) {
  const [activeTab, setActiveTabState] = useState<TabId>(initialTab)
  const [portfolioDetailId, setPortfolioDetailIdState] = useState<number | null>(null)
  const [communityPostId, setCommunityPostIdState] = useState<number | null>(null)
  const [communityCategory, setCommunityCategory] = useState<string | null>(null)
  const [welcomeDetailOpen, setWelcomeDetailOpenState] = useState(false)

  // 초기 URL 파싱 (해시 또는 경로 기반)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasState = window.location.hash || window.location.pathname !== '/'
      if (hasState) {
        const { tab, detailId, welcomeDetail, communityPostId: postId, communityCategory: category } =
          parseUrl(window.location.pathname, window.location.hash)
        setActiveTabState(tab)
        setPortfolioDetailIdState(detailId)
        setWelcomeDetailOpenState(welcomeDetail)
        setCommunityPostIdState(postId)
        setCommunityCategory(category)
      }
    }
  }, [])

  // popstate 이벤트 감지 (브라우저 뒤로가기/앞으로가기)
  useEffect(() => {
    const handlePopState = () => {
      const { tab, detailId, welcomeDetail, communityPostId: postId, communityCategory: category } =
        parseUrl(window.location.pathname, window.location.hash)
      setActiveTabState(tab)
      setPortfolioDetailIdState(detailId)
      setWelcomeDetailOpenState(welcomeDetail)
      setCommunityPostIdState(postId)
      setCommunityCategory(category)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // 탭 변경 (절대 URL로 업데이트)
  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabState(tab)
    setPortfolioDetailIdState(null)
    setCommunityPostIdState(null)
    setCommunityCategory(null)
    setWelcomeDetailOpenState(false)

    if (tab === 'intro') {
      window.history.pushState(null, '', '/')
    } else {
      window.history.pushState(null, '', `/#${tab}`)
    }
  }, [])

  // 커뮤니티 게시글 상세 보기 설정
  const setCommunityPost = useCallback((id: number | null, categorySlug?: string) => {
    setCommunityPostIdState(id)
    setCommunityCategory(categorySlug || null)

    if (id === null) {
      window.history.pushState(null, '', '/#community')
    } else if (categorySlug) {
      setActiveTabState('community')
      window.history.pushState(null, '', `/community/${categorySlug}/${id}`)
    } else {
      setActiveTabState('community')
      window.history.pushState(null, '', `/#community-${id}`)
    }
  }, [])

  // 포트폴리오 상세 보기 설정
  const setPortfolioDetail = useCallback((id: number | null) => {
    setPortfolioDetailIdState(id)

    if (id === null) {
      window.history.pushState(null, '', '/#portfolio')
    } else {
      setActiveTabState('portfolio')
      window.history.pushState(null, '', `/#portfolio-${id}`)
    }
  }, [])

  // 환영 섹션 상세 보기 설정
  const setWelcomeDetail = useCallback((open: boolean) => {
    setWelcomeDetailOpenState(open)

    if (open) {
      setActiveTabState('intro')
      window.history.pushState(null, '', '/#intro-detail')
    } else {
      window.history.pushState(null, '', '/')
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
        communityPostId,
        setCommunityPost,
        communityCategory,
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
