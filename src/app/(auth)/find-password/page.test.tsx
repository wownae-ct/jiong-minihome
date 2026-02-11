import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import FindPasswordPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('FindPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('이메일 입력 필드와 제출 버튼을 렌더링해야 함', () => {
    render(<FindPasswordPage />)

    expect(screen.getByPlaceholderText('가입 시 사용한 이메일을 입력하세요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '임시 비밀번호 발급' })).toBeInTheDocument()
  })

  it('타이틀이 "지옹\'s 미니홈피"를 포함해야 함', () => {
    render(<FindPasswordPage />)

    expect(screen.getByText(/지옹/)).toBeInTheDocument()
    expect(screen.getByText(/미니홈피/)).toBeInTheDocument()
  })

  it('이메일 제출 성공 시 발송 완료 메시지를 표시해야 함', async () => {
    const user = userEvent.setup()

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: '임시 비밀번호가 이메일로 발송되었습니다' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<FindPasswordPage />)

    const input = screen.getByPlaceholderText('가입 시 사용한 이메일을 입력하세요')
    await user.clear(input)
    await user.type(input, 'test@gmail.com')
    await user.click(screen.getByRole('button', { name: '임시 비밀번호 발급' }))

    await waitFor(() => {
      expect(screen.getByText('임시 비밀번호가 이메일로 발송되었습니다')).toBeInTheDocument()
    })
  })

  it('발송 완료 후 로그인 버튼이 표시되어야 함', async () => {
    const user = userEvent.setup()

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: '성공' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<FindPasswordPage />)

    const input = screen.getByPlaceholderText('가입 시 사용한 이메일을 입력하세요')
    await user.clear(input)
    await user.type(input, 'test@gmail.com')
    await user.click(screen.getByRole('button', { name: '임시 비밀번호 발급' }))

    await waitFor(() => {
      expect(screen.getByText('로그인하러 가기')).toBeInTheDocument()
    })
  })

  it('로그인과 아이디 찾기 링크가 있어야 함', () => {
    render(<FindPasswordPage />)

    expect(screen.getByText('로그인')).toBeInTheDocument()
    expect(screen.getByText('아이디 찾기')).toBeInTheDocument()
  })
})
