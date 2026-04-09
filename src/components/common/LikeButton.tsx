'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@/components/ui/Icon'

interface LikeButtonProps {
  targetType: 'post' | 'comment' | 'guestbook' | 'diary'
  targetId: number
  initialCount?: number
  size?: 'sm' | 'md'
}

/**
 * 보안 컨텍스트(HTTPS/localhost)가 아닌 환경에서도 동작하는 UUID v4 생성.
 * crypto.randomUUID()는 secure context에서만 사용 가능하므로 폴백 제공.
 */
function generateUUID(): string {
  // 우선 표준 API 시도 (HTTPS/localhost에서만 동작)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // crypto.getRandomValues는 더 넓은 환경에서 지원됨
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    // RFC 4122 variant/version 비트 설정
    bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  // 최후의 폴백 (crypto 자체가 없는 극단적 환경)
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 10)}`
}

function getAnonymousId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('anonymousLikeId')
  if (!id) {
    id = generateUUID()
    localStorage.setItem('anonymousLikeId', id)
  }
  return id
}

export function LikeButton({
  targetType,
  targetId,
  initialCount = 0,
  size = 'md',
}: LikeButtonProps) {
  const { data: session } = useSession()
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  const checkLikeStatus = useCallback(async () => {
    const params = new URLSearchParams({
      targetType,
      targetId: String(targetId),
    })
    if (!session) {
      const anonId = getAnonymousId()
      if (anonId) params.set('anonymousId', anonId)
    }

    try {
      const res = await fetch(`/api/likes?${params}`)
      const data = await res.json()
      setLiked(data.liked)
    } catch {
      // ignore
    }
  }, [session, targetType, targetId])

  useEffect(() => {
    checkLikeStatus()
  }, [checkLikeStatus])

  const handleClick = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const body: Record<string, unknown> = { targetType, targetId }
      if (!session) {
        body.anonymousId = getAnonymousId()
      }

      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        return
      }

      setLiked(result.liked)
      setCount((prev) => (result.liked ? prev + 1 : prev - 1))
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  const iconSize = size === 'sm' ? 'sm' : 'md'

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-1 transition-colors ${
        liked
          ? 'text-red-500'
          : 'text-slate-500 dark:text-slate-400 hover:text-red-500'
      } ${isLoading ? 'opacity-50' : ''}`}
    >
      <Icon
        name="favorite"
        size={iconSize}
        fill={liked}
      />
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{count}</span>
    </button>
  )
}
