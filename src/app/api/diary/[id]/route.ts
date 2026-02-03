import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { id } = await params
    const entryId = parseInt(id)

    if (isNaN(entryId)) {
      return NextResponse.json({ error: '유효하지 않은 ID입니다.' }, { status: 400 })
    }

    const entry = await prisma.diaryEntry.findUnique({
      where: { id: entryId },
    })

    if (!entry) {
      return NextResponse.json({ error: '다이어리를 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.diaryEntry.delete({
      where: { id: entryId },
    })

    return NextResponse.json({ success: true, message: '다이어리가 삭제되었습니다.' })
  } catch (error) {
    console.error('다이어리 삭제 오류:', error)
    return NextResponse.json({ error: '다이어리 삭제에 실패했습니다.' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entryId = parseInt(id)

    if (isNaN(entryId)) {
      return NextResponse.json({ error: '유효하지 않은 ID입니다.' }, { status: 400 })
    }

    const entry = await prisma.diaryEntry.findUnique({
      where: { id: entryId },
      include: {
        user: {
          select: {
            nickname: true,
          },
        },
      },
    })

    if (!entry) {
      return NextResponse.json({ error: '다이어리를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 비공개 다이어리는 관리자만 볼 수 있음
    if (!entry.isPublic) {
      const session = await auth()
      if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
      }
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('다이어리 조회 오류:', error)
    return NextResponse.json({ error: '다이어리 조회에 실패했습니다.' }, { status: 500 })
  }
}
