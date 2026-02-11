import { render, screen, waitFor } from '@/test/test-utils'
import { PostList } from './PostList'

vi.mock('@/components/common/LikeButton', () => ({
  LikeButton: () => <span>LikeButton</span>,
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const mockPostsResponse = {
  posts: [
    {
      id: 1,
      title: '테스트 글 1',
      content: '내용 1',
      viewCount: 10,
      likeCount: 2,
      commentCount: 1,
      isPinned: false,
      createdAt: '2025-01-01T00:00:00.000Z',
      guestName: null,
      user: { id: 1, nickname: '테스터', profileImage: null },
      category: { id: 1, name: '자유', slug: 'free' },
    },
  ],
  pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
}

describe('PostList 페이징', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPostsResponse),
    })
  })

  it('limit=5로 API를 호출해야 함', async () => {
    render(<PostList />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=5')
      )
    })
  })

  it('페이지 1로 시작해야 함', async () => {
    render(<PostList />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1')
      )
    })
  })
})

