'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { useLightbox } from '@/hooks/useLightbox'
import { useToast } from '@/components/providers/ToastProvider'
import { LikeButton } from '@/components/common/LikeButton'
import { PasswordModal } from '@/components/common/PasswordModal'
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal'
import { ProfileAvatar } from '@/components/common/ProfileAvatar'
import { sanitizeHtml, isHtmlContent } from '@/lib/sanitize'
import { highlightCodeBlocks } from '@/lib/highlight-code'

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
    guestName?: string | null
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
  onEdit?: (guestPassword?: string) => void
  onDelete?: () => void
  onMemberClick?: (userId: number) => void
}

export function PostDetail({ post, onBack, onEdit, onDelete, onMemberClick }: PostDetailProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { success, error: showError } = useToast()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordAction, setPasswordAction] = useState<'edit' | 'delete'>('delete')
  const [isDeleting, setIsDeleting] = useState(false)
  const proseRef = useRef<HTMLDivElement>(null)
  const { openLightbox } = useLightbox()

  useEffect(() => {
    const container = proseRef.current
    if (!container) return

    const imgs = container.querySelectorAll('img')
    const handleClick = (e: Event) => {
      const img = e.currentTarget as HTMLImageElement
      openLightbox({ src: img.src, alt: img.alt || '' })
    }

    imgs.forEach((img) => {
      img.style.cursor = 'pointer'
      img.style.touchAction = 'manipulation'
      img.addEventListener('click', handleClick)
    })

    return () => {
      imgs.forEach((img) => {
        img.removeEventListener('click', handleClick)
      })
    }
  }, [post.content, openLightbox])

  const isOwner = session?.user?.id === String(post.userId)
  const isAdmin = session?.user?.role === 'admin'
  const isGuestPost = !post.userId && !!post.guestName
  const canEdit = isOwner || isAdmin || isGuestPost

  const authorName = post.user?.nickname || post.guestName || '알 수 없음'

  const formattedDate = new Date(post.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleEditClick = () => {
    if (isGuestPost && !isAdmin) {
      setPasswordAction('edit')
      setShowPasswordModal(true)
    } else if (onEdit) {
      onEdit()
    }
  }

  const handleDeleteClick = () => {
    if (isGuestPost && !isAdmin) {
      setPasswordAction('delete')
      setShowPasswordModal(true)
    } else {
      setShowDeleteModal(true)
    }
  }

  const handlePasswordConfirm = async (password: string) => {
    if (!password.trim()) {
      showError('비밀번호를 입력해주세요')
      return
    }

    if (passwordAction === 'edit') {
      setShowPasswordModal(false)
      onEdit?.(password)
    } else {
      await performDelete(password)
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

      const response = await fetch(`/api/posts/${post.id}`, options)

      if (!response.ok) {
        const result = await response.json()
        showError(result.error || '삭제에 실패했습니다')
        return
      }

      success('게시글이 삭제되었습니다')
      setShowPasswordModal(false)
      setShowDeleteModal(false)
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
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {post.title}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {post.user && onMemberClick ? (
                <button
                  onClick={() => onMemberClick(post.user!.id)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <ProfileAvatar
                    src={post.user.profileImage}
                    alt={post.user.nickname}
                    size="md"
                  />
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-slate-100 hover:text-primary hover:underline transition-colors">
                      {post.user.nickname}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formattedDate}
                    </p>
                  </div>
                </button>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {authorName[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {authorName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formattedDate}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 shrink-0">
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
        <div className="p-4 sm:p-6">
          {isHtmlContent(post.content) ? (
            <div
              ref={proseRef}
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: highlightCodeBlocks(sanitizeHtml(post.content)) }}
            />
          ) : (
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
              {post.content}
            </div>
          )}
        </div>

        {/* 하단 액션 */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
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
              <button
                onClick={handleEditClick}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                수정
              </button>
              <button
                onClick={handleDeleteClick}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 비밀번호 확인 모달 (비회원 글) */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handlePasswordConfirm}
        title={passwordAction === 'edit' ? '게시글 수정' : '게시글 삭제'}
        isLoading={isDeleting}
        confirmVariant={passwordAction === 'delete' ? 'danger' : 'primary'}
      />

      {/* 삭제 확인 모달 (회원 글) */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => performDelete()}
        title="게시글 삭제"
        message="정말 이 게시글을 삭제하시겠습니까?"
        isLoading={isDeleting}
      />
    </>
  )
}
