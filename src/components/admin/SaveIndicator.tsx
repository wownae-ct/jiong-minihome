'use client'

import { Icon } from '@/components/ui/Icon'

export type SaveStatus = 'idle' | 'saving' | 'saved'

interface SaveIndicatorProps {
  status: SaveStatus
  savedAt: string | null
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return ''
  }
}

/**
 * 인라인 상태 인디케이터 (α)
 * 임시저장 버튼 옆에 표시. 저장 상태를 지속적으로 보여준다.
 */
export function SaveIndicator({ status, savedAt }: SaveIndicatorProps) {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        저장 중…
      </span>
    )
  }

  if (status === 'saved' && savedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <Icon name="check_circle" size="sm" />
        저장됨 · {formatTime(savedAt)}
      </span>
    )
  }

  if (savedAt) {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        마지막 저장: {formatTime(savedAt)}
      </span>
    )
  }

  return (
    <span className="text-xs text-slate-400 dark:text-slate-500 italic">
      저장 안 됨
    </span>
  )
}

interface SaveIndicatorChipProps extends SaveIndicatorProps {
  isDirty: boolean
}

/**
 * 헤더 칩 인디케이터 (γ)
 * 모달 타이틀 옆에 배치. 변경/저장 상태를 칩으로 표시.
 */
export function SaveIndicatorChip({
  status,
  savedAt,
  isDirty,
}: SaveIndicatorChipProps) {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        저장 중…
      </span>
    )
  }

  if (status === 'saved' && savedAt) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <Icon name="check_circle" size="sm" />
        {formatTime(savedAt)} 저장됨
      </span>
    )
  }

  if (isDirty) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        변경됨
      </span>
    )
  }

  return null
}
