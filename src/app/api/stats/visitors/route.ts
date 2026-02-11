import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// UTC 기준 오늘 날짜 (자정) 가져오기
function getUTCToday(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

// GET: 방문자 통계 조회
export async function GET() {
  try {
    const today = getUTCToday()

    // 오늘 통계 가져오기 또는 생성 (upsert로 race condition 방지)
    const todayStat = await prisma.visitorStat.upsert({
      where: { visitDate: today },
      update: {},
      create: {
        visitDate: today,
        totalCount: 0,
        uniqueCount: 0,
      },
    })

    // 전체 방문자 수 (모든 날의 합계)
    const totalStats = await prisma.visitorStat.aggregate({
      _sum: {
        totalCount: true,
      },
    })

    return NextResponse.json({
      today: todayStat.totalCount,
      total: totalStats._sum.totalCount || 0,
    })
  } catch (error) {
    console.error('Visitor stats GET error:', error)
    return NextResponse.json(
      { error: '통계를 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST: 방문 기록
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    const body = await request.json().catch(() => ({}))
    const pagePath = body.pagePath || '/'

    // 방문 로그 기록
    await prisma.visitorLog.create({
      data: {
        visitorIp: ip,
        userId: session ? parseInt(session.user.id) : null,
        userAgent,
        pagePath,
      },
    })

    const today = getUTCToday()

    // 오늘 이 IP의 첫 방문 여부 확인 (고유 방문자 계산용)
    const existingVisit = await prisma.visitorLog.findFirst({
      where: {
        visitorIp: ip,
        visitedAt: {
          gte: today,
        },
      },
    })

    const isFirstVisitToday = !existingVisit ||
      !existingVisit.visitedAt ||
      new Date(existingVisit.visitedAt).getTime() === new Date().getTime()

    // 오늘 통계 업데이트
    await prisma.visitorStat.upsert({
      where: { visitDate: today },
      update: {
        totalCount: { increment: 1 },
        uniqueCount: isFirstVisitToday ? { increment: 1 } : undefined,
      },
      create: {
        visitDate: today,
        totalCount: 1,
        uniqueCount: 1,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Visitor log POST error:', error)
    return NextResponse.json(
      { error: '방문 기록에 실패했습니다' },
      { status: 500 }
    )
  }
}
