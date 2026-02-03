import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabProvider, useTab } from './TabContext'

function TestConsumer() {
  const { activeTab, setActiveTab } = useTab()
  return (
    <div>
      <span data-testid="active-tab">{activeTab}</span>
      <button onClick={() => setActiveTab('career')}>Go to Career</button>
      <button onClick={() => setActiveTab('portfolio')}>Go to Portfolio</button>
    </div>
  )
}

describe('TabContext', () => {
  it('기본 활성 탭은 intro이어야 함', () => {
    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    expect(screen.getByTestId('active-tab')).toHaveTextContent('intro')
  })

  it('setActiveTab으로 탭을 변경할 수 있어야 함', async () => {
    const user = userEvent.setup()

    render(
      <TabProvider>
        <TestConsumer />
      </TabProvider>
    )

    await user.click(screen.getByText('Go to Career'))
    expect(screen.getByTestId('active-tab')).toHaveTextContent('career')

    await user.click(screen.getByText('Go to Portfolio'))
    expect(screen.getByTestId('active-tab')).toHaveTextContent('portfolio')
  })

  it('초기 탭을 지정할 수 있어야 함', () => {
    render(
      <TabProvider initialTab="guestbook">
        <TestConsumer />
      </TabProvider>
    )

    expect(screen.getByTestId('active-tab')).toHaveTextContent('guestbook')
  })
})
