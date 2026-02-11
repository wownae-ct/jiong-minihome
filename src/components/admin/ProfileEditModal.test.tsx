import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { ProfileEditModal } from './ProfileEditModal'

// Mock fetch
global.fetch = vi.fn()

describe('ProfileEditModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
    initialData: {
      name: '지옹',
      title: 'Infrastructure Engineer',
      quote: '테스트 인용문',
      email: 'test@example.com',
      github: 'https://github.com/test',
      linkedin: '',
      website: '',
      imageUrl: 'https://example.com/image.jpg',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('모달이 열리면 폼이 표시되어야 함', () => {
    render(<ProfileEditModal {...defaultProps} />)

    expect(screen.getByText('프로필 수정')).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toBeInTheDocument()
    expect(screen.getByLabelText('직함')).toBeInTheDocument()
    expect(screen.getByLabelText('인용문')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('GitHub URL')).toBeInTheDocument()
    expect(screen.getByLabelText('LinkedIn URL')).toBeInTheDocument()
    expect(screen.getByLabelText('웹사이트 URL')).toBeInTheDocument()
    expect(screen.getByText('프로필 이미지')).toBeInTheDocument()
    expect(screen.getByText('이미지 선택')).toBeInTheDocument()
  })

  it('초기 데이터가 폼에 채워져야 함', () => {
    render(<ProfileEditModal {...defaultProps} />)

    expect(screen.getByLabelText('이름')).toHaveValue('지옹')
    expect(screen.getByLabelText('직함')).toHaveValue('Infrastructure Engineer')
    expect(screen.getByLabelText('인용문')).toHaveValue('테스트 인용문')
    expect(screen.getByLabelText('이메일')).toHaveValue('test@example.com')
    expect(screen.getByLabelText('GitHub URL')).toHaveValue('https://github.com/test')
  })

  it('닫기 버튼 클릭 시 onClose가 호출되어야 함', async () => {
    const user = userEvent.setup()
    render(<ProfileEditModal {...defaultProps} />)

    const cancelButton = screen.getByText('취소')
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('저장 버튼 클릭 시 API가 호출되어야 함', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    render(<ProfileEditModal {...defaultProps} />)

    const saveButton = screen.getByText('저장')
    await user.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })
    })
  })

  it('API 성공 시 onSuccess가 호출되어야 함', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    render(<ProfileEditModal {...defaultProps} />)

    const saveButton = screen.getByText('저장')
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('API 실패 시 에러 메시지가 표시되어야 함', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '업데이트 실패' }),
    } as Response)

    render(<ProfileEditModal {...defaultProps} />)

    const saveButton = screen.getByText('저장')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('업데이트 실패')).toBeInTheDocument()
    })
  })

  // 참고: react-hook-form + zod resolver 유효성 검사는 브라우저 환경에서 별도 테스트
})
