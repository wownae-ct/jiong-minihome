import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  profileImage: z.string().max(500).optional(),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

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
      },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error)
    return NextResponse.json({ error: '사용자 정보 조회에 실패했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const result = updateProfileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: '유효하지 않은 데이터입니다.', details: result.error.flatten() },
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
