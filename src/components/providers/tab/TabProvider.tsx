'use client'

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { NavigationContext, TabId } from './NavigationContext'
import { PortfolioViewContext } from './PortfolioViewContext'
import { CommunityViewContext } from './CommunityViewContext'
import { WelcomeViewContext } from './WelcomeViewContext'

interface TabProviderProps {
  children: ReactNode
  initialTab?: TabId
}

// --- URL 파싱 ---

interface ParsedHash {
  tab: TabId
  detailId: number | null
  welcomeDetail: boolean
  communityPostId: number | null
}

interface ParsedUrl extends ParsedHash {
  communityCategory: string | null
}

const VALID_TABS: TabId[] = [
  'intro',
  'career',
  'portfolio',
  'community',
  'diary',
  'guestbook',
  'admin',
  'settings',
]

function parseHash(hash: string): ParsedHash {
  const cleanHash = hash.replace('#', '')

  if (cleanHash === 'intro-detail') {
    return { tab: 'intro', detailId: null, welcomeDetail: true, communityPostId: null }
  }

  const portfolioMatch = cleanHash.match(/^portfolio-(\d+)$/)
  if (portfolioMatch) {
    return {
      tab: 'portfolio',
      detailId: parseInt(portfolioMatch[1], 10),
      welcomeDetail: false,
      communityPostId: null,
    }
  }

  const communityMatch = cleanHash.match(/^community-(\d+)$/)
  if (communityMatch) {
    return {
      tab: 'community',
      detailId: null,
      welcomeDetail: false,
      communityPostId: parseInt(communityMatch[1], 10),
    }
  }

  if (VALID_TABS.includes(cleanHash as TabId)) {
    return { tab: cleanHash as TabId, detailId: null, welcomeDetail: false, communityPostId: null }
  }

  return { tab: 'intro', detailId: null, welcomeDetail: false, communityPostId: null }
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
  return { ...hashResult, communityCategory: null }
}

/**
 * 전체 탭/뷰 상태를 관리하는 루트 Provider.
 *
 * 내부적으로 4개의 sub-context로 분리되어 있으며, consumer는 필요한 부분만
 * 세분화 훅(`useNavigation`, `usePortfolioView`, `useCommunityView`, `useWelcomeView`)으로
 * 구독해 리렌더링을 최소화할 수 있다.
 *
 * Orchestration(연쇄 리셋, URL 동기화)은 이 Provider가 유일한 권한자다.
 */
export function TabProvider({ children, initialTab = 'intro' }: TabProviderProps) {
  const [activeTab, setActiveTabRaw] = useState<TabId>(initialTab)
  const [portfolioDetailId, setPortfolioDetailIdRaw] = useState<number | null>(null)
  const [communityPostId, setCommunityPostIdRaw] = useState<number | null>(null)
  const [communityCategory, setCommunityCategoryRaw] = useState<string | null>(null)
  const [welcomeDetailOpen, setWelcomeDetailOpenRaw] = useState(false)

  // 초기 URL 파싱
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasState = window.location.hash || window.location.pathname !== '/'
    if (!hasState) return
    const parsed = parseUrl(window.location.pathname, window.location.hash)
    setActiveTabRaw(parsed.tab)
    setPortfolioDetailIdRaw(parsed.detailId)
    setWelcomeDetailOpenRaw(parsed.welcomeDetail)
    setCommunityPostIdRaw(parsed.communityPostId)
    setCommunityCategoryRaw(parsed.communityCategory)
  }, [])

  // popstate: 브라우저 뒤/앞 네비게이션
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrl(window.location.pathname, window.location.hash)
      setActiveTabRaw(parsed.tab)
      setPortfolioDetailIdRaw(parsed.detailId)
      setWelcomeDetailOpenRaw(parsed.welcomeDetail)
      setCommunityPostIdRaw(parsed.communityPostId)
      setCommunityCategoryRaw(parsed.communityCategory)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // --- Orchestrated actions ---

  // 탭 변경: 다른 sub-view 상태를 모두 초기화 + URL 갱신.
  // useState의 Object.is 비교 덕분에 이미 null인 값에 null을 다시 set해도
  // 해당 context consumer는 리렌더링되지 않는다.
  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabRaw(tab)
    setPortfolioDetailIdRaw(null)
    setCommunityPostIdRaw(null)
    setCommunityCategoryRaw(null)
    setWelcomeDetailOpenRaw(false)

    if (tab === 'intro') {
      window.history.pushState(null, '', '/')
    } else {
      window.history.pushState(null, '', `/#${tab}`)
    }
  }, [])

  // 커뮤니티 게시글 상세보기: 탭을 community로 전환 + URL 갱신
  const setCommunityPost = useCallback((id: number | null, categorySlug?: string) => {
    setCommunityPostIdRaw(id)
    setCommunityCategoryRaw(categorySlug || null)

    if (id === null) {
      window.history.pushState(null, '', '/#community')
    } else if (categorySlug) {
      setActiveTabRaw('community')
      window.history.pushState(null, '', `/community/${categorySlug}/${id}`)
    } else {
      setActiveTabRaw('community')
      window.history.pushState(null, '', `/#community-${id}`)
    }
  }, [])

  // 포트폴리오 상세보기: 탭을 portfolio로 전환 + URL 갱신
  const setPortfolioDetail = useCallback((id: number | null) => {
    setPortfolioDetailIdRaw(id)

    if (id === null) {
      window.history.pushState(null, '', '/#portfolio')
    } else {
      setActiveTabRaw('portfolio')
      window.history.pushState(null, '', `/#portfolio-${id}`)
    }
  }, [])

  // 환영 섹션 상세보기: 탭을 intro로 전환 + URL 갱신
  const setWelcomeDetail = useCallback((open: boolean) => {
    setWelcomeDetailOpenRaw(open)

    if (open) {
      setActiveTabRaw('intro')
      window.history.pushState(null, '', '/#intro-detail')
    } else {
      window.history.pushState(null, '', '/')
    }
  }, [])

  // 각 context value는 useMemo로 안정화해 동일 값일 때 리렌더링 회피
  const navigationValue = useMemo(
    () => ({ activeTab, setActiveTab }),
    [activeTab, setActiveTab]
  )

  const portfolioValue = useMemo(
    () => ({ portfolioDetailId, setPortfolioDetail }),
    [portfolioDetailId, setPortfolioDetail]
  )

  const communityValue = useMemo(
    () => ({ communityPostId, communityCategory, setCommunityPost }),
    [communityPostId, communityCategory, setCommunityPost]
  )

  const welcomeValue = useMemo(
    () => ({ welcomeDetailOpen, setWelcomeDetail }),
    [welcomeDetailOpen, setWelcomeDetail]
  )

  return (
    <NavigationContext.Provider value={navigationValue}>
      <PortfolioViewContext.Provider value={portfolioValue}>
        <CommunityViewContext.Provider value={communityValue}>
          <WelcomeViewContext.Provider value={welcomeValue}>
            {children}
          </WelcomeViewContext.Provider>
        </CommunityViewContext.Provider>
      </PortfolioViewContext.Provider>
    </NavigationContext.Provider>
  )
}
