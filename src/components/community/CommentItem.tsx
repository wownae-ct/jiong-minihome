'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@/components/ui/Icon'
import { CommentForm } from './CommentForm'
import { useToast } from '@/components/providers/ToastProvider'
import { PasswordModal } from '@/components/common/PasswordModal'
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal'

interface CommentData {
  id: number
  content: string
  depth: number
  likeCount: number
  createdAt: string
  userId: number | null
  guestName?: string | null
  user: {
    id: number
    nickname: string
    profileImage: string | null
  } | null
  replies?: CommentData[]
}

interface CommentItemProps {
  comment: CommentData
  postId: number
  onDelete?: () => void
  onReply?: () => void
  onMemberClick?: (userId: number) => void
}

export function CommentItem({
  comment,
  postId,
  onDelete,
  onReply,
  onMemberClick,
}: CommentItemProps) {
  const { data: session } = useSession()
  const { success, error: showError } = useToast()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)

  const isOwner = session?.user?.id === String(comment.userId)
  const isAdmin = session?.user?.role === 'admin'
  const isGuestComment = !comment.userId && !!comment.guestName
  const canDelete = isOwner || isAdmin || isGuestComment

  const authorName = comment.user?.nickname || comment.guestName || '알 수 없음'

  const formattedDate = new Date(comment.createdAt).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleDeleteClick = () => {
    if (isGuestComment && !isAdmin) {
      setShowPasswordModal(true)
    } else {
      setShowDeleteConfirmModal(true)
    }
  }

  const performDelete = async (password?: string) => {
    setIsDeleting(true)
    try {
      const options: RequestInit = { method: 'DELETE' }
      if (password) {
        options.headers = { 'Content-Type': 'application/json' }
        options.body = JSON.stringify({ password })
      }

      const response = await fetch(`/api/comments/${comment.id}`, options)

      if (!response.ok) {
        const result = await response.json()
        showError(result.error || '삭제에 실패했습니다')
        setShowPasswordModal(false)
        setShowDeleteConfirmModal(false)
        return
      }

      success('댓글이 삭제되었습니다')
      setShowPasswordModal(false)
      setShowDeleteConfirmModal(false)
      onDelete?.()
    } catch {
      showError('삭제 중 오류가 발생했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePasswordConfirm = (password: string) => {
    if (!password.trim()) {
      showError('비밀번호를 입력해주세요')
      return
    }
    performDelete(password)
  }

  const handleReplySuccess = () => {
    setShowReplyForm(false)
    onReply?.()
  }

  return (
    <div className={`${comment.depth > 0 ? 'ml-4 md:ml-10 pl-4 border-l-2 border-slate-200 dark:border-slate-700' : ''}`}>
      <div className="py-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {comment.user && onMemberClick ? (
              <button
                onClick={() => onMemberClick(comment.user!.id)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {comment.user.profileImage ? (
                  <img
                    src={comment.user.profileImage}
                    alt={comment.user.nickname}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                    {comment.user.nickname[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="font-medium text-slate-900 dark:text-slate-100 text-sm hover:text-primary hover:underline transition-colors">
                  {comment.user.nickname}
                </span>
              </button>
            ) : (
              <>
                {comment.user?.profileImage ? (
                  <img
                    src={comment.user.profileImage}
                    alt={comment.user.nickname}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                    {authorName[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                  {authorName}
                </span>
              </>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formattedDate}
            </span>
          </div>

          {canDelete && (
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Icon name="delete" size="sm" />
            </button>
          )}
        </div>

        {/* 내용 */}
        <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* 액션 - 답글 달기 (depth 0일 때만) */}
        {comment.depth === 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-slate-500 hover:text-primary transition-colors"
            >
              답글 달기
            </button>
          </div>
        )}

        {/* 답글 작성 폼 */}
        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onSuccess={handleReplySuccess}
              onCancel={() => setShowReplyForm(false)}
              placeholder="답글을 입력하세요"
            />
          </div>
        )}
      </div>

      {/* 대댓글 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onDelete={onDelete}
              onReply={onReply}
              onMemberClick={onMemberClick}
            />
          ))}
        </div>
      )}

      {/* 비밀번호 확인 모달 (비회원 댓글) */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handlePasswordConfirm}
        title="댓글 삭제"
        isLoading={isDeleting}
        confirmLabel="삭제"
        confirmVariant="danger"
      />

      {/* 삭제 확인 모달 (회원/관리자) */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={() => performDelete()}
        title="댓글 삭제"
        message="댓글을 삭제하시겠습니까?"
        isLoading={isDeleting}
      />
    </div>
  )
}
