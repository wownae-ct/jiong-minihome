import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@/components/providers/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

import { useSession } from 'next-auth/react'
import { NotificationSettings } from './NotificationSettings'

describe('NotificationSettings', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    global.fetch = mockFetch
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '1', name: '테스터', email: 'test@test.com', role: 'user' },
        expires: '',
      },
      status: 'authenticated',
      update: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('서버에서 알림 설정을 로드해야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        comments: true,
        likes: false,
        replies: true,
        email: false,
      }),
    })

    render(<NotificationSettings />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/users/me/notification-settings')
    })

    // 설정 항목들이 표시되어야 함
    await waitFor(() => {
      expect(screen.getByText('댓글 알림')).toBeInTheDocument()
      expect(screen.getByText('좋아요 알림')).toBeInTheDocument()
      expect(screen.getByText('답글 알림')).toBeInTheDocument()
      expect(screen.getByText('이메일 알림')).toBeInTheDocument()
    })
  })

  it('저장 버튼 클릭 시 API에 설정을 전송해야 함', async () => {
    const user = userEvent.setup()

    // 초기 로드
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        comments: true,
        likes: true,
        replies: true,
        email: false,
      }),
    })

    render(<NotificationSettings />)

    await waitFor(() => {
      expect(screen.getByText('댓글 알림')).toBeInTheDocument()
    })

    // 저장 API 응답
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        comments: true,
        likes: true,
        replies: true,
        email: false,
      }),
    })

    await user.click(screen.getByText('저장'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users/me/notification-settings',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
  })
})
