import { render, screen, waitFor } from '@testing-library/react'
import { BgmProvider, useBgm } from './BgmContext'

// Mock useBgmPlayer
vi.mock('@/hooks/useBgmPlayer', () => ({
  useBgmPlayer: vi.fn().mockReturnValue({
    isPlaying: false,
    currentTrack: null,
    volume: 0.5,
    currentTime: 0,
    duration: 0,
    play: vi.fn(),
    pause: vi.fn(),
    toggle: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    setVolume: vi.fn(),
  }),
}))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function TestConsumer() {
  const bgm = useBgm()
  return (
    <div>
      <span data-testid="playing">{String(bgm.isPlaying)}</span>
      <span data-testid="loading">{String(bgm.isLoading)}</span>
      <span data-testid="playlist-length">{bgm.playlist.length}</span>
    </div>
  )
}

describe('BgmContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('마운트 시 /api/bgm에서 플레이리스트를 가져온다', async () => {
    const mockTracks = [
      { id: 1, title: '곡1', artist: '아티스트1', url: '/uploads/song1.mp3', duration: 180 },
    ]
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTracks),
    })

    render(
      <BgmProvider>
        <TestConsumer />
      </BgmProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/bgm')
    expect(screen.getByTestId('playlist-length').textContent).toBe('1')
  })

  it('fetch 실패 시 빈 플레이리스트로 처리한다', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(
      <BgmProvider>
        <TestConsumer />
      </BgmProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('playlist-length').textContent).toBe('0')
  })

  it('children에게 BGM 상태를 전달한다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(
      <BgmProvider>
        <TestConsumer />
      </BgmProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('playing').textContent).toBe('false')
    })
  })

  it('Provider 외부에서 useBgm 사용 시 에러를 던진다', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useBgm must be used within a BgmProvider')

    consoleError.mockRestore()
  })
})
