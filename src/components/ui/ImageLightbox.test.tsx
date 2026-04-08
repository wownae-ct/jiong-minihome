import { render, screen, fireEvent } from '@/test/test-utils'
import { ImageLightbox } from './ImageLightbox'

describe('ImageLightbox', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.style.overflow = ''
  })

  it('isOpen=false일 때 아무것도 렌더링하지 않는다', () => {
    render(<ImageLightbox {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('isOpen=true일 때 이미지를 렌더링한다', () => {
    render(<ImageLightbox {...defaultProps} />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', defaultProps.src)
  })

  it('alt 텍스트가 img 요소에 전달된다', () => {
    render(<ImageLightbox {...defaultProps} />)
    expect(screen.getByAltText('Test image')).toBeInTheDocument()
  })

  it('backdrop 클릭 시 onClose가 호출된다', () => {
    render(<ImageLightbox {...defaultProps} />)
    const backdrop = screen.getByTestId('lightbox-backdrop')
    fireEvent.click(backdrop)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('닫기 버튼 클릭 시 onClose가 호출된다', () => {
    render(<ImageLightbox {...defaultProps} />)
    const closeButton = screen.getByRole('button', { name: /닫기/i })
    fireEvent.click(closeButton)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape 키 누르면 onClose가 호출된다', () => {
    render(<ImageLightbox {...defaultProps} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('이미지 클릭 시 onClose가 호출되지 않는다', () => {
    render(<ImageLightbox {...defaultProps} />)
    fireEvent.click(screen.getByRole('img'))
    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('isOpen=true일 때 body overflow가 hidden으로 설정된다', () => {
    render(<ImageLightbox {...defaultProps} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('isOpen=false로 변경되면 body overflow가 복원된다', () => {
    const { rerender } = render(<ImageLightbox {...defaultProps} />)
    expect(document.body.style.overflow).toBe('hidden')

    rerender(<ImageLightbox {...defaultProps} isOpen={false} />)
    expect(document.body.style.overflow).toBe('unset')
  })
})
