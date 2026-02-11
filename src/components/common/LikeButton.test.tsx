import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@/components/providers/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

vi.mock('@/components/ui/Icon', () => ({
  Icon: ({ name, fill }: { name: string; fill?: boolean; size?: string }) => (
    <span data-testid={`icon-${name}`} data-fill={fill ? 'true' : 'false'} />
  ),
}))

import { useSession } from 'next-auth/react'
import { LikeButton } from './LikeButton'

describe('LikeButton', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('좋아요 안 된 상태에서 빈 하트(fill=false)를 표시해야 함', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '1', name: '테스터', email: 'test@test.com', role: 'user' },
        expires: '',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    // 좋아요 상태 확인 API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: false }),
    })

    render(<LikeButton targetType="post" targetId={1} initialCount={5} />)

    const icon = screen.getByTestId('icon-favorite')
    expect(icon).toHaveAttribute('data-fill', 'false')
  })

  it('좋아요된 상태에서 꽉 찬 하트(fill=true)를 표시해야 함', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '1', name: '테스터', email: 'test@test.com', role: 'user' },
        expires: '',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    // 좋아요 상태 확인 API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: true }),
    })

    render(<LikeButton targetType="post" targetId={1} initialCount={5} />)

    await waitFor(() => {
      const icon = screen.getByTestId('icon-favorite')
      expect(icon).toHaveAttribute('data-fill', 'true')
    })
  })

  it('클릭 시 좋아요 토글 후 아이콘 fill이 변경되어야 함', async () => {
    const user = userEvent.setup()

    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '1', name: '테스터', email: 'test@test.com', role: 'user' },
        expires: '',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    // 초기 상태: 좋아요 안 됨
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: false }),
    })

    render(<LikeButton targetType="post" targetId={1} initialCount={5} />)

    // 좋아요 토글 API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ liked: true }),
    })

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      const icon = screen.getByTestId('icon-favorite')
      expect(icon).toHaveAttribute('data-fill', 'true')
    })
  })
})
