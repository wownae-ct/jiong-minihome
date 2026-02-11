import { renderHook, act } from '@testing-library/react'
import { useBgmPlayer, BgmTrack } from './useBgmPlayer'

// Mock Audio
let mockAudioInstance: MockAudio

class MockAudio {
  src = ''
  volume = 1
  currentTime = 0
  duration = 0
  paused = true
  private listeners: Record<string, { handler: Function; once: boolean }[]> = {}

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockAudioInstance = this
  }

  play = vi.fn().mockImplementation(() => {
    this.paused = false
    return Promise.resolve()
  })
  pause = vi.fn().mockImplementation(() => {
    this.paused = true
  })
  load = vi.fn()
  addEventListener = vi.fn((event: string, handler: Function, options?: { once?: boolean }) => {
    this.listeners[event] = this.listeners[event] || []
    this.listeners[event].push({ handler, once: options?.once ?? false })
  })
  removeEventListener = vi.fn((event: string, handler: Function) => {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(entry => entry.handler !== handler)
    }
  })

  // Helper to fire events in tests
  emit(event: string) {
    const entries = this.listeners[event] || []
    const toRemove: { handler: Function; once: boolean }[] = []
    entries.forEach(entry => {
      entry.handler()
      if (entry.once) toRemove.push(entry)
    })
    toRemove.forEach(entry => {
      this.listeners[event] = this.listeners[event].filter(e => e !== entry)
    })
  }
}

vi.stubGlobal('Audio', MockAudio)

// Mock localStorage
const localStorageData: Record<string, string> = {}
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageData[key] || null),
  setItem: vi.fn((key: string, value: string) => { localStorageData[key] = value }),
  removeItem: vi.fn((key: string) => { delete localStorageData[key] }),
}
vi.stubGlobal('localStorage', mockLocalStorage)

const samplePlaylist: BgmTrack[] = [
  { id: 1, title: '곡1', artist: '아티스트1', url: '/uploads/song1.mp3', duration: 180 },
  { id: 2, title: '곡2', artist: null, url: '/uploads/song2.mp3', duration: 240 },
  { id: 3, title: '곡3', artist: '아티스트3', url: '/uploads/song3.mp3', duration: 120 },
]

