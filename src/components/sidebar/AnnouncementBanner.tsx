'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/providers/ToastProvider'

interface AnnouncementData {
  title: string
  content: string
}

export function AnnouncementBanner() {
  const { data: session } = useSession()
  const { error: showError } = useToast()
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    fetch('/api/announcement')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setAnnouncement(data)
          setEditTitle(data.title)
          setEditContent(data.content)
        }
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      })

      if (!response.ok) {
        showError('공지사항 수정에 실패했습니다')
        return
      }

      setAnnouncement({ title: editTitle, content: editContent })
      setIsEditing(false)
    } catch {
      showError('공지사항 수정 중 오류가 발생했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  // 공지사항이 없으면 렌더링하지 않음 (편집 모드 제외)
  if (!announcement || (!announcement.title && !isEditing)) {
    // 관리자에게는 추가 버튼 표시
    if (isAdmin) {
      return (
        <div className="pt-4">
          <button
            onClick={() => setIsEditing(true)}
            className="w-full text-xs text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-1"
          >
            <Icon name="add" size="sm" />
            공지사항 추가
          </button>
        </div>
      )
    }
    return null
  }

  // 편집 모드
  if (isEditing) {
    return (
      <div className="pt-4 space-y-2">
        <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Icon name="campaign" size="sm" />
          공지사항 편집
        </div>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="공지 제목"
          className="w-full text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="공지 상세 내용"
          rows={3}
          className="w-full text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-none"
        />
        <div className="flex gap-1 justify-end">
          <button
            onClick={() => {
              setIsEditing(false)
              setEditTitle(announcement?.title || '')
              setEditContent(announcement?.content || '')
            }}
            className="text-xs px-2 py-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs px-2 py-1 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-4">
      {/* 공지 헤더 + 제목 (클릭 가능) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left group"
      >
        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 mb-1">
          <Icon name="campaign" size="sm" />
          <span className="font-bold">공지</span>
          <Icon
            name={isExpanded ? 'expand_less' : 'expand_more'}
            size="sm"
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
          {announcement.title}
        </p>
      </button>

      {/* 상세 내용 (accordion) */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-600">
          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
            {announcement.content}
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-2 text-xs text-primary hover:underline"
            >
              수정
            </button>
          )}
        </div>
      )}
    </div>
  )
}
