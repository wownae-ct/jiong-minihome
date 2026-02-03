import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { tagSchema } from '@/lib/validations/portfolio'

interface Params {
  params: Promise<{ id: string }>
}

// GET: 태그 상세 조회
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const tagId = parseInt(id, 10)

    if (isNaN(tagId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }

    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        _count: {
          select: { portfolios: true },
        },
      },
    })

    if (!tag) {
      return NextResponse.json({ error: '태그를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        count: tag._count.portfolios,
        createdAt: tag.createdAt,
      },
    })
  } catch (error) {
    console.error('태그 조회 오류:', error)
    return NextResponse.json(
      { error: '태그를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 태그 수정 (관리자 전용)
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
    const tagId = parseInt(id, 10)

    if (isNaN(tagId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
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

    // 기존 태그 확인
    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId },
    })

    if (!existingTag) {
      return NextResponse.json({ error: '태그를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이름 중복 체크 (자기 자신 제외)
    if (name !== existingTag.name) {
      const duplicateTag = await prisma.tag.findUnique({
        where: { name },
      })

      if (duplicateTag) {
        return NextResponse.json(
          { error: '이미 존재하는 태그 이름입니다.' },
          { status: 409 }
        )
      }
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: { name, color },
    })

    return NextResponse.json({ data: updatedTag })
  } catch (error) {
    console.error('태그 수정 오류:', error)
    return NextResponse.json(
      { error: '태그 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 태그 삭제 (관리자 전용)
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
    const tagId = parseInt(id, 10)

    if (isNaN(tagId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }

    // 기존 태그 확인
    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        _count: {
          select: { portfolios: true },
        },
      },
    })

    if (!existingTag) {
      return NextResponse.json({ error: '태그를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 포트폴리오와의 연결 삭제 후 태그 삭제
    await prisma.$transaction(async (tx) => {
      await tx.portfolioTag.deleteMany({
        where: { tagId },
      })
      await tx.tag.delete({
        where: { id: tagId },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('태그 삭제 오류:', error)
    return NextResponse.json(
      { error: '태그 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
