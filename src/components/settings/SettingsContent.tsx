'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { ProfileSettings } from './ProfileSettings'
import { AccountSettings } from './AccountSettings'
import { NotificationSettings } from './NotificationSettings'
import { ThemeSettings } from './ThemeSettings'
import { useTab } from '@/components/providers/TabContext'

type Tab = 'profile' | 'account' | 'notifications' | 'theme'

export function SettingsContent() {
  const { setActiveTab: setMainTab } = useTab()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'profile', label: '프로필', icon: 'person' },
    { id: 'account', label: '계정', icon: 'security' },
    { id: 'notifications', label: '알림', icon: 'notifications' },
    { id: 'theme', label: '테마', icon: 'palette' },
  ]

  const handleBackClick = () => {
    setMainTab('intro')
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
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
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
        </div>
      </div>
    </div>
  )
}
