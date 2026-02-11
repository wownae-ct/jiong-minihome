import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BgmSettings } from './BgmSettings'

// Mock ToastProvider
const mockSuccess = vi.fn()
const mockShowError = vi.fn()
vi.mock('@/components/providers/ToastProvider', () => ({
  useToast: () => ({ success: mockSuccess, error: mockShowError }),
}))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const mockTracks = [
  {
    id: 1,
    title: '바람, 어디에서 부는지',
    artist: 'Lucid Fall',
    url: '/uploads/song1.mp3',
    originalName: 'song1.mp3',
    filename: 'uuid-song1.mp3',
    duration: 222,
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 2,
    title: '봄날',
    artist: 'BTS',
    url: '/uploads/song2.mp3',
    originalName: 'song2.mp3',
    filename: 'uuid-song2.mp3',
    duration: 274,
    isActive: false,
    sortOrder: 1,
  },
]

describe('BgmSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 기본: GET /api/bgm?all=true가 트랙 목록 반환
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/bgm?all=true') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTracks),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  it('"BGM 관리" 제목을 표시한다', async () => {
    render(<BgmSettings />)
    await waitFor(() => {
      expect(screen.getByText('BGM 관리')).toBeInTheDocument()
    })
  })

  it('트랙 목록을 로드하고 표시한다', async () => {
    render(<BgmSettings />)
    await waitFor(() => {
      expect(screen.getByText('바람, 어디에서 부는지')).toBeInTheDocument()
      expect(screen.getByText('봄날')).toBeInTheDocument()
    })
  })

  it('트랙이 없으면 빈 상태 메시지를 표시한다', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/bgm?all=true') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })

    render(<BgmSettings />)
    await waitFor(() => {
      expect(screen.getByText(/등록된 BGM이 없습니다/)).toBeInTheDocument()
    })
  })

  it('삭제 버튼 클릭 시 DELETE 요청을 보낸다', async () => {
    const user = userEvent.setup()

    render(<BgmSettings />)
    await waitFor(() => {
      expect(screen.getByText('바람, 어디에서 부는지')).toBeInTheDocument()
    })

    // 삭제 확인 모달 없이 바로 삭제
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url === '/api/bgm/1' && options?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) })
      }
      if (url === '/api/bgm?all=true') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockTracks[1]]),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })

    const deleteButtons = screen.getAllByLabelText('삭제')
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/bgm/1', expect.objectContaining({ method: 'DELETE' }))
    })
  })

  it('업로드 폼이 제목, 아티스트 입력 필드와 파일 선택을 포함한다', async () => {
    render(<BgmSettings />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('곡 제목')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('아티스트 (선택)')).toBeInTheDocument()
    })
  })
})
