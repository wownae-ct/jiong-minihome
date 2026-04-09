import { render, screen } from '@testing-library/react'
import { SaveIndicator, SaveIndicatorChip } from './SaveIndicator'

describe('SaveIndicator (인라인 상태)', () => {
  it('status=idle이고 savedAt이 없으면 "저장 안 됨" 표시', () => {
    render(<SaveIndicator status="idle" savedAt={null} />)
    expect(screen.getByText(/저장 안 됨/)).toBeInTheDocument()
  })

  it('status=idle이고 savedAt이 있으면 "마지막 저장: HH:MM:SS"', () => {
    const iso = new Date('2026-04-09T13:45:30').toISOString()
    render(<SaveIndicator status="idle" savedAt={iso} />)
    expect(screen.getByText(/마지막 저장/)).toBeInTheDocument()
  })

  it('status=saving일 때 "저장 중..."을 표시', () => {
    render(<SaveIndicator status="saving" savedAt={null} />)
    expect(screen.getByText(/저장 중/)).toBeInTheDocument()
  })

  it('status=saved일 때 "저장됨"을 표시', () => {
    render(<SaveIndicator status="saved" savedAt={new Date().toISOString()} />)
    expect(screen.getByText(/저장됨/)).toBeInTheDocument()
  })
})

describe('SaveIndicatorChip (헤더 칩)', () => {
  it('status=idle, isDirty=false일 때 아무것도 표시하지 않음', () => {
    const { container } = render(
      <SaveIndicatorChip status="idle" savedAt={null} isDirty={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('isDirty=true이면 "변경됨" 칩 표시', () => {
    render(<SaveIndicatorChip status="idle" savedAt={null} isDirty={true} />)
    expect(screen.getByText(/변경됨/)).toBeInTheDocument()
  })

  it('status=saving일 때 "저장 중..." 칩', () => {
    render(<SaveIndicatorChip status="saving" savedAt={null} isDirty={true} />)
    expect(screen.getByText(/저장 중/)).toBeInTheDocument()
  })

  it('status=saved + savedAt이 있으면 "저장됨" 칩', () => {
    render(
      <SaveIndicatorChip
        status="saved"
        savedAt={new Date().toISOString()}
        isDirty={false}
      />
    )
    expect(screen.getByText(/저장됨/)).toBeInTheDocument()
  })
})
