import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { MemberProfileModal } from './MemberProfileModal'

const mockUserProfile = {
  id: 1,
  nickname: '테스트유저',
  profileImage: 'https://example.com/avatar.jpg',
  bio: '안녕하세요 자기소개입니다',
  createdAt: '2024-01-15T00:00:00.000Z',
  postCount: 5,
  commentCount: 10,
}

const mockUserPosts = {
  posts: [
    {
      id: 1,
      title: '첫 번째 게시글',
      viewCount: 10,
      likeCount: 3,
      commentCount: 2,
      createdAt: '2024-06-01T00:00:00.000Z',
      category: { id: 1, name: '자유게시판', slug: 'free' },
    },
  ],
  pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
}

const mockUserComments = {
  comments: [
    {
      id: 1,
      content: '댓글 내용입니다',
      createdAt: '2024-06-15T00:00:00.000Z',
      post: { id: 10, title: '관련 게시글', category: { slug: 'free' } },
    },
  ],
  pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
}

function createMockFetch(responses: Record<string, unknown>) {
  return vi.fn((url: string) => {
    for (const [pattern, data] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        })
      }
    }
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Not found' }),
    })
  })
}

describe('MemberProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('isOpen이 false이면 렌더링하지 않아야 함', () => {
    vi.stubGlobal('fetch', createMockFetch({}))
    render(
      <MemberProfileModal isOpen={false} onClose={vi.fn()} userId={null} />
    )
    expect(screen.queryByText('회원 프로필')).not.toBeInTheDocument()
  })

  it('사용자 프로필 정보를 표시해야 함', async () => {
    vi.stubGlobal('fetch', createMockFetch({
      '/api/users/1/posts': mockUserPosts,
      '/api/users/1': mockUserProfile,
    }))

    render(
      <MemberProfileModal isOpen={true} onClose={vi.fn()} userId={1} />
    )

    await waitFor(() => {
      expect(screen.getByText('테스트유저')).toBeInTheDocument()
    })
    expect(screen.getByText('안녕하세요 자기소개입니다')).toBeInTheDocument()
  })

  it('게시글 탭이 기본으로 선택되어야 함', async () => {
    vi.stubGlobal('fetch', createMockFetch({
      '/api/users/1/posts': mockUserPosts,
      '/api/users/1': mockUserProfile,
    }))

    render(
      <MemberProfileModal isOpen={true} onClose={vi.fn()} userId={1} />
    )

    await waitFor(() => {
      expect(screen.getByText('첫 번째 게시글')).toBeInTheDocument()
    })
  })

  it('댓글 탭으로 전환할 수 있어야 함', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', createMockFetch({
      '/api/users/1/posts': mockUserPosts,
      '/api/users/1/comments': mockUserComments,
      '/api/users/1': mockUserProfile,
    }))

    render(
      <MemberProfileModal isOpen={true} onClose={vi.fn()} userId={1} />
    )

    await waitFor(() => {
      expect(screen.getByText('테스트유저')).toBeInTheDocument()
    })

    const commentsTab = screen.getByRole('button', { name: '댓글' })
    await user.click(commentsTab)

    await waitFor(() => {
      expect(screen.getByText('댓글 내용입니다')).toBeInTheDocument()
    })
    expect(screen.getByText('관련 게시글')).toBeInTheDocument()
  })

  it('게시글이 없을 때 안내 메시지를 표시해야 함', async () => {
    vi.stubGlobal('fetch', createMockFetch({
      '/api/users/1/posts': { posts: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } },
      '/api/users/1': { ...mockUserProfile, postCount: 0 },
    }))

    render(
      <MemberProfileModal isOpen={true} onClose={vi.fn()} userId={1} />
    )

    await waitFor(() => {
      expect(screen.getByText('작성한 게시글이 없습니다.')).toBeInTheDocument()
    })
  })

  it('댓글이 없을 때 안내 메시지를 표시해야 함', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', createMockFetch({
      '/api/users/1/posts': mockUserPosts,
      '/api/users/1/comments': { comments: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } },
      '/api/users/1': { ...mockUserProfile, commentCount: 0 },
    }))

    render(
      <MemberProfileModal isOpen={true} onClose={vi.fn()} userId={1} />
    )

    await waitFor(() => {
      expect(screen.getByText('테스트유저')).toBeInTheDocument()
    })

    const commentsTab = screen.getByRole('button', { name: '댓글' })
    await user.click(commentsTab)

    await waitFor(() => {
      expect(screen.getByText('작성한 댓글이 없습니다.')).toBeInTheDocument()
    })
  })

  it('프로필 이미지가 없으면 이니셜을 표시해야 함', async () => {
    vi.stubGlobal('fetch', createMockFetch({
      '/api/users/2/posts': { posts: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } },
      '/api/users/2': { ...mockUserProfile, id: 2, profileImage: null },
    }))

    render(
      <MemberProfileModal isOpen={true} onClose={vi.fn()} userId={2} />
    )

    await waitFor(() => {
      expect(screen.getByText('테')).toBeInTheDocument()
    })
  })

  it('게시글 클릭 시 onPostClick이 호출되어야 함', async () => {
    const user = userEvent.setup()
    const onPostClick = vi.fn()
    vi.stubGlobal('fetch', createMockFetch({
      '/api/users/1/posts': mockUserPosts,
      '/api/users/1': mockUserProfile,
    }))

    render(
      <MemberProfileModal
        isOpen={true}
        onClose={vi.fn()}
        userId={1}
        onPostClick={onPostClick}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('첫 번째 게시글')).toBeInTheDocument()
    })

    await user.click(screen.getByText('첫 번째 게시글'))

    expect(onPostClick).toHaveBeenCalledWith(1, 'free')
  })
})
