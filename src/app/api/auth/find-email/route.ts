import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findEmailSchema } from '@/lib/validations/auth'
import { maskEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = findEmailSchema.safeParse(body)
    if (!result.success) {
      const firstError = result.error.issues[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { nickname } = result.data

    const user = await prisma.user.findUnique({
      where: { nickname },
      select: { email: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: '해당 닉네임의 계정을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      email: maskEmail(user.email),
      isOAuth: !user.passwordHash,
    })
  } catch (error) {
    console.error('Find email error:', error)
    return NextResponse.json(
      { error: '이메일 찾기 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
