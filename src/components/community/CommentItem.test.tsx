import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { CommentItem } from './CommentItem'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn().mockReturnValue({
    data: null,
    status: 'unauthenticated',
    update: vi.fn(),
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

const baseComment = {
  id: 1,
  content: '테스트 댓글입니다',
  depth: 0,
  likeCount: 3,
  createdAt: '2025-01-01T00:00:00Z',
  userId: 10,
  user: {
    id: 10,
    nickname: '테스터',
    profileImage: 'https://example.com/avatar.jpg',
  },
}

const guestComment = {
  id: 2,
  content: '비회원 댓글입니다',
  depth: 0,
  likeCount: 0,
  createdAt: '2025-01-01T00:00:00Z',
  userId: null,
  guestName: '익명',
  user: null,
}

describe('CommentItem', () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })
  })

  it('프로필 이미지와 닉네임을 렌더링해야 함', () => {
    render(<CommentItem comment={baseComment} postId={1} />)

    expect(screen.getByAltText('테스터')).toBeInTheDocument()
    expect(screen.getByText('테스터')).toBeInTheDocument()
  })

  it('onMemberClick이 있으면 프로필 이미지 클릭 시 호출되어야 함', async () => {
    const user = userEvent.setup()
    const onMemberClick = vi.fn()
    render(
      <CommentItem
        comment={baseComment}
        postId={1}
        onMemberClick={onMemberClick}
      />
    )

    const profileImage = screen.getByAltText('테스터')
    await user.click(profileImage)

    expect(onMemberClick).toHaveBeenCalledWith(10)
  })

  it('onMemberClick이 있으면 닉네임 클릭 시 호출되어야 함', async () => {
    const user = userEvent.setup()
    const onMemberClick = vi.fn()
    render(
      <CommentItem
        comment={baseComment}
        postId={1}
        onMemberClick={onMemberClick}
      />
    )

    await user.click(screen.getByText('테스터'))

    expect(onMemberClick).toHaveBeenCalledWith(10)
  })

  it('onMemberClick이 없으면 프로필 이미지와 닉네임이 클릭 불가해야 함', () => {
    render(<CommentItem comment={baseComment} postId={1} />)

    const nickname = screen.getByText('테스터')
    expect(nickname.tagName).toBe('SPAN')
  })

  it('프로필 이미지가 없으면 이니셜 아바타를 표시해야 함', async () => {
    const user = userEvent.setup()
    const commentNoImage = {
      ...baseComment,
      user: { ...baseComment.user, profileImage: null },
    }
    const onMemberClick = vi.fn()
    render(
      <CommentItem
        comment={commentNoImage}
        postId={1}
        onMemberClick={onMemberClick}
      />
    )

    const initialAvatar = screen.getByText('테')
    await user.click(initialAvatar)

    expect(onMemberClick).toHaveBeenCalledWith(10)
  })

  describe('비회원 댓글 삭제', () => {
    it('비밀번호가 틀리면 모달이 즉시 닫혀야 함', async () => {
      const user = userEvent.setup()

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: '비밀번호가 올바르지 않습니다' }),
      })

      render(<CommentItem comment={guestComment} postId={1} />)

      // 삭제 버튼 클릭 → 비밀번호 모달 열림
      const deleteButton = screen.getByText('delete')
      await user.click(deleteButton)

      // 모달이 열려 있는지 확인
      expect(screen.getByText('댓글 삭제')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument()

      // 비밀번호 입력 후 삭제 클릭
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      await user.clear(passwordInput)
      await user.type(passwordInput, 'wrongpassword')
      await user.click(screen.getByText('삭제'))

      // 모달이 닫혀야 함
      await waitFor(() => {
        expect(screen.queryByText('댓글 삭제')).not.toBeInTheDocument()
      })
    })

    it('비밀번호가 맞으면 모달이 닫히고 onDelete가 호출되어야 함', async () => {
      const user = userEvent.setup()

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: '삭제되었습니다' }),
      })
      const onDelete = vi.fn()

      render(<CommentItem comment={guestComment} postId={1} onDelete={onDelete} />)

      // 삭제 버튼 클릭 → 비밀번호 모달 열림
      await user.click(screen.getByText('delete'))

      // 비밀번호 입력 후 삭제 클릭
      const passwordInput = screen.getByPlaceholderText('비밀번호')
      await user.clear(passwordInput)
      await user.type(passwordInput, 'correctpassword')
      await user.click(screen.getByText('삭제'))

      // 모달이 닫히고 onDelete 호출
      await waitFor(() => {
        expect(screen.queryByText('댓글 삭제')).not.toBeInTheDocument()
        expect(onDelete).toHaveBeenCalled()
      })
    })
  })

  describe('관리자/본인 댓글 삭제 확인', () => {
    describe('관리자', () => {
      beforeEach(() => {
        vi.mocked(useSession).mockReturnValue({
          data: {
            user: { id: '99', name: '관리자', email: 'admin@test.com', role: 'admin' },
            expires: '',
          },
          status: 'authenticated',
          update: vi.fn(),
        })
      })

      it('회원 댓글 삭제 시 확인 모달이 표시되어야 함', async () => {
        const user = userEvent.setup()
        render(<CommentItem comment={baseComment} postId={1} />)

        await user.click(screen.getByText('delete'))

        expect(screen.getByText('댓글을 삭제하시겠습니까?')).toBeInTheDocument()
      })

      it('비회원 댓글 삭제 시 확인 모달이 표시되어야 함', async () => {
        const user = userEvent.setup()
        render(<CommentItem comment={guestComment} postId={1} />)

        await user.click(screen.getByText('delete'))

        expect(screen.getByText('댓글을 삭제하시겠습니까?')).toBeInTheDocument()
      })

      it('확인 모달에서 삭제 클릭 시 API가 호출되어야 함', async () => {
        const user = userEvent.setup()

        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        const onDelete = vi.fn()

        render(<CommentItem comment={baseComment} postId={1} onDelete={onDelete} />)

        await user.click(screen.getByText('delete'))
        await user.click(screen.getByText('삭제'))

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith('/api/comments/1', { method: 'DELETE' })
          expect(onDelete).toHaveBeenCalled()
        })
      })

      it('확인 모달에서 취소 클릭 시 삭제되지 않아야 함', async () => {
        const user = userEvent.setup()
        render(<CommentItem comment={baseComment} postId={1} />)

        await user.click(screen.getByText('delete'))
        expect(screen.getByText('댓글을 삭제하시겠습니까?')).toBeInTheDocument()

        await user.click(screen.getByText('취소'))

        expect(screen.queryByText('댓글을 삭제하시겠습니까?')).not.toBeInTheDocument()
      })
    })

    describe('본인', () => {
      beforeEach(() => {
        vi.mocked(useSession).mockReturnValue({
          data: {
            user: { id: '10', name: '테스터', email: 'test@test.com', role: 'user' },
            expires: '',
          },
          status: 'authenticated',
          update: vi.fn(),
        })
      })

      it('본인 댓글 삭제 시 확인 모달이 표시되어야 함', async () => {
        const user = userEvent.setup()
        render(<CommentItem comment={baseComment} postId={1} />)

        await user.click(screen.getByText('delete'))

        expect(screen.getByText('댓글을 삭제하시겠습니까?')).toBeInTheDocument()
      })
    })
  })
})
