'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface BgmTrack {
  id: number
  title: string
  artist: string | null
  url: string
  duration: number | null
}

interface UseBgmPlayerOptions {
  playlist: BgmTrack[]
}

interface UseBgmPlayerReturn {
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
}

const STORAGE_KEY_VOLUME = 'bgm_volume'
const STORAGE_KEY_TRACK = 'bgm_last_track_id'
const DEFAULT_VOLUME = 0.5

function getStoredVolume(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_VOLUME)
    if (stored !== null) return parseFloat(stored)
  } catch { /* ignore */ }
  return DEFAULT_VOLUME
}

function getStoredTrackId(): number | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TRACK)
    if (stored !== null) return parseInt(stored)
  } catch { /* ignore */ }
  return null
}

export function useBgmPlayer({ playlist }: UseBgmPlayerOptions): UseBgmPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<BgmTrack | null>(null)
  const [volume, setVolumeState] = useState(getStoredVolume)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // 재생 이력 관리
  const historyRef = useRef<BgmTrack[]>([])
  const historyIndexRef = useRef(-1)

  // isPlaying 최신값을 클로저 문제 없이 참조하기 위한 ref
  const shouldPlayRef = useRef(false)

  // Audio 요소 초기화
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.volume = volume
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 플레이리스트 변경 시 초기 트랙 설정
  useEffect(() => {
    if (playlist.length === 0) {
      setCurrentTrack(null)
      return
    }
    if (currentTrack && playlist.some(t => t.id === currentTrack.id)) return

    const storedId = getStoredTrackId()
    const storedTrack = storedId !== null ? playlist.find(t => t.id === storedId) : null
    const initialTrack = storedTrack || playlist[0]
    setCurrentTrack(initialTrack)
    historyRef.current = [initialTrack]
    historyIndexRef.current = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist])

  // 트랙 변경 시 오디오 소스 업데이트 및 canplay 기반 자동재생
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    audio.src = currentTrack.url

    const handleCanPlay = async () => {
      if (shouldPlayRef.current) {
        try {
          await audio.play()
        } catch {
          setIsPlaying(false)
        }
      }
    }

    audio.addEventListener('canplay', handleCanPlay, { once: true })

    try {
      localStorage.setItem(STORAGE_KEY_TRACK, String(currentTrack.id))
    } catch { /* ignore */ }

    return () => {
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [currentTrack])

  // 볼륨 동기화
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
    try {
      localStorage.setItem(STORAGE_KEY_VOLUME, String(volume))
    } catch { /* ignore */ }
  }, [volume])

  // 오디오 이벤트 리스너
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      nextTrack()
    }
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist, currentTrack])

  const selectRandomTrack = useCallback(() => {
    if (playlist.length === 0) return null
    if (playlist.length === 1) return playlist[0]

    const otherTracks = playlist.filter(t => t.id !== currentTrack?.id)
    return otherTracks[Math.floor(Math.random() * otherTracks.length)]
  }, [playlist, currentTrack])

  const play = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return
    try {
      await audioRef.current.play()
      setIsPlaying(true)
      shouldPlayRef.current = true
    } catch {
      // Browser blocked autoplay
      setIsPlaying(false)
      shouldPlayRef.current = false
    }
  }, [currentTrack])

  const pause = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
    shouldPlayRef.current = false
  }, [])

  const toggle = useCallback(async () => {
    if (isPlaying) {
      pause()
    } else {
      await play()
    }
  }, [isPlaying, pause, play])

  const nextTrack = useCallback(() => {
    // 이력 내에서 앞에 트랙이 있으면 그것을 사용
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++
      setCurrentTrack(historyRef.current[historyIndexRef.current])
      return
    }

    const next = selectRandomTrack()
    if (!next) return

    // 새 트랙을 이력에 추가
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(next)
    historyIndexRef.current = historyRef.current.length - 1

    setCurrentTrack(next)
  }, [selectRandomTrack])

  const previousTrack = useCallback(() => {
    if (historyIndexRef.current <= 0) return

    historyIndexRef.current--
    setCurrentTrack(historyRef.current[historyIndexRef.current])
  }, [])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
  }, [])

  return {
    isPlaying,
    currentTrack,
    volume,
    currentTime,
    duration,
    play,
    pause,
    toggle,
    next: nextTrack,
    previous: previousTrack,
    setVolume,
  }
}
