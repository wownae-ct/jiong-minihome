'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { GuestbookEntry } from './GuestbookEntry'
import { GuestbookForm } from './GuestbookForm'
import { MemberProfileModal } from '@/components/community/MemberProfileModal'
import { Pagination } from '@/components/ui/Pagination'
import { SkeletonPost } from '@/components/ui/Skeleton'
import { useState } from 'react'

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

interface GuestbookResponse {
  entries: GuestbookEntryData[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function fetchGuestbook(page: number): Promise<GuestbookResponse> {
  const response = await fetch(`/api/guestbook?page=${page}&limit=3`)
  if (!response.ok) {
    throw new Error('Failed to fetch guestbook')
  }
  return response.json()
}

export function GuestbookList() {
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data, isLoading, error } = useQuery({
    queryKey: ['guestbook', page],
    queryFn: () => fetchGuestbook(page),
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['guestbook'] })
  }

  if (error) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        방명록을 불러오는데 실패했습니다.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 작성 폼 */}
      <GuestbookForm onSuccess={handleRefresh} />

      {/* 목록 */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonPost key={i} />)
        ) : data?.entries.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            아직 방명록이 없습니다. 첫 번째 방명록을 남겨주세요!
          </div>
        ) : (
          data?.entries.map((entry) => (
            <GuestbookEntry
              key={entry.id}
              entry={entry}
              onDelete={handleRefresh}
              onMemberClick={setSelectedUserId}
            />
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {data && data.pagination.totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            currentPage={page}
            totalPages={data.pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
      {/* 회원 프로필 모달 */}
      <MemberProfileModal
        isOpen={selectedUserId !== null}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
        onPostClick={(postId, categorySlug) => router.push(`/community/${categorySlug}/${postId}`)}
      />
    </div>
  )
}
