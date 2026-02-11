import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 모든 콘텐츠 중 가장 최신 업데이트 날짜 조회
export async function GET() {
  try {
    const [latestPost, latestDiary, latestGuestbook, latestPortfolio] = await Promise.all([
      prisma.post.findFirst({
        where: { isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.diaryEntry.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.guestbookEntry.findFirst({
        where: { isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.portfolio.findFirst({
        where: { isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
    ])

    const dates = [
      latestPost?.updatedAt,
      latestDiary?.updatedAt,
      latestGuestbook?.updatedAt,
      latestPortfolio?.updatedAt,
    ].filter((d): d is Date => d != null)

    const latestUpdate = dates.length > 0
      ? new Date(Math.max(...dates.map(d => d.getTime())))
      : null

    return NextResponse.json({ latestUpdate })
  } catch (error) {
    console.error('Latest update GET error:', error)
    return NextResponse.json(
      { error: '최신 업데이트 날짜를 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}
