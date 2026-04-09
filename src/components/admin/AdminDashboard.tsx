'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { UserManagement } from './UserManagement'
import { VisitorAnalytics } from './VisitorAnalytics'
import { useNavigation } from '@/components/providers/tab'

type Tab = 'dashboard' | 'users' | 'analytics'

export function AdminDashboard() {
  const { setActiveTab: setMainTab } = useNavigation()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: '대시보드', icon: 'dashboard' },
    { id: 'users', label: '회원 관리', icon: 'people' },
    { id: 'analytics', label: '방문자 분석', icon: 'analytics' },
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
          <Icon name="admin_panel_settings" className="text-primary" />
          관리자 페이지
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          사이트 관리 및 통계를 확인할 수 있습니다.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
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
          {activeTab === 'dashboard' && <DashboardContent />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'analytics' && <VisitorAnalytics />}
        </div>
      </div>
    </div>
  )
}

function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* 통계 카드 - 방문자 통계 비활성화 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="people"
          label="전체 회원"
          value="-"
          color="blue"
        />
        <StatCard
          icon="visibility"
          label="오늘 방문자"
          value="-"
          color="green"
          disabled
        />
        <StatCard
          icon="article"
          label="전체 게시글"
          value="-"
          color="purple"
        />
        <StatCard
          icon="chat"
          label="전체 댓글"
          value="-"
          color="orange"
        />
      </div>

      {/* 최근 활동 */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Icon name="schedule" size="sm" />
          최근 활동
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
          최근 활동 내역이 없습니다.
        </p>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  disabled = false,
}: {
  icon: string
  label: string
  value: string
  color: 'blue' | 'green' | 'purple' | 'orange'
  disabled?: boolean
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  }

  const disabledClasses = disabled
    ? 'opacity-50 bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
    : colorClasses[color]

  return (
    <div className={`bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg flex items-center justify-center ${disabledClasses}`}>
          <Icon name={icon} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {label}
            {disabled && <span className="text-xs ml-1">(준비중)</span>}
          </p>
        </div>
      </div>
    </div>
  )
}
