'use client'

import { useState, useEffect, useCallback } from 'react'

export type TabId = 'intro' | 'career' | 'portfolio' | 'community' | 'diary' | 'guestbook' | 'admin' | 'settings'

interface HashState {
  tab: TabId
  detailId: number | null
  detailType: 'portfolio' | null
}

function parseHash(hash: string): HashState {
  const cleanHash = hash.replace('#', '')

  // 상세 보기 형식: portfolio-{id}
  const portfolioMatch = cleanHash.match(/^portfolio-(\d+)$/)
  if (portfolioMatch) {
    return {
      tab: 'portfolio',
      detailId: parseInt(portfolioMatch[1], 10),
      detailType: 'portfolio',
    }
  }

  // 탭 형식
  const validTabs: TabId[] = ['intro', 'career', 'portfolio', 'community', 'diary', 'guestbook', 'admin', 'settings']
  if (validTabs.includes(cleanHash as TabId)) {
    return {
      tab: cleanHash as TabId,
      detailId: null,
      detailType: null,
    }
  }

  // 기본값
  return {
    tab: 'intro',
    detailId: null,
    detailType: null,
  }
}

function buildHash(state: HashState): string {
  if (state.detailType === 'portfolio' && state.detailId !== null) {
    return `#portfolio-${state.detailId}`
  }
  if (state.tab === 'intro') {
    return '' // 기본 탭은 해시 없음
  }
  return `#${state.tab}`
}

export function useHashState() {
  const [hashState, setHashState] = useState<HashState>({
    tab: 'intro',
    detailId: null,
    detailType: null,
  })

  // 초기 해시 파싱
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialState = parseHash(window.location.hash)
      setHashState(initialState)
    }
  }, [])

  // 해시 변경 감지
  useEffect(() => {
    const handleHashChange = () => {
      const newState = parseHash(window.location.hash)
      setHashState(newState)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // 탭 변경
  const setTab = useCallback((tab: TabId) => {
    const newState: HashState = { tab, detailId: null, detailType: null }
    setHashState(newState)
    const newHash = buildHash(newState)
    if (newHash) {
      window.history.pushState(null, '', newHash)
    } else {
      window.history.pushState(null, '', window.location.pathname)
    }
  }, [])

  // 포트폴리오 상세 보기
  const setPortfolioDetail = useCallback((id: number | null) => {
    if (id === null) {
      const newState: HashState = { tab: 'portfolio', detailId: null, detailType: null }
      setHashState(newState)
      window.history.pushState(null, '', '#portfolio')
    } else {
      const newState: HashState = { tab: 'portfolio', detailId: id, detailType: 'portfolio' }
      setHashState(newState)
      window.history.pushState(null, '', `#portfolio-${id}`)
    }
  }, [])

  // 뒤로가기 지원
  const goBack = useCallback(() => {
    window.history.back()
  }, [])

  return {
    ...hashState,
    setTab,
    setPortfolioDetail,
    goBack,
  }
}
