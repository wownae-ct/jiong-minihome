import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAdmin, formatZodError } from '@/lib/api/helpers'

const diarySchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1, '내용을 입력해주세요'),
  mood: z.enum(['happy', 'sad', 'neutral', 'angry', 'excited']).optional(),
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'snowy']).optional(),
  isPublic: z.boolean().default(true),
})

export async function GET() {
  try {
    const session = await auth()
    const isAdmin = session?.user?.role === 'admin'

    const entries = await prisma.diaryEntry.findMany({
      where: isAdmin ? {} : { isPublic: true },
      orderBy: { createdAt: 'desc' },
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
    const { session, error: authError } = await requireAdmin()
    if (authError) return authError

    const body = await request.json()
    const result = diarySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
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
