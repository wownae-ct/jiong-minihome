import { render, screen, fireEvent } from '@testing-library/react'
import { ProfileAvatar } from './ProfileAvatar'

describe('ProfileAvatar', () => {
  it('src가 있으면 img 태그를 렌더링해야 함', () => {
    render(<ProfileAvatar src="https://example.com/pic.jpg" alt="TestUser" />)

    const img = screen.getByRole('img', { name: 'TestUser' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/pic.jpg')
  })

  it('src가 null이면 이니셜 폴백을 렌더링해야 함', () => {
    render(<ProfileAvatar src={null} alt="TestUser" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('src가 undefined이면 이니셜 폴백을 렌더링해야 함', () => {
    render(<ProfileAvatar src={undefined} alt="Hello" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('H')).toBeInTheDocument()
  })

  it('src가 빈 문자열이면 이니셜 폴백을 렌더링해야 함', () => {
    render(<ProfileAvatar src="" alt="User" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('이미지 로드 실패 시 이니셜 폴백으로 전환해야 함', () => {
    render(<ProfileAvatar src="https://broken.url/pic.jpg" alt="BrokenUser" />)

    const img = screen.getByRole('img', { name: 'BrokenUser' })
    fireEvent.error(img)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('alt가 빈 문자열이면 ? 를 표시해야 함', () => {
    render(<ProfileAvatar src={null} alt="" />)

    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('size="sm"이면 w-8 h-8 클래스를 적용해야 함', () => {
    const { container } = render(<ProfileAvatar src={null} alt="A" size="sm" />)
    const div = container.firstChild as HTMLElement

    expect(div.className).toContain('w-8')
    expect(div.className).toContain('h-8')
  })

  it('size="md"이면 w-10 h-10 클래스를 적용해야 함', () => {
    const { container } = render(<ProfileAvatar src={null} alt="A" size="md" />)
    const div = container.firstChild as HTMLElement

    expect(div.className).toContain('w-10')
    expect(div.className).toContain('h-10')
  })

  it('size="lg"이면 w-16 h-16 클래스를 적용해야 함', () => {
    const { container } = render(<ProfileAvatar src={null} alt="A" size="lg" />)
    const div = container.firstChild as HTMLElement

    expect(div.className).toContain('w-16')
    expect(div.className).toContain('h-16')
  })

  it('기본 size는 md여야 함', () => {
    const { container } = render(<ProfileAvatar src={null} alt="A" />)
    const div = container.firstChild as HTMLElement

    expect(div.className).toContain('w-10')
    expect(div.className).toContain('h-10')
  })

  it('추가 className을 전달할 수 있어야 함', () => {
    const { container } = render(
      <ProfileAvatar src={null} alt="A" className="custom-class" />
    )
    const div = container.firstChild as HTMLElement

    expect(div.className).toContain('custom-class')
  })

  it('이미지 로드 실패 후 src가 변경되면 새 이미지를 시도해야 함', () => {
    const { rerender } = render(
      <ProfileAvatar src="https://old.url/pic.jpg" alt="User" />
    )

    // 이미지 로드 실패
    const img = screen.getByRole('img', { name: 'User' })
    fireEvent.error(img)

    // 폴백 상태 확인
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('U')).toBeInTheDocument()

    // src가 변경되면 hasError가 리셋되어 새 이미지를 시도해야 함
    rerender(<ProfileAvatar src="https://new.url/pic.jpg" alt="User" />)

    const newImg = screen.getByRole('img', { name: 'User' })
    expect(newImg).toBeInTheDocument()
    expect(newImg).toHaveAttribute('src', 'https://new.url/pic.jpg')
  })
})
