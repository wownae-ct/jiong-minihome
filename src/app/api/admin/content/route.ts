import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 콘텐츠 설정 키
const CONTENT_KEYS = {
  careers: 'admin_content_careers',
  portfolios: 'admin_content_portfolios',
  intro: 'admin_content_intro',
} as const

type ContentType = keyof typeof CONTENT_KEYS

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ContentType

    if (!type || !CONTENT_KEYS[type]) {
      return NextResponse.json({ error: '유효하지 않은 콘텐츠 타입입니다.' }, { status: 400 })
    }

    const setting = await prisma.siteSetting.findUnique({
      where: { settingKey: CONTENT_KEYS[type] },
    })

    if (!setting?.settingValue) {
      return NextResponse.json({ data: null })
    }

    const data = JSON.parse(setting.settingValue)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('콘텐츠 조회 오류:', error)
    return NextResponse.json({ error: '콘텐츠를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { type, data } = await request.json()

    if (!type || !CONTENT_KEYS[type as ContentType]) {
      return NextResponse.json({ error: '유효하지 않은 콘텐츠 타입입니다.' }, { status: 400 })
    }

    const settingKey = CONTENT_KEYS[type as ContentType]

    await prisma.siteSetting.upsert({
      where: { settingKey },
      update: { settingValue: JSON.stringify(data) },
      create: {
        settingKey,
        settingValue: JSON.stringify(data),
        description: `관리자 콘텐츠: ${type}`,
      },
    })

    return NextResponse.json({ success: true, message: '콘텐츠가 업데이트되었습니다.' })
  } catch (error) {
    console.error('콘텐츠 업데이트 오류:', error)
    return NextResponse.json({ error: '콘텐츠 업데이트에 실패했습니다.' }, { status: 500 })
  }
}
