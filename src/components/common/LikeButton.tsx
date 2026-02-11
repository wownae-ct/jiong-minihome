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

function getAnonymousId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('anonymousLikeId')
  if (!id) {
    id = crypto.randomUUID()
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
