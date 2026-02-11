'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'

interface NotificationPrefs {
  comments: boolean
  likes: boolean
  replies: boolean
  email: boolean
}

interface NotificationSettingItem {
  id: keyof NotificationPrefs
  label: string
  description: string
}

const SETTING_ITEMS: NotificationSettingItem[] = [
  {
    id: 'comments',
    label: '댓글 알림',
    description: '내 게시글에 새 댓글이 달리면 알림을 받습니다',
  },
  {
    id: 'likes',
    label: '좋아요 알림',
    description: '내 게시글에 좋아요가 달리면 알림을 받습니다',
  },
  {
    id: 'replies',
    label: '답글 알림',
    description: '내 댓글에 답글이 달리면 알림을 받습니다',
  },
  {
    id: 'email',
    label: '이메일 알림',
    description: '중요 알림을 이메일로도 받습니다',
  },
]

export function NotificationSettings() {
  const { data: session } = useSession()
  const { success, error: showError } = useToast()
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    comments: true,
    likes: true,
    replies: true,
    email: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  // 서버에서 알림 설정 로드
  useEffect(() => {
    if (session?.user) {
      fetch('/api/users/me/notification-settings')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) {
            setPrefs(data)
          }
        })
        .catch(() => {})
        .finally(() => setIsFetching(false))
    } else {
      setIsFetching(false)
    }
  }, [session])

  const handleToggle = (id: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/me/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })

      if (!response.ok) {
        showError('알림 설정 저장에 실패했습니다')
        return
      }

      success('알림 설정이 저장되었습니다')
    } catch {
      showError('알림 설정 저장 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {SETTING_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
          >
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">
                {item.label}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {item.description}
              </p>
            </div>
            <button
              onClick={() => handleToggle(item.id)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                prefs[item.id]
                  ? 'bg-primary'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  prefs[item.id] ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
