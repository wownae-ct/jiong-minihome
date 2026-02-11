vi.mock('@/lib/prisma', () => ({
  prisma: {
    diaryEntry: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { GET } from './route'

describe('GET /api/diary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.diaryEntry.findMany).mockResolvedValue([])
  })

  it('비인증 사용자는 공개 다이어리만 조회해야 함', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    await GET()

    expect(prisma.diaryEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
      })
    )

    const callArgs = vi.mocked(prisma.diaryEntry.findMany).mock.calls[0][0]
    expect(callArgs).not.toHaveProperty('take')
  })

  it('일반 사용자도 공개 다이어리만 조회해야 함', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '2', role: 'user', name: 'user' },
      expires: '',
    })

    await GET()

    expect(prisma.diaryEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublic: true },
      })
    )
  })

  it('관리자는 모든 다이어리(비공개 포함)를 조회해야 함', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', role: 'admin', name: 'admin' },
      expires: '',
    })

    await GET()

    expect(prisma.diaryEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: { createdAt: 'desc' },
      })
    )
  })

  it('빈 배열일 때 200 응답을 반환해야 함', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(prisma.diaryEntry.findMany).mockResolvedValue([])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })
})
