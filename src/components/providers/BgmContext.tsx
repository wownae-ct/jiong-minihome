'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useBgmPlayer, BgmTrack } from '@/hooks/useBgmPlayer'

interface BgmContextType {
  isPlaying: boolean
  currentTrack: BgmTrack | null
  volume: number
  currentTime: number
  duration: number
  play: () => Promise<void>
  pause: () => void
  toggle: () => Promise<void>
  next: () => void
  previous: () => void
  setVolume: (v: number) => void
  playlist: BgmTrack[]
  isLoading: boolean
}

const BgmContext = createContext<BgmContextType | null>(null)

export function BgmProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<BgmTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bgm')
      .then(res => res.ok ? res.json() : [])
      .then(data => setPlaylist(data))
      .catch(() => setPlaylist([]))
      .finally(() => setIsLoading(false))
  }, [])

  const player = useBgmPlayer({ playlist })

  return (
    <BgmContext.Provider value={{ ...player, playlist, isLoading }}>
      {children}
    </BgmContext.Provider>
  )
}

export function useBgm() {
  const context = useContext(BgmContext)
  if (!context) {
    throw new Error('useBgm must be used within a BgmProvider')
  }
  return context
}
