'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import { Skeleton } from '@/components/ui/Skeleton'

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

interface CommentSectionProps {
  postId: number
  onMemberClick?: (userId: number) => void
}

async function fetchComments(postId: number): Promise<CommentData[]> {
  const response = await fetch(`/api/posts/${postId}/comments`)
  if (!response.ok) {
    throw new Error('Failed to fetch comments')
  }
  return response.json()
}

export function CommentSection({ postId, onMemberClick }: CommentSectionProps) {
  const queryClient = useQueryClient()

  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['comments', postId] })
  }

  if (error) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        댓글을 불러오는데 실패했습니다.
      </div>
    )
  }

  return (
    <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        댓글 {comments?.length || 0}개
      </h3>

      {/* 댓글 작성 폼 */}
      <CommentForm postId={postId} onSuccess={handleRefresh} />

      {/* 댓글 목록 */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton variant="circular" width={36} height={36} />
                <Skeleton width={100} height={16} />
              </div>
              <Skeleton width="80%" height={16} />
            </div>
          ))
        ) : comments?.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
          </div>
        ) : (
          comments?.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onDelete={handleRefresh}
              onReply={handleRefresh}
              onMemberClick={onMemberClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
