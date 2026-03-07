'use client'

import { useState, useEffect, useCallback } from 'react'

export interface DraftData {
  title?: string
  content?: string
  description?: string
  image?: string | string[] | null
  githubUrl?: string
  notionUrl?: string
  featured?: boolean
  tags?: string[]
}

export interface SavedDraft {
  id: string
  data: DraftData
  savedAt: string
  portfolioId?: number // 수정 중인 포트폴리오 ID (새 글이면 undefined)
}

const DRAFT_KEY = 'portfolio_drafts'

function getDrafts(): SavedDraft[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(DRAFT_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function setDrafts(drafts: SavedDraft[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
}

// 현재 작성 중인 임시 저장 (새 글 or 수정 중)
export function useLocalDraft(portfolioId?: number) {
  const [draft, setDraft] = useState<SavedDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 임시 저장 데이터 로드
  useEffect(() => {
    const drafts = getDrafts()
    const found = drafts.find((d) =>
      portfolioId ? d.portfolioId === portfolioId : !d.portfolioId
    )
    setDraft(found || null)
    setIsLoading(false)
  }, [portfolioId])

  // 임시 저장
  const saveDraft = useCallback(
    (data: DraftData) => {
      const drafts = getDrafts()
      const draftId = portfolioId ? `edit-${portfolioId}` : 'new'

      // 기존 임시 저장 제거
      const filtered = drafts.filter((d) =>
        portfolioId ? d.portfolioId !== portfolioId : d.portfolioId !== undefined
      )

      const newDraft: SavedDraft = {
        id: draftId,
        data,
        savedAt: new Date().toISOString(),
        portfolioId,
      }

      filtered.push(newDraft)
      setDrafts(filtered)
      setDraft(newDraft)

      return newDraft
    },
    [portfolioId]
  )

  // 임시 저장 삭제
  const clearDraft = useCallback(() => {
    const drafts = getDrafts()
    const filtered = drafts.filter((d) =>
      portfolioId ? d.portfolioId !== portfolioId : d.portfolioId !== undefined
    )
    setDrafts(filtered)
    setDraft(null)
  }, [portfolioId])

  return {
    draft,
    isLoading,
    saveDraft,
    clearDraft,
    hasDraft: !!draft,
  }
}

// 모든 임시 저장 목록 조회
export function useAllDrafts() {
  const [drafts, setDraftsState] = useState<SavedDraft[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setDraftsState(getDrafts())
    setIsLoading(false)
  }, [])

  const deleteDraft = useCallback((draftId: string) => {
    const currentDrafts = getDrafts()
    const filtered = currentDrafts.filter((d) => d.id !== draftId)
    setDrafts(filtered)
    setDraftsState(filtered)
  }, [])

  const clearAllDrafts = useCallback(() => {
    setDrafts([])
    setDraftsState([])
  }, [])

  return {
    drafts,
    isLoading,
    deleteDraft,
    clearAllDrafts,
  }
}
