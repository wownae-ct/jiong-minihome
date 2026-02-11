import { render, screen } from '@testing-library/react'
import { MainLayout } from './MainLayout'

describe('MainLayout', () => {
  it('사이드바와 콘텐츠를 렌더링합니다', () => {
    render(
      <MainLayout sidebar={<div data-testid="sidebar">사이드바</div>}>
        <div data-testid="content">콘텐츠</div>
      </MainLayout>
    )
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('showSidebarOnMobile이 false일 때 aside에 hidden md:flex 클래스가 적용됩니다', () => {
    render(
      <MainLayout sidebar={<div>사이드바</div>} showSidebarOnMobile={false}>
        <div>콘텐츠</div>
      </MainLayout>
    )
    const aside = document.querySelector('aside')!
    expect(aside.className).toContain('hidden')
    expect(aside.className).toContain('md:flex')
  })

  it('showSidebarOnMobile이 true일 때 aside에 flex 클래스가 적용됩니다', () => {
    render(
      <MainLayout sidebar={<div>사이드바</div>} showSidebarOnMobile={true}>
        <div>콘텐츠</div>
      </MainLayout>
    )
    const aside = document.querySelector('aside')!
    expect(aside.className).toContain('flex')
    expect(aside.className).not.toContain('hidden')
  })

  it('showSidebarOnMobile 기본값은 true입니다', () => {
    render(
      <MainLayout sidebar={<div>사이드바</div>}>
        <div>콘텐츠</div>
      </MainLayout>
    )
    const aside = document.querySelector('aside')!
    expect(aside.className).toContain('flex')
    expect(aside.className).not.toContain('hidden')
  })
})
