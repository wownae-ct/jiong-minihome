import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { PortfolioContent } from './PortfolioContent'

vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual('next-auth/react')
  return {
    ...actual,
    useSession: () => ({ data: null, status: 'unauthenticated' }),
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

function createPortfolios(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    userId: 1,
    title: `프로젝트 ${i + 1}`,
    content: `내용 ${i + 1}`,
    description: `설명 ${i + 1}`,
    image: null,
    githubUrl: null,
    notionUrl: null,
    featured: false,
    isDeleted: false,
    sortOrder: i,
    isDraft: false,
    draftData: null,
    draftAt: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    tags: [],
    user: { id: 1, nickname: '테스터' },
  }))
}

describe('PortfolioContent 클라이언트 페이징', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('5개 항목이 있을 때 1페이지에 4개만 표시해야 함', async () => {
    const portfolios = createPortfolios(5)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: portfolios }),
    })

    render(<PortfolioContent />, { initialTab: 'portfolio' as const })

    await waitFor(() => {
      expect(screen.getByText('프로젝트 1')).toBeInTheDocument()
    })

    expect(screen.getByText('프로젝트 1')).toBeInTheDocument()
    expect(screen.getByText('프로젝트 2')).toBeInTheDocument()
    expect(screen.getByText('프로젝트 3')).toBeInTheDocument()
    expect(screen.getByText('프로젝트 4')).toBeInTheDocument()
    expect(screen.queryByText('프로젝트 5')).not.toBeInTheDocument()
  })

  it('5개 항목이 있을 때 Pagination이 렌더링되어야 함', async () => {
    const portfolios = createPortfolios(5)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: portfolios }),
    })

    render(<PortfolioContent />, { initialTab: 'portfolio' as const })

    await waitFor(() => {
      expect(screen.getByText('프로젝트 1')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('다음 페이지')).toBeInTheDocument()
  })

  it('4개 이하일 때 Pagination이 렌더링되지 않아야 함', async () => {
    const portfolios = createPortfolios(4)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: portfolios }),
    })

    render(<PortfolioContent />, { initialTab: 'portfolio' as const })

    await waitFor(() => {
      expect(screen.getByText('프로젝트 1')).toBeInTheDocument()
    })

    expect(screen.queryByLabelText('다음 페이지')).not.toBeInTheDocument()
  })

  it('2페이지로 이동하면 5번째 항목이 표시되어야 함', async () => {
    const user = userEvent.setup()
    const portfolios = createPortfolios(5)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: portfolios }),
    })

    render(<PortfolioContent />, { initialTab: 'portfolio' as const })

    await waitFor(() => {
      expect(screen.getByText('프로젝트 1')).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText('다음 페이지'))

    expect(screen.getByText('프로젝트 5')).toBeInTheDocument()
    expect(screen.queryByText('프로젝트 1')).not.toBeInTheDocument()
  })
})
