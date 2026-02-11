vi.mock('@/lib/prisma', () => ({
  prisma: {
    diaryEntry: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { PUT, DELETE, GET } from './route'

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/diary/1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('PUT /api/diary/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('관리자가 유효한 데이터로 다이어리를 수정할 수 있다', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', role: 'admin', name: 'admin' },
      expires: '',
    })

    vi.mocked(prisma.diaryEntry.findUnique).mockResolvedValue({
      id: 1,
      userId: 1,
      title: '기존 제목',
      content: '기존 내용',
      mood: 'happy',
      weather: 'sunny',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    vi.mocked(prisma.diaryEntry.update).mockResolvedValue({
      id: 1,
      userId: 1,
      title: '수정된 제목',
      content: '수정된 내용',
      mood: 'sad',
      weather: 'rainy',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { nickname: 'admin' },
    } as never)

    const request = createRequest({
      title: '수정된 제목',
      content: '수정된 내용',
      mood: 'sad',
      weather: 'rainy',
      isPublic: false,
    })

    const response = await PUT(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.title).toBe('수정된 제목')
    expect(prisma.diaryEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          title: '수정된 제목',
          content: '수정된 내용',
          mood: 'sad',
          weather: 'rainy',
          isPublic: false,
        }),
      })
    )
  })

  it('isPublic만 토글해도 성공해야 한다', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', role: 'admin', name: 'admin' },
      expires: '',
    })

    vi.mocked(prisma.diaryEntry.findUnique).mockResolvedValue({
      id: 1,
      userId: 1,
      title: '제목',
      content: '내용',
      mood: null,
      weather: null,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    vi.mocked(prisma.diaryEntry.update).mockResolvedValue({
      id: 1,
      userId: 1,
      title: '제목',
      content: '내용',
      mood: null,
      weather: null,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { nickname: 'admin' },
    } as never)

    const request = createRequest({ isPublic: false })
    const response = await PUT(request, createParams('1'))

    expect(response.status).toBe(200)
    expect(prisma.diaryEntry.update).toHaveBeenCalled()
  })

  it('비인증 사용자는 401을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createRequest({ content: '수정' })
    const response = await PUT(request, createParams('1'))

    expect(response.status).toBe(401)
  })

  it('비관리자는 403을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '2', role: 'user', name: 'user' },
      expires: '',
    })

    const request = createRequest({ content: '수정' })
    const response = await PUT(request, createParams('1'))

    expect(response.status).toBe(403)
  })

  it('잘못된 ID는 400을 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', role: 'admin', name: 'admin' },
      expires: '',
    })

    const request = createRequest({ content: '수정' })
    const response = await PUT(request, createParams('abc'))

    expect(response.status).toBe(400)
  })

  it('존재하지 않는 다이어리는 404를 반환한다', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', role: 'admin', name: 'admin' },
      expires: '',
    })

    vi.mocked(prisma.diaryEntry.findUnique).mockResolvedValue(null)

    const request = createRequest({ content: '수정' })
    const response = await PUT(request, createParams('999'))

    expect(response.status).toBe(404)
  })
})
