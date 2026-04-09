import { renderHook, act } from '@testing-library/react'
import { useDraftSlots, useEditDraft, MAX_NEW_SLOTS } from './useLocalDraft'

const DRAFT_KEY = 'portfolio_drafts'

function readRaw(): unknown {
  const raw = localStorage.getItem(DRAFT_KEY)
  return raw ? JSON.parse(raw) : null
}

function writeRaw(data: unknown) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
}

describe('useDraftSlots (새 글 다중 슬롯)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('MAX_NEW_SLOTS는 3이다', () => {
    expect(MAX_NEW_SLOTS).toBe(3)
  })

  it('초기 상태에서는 슬롯 3개가 모두 비어있다', () => {
    const { result } = renderHook(() => useDraftSlots())
    expect(result.current.slots).toHaveLength(3)
    expect(result.current.slots.every((s) => s.data === null)).toBe(true)
  })

  it('saveToSlot으로 첫 슬롯에 저장할 수 있다', () => {
    const { result } = renderHook(() => useDraftSlots())

    act(() => {
      result.current.saveToSlot(0, { title: 'Slot 0', content: '<p>a</p>' })
    })

    expect(result.current.slots[0].data?.title).toBe('Slot 0')
    expect(result.current.slots[0].savedAt).toBeDefined()
    expect(result.current.slots[1].data).toBeNull()
    expect(result.current.slots[2].data).toBeNull()
  })

  it('3개 슬롯에 각각 다른 데이터를 저장할 수 있다', () => {
    const { result } = renderHook(() => useDraftSlots())

    act(() => {
      result.current.saveToSlot(0, { title: 'A' })
      result.current.saveToSlot(1, { title: 'B' })
      result.current.saveToSlot(2, { title: 'C' })
    })

    expect(result.current.slots[0].data?.title).toBe('A')
    expect(result.current.slots[1].data?.title).toBe('B')
    expect(result.current.slots[2].data?.title).toBe('C')
  })

  it('저장된 슬롯은 localStorage에 영속된다', () => {
    const { result, unmount } = renderHook(() => useDraftSlots())

    act(() => {
      result.current.saveToSlot(1, { title: 'Persisted' })
    })

    unmount()

    const { result: result2 } = renderHook(() => useDraftSlots())
    expect(result2.current.slots[1].data?.title).toBe('Persisted')
  })

  it('deleteSlot으로 특정 슬롯을 비울 수 있다', () => {
    const { result } = renderHook(() => useDraftSlots())

    act(() => {
      result.current.saveToSlot(0, { title: 'A' })
    })
    expect(result.current.slots[0].data).not.toBeNull()

    act(() => {
      result.current.deleteSlot(0)
    })
    expect(result.current.slots[0].data).toBeNull()
  })

  it('findEmptySlotIndex는 첫 번째 빈 슬롯 인덱스를 반환하거나 없으면 -1', () => {
    const { result } = renderHook(() => useDraftSlots())

    expect(result.current.findEmptySlotIndex()).toBe(0)

    act(() => {
      result.current.saveToSlot(0, { title: 'A' })
    })
    expect(result.current.findEmptySlotIndex()).toBe(1)

    act(() => {
      result.current.saveToSlot(1, { title: 'B' })
      result.current.saveToSlot(2, { title: 'C' })
    })
    expect(result.current.findEmptySlotIndex()).toBe(-1)
  })

  it('hasAnyDraft는 하나라도 저장된 슬롯이 있으면 true', () => {
    const { result } = renderHook(() => useDraftSlots())
    expect(result.current.hasAnyDraft).toBe(false)

    act(() => {
      result.current.saveToSlot(1, { title: 'Hey' })
    })
    expect(result.current.hasAnyDraft).toBe(true)
  })

  it('legacy 단일 드래프트가 있으면 slot 0으로 마이그레이션된다', () => {
    // legacy 형식: 기존 SavedDraft[] 구조 (id: 'new', portfolioId undefined)
    writeRaw([
      {
        id: 'new',
        data: { title: 'Legacy Draft', content: '<p>old</p>' },
        savedAt: '2026-04-09T10:00:00.000Z',
      },
    ])

    const { result } = renderHook(() => useDraftSlots())

    expect(result.current.slots[0].data?.title).toBe('Legacy Draft')
    expect(result.current.slots[1].data).toBeNull()
    expect(result.current.slots[2].data).toBeNull()
  })

  it('잘못된 localStorage 데이터가 있으면 안전하게 무시한다', () => {
    writeRaw('not-an-array-or-object')

    const { result } = renderHook(() => useDraftSlots())
    expect(result.current.hasAnyDraft).toBe(false)
  })

  it('슬롯 데이터를 덮어쓸 수 있다', () => {
    const { result } = renderHook(() => useDraftSlots())

    act(() => {
      result.current.saveToSlot(0, { title: 'First' })
    })
    expect(result.current.slots[0].data?.title).toBe('First')

    act(() => {
      result.current.saveToSlot(0, { title: 'Second' })
    })
    expect(result.current.slots[0].data?.title).toBe('Second')
  })
})

describe('useEditDraft (수정 모드 단일 슬롯)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('portfolioId별로 독립적인 슬롯을 유지한다', () => {
    const { result: result1 } = renderHook(() => useEditDraft(100))
    const { result: result2 } = renderHook(() => useEditDraft(200))

    act(() => {
      result1.current.save({ title: 'For 100' })
      result2.current.save({ title: 'For 200' })
    })

    expect(result1.current.draft?.data.title).toBe('For 100')
    expect(result2.current.draft?.data.title).toBe('For 200')
  })

  it('clear로 수정 드래프트를 삭제할 수 있다', () => {
    const { result } = renderHook(() => useEditDraft(100))

    act(() => {
      result.current.save({ title: 'Temp' })
    })
    expect(result.current.draft).not.toBeNull()

    act(() => {
      result.current.clear()
    })
    expect(result.current.draft).toBeNull()
  })

  it('hasDraft는 저장 여부를 반영한다', () => {
    const { result } = renderHook(() => useEditDraft(100))
    expect(result.current.hasDraft).toBe(false)

    act(() => {
      result.current.save({ title: 'X' })
    })
    expect(result.current.hasDraft).toBe(true)
  })

  it('수정 드래프트와 새 글 슬롯은 공존 가능하다', () => {
    const { result: editResult } = renderHook(() => useEditDraft(100))
    const { result: slotsResult } = renderHook(() => useDraftSlots())

    act(() => {
      editResult.current.save({ title: 'Edit-100' })
      slotsResult.current.saveToSlot(0, { title: 'New-slot-0' })
    })

    expect(editResult.current.draft?.data.title).toBe('Edit-100')
    expect(slotsResult.current.slots[0].data?.title).toBe('New-slot-0')
  })
})
