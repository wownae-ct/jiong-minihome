vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    boardCategory: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { GET, POST } from './route'
import { NextRequest } from 'next/server'

function createRequest(queryParams?: Record<string, string>) {
  const url = new URL('http://localhost/api/posts')
  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  return new NextRequest(url)
}

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/posts - 검색 기능', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.post.findMany).mockResolvedValue([])
    vi.mocked(prisma.post.count).mockResolvedValue(0)
  })

  it('검색 파라미터 없이 기존 동작대로 동작해야 함', async () => {
    const response = await GET(createRequest())

    expect(response.status).toBe(200)
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
        }),
      })
    )
  })

  it('search + searchType=title: 제목으로 검색해야 함', async () => {
    await GET(createRequest({ search: '테스트', searchType: 'title' }))

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
          title: { contains: '테스트' },
        }),
      })
    )
  })

  it('search + searchType=content: 내용으로 검색해야 함', async () => {
    await GET(createRequest({ search: '내용검색', searchType: 'content' }))

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
          content: { contains: '내용검색' },
        }),
      })
    )
  })

  it('search + searchType=author: 작성자 닉네임 또는 guestName으로 검색해야 함', async () => {
    await GET(createRequest({ search: '홍길동', searchType: 'author' }))

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
          OR: [
            { user: { nickname: { contains: '홍길동' } } },
            { guestName: { contains: '홍길동' } },
          ],
        }),
      })
    )
  })

  it('search + searchType=titleComment: 제목 OR 댓글로 검색해야 함', async () => {
    await GET(createRequest({ search: '키워드', searchType: 'titleComment' }))

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
          OR: [
            { title: { contains: '키워드' } },
            { comments: { some: { content: { contains: '키워드' }, isDeleted: false } } },
          ],
        }),
      })
    )
  })

  it('검색과 카테고리를 동시에 사용할 수 있어야 함', async () => {
    await GET(createRequest({ search: '테스트', searchType: 'title', category: 'free' }))

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
          title: { contains: '테스트' },
          category: { slug: 'free' },
        }),
      })
    )
  })

  it('빈 search 문자열이면 검색 필터를 적용하지 않아야 함', async () => {
    await GET(createRequest({ search: '', searchType: 'title' }))

    const call = vi.mocked(prisma.post.findMany).mock.calls[0][0]
    expect((call as { where: Record<string, unknown> }).where).not.toHaveProperty('title')
  })

  it('searchType 기본값은 title이어야 함', async () => {
    await GET(createRequest({ search: '기본검색' }))

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { contains: '기본검색' },
        }),
      })
    )
  })

  it('유효하지 않은 searchType은 400을 반환해야 함', async () => {
    const response = await GET(createRequest({ search: '테스트', searchType: 'invalid' }))

    expect(response.status).toBe(400)
  })

  it('검색 결과가 페이지네이션과 함께 반환되어야 함', async () => {
    vi.mocked(prisma.post.count).mockResolvedValue(15)

    const response = await GET(createRequest({ search: '테스트', searchType: 'title', page: '2', limit: '5' }))
    const data = await response.json()

    expect(data.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 15,
      totalPages: 3,
    })
  })
})

describe('POST /api/posts - 게시글 작성', () => {
  const mockCategory = { id: 1, name: '자유게시판', slug: 'free' }
  const mockPost = {
    id: 1,
    title: '테스트 글',
    content: '테스트 내용',
    categoryId: 1,
    userId: 1,
    guestName: null,
    guestPassword: null,
    isPrivate: false,
    user: { id: 1, nickname: '테스트유저', profileImage: null },
    category: mockCategory,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.boardCategory.findUnique).mockResolvedValue(mockCategory as never)
    vi.mocked(prisma.post.create).mockResolvedValue(mockPost as never)
  })

  it('로그인된 사용자가 게시글을 작성할 수 있어야 함', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', email: 'test@test.com', name: '테스트유저', role: 'user' },
      expires: '',
    } as never)

    const response = await POST(createPostRequest({
      title: '테스트 글',
      content: '테스트 내용',
      categoryId: 1,
    }))

    expect(response.status).toBe(201)
    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: '테스트 글',
          content: '테스트 내용',
          categoryId: 1,
          userId: 1,
        }),
      })
    )
  })

  it('비로그인 사용자가 닉네임과 비밀번호로 게시글을 작성할 수 있어야 함', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const guestPost = { ...mockPost, userId: null, guestName: '익명유저', guestPassword: 'hashed_password', user: null }
    vi.mocked(prisma.post.create).mockResolvedValue(guestPost as never)

    const response = await POST(createPostRequest({
      title: '익명 글',
      content: '익명 내용',
      categoryId: 1,
      guestName: '익명유저',
      guestPassword: 'pass1234',
    }))

    expect(response.status).toBe(201)
    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: '익명 글',
          content: '익명 내용',
          categoryId: 1,
          userId: null,
          guestName: '익명유저',
          guestPassword: 'hashed_password',
        }),
      })
    )
  })

  it('비로그인 사용자가 닉네임 없이 게시글 작성 시 400 반환', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const response = await POST(createPostRequest({
      title: '익명 글',
      content: '익명 내용',
      categoryId: 1,
    }))

    expect(response.status).toBe(400)
  })

  it('비로그인 사용자가 비밀번호 없이 게시글 작성 시 400 반환', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const response = await POST(createPostRequest({
      title: '익명 글',
      content: '익명 내용',
      categoryId: 1,
      guestName: '익명유저',
    }))

    expect(response.status).toBe(400)
  })

  it('존재하지 않는 카테고리로 작성 시 400 반환', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', email: 'test@test.com', name: '테스트유저', role: 'user' },
      expires: '',
    } as never)
    vi.mocked(prisma.boardCategory.findUnique).mockResolvedValue(null)

    const response = await POST(createPostRequest({
      title: '테스트',
      content: '내용',
      categoryId: 999,
    }))

    expect(response.status).toBe(400)
  })
})
