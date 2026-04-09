import { render, screen, fireEvent } from '@testing-library/react'
import { DraftSlotPicker } from './DraftSlotPicker'
import type { DraftSlot } from '@/hooks/useLocalDraft'

const emptySlots: DraftSlot[] = [
  { index: 0, data: null, savedAt: null },
  { index: 1, data: null, savedAt: null },
  { index: 2, data: null, savedAt: null },
]

const twoFilledSlots: DraftSlot[] = [
  {
    index: 0,
    data: { title: '첫 번째 드래프트', content: '<p>내용 A</p>' },
    savedAt: '2026-04-09T10:00:00.000Z',
  },
  {
    index: 1,
    data: { title: '두 번째 드래프트', content: '<p>내용 B</p>' },
    savedAt: '2026-04-09T11:00:00.000Z',
  },
  { index: 2, data: null, savedAt: null },
]

const allFilledSlots: DraftSlot[] = [
  {
    index: 0,
    data: { title: 'A', content: '' },
    savedAt: '2026-04-09T10:00:00.000Z',
  },
  {
    index: 1,
    data: { title: 'B', content: '' },
    savedAt: '2026-04-09T11:00:00.000Z',
  },
  {
    index: 2,
    data: { title: 'C', content: '' },
    savedAt: '2026-04-09T12:00:00.000Z',
  },
]

describe('DraftSlotPicker', () => {
  const defaultProps = {
    slots: twoFilledSlots,
    onSelectSlot: vi.fn(),
    onNewDraft: vi.fn(),
    onDeleteSlot: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('타이틀 "임시 저장 불러오기"를 표시한다', () => {
    render(<DraftSlotPicker {...defaultProps} />)
    expect(screen.getByText(/임시 저장/)).toBeInTheDocument()
  })

  it('저장된 슬롯의 제목을 표시한다', () => {
    render(<DraftSlotPicker {...defaultProps} />)
    expect(screen.getByText('첫 번째 드래프트')).toBeInTheDocument()
    expect(screen.getByText('두 번째 드래프트')).toBeInTheDocument()
  })

  it('빈 슬롯은 "빈 슬롯"이라고 표시한다', () => {
    render(<DraftSlotPicker {...defaultProps} />)
    expect(screen.getByText(/빈 슬롯/)).toBeInTheDocument()
  })

  it('슬롯 클릭 시 onSelectSlot이 해당 인덱스로 호출된다', () => {
    render(<DraftSlotPicker {...defaultProps} />)
    fireEvent.click(screen.getByText('첫 번째 드래프트'))
    expect(defaultProps.onSelectSlot).toHaveBeenCalledWith(0)
  })

  it('"새로 작성" 버튼이 있고 클릭 시 onNewDraft가 호출된다 (빈 슬롯 존재)', () => {
    render(<DraftSlotPicker {...defaultProps} />)
    const newButton = screen.getByRole('button', { name: /새로 작성/ })
    fireEvent.click(newButton)
    expect(defaultProps.onNewDraft).toHaveBeenCalledTimes(1)
  })

  it('모든 슬롯이 차있으면 "새로 작성" 버튼이 비활성화된다', () => {
    render(<DraftSlotPicker {...defaultProps} slots={allFilledSlots} />)
    const newButton = screen.getByRole('button', { name: /새로 작성/ }) as HTMLButtonElement
    expect(newButton.disabled).toBe(true)
  })

  it('슬롯 삭제 버튼 클릭 시 onDeleteSlot이 호출된다', () => {
    render(<DraftSlotPicker {...defaultProps} />)
    const deleteButtons = screen.getAllByRole('button', { name: /삭제/ })
    fireEvent.click(deleteButtons[0])
    expect(defaultProps.onDeleteSlot).toHaveBeenCalledWith(0)
  })

  it('빈 슬롯에는 삭제 버튼이 없다', () => {
    render(<DraftSlotPicker {...defaultProps} slots={emptySlots} />)
    expect(screen.queryByRole('button', { name: /삭제/ })).not.toBeInTheDocument()
  })

  it('모든 슬롯이 비어있으면 "새로 작성" 버튼만 표시된다', () => {
    render(<DraftSlotPicker {...defaultProps} slots={emptySlots} />)
    // 3개의 빈 슬롯 표시
    expect(screen.getAllByText(/빈 슬롯/)).toHaveLength(3)
    // 빈 슬롯은 클릭 불가 (onSelectSlot 호출 안 됨)
  })

  it('취소 버튼 클릭 시 onCancel이 호출된다', () => {
    render(<DraftSlotPicker {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /취소/ }))
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })
})
