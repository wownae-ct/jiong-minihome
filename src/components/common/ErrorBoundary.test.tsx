import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'
// userEvent는 "다시 시도 버튼" 테스트에서 사용됨

vi.mock('@/components/ui/Icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}))

function ThrowOnce({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('test error')
  }
  return <div data-testid="child">child rendered</div>
}

describe('ErrorBoundary', () => {
  // React는 componentDidCatch 발생 시 콘솔에 에러를 로깅한다 — 테스트 노이즈 제거
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('자식이 정상 렌더되면 자식을 보여줘야 함', () => {
    render(
      <ErrorBoundary>
        <ThrowOnce shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('자식이 에러를 던지면 fallback UI를 보여줘야 함', () => {
    render(
      <ErrorBoundary>
        <ThrowOnce shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument()
  })

  it('다시 시도 버튼 클릭 시 onReset 콜백이 호출되어야 함', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()

    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowOnce shouldThrow={true} />
      </ErrorBoundary>
    )

    await user.click(screen.getByText('다시 시도'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  // R4: resetKey가 변경되면 에러 상태를 자동 리셋해야 함
  it('resetKey가 변경되면 에러 상태가 자동 리셋되어야 함', () => {
    function Host() {
      const [key, setKey] = useState('a')
      const [throwIt, setThrowIt] = useState(true)
      return (
        <>
          <ErrorBoundary resetKey={key}>
            <ThrowOnce shouldThrow={throwIt} />
          </ErrorBoundary>
          <button
            onClick={() => {
              setThrowIt(false)
              setKey('b')
            }}
          >
            change key
          </button>
        </>
      )
    }

    render(<Host />)

    // 최초: 에러 상태
    expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument()

    // resetKey가 'a' → 'b'로 변경되고 자식도 정상이 되면 자동 복구
    fireEvent.click(screen.getByText('change key'))

    expect(screen.queryByText('오류가 발생했습니다')).not.toBeInTheDocument()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
