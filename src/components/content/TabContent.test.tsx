import { render, screen, act } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { TabContent } from './TabContent'
import { useTab } from '@/components/providers/TabContext'

// framer-motion: AnimatePresence/motion을 패스스루로 처리하여 exit 애니메이션 잠김을 회피하고
// 실제 DOM 전환만 검증한다.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children as React.ReactNode}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// 무거운 의존성 모킹
vi.mock('./CareerContent', () => ({
  CareerContent: () => <div data-testid="career-content">경력 / Career</div>,
}))
vi.mock('./PortfolioContent', () => ({
  PortfolioContent: () => <div data-testid="portfolio-content">포트폴리오 / Portfolio</div>,
}))
vi.mock('./CommunityContent', () => ({
  CommunityContent: () => <div data-testid="community-content">커뮤니티 / Community</div>,
}))
vi.mock('./DiaryContent', () => ({
  DiaryContent: () => <div data-testid="diary-content">다이어리 / Diary</div>,
}))
vi.mock('./GuestbookContent', () => ({
  GuestbookContent: () => <div data-testid="guestbook-content">방명록 / Guestbook</div>,
}))
vi.mock('./WhatsNew', () => ({
  WhatsNew: () => <div data-testid="whats-new">What&apos;s New</div>,
}))
vi.mock('./WelcomeDetail', () => ({
  WelcomeDetail: () => <div data-testid="welcome-detail">Welcome Detail</div>,
}))

// TabContent에서 사용하는 Tab context 외 나머지 의존성 모킹
vi.mock('@/components/admin/AdminDashboard', () => ({
  AdminDashboard: () => <div>Admin</div>,
}))
vi.mock('@/components/settings/SettingsContent', () => ({
  SettingsContent: () => <div>Settings</div>,
}))
vi.mock('@/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: () => {},
}))

describe('TabContent', () => {
  it("intro 탭일 때 WhatsNew 콘텐츠가 렌더링되어야 함", () => {
    render(<TabContent />, { initialTab: 'intro' })

    expect(screen.getByTestId('whats-new')).toBeInTheDocument()
    expect(screen.queryByTestId('welcome-detail')).not.toBeInTheDocument()
  })

  it('career 탭일 때 경력 콘텐츠가 렌더링되어야 함', () => {
    render(<TabContent />, { initialTab: 'career' })
    expect(screen.getByTestId('career-content')).toBeInTheDocument()
  })

  it('portfolio 탭일 때 포트폴리오 콘텐츠가 렌더링되어야 함', () => {
    render(<TabContent />, { initialTab: 'portfolio' })
    expect(screen.getByTestId('portfolio-content')).toBeInTheDocument()
  })

  it('guestbook 탭일 때 방명록 콘텐츠가 렌더링되어야 함', () => {
    render(<TabContent />, { initialTab: 'guestbook' })
    expect(screen.getByTestId('guestbook-content')).toBeInTheDocument()
  })

  // Task 1 회귀 방지 테스트: 중첩 AnimatePresence 버그 근본 수정 검증
  describe('Welcome detail → 탭 전환 안정성', () => {
    // welcome detail open/close를 테스트에서 제어할 수 있는 헬퍼 컴포넌트
    function TabContentWithControls() {
      const { setWelcomeDetail, setActiveTab } = useTab()
      return (
        <>
          <TabContent />
          <button onClick={() => setWelcomeDetail(true)}>Open Welcome Detail</button>
          <button onClick={() => setActiveTab('career')}>Go Career</button>
          <button onClick={() => setActiveTab('portfolio')}>Go Portfolio</button>
          <button onClick={() => setActiveTab('community')}>Go Community</button>
        </>
      )
    }

    it('welcomeDetailOpen이 true이면 TabContent는 WelcomeDetail을 렌더링해야 함 (WhatsNew 아님)', () => {
      render(<TabContentWithControls />, { initialTab: 'intro' })

      // 초기: WhatsNew
      expect(screen.getByTestId('whats-new')).toBeInTheDocument()

      // Welcome Detail 열기
      act(() => {
        screen.getByText('Open Welcome Detail').click()
      })

      // WelcomeDetail만 렌더, WhatsNew는 사라짐
      expect(screen.getByTestId('welcome-detail')).toBeInTheDocument()
      expect(screen.queryByTestId('whats-new')).not.toBeInTheDocument()
    })

    it('Welcome Detail → 경력 → 포트폴리오 → 커뮤니티 순차 전환이 모두 렌더링되어야 함 (회귀 방지)', async () => {
      const user = userEvent.setup()
      render(<TabContentWithControls />, { initialTab: 'intro' })

      // 1. Welcome Detail 열기
      await user.click(screen.getByText('Open Welcome Detail'))
      expect(screen.getByTestId('welcome-detail')).toBeInTheDocument()

      // 2. 경력 탭으로 전환 (이전 버그: 여기서 DOM 잠김)
      await user.click(screen.getByText('Go Career'))
      expect(screen.getByTestId('career-content')).toBeInTheDocument()
      expect(screen.queryByTestId('welcome-detail')).not.toBeInTheDocument()

      // 3. 포트폴리오 탭으로 전환 (이전 버그: 여기서 아무것도 안 뜸)
      await user.click(screen.getByText('Go Portfolio'))
      expect(screen.getByTestId('portfolio-content')).toBeInTheDocument()
      expect(screen.queryByTestId('career-content')).not.toBeInTheDocument()

      // 4. 커뮤니티 탭으로 전환
      await user.click(screen.getByText('Go Community'))
      expect(screen.getByTestId('community-content')).toBeInTheDocument()
      expect(screen.queryByTestId('portfolio-content')).not.toBeInTheDocument()
    })
  })
})
