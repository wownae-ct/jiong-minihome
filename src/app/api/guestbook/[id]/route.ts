import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { parseId, verifyGuestPassword } from '@/lib/api/helpers'

// DELETE: 방명록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { id: entryId, error: idError } = parseId(id)
    if (idError) return idError
    const session = await auth()

    const entry = await prisma.guestbookEntry.findUnique({
      where: { id: entryId },
    })

    if (!entry) {
      return NextResponse.json(
        { error: '방명록을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 회원 작성글인 경우
    if (entry.userId) {
      const isOwner = session?.user?.id === String(entry.userId)
      const isAdmin = session?.user?.role === 'admin'

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: '삭제 권한이 없습니다' },
          { status: 403 }
        )
      }
    } else {
      // 비회원 작성글인 경우 - 비밀번호 확인
      const body = await request.json().catch(() => ({}))
      const passwordError = await verifyGuestPassword(entry.guestPassword, body.password, session)
      if (passwordError) return passwordError
    }

    // Soft delete
    await prisma.guestbookEntry.update({
      where: { id: entryId },
      data: { isDeleted: true },
    })

    return NextResponse.json({ message: '삭제되었습니다' })
  } catch (error) {
    console.error('Guestbook DELETE error:', error)
    return NextResponse.json(
      { error: '삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}
