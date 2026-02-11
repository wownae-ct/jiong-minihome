import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdmin, parseId, formatZodError } from '@/lib/api/helpers'

const diaryUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1, '내용을 입력해주세요').optional(),
  mood: z.enum(['happy', 'sad', 'neutral', 'angry', 'excited']).nullable().optional(),
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'snowy']).nullable().optional(),
  isPublic: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    const { id: entryId, error: idError } = parseId(id)
    if (idError) return idError

    const entry = await prisma.diaryEntry.findUnique({
      where: { id: entryId },
    })

    if (!entry) {
      return NextResponse.json({ error: '다이어리를 찾을 수 없습니다.' }, { status: 404 })
    }

    const body = await request.json()
    const result = diaryUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (result.data.title !== undefined) updateData.title = result.data.title || null
    if (result.data.content !== undefined) updateData.content = result.data.content
    if (result.data.mood !== undefined) updateData.mood = result.data.mood
    if (result.data.weather !== undefined) updateData.weather = result.data.weather
    if (result.data.isPublic !== undefined) updateData.isPublic = result.data.isPublic

    const updated = await prisma.diaryEntry.update({
      where: { id: entryId },
      data: updateData,
      include: {
        user: {
          select: {
            nickname: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('다이어리 수정 오류:', error)
    return NextResponse.json({ error: '다이어리 수정에 실패했습니다.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    const { id: entryId, error: idError } = parseId(id)
    if (idError) return idError

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
    const { id: entryId, error: idError } = parseId(id)
    if (idError) return idError

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
