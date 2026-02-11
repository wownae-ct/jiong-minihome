import { render, screen, waitFor } from '@testing-library/react'

vi.mock('@/components/ui/Icon', () => ({
  Icon: ({ name }: { name: string; size?: string }) => (
    <span data-testid={`icon-${name}`} />
  ),
}))

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean; onClose: () => void; title: string; size?: string }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null,
}))

vi.mock('@/components/ui/Input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}))

vi.mock('@/components/ui/Pagination', () => ({
  Pagination: () => <div data-testid="pagination" />,
}))

vi.mock('@/components/providers/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

import { UserManagement } from './UserManagement'

const mockUsers = [
  {
    id: 1,
    email: 'admin@example.com',
    nickname: '관리자',
    profileImage: null,
    role: 'admin' as const,
    isActive: true,
    createdAt: '2025-01-15T09:00:00Z',
    lastLoginAt: '2025-06-01T12:00:00Z',
  },
  {
    id: 2,
    email: 'verylongemail@verylongdomain.example.com',
    nickname: '긴닉네임사용자테스트',
    profileImage: 'https://example.com/avatar.jpg',
    role: 'user' as const,
    isActive: true,
    createdAt: '2025-03-20T09:00:00Z',
    lastLoginAt: null,
  },
]

describe('UserManagement', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    global.fetch = mockFetch
    vi.clearAllMocks()
  })

  it('회원 목록을 테이블에 표시해야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        users: mockUsers,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      }),
    })

    render(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
      expect(screen.getByText('긴닉네임사용자테스트')).toBeInTheDocument()
      expect(screen.getByText('verylongemail@verylongdomain.example.com')).toBeInTheDocument()
    })
  })

  it('테이블에 min-width가 적용되어 줄바꿈을 방지해야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        users: mockUsers,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      }),
    })

    render(<UserManagement />)

    await waitFor(() => {
      const table = screen.getByRole('table')
      expect(table.className).toContain('min-w-')
    })
  })

  it('이메일 셀에 whitespace-nowrap이 적용되어야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        users: mockUsers,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      }),
    })

    render(<UserManagement />)

    await waitFor(() => {
      const emailCell = screen.getByText('admin@example.com').closest('td')
      expect(emailCell?.className).toContain('whitespace-nowrap')
    })
  })

  it('날짜 셀에 whitespace-nowrap이 적용되어야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        users: mockUsers,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      }),
    })

    render(<UserManagement />)

    await waitFor(() => {
      // 가입일에 해당하는 날짜 텍스트 찾기
      const dateCell = screen.getByText('2025. 1. 15.').closest('td')
      expect(dateCell?.className).toContain('whitespace-nowrap')
    })
  })
})
