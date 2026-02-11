import { NextRequest, NextResponse } from 'next/server'
import { parseId, parsePagination } from '@/lib/api/helpers'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { id: userId, error } = parseId(id)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePagination(searchParams, 10)

    const where = {
      userId,
      isDeleted: false,
      isPrivate: false,
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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
    console.error('User posts GET error:', error)
    return NextResponse.json(
      { error: '게시글을 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}
