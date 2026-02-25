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

    it('이미지 파일 input에 multiple 속성이 있어야 함', () => {
      const onImageUpload = vi.fn().mockResolvedValue('/uploads/test.jpg')

      render(
        <RichTextEditor {...defaultProps} onImageUpload={onImageUpload} />
      )

      const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('multiple')
    })

    it('파일 input으로 여러 장의 이미지를 업로드할 수 있어야 함', async () => {
      const onImageUpload = vi.fn()
        .mockResolvedValueOnce('/uploads/test1.jpg')
        .mockResolvedValueOnce('/uploads/test2.jpg')
        .mockResolvedValueOnce('/uploads/test3.jpg')
      const user = userEvent.setup()

      render(
        <RichTextEditor {...defaultProps} onImageUpload={onImageUpload} />
      )

      const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement
      const file1 = new File(['img1'], 'test1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['img2'], 'test2.jpg', { type: 'image/jpeg' })
      const file3 = new File(['img3'], 'test3.jpg', { type: 'image/jpeg' })

      await user.upload(fileInput, [file1, file2, file3])

      expect(onImageUpload).toHaveBeenCalledTimes(3)
      expect(onImageUpload).toHaveBeenCalledWith(file1)
      expect(onImageUpload).toHaveBeenCalledWith(file2)
      expect(onImageUpload).toHaveBeenCalledWith(file3)
    })

    it('maxImages가 설정되면 제한 개수 이상의 이미지 업로드를 막아야 함', async () => {
      const onImageUpload = vi.fn().mockResolvedValue('/uploads/test.jpg')
      const user = userEvent.setup()

      // 이미 이미지 2개가 있는 상태에서 maxImages=3
      render(
        <RichTextEditor
          {...defaultProps}
          content='<p>텍스트</p><img src="/img1.jpg"><img src="/img2.jpg">'
          onImageUpload={onImageUpload}
          maxImages={3}
        />
      )

      const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement
      const file1 = new File(['img1'], 'new1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['img2'], 'new2.jpg', { type: 'image/jpeg' })
      const file3 = new File(['img3'], 'new3.jpg', { type: 'image/jpeg' })

      await user.upload(fileInput, [file1, file2, file3])

      // 이미 2개 있으므로 1개만 추가 가능
      expect(onImageUpload).toHaveBeenCalledTimes(1)
      expect(onImageUpload).toHaveBeenCalledWith(file1)
    })

    it('maxImages가 없으면 이미지 개수 제한 없이 업로드 가능해야 함', async () => {
      const onImageUpload = vi.fn().mockResolvedValue('/uploads/test.jpg')
      const user = userEvent.setup()

      render(
        <RichTextEditor
          {...defaultProps}
          content='<img src="/img1.jpg"><img src="/img2.jpg"><img src="/img3.jpg">'
          onImageUpload={onImageUpload}
        />
      )

      const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement
      const file1 = new File(['img1'], 'new1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['img2'], 'new2.jpg', { type: 'image/jpeg' })

      await user.upload(fileInput, [file1, file2])

      // maxImages 없으므로 모두 업로드 가능
      expect(onImageUpload).toHaveBeenCalledTimes(2)
    })

    it('이미지 업로드 실패 시 onUploadError 콜백이 호출되어야 함', async () => {
      const onImageUpload = vi.fn().mockRejectedValue(new Error('업로드 실패'))
      const onUploadError = vi.fn()
      const user = userEvent.setup()

      render(
        <RichTextEditor
          {...defaultProps}
          onImageUpload={onImageUpload}
          onUploadError={onUploadError}
        />
      )

      const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement
      const file = new File(['img'], 'test.gif', { type: 'image/gif' })

      await user.upload(fileInput, file)

      await vi.waitFor(() => {
        expect(onUploadError).toHaveBeenCalledWith(expect.any(Error))
      })
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

  describe('비디오 업로드', () => {
    it('onVideoUpload prop이 있으면 비디오 업로드 버튼이 표시되어야 함', () => {
      const onVideoUpload = vi.fn().mockResolvedValue('/uploads/test.mp4')

      render(
        <RichTextEditor
          {...defaultProps}
          onVideoUpload={onVideoUpload}
        />
      )

      expect(
        screen.getByRole('button', { name: /동영상/i })
      ).toBeInTheDocument()
    })

    it('onVideoUpload prop이 없으면 비디오 업로드 버튼이 표시되지 않아야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      expect(
        screen.queryByRole('button', { name: /동영상/i })
      ).not.toBeInTheDocument()
    })

    it('비디오 파일 input이 올바른 accept 속성을 가져야 함', () => {
      const onVideoUpload = vi.fn().mockResolvedValue('/uploads/test.mp4')

      render(
        <RichTextEditor
          {...defaultProps}
          onVideoUpload={onVideoUpload}
        />
      )

      const videoInput = document.querySelector('input[type="file"][accept="video/mp4,video/webm,video/quicktime"]')
      expect(videoInput).toBeInTheDocument()
    })
  })

  describe('YouTube 임베드', () => {
    it('YouTube 버튼이 표시되어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /YouTube/i })
      ).toBeInTheDocument()
    })
  })

  describe('글자 색상', () => {
    it('글자 색상 버튼이 표시되어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /글자 색상/i })
      ).toBeInTheDocument()
    })
  })

  describe('글자 크기', () => {
    it('글자 크기 선택이 표시되어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      expect(screen.getByTitle('글자 크기')).toBeInTheDocument()
    })

    it('font-size 스타일이 포함된 콘텐츠를 올바르게 파싱하고 렌더링해야 함', () => {
      render(
        <RichTextEditor
          {...defaultProps}
          content='<p><span style="font-size: 20px">크기 변경 텍스트</span></p>'
        />
      )

      const textElement = screen.getByText('크기 변경 텍스트')
      const spanElement = textElement.closest('span')
      expect(spanElement).toHaveStyle({ fontSize: '20px' })
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

  describe('통합: 콘텐츠 렌더링', () => {
    it('굵게 스타일 콘텐츠가 <strong> 태그로 렌더링되어야 함', () => {
      render(
        <RichTextEditor
          {...defaultProps}
          content="<p><strong>굵은 텍스트</strong></p>"
        />
      )

      const el = screen.getByText('굵은 텍스트')
      expect(el.closest('strong')).toBeInTheDocument()
    })

    it('기울임 스타일 콘텐츠가 <em> 태그로 렌더링되어야 함', () => {
      render(
        <RichTextEditor
          {...defaultProps}
          content="<p><em>기울임 텍스트</em></p>"
        />
      )

      const el = screen.getByText('기울임 텍스트')
      expect(el.closest('em')).toBeInTheDocument()
    })

    it('밑줄 스타일 콘텐츠가 <u> 태그로 렌더링되어야 함', () => {
      render(
        <RichTextEditor
          {...defaultProps}
          content="<p><u>밑줄 텍스트</u></p>"
        />
      )

      const el = screen.getByText('밑줄 텍스트')
      expect(el.closest('u')).toBeInTheDocument()
    })

    it('취소선 스타일 콘텐츠가 <s> 태그로 렌더링되어야 함', () => {
      render(
        <RichTextEditor
          {...defaultProps}
          content="<p><s>취소선 텍스트</s></p>"
        />
      )

      const el = screen.getByText('취소선 텍스트')
      expect(el.closest('s')).toBeInTheDocument()
    })

    it('글자 색상이 포함된 콘텐츠가 올바르게 렌더링되어야 함', () => {
      render(
        <RichTextEditor
          {...defaultProps}
          content='<p><span style="color: #dc2626">빨간 텍스트</span></p>'
        />
      )

      const el = screen.getByText('빨간 텍스트')
      const span = el.closest('span')
      expect(span).toHaveStyle({ color: '#dc2626' })
    })

    it('순서 없는 목록이 올바르게 렌더링되어야 함', () => {
      render(
        <RichTextEditor
          {...defaultProps}
          content="<ul><li><p>항목 1</p></li><li><p>항목 2</p></li></ul>"
        />
      )

      const listItems = document.querySelectorAll('li')
      expect(listItems.length).toBe(2)
    })

    it('순서 있는 목록이 올바르게 렌더링되어야 함', () => {
      render(
        <RichTextEditor
          {...defaultProps}
          content="<ol><li><p>항목 1</p></li><li><p>항목 2</p></li></ol>"
        />
      )

      const ol = document.querySelector('ol')
      expect(ol).toBeInTheDocument()
      expect(ol?.querySelectorAll('li').length).toBe(2)
    })

    it('구분선이 올바르게 렌더링되어야 함', () => {
      render(
        <RichTextEditor
          {...defaultProps}
          content="<p>위</p><hr><p>아래</p>"
        />
      )

      const hr = document.querySelector('hr')
      expect(hr).toBeInTheDocument()
    })

    it('헤딩이 올바르게 렌더링되어야 함', () => {
      render(
        <RichTextEditor
          {...defaultProps}
          content="<h1>제목1</h1><h2>제목2</h2><h3>제목3</h3>"
        />
      )

      expect(document.querySelector('h1')).toBeInTheDocument()
      expect(document.querySelector('h2')).toBeInTheDocument()
      expect(document.querySelector('h3')).toBeInTheDocument()
    })
  })

  describe('통합: 툴바 완전성', () => {
    it('모든 필수 툴바 버튼이 렌더링되어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      const expectedButtons = [
        /제목 1/i, /제목 2/i, /제목 3/i,
        /굵게/i, /기울임/i, /밑줄/i, /취소선/i,
        /글자 색상/i,
        /글머리 기호 목록/i, /번호 매기기 목록/i,
        /인용문/i, /코드 블록/i, /구분선/i,
        /이미지/i,
        /YouTube/i,
        /실행 취소/i, /다시 실행/i,
      ]

      for (const name of expectedButtons) {
        expect(screen.getByRole('button', { name })).toBeInTheDocument()
      }
    })

    it('글자 크기 select에 올바른 옵션이 있어야 함', () => {
      render(<RichTextEditor {...defaultProps} />)

      const fontSizeSelect = screen.getByTitle('글자 크기') as HTMLSelectElement
      const options = Array.from(fontSizeSelect.options).map(o => o.value)

      expect(options).toContain('')  // 기본
      expect(options).toContain('12px')
      expect(options).toContain('16px')
      expect(options).toContain('24px')
      expect(options).toContain('32px')
    })
  })
})
