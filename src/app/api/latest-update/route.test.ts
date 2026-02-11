vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findFirst: vi.fn(),
    },
    diaryEntry: {
      findFirst: vi.fn(),
    },
    guestbookEntry: {
      findFirst: vi.fn(),
    },
    portfolio: {
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET } from './route'

describe('GET /api/latest-update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('모든 콘텐츠 중 가장 최신 날짜를 반환해야 함', async () => {
    const latestDate = new Date('2025-12-25T10:30:00Z')

    vi.mocked(prisma.post.findFirst).mockResolvedValue({
      updatedAt: new Date('2025-12-20T10:00:00Z'),
    } as never)
    vi.mocked(prisma.diaryEntry.findFirst).mockResolvedValue({
      updatedAt: latestDate,
    } as never)
    vi.mocked(prisma.guestbookEntry.findFirst).mockResolvedValue({
      updatedAt: new Date('2025-12-15T10:00:00Z'),
    } as never)
    vi.mocked(prisma.portfolio.findFirst).mockResolvedValue({
      updatedAt: new Date('2025-12-10T10:00:00Z'),
    } as never)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.latestUpdate).toBe(latestDate.toISOString())
  })

  it('게시글이 가장 최신인 경우 해당 날짜를 반환해야 함', async () => {
    const latestDate = new Date('2025-12-30T15:00:00Z')

    vi.mocked(prisma.post.findFirst).mockResolvedValue({
      updatedAt: latestDate,
    } as never)
    vi.mocked(prisma.diaryEntry.findFirst).mockResolvedValue({
      updatedAt: new Date('2025-12-01T10:00:00Z'),
    } as never)
    vi.mocked(prisma.guestbookEntry.findFirst).mockResolvedValue({
      updatedAt: new Date('2025-12-01T10:00:00Z'),
    } as never)
    vi.mocked(prisma.portfolio.findFirst).mockResolvedValue({
      updatedAt: new Date('2025-12-01T10:00:00Z'),
    } as never)

    const response = await GET()
    const data = await response.json()

    expect(data.latestUpdate).toBe(latestDate.toISOString())
  })

  it('데이터가 없는 경우 null을 반환해야 함', async () => {
    vi.mocked(prisma.post.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.diaryEntry.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.guestbookEntry.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.portfolio.findFirst).mockResolvedValue(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.latestUpdate).toBeNull()
  })

  it('일부 테이블에만 데이터가 있어도 정상 동작해야 함', async () => {
    const latestDate = new Date('2025-11-15T08:00:00Z')

    vi.mocked(prisma.post.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.diaryEntry.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.guestbookEntry.findFirst).mockResolvedValue({
      updatedAt: latestDate,
    } as never)
    vi.mocked(prisma.portfolio.findFirst).mockResolvedValue(null)

    const response = await GET()
    const data = await response.json()

    expect(data.latestUpdate).toBe(latestDate.toISOString())
  })

  it('삭제되지 않은 콘텐츠만 조회해야 함', async () => {
    vi.mocked(prisma.post.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.diaryEntry.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.guestbookEntry.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.portfolio.findFirst).mockResolvedValue(null)

    await GET()

    expect(prisma.post.findFirst).toHaveBeenCalledWith({
      where: { isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    })

    expect(prisma.guestbookEntry.findFirst).toHaveBeenCalledWith({
      where: { isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    })

    expect(prisma.portfolio.findFirst).toHaveBeenCalledWith({
      where: { isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    })
  })

  it('DB 에러 시 500을 반환해야 함', async () => {
    vi.mocked(prisma.post.findFirst).mockRejectedValue(new Error('DB error'))

    const response = await GET()

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })
})
