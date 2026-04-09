'use client'

import { useCallback } from 'react'
import { useNavigation } from './NavigationContext'
import { usePortfolioView } from './PortfolioViewContext'
import { useCommunityView } from './CommunityViewContext'
import { useWelcomeView } from './WelcomeViewContext'
import type { TabId } from './NavigationContext'

export interface TabContextType {
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

/**
 * 전체 탭/뷰 상태를 한 번에 구독하는 backwards-compat 훅.
 *
 * 새로운 코드는 가능하면 필요한 부분만 구독하는 세분화 훅을 직접 사용하는 것을 권장한다:
 * - `useNavigation()` — activeTab/setActiveTab
 * - `usePortfolioView()` — portfolioDetailId/setPortfolioDetail
 * - `useCommunityView()` — communityPostId/communityCategory/setCommunityPost
 * - `useWelcomeView()` — welcomeDetailOpen/setWelcomeDetail
 *
 * `useTab()`은 네 개 context에 모두 바인딩되어 어느 하나가 변경되어도 리렌더링된다.
 */
export function useTab(): TabContextType {
  const nav = useNavigation()
  const portfolio = usePortfolioView()
  const community = useCommunityView()
  const welcome = useWelcomeView()

  // goBack은 브라우저 히스토리 기반 동작이 요구되는 키보드 단축키(Alt+Left)에서만 쓰임.
  // UI 버튼(예: WelcomeDetail 뒤로가기)은 명시적 setter를 직접 호출해야 한다.
  const goBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }, [])

  return {
    ...nav,
    ...portfolio,
    ...community,
    ...welcome,
    goBack,
  }
}
