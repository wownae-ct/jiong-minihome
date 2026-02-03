import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// POST: 좋아요 토글
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { targetType, targetId } = body

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: '잘못된 요청입니다' },
        { status: 400 }
      )
    }

    const userId = parseInt(session.user.id)

    // 기존 좋아요 확인
    const existingLike = await prisma.like.findUnique({
      where: {
        uk_likes_user_target: {
          userId,
          targetType,
          targetId,
        },
      },
    })

    if (existingLike) {
      // 좋아요 취소
      await prisma.like.delete({
        where: { id: existingLike.id },
      })

      // 대상의 좋아요 수 감소
      await updateLikeCount(targetType, targetId, -1)

      return NextResponse.json({ liked: false })
    } else {
      // 좋아요 추가
      await prisma.like.create({
        data: {
          userId,
          targetType,
          targetId,
        },
      })

      // 대상의 좋아요 수 증가
      await updateLikeCount(targetType, targetId, 1)

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Like POST error:', error)
    return NextResponse.json(
      { error: '좋아요 처리에 실패했습니다' },
      { status: 500 }
    )
  }
}

// GET: 좋아요 상태 확인
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: '잘못된 요청입니다' },
        { status: 400 }
      )
    }

    if (!session) {
      return NextResponse.json({ liked: false })
    }

    const like = await prisma.like.findUnique({
      where: {
        uk_likes_user_target: {
          userId: parseInt(session.user.id),
          targetType: targetType as 'post' | 'comment' | 'guestbook' | 'diary',
          targetId: parseInt(targetId),
        },
      },
    })

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    console.error('Like GET error:', error)
    return NextResponse.json(
      { error: '좋아요 상태 확인에 실패했습니다' },
      { status: 500 }
    )
  }
}

async function updateLikeCount(
  targetType: string,
  targetId: number,
  increment: number
) {
  switch (targetType) {
    case 'post':
      await prisma.post.update({
        where: { id: targetId },
        data: { likeCount: { increment } },
      })
      break
    case 'comment':
      await prisma.comment.update({
        where: { id: targetId },
        data: { likeCount: { increment } },
      })
      break
  }
}
