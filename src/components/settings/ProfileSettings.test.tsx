import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSuccess = vi.fn()
const mockShowError = vi.fn()
const mockUpdate = vi.fn()
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@/components/providers/ToastProvider', () => ({
  useToast: () => ({ success: mockSuccess, error: mockShowError }),
}))

vi.mock('@/components/ui/Icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}))

vi.mock('@/components/ui/Input', () => ({
  Input: ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) => (
    <div>
      {label && <label>{label}</label>}
      <input aria-label={label} {...props} />
    </div>
  ),
}))

vi.mock('@/components/ui/Textarea', () => ({
  Textarea: ({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) => (
    <div>
      {label && <label>{label}</label>}
      <textarea aria-label={label} {...props} />
    </div>
  ),
}))

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

import { useSession } from 'next-auth/react'
import { ProfileSettings } from './ProfileSettings'

describe('ProfileSettings', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    global.fetch = mockFetch
    mockUpdate.mockResolvedValue(undefined)
    mockCreateObjectURL.mockReturnValue('blob:http://localhost/mock-preview')
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '1', name: '테스터', email: 'test@test.com', role: 'user' },
        expires: '',
      },
      status: 'authenticated',
      update: mockUpdate,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mockSuccess.mockClear()
    mockShowError.mockClear()
    mockUpdate.mockClear()
    mockCreateObjectURL.mockClear()
    mockRevokeObjectURL.mockClear()
  })

  function mockInitialLoad(overrides: Record<string, unknown> = {}) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        nickname: '기존닉네임',
        bio: '기존소개',
        profileImage: null,
        ...overrides,
      }),
    })
  }

  it('마운트 시 /api/users/me에서 기존 프로필 데이터를 로드해야 함', async () => {
    mockInitialLoad({ bio: '기존 자기소개입니다' })

    render(<ProfileSettings />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/users/me')
    })

    await waitFor(() => {
      expect((screen.getByLabelText('닉네임') as HTMLInputElement).value).toBe('기존닉네임')
    })

    expect((screen.getByLabelText('자기소개') as HTMLTextAreaElement).value).toBe('기존 자기소개입니다')
  })

  it('저장 성공 후 응답 데이터로 폼이 업데이트되어야 함', async () => {
    const user = userEvent.setup()
    mockInitialLoad()

    render(<ProfileSettings />)

    await waitFor(() => {
      expect((screen.getByLabelText('닉네임') as HTMLInputElement).value).toBe('기존닉네임')
    })

    const nicknameInput = screen.getByLabelText('닉네임')
    await user.clear(nicknameInput)
    await user.type(nicknameInput, '새닉네임')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1, nickname: '새닉네임', bio: '기존소개', profileImage: null,
      }),
    })

    await user.click(screen.getByText('저장'))

    await waitFor(() => {
      expect((screen.getByLabelText('닉네임') as HTMLInputElement).value).toBe('새닉네임')
    })
  })

  it('마운트 시 서버 데이터만 로드하고 session에 의존하지 않아야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1, nickname: '서버닉네임', bio: '서버 자기소개',
        profileImage: '/uploads/server-image.png',
      }),
    })

    const { unmount } = render(<ProfileSettings />)

    await waitFor(() => {
      expect((screen.getByLabelText('닉네임') as HTMLInputElement).value).toBe('서버닉네임')
    })

    unmount()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1, nickname: '업데이트된닉네임', bio: '업데이트된 자기소개',
        profileImage: '/uploads/new-image.png',
      }),
    })

    render(<ProfileSettings />)

    await waitFor(() => {
      expect((screen.getByLabelText('닉네임') as HTMLInputElement).value).toBe('업데이트된닉네임')
    })
  })

  describe('프로필 이미지 선택 (브라우저 미리보기)', () => {
    function createMockFile() {
      return new File(['image-data'], 'profile.png', { type: 'image/png' })
    }

    it('파일 선택 시 서버 호출 없이 브라우저 미리보기(blob URL)만 표시해야 함', async () => {
      const user = userEvent.setup()
      mockInitialLoad()

      render(<ProfileSettings />)
      await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/users/me'))

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, createMockFile())

      // createObjectURL이 호출되어 미리보기 생성
      expect(mockCreateObjectURL).toHaveBeenCalled()

      // 미리보기 이미지가 blob URL로 표시됨
      await waitFor(() => {
        const img = screen.getByAltText('Profile') as HTMLImageElement
        expect(img.src).toContain('blob:')
      })

      // 서버 호출은 초기 로드(GET) 한 번만 — S3 업로드 없음
      const fetchCalls = mockFetch.mock.calls
      expect(fetchCalls).toHaveLength(1)
      expect(fetchCalls[0][0]).toBe('/api/users/me')
    })

    it('파일 선택 후 저장하지 않고 재마운트하면 기존 이미지가 복원되어야 함', async () => {
      const user = userEvent.setup()
      mockInitialLoad({ profileImage: 'https://minio.test/bucket/uploads/old.png' })

      const { unmount } = render(<ProfileSettings />)
      await waitFor(() => {
        const img = screen.getByAltText('Profile') as HTMLImageElement
        expect(img.src).toContain('old.png')
      })

      // 파일 선택 → blob 미리보기
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, createMockFile())

      await waitFor(() => {
        const img = screen.getByAltText('Profile') as HTMLImageElement
        expect(img.src).toContain('blob:')
      })

      // 저장하지 않고 언마운트
      unmount()

      // 재마운트: DB에서 기존 이미지 로드
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 1, nickname: '기존닉네임', bio: '기존소개',
          profileImage: 'https://minio.test/bucket/uploads/old.png',
        }),
      })

      render(<ProfileSettings />)

      await waitFor(() => {
        const img = screen.getByAltText('Profile') as HTMLImageElement
        expect(img.src).toContain('old.png')
      })
    })
  })

  describe('저장 버튼 (S3 업로드 + DB 반영)', () => {
    function createMockFile() {
      return new File(['image-data'], 'profile.png', { type: 'image/png' })
    }

    it('새 이미지 선택 후 저장하면 S3 업로드 → PATCH → 세션 갱신 순서로 처리해야 함', async () => {
      const user = userEvent.setup()
      mockInitialLoad()

      render(<ProfileSettings />)
      await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/users/me'))

      // 파일 선택 (미리보기만)
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, createMockFile())

      await waitFor(() => {
        expect(screen.getByAltText('Profile')).toBeTruthy()
      })

      // 저장 클릭 → 1) S3 업로드 응답 2) PATCH 응답
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ url: 'https://minio.test/bucket/uploads/new.png' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 1, nickname: '기존닉네임', bio: '기존소개',
            profileImage: 'https://minio.test/bucket/uploads/new.png',
          }),
        })

      await user.click(screen.getByText('저장'))

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith('프로필이 수정되었습니다')
      })

      // S3 업로드 호출 확인 (POST /api/upload)
      const uploadCall = mockFetch.mock.calls.find(
        (call) => call[0] === '/api/upload'
      )
      expect(uploadCall).toBeDefined()

      // PATCH에 S3 URL이 포함되어야 함
      const patchCall = mockFetch.mock.calls.find(
        (call) => call[1]?.method === 'PATCH'
      )
      expect(patchCall).toBeDefined()
      const body = JSON.parse(patchCall![1].body)
      expect(body.profileImage).toBe('https://minio.test/bucket/uploads/new.png')

      // 세션 갱신
      expect(mockUpdate).toHaveBeenCalled()

      // 저장 후 이미지가 S3 URL로 교체됨 (blob이 아님)
      await waitFor(() => {
        const img = screen.getByAltText('Profile') as HTMLImageElement
        expect(img.src).toContain('minio.test')
      })
    })

    it('저장 시 S3 업로드 실패하면 에러 표시하고 DB 저장 안 함', async () => {
      const user = userEvent.setup()
      mockInitialLoad()

      render(<ProfileSettings />)
      await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/users/me'))

      // 파일 선택
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, createMockFile())

      // 저장 클릭 → S3 업로드 실패
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: '업로드 실패' }),
      })

      await user.click(screen.getByText('저장'))

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('이미지 업로드에 실패했습니다')
      })

      // PATCH 호출 안 됨
      const patchCalls = mockFetch.mock.calls.filter(
        (call) => call[1]?.method === 'PATCH'
      )
      expect(patchCalls).toHaveLength(0)

      // 세션 갱신 안 됨
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('이미지 변경 없이 저장하면 S3 업로드 없이 PATCH만 해야 함', async () => {
      const user = userEvent.setup()
      mockInitialLoad({ profileImage: 'https://minio.test/bucket/uploads/existing.png' })

      render(<ProfileSettings />)
      await waitFor(() => {
        expect((screen.getByLabelText('닉네임') as HTMLInputElement).value).toBe('기존닉네임')
      })

      // PATCH 응답
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 1, nickname: '기존닉네임', bio: '기존소개',
          profileImage: 'https://minio.test/bucket/uploads/existing.png',
        }),
      })

      await user.click(screen.getByText('저장'))

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith('프로필이 수정되었습니다')
      })

      // S3 업로드 호출 없음
      const uploadCalls = mockFetch.mock.calls.filter(
        (call) => call[0] === '/api/upload'
      )
      expect(uploadCalls).toHaveLength(0)

      // PATCH에 기존 profileImage 포함
      const patchCall = mockFetch.mock.calls.find(
        (call) => call[1]?.method === 'PATCH'
      )
      const body = JSON.parse(patchCall![1].body)
      expect(body.profileImage).toBe('https://minio.test/bucket/uploads/existing.png')
    })

    it('저장 성공 후 세션 update()를 await 해야 함', async () => {
      const user = userEvent.setup()
      mockInitialLoad()

      render(<ProfileSettings />)
      await waitFor(() => {
        expect((screen.getByLabelText('닉네임') as HTMLInputElement).value).toBe('기존닉네임')
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 1, nickname: '기존닉네임', bio: '기존소개', profileImage: null,
        }),
      })

      await user.click(screen.getByText('저장'))

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled()
      })
    })
  })
})
