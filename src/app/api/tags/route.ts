import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { tagSchema } from '@/lib/validations/portfolio'

// GET: 모든 태그 조회
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { portfolios: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    // 사용 횟수 정보 포함
    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      count: tag._count.portfolios,
      createdAt: tag.createdAt,
    }))

    return NextResponse.json({ data: formattedTags })
  } catch (error) {
    console.error('태그 조회 오류:', error)
    return NextResponse.json(
      { error: '태그를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 태그 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const validation = tagSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, color } = validation.data

    // 중복 체크
    const existingTag = await prisma.tag.findUnique({
      where: { name },
    })

    if (existingTag) {
      return NextResponse.json(
        { error: '이미 존재하는 태그입니다.' },
        { status: 409 }
      )
    }

    const tag = await prisma.tag.create({
      data: { name, color },
    })

    return NextResponse.json({ data: tag })
  } catch (error) {
    console.error('태그 생성 오류:', error)
    return NextResponse.json(
      { error: '태그 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
