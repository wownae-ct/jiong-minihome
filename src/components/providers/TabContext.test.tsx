import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabProvider, useTab } from './TabContext'

function TestConsumer() {
  const { activeTab, setActiveTab, communityPostId, setCommunityPost, communityCategory } = useTab()
  return (
    <div>
      <span data-testid="active-tab">{activeTab}</span>
      <span data-testid="community-post-id">{communityPostId ?? 'null'}</span>
      <span data-testid="community-category">{communityCategory ?? 'null'}</span>
      <button onClick={() => setActiveTab('career')}>Go to Career</button>
      <button onClick={() => setActiveTab('portfolio')}>Go to Portfolio</button>
      <button onClick={() => setActiveTab('intro')}>Go to Intro</button>
      <button onClick={() => setCommunityPost(42, 'free')}>View Post 42 with Category</button>
      <button onClick={() => setCommunityPost(42)}>View Post 42</button>
      <button onClick={() => setCommunityPost(null)}>Back to List</button>
    </div>
  )
}

describe('TabContext', () => {
  let pushStateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    window.location.hash = ''
    window.history.replaceState(null, '', '/')
    pushStateSpy = vi.spyOn(window.history, 'pushState')
  })

  afterEach(() => {
    pushStateSpy.mockRestore()
  })

  it('기본 활성 탭은 intro이어야 함', () => {
    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    expect(screen.getByTestId('active-tab')).toHaveTextContent('intro')
  })

  it('setActiveTab으로 탭을 변경할 수 있어야 함', async () => {
    const user = userEvent.setup()

    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    await user.click(screen.getByText('Go to Career'))
    expect(screen.getByTestId('active-tab')).toHaveTextContent('career')

    await user.click(screen.getByText('Go to Portfolio'))
    expect(screen.getByTestId('active-tab')).toHaveTextContent('portfolio')
  })

  it('초기 탭을 지정할 수 있어야 함', () => {
    render(
      <TabProvider initialTab="guestbook">
        <TestConsumer />
      </TabProvider>
    )

    expect(screen.getByTestId('active-tab')).toHaveTextContent('guestbook')
  })

  it('setCommunityPost로 커뮤니티 게시글 상세보기 상태를 설정할 수 있어야 함', async () => {
    const user = userEvent.setup()

    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    // 초기 상태: communityPostId는 null
    expect(screen.getByTestId('community-post-id')).toHaveTextContent('null')

    // 게시글 상세보기 (하위 호환 - categorySlug 없음)
    await user.click(screen.getByText('View Post 42'))
    expect(screen.getByTestId('active-tab')).toHaveTextContent('community')
    expect(screen.getByTestId('community-post-id')).toHaveTextContent('42')

    // 목록으로 돌아가기
    await user.click(screen.getByText('Back to List'))
    expect(screen.getByTestId('community-post-id')).toHaveTextContent('null')
  })

  it('탭을 변경하면 communityPostId가 초기화되어야 함', async () => {
    const user = userEvent.setup()

    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    // 게시글 상세보기 설정
    await user.click(screen.getByText('View Post 42'))
    expect(screen.getByTestId('community-post-id')).toHaveTextContent('42')

    // 다른 탭으로 이동하면 communityPostId 초기화
    await user.click(screen.getByText('Go to Career'))
    expect(screen.getByTestId('active-tab')).toHaveTextContent('career')
    expect(screen.getByTestId('community-post-id')).toHaveTextContent('null')
  })

  // --- 새 테스트 케이스: 경로 기반 URL ---

  it('setCommunityPost(42, "free")는 경로 기반 URL /community/free/42로 pushState해야 함', async () => {
    const user = userEvent.setup()

    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    await user.click(screen.getByText('View Post 42 with Category'))

    expect(screen.getByTestId('active-tab')).toHaveTextContent('community')
    expect(screen.getByTestId('community-post-id')).toHaveTextContent('42')
    expect(screen.getByTestId('community-category')).toHaveTextContent('free')
    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/community/free/42')
  })

  it('setCommunityPost(42) categorySlug 없이 호출 시 해시 기반 URL로 폴백해야 함', async () => {
    const user = userEvent.setup()

    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    await user.click(screen.getByText('View Post 42'))

    expect(screen.getByTestId('community-post-id')).toHaveTextContent('42')
    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/#community-42')
  })

  it('setCommunityPost(null)은 절대 URL /#community로 pushState해야 함', async () => {
    const user = userEvent.setup()

    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    await user.click(screen.getByText('View Post 42'))
    pushStateSpy.mockClear()

    await user.click(screen.getByText('Back to List'))

    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/#community')
  })

  it('setActiveTab("career")는 절대 URL /#career로 pushState해야 함', async () => {
    const user = userEvent.setup()

    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    await user.click(screen.getByText('Go to Career'))

    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/#career')
  })

  it('setActiveTab("intro")는 절대 URL /로 pushState해야 함', async () => {
    const user = userEvent.setup()

    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    await user.click(screen.getByText('Go to Intro'))

    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/')
  })

  it('popstate 이벤트 시 경로 기반 URL에서 상태를 올바르게 업데이트해야 함', async () => {
    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    // popstate로 경로 기반 URL 시뮬레이션
    act(() => {
      window.history.replaceState(null, '', '/community/qna/99')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(screen.getByTestId('active-tab')).toHaveTextContent('community')
    expect(screen.getByTestId('community-post-id')).toHaveTextContent('99')
  })

  it('popstate 이벤트 시 해시 기반 URL에서도 상태를 올바르게 업데이트해야 함', async () => {
    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    act(() => {
      window.history.replaceState(null, '', '/#portfolio')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(screen.getByTestId('active-tab')).toHaveTextContent('portfolio')
  })

  it('하위 호환: 해시 #community-42가 초기 로드 시 올바르게 파싱되어야 함', () => {
    window.location.hash = '#community-42'

    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    expect(screen.getByTestId('active-tab')).toHaveTextContent('community')
    expect(screen.getByTestId('community-post-id')).toHaveTextContent('42')
  })

  it('탭 변경 시 communityCategory도 초기화되어야 함', async () => {
    const user = userEvent.setup()

    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    // 카테고리와 함께 게시글 상세보기
    await user.click(screen.getByText('View Post 42 with Category'))
    expect(screen.getByTestId('community-category')).toHaveTextContent('free')

    // 다른 탭으로 이동하면 category도 초기화
    await user.click(screen.getByText('Go to Career'))
    expect(screen.getByTestId('community-category')).toHaveTextContent('null')
  })
})
