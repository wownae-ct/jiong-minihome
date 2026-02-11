import { render, screen, fireEvent } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BgmPlayer } from './BgmPlayer'

const mockToggle = vi.fn()
const mockNext = vi.fn()
const mockPrevious = vi.fn()
const mockSetVolume = vi.fn()

const defaultBgmState = {
  isPlaying: false,
  currentTrack: null as { id: number; title: string; artist: string | null; url: string; duration: number | null } | null,
  volume: 0.5,
  currentTime: 0,
  duration: 0,
  play: vi.fn(),
  pause: vi.fn(),
  toggle: mockToggle,
  next: mockNext,
  previous: mockPrevious,
  setVolume: mockSetVolume,
  playlist: [] as { id: number; title: string; artist: string | null; url: string; duration: number | null }[],
  isLoading: false,
}

let mockBgmState = { ...defaultBgmState }

vi.mock('@/components/providers/BgmContext', () => ({
  useBgm: () => mockBgmState,
}))

describe('BgmPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBgmState = { ...defaultBgmState }
  })

  it('로딩 중일 때 "BGM 로딩..." 표시', () => {
    mockBgmState = { ...defaultBgmState, isLoading: true }
    render(<BgmPlayer />)
    expect(screen.getByText('BGM 로딩...')).toBeInTheDocument()
  })

  it('플레이리스트가 비어있으면 "BGM 없음" 표시', () => {
    render(<BgmPlayer />)
    expect(screen.getByText('BGM 없음')).toBeInTheDocument()
  })

  it('트랙이 있으면 제목과 아티스트를 표시', () => {
    mockBgmState = {
      ...defaultBgmState,
      currentTrack: { id: 1, title: '바람', artist: 'Lucid Fall', url: '/test.mp3', duration: 222 },
      playlist: [{ id: 1, title: '바람', artist: 'Lucid Fall', url: '/test.mp3', duration: 222 }],
    }
    render(<BgmPlayer />)
    expect(screen.getByText(/Lucid Fall - 바람/)).toBeInTheDocument()
  })

  it('아티스트가 없으면 제목만 표시', () => {
    mockBgmState = {
      ...defaultBgmState,
      currentTrack: { id: 1, title: '테스트 곡', artist: null, url: '/test.mp3', duration: 120 },
      playlist: [{ id: 1, title: '테스트 곡', artist: null, url: '/test.mp3', duration: 120 }],
    }
    render(<BgmPlayer />)
    const matches = screen.getAllByText(/테스트 곡/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('재생 버튼 클릭 시 toggle() 호출', async () => {
    const user = userEvent.setup()
    mockBgmState = {
      ...defaultBgmState,
      currentTrack: { id: 1, title: '곡', artist: null, url: '/test.mp3', duration: 60 },
      playlist: [{ id: 1, title: '곡', artist: null, url: '/test.mp3', duration: 60 }],
    }
    render(<BgmPlayer />)
    await user.click(screen.getByLabelText('재생'))
    expect(mockToggle).toHaveBeenCalled()
  })

  it('재생 중일 때 일시정지 버튼 표시', () => {
    mockBgmState = {
      ...defaultBgmState,
      isPlaying: true,
      currentTrack: { id: 1, title: '곡', artist: null, url: '/test.mp3', duration: 60 },
      playlist: [{ id: 1, title: '곡', artist: null, url: '/test.mp3', duration: 60 }],
    }
    render(<BgmPlayer />)
    expect(screen.getByLabelText('일시정지')).toBeInTheDocument()
  })

  it('다음 곡 버튼 클릭 시 next() 호출', async () => {
    const user = userEvent.setup()
    mockBgmState = {
      ...defaultBgmState,
      currentTrack: { id: 1, title: '곡', artist: null, url: '/test.mp3', duration: 60 },
      playlist: [{ id: 1, title: '곡', artist: null, url: '/test.mp3', duration: 60 }],
    }
    render(<BgmPlayer />)
    await user.click(screen.getByLabelText('다음 곡'))
    expect(mockNext).toHaveBeenCalled()
  })

  it('볼륨 슬라이더로 볼륨 변경', () => {
    mockBgmState = {
      ...defaultBgmState,
      currentTrack: { id: 1, title: '곡', artist: null, url: '/test.mp3', duration: 60 },
      playlist: [{ id: 1, title: '곡', artist: null, url: '/test.mp3', duration: 60 }],
    }
    render(<BgmPlayer />)
    const slider = screen.getByLabelText('볼륨')
    fireEvent.change(slider, { target: { value: '0.8' } })
    expect(mockSetVolume).toHaveBeenCalledWith(0.8)
  })

  it('이전 곡 버튼 클릭 시 previous() 호출', async () => {
    const user = userEvent.setup()
    mockBgmState = {
      ...defaultBgmState,
      currentTrack: { id: 1, title: '곡', artist: null, url: '/test.mp3', duration: 60 },
      playlist: [{ id: 1, title: '곡', artist: null, url: '/test.mp3', duration: 60 }],
    }
    render(<BgmPlayer />)
    await user.click(screen.getByLabelText('이전 곡'))
    expect(mockPrevious).toHaveBeenCalled()
  })

  it('음소거 버튼 클릭 시 볼륨을 0으로 설정', async () => {
    const user = userEvent.setup()
    mockBgmState = {
      ...defaultBgmState,
      volume: 0.5,
      currentTrack: { id: 1, title: '곡', artist: null, url: '/test.mp3', duration: 60 },
      playlist: [{ id: 1, title: '곡', artist: null, url: '/test.mp3', duration: 60 }],
    }
    render(<BgmPlayer />)
    await user.click(screen.getByLabelText('음소거'))
    expect(mockSetVolume).toHaveBeenCalledWith(0)
  })
})
