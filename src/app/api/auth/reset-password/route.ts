import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { sendTemporaryPassword, generateTempPassword } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = resetPasswordSchema.safeParse(body)
    if (!result.success) {
      const firstError = result.error.issues[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { email } = result.data

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: '해당 이메일의 계정을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: '소셜 로그인으로 가입된 계정입니다. 해당 소셜 서비스로 로그인해주세요.' },
        { status: 400 }
      )
    }

    const tempPassword = generateTempPassword()
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    try {
      await sendTemporaryPassword(user.email, tempPassword)
    } catch (emailError) {
      console.error('Email send error:', emailError)
      return NextResponse.json(
        { error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    })

    return NextResponse.json({
      message: '임시 비밀번호가 이메일로 발송되었습니다',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: '비밀번호 재설정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
