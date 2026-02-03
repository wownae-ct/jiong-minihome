'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { PostList } from '@/components/community/PostList'
import { PostForm } from '@/components/community/PostForm'
import { PostDetail } from '@/components/community/PostDetail'
import { CommentSection } from '@/components/community/CommentSection'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/providers/ToastProvider'

type Category = 'all' | 'free' | 'qna' | 'info'
type ViewMode = 'list' | 'write' | 'detail' | 'edit'

interface PostData {
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

export function CommunityContent() {
  const { data: session } = useSession()
  const { error: showError } = useToast()
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null)
  const [isLoadingPost, setIsLoadingPost] = useState(false)

  const categories: { id: Category; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'free', label: '자유게시판' },
    { id: 'qna', label: '질문답변' },
    { id: 'info', label: '정보공유' },
  ]

  const fetchPost = useCallback(async (postId: number) => {
    setIsLoadingPost(true)
    try {
      const response = await fetch(`/api/posts/${postId}`)
      if (!response.ok) {
        throw new Error('게시글을 불러오는데 실패했습니다')
      }
      const data = await response.json()
      setSelectedPost(data)
    } catch {
      showError('게시글을 불러오는데 실패했습니다')
      setViewMode('list')
    } finally {
      setIsLoadingPost(false)
    }
  }, [showError])

  useEffect(() => {
    if (selectedPostId && viewMode === 'detail') {
      fetchPost(selectedPostId)
    }
  }, [selectedPostId, viewMode, fetchPost])

  const handlePostClick = (postId: number) => {
    setSelectedPostId(postId)
    setViewMode('detail')
  }

  const handleBack = () => {
    setViewMode('list')
    setSelectedPostId(null)
    setSelectedPost(null)
  }

  const handleWriteClick = () => {
    if (!session) {
      showError('로그인이 필요합니다')
      return
    }
    setViewMode('write')
  }

  const handleWriteSuccess = () => {
    setViewMode('list')
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

  const handleEditClick = () => {
    setViewMode('edit')
  }

  const handleEditSuccess = () => {
    if (selectedPostId) {
      fetchPost(selectedPostId)
    }
    setViewMode('detail')
  }

  const handleDeleteSuccess = () => {
    setViewMode('list')
    setSelectedPostId(null)
    setSelectedPost(null)
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {viewMode !== 'list' && (
            <button
              onClick={handleBack}
              className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Icon name="arrow_back" />
            </button>
          )}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="text-primary">커뮤니티</span>
            <span className="text-slate-400 dark:text-slate-500">
              {viewMode === 'list' && 'Community'}
              {viewMode === 'write' && '글쓰기'}
              {viewMode === 'edit' && '수정'}
              {viewMode === 'detail' && '상세보기'}
            </span>
          </h2>
        </div>
        {viewMode === 'list' && (
          <button
            onClick={handleWriteClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 group"
          >
            <Image
              src="/icons/note-icon.png"
              alt="글쓰기"
              width={16}
              height={16}
              className="invert group-hover:rotate-12 transition-transform duration-200"
            />
            글쓰기
          </button>
        )}
      </div>

      {/* 목록 뷰 */}
      {viewMode === 'list' && (
        <>
          <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeCategory === category.id
                    ? 'bg-primary text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          <PostList
            category={activeCategory === 'all' ? undefined : activeCategory}
            onPostClick={handlePostClick}
          />
        </>
      )}

      {/* 글쓰기 뷰 */}
      {viewMode === 'write' && (
        <PostForm onCancel={handleBack} onSuccess={handleWriteSuccess} />
      )}

      {/* 수정 뷰 */}
      {viewMode === 'edit' && selectedPost && (
        <PostForm
          initialData={{
            id: selectedPost.id,
            title: selectedPost.title,
            content: selectedPost.content,
            categoryId: selectedPost.category.id,
            isPrivate: selectedPost.isPrivate,
          }}
          onCancel={() => setViewMode('detail')}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* 상세 뷰 */}
      {viewMode === 'detail' && (
        <>
          {isLoadingPost ? (
            <div className="text-center py-12">
              <Icon name="hourglass_empty" className="animate-spin text-slate-400" size="xl" />
              <p className="mt-2 text-slate-500">불러오는 중...</p>
            </div>
          ) : selectedPost ? (
            <>
              <PostDetail post={selectedPost} onBack={handleBack} onEdit={handleEditClick} onDelete={handleDeleteSuccess} />
              <div className="mt-6">
                <CommentSection postId={selectedPost.id} />
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              게시글을 찾을 수 없습니다.
            </div>
          )}
        </>
      )}
    </div>
  )
}
