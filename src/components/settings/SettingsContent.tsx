'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@/components/ui/Icon'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ProfileSettings } from './ProfileSettings'
import { AccountSettings } from './AccountSettings'
import { NotificationSettings } from './NotificationSettings'
import { ThemeSettings } from './ThemeSettings'
import { BgmSettings } from './BgmSettings'
import { useTab } from '@/components/providers/TabContext'
import { useToast } from '@/components/providers/ToastProvider'

type Tab = 'profile' | 'account' | 'notifications' | 'theme' | 'bgm'

export function SettingsContent() {
  const { data: session } = useSession()
  const { setActiveTab: setMainTab } = useTab()
  const { error: showError } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [isVerified, setIsVerified] = useState(false)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // 사용자의 비밀번호 유무 확인
  useEffect(() => {
    if (session?.user) {
      fetch('/api/users/me')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) {
            setHasPassword(data.hasPassword ?? false)
            // 비밀번호가 없는 사용자(OAuth)는 바로 접근 허용
            if (!data.hasPassword) {
              setIsVerified(true)
            }
          }
        })
        .catch(() => {
          // 에러 시 바로 접근 허용 (서비스 중단 방지)
          setIsVerified(true)
        })
    }
  }, [session])

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)

    try {
      const response = await fetch('/api/users/me/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (!response.ok) {
        showError(result.error || '비밀번호 확인에 실패했습니다')
        return
      }

      setIsVerified(true)
    } catch {
      showError('비밀번호 확인 중 오류가 발생했습니다')
    } finally {
      setIsVerifying(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'profile', label: '프로필', icon: 'person' },
    { id: 'account', label: '계정', icon: 'security' },
    { id: 'notifications', label: '알림', icon: 'notifications' },
    { id: 'theme', label: '테마', icon: 'palette' },
    ...(session?.user?.role === 'admin'
      ? [{ id: 'bgm' as Tab, label: 'BGM', icon: 'music_note' }]
      : []),
  ]

  const handleBackClick = () => {
    setMainTab('intro')
  }

  // 비밀번호 확인 대기 중 (로딩)
  if (hasPassword === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // 비밀번호 확인 필요
  if (hasPassword && !isVerified) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackClick}
          className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
        >
          <Icon name="arrow_back" size="sm" />
          홈으로 돌아가기
        </button>

        <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Icon name="lock" className="text-primary text-3xl" size="lg" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              비밀번호 확인
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              설정 페이지에 접근하려면 비밀번호를 입력해주세요.
            </p>
          </div>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <Input
              type="password"
              label="비밀번호"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              disabled={isVerifying || !password}
              size="sm"
              className="w-full justify-center cursor-pointer"
            >
              {isVerifying ? '확인 중...' : '확인'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <button
        onClick={handleBackClick}
        className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
      >
        <Icon name="arrow_back" size="sm" />
        홈으로 돌아가기
      </button>

      {/* 헤더 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Icon name="settings" className="text-primary" />
          설정
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          계정 및 환경 설정을 관리합니다.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 md:px-6 py-3 md:py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon name={tab.icon} size="sm" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'account' && <AccountSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'theme' && <ThemeSettings />}
          {activeTab === 'bgm' && <BgmSettings />}
        </div>
      </div>
    </div>
  )
}
