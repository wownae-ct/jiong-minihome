import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('렌더링됩니다', () => {
    render(<Button>확인</Button>)
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
  })

  it('children이 올바르게 렌더링됩니다', () => {
    render(<Button>검색</Button>)
    expect(screen.getByText('검색')).toBeInTheDocument()
  })

  it('클릭 이벤트가 동작합니다', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>확인</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('whitespace-nowrap 클래스가 기본 적용됩니다', () => {
    render(<Button>검색</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('whitespace-nowrap')
  })

  it('shrink-0 클래스가 기본 적용됩니다', () => {
    render(<Button>검색</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('shrink-0')
  })

  it('primary variant가 기본 적용됩니다', () => {
    render(<Button>확인</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-primary')
    expect(button.className).toContain('text-white')
  })

  it('ghost variant가 올바르게 적용됩니다', () => {
    render(<Button variant="ghost">취소</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('hover:bg-slate-200')
  })

  it('icon variant가 올바르게 적용됩니다', () => {
    render(<Button variant="icon">X</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('rounded-full')
  })

  it('size sm이 올바르게 적용됩니다', () => {
    render(<Button size="sm">확인</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('text-sm')
  })

  it('size lg가 올바르게 적용됩니다', () => {
    render(<Button size="lg">확인</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('text-lg')
  })

  it('추가 className이 적용됩니다', () => {
    render(<Button className="custom-class">확인</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('custom-class')
  })

  it('icon prop이 있으면 아이콘이 표시됩니다', () => {
    render(<Button icon="search">검색</Button>)
    const button = screen.getByRole('button')
    expect(button.querySelector('.material-symbols-outlined')).toBeInTheDocument()
  })

  it('disabled 상태가 적용됩니다', () => {
    render(<Button disabled>확인</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('type="submit"이 올바르게 적용됩니다', () => {
    render(<Button type="submit">전송</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
  })
})
