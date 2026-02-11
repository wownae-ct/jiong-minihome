import { render, screen, waitFor } from '@/test/test-utils'
import { WhatsNew } from './WhatsNew'

vi.mock('./ProjectCard', () => ({
  ProjectCard: () => <div data-testid="project-card">ProjectCard</div>,
}))

vi.mock('./DiaryCard', () => ({
  DiaryCard: () => <div data-testid="diary-card">DiaryCard</div>,
}))

vi.mock('./WelcomeSection', () => ({
  WelcomeSection: () => <div data-testid="welcome-section">WelcomeSection</div>,
}))

vi.mock('./WelcomeDetail', () => ({
  WelcomeDetail: () => <div data-testid="welcome-detail">WelcomeDetail</div>,
}))

// global fetch mock
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('WhatsNew', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('API에서 가져온 최신 업데이트 날짜를 표시해야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ latestUpdate: '2025-12-25T05:30:00.000Z' }),
    })

    render(<WhatsNew />)

    await waitFor(() => {
      expect(screen.getByText(/2025\.12\.25/)).toBeInTheDocument()
    })
  })

  it('API 응답이 null이면 날짜를 표시하지 않아야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ latestUpdate: null }),
    })

    render(<WhatsNew />)

    await waitFor(() => {
      expect(screen.queryByText(/PM|AM/)).not.toBeInTheDocument()
    })
  })

  it('API 호출 실패 시 날짜를 표시하지 않아야 함', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<WhatsNew />)

    await waitFor(() => {
      expect(screen.queryByText(/PM|AM/)).not.toBeInTheDocument()
    })
  })

  it('/api/latest-update 엔드포인트를 호출해야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ latestUpdate: null }),
    })

    render(<WhatsNew />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/latest-update')
    })
  })
})
