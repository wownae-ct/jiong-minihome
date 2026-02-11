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

vi.mock('@/components/providers/TabContext', () => ({
  useTab: () => ({
    goBack: vi.fn(),
    setActiveTab: vi.fn(),
    setWelcomeDetail: vi.fn(),
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
})
