import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAdmin, parseId } from '@/lib/api/helpers'

const updateUserSchema = z.object({
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    const { id: userId, error: idError } = parseId(id)
    if (idError) return idError

    const body = await request.json()
    const result = updateUserSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: '유효하지 않은 데이터입니다.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: result.data,
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        isActive: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('사용자 수정 오류:', error)
    return NextResponse.json({ error: '사용자 수정에 실패했습니다.' }, { status: 500 })
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
    const { id: userId, error: idError } = parseId(id)
    if (idError) return idError

    // 자기 자신은 삭제 불가
    if (userId === parseInt(session.user.id)) {
      return NextResponse.json({ error: '자기 자신은 삭제할 수 없습니다.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 소프트 삭제 (isActive를 false로 설정)
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: '사용자가 삭제되었습니다.' })
  } catch (error) {
    console.error('사용자 삭제 오류:', error)
    return NextResponse.json({ error: '사용자 삭제에 실패했습니다.' }, { status: 500 })
  }
}
