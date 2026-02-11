import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api/helpers'

export type AdminStatus = 'online' | 'away' | 'offline'

interface AdminStatusResponse {
  status: AdminStatus
  lastActivity: string | null
}

// 5분 (밀리초)
const AWAY_THRESHOLD = 5 * 60 * 1000

export async function GET(): Promise<NextResponse<AdminStatusResponse>> {
  try {
    // 관리자 사용자 조회
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' },
      select: {
        lastLoginAt: true,
      },
    })

    if (!admin) {
      return NextResponse.json({
        status: 'offline',
        lastActivity: null,
      })
    }

    const now = new Date()
    const lastActivity = admin.lastLoginAt

    if (!lastActivity) {
      return NextResponse.json({
        status: 'offline',
        lastActivity: null,
      })
    }

    const timeDiff = now.getTime() - new Date(lastActivity).getTime()

    let status: AdminStatus
    if (timeDiff <= AWAY_THRESHOLD) {
      status = 'online'
    } else if (timeDiff <= AWAY_THRESHOLD * 2) {
      status = 'away'
    } else {
      status = 'offline'
    }

    return NextResponse.json({
      status,
      lastActivity: lastActivity.toISOString(),
    })
  } catch (error) {
    console.error('관리자 상태 조회 오류:', error)
    return NextResponse.json({
      status: 'offline',
      lastActivity: null,
    })
  }
}

// 관리자 활동 업데이트 (heartbeat)
export async function POST(request: NextRequest) {
  try {
    const { session, error: authError } = await requireAdmin()
    if (authError) return authError

    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: { lastLoginAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('활동 업데이트 오류:', error)
    return NextResponse.json({ error: '활동 업데이트에 실패했습니다.' }, { status: 500 })
  }
}
