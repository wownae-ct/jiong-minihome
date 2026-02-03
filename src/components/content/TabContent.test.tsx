import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { TabContent } from './TabContent'

describe('TabContent', () => {
  it('intro 탭일 때 WhatsNew 콘텐츠가 렌더링되어야 함', () => {
    render(<TabContent />, { initialTab: 'intro' })

    expect(screen.getByText("What's New")).toBeInTheDocument()
  })

  it('career 탭일 때 경력 콘텐츠가 렌더링되어야 함', () => {
    render(<TabContent />, { initialTab: 'career' })

    expect(screen.getByText('경력')).toBeInTheDocument()
    expect(screen.getByText('Career')).toBeInTheDocument()
  })

  it('portfolio 탭일 때 포트폴리오 콘텐츠가 렌더링되어야 함', () => {
    render(<TabContent />, { initialTab: 'portfolio' })

    expect(screen.getByText('포트폴리오')).toBeInTheDocument()
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
  })

  it('guestbook 탭일 때 방명록 콘텐츠가 렌더링되어야 함', () => {
    render(<TabContent />, { initialTab: 'guestbook' })

    expect(screen.getByText('방명록')).toBeInTheDocument()
    expect(screen.getByText('Guestbook')).toBeInTheDocument()
  })
})
