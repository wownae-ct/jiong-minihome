import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth, formatZodError } from '@/lib/api/helpers'

const updateProfileSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  profileImage: z.string().max(500).optional(),
})

export async function GET() {
  try {
    const { session, error } = await requireAuth()
    if (error) return error

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        bio: true,
        role: true,
        createdAt: true,
        passwordHash: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { passwordHash, ...userData } = user
    return NextResponse.json({
      ...userData,
      hasPassword: !!passwordHash,
    })
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error)
    return NextResponse.json({ error: '사용자 정보 조회에 실패했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { session, error } = await requireAuth()
    if (error) return error

    const body = await request.json()
    const result = updateProfileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      )
    }

    const { nickname, bio, profileImage } = result.data

    // 닉네임 중복 확인
    if (nickname) {
      const existingUser = await prisma.user.findFirst({
        where: {
          nickname,
          id: { not: parseInt(session.user.id) },
        },
      })

      if (existingUser) {
        return NextResponse.json({ error: '이미 사용 중인 닉네임입니다.' }, { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: {
        ...(nickname && { nickname }),
        ...(bio !== undefined && { bio }),
        ...(profileImage !== undefined && { profileImage }),
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        bio: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('프로필 수정 오류:', error)
    return NextResponse.json({ error: '프로필 수정에 실패했습니다.' }, { status: 500 })
  }
}
