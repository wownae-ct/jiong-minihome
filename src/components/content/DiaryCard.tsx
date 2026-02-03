'use client'

import { Icon } from '@/components/ui/Icon'
import { useTab } from '@/components/providers/TabContext'
import { useLatestDiaries } from '@/hooks/useDiaries'

export function DiaryCard() {
  const { setActiveTab } = useTab()
  const { data: entries = [], isLoading } = useLatestDiaries(3)

  const handleCardClick = () => {
    setActiveTab('diary')
  }

  const handleEntryClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // 다이어리 상세 보기는 구현하지 않음 - 탭으로 이동만
    setActiveTab('diary')
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600 flex items-center justify-center">
            <Icon name="edit_note" />
          </div>
          <h4 className="font-bold">최신 다이어리</h4>
        </div>
        <Icon
          name="arrow_forward"
          size="sm"
          className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all"
        />
      </div>

      {/* 다이어리 목록 */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      ) : entries.length > 0 ? (
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          {entries.map((entry) => (
            <li
              key={entry.id}
              onClick={handleEntryClick}
              className="truncate hover:text-purple-600 transition-colors cursor-pointer py-1 -mx-2 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50"
            >
              {entry.title || entry.content.slice(0, 50)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          아직 공개된 다이어리가 없습니다.
        </p>
      )}
    </div>
  )
}
