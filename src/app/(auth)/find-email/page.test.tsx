import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import FindEmailPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('FindEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('닉네임 입력 필드와 제출 버튼을 렌더링해야 함', () => {
    render(<FindEmailPage />)

    expect(screen.getByPlaceholderText('가입 시 사용한 닉네임을 입력하세요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이메일 찾기' })).toBeInTheDocument()
  })

  it('타이틀이 "지옹\'s 미니홈피"를 포함해야 함', () => {
    render(<FindEmailPage />)

    expect(screen.getByText(/지옹/)).toBeInTheDocument()
    expect(screen.getByText(/미니홈피/)).toBeInTheDocument()
  })

  it('닉네임 제출 시 마스킹된 이메일을 표시해야 함', async () => {
    const user = userEvent.setup()

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ email: 'ji***@gmail.com', isOAuth: false }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<FindEmailPage />)

    const input = screen.getByPlaceholderText('가입 시 사용한 닉네임을 입력하세요')
    await user.clear(input)
    await user.type(input, '지옹')
    await user.click(screen.getByRole('button', { name: '이메일 찾기' }))

    await waitFor(() => {
      expect(screen.getByText('ji***@gmail.com')).toBeInTheDocument()
    })
  })

  it('OAuth 계정이면 소셜 로그인 안내를 표시해야 함', async () => {
    const user = userEvent.setup()

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ email: 'oa***@gmail.com', isOAuth: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<FindEmailPage />)

    const input = screen.getByPlaceholderText('가입 시 사용한 닉네임을 입력하세요')
    await user.clear(input)
    await user.type(input, 'oauth유저')
    await user.click(screen.getByRole('button', { name: '이메일 찾기' }))

    await waitFor(() => {
      expect(screen.getByText('소셜 로그인으로 가입된 계정입니다')).toBeInTheDocument()
    })
  })

  it('로그인과 비밀번호 찾기 링크가 있어야 함', () => {
    render(<FindEmailPage />)

    expect(screen.getByText('로그인')).toBeInTheDocument()
    expect(screen.getByText('비밀번호 찾기')).toBeInTheDocument()
  })
})
