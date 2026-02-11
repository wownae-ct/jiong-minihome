vi.mock('@/lib/prisma', () => ({
  prisma: {
    comment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET } from './route'
import { NextRequest } from 'next/server'

function createRequest(id: string, queryParams?: Record<string, string>) {
  const url = new URL(`http://localhost/api/users/${id}/comments`)
  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  return {
    request: new NextRequest(url),
    params: Promise.resolve({ id }),
  }
}

const mockComment = {
  id: 1,
  content: '댓글 내용입니다',
  depth: 0,
  likeCount: 1,
  createdAt: new Date('2024-06-15'),
  post: {
    id: 10,
    title: '관련 게시글 제목',
    category: { slug: 'free' },
  },
}

describe('GET /api/users/[id]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('사용자의 댓글 목록을 페이지네이션과 함께 반환해야 함', async () => {
    vi.mocked(prisma.comment.findMany).mockResolvedValue([mockComment] as never)
    vi.mocked(prisma.comment.count).mockResolvedValue(1)

    const { request, params } = createRequest('1')
    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.comments).toHaveLength(1)
    expect(data.comments[0].content).toBe('댓글 내용입니다')
    expect(data.comments[0].post.title).toBe('관련 게시글 제목')
    expect(data.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    })
  })

  it('isDeleted가 false인 댓글만 조회해야 함', async () => {
    vi.mocked(prisma.comment.findMany).mockResolvedValue([])
    vi.mocked(prisma.comment.count).mockResolvedValue(0)

    const { request, params } = createRequest('1')
    await GET(request, { params })

    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 1,
          isDeleted: false,
        }),
      })
    )
  })

  it('각 댓글에 게시글 제목과 ID가 포함되어야 함', async () => {
    vi.mocked(prisma.comment.findMany).mockResolvedValue([mockComment] as never)
    vi.mocked(prisma.comment.count).mockResolvedValue(1)

    const { request, params } = createRequest('1')
    const response = await GET(request, { params })
    const data = await response.json()

    expect(data.comments[0].post).toBeDefined()
    expect(data.comments[0].post.id).toBe(10)
    expect(data.comments[0].post.title).toBe('관련 게시글 제목')
    expect(data.comments[0].post.category.slug).toBe('free')
  })

  it('page와 limit 파라미터가 동작해야 함', async () => {
    vi.mocked(prisma.comment.findMany).mockResolvedValue([])
    vi.mocked(prisma.comment.count).mockResolvedValue(30)

    const { request, params } = createRequest('1', { page: '3', limit: '5' })
    const response = await GET(request, { params })
    const data = await response.json()

    expect(data.pagination).toEqual({
      page: 3,
      limit: 5,
      total: 30,
      totalPages: 6,
    })
    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
      })
    )
  })

  it('댓글이 createdAt 내림차순으로 정렬되어야 함', async () => {
    vi.mocked(prisma.comment.findMany).mockResolvedValue([])
    vi.mocked(prisma.comment.count).mockResolvedValue(0)

    const { request, params } = createRequest('1')
    await GET(request, { params })

    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    )
  })

  it('댓글이 없는 사용자는 빈 배열을 반환해야 함', async () => {
    vi.mocked(prisma.comment.findMany).mockResolvedValue([])
    vi.mocked(prisma.comment.count).mockResolvedValue(0)

    const { request, params } = createRequest('1')
    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.comments).toEqual([])
  })

  it('숫자가 아닌 ID는 400을 반환해야 함', async () => {
    const { request, params } = createRequest('abc')
    const response = await GET(request, { params })

    expect(response.status).toBe(400)
  })
})
