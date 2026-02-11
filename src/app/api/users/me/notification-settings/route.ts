import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/helpers'
import { prisma } from '@/lib/prisma'

const DEFAULT_SETTINGS = {
  comments: true,
  likes: true,
  replies: true,
  email: false,
}

function getSettingKey(userId: number) {
  return `user_notification_prefs_${userId}`
}

// GET: 알림 설정 조회
export async function GET() {
  try {
    const { session, error } = await requireAuth()
    if (error) return error

    const userId = parseInt(session.user.id)
    const setting = await prisma.siteSetting.findUnique({
      where: { settingKey: getSettingKey(userId) },
    })

    if (!setting?.settingValue) {
      return NextResponse.json(DEFAULT_SETTINGS)
    }

    try {
      return NextResponse.json(JSON.parse(setting.settingValue))
    } catch {
      return NextResponse.json(DEFAULT_SETTINGS)
    }
  } catch (error) {
    console.error('Notification settings GET error:', error)
    return NextResponse.json({ error: '알림 설정을 불러오는데 실패했습니다' }, { status: 500 })
  }
}

// PUT: 알림 설정 저장
export async function PUT(request: NextRequest) {
  try {
    const { session, error } = await requireAuth()
    if (error) return error

    const userId = parseInt(session.user.id)
    const body = await request.json()

    const settings = {
      comments: body.comments ?? DEFAULT_SETTINGS.comments,
      likes: body.likes ?? DEFAULT_SETTINGS.likes,
      replies: body.replies ?? DEFAULT_SETTINGS.replies,
      email: body.email ?? DEFAULT_SETTINGS.email,
    }

    await prisma.siteSetting.upsert({
      where: { settingKey: getSettingKey(userId) },
      update: { settingValue: JSON.stringify(settings) },
      create: {
        settingKey: getSettingKey(userId),
        settingValue: JSON.stringify(settings),
        description: `User ${userId} notification preferences`,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Notification settings PUT error:', error)
    return NextResponse.json({ error: '알림 설정 저장에 실패했습니다' }, { status: 500 })
  }
}
