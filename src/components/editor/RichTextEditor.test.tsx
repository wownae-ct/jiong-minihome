import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { RichTextEditor } from './RichTextEditor'

describe('RichTextEditor', () => {
  const defaultProps = {
    content: '',
    onChange: vi.fn(),
  }

  it('에디터를 렌더링해야 함', () => {
    render(<RichTextEditor {...defaultProps} />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('초기 콘텐츠를 표시해야 함', () => {
    render(<RichTextEditor {...defaultProps} content="<p>Hello World</p>" />)

    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('label이 있으면 표시해야 함', () => {
    render(<RichTextEditor {...defaultProps} label="내용" />)

    expect(screen.getByText('내용')).toBeInTheDocument()
  })

  it('error 메시지가 있으면 표시해야 함', () => {
    render(<RichTextEditor {...defaultProps} error="내용을 입력해주세요" />)

    expect(screen.getByText('내용을 입력해주세요')).toBeInTheDocument()
  })

  describe('툴바', () => {
    it('툴바가 렌더링되어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      expect(screen.getByRole('button', { name: /굵게/i })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /기울임/i })
      ).toBeInTheDocument()
    })

    it('헤딩 버튼이 있어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /헤딩 1/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /헤딩 2/i })
      ).toBeInTheDocument()
    })

    it('목록 버튼이 있어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /글머리 기호/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /번호 목록/i })
      ).toBeInTheDocument()
    })

    it('코드 블록 버튼이 있어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /코드 블록/i })
      ).toBeInTheDocument()
    })

    it('이미지 버튼이 있어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /이미지/i })
      ).toBeInTheDocument()
    })
  })

  describe('이미지 업로드', () => {
    it('onImageUpload prop이 있으면 이미지 업로드가 가능해야 함', async () => {
      const onImageUpload = vi.fn().mockResolvedValue('/uploads/test.jpg')
      const user = userEvent.setup()

      render(
        <RichTextEditor {...defaultProps} onImageUpload={onImageUpload} />
      )

      const imageButton = screen.getByRole('button', { name: /이미지/i })
      await user.click(imageButton)

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
    })
  })

  describe('읽기 전용 모드', () => {
    it('editable이 false이면 편집할 수 없어야 함', () => {
      render(<RichTextEditor {...defaultProps} editable={false} />)

      const editor = screen.getByRole('textbox')
      expect(editor).toHaveAttribute('contenteditable', 'false')
    })

    it('editable이 false이면 툴바가 숨겨져야 함', () => {
      render(<RichTextEditor {...defaultProps} editable={false} />)

      expect(
        screen.queryByRole('button', { name: /굵게/i })
      ).not.toBeInTheDocument()
    })
  })
})
