import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WriteButton } from './WriteButton'

describe('WriteButton', () => {
  it('렌더링됩니다', () => {
    render(<WriteButton onClick={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('커스텀 아이콘 이미지를 표시합니다', () => {
    render(<WriteButton onClick={() => {}} />)
    const img = screen.getByRole('img', { name: /글쓰기/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', expect.stringContaining('note-icon'))
  })

  it('클릭 이벤트가 동작합니다', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<WriteButton onClick={handleClick} />)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('title prop이 올바르게 적용됩니다', () => {
    render(<WriteButton onClick={() => {}} title="다이어리 쓰기" />)
    expect(screen.getByTitle('다이어리 쓰기')).toBeInTheDocument()
  })

  it('기본 title은 글쓰기입니다', () => {
    render(<WriteButton onClick={() => {}} />)
    expect(screen.getByTitle('글쓰기')).toBeInTheDocument()
  })

  it('파란색 그라디언트 배경 스타일이 적용됩니다', () => {
    render(<WriteButton onClick={() => {}} />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('from-primary')
    expect(button.className).toContain('to-blue-600')
  })

  it('호버 시 기울어지는 효과를 위한 group 클래스가 있습니다', () => {
    render(<WriteButton onClick={() => {}} />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('group')
  })

  it('아이콘에 호버 회전 애니메이션 클래스가 적용됩니다', () => {
    render(<WriteButton onClick={() => {}} />)
    const img = screen.getByRole('img', { name: /글쓰기/i })
    expect(img.className).toContain('group-hover:rotate-12')
  })

  it('아이콘이 하얀색으로 표시됩니다 (invert 필터)', () => {
    render(<WriteButton onClick={() => {}} />)
    const img = screen.getByRole('img', { name: /글쓰기/i })
    expect(img.className).toContain('invert')
  })

  it('추가 className이 적용됩니다', () => {
    render(<WriteButton onClick={() => {}} className="custom-class" />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('custom-class')
  })
})
