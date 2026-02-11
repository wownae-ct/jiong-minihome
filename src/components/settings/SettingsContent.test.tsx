import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@/components/providers/TabContext', () => ({
  useTab: () => ({ setActiveTab: vi.fn() }),
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

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('./ProfileSettings', () => ({
  ProfileSettings: () => <div data-testid="profile-settings">ProfileSettings</div>,
}))

vi.mock('./AccountSettings', () => ({
  AccountSettings: () => <div data-testid="account-settings">AccountSettings</div>,
}))

vi.mock('./NotificationSettings', () => ({
  NotificationSettings: () => <div data-testid="notification-settings">NotificationSettings</div>,
}))

vi.mock('./ThemeSettings', () => ({
  ThemeSettings: () => <div data-testid="theme-settings">ThemeSettings</div>,
}))

import { useSession } from 'next-auth/react'
import { SettingsContent } from './SettingsContent'

describe('SettingsContent', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('비밀번호가 있는 사용자에게 비밀번호 확인 화면을 먼저 표시해야 함', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '1', name: '테스터', email: 'test@test.com', role: 'user' },
        expires: '',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ hasPassword: true }),
    })

    render(<SettingsContent />)

    await waitFor(() => {
      expect(screen.getByText('비밀번호 확인')).toBeInTheDocument()
    })

    // 설정 탭이 보이지 않아야 함
    expect(screen.queryByTestId('profile-settings')).not.toBeInTheDocument()
  })

  it('비밀번호가 없는 사용자(OAuth)는 바로 설정 화면을 표시해야 함', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '1', name: '테스터', email: 'test@test.com', role: 'user' },
        expires: '',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ hasPassword: false }),
    })

    render(<SettingsContent />)

    await waitFor(() => {
      expect(screen.getByTestId('profile-settings')).toBeInTheDocument()
    })
  })

  it('올바른 비밀번호 입력 시 설정 화면으로 전환되어야 함', async () => {
    const user = userEvent.setup()

    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '1', name: '테스터', email: 'test@test.com', role: 'user' },
        expires: '',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    // hasPassword 확인
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ hasPassword: true }),
    })

    render(<SettingsContent />)

    await waitFor(() => {
      expect(screen.getByText('비밀번호 확인')).toBeInTheDocument()
    })

    // 비밀번호 입력
    const passwordInput = screen.getByLabelText('비밀번호')
    await user.type(passwordInput, 'mypassword')

    // 비밀번호 검증 API 응답
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ verified: true }),
    })

    const verifyButton = screen.getByText('확인')
    await user.click(verifyButton)

    await waitFor(() => {
      expect(screen.getByTestId('profile-settings')).toBeInTheDocument()
    })
  })
})
