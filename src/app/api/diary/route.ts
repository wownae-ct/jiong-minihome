import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const diarySchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1, '내용을 입력해주세요'),
  mood: z.enum(['happy', 'sad', 'neutral', 'angry', 'excited']).optional(),
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'snowy']).optional(),
  isPublic: z.boolean().default(true),
})

export async function GET() {
  try {
    const entries = await prisma.diaryEntry.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            nickname: true,
          },
        },
      },
    })
    return NextResponse.json(entries)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const body = await request.json()
    const result = diarySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: '유효하지 않은 데이터입니다.', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { title, content, mood, weather, isPublic } = result.data

    const entry = await prisma.diaryEntry.create({
      data: {
        userId: parseInt(session.user.id),
        title: title || null,
        content,
        mood: mood || null,
        weather: weather || null,
        isPublic,
      },
      include: {
        user: {
          select: {
            nickname: true,
          },
        },
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('다이어리 작성 오류:', error)
    return NextResponse.json({ error: '다이어리 작성에 실패했습니다.' }, { status: 500 })
  }
}
