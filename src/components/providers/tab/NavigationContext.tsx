'use client'

import { createContext, useContext } from 'react'

export type TabId =
  | 'intro'
  | 'career'
  | 'portfolio'
  | 'community'
  | 'diary'
  | 'guestbook'
  | 'admin'
  | 'settings'

export interface NavigationContextType {
  activeTab: TabId
  /**
   * 탭을 변경한다. 모든 sub-view 상태(포트폴리오/커뮤니티/웰컴 상세)를 초기화하고 URL도 갱신한다.
   * 연쇄 리셋 로직은 TabProvider의 orchestrator에서 처리된다.
   */
  setActiveTab: (tab: TabId) => void
}

export const NavigationContext = createContext<NavigationContextType | null>(null)

/**
 * 탭 전환 상태만 필요한 consumer용 훅.
 * 포트폴리오/커뮤니티/웰컴 상태 변경 시 리렌더링되지 않는다.
 */
export function useNavigation(): NavigationContextType {
  const ctx = useContext(NavigationContext)
  if (!ctx) {
    throw new Error('useNavigation must be used within a TabProvider')
  }
  return ctx
}
