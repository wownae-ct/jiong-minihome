vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET } from './route'
import { NextRequest } from 'next/server'

function createRequest(id: string, queryParams?: Record<string, string>) {
  const url = new URL(`http://localhost/api/users/${id}/posts`)
  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  return {
    request: new NextRequest(url),
    params: Promise.resolve({ id }),
  }
}

const mockPost = {
  id: 1,
  title: '테스트 게시글',
  content: '내용입니다',
  viewCount: 10,
  likeCount: 3,
  commentCount: 2,
  isPinned: false,
  isPrivate: false,
  createdAt: new Date('2024-06-01'),
  category: { id: 1, name: '자유게시판', slug: 'free' },
}

describe('GET /api/users/[id]/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('사용자의 게시글 목록을 페이지네이션과 함께 반환해야 함', async () => {
    vi.mocked(prisma.post.findMany).mockResolvedValue([mockPost] as never)
    vi.mocked(prisma.post.count).mockResolvedValue(1)

    const { request, params } = createRequest('1')
    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toHaveLength(1)
    expect(data.posts[0].title).toBe('테스트 게시글')
    expect(data.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    })
  })

  it('isDeleted가 false이고 isPrivate가 false인 게시글만 조회해야 함', async () => {
    vi.mocked(prisma.post.findMany).mockResolvedValue([])
    vi.mocked(prisma.post.count).mockResolvedValue(0)

    const { request, params } = createRequest('1')
    await GET(request, { params })

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 1,
          isDeleted: false,
          isPrivate: false,
        }),
      })
    )
  })

  it('page와 limit 파라미터가 동작해야 함', async () => {
    vi.mocked(prisma.post.findMany).mockResolvedValue([])
    vi.mocked(prisma.post.count).mockResolvedValue(25)

    const { request, params } = createRequest('1', { page: '2', limit: '5' })
    const response = await GET(request, { params })
    const data = await response.json()

    expect(data.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 25,
      totalPages: 5,
    })
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      })
    )
  })

  it('게시글이 createdAt 내림차순으로 정렬되어야 함', async () => {
    vi.mocked(prisma.post.findMany).mockResolvedValue([])
    vi.mocked(prisma.post.count).mockResolvedValue(0)

    const { request, params } = createRequest('1')
    await GET(request, { params })

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    )
  })

  it('게시글이 없는 사용자는 빈 배열을 반환해야 함', async () => {
    vi.mocked(prisma.post.findMany).mockResolvedValue([])
    vi.mocked(prisma.post.count).mockResolvedValue(0)

    const { request, params } = createRequest('1')
    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toEqual([])
  })

  it('숫자가 아닌 ID는 400을 반환해야 함', async () => {
    const { request, params } = createRequest('abc')
    const response = await GET(request, { params })

    expect(response.status).toBe(400)
  })
})
