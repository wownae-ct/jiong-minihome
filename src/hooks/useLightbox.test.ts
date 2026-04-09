import { renderHook, act } from '@testing-library/react'
import { useLightbox } from './useLightbox'

// PhotoSwipe 모듈 mock
const mockInit = vi.fn()
const mockLoadAndOpen = vi.fn()
const mockDestroy = vi.fn()
const mockConstructor = vi.fn()

class MockPhotoSwipeLightbox {
  constructor(options: unknown) {
    mockConstructor(options)
  }
  init = mockInit
  loadAndOpen = mockLoadAndOpen
  destroy = mockDestroy
}

vi.mock('photoswipe/lightbox', () => ({
  default: MockPhotoSwipeLightbox,
}))

vi.mock('photoswipe', () => ({
  default: {},
}))

// window.Image mock — measureImage 유틸에서 사용
class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  naturalWidth = 0
  naturalHeight = 0
  private _src = ''

  set src(value: string) {
    this._src = value
    // 비동기로 로드 완료 시뮬레이션
    queueMicrotask(() => {
      if (this._src.includes('fail')) {
        this.onerror?.()
      } else {
        this.naturalWidth = 1600
        this.naturalHeight = 900
        this.onload?.()
      }
    })
  }

  get src() {
    return this._src
  }
}

describe('useLightbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-expect-error — test override
    global.Image = MockImage
  })

  it('초기 상태에서는 lightbox 인스턴스가 없다', () => {
    const { result } = renderHook(() => useLightbox())
    expect(result.current.openLightbox).toBeInstanceOf(Function)
  })

  it('openLightbox 호출 시 PhotoSwipeLightbox가 생성되고 init + loadAndOpen이 호출된다', async () => {
    const { result } = renderHook(() => useLightbox())

    await act(async () => {
      await result.current.openLightbox({
        src: 'https://example.com/image.jpg',
        alt: 'Test image',
      })
    })

    expect(mockConstructor).toHaveBeenCalledTimes(1)
    expect(mockInit).toHaveBeenCalledTimes(1)
    expect(mockLoadAndOpen).toHaveBeenCalledWith(0)
  })

  it('dataSource에 src, alt, width, height가 포함된다', async () => {
    const { result } = renderHook(() => useLightbox())

    await act(async () => {
      await result.current.openLightbox({
        src: 'https://example.com/image.jpg',
        alt: 'My pic',
      })
    })

    expect(mockConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        dataSource: [
          expect.objectContaining({
            src: 'https://example.com/image.jpg',
            alt: 'My pic',
            width: 1600,
            height: 900,
          }),
        ],
      })
    )
  })

  it('alt가 생략되면 빈 문자열로 전달된다', async () => {
    const { result } = renderHook(() => useLightbox())

    await act(async () => {
      await result.current.openLightbox({ src: 'https://example.com/image.jpg' })
    })

    expect(mockConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        dataSource: [expect.objectContaining({ alt: '' })],
      })
    )
  })

  it('이미지 로드 실패 시 fallback 사이즈가 사용된다', async () => {
    const { result } = renderHook(() => useLightbox())

    await act(async () => {
      await result.current.openLightbox({
        src: 'https://example.com/fail.jpg',
      })
    })

    expect(mockConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        dataSource: [
          expect.objectContaining({
            width: 1920,
            height: 1080,
          }),
        ],
      })
    )
  })

  it('두 번째 openLightbox 호출 시 이전 인스턴스가 destroy된다', async () => {
    const { result } = renderHook(() => useLightbox())

    await act(async () => {
      await result.current.openLightbox({ src: 'https://example.com/a.jpg' })
    })
    expect(mockDestroy).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.openLightbox({ src: 'https://example.com/b.jpg' })
    })

    expect(mockDestroy).toHaveBeenCalledTimes(1)
    expect(mockConstructor).toHaveBeenCalledTimes(2)
  })

  it('hook unmount 시 마지막 인스턴스가 destroy된다', async () => {
    const { result, unmount } = renderHook(() => useLightbox())

    await act(async () => {
      await result.current.openLightbox({ src: 'https://example.com/a.jpg' })
    })

    unmount()
    expect(mockDestroy).toHaveBeenCalledTimes(1)
  })

  it('opener 생성 옵션에 closeOnVerticalDrag 등 모바일 친화 옵션이 포함된다', async () => {
    const { result } = renderHook(() => useLightbox())

    await act(async () => {
      await result.current.openLightbox({ src: 'https://example.com/a.jpg' })
    })

    expect(mockConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        closeOnVerticalDrag: true,
      })
    )
  })
})
