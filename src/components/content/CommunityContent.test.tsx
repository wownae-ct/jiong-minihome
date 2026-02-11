import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: '1', role: 'user', nickname: 'test' } },
    status: 'authenticated',
  })),
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

vi.mock('@/components/ui/Icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>,
}))

vi.mock('@/components/providers/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

vi.mock('@/components/providers/TabContext', () => ({
  useTab: () => ({
    communityPostId: null,
    setCommunityPost: vi.fn(),
  }),
}))

vi.mock('@/components/community/PostList', () => ({
  PostList: () => (
    <div data-testid="post-list">
      PostList
    </div>
  ),
}))

vi.mock('@/components/community/PostForm', () => ({
  PostForm: () => <div data-testid="post-form">PostForm</div>,
}))

vi.mock('@/components/community/PostDetail', () => ({
  PostDetail: () => <div data-testid="post-detail">PostDetail</div>,
}))

vi.mock('@/components/community/CommentSection', () => ({
  CommentSection: () => <div data-testid="comment-section">CommentSection</div>,
}))

vi.mock('@/components/community/MemberProfileModal', () => ({
  MemberProfileModal: () => null,
}))

vi.mock('@/components/community/PostSearchBar', () => ({
  PostSearchBar: () => <div data-testid="post-search-bar">PostSearchBar</div>,
}))

import { CommunityContent } from './CommunityContent'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('CommunityContent', () => {
  it('글쓰기 버튼이 카테고리 탭 행에 있어야 함', () => {
    render(<CommunityContent />, { wrapper: createWrapper() })

    const writeButton = screen.getByText('글쓰기')
    expect(writeButton).toBeInTheDocument()

    // 글쓰기 버튼이 카테고리 버튼(전체)과 같은 행에 있어야 함
    const categoryButton = screen.getByText('전체')
    const categoryRow = categoryButton.closest('.flex.items-center.justify-between')
    expect(categoryRow).not.toBeNull()
    expect(categoryRow!.contains(writeButton)).toBe(true)
  })

  it('헤더 영역에 글쓰기 버튼이 없어야 함', () => {
    render(<CommunityContent />, { wrapper: createWrapper() })

    // 헤더에는 커뮤니티 타이틀만 있어야 함
    const header = screen.getByText('커뮤니티').closest('h2')!.parentElement!.parentElement!
    const headerButtons = header.querySelectorAll('button')

    // 헤더의 버튼 중 '글쓰기' 텍스트를 포함하는 것이 없어야 함
    const writeButtonInHeader = Array.from(headerButtons).find(btn => btn.textContent?.includes('글쓰기'))
    expect(writeButtonInHeader).toBeUndefined()
  })

  it('카테고리 버튼들이 올바르게 렌더링되어야 함', () => {
    render(<CommunityContent />, { wrapper: createWrapper() })

    expect(screen.getByText('전체')).toBeInTheDocument()
    expect(screen.getByText('자유게시판')).toBeInTheDocument()
    expect(screen.getByText('질문답변')).toBeInTheDocument()
    expect(screen.getByText('정보공유')).toBeInTheDocument()
  })
})
