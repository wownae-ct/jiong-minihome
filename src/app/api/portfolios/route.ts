import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { portfolioCreateSchema } from '@/lib/validations/portfolio'
import { requireAdmin, upsertPortfolioTags } from '@/lib/api/helpers'

// GET: 포트폴리오 목록 조회
export async function GET() {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { isDeleted: false },
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
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    // 태그 배열 형식으로 변환
    const formattedPortfolios = portfolios.map((portfolio) => ({
      ...portfolio,
      tags: portfolio.tags.map((pt) => pt.tag.name),
    }))

    return NextResponse.json({ data: formattedPortfolios })
  } catch (error) {
    console.error('포트폴리오 조회 오류:', error)
    return NextResponse.json(
      { error: '포트폴리오를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 포트폴리오 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const validation = portfolioCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { tags, ...portfolioData } = validation.data

    // 트랜잭션으로 포트폴리오와 태그 생성
    const portfolio = await prisma.$transaction(async (tx) => {
      // 포트폴리오 생성
      const newPortfolio = await tx.portfolio.create({
        data: {
          ...portfolioData,
          githubUrl: portfolioData.githubUrl || null,
          notionUrl: portfolioData.notionUrl || null,
          userId: Number(session.user.id),
        },
      })

      // 태그 처리
      if (tags && tags.length > 0) {
        await upsertPortfolioTags(tx, newPortfolio.id, tags)
      }

      return newPortfolio
    })

    // 생성된 포트폴리오 조회 (태그 포함)
    const createdPortfolio = await prisma.portfolio.findUnique({
      where: { id: portfolio.id },
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
        ...createdPortfolio,
        tags: createdPortfolio?.tags.map((pt) => pt.tag.name) || [],
      },
    })
  } catch (error) {
    console.error('포트폴리오 생성 오류:', error)
    return NextResponse.json(
      { error: '포트폴리오 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
