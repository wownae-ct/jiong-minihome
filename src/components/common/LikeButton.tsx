'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/providers/ToastProvider'

interface LikeButtonProps {
  targetType: 'post' | 'comment' | 'guestbook' | 'diary'
  targetId: number
  initialCount?: number
  size?: 'sm' | 'md'
}

export function LikeButton({
  targetType,
  targetId,
  initialCount = 0,
  size = 'md',
}: LikeButtonProps) {
  const { data: session } = useSession()
  const { error: showError } = useToast()
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) {
      fetch(`/api/likes?targetType=${targetType}&targetId=${targetId}`)
        .then((res) => res.json())
        .then((data) => setLiked(data.liked))
        .catch(console.error)
    }
  }, [session, targetType, targetId])

  const handleClick = async () => {
    if (!session) {
      showError('로그인이 필요합니다')
      return
    }

    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId }),
      })

      const result = await response.json()

      if (!response.ok) {
        showError(result.error || '좋아요 처리에 실패했습니다')
        return
      }

      setLiked(result.liked)
      setCount((prev) => (result.liked ? prev + 1 : prev - 1))
    } catch {
      showError('좋아요 처리 중 오류가 발생했습니다')
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
        name={liked ? 'favorite' : 'favorite_border'}
        size={iconSize}
      />
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{count}</span>
    </button>
  )
}
