import { renderHook, act, waitFor } from '@testing-library/react'
// next-auth/react 모킹
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

import { useSession } from 'next-auth/react'
import { useAdminStatus } from './useAdminStatus'

describe('useAdminStatus', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    global.fetch = mockFetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'online' }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('초기 상태를 조회해야 함', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })

    renderHook(() => useAdminStatus())

    await vi.advanceTimersByTimeAsync(100)

    expect(mockFetch).toHaveBeenCalledWith('/api/admin/status')
  })

  it('관리자가 아닌 경우 활동 업데이트를 하지 않아야 함', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { role: 'user' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    })

    renderHook(() => useAdminStatus())

    await vi.advanceTimersByTimeAsync(100)

    // GET 요청만 있어야 함 (POST 요청 없음)
    const postCalls = mockFetch.mock.calls.filter(
      (call) => call[1]?.method === 'POST'
    )
    expect(postCalls).toHaveLength(0)
  })

  it('관리자인 경우 초기 활동 업데이트를 해야 함', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: '1', role: 'admin' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    })

    renderHook(() => useAdminStatus())

    await vi.advanceTimersByTimeAsync(100)

    const postCalls = mockFetch.mock.calls.filter(
      (call) => call[1]?.method === 'POST'
    )
    expect(postCalls.length).toBeGreaterThanOrEqual(1)
  })

  describe('쓰로틀링', () => {
    it('짧은 시간 내 여러 이벤트가 발생해도 API는 한 번만 호출되어야 함', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: { user: { id: '1', role: 'admin' }, expires: '' },
        status: 'authenticated',
        update: vi.fn(),
      })

      renderHook(() => useAdminStatus())

      // 초기 호출 대기
      await vi.advanceTimersByTimeAsync(100)
      mockFetch.mockClear()

      // 연속으로 여러 이벤트 발생 시뮬레이션
      await act(async () => {
        window.dispatchEvent(new Event('mousemove'))
        window.dispatchEvent(new Event('mousemove'))
        window.dispatchEvent(new Event('mousemove'))
        window.dispatchEvent(new Event('click'))
        window.dispatchEvent(new Event('keydown'))
      })

      await vi.advanceTimersByTimeAsync(100)

      // 쓰로틀링으로 인해 1번만 호출되어야 함
      const postCalls = mockFetch.mock.calls.filter(
        (call) => call[1]?.method === 'POST'
      )
      expect(postCalls.length).toBeLessThanOrEqual(1)
    })

    it('쓰로틀 간격이 지나면 다시 API를 호출할 수 있어야 함', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: { user: { id: '1', role: 'admin' }, expires: '' },
        status: 'authenticated',
        update: vi.fn(),
      })

      renderHook(() => useAdminStatus())

      // 초기 호출 대기
      await vi.advanceTimersByTimeAsync(100)
      mockFetch.mockClear()

      // 첫 번째 이벤트
      await act(async () => {
        window.dispatchEvent(new Event('mousemove'))
      })
      await vi.advanceTimersByTimeAsync(100)

      const firstCount = mockFetch.mock.calls.filter(
        (call) => call[1]?.method === 'POST'
      ).length

      // 쓰로틀 간격 대기 (5분 = 300,000ms)
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000)

      // 두 번째 이벤트
      await act(async () => {
        window.dispatchEvent(new Event('mousemove'))
      })
      await vi.advanceTimersByTimeAsync(100)

      const secondCount = mockFetch.mock.calls.filter(
        (call) => call[1]?.method === 'POST'
      ).length

      // 쓰로틀 간격이 지난 후 추가 호출이 있어야 함
      expect(secondCount).toBeGreaterThan(firstCount)
    })
  })

  it('폴링 간격(30초)마다 상태를 조회해야 함', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })

    renderHook(() => useAdminStatus())

    await vi.advanceTimersByTimeAsync(100)
    const initialCalls = mockFetch.mock.calls.filter(
      (call) => !call[1]?.method
    ).length

    // 30초 대기
    await vi.advanceTimersByTimeAsync(30 * 1000)

    const afterPollingCalls = mockFetch.mock.calls.filter(
      (call) => !call[1]?.method
    ).length

    expect(afterPollingCalls).toBeGreaterThan(initialCalls)
  })

  it('언마운트 시 이벤트 리스너가 정리되어야 함', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: '1', role: 'admin' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    })

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useAdminStatus())

    await vi.advanceTimersByTimeAsync(100)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function)
    )
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    )
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function)
    )
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    )
  })
})
