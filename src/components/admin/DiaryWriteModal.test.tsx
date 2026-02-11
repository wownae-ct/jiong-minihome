import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children, title }: { isOpen: boolean; children: React.ReactNode; title: string }) =>
    isOpen ? <div data-testid="modal"><h2>{title}</h2>{children}</div> : null,
}))

vi.mock('@/components/ui/Icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}))

import { DiaryWriteModal } from './DiaryWriteModal'
import { DiaryEntry } from '@/hooks/useDiaries'

const mockOnClose = vi.fn()
const mockOnSuccess = vi.fn()
const mockFetch = vi.fn()

const sampleEntry: DiaryEntry = {
  id: 1,
  userId: 1,
  title: '기존 제목',
  content: '기존 내용',
  mood: 'happy',
  weather: 'sunny',
  isPublic: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  user: { nickname: 'admin', profileImage: null },
}

describe('DiaryWriteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  describe('작성 모드', () => {
    it('editEntry가 없으면 "다이어리 쓰기" 타이틀을 표시한다', () => {
      render(
        <DiaryWriteModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      )

      expect(screen.getByText('다이어리 쓰기')).toBeInTheDocument()
    })

    it('작성 모드에서 폼 필드가 비어있다', () => {
      render(
        <DiaryWriteModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      )

      const titleInput = screen.getByPlaceholderText('오늘의 제목을 입력하세요')
      const contentInput = screen.getByPlaceholderText('오늘 하루를 기록해보세요...')

      expect(titleInput).toHaveValue('')
      expect(contentInput).toHaveValue('')
    })

    it('작성 모드에서 POST 요청을 보낸다', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(sampleEntry),
      })

      render(
        <DiaryWriteModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      )

      await user.type(screen.getByPlaceholderText('오늘 하루를 기록해보세요...'), '새 내용')
      await user.click(screen.getByText('저장'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/diary', expect.objectContaining({
          method: 'POST',
        }))
      })
    })
  })

  describe('편집 모드', () => {
    it('editEntry가 있으면 "다이어리 수정" 타이틀을 표시한다', () => {
      render(
        <DiaryWriteModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          editEntry={sampleEntry}
        />
      )

      expect(screen.getByText('다이어리 수정')).toBeInTheDocument()
    })

    it('편집 모드에서 기존 데이터가 폼에 pre-fill된다', () => {
      render(
        <DiaryWriteModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          editEntry={sampleEntry}
        />
      )

      const titleInput = screen.getByPlaceholderText('오늘의 제목을 입력하세요')
      const contentInput = screen.getByPlaceholderText('오늘 하루를 기록해보세요...')

      expect(titleInput).toHaveValue('기존 제목')
      expect(contentInput).toHaveValue('기존 내용')
    })

    it('편집 모드에서 PUT 요청을 보낸다', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...sampleEntry, title: '수정됨' }),
      })

      render(
        <DiaryWriteModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          editEntry={sampleEntry}
        />
      )

      const titleInput = screen.getByPlaceholderText('오늘의 제목을 입력하세요')
      await user.clear(titleInput)
      await user.type(titleInput, '수정됨')
      await user.click(screen.getByText('저장'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`/api/diary/${sampleEntry.id}`, expect.objectContaining({
          method: 'PUT',
        }))
      })
    })
  })
})
