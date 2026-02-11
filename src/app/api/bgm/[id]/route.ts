import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/helpers'
import { prisma } from '@/lib/prisma'
import { bgmUpdateSchema } from '@/lib/validations/bgm'
import { unlink } from 'fs/promises'
import path from 'path'

type RouteParams = { params: Promise<{ id: string }> }

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const trackId = parseInt(id)

    const track = await prisma.bgmTrack.findUnique({ where: { id: trackId } })
    if (!track) {
      return NextResponse.json({ error: '트랙을 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.bgmTrack.delete({ where: { id: trackId } })

    // 파일 삭제 시도 (실패해도 무시)
    try {
      const filePath = path.join(process.cwd(), 'public', track.url)
      await unlink(filePath)
    } catch {
      // 파일이 이미 삭제된 경우 무시
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('BGM 트랙 삭제 오류:', error)
    return NextResponse.json({ error: 'BGM 트랙 삭제에 실패했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const trackId = parseInt(id)

    const existing = await prisma.bgmTrack.findUnique({ where: { id: trackId } })
    if (!existing) {
      return NextResponse.json({ error: '트랙을 찾을 수 없습니다.' }, { status: 404 })
    }

    const body = await request.json()
    const result = bgmUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: '유효하지 않은 데이터입니다.', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const track = await prisma.bgmTrack.update({
      where: { id: trackId },
      data: result.data,
    })

    return NextResponse.json(track)
  } catch (error) {
    console.error('BGM 트랙 수정 오류:', error)
    return NextResponse.json({ error: 'BGM 트랙 수정에 실패했습니다.' }, { status: 500 })
  }
}
