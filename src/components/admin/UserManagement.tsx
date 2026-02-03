'use client'

import { useState, useEffect, useCallback } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/providers/ToastProvider'
import { Pagination } from '@/components/ui/Pagination'

interface User {
  id: number
  email: string
  nickname: string
  profileImage: string | null
  role: 'admin' | 'user'
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function UserManagement() {
  const { success, error: showError } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' })
      if (search) params.set('search', search)

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data: UsersResponse = await response.json()
        setUsers(data.users)
        setTotalPages(data.pagination.totalPages)
      }
    } catch {
      showError('회원 목록을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [page, search, showError])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRoleChange = async (userId: number, newRole: 'admin' | 'user') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error('권한 변경에 실패했습니다')
      }

      success('권한이 변경되었습니다')
      fetchUsers()
    } catch {
      showError('권한 변경에 실패했습니다')
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('회원 삭제에 실패했습니다')
      }

      success('회원이 삭제되었습니다')
      setShowDeleteModal(false)
      setSelectedUser(null)
      fetchUsers()
    } catch {
      showError('회원 삭제에 실패했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  return (
    <div className="space-y-6">
      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="이메일 또는 닉네임으로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">검색</Button>
      </form>

      {/* 회원 목록 */}
      {isLoading ? (
        <div className="text-center py-12">
          <Icon name="hourglass_empty" className="animate-spin text-slate-400" size="xl" />
          <p className="mt-2 text-slate-500">불러오는 중...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          회원이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">회원</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">이메일</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">권한</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">가입일</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">마지막 로그인</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.nickname}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                          {user.nickname[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {user.nickname}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                    {user.email}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                      className="text-sm px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    >
                      <option value="user">일반</option>
                      <option value="admin">관리자</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString('ko-KR')
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setShowDeleteModal(true)
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <Icon name="delete" size="sm" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="회원 삭제"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            정말 이 회원을 삭제하시겠습니까?
          </p>
          {selectedUser && (
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedUser.nickname}
              </p>
              <p className="text-sm text-slate-500">{selectedUser.email}</p>
            </div>
          )}
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
    </div>
  )
}
