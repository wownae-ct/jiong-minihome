'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { CommentForm } from './CommentForm'
import { useToast } from '@/components/providers/ToastProvider'

interface CommentData {
  id: number
  content: string
  depth: number
  likeCount: number
  createdAt: string
  userId: number | null
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
}

export function CommentItem({
  comment,
  postId,
  onDelete,
  onReply,
}: CommentItemProps) {
  const { data: session } = useSession()
  const { success, error: showError } = useToast()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = session?.user?.id === String(comment.userId)
  const isAdmin = session?.user?.role === 'admin'
  const canDelete = isOwner || isAdmin

  const formattedDate = new Date(comment.createdAt).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleDelete = async () => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        showError(result.error || '삭제에 실패했습니다')
        return
      }

      success('댓글이 삭제되었습니다')
      onDelete?.()
    } catch {
      showError('삭제 중 오류가 발생했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReplySuccess = () => {
    setShowReplyForm(false)
    onReply?.()
  }

  return (
    <div className={`${comment.depth > 0 ? 'ml-10 pl-4 border-l-2 border-slate-200 dark:border-slate-700' : ''}`}>
      <div className="py-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {comment.user?.profileImage ? (
              <img
                src={comment.user.profileImage}
                alt={comment.user.nickname}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                {comment.user?.nickname?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
              {comment.user?.nickname || '알 수 없음'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formattedDate}
            </span>
          </div>

          {canDelete && (
            <button
              onClick={handleDelete}
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

        {/* 액션 */}
        {comment.depth === 0 && session && (
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
