'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'
import { ProfileAvatar } from '@/components/common/ProfileAvatar'

interface GuestbookEntryData {
  id: number
  content: string
  isPrivate: boolean
  guestName: string | null
  createdAt: string
  userId: number | null
  user: {
    id: number
    nickname: string
    profileImage: string | null
  } | null
}

interface GuestbookEntryProps {
  entry: GuestbookEntryData
  onDelete?: () => void
  onMemberClick?: (userId: number) => void
}

export function GuestbookEntry({ entry, onDelete, onMemberClick }: GuestbookEntryProps) {
  const { data: session } = useSession()
  const { success, error: showError } = useToast()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [password, setPassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = session?.user?.id === String(entry.userId)
  const isAdmin = session?.user?.role === 'admin'
  const canDelete = isOwner || isAdmin || !entry.userId

  const displayName = entry.user?.nickname || entry.guestName || '익명'
  const formattedDate = new Date(entry.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/guestbook/${entry.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: entry.userId ? undefined : password }),
      })

      const result = await response.json()

      if (!response.ok) {
        showError(result.error || '삭제에 실패했습니다')
        setShowDeleteModal(false)
        return
      }

      success('삭제되었습니다')
      setShowDeleteModal(false)
      onDelete?.()
    } catch {
      showError('삭제 중 오류가 발생했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="border-b border-slate-100 dark:border-slate-700 pb-3 sm:pb-4 last:border-b-0 last:pb-0">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-1.5 sm:mb-2">
          <div className="flex items-center gap-2">
            {entry.user && onMemberClick ? (
              <button
                onClick={() => onMemberClick(entry.user!.id)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <ProfileAvatar
                  src={entry.user.profileImage}
                  alt={displayName}
                  size="sm"
                />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5 hover:text-primary hover:underline transition-colors">
                    {displayName}
                    {entry.isPrivate && (
                      <Icon name="lock" size="sm" className="text-slate-400" />
                    )}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    {formattedDate}
                  </p>
                </div>
              </button>
            ) : (
              <>
                <ProfileAvatar
                  src={entry.user?.profileImage}
                  alt={displayName}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {displayName}
                    {entry.isPrivate && (
                      <Icon name="lock" size="sm" className="text-slate-400" />
                    )}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    {formattedDate}
                  </p>
                </div>
              </>
            )}
          </div>

          {canDelete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Icon name="delete" size="sm" />
            </button>
          )}
        </div>

        {/* 내용 */}
        <p className={`whitespace-pre-wrap text-sm ${
          entry.isPrivate && !isOwner && !isAdmin
            ? 'text-slate-400 dark:text-slate-500 italic text-xs sm:text-[13px]'
            : 'text-slate-700 dark:text-slate-300'
        }`}>
          {entry.content}
        </p>
      </div>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="방명록 삭제"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            정말 이 방명록을 삭제하시겠습니까?
          </p>

          {/* 비회원 글인 경우 비밀번호 입력 */}
          {!entry.userId && !isAdmin && (
            <Input
              label="비밀번호"
              type="password"
              placeholder="작성 시 입력한 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
