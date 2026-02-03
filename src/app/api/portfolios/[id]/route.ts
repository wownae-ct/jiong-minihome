import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { portfolioUpdateSchema } from '@/lib/validations/portfolio'

interface Params {
  params: Promise<{ id: string }>
}

// GET: 포트폴리오 상세 조회
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const portfolioId = parseInt(id, 10)

    if (isNaN(portfolioId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId, isDeleted: false },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    })

    if (!portfolio) {
      return NextResponse.json(
        { error: '포트폴리오를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        ...portfolio,
        tags: portfolio.tags.map((pt) => pt.tag.name),
      },
    })
  } catch (error) {
    console.error('포트폴리오 조회 오류:', error)
    return NextResponse.json(
      { error: '포트폴리오를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 포트폴리오 수정 (관리자 전용)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { id } = await params
    const portfolioId = parseInt(id, 10)

    if (isNaN(portfolioId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }

    const body = await request.json()
    const validation = portfolioUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { tags, ...portfolioData } = validation.data

    // 기존 포트폴리오 확인
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId, isDeleted: false },
    })

    if (!existingPortfolio) {
      return NextResponse.json(
        { error: '포트폴리오를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 트랜잭션으로 포트폴리오와 태그 업데이트
    await prisma.$transaction(async (tx) => {
      // 포트폴리오 업데이트
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: {
          ...portfolioData,
          githubUrl: portfolioData.githubUrl || null,
          notionUrl: portfolioData.notionUrl || null,
        },
      })

      // 태그 업데이트 (기존 태그 삭제 후 재생성)
      if (tags !== undefined) {
        // 기존 태그 연결 삭제
        await tx.portfolioTag.deleteMany({
          where: { portfolioId },
        })

        // 새 태그 연결
        for (const tagName of tags) {
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            create: { name: tagName },
            update: {},
          })

          await tx.portfolioTag.create({
            data: {
              portfolioId,
              tagId: tag.id,
            },
          })
        }
      }
    })

    // 업데이트된 포트폴리오 조회
    const updatedPortfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({
      data: {
        ...updatedPortfolio,
        tags: updatedPortfolio?.tags.map((pt) => pt.tag.name) || [],
      },
    })
  } catch (error) {
    console.error('포트폴리오 수정 오류:', error)
    return NextResponse.json(
      { error: '포트폴리오 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 포트폴리오 삭제 (관리자 전용, 소프트 삭제)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { id } = await params
    const portfolioId = parseInt(id, 10)

    if (isNaN(portfolioId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }

    // 기존 포트폴리오 확인
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId, isDeleted: false },
    })

    if (!existingPortfolio) {
      return NextResponse.json(
        { error: '포트폴리오를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 소프트 삭제
    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('포트폴리오 삭제 오류:', error)
    return NextResponse.json(
      { error: '포트폴리오 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
