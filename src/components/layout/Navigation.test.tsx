import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navigation } from './Navigation'
import { TabProvider, useTab } from '@/components/providers/TabContext'

function TabDisplay() {
  const { activeTab } = useTab()
  return <div data-testid="current-tab">{activeTab}</div>
}

describe('Navigation', () => {
  it('모든 네비게이션 탭이 렌더링되어야 함', () => {
    render(
      <TabProvider>
        <Navigation />
      </TabProvider>
    )

    expect(screen.getByText('소개')).toBeInTheDocument()
    expect(screen.getByText('경력')).toBeInTheDocument()
    expect(screen.getByText('포트폴리오')).toBeInTheDocument()
    expect(screen.getByText('커뮤니티')).toBeInTheDocument()
    expect(screen.getByText('다이어리')).toBeInTheDocument()
    expect(screen.getByText('방명록')).toBeInTheDocument()
  })

  it('탭 클릭 시 activeTab이 변경되어야 함', async () => {
    const user = userEvent.setup()

    render(
      <TabProvider>
        <Navigation />
        <TabDisplay />
      </TabProvider>
    )

    expect(screen.getByTestId('current-tab')).toHaveTextContent('intro')

    await user.click(screen.getByText('경력'))
    expect(screen.getByTestId('current-tab')).toHaveTextContent('career')

    await user.click(screen.getByText('포트폴리오'))
    expect(screen.getByTestId('current-tab')).toHaveTextContent('portfolio')

    await user.click(screen.getByText('방명록'))
    expect(screen.getByTestId('current-tab')).toHaveTextContent('guestbook')
  })

  it('활성 탭에 적절한 스타일이 적용되어야 함', async () => {
    const user = userEvent.setup()

    render(
      <TabProvider>
        <Navigation />
      </TabProvider>
    )

    const introTab = screen.getByText('소개')
    const careerTab = screen.getByText('경력')

    // 초기 상태: 소개 탭이 활성화
    expect(introTab).toHaveClass('text-primary')

    await user.click(careerTab)
    expect(careerTab).toHaveClass('text-primary')
  })
})
