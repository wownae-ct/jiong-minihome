import { render, screen } from '@testing-library/react'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children as React.ReactNode}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const setWelcomeDetailMock = vi.fn()
const setActiveTabMock = vi.fn()
vi.mock('@/components/providers/tab', () => ({
  useNavigation: () => ({
    activeTab: 'intro',
    setActiveTab: setActiveTabMock,
  }),
  useWelcomeView: () => ({
    welcomeDetailOpen: true,
    setWelcomeDetail: setWelcomeDetailMock,
  }),
}))

vi.mock('@/components/admin/WelcomeEditModal', () => ({
  WelcomeEditModal: () => null,
}))

const mockWelcomeSettings = vi.fn()
vi.mock('@/hooks/useWelcomeSettings', () => ({
  useWelcomeSettings: () => mockWelcomeSettings(),
  useUpdateWelcomeSettings: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/components/ui/Icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}))

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: Record<string, unknown>) => (
    <button {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children as React.ReactNode}</button>
  ),
}))

import { WelcomeDetail } from './WelcomeDetail'

describe('WelcomeDetail', () => {
  beforeEach(() => {
    setWelcomeDetailMock.mockClear()
    setActiveTabMock.mockClear()
  })

  it('소개글에 줄바꿈이 있으면 줄바꿈이 렌더링되어야 함', () => {
    mockWelcomeSettings.mockReturnValue({
      data: {
        title: '테스트 제목',
        subtitle: '부제목',
        description: '첫째 줄\n둘째 줄\n셋째 줄',
        skills: [],
        values: [],
      },
      isLoading: false,
    })

    render(<WelcomeDetail />)

    const descriptionEl = screen.getByText(/첫째 줄/)
    expect(descriptionEl).toBeInTheDocument()
    // whitespace-pre-line이 적용되어야 \n이 줄바꿈으로 렌더링됨
    expect(descriptionEl.className).toContain('whitespace-pre-line')
  })

  // R3: 뒤로가기 버튼은 window.history.back()이 아닌 명시적 setWelcomeDetail(false)를 호출해야 함
  it('뒤로가기 버튼 클릭 시 setWelcomeDetail(false)가 호출되어야 함 (명시적 상태 전환)', () => {
    mockWelcomeSettings.mockReturnValue({
      data: {
        title: '제목',
        description: '설명',
        skills: [],
        values: [],
      },
      isLoading: false,
    })

    render(<WelcomeDetail />)

    const backButton = screen.getByTestId('icon-arrow_back').closest('button')
    expect(backButton).not.toBeNull()
    backButton!.click()

    expect(setWelcomeDetailMock).toHaveBeenCalledWith(false)
  })
})
