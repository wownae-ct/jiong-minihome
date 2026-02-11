vi.mock('@/lib/prisma', () => ({
  prisma: {
    visitorStat: {
      upsert: vi.fn(),
      aggregate: vi.fn(),
    },
    visitorLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { GET, POST } from './route'
import { NextRequest } from 'next/server'

function createPostRequest(body: Record<string, unknown>, headers?: Record<string, string>) {
  return new NextRequest('http://localhost/api/stats/visitors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('GET /api/stats/visitors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('오늘 방문자 수와 전체 방문자 수를 반환해야 함', async () => {
    vi.mocked(prisma.visitorStat.upsert).mockResolvedValue({
      id: 1,
      visitDate: new Date(),
      totalCount: 15,
      uniqueCount: 10,
    } as never)
    vi.mocked(prisma.visitorStat.aggregate).mockResolvedValue({
      _sum: { totalCount: 1234 },
    } as never)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      today: 15,
      total: 1234,
    })
  })

  it('전체 통계가 null일 때 0을 반환해야 함', async () => {
    vi.mocked(prisma.visitorStat.upsert).mockResolvedValue({
      id: 1,
      visitDate: new Date(),
      totalCount: 0,
      uniqueCount: 0,
    } as never)
    vi.mocked(prisma.visitorStat.aggregate).mockResolvedValue({
      _sum: { totalCount: null },
    } as never)

    const response = await GET()
    const data = await response.json()

    expect(data.total).toBe(0)
  })

  it('DB 에러 시 500을 반환해야 함', async () => {
    vi.mocked(prisma.visitorStat.upsert).mockRejectedValue(new Error('DB error'))

    const response = await GET()

    expect(response.status).toBe(500)
  })
})

describe('POST /api/stats/visitors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(null as never)
    vi.mocked(prisma.visitorLog.create).mockResolvedValue({} as never)
    vi.mocked(prisma.visitorLog.findFirst).mockResolvedValue(null as never)
    vi.mocked(prisma.visitorStat.upsert).mockResolvedValue({} as never)
  })

  it('방문 로그를 기록하고 성공을 반환해야 함', async () => {
    const request = createPostRequest(
      { pagePath: '/intro' },
      { 'x-forwarded-for': '1.2.3.4' }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.visitorLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          visitorIp: '1.2.3.4',
          pagePath: '/intro',
        }),
      })
    )
  })

  it('로그인 사용자의 userId를 기록해야 함', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '5', email: 'test@test.com', name: '테스터', role: 'user' },
      expires: '',
    } as never)

    const request = createPostRequest({ pagePath: '/' })

    await POST(request)

    expect(prisma.visitorLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 5,
        }),
      })
    )
  })

  it('첫 방문 시 uniqueCount가 증가해야 함', async () => {
    vi.mocked(prisma.visitorLog.findFirst).mockResolvedValue(null as never)

    const request = createPostRequest(
      { pagePath: '/' },
      { 'x-forwarded-for': '1.2.3.4' }
    )

    await POST(request)

    expect(prisma.visitorStat.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          totalCount: { increment: 1 },
          uniqueCount: { increment: 1 },
        }),
      })
    )
  })

  it('pagePath가 없으면 기본값 "/"를 사용해야 함', async () => {
    const request = createPostRequest({})

    await POST(request)

    expect(prisma.visitorLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pagePath: '/',
        }),
      })
    )
  })

  it('DB 에러 시 500을 반환해야 함', async () => {
    vi.mocked(prisma.visitorLog.create).mockRejectedValue(new Error('DB error'))

    const request = createPostRequest({ pagePath: '/' })
    const response = await POST(request)

    expect(response.status).toBe(500)
  })
})
