import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, parsePagination } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  try {
    const { session, error: authError } = await requireAdmin()
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePagination(searchParams)
    const search = searchParams.get('search') || ''

    const where = search
      ? {
          OR: [
            { email: { contains: search } },
            { nickname: { contains: search } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          nickname: true,
          profileImage: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('회원 목록 조회 오류:', error)
    return NextResponse.json({ error: '회원 목록 조회에 실패했습니다.' }, { status: 500 })
  }
}
