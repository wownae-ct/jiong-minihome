'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'

interface NotificationSetting {
  id: string
  label: string
  description: string
  enabled: boolean
}

export function NotificationSettings() {
  const { success } = useToast()
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'comments',
      label: '댓글 알림',
      description: '내 게시글에 새 댓글이 달리면 알림을 받습니다',
      enabled: true,
    },
    {
      id: 'likes',
      label: '좋아요 알림',
      description: '내 게시글에 좋아요가 달리면 알림을 받습니다',
      enabled: true,
    },
    {
      id: 'replies',
      label: '답글 알림',
      description: '내 댓글에 답글이 달리면 알림을 받습니다',
      enabled: true,
    },
    {
      id: 'email',
      label: '이메일 알림',
      description: '중요 알림을 이메일로도 받습니다',
      enabled: false,
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    )
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // API 호출 (추후 구현)
      await new Promise((resolve) => setTimeout(resolve, 500))
      success('알림 설정이 저장되었습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
          >
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">
                {setting.label}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {setting.description}
              </p>
            </div>
            <button
              onClick={() => handleToggle(setting.id)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                setting.enabled
                  ? 'bg-primary'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  setting.enabled ? 'left-7' : 'left-1'
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
