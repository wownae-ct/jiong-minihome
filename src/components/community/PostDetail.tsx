'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/providers/ToastProvider'
import { LikeButton } from '@/components/common/LikeButton'

interface PostDetailProps {
  post: {
    id: number
    title: string
    content: string
    viewCount: number
    likeCount: number
    commentCount: number
    isPinned: boolean
    isPrivate: boolean
    createdAt: string
    updatedAt: string
    userId: number | null
    user: {
      id: number
      nickname: string
      profileImage: string | null
    } | null
    category: {
      id: number
      name: string
      slug: string
    }
  }
  onBack?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function PostDetail({ post, onBack, onEdit, onDelete }: PostDetailProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { success, error: showError } = useToast()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = session?.user?.id === String(post.userId)
  const isAdmin = session?.user?.role === 'admin'
  const canEdit = isOwner || isAdmin

  const formattedDate = new Date(post.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        showError(result.error || '삭제에 실패했습니다')
        return
      }

      success('게시글이 삭제되었습니다')
      if (onDelete) {
        onDelete()
      } else {
        router.push('/community')
        router.refresh()
      }
    } catch {
      showError('삭제 중 오류가 발생했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/community"
              className="text-sm text-slate-500 hover:text-primary"
            >
              커뮤니티
            </Link>
            <Icon name="chevron_right" size="sm" className="text-slate-400" />
            <span className="text-sm text-primary">{post.category.name}</span>
            {post.isPinned && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                공지
              </span>
            )}
            {post.isPrivate && (
              <Icon name="lock" size="sm" className="text-slate-400 ml-1" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {post.title}
          </h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {post.user?.profileImage ? (
                <img
                  src={post.user.profileImage}
                  alt={post.user.nickname}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {post.user?.nickname?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {post.user?.nickname || '알 수 없음'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formattedDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Icon name="visibility" size="sm" />
                {post.viewCount}
              </span>
              <LikeButton
                targetType="post"
                targetId={post.id}
                initialCount={post.likeCount}
                size="sm"
              />
              <span className="flex items-center gap-1">
                <Icon name="chat_bubble_outline" size="sm" />
                {post.commentCount}
              </span>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6">
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-primary"
            >
              <Icon name="arrow_back" size="sm" />
              목록으로
            </button>
          ) : (
            <Link
              href="/community"
              className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-primary"
            >
              <Icon name="arrow_back" size="sm" />
              목록으로
            </Link>
          )}

          {canEdit && (
            <div className="flex items-center gap-2">
              {onEdit ? (
                <button
                  onClick={onEdit}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  수정
                </button>
              ) : (
                <Link
                  href={`/community/write?edit=${post.id}`}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  수정
                </Link>
              )}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="게시글 삭제"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            정말 이 게시글을 삭제하시겠습니까?
          </p>
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
