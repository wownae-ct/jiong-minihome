import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET: 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: { userId: number; isRead?: boolean } = {
      userId: parseInt(session.user.id),
    }

    if (unreadOnly) {
      where.isRead = false
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId: parseInt(session.user.id),
          isRead: false,
        },
      }),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json(
      { error: '알림을 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// PUT: 알림 읽음 처리
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      // 모든 알림 읽음 처리
      await prisma.notification.updateMany({
        where: {
          userId: parseInt(session.user.id),
          isRead: false,
        },
        data: { isRead: true },
      })
    } else if (notificationId) {
      // 특정 알림 읽음 처리
      await prisma.notification.update({
        where: {
          id: notificationId,
          userId: parseInt(session.user.id),
        },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json(
      { error: '알림 처리에 실패했습니다' },
      { status: 500 }
    )
  }
}
