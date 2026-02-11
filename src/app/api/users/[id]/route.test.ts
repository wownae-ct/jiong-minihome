vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET } from './route'
import { NextRequest } from 'next/server'

function createRequest(id: string) {
  return {
    request: new NextRequest(`http://localhost/api/users/${id}`),
    params: Promise.resolve({ id }),
  }
}

describe('GET /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('유효한 사용자의 공개 프로필을 반환해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      nickname: '테스트유저',
      profileImage: 'https://example.com/image.jpg',
      bio: '안녕하세요 자기소개입니다',
      createdAt: new Date('2024-01-01'),
      _count: { posts: 5, comments: 10 },
    } as never)

    const { request, params } = createRequest('1')
    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(1)
    expect(data.nickname).toBe('테스트유저')
    expect(data.profileImage).toBe('https://example.com/image.jpg')
    expect(data.bio).toBe('안녕하세요 자기소개입니다')
    expect(data.postCount).toBe(5)
    expect(data.commentCount).toBe(10)
    expect(data.createdAt).toBeDefined()
  })

  it('민감 정보(email, passwordHash)가 포함되지 않아야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      nickname: '테스트유저',
      profileImage: null,
      bio: null,
      createdAt: new Date('2024-01-01'),
      _count: { posts: 0, comments: 0 },
    } as never)

    const { request, params } = createRequest('1')
    const response = await GET(request, { params })
    const data = await response.json()

    expect(data.email).toBeUndefined()
    expect(data.passwordHash).toBeUndefined()
    expect(data.role).toBeUndefined()
  })

  it('존재하지 않는 사용자는 404를 반환해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const { request, params } = createRequest('999')
    const response = await GET(request, { params })

    expect(response.status).toBe(404)
  })

  it('숫자가 아닌 ID는 400을 반환해야 함', async () => {
    const { request, params } = createRequest('abc')
    const response = await GET(request, { params })

    expect(response.status).toBe(400)
  })

  it('profileImage가 null이면 null을 반환해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 2,
      nickname: '사용자2',
      profileImage: null,
      bio: null,
      createdAt: new Date('2024-06-01'),
      _count: { posts: 0, comments: 0 },
    } as never)

    const { request, params } = createRequest('2')
    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.profileImage).toBeNull()
    expect(data.bio).toBeNull()
  })
})
