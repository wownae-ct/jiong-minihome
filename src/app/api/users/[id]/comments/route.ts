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
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          post: {
            select: {
              id: true,
              title: true,
              category: {
                select: { slug: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ])

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('User comments GET error:', error)
    return NextResponse.json(
      { error: '댓글을 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}
