import { render, screen, waitFor } from '@testing-library/react'

describe('VisitorCounter', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    global.fetch = mockFetch
    vi.clearAllMocks()
  })

  it('API에서 가져온 today/total 값을 표시해야 함', async () => {
    // POST (방문 기록)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
    // GET (통계 조회)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ today: 24, total: 1254 }),
    })

    const { VisitorCounter } = await import('./VisitorCounter')
    render(<VisitorCounter />)

    await waitFor(() => {
      expect(screen.getByText('TODAY 24')).toBeInTheDocument()
      expect(screen.getByText('TOTAL 1,254')).toBeInTheDocument()
    })
  })

  it('로딩 중에는 "-" 표시를 해야 함', async () => {
    // never-resolving fetch to keep loading state
    mockFetch.mockReturnValue(new Promise(() => {}))

    const { VisitorCounter } = await import('./VisitorCounter')
    render(<VisitorCounter />)

    expect(screen.getByText('TODAY -')).toBeInTheDocument()
    expect(screen.getByText('TOTAL -')).toBeInTheDocument()
  })

  it('API 실패 시 "-" 표시를 유지해야 함', async () => {
    // POST (방문 기록) - 실패
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    // GET (통계 조회) - 실패
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { VisitorCounter } = await import('./VisitorCounter')
    render(<VisitorCounter />)

    await waitFor(() => {
      expect(screen.getByText('TODAY -')).toBeInTheDocument()
      expect(screen.getByText('TOTAL -')).toBeInTheDocument()
    })
  })

  it('마운트 시 POST로 방문을 기록해야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ today: 0, total: 0 }),
    })

    const { VisitorCounter } = await import('./VisitorCounter')
    render(<VisitorCounter />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/stats/visitors', expect.objectContaining({
        method: 'POST',
      }))
    })
  })
})
