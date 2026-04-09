'use client'

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ProjectCard } from './ProjectCard';
import { DiaryCard } from './DiaryCard';
import { WelcomeSection } from './WelcomeSection';

function formatUpdateDate(isoString: string): string {
  const date = new Date(isoString)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hours = date.getHours()
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = String(hours % 12 || 12).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} ${period} ${displayHour}:${minutes}`
}

export function WhatsNew() {
  const [updateDate, setUpdateDate] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/latest-update')
      .then(res => res.json())
      .then(data => {
        if (data.latestUpdate) {
          setUpdateDate(formatUpdateDate(data.latestUpdate))
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="mb-6 md:mb-8 border-b border-slate-100 dark:border-slate-700 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          What&apos;s New
          <Badge variant="orange">Updated</Badge>
        </h3>
        {updateDate && <span className="text-slate-400 text-sm">{updateDate}</span>}
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
