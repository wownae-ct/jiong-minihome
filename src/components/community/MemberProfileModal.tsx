'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { ProfileAvatar } from '@/components/common/ProfileAvatar'

interface UserProfile {
  id: number
  nickname: string
  profileImage: string | null
  bio: string | null
  createdAt: string
  postCount: number
  commentCount: number
}

interface UserPost {
  id: number
  title: string
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  category: { id: number; name: string; slug: string }
}

interface UserComment {
  id: number
  content: string
  createdAt: string
  post: { id: number; title: string; category: { slug: string } }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

async function fetchUserProfile(userId: number): Promise<UserProfile> {
  const response = await fetch(`/api/users/${userId}`)
  if (!response.ok) throw new Error('Failed to fetch user profile')
  return response.json()
}

async function fetchUserPosts(userId: number, page: number): Promise<{ posts: UserPost[]; pagination: PaginationData }> {
  const response = await fetch(`/api/users/${userId}/posts?page=${page}&limit=5`)
  if (!response.ok) throw new Error('Failed to fetch user posts')
  return response.json()
}

async function fetchUserComments(userId: number, page: number): Promise<{ comments: UserComment[]; pagination: PaginationData }> {
  const response = await fetch(`/api/users/${userId}/comments?page=${page}&limit=5`)
  if (!response.ok) throw new Error('Failed to fetch user comments')
  return response.json()
}

interface MemberProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: number | null
  onPostClick?: (postId: number, categorySlug: string) => void
}

export function MemberProfileModal({
  isOpen,
  onClose,
  userId,
  onPostClick,
}: MemberProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts')
  const [postsPage, setPostsPage] = useState(1)
  const [commentsPage, setCommentsPage] = useState(1)

  useEffect(() => {
    if (isOpen) {
      setActiveTab('posts')
      setPostsPage(1)
      setCommentsPage(1)
    }
  }, [isOpen, userId])

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: isOpen && userId !== null,
  })

  const { data: postsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ['user-posts', userId, postsPage],
    queryFn: () => fetchUserPosts(userId!, postsPage),
    enabled: isOpen && userId !== null && activeTab === 'posts',
  })

  const { data: commentsData, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['user-comments', userId, commentsPage],
    queryFn: () => fetchUserComments(userId!, commentsPage),
    enabled: isOpen && userId !== null && activeTab === 'comments',
  })

  const handlePostClick = (postId: number, categorySlug: string) => {
    onPostClick?.(postId, categorySlug)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="회원 프로필" size="lg">
      {isProfileLoading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={64} height={64} />
            <div className="space-y-2">
              <Skeleton width={120} height={20} />
              <Skeleton width={200} height={16} />
            </div>
          </div>
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* 프로필 헤더 */}
          <div className="flex items-start gap-4">
            <ProfileAvatar
              src={profile.profileImage}
              alt={profile.nickname}
              size="lg"
              className="flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {profile.nickname}
              </h3>
              {profile.bio && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {profile.bio}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Icon name="calendar_today" size="sm" />
                  {new Date(profile.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="article" size="sm" />
                  게시글 {profile.postCount}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="chat_bubble_outline" size="sm" />
                  댓글 {profile.commentCount}
                </span>
              </div>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
            <button
              onClick={() => { setActiveTab('posts'); setPostsPage(1) }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'posts'
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              게시글
            </button>
            <button
              onClick={() => { setActiveTab('comments'); setCommentsPage(1) }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'comments'
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              댓글
            </button>
          </div>

          {/* 게시글 탭 내용 */}
          {activeTab === 'posts' && (
            <div>
              {isPostsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} width="100%" height={48} />
                  ))}
                </div>
              ) : postsData?.posts?.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  작성한 게시글이 없습니다.
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {postsData?.posts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => handlePostClick(post.id, post.category.slug)}
                        className="w-full text-left py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-2 -mx-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            [{post.category.name}]
                          </span>
                        </div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="visibility" size="sm" />
                            {post.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="favorite_border" size="sm" />
                            {post.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="chat_bubble_outline" size="sm" />
                            {post.commentCount}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {postsData && postsData.pagination.totalPages > 1 && (
                    <div className="pt-4">
                      <Pagination
                        currentPage={postsPage}
                        totalPages={postsData.pagination.totalPages}
                        onPageChange={setPostsPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 댓글 탭 내용 */}
          {activeTab === 'comments' && (
            <div>
              {isCommentsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} width="100%" height={48} />
                  ))}
                </div>
              ) : commentsData?.comments?.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  작성한 댓글이 없습니다.
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {commentsData?.comments.map((comment) => (
                      <button
                        key={comment.id}
                        onClick={() => handlePostClick(comment.post.id, comment.post.category.slug)}
                        className="w-full text-left py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-2 -mx-2 rounded-lg transition-colors"
                      >
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <Icon name="subdirectory_arrow_right" size="sm" />
                          <span className="truncate">{comment.post.title}</span>
                          <span className="flex-shrink-0">
                            {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {commentsData && commentsData.pagination.totalPages > 1 && (
                    <div className="pt-4">
                      <Pagination
                        currentPage={commentsPage}
                        totalPages={commentsData.pagination.totalPages}
                        onPageChange={setCommentsPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  )
}
