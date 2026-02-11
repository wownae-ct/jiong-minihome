import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@/components/ui/Icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}))

vi.mock('@/components/providers/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

import { useSession } from 'next-auth/react'
import { AnnouncementBanner } from './AnnouncementBanner'

describe('AnnouncementBanner', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    global.fetch = mockFetch
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('공지사항이 없으면 렌더링하지 않아야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ title: '', content: '' }),
    })

    const { container } = render(<AnnouncementBanner />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/announcement')
    })

    // 빈 공지사항은 표시 안 함
    await waitFor(() => {
      expect(container.textContent).toBe('')
    })
  })

  it('공지사항이 있으면 제목을 한 줄로 표시해야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        title: '서버 점검 안내',
        content: '2월 15일 오전 2시~6시 서버 점검이 예정되어 있습니다.',
      }),
    })

    render(<AnnouncementBanner />)

    await waitFor(() => {
      expect(screen.getByText('서버 점검 안내')).toBeInTheDocument()
    })

    // 상세 내용은 기본적으로 보이지 않아야 함
    expect(screen.queryByText(/2월 15일/)).not.toBeInTheDocument()
  })

  it('공지사항 wrapper에 pt-4 간격이 있어야 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        title: '간격 테스트',
        content: '내용',
      }),
    })

    const { container } = render(<AnnouncementBanner />)

    await waitFor(() => {
      expect(screen.getByText('간격 테스트')).toBeInTheDocument()
    })

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('pt-4')
  })

  it('공지사항 클릭 시 상세 내용이 펼쳐져야 함', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        title: '서버 점검 안내',
        content: '2월 15일 오전 2시~6시 서버 점검이 예정되어 있습니다.',
      }),
    })

    render(<AnnouncementBanner />)

    await waitFor(() => {
      expect(screen.getByText('서버 점검 안내')).toBeInTheDocument()
    })

    // 클릭하여 펼치기
    await user.click(screen.getByText('서버 점검 안내'))

    await waitFor(() => {
      expect(screen.getByText('2월 15일 오전 2시~6시 서버 점검이 예정되어 있습니다.')).toBeInTheDocument()
    })
  })

  it('다시 클릭하면 상세 내용이 접혀야 함', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        title: '서버 점검 안내',
        content: '상세 내용입니다.',
      }),
    })

    render(<AnnouncementBanner />)

    await waitFor(() => {
      expect(screen.getByText('서버 점검 안내')).toBeInTheDocument()
    })

    // 펼치기
    await user.click(screen.getByText('서버 점검 안내'))
    expect(screen.getByText('상세 내용입니다.')).toBeInTheDocument()

    // 접기
    await user.click(screen.getByText('서버 점검 안내'))
    expect(screen.queryByText('상세 내용입니다.')).not.toBeInTheDocument()
  })
})
