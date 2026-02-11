import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { NotificationDropdown } from './NotificationDropdown'

// next-auth/react mock
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 1, name: 'Test' } }, status: 'authenticated' }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// 알림 데이터
const mockNotifications = [
  {
    id: 1,
    type: 'comment',
    message: '테스터님이 댓글을 달았습니다',
    link: '/community/free/10',
    isRead: false,
    createdAt: new Date().toISOString(),
    actor: { id: 2, nickname: '테스터', profileImage: null },
  },
  {
    id: 2,
    type: 'announcement',
    message: '새 공지사항이 등록되었습니다',
    link: '/#intro',
    isRead: true,
    createdAt: new Date().toISOString(),
    actor: { id: 1, nickname: '관리자', profileImage: null },
  },
  {
    id: 3,
    type: 'like',
    message: '좋아요를 눌렀습니다',
    link: null,
    isRead: true,
    createdAt: new Date().toISOString(),
    actor: { id: 3, nickname: '유저3', profileImage: null },
  },
]

// react-query mock
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: () => ({
      data: { notifications: mockNotifications, unreadCount: 1 },
      isLoading: false,
      error: null,
    }),
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  }
})

// fetch mock
const fetchMock = vi.fn().mockResolvedValue({ ok: true })
vi.stubGlobal('fetch', fetchMock)

describe('NotificationDropdown', () => {
  let pushStateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    window.location.hash = ''
    window.history.replaceState(null, '', '/')
    pushStateSpy = vi.spyOn(window.history, 'pushState')
    fetchMock.mockClear()
  })

  afterEach(() => {
    pushStateSpy.mockRestore()
  })

  async function openDropdown() {
    const user = userEvent.setup()
    const bellButton = screen.getByRole('button')
    await user.click(bellButton)
    return user
  }

  it('커뮤니티 알림 클릭 시 SPA 네비게이션으로 처리해야 함', async () => {
    render(<NotificationDropdown />)
    const user = await openDropdown()

    const communityNotification = screen.getByText('테스터님이 댓글을 달았습니다')
    await user.click(communityNotification)

    // 경로 기반 URL로 pushState 호출 확인
    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/community/free/10')
  })

  it('해시 기반 알림(/#intro) 클릭 시 탭 전환해야 함', async () => {
    render(<NotificationDropdown />)
    const user = await openDropdown()

    const announcementNotification = screen.getByText('새 공지사항이 등록되었습니다')
    await user.click(announcementNotification)

    // 절대 URL /로 pushState 호출 확인 (intro 탭)
    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/')
  })

  it('읽지 않은 알림 클릭 시 읽음 처리 API를 호출해야 함', async () => {
    render(<NotificationDropdown />)
    const user = await openDropdown()

    const unreadNotification = screen.getByText('테스터님이 댓글을 달았습니다')
    await user.click(unreadNotification)

    expect(fetchMock).toHaveBeenCalledWith('/api/notifications', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ notificationId: 1 }),
    }))
  })

  it('알림 클릭 후 드롭다운이 닫혀야 함', async () => {
    render(<NotificationDropdown />)
    const user = await openDropdown()

    // 드롭다운이 열려 있음을 확인
    expect(screen.getByText('알림')).toBeInTheDocument()

    const notification = screen.getByText('테스터님이 댓글을 달았습니다')
    await user.click(notification)

    // 드롭다운이 닫힘
    expect(screen.queryByText('알림')).not.toBeInTheDocument()
  })

  it('link가 null인 알림도 에러 없이 처리해야 함', async () => {
    render(<NotificationDropdown />)
    const user = await openDropdown()

    const nullLinkNotification = screen.getByText('좋아요를 눌렀습니다')
    await user.click(nullLinkNotification)

    // 에러 없이 드롭다운만 닫힘
    expect(screen.queryByText('알림')).not.toBeInTheDocument()
  })
})
