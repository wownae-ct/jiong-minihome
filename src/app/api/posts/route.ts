import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { postSchema, guestPostSchema } from '@/lib/validations/post'
import { parsePagination, formatZodError } from '@/lib/api/helpers'

const VALID_SEARCH_TYPES = ['title', 'content', 'author', 'titleComment'] as const

const POST_INCLUDE = {
  user: {
    select: {
      id: true,
      nickname: true,
      profileImage: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const

// GET: 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('search')
    const searchType = searchParams.get('searchType') || 'title'
    const { page, limit, skip } = parsePagination(searchParams)

    if (search && !VALID_SEARCH_TYPES.includes(searchType as typeof VALID_SEARCH_TYPES[number])) {
      return NextResponse.json(
        { error: '유효하지 않은 검색 유형입니다' },
        { status: 400 }
      )
    }

    const where: Prisma.PostWhereInput = {
      isDeleted: false,
    }

    if (categorySlug) {
      where.category = { slug: categorySlug }
    }

    if (search) {
      switch (searchType) {
        case 'title':
          where.title = { contains: search }
          break
        case 'content':
          where.content = { contains: search }
          break
        case 'author':
          where.OR = [
            { user: { nickname: { contains: search } } },
            { guestName: { contains: search } },
          ]
          break
        case 'titleComment':
          where.OR = [
            { title: { contains: search } },
            { comments: { some: { content: { contains: search }, isDeleted: false } } },
          ]
          break
      }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Posts GET error:', error)
    return NextResponse.json(
      { error: '게시글을 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST: 게시글 작성
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()

    const schema = session ? postSchema : guestPostSchema
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 })
    }

    const { title, content, categoryId, isPrivate } = result.data

    const category = await prisma.boardCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다' },
        { status: 400 }
      )
    }

    // 비회원인 경우 게스트 필드 처리
    const data = result.data as Record<string, unknown>
    const guestData = !session && 'guestName' in data
      ? {
          userId: null,
          guestName: data.guestName as string,
          guestPassword: await bcrypt.hash(data.guestPassword as string, 10),
        }
      : {
          userId: parseInt(session!.user.id),
        }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        categoryId,
        isPrivate: isPrivate || false,
        ...guestData,
      },
      include: POST_INCLUDE,
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Posts POST error:', error)
    return NextResponse.json(
      { error: '게시글 작성에 실패했습니다' },
      { status: 500 }
    )
  }
}
