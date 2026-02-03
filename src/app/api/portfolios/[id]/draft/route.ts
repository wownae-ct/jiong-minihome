import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface Params {
  params: Promise<{ id: string }>
}

// GET: 특정 포트폴리오의 임시 저장 데이터 조회
export async function GET(request: NextRequest, { params }: Params) {
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

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: {
        id: true,
        draftData: true,
        draftAt: true,
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
        id: portfolio.id,
        draftData: portfolio.draftData ? JSON.parse(portfolio.draftData) : null,
        draftAt: portfolio.draftAt,
      },
    })
  } catch (error) {
    console.error('임시 저장 조회 오류:', error)
    return NextResponse.json(
      { error: '임시 저장 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 특정 포트폴리오에 임시 저장
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

    // 포트폴리오 존재 확인
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
    })

    if (!existingPortfolio) {
      return NextResponse.json(
        { error: '포트폴리오를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 임시 저장 업데이트
    const updated = await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        draftData: JSON.stringify(body),
        draftAt: new Date(),
      },
      select: {
        id: true,
        draftData: true,
        draftAt: true,
      },
    })

    return NextResponse.json({
      data: {
        id: updated.id,
        draftData: updated.draftData ? JSON.parse(updated.draftData) : null,
        draftAt: updated.draftAt,
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

// DELETE: 임시 저장 데이터 삭제
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

    // 임시 저장 데이터 삭제 (포트폴리오 자체는 유지)
    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        draftData: null,
        draftAt: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('임시 저장 삭제 오류:', error)
    return NextResponse.json(
      { error: '임시 저장 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
