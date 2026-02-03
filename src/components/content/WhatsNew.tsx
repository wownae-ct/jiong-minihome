'use client'

import { Badge } from '@/components/ui/Badge';
import { ProjectCard } from './ProjectCard';
import { DiaryCard } from './DiaryCard';
import { WelcomeSection } from './WelcomeSection';
import { WelcomeDetail } from './WelcomeDetail';
import { useTab } from '@/components/providers/TabContext';
import { AnimatePresence } from 'framer-motion';

export function WhatsNew() {
  const { welcomeDetailOpen } = useTab()

  // 환영 섹션 상세 보기 모드
  if (welcomeDetailOpen) {
    return (
      <AnimatePresence mode="wait">
        <WelcomeDetail key="welcome-detail" />
      </AnimatePresence>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="mb-6 md:mb-8 border-b border-slate-100 dark:border-slate-700 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          What&apos;s New
          <Badge variant="orange">Updated</Badge>
        </h3>
        <span className="text-slate-400 text-sm">2023.11.24 PM 02:30</span>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
        <ProjectCard />
        <DiaryCard />
      </div>

      {/* Welcome 섹션 */}
      <WelcomeSection />
    </div>
  );
}
