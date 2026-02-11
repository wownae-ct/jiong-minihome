import { render, waitFor } from '@/test/test-utils'
import { GuestbookList } from './GuestbookList'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const mockGuestbookResponse = {
  entries: [
    {
      id: 1,
      content: '반갑습니다',
      isPrivate: false,
      guestName: '방문자',
      createdAt: '2025-01-01T00:00:00.000Z',
      userId: null,
      user: null,
    },
  ],
  pagination: { page: 1, limit: 3, total: 1, totalPages: 1 },
}

describe('GuestbookList 페이징', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGuestbookResponse),
    })
  })

  it('limit=3으로 API를 호출해야 함', async () => {
    render(<GuestbookList />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=3')
      )
    })
  })

  it('페이지 1로 시작해야 함', async () => {
    render(<GuestbookList />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1')
      )
    })
  })
})
