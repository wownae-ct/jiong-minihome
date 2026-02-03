import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
// import { prisma } from '@/lib/prisma'

// 방문자 통계 API - 임시 비활성화
// TODO: 추후 Vercel Analytics 또는 외부 서비스 연동 시 재활성화

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    // 방문자 통계 기능 임시 비활성화
    // const now = new Date()
    // const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    // const thisWeekStart = new Date(today)
    // thisWeekStart.setDate(today.getDate() - today.getDay())
    // const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // 방문자 통계
    // const [todayCount, thisWeekCount, thisMonthCount, totalCount] = await Promise.all([
    //   prisma.visitorLog.count({
    //     where: { visitedAt: { gte: today } },
    //   }),
    //   prisma.visitorLog.count({
    //     where: { visitedAt: { gte: thisWeekStart } },
    //   }),
    //   prisma.visitorLog.count({
    //     where: { visitedAt: { gte: thisMonthStart } },
    //   }),
    //   prisma.visitorLog.count(),
    // ])

    // 페이지별 통계
    // const pageStats = await prisma.visitorLog.groupBy({
    //   by: ['pagePath'],
    //   _count: { id: true },
    //   orderBy: { _count: { id: 'desc' } },
    //   take: 10,
    // })

    // 임시 응답 - 준비중 상태
    return NextResponse.json({
      stats: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0,
      },
      pageStats: [],
      disabled: true,
      message: '방문자 통계 기능이 준비중입니다.',
    })

    // 원본 응답
    // return NextResponse.json({
    //   stats: {
    //     today: todayCount,
    //     thisWeek: thisWeekCount,
    //     thisMonth: thisMonthCount,
    //     total: totalCount,
    //   },
    //   pageStats: pageStats.map((p) => ({
    //     path: p.pagePath || '/',
    //     views: p._count.id,
    //     avgDuration: 0, // 체류시간 필드가 추가되면 계산
    //   })),
    // })
  } catch (error) {
    console.error('분석 데이터 조회 오류:', error)
    return NextResponse.json({ error: '분석 데이터 조회에 실패했습니다.' }, { status: 500 })
  }
}
