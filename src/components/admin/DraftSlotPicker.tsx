'use client'

import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import type { DraftSlot } from '@/hooks/useLocalDraft'

interface DraftSlotPickerProps {
  slots: DraftSlot[]
  onSelectSlot: (index: number) => void
  onNewDraft: () => void
  onDeleteSlot: (index: number) => void
  onCancel: () => void
}

function formatDateTime(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function previewContent(content?: string): string {
  if (!content) return ''
  // HTML 태그 제거 후 앞 40자
  const text = content.replace(/<[^>]*>/g, '').trim()
  return text.length > 40 ? text.slice(0, 40) + '…' : text
}

export function DraftSlotPicker({
  slots,
  onSelectSlot,
  onNewDraft,
  onDeleteSlot,
  onCancel,
}: DraftSlotPickerProps) {
  const hasEmptySlot = slots.some((s) => s.data === null)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          임시 저장 불러오기
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          이어서 작성할 슬롯을 선택하거나 새로 작성할 수 있습니다. (최대 3개)
        </p>

        <div className="space-y-2 mb-4">
          {slots.map((slot) => {
            const isEmpty = slot.data === null
            return (
              <div
                key={slot.index}
                className={`
                  rounded-lg border p-3 transition-colors
                  ${isEmpty
                    ? 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary hover:bg-primary/5 cursor-pointer'
                  }
                `}
                onClick={() => {
                  if (!isEmpty) onSelectSlot(slot.index)
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        슬롯 {slot.index + 1}
                      </span>
                      {slot.savedAt && (
                        <span className="text-xs text-slate-400">
                          {formatDateTime(slot.savedAt)}
                        </span>
                      )}
                    </div>
                    {isEmpty ? (
                      <p className="text-sm text-slate-400 italic">빈 슬롯</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {slot.data?.title || '(제목 없음)'}
                        </p>
                        {previewContent(slot.data?.content) && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {previewContent(slot.data?.content)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {!isEmpty && (
                    <button
                      type="button"
                      aria-label={`슬롯 ${slot.index + 1} 삭제`}
                      title="삭제"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSlot(slot.index)
                      }}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Icon name="delete" size="sm" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-between gap-3">
          <Button variant="ghost" onClick={onCancel}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={onNewDraft}
            disabled={!hasEmptySlot}
            title={
              hasEmptySlot
                ? '빈 슬롯에 새 글 작성'
                : '모든 슬롯이 차있습니다. 먼저 슬롯을 삭제해주세요.'
            }
          >
            <Icon name="add" size="sm" />
            새로 작성
          </Button>
        </div>
      </div>
    </div>
  )
}
