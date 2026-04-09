'use client'

import { createContext, useContext } from 'react'

export interface PortfolioViewContextType {
  portfolioDetailId: number | null
  setPortfolioDetail: (id: number | null) => void
}

export const PortfolioViewContext = createContext<PortfolioViewContextType | null>(null)

export function usePortfolioView(): PortfolioViewContextType {
  const ctx = useContext(PortfolioViewContext)
  if (!ctx) {
    throw new Error('usePortfolioView must be used within a TabProvider')
  }
  return ctx
}
