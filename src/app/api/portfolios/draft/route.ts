import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST: 새 포트폴리오 임시 저장 (아직 생성되지 않은 경우)
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

    // 새 임시 저장 포트폴리오 생성
    const portfolio = await prisma.portfolio.create({
      data: {
        userId: Number(session.user.id),
        title: body.title || '임시 저장',
        content: body.content || '',
        description: body.description || null,
        image: body.image || null,
        githubUrl: body.githubUrl || null,
        notionUrl: body.notionUrl || null,
        featured: body.featured || false,
        isDraft: true,
        draftData: JSON.stringify(body),
        draftAt: new Date(),
      },
    })

    return NextResponse.json({
      data: {
        id: portfolio.id,
        draftData: body,
        draftAt: portfolio.draftAt,
      },
    })
  } catch (error) {
    console.error('임시 저장 오류:', error)
    return NextResponse.json(
      { error: '임시 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// GET: 임시 저장된 포트폴리오 목록 조회
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const drafts = await prisma.portfolio.findMany({
      where: {
        userId: Number(session.user.id),
        isDraft: true,
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        draftData: true,
        draftAt: true,
      },
      orderBy: { draftAt: 'desc' },
    })

    return NextResponse.json({
      data: drafts.map((draft) => ({
        ...draft,
        draftData: draft.draftData ? JSON.parse(draft.draftData) : null,
      })),
    })
  } catch (error) {
    console.error('임시 저장 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '임시 저장 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
