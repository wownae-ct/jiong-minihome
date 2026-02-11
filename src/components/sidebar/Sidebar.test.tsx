import { render } from '@testing-library/react'
import { Sidebar } from './Sidebar'

vi.mock('./ProfileCard', () => ({
  ProfileCard: () => <div data-testid="profile-card">ProfileCard</div>,
}))

vi.mock('./ContactInfo', () => ({
  ContactInfo: () => <div data-testid="contact-info">ContactInfo</div>,
}))

vi.mock('./AnnouncementBanner', () => ({
  AnnouncementBanner: () => <div data-testid="announcement-banner">AnnouncementBanner</div>,
}))

vi.mock('./VisitorCounter', () => ({
  VisitorCounter: () => <div data-testid="visitor-counter">VisitorCounter</div>,
}))

describe('Sidebar', () => {
  it('모든 사이드바 구성 요소가 렌더링되어야 함', () => {
    const { getByTestId } = render(<Sidebar />)

    expect(getByTestId('profile-card')).toBeInTheDocument()
    expect(getByTestId('contact-info')).toBeInTheDocument()
    expect(getByTestId('announcement-banner')).toBeInTheDocument()
    expect(getByTestId('visitor-counter')).toBeInTheDocument()
  })

  it('방문자 카운터가 mt-auto로 하단에 고정되어야 함', () => {
    const { getByTestId } = render(<Sidebar />)

    const visitorCounter = getByTestId('visitor-counter')
    const bottomSection = visitorCounter.parentElement!

    expect(bottomSection.className).toContain('mt-auto')
  })

  it('공지사항이 소셜 링크 하단에 위치해야 함', () => {
    const { container } = render(<Sidebar />)

    const children = Array.from(container.childNodes)
    const allElements = children.flatMap((child) => {
      if ((child as HTMLElement).dataset?.testid) return [child]
      return Array.from(child.childNodes).filter(
        (c) => (c as HTMLElement).dataset?.testid
      )
    })

    const testIds = allElements.map((el) => (el as HTMLElement).dataset?.testid)
    const contactIndex = testIds.indexOf('contact-info')
    const announcementIndex = testIds.indexOf('announcement-banner')

    expect(contactIndex).toBeGreaterThanOrEqual(0)
    expect(announcementIndex).toBeGreaterThanOrEqual(0)
    expect(contactIndex).toBeLessThan(announcementIndex)
  })

  it('ProfileCard, ContactInfo 순서로 상단에 렌더링되어야 함', () => {
    const { container } = render(<Sidebar />)

    // Fragment 안의 직접 자식들을 확인
    const children = Array.from(container.childNodes)
    const allElements = children.flatMap((child) => {
      if ((child as HTMLElement).dataset?.testid) return [child]
      return Array.from(child.childNodes).filter(
        (c) => (c as HTMLElement).dataset?.testid
      )
    })

    const testIds = allElements.map((el) => (el as HTMLElement).dataset?.testid)
    const profileIndex = testIds.indexOf('profile-card')
    const contactIndex = testIds.indexOf('contact-info')

    expect(profileIndex).toBeGreaterThanOrEqual(0)
    expect(contactIndex).toBeGreaterThanOrEqual(0)
    expect(profileIndex).toBeLessThan(contactIndex)
  })
})
