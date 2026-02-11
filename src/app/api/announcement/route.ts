import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createBulkNotifications } from '@/lib/notifications'
import { requireAdmin } from '@/lib/api/helpers'

// GET: 공지사항 조회
export async function GET() {
  try {
    const [titleSetting, contentSetting] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { settingKey: 'announcement_title' } }),
      prisma.siteSetting.findUnique({ where: { settingKey: 'announcement_content' } }),
    ])

    return NextResponse.json({
      title: titleSetting?.settingValue || '',
      content: contentSetting?.settingValue || '',
    })
  } catch (error) {
    console.error('Announcement GET error:', error)
    return NextResponse.json(
      { error: '공지사항을 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// PUT: 공지사항 수정 (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { session, error: authError } = await requireAdmin()
    if (authError) return authError

    const { title, content } = await request.json()

    await Promise.all([
      prisma.siteSetting.upsert({
        where: { settingKey: 'announcement_title' },
        update: { settingValue: title || '' },
        create: { settingKey: 'announcement_title', settingValue: title || '', description: '공지사항 제목' },
      }),
      prisma.siteSetting.upsert({
        where: { settingKey: 'announcement_content' },
        update: { settingValue: content || '' },
        create: { settingKey: 'announcement_content', settingValue: content || '', description: '공지사항 내용' },
      }),
    ])

    // 공지사항이 비어있지 않으면 모든 활성 사용자에게 알림 발송
    if (title) {
      const activeUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      })

      const userIds = activeUsers.map((u) => u.id)
      const adminId = parseInt(session.user.id)

      createBulkNotifications(userIds, {
        type: 'announcement',
        actorId: adminId,
        message: `새 공지사항: ${title}`,
        link: '/#intro',
      }).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Announcement PUT error:', error)
    return NextResponse.json(
      { error: '공지사항 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}
