'use client'

import { createContext, useContext } from 'react'

export interface CommunityViewContextType {
  communityPostId: number | null
  communityCategory: string | null
  setCommunityPost: (id: number | null, categorySlug?: string) => void
}

export const CommunityViewContext = createContext<CommunityViewContextType | null>(null)

export function useCommunityView(): CommunityViewContextType {
  const ctx = useContext(CommunityViewContext)
  if (!ctx) {
    throw new Error('useCommunityView must be used within a TabProvider')
  }
  return ctx
}
