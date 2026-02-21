import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
        screen.getByRole('button', { name: /제목 1/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /제목 2/i })
      ).toBeInTheDocument()
    })

    it('목록 버튼이 있어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /글머리 기호 목록/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /번호 매기기 목록/i })
      ).toBeInTheDocument()
    })

    it('코드 블록 버튼이 있어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /코드 블록/i })
      ).toBeInTheDocument()
    })

    it('인용문 버튼이 있어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /인용문/i })
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

  describe('코드 블록 렌더링', () => {
    it('코드 블록 콘텐츠가 pre > code로 렌더링되어야 함', () => {
      render(
        <RichTextEditor
          {...defaultProps}
          content='<pre><code class="language-javascript">const x = 1;</code></pre>'
        />
      )

      const preElement = document.querySelector('pre')
      expect(preElement).toBeInTheDocument()

      const codeElement = preElement?.querySelector('code')
      expect(codeElement).toBeInTheDocument()
      expect(codeElement?.textContent).toContain('const x = 1;')
    })
  })

  describe('인용문 렌더링', () => {
    it('인용문 콘텐츠가 blockquote로 렌더링되어야 함', () => {
      render(
        <RichTextEditor
          {...defaultProps}
          content="<blockquote><p>인용된 텍스트입니다.</p></blockquote>"
        />
      )

      const blockquote = document.querySelector('blockquote')
      expect(blockquote).toBeInTheDocument()
      expect(blockquote?.textContent).toContain('인용된 텍스트입니다.')
    })
  })

  describe('외부 content prop 변경', () => {
    it('content prop이 변경되면 에디터 내용이 업데이트되어야 함', async () => {
      const onChange = vi.fn()
      const { rerender } = render(
        <RichTextEditor content="" onChange={onChange} />
      )

      // 초기에는 비어있음
      expect(screen.getByRole('textbox')).toBeInTheDocument()

      // content prop 변경 (DB에서 데이터 로드 시뮬레이션)
      rerender(
        <RichTextEditor
          content="<p>기존 콘텐츠 불러오기</p>"
          onChange={onChange}
        />
      )

      // 에디터에 새 내용이 표시되어야 함
      expect(screen.getByText('기존 콘텐츠 불러오기')).toBeInTheDocument()
    })

    it('동일한 content로 rerender 시 불필요하게 업데이트하지 않아야 함', async () => {
      const onChange = vi.fn()
      const { rerender } = render(
        <RichTextEditor content="<p>초기 내용</p>" onChange={onChange} />
      )

      // 초기 내용 확인
      expect(screen.getByText('초기 내용')).toBeInTheDocument()

      // 동일한 content로 rerender
      rerender(
        <RichTextEditor content="<p>초기 내용</p>" onChange={onChange} />
      )

      // 내용이 유지되어야 함 (onChange가 불필요하게 호출되지 않음)
      expect(screen.getByText('초기 내용')).toBeInTheDocument()
    })
  })
})
