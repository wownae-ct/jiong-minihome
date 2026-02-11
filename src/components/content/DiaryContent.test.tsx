import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { DiaryContent } from './DiaryContent'

const mockUseSession = vi.fn()
vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual('next-auth/react')
  return {
    ...actual,
    useSession: () => mockUseSession(),
  }
})

vi.mock('@/components/providers/ToastProvider', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const safeProps = Object.fromEntries(
        Object.entries(props).filter(([key]) =>
          !['layout', 'initial', 'animate', 'exit', 'transition', 'whileHover'].includes(key)
        )
      )
      return <div {...safeProps}>{children}</div>
    },
    article: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const safeProps = Object.fromEntries(
        Object.entries(props).filter(([key]) =>
          !['layout', 'initial', 'animate', 'exit', 'transition', 'whileHover'].includes(key)
        )
      )
      return <article {...safeProps}>{children}</article>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function createDiaryEntries(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    userId: 1,
    title: `다이어리 ${i + 1}`,
    content: `내용 ${i + 1}`,
    mood: 'happy',
    weather: 'sunny',
    isPublic: true,
    createdAt: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
    updatedAt: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
    user: { nickname: '테스터', profileImage: null },
  }))
}

describe('DiaryContent 클라이언트 페이징', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  it('5개 항목이 있을 때 1페이지에 4개만 표시해야 함', async () => {
    const entries = createDiaryEntries(5)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(entries),
    })

    render(<DiaryContent />)

    await waitFor(() => {
      expect(screen.getByText('다이어리 1')).toBeInTheDocument()
    })

    expect(screen.getByText('다이어리 1')).toBeInTheDocument()
    expect(screen.getByText('다이어리 2')).toBeInTheDocument()
    expect(screen.getByText('다이어리 3')).toBeInTheDocument()
    expect(screen.getByText('다이어리 4')).toBeInTheDocument()
    expect(screen.queryByText('다이어리 5')).not.toBeInTheDocument()
  })

  it('5개 항목이 있을 때 Pagination이 렌더링되어야 함', async () => {
    const entries = createDiaryEntries(5)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(entries),
    })

    render(<DiaryContent />)

    await waitFor(() => {
      expect(screen.getByText('다이어리 1')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('다음 페이지')).toBeInTheDocument()
  })

  it('4개 이하일 때 Pagination이 렌더링되지 않아야 함', async () => {
    const entries = createDiaryEntries(4)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(entries),
    })

    render(<DiaryContent />)

    await waitFor(() => {
      expect(screen.getByText('다이어리 1')).toBeInTheDocument()
    })

    expect(screen.queryByLabelText('다음 페이지')).not.toBeInTheDocument()
  })

  it('2페이지로 이동하면 5번째 항목이 표시되어야 함', async () => {
    const user = userEvent.setup()
    const entries = createDiaryEntries(5)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(entries),
    })

    render(<DiaryContent />)

    await waitFor(() => {
      expect(screen.getByText('다이어리 1')).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText('다음 페이지'))

    expect(screen.getByText('다이어리 5')).toBeInTheDocument()
    expect(screen.queryByText('다이어리 1')).not.toBeInTheDocument()
  })
})

describe('DiaryContent 비공개/수정 기능', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createMixedEntries() {
    return [
      {
        id: 1, userId: 1, title: '공개 글', content: '공개 내용',
        mood: 'happy', weather: 'sunny', isPublic: true,
        createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
        user: { nickname: 'admin', profileImage: null },
      },
      {
        id: 2, userId: 1, title: '비공개 글', content: '비공개 내용',
        mood: 'sad', weather: 'rainy', isPublic: false,
        createdAt: '2025-01-02T00:00:00.000Z', updatedAt: '2025-01-02T00:00:00.000Z',
        user: { nickname: 'admin', profileImage: null },
      },
    ]
  }

  it('비공개 다이어리의 lock 아이콘이 제목 옆에 표시된다', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', role: 'admin', name: 'admin' } },
      status: 'authenticated',
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMixedEntries()),
    })

    render(<DiaryContent />)

    await waitFor(() => {
      expect(screen.getByText('비공개 글')).toBeInTheDocument()
    })

    // lock 아이콘이 제목과 같은 컨테이너에 있어야 함
    const lockIcon = screen.getByTitle('비공개')
    const titleElement = screen.getByText('비공개 글')
    expect(lockIcon.closest('[data-testid="diary-title-row"]')).toBe(
      titleElement.closest('[data-testid="diary-title-row"]')
    )
  })

  it('관리자 액션 버튼이 날짜와 같은 행의 우측 끝에 표시된다', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', role: 'admin', name: 'admin' } },
      status: 'authenticated',
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMixedEntries()),
    })

    render(<DiaryContent />)

    await waitFor(() => {
      expect(screen.getByText('공개 글')).toBeInTheDocument()
    })

    // 관리자 액션 버튼이 data-testid="admin-actions" 컨테이너에 있어야 함
    const adminActions = screen.getAllByTestId('admin-actions')
    expect(adminActions.length).toBe(2) // 공개 글 + 비공개 글

    // 액션 버튼이 줄바꿈 없이 우측 끝에 위치해야 함
    adminActions.forEach((el) => {
      expect(el.className).toMatch(/shrink-0/)
    })
  })

  it('관리자에게 수정 버튼이 표시된다', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', role: 'admin', name: 'admin' } },
      status: 'authenticated',
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMixedEntries()),
    })

    render(<DiaryContent />)

    await waitFor(() => {
      expect(screen.getByText('공개 글')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTitle('수정')
    expect(editButtons.length).toBeGreaterThan(0)
  })

  it('관리자에게 공개/비공개 토글 버튼이 표시된다', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', role: 'admin', name: 'admin' } },
      status: 'authenticated',
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMixedEntries()),
    })

    render(<DiaryContent />)

    await waitFor(() => {
      expect(screen.getByText('공개 글')).toBeInTheDocument()
    })

    // 공개 글에는 '비공개로 전환' 토글, 비공개 글에는 '공개로 전환' 토글
    expect(screen.getByTitle('비공개로 전환')).toBeInTheDocument()
    expect(screen.getByTitle('공개로 전환')).toBeInTheDocument()
  })

  it('비인증 사용자에게는 수정/토글 버튼이 표시되지 않는다', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([createMixedEntries()[0]]), // 공개 글만
    })

    render(<DiaryContent />)

    await waitFor(() => {
      expect(screen.getByText('공개 글')).toBeInTheDocument()
    })

    expect(screen.queryByTitle('수정')).not.toBeInTheDocument()
    expect(screen.queryByTitle('비공개로 전환')).not.toBeInTheDocument()
  })
})
