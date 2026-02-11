import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, parseId } from '@/lib/api/helpers'
import prisma from '@/lib/prisma'

interface Params {
  params: Promise<{ id: string }>
}

// GET: 특정 포트폴리오의 임시 저장 데이터 조회
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { session, error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    const { id: portfolioId, error: idError } = parseId(id)
    if (idError) return idError

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
    const { session, error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    const { id: portfolioId, error: idError } = parseId(id)
    if (idError) return idError

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
    const { session, error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    const { id: portfolioId, error: idError } = parseId(id)
    if (idError) return idError

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
