import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const verifyPasswordSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth()
    if (error) return error

    const body = await request.json()
    const result = verifyPasswordSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { passwordHash: true },
    })

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: '소셜 로그인 사용자입니다.' },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(result.data.password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ verified: true })
  } catch (error) {
    console.error('비밀번호 확인 오류:', error)
    return NextResponse.json(
      { error: '비밀번호 확인에 실패했습니다.' },
      { status: 500 }
    )
  }
}