describe('useBgmPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(localStorageData).forEach(key => delete localStorageData[key])
  })

  it('초기 상태는 isPlaying=false, currentTrack=null, volume=0.5', () => {
    const { result } = renderHook(() => useBgmPlayer({ playlist: [] }))

    expect(result.current.isPlaying).toBe(false)
    expect(result.current.currentTrack).toBeNull()
    expect(result.current.volume).toBe(0.5)
  })

  it('플레이리스트가 있으면 첫 번째 트랙을 currentTrack으로 설정한다', () => {
    const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))

    expect(result.current.currentTrack).not.toBeNull()
  })

  it('toggle()로 재생/일시정지를 전환한다', async () => {
    const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))

    await act(async () => {
      await result.current.toggle()
    })
    expect(result.current.isPlaying).toBe(true)

    await act(async () => {
      await result.current.toggle()
    })
    expect(result.current.isPlaying).toBe(false)
  })

  it('play()는 isPlaying을 true로 설정한다', async () => {
    const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))

    await act(async () => {
      await result.current.play()
    })
    expect(result.current.isPlaying).toBe(true)
  })

  it('pause()는 isPlaying을 false로 설정한다', async () => {
    const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))

    await act(async () => {
      await result.current.play()
    })
    act(() => {
      result.current.pause()
    })
    expect(result.current.isPlaying).toBe(false)
  })

  it('next()는 다른 트랙을 선택한다 (플레이리스트 > 1)', async () => {
    const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))

    const initialTrack = result.current.currentTrack
    // next를 여러 번 호출해서 다른 곡이 나오는지 확인 (랜덤이므로)
    let changed = false
    for (let i = 0; i < 20; i++) {
      act(() => {
        result.current.next()
      })
      if (result.current.currentTrack?.id !== initialTrack?.id) {
        changed = true
        break
      }
    }
    expect(changed).toBe(true)
  })

  it('setVolume()로 볼륨을 변경한다', () => {
    const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))

    act(() => {
      result.current.setVolume(0.8)
    })
    expect(result.current.volume).toBe(0.8)
  })

  it('localStorage에서 저장된 볼륨을 불러온다', () => {
    localStorageData['bgm_volume'] = '0.3'

    const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))
    expect(result.current.volume).toBe(0.3)
  })

  it('볼륨 변경 시 localStorage에 저장한다', () => {
    const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))

    act(() => {
      result.current.setVolume(0.7)
    })
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('bgm_volume', '0.7')
  })

  it('빈 플레이리스트에서 play/next는 아무것도 하지 않는다', async () => {
    const { result } = renderHook(() => useBgmPlayer({ playlist: [] }))

    await act(async () => {
      await result.current.play()
    })
    expect(result.current.isPlaying).toBe(false)

    act(() => {
      result.current.next()
    })
    expect(result.current.currentTrack).toBeNull()
  })

  it('하나의 트랙만 있을 때 next()는 같은 트랙을 다시 재생한다', () => {
    const singlePlaylist = [samplePlaylist[0]]
    const { result } = renderHook(() => useBgmPlayer({ playlist: singlePlaylist }))

    act(() => {
      result.current.next()
    })
    expect(result.current.currentTrack?.id).toBe(singlePlaylist[0].id)
  })

  it('localStorage에서 마지막 트랙 ID를 불러온다', () => {
    localStorageData['bgm_last_track_id'] = '2'

    const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))
    expect(result.current.currentTrack?.id).toBe(2)
  })

  describe('previous()', () => {
    it('이력이 없으면 previous()는 아무것도 하지 않는다', () => {
      const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))
      const initialTrack = result.current.currentTrack

      act(() => {
        result.current.previous()
      })
      expect(result.current.currentTrack?.id).toBe(initialTrack?.id)
    })

    it('next() 후 previous()로 이전 트랙으로 돌아간다', () => {
      const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))
      const firstTrack = result.current.currentTrack

      act(() => {
        result.current.next()
      })
      const secondTrack = result.current.currentTrack

      // next가 랜덤이므로 다를 수도 있지만, previous는 반드시 이전 트랙을 반환해야 함
      act(() => {
        result.current.previous()
      })
      expect(result.current.currentTrack?.id).toBe(firstTrack?.id)

      // previous 후 다시 next를 호출하면 이력의 다음 트랙으로 이동
      act(() => {
        result.current.next()
      })
      // 이력 내에서 앞으로 이동했으므로 secondTrack이어야 함
      expect(result.current.currentTrack?.id).toBe(secondTrack?.id)
    })

    it('여러 번 next() 후 previous()로 순서대로 되돌아간다', () => {
      const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))
      const track0 = result.current.currentTrack

      act(() => { result.current.next() })
      const track1 = result.current.currentTrack

      act(() => { result.current.next() })

      // 두 번 previous하면 처음 트랙으로 돌아감
      act(() => { result.current.previous() })
      expect(result.current.currentTrack?.id).toBe(track1?.id)

      act(() => { result.current.previous() })
      expect(result.current.currentTrack?.id).toBe(track0?.id)
    })

    it('이력 시작점에서 previous()는 아무것도 하지 않는다', () => {
      const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))
      const firstTrack = result.current.currentTrack

      act(() => { result.current.next() })
      act(() => { result.current.previous() })
      // 이제 첫 트랙
      expect(result.current.currentTrack?.id).toBe(firstTrack?.id)

      // 한 번 더 previous - 변하지 않아야 함
      act(() => { result.current.previous() })
      expect(result.current.currentTrack?.id).toBe(firstTrack?.id)
    })

    it('이력 중간에서 next()를 호출하면 새 이력이 추가된다', () => {
      const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))
      const track0 = result.current.currentTrack

      act(() => { result.current.next() })
      act(() => { result.current.next() })

      // 이력 중간으로 이동
      act(() => { result.current.previous() })
      act(() => { result.current.previous() })
      expect(result.current.currentTrack?.id).toBe(track0?.id)

      // 여기서 next()를 호출하면 새로운 랜덤 트랙이 이력에 추가됨
      act(() => { result.current.next() })
      const newTrack = result.current.currentTrack

      // previous로 다시 돌아가면 track0
      act(() => { result.current.previous() })
      expect(result.current.currentTrack?.id).toBe(track0?.id)

      // next로 다시 가면 newTrack
      act(() => { result.current.next() })
      expect(result.current.currentTrack?.id).toBe(newTrack?.id)
    })

    it('빈 플레이리스트에서 previous()는 아무것도 하지 않는다', () => {
      const { result } = renderHook(() => useBgmPlayer({ playlist: [] }))

      act(() => {
        result.current.previous()
      })
      expect(result.current.currentTrack).toBeNull()
    })
  })

  describe('canplay 기반 자동재생', () => {
    it('재생 중 next() 호출 후 canplay 이벤트 시 자동 재생된다', async () => {
      const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))

      // 재생 시작
      await act(async () => {
        await result.current.play()
      })
      expect(result.current.isPlaying).toBe(true)
      mockAudioInstance.play.mockClear()

      // next 호출
      act(() => {
        result.current.next()
      })

      // canplay 이벤트 발생 시 play() 호출되어야 함
      await act(async () => {
        mockAudioInstance.emit('canplay')
        // Promise 처리를 위해 한 틱 대기
        await Promise.resolve()
      })

      expect(mockAudioInstance.play).toHaveBeenCalled()
    })

    it('일시정지 상태에서 next() 호출 후 canplay 시 자동 재생하지 않는다', async () => {
      const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))

      // 재생하지 않은 상태에서 next
      expect(result.current.isPlaying).toBe(false)
      mockAudioInstance.play.mockClear()

      act(() => {
        result.current.next()
      })

      await act(async () => {
        mockAudioInstance.emit('canplay')
        await Promise.resolve()
      })

      // play()가 호출되지 않아야 함
      expect(mockAudioInstance.play).not.toHaveBeenCalled()
    })

    it('재생 중 previous() 호출 후 canplay 이벤트 시 자동 재생된다', async () => {
      const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))

      // 재생 시작 & next로 이력 생성
      await act(async () => {
        await result.current.play()
      })
      act(() => {
        result.current.next()
      })
      await act(async () => {
        mockAudioInstance.emit('canplay')
        await Promise.resolve()
      })

      mockAudioInstance.play.mockClear()

      // previous 호출
      act(() => {
        result.current.previous()
      })

      await act(async () => {
        mockAudioInstance.emit('canplay')
        await Promise.resolve()
      })

      expect(mockAudioInstance.play).toHaveBeenCalled()
    })

    it('canplay에서 play() 실패 시 isPlaying이 false가 된다', async () => {
      const { result } = renderHook(() => useBgmPlayer({ playlist: samplePlaylist }))

      // 재생 시작
      await act(async () => {
        await result.current.play()
      })
      expect(result.current.isPlaying).toBe(true)

      // play()가 실패하도록 설정
      mockAudioInstance.play.mockImplementationOnce(() => {
        return Promise.reject(new Error('Autoplay blocked'))
      })

      act(() => {
        result.current.next()
      })

      await act(async () => {
        mockAudioInstance.emit('canplay')
        await Promise.resolve()
      })

      expect(result.current.isPlaying).toBe(false)
    })
  })
})
