'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PostList } from '@/components/community/PostList'
import { PostForm } from '@/components/community/PostForm'
import { PostDetail } from '@/components/community/PostDetail'
import { CommentSection } from '@/components/community/CommentSection'
import { MemberProfileModal } from '@/components/community/MemberProfileModal'
import { PostSearchBar, SearchType } from '@/components/community/PostSearchBar'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/providers/ToastProvider'
import { useCommunityView } from '@/components/providers/tab'

type Category = 'all' | 'free' | 'qna' | 'info'
// ViewMode는 communityPostId와 로컬 액션(write/edit)으로부터 파생됨 — 별도 상태 저장 X
type LocalAction = 'write' | 'edit' | null

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

export function CommunityContent() {
  const { error: showError } = useToast()
  const queryClient = useQueryClient()
  const { communityPostId, setCommunityPost } = useCommunityView()
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  // viewMode는 더 이상 로컬 상태가 아님: communityPostId(상세)와 localAction(글쓰기/수정)으로부터 파생
  const [localAction, setLocalAction] = useState<LocalAction>(null)
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null)
  const [isLoadingPost, setIsLoadingPost] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('title')
  const [editGuestPassword, setEditGuestPassword] = useState<string | undefined>()

  // viewMode는 파생 값 — 저장된 상태가 아니라 단일 진실 공급원(communityPostId/localAction)에서 계산됨
  const viewMode: 'list' | 'write' | 'detail' | 'edit' =
    localAction === 'write'
      ? 'write'
      : localAction === 'edit'
      ? 'edit'
      : communityPostId !== null
      ? 'detail'
      : 'list'

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
      setCommunityPost(null)
    } finally {
      setIsLoadingPost(false)
    }
  }, [showError, setCommunityPost])

  // communityPostId 변경 시 게시글 fetch (브라우저 뒤/앞 네비게이션 포함)
  useEffect(() => {
    if (communityPostId !== null) {
      fetchPost(communityPostId)
    } else {
      setSelectedPost(null)
    }
  }, [communityPostId, fetchPost])

  const handlePostClick = (postId: number, categorySlug: string) => {
    setLocalAction(null)
    setCommunityPost(postId, categorySlug)
  }

  const handleBack = () => {
    setLocalAction(null)
    setEditGuestPassword(undefined)
    setCommunityPost(null)
  }

  const handleWriteClick = () => {
    setLocalAction('write')
  }

  const handleWriteSuccess = () => {
    setLocalAction(null)
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

  const handleEditClick = (guestPassword?: string) => {
    setEditGuestPassword(guestPassword)
    setLocalAction('edit')
  }

  const handleEditSuccess = () => {
    if (communityPostId) {
      fetchPost(communityPostId)
    }
    setLocalAction(null)
    setEditGuestPassword(undefined)
  }

  const handleDeleteSuccess = () => {
    setLocalAction(null)
    setCommunityPost(null)
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

  const handleMemberClick = (userId: number) => {
    setSelectedMemberId(userId)
  }

  const handleMemberPostClick = (postId: number) => {
    setSelectedMemberId(null)
    setLocalAction(null)
    setCommunityPost(postId)
  }

  const handleSearch = (query: string, type: SearchType) => {
    setSearchQuery(query)
    setSearchType(type)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700">
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="text-primary">커뮤니티</span>
            <span className="text-slate-400 dark:text-slate-500">
              {viewMode === 'list' && 'Community'}
              {viewMode === 'write' && '글쓰기'}
              {viewMode === 'edit' && '수정'}
              {viewMode === 'detail' && '상세보기'}
            </span>
          </h2>
        </div>
        {/* 글쓰기 버튼은 하단 콘텐츠 영역으로 이동 */}
      </div>

      {/* 목록 뷰 */}
      {viewMode === 'list' && (
        <>
          <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    activeCategory === category.id
                      ? 'bg-primary text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleWriteClick}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 group whitespace-nowrap shrink-0"
            >
              <Icon name="edit_note" className="group-hover:rotate-12 transition-transform duration-200" size="sm" />
              글쓰기
            </button>
          </div>
          <PostSearchBar onSearch={handleSearch} className="mb-4" />
          <PostList
            category={activeCategory === 'all' ? undefined : activeCategory}
            onPostClick={handlePostClick}
            onMemberClick={handleMemberClick}
            search={searchQuery}
            searchType={searchType}
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
            isGuestPost: !selectedPost.userId && !!selectedPost.guestName,
          }}
          guestPassword={editGuestPassword}
          onCancel={() => setLocalAction(null)}
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
              <PostDetail post={selectedPost} onBack={handleBack} onEdit={handleEditClick} onDelete={handleDeleteSuccess} onMemberClick={handleMemberClick} />
              <div className="mt-6">
                <CommentSection postId={selectedPost.id} onMemberClick={handleMemberClick} />
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              게시글을 찾을 수 없습니다.
            </div>
          )}
        </>
      )}
      <MemberProfileModal
        isOpen={selectedMemberId !== null}
        onClose={() => setSelectedMemberId(null)}
        userId={selectedMemberId}
        onPostClick={handleMemberPostClick}
      />
    </div>
  )
}
