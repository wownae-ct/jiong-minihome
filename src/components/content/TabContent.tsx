'use client'

import { useTab } from '@/components/providers/TabContext'
import { WhatsNew } from './WhatsNew'
import { CareerContent } from './CareerContent'
import { PortfolioContent } from './PortfolioContent'
import { CommunityContent } from './CommunityContent'
import { DiaryContent } from './DiaryContent'
import { GuestbookContent } from './GuestbookContent'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { SettingsContent } from '@/components/settings/SettingsContent'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

const tabVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
}

export function TabContent() {
  const { activeTab, setActiveTab } = useTab()
  const { data: session } = useSession()

  // 키보드 네비게이션 활성화
  useKeyboardNavigation()

  const handleErrorReset = () => {
    // 에러 발생 시 인트로 탭으로 이동
    setActiveTab('intro')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'intro':
        return <WhatsNew />
      case 'career':
        return <CareerContent />
      case 'portfolio':
        return <PortfolioContent />
      case 'community':
        return <CommunityContent />
      case 'diary':
        return <DiaryContent />
      case 'guestbook':
        return <GuestbookContent />
      case 'admin':
        // 관리자 권한 체크
        if (session?.user?.role !== 'admin') {
          return <AccessDenied message="관리자 권한이 필요합니다." />
        }
        return <AdminDashboard />
      case 'settings':
        // 로그인 체크
        if (!session) {
          return <AccessDenied message="로그인이 필요합니다." />
        }
        return <SettingsContent />
      default:
        return <WhatsNew />
    }
  }

  return (
    <ErrorBoundary onReset={handleErrorReset}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </ErrorBoundary>
  )
}

function AccessDenied({ message }: { message: string }) {
  const { setActiveTab } = useTab()

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-red-500 text-3xl">lock</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        접근 권한 없음
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        {message}
      </p>
      <button
        onClick={() => setActiveTab('intro')}
        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        홈으로 돌아가기
      </button>
    </div>
  )
}
