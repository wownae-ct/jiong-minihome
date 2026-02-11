import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/helpers'
import { prisma } from '@/lib/prisma'
import { bgmCreateSchema } from '@/lib/validations/bgm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    const tracks = await prisma.bgmTrack.findMany({
      where: showAll ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(tracks)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const result = bgmCreateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: '유효하지 않은 데이터입니다.', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { title, artist, url, originalName, filename, fileSize, duration } = result.data

    const track = await prisma.bgmTrack.create({
      data: {
        title,
        artist: artist || null,
        url,
        originalName,
        filename,
        fileSize: fileSize || null,
        duration: duration || null,
      },
    })

    return NextResponse.json(track, { status: 201 })
  } catch (error) {
    console.error('BGM 트랙 생성 오류:', error)
    return NextResponse.json({ error: 'BGM 트랙 생성에 실패했습니다.' }, { status: 500 })
  }
}
