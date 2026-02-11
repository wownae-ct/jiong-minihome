import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@/components/providers/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

vi.mock('@/components/ui/Icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}))

vi.mock('@/components/ui/Input', () => ({
  Input: ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) => (
    <div>
      {label && <label>{label}</label>}
      <input aria-label={label} {...props} />
    </div>
  ),
}))

vi.mock('@/components/ui/Textarea', () => ({
  Textarea: ({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) => (
    <div>
      {label && <label>{label}</label>}
      <textarea aria-label={label} {...props} />
    </div>
  ),
}))

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

import { useSession } from 'next-auth/react'
import { ProfileSettings } from './ProfileSettings'

describe('ProfileSettings', () => {
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
    vi.restoreAllMocks()
  })

  it('마운트 시 /api/users/me에서 기존 프로필 데이터를 로드해야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        nickname: '기존닉네임',
        bio: '기존 자기소개입니다',
        profileImage: null,
      }),
    })

    render(<ProfileSettings />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/users/me')
    })

    await waitFor(() => {
      const nicknameInput = screen.getByLabelText('닉네임') as HTMLInputElement
      expect(nicknameInput.value).toBe('기존닉네임')
    })

    const bioTextarea = screen.getByLabelText('자기소개') as HTMLTextAreaElement
    expect(bioTextarea.value).toBe('기존 자기소개입니다')
  })

  it('저장 성공 후 응답 데이터로 폼이 업데이트되어야 함', async () => {
    const user = userEvent.setup()

    // 초기 데이터 로드
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        nickname: '기존닉네임',
        bio: '기존소개',
        profileImage: null,
      }),
    })

    render(<ProfileSettings />)

    await waitFor(() => {
      expect(screen.getByLabelText('닉네임')).toHaveValue('기존닉네임')
    })

    // 닉네임 변경
    const nicknameInput = screen.getByLabelText('닉네임')
    await user.clear(nicknameInput)
    await user.type(nicknameInput, '새닉네임')

    // 저장 API 응답
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        nickname: '새닉네임',
        bio: '기존소개',
        profileImage: null,
      }),
    })

    const submitButton = screen.getByText('저장')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByLabelText('닉네임')).toHaveValue('새닉네임')
    })
  })

  it('마운트 시 서버 데이터만 로드하고 session에 의존하지 않아야 함', async () => {
    // API에서 반환하는 프로필 데이터
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        nickname: '서버닉네임',
        bio: '서버 자기소개',
        profileImage: '/uploads/server-image.png',
      }),
    })

    const { unmount } = render(<ProfileSettings />)

    await waitFor(() => {
      expect(screen.getByLabelText('닉네임')).toHaveValue('서버닉네임')
    })
    expect(screen.getByLabelText('자기소개')).toHaveValue('서버 자기소개')

    unmount()

    // 재마운트 시 다시 서버에서 데이터를 가져와야 함
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        nickname: '업데이트된닉네임',
        bio: '업데이트된 자기소개',
        profileImage: '/uploads/new-image.png',
      }),
    })

    render(<ProfileSettings />)

    await waitFor(() => {
      expect(screen.getByLabelText('닉네임')).toHaveValue('업데이트된닉네임')
    })
    expect(screen.getByLabelText('자기소개')).toHaveValue('업데이트된 자기소개')
  })
})
