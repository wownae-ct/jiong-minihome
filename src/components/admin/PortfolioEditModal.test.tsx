import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PortfolioEditModal } from './PortfolioEditModal'

// Mock fetch
global.fetch = vi.fn()

describe('PortfolioEditModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
    initialData: [
      {
        id: 1,
        title: 'Test Project',
        description: '테스트 프로젝트 설명',
        image: 'https://example.com/image.jpg',
        tags: ['React', 'TypeScript'],
        githubUrl: 'https://github.com/test',
        demoUrl: 'https://demo.test.com',
        featured: true,
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('모달이 열리면 폼이 표시되어야 함', () => {
    render(<PortfolioEditModal {...defaultProps} />)

    expect(screen.getByText('포트폴리오 수정')).toBeInTheDocument()
    expect(screen.getByText('프로젝트 #1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('프로젝트 제목')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('프로젝트에 대한 설명을 입력해주세요')).toBeInTheDocument()
  })

  it('초기 데이터가 폼에 채워져야 함', () => {
    render(<PortfolioEditModal {...defaultProps} />)

    expect(screen.getByPlaceholderText('프로젝트 제목')).toHaveValue('Test Project')
    expect(screen.getByPlaceholderText('프로젝트에 대한 설명을 입력해주세요')).toHaveValue('테스트 프로젝트 설명')
    expect(screen.getByPlaceholderText('AWS, Kubernetes, Docker')).toHaveValue('React, TypeScript')
  })

  it('취소 버튼 클릭 시 onClose가 호출되어야 함', async () => {
    render(<PortfolioEditModal {...defaultProps} />)

    const cancelButton = screen.getByText('취소')
    await userEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('새 프로젝트 추가 버튼이 작동해야 함', async () => {
    render(<PortfolioEditModal {...defaultProps} />)

    const addButton = screen.getByText('새 프로젝트 추가')
    await userEvent.click(addButton)

    expect(screen.getByText('프로젝트 #2')).toBeInTheDocument()
  })

  it('저장 버튼 클릭 시 API가 호출되어야 함', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    render(<PortfolioEditModal {...defaultProps} />)

    const saveButton = screen.getByText('저장')
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })
    })
  })

  it('API 성공 시 onSuccess가 호출되어야 함', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    render(<PortfolioEditModal {...defaultProps} />)

    const saveButton = screen.getByText('저장')
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('API 실패 시 에러 메시지가 표시되어야 함', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '업데이트에 실패했습니다.' }),
    } as Response)

    render(<PortfolioEditModal {...defaultProps} />)

    const saveButton = screen.getByText('저장')
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('업데이트에 실패했습니다.')).toBeInTheDocument()
    })
  })

  it('이미지 프리뷰가 초기 데이터로 표시되어야 함', () => {
    render(<PortfolioEditModal {...defaultProps} />)

    const previewImage = screen.getByAlt('프로젝트 이미지 프리뷰')
    expect(previewImage).toBeInTheDocument()
    expect(previewImage).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('이미지 선택 버튼이 표시되어야 함', () => {
    render(<PortfolioEditModal {...defaultProps} />)

    expect(screen.getByText('이미지 선택')).toBeInTheDocument()
  })

  it('초기 이미지가 있을 때 삭제 버튼이 표시되어야 함', () => {
    render(<PortfolioEditModal {...defaultProps} />)

    expect(screen.getByText('삭제')).toBeInTheDocument()
  })

  it('이미지 삭제 버튼 클릭 시 프리뷰가 사라져야 함', async () => {
    render(<PortfolioEditModal {...defaultProps} />)

    const deleteButton = screen.getByText('삭제')
    await userEvent.click(deleteButton)

    expect(screen.queryByAlt('프로젝트 이미지 프리뷰')).not.toBeInTheDocument()
  })

  it('이미지 업로드 성공 시 프리뷰가 업데이트되어야 함', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://example.com/new-image.jpg' }),
    } as Response)

    const propsWithoutImage = {
      ...defaultProps,
      initialData: [
        {
          ...defaultProps.initialData[0],
          image: null,
        },
      ],
    }

    render(<PortfolioEditModal {...propsWithoutImage} />)

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    await userEvent.upload(fileInput, file)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        body: expect.any(FormData),
      })
    })
  })

  it('지원하지 않는 파일 형식 업로드 시 에러가 표시되어야 함', async () => {
    const propsWithoutImage = {
      ...defaultProps,
      initialData: [
        {
          ...defaultProps.initialData[0],
          image: null,
        },
      ],
    }

    render(<PortfolioEditModal {...propsWithoutImage} />)

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    await userEvent.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('이미지 파일만 업로드할 수 있습니다. (jpg, jpeg, png, gif, webp)')).toBeInTheDocument()
    })
  })

  it('빈 포트폴리오로 시작할 수 있어야 함', () => {
    const propsWithEmptyData = {
      ...defaultProps,
      initialData: [],
    }

    render(<PortfolioEditModal {...propsWithEmptyData} />)

    expect(screen.getByText('등록된 포트폴리오가 없습니다.')).toBeInTheDocument()
  })
})
