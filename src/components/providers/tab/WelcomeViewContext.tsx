'use client'

import { createContext, useContext } from 'react'

export interface WelcomeViewContextType {
  welcomeDetailOpen: boolean
  setWelcomeDetail: (open: boolean) => void
}

export const WelcomeViewContext = createContext<WelcomeViewContextType | null>(null)

export function useWelcomeView(): WelcomeViewContextType {
  const ctx = useContext(WelcomeViewContext)
  if (!ctx) {
    throw new Error('useWelcomeView must be used within a TabProvider')
  }
  return ctx
}
