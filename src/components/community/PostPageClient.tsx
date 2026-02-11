'use client'

import { useState } from 'react'
import { PostDetail } from './PostDetail'
import { CommentSection } from './CommentSection'
import { MemberProfileModal } from './MemberProfileModal'

interface PostPageClientProps {
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
}

export function PostPageClient({ post }: PostPageClientProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)

  return (
    <>
      <PostDetail
        post={post}
        onMemberClick={setSelectedMemberId}
      />
      <CommentSection
        postId={post.id}
        onMemberClick={setSelectedMemberId}
      />
      <MemberProfileModal
        isOpen={selectedMemberId !== null}
        onClose={() => setSelectedMemberId(null)}
        userId={selectedMemberId}
      />
    </>
  )
}
