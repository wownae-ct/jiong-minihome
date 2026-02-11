import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

const VALID_TARGET_TYPES = ['post', 'comment', 'guestbook', 'diary'] as const
type TargetType = typeof VALID_TARGET_TYPES[number]

function isValidTargetType(value: string): value is TargetType {
  return VALID_TARGET_TYPES.includes(value as TargetType)
}

// POST: 좋아요 토글
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    const { targetType, targetId, anonymousId } = body

    if (!targetType || !targetId || !isValidTargetType(targetType)) {
      return NextResponse.json(
        { error: '잘못된 요청입니다' },
        { status: 400 }
      )
    }

    if (session) {
      // 로그인 사용자
      const userId = parseInt(session.user.id)

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
        await prisma.like.delete({
          where: { id: existingLike.id },
        })
        await updateLikeCount(targetType, targetId, -1)
        return NextResponse.json({ liked: false })
      } else {
        await prisma.like.create({
          data: {
            userId,
            targetType,
            targetId,
          },
        })
        await updateLikeCount(targetType, targetId, 1)

        // 게시글 좋아요인 경우 작성자에게 알림
        if (targetType === 'post') {
          const post = await prisma.post.findUnique({
            where: { id: targetId },
            include: { category: { select: { slug: true } } },
          })

          if (post?.userId) {
            const actorName = session.user.name || '사용자'
            createNotification({
              userId: post.userId,
              type: 'like',
              actorId: userId,
              targetType: 'post',
              targetId,
              message: `${actorName}님이 회원님의 게시글을 좋아합니다.`,
              link: `/community/${post.category.slug}/${targetId}`,
            }).catch(console.error)
          }
        }

        return NextResponse.json({ liked: true })
      }
    } else {
      // 비로그인 사용자 (익명)
      if (!anonymousId) {
        return NextResponse.json(
          { error: '익명 식별자가 필요합니다' },
          { status: 400 }
        )
      }

      const existingLike = await prisma.like.findFirst({
        where: {
          anonymousId,
          targetType,
          targetId,
        },
      })

      if (existingLike) {
        await prisma.like.delete({
          where: { id: existingLike.id },
        })
        await updateLikeCount(targetType, targetId, -1)
        return NextResponse.json({ liked: false })
      } else {
        await prisma.like.create({
          data: {
            anonymousId,
            targetType,
            targetId,
          },
        })
        await updateLikeCount(targetType, targetId, 1)
        return NextResponse.json({ liked: true })
      }
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
    const anonymousId = searchParams.get('anonymousId')

    if (!targetType || !targetId || !isValidTargetType(targetType)) {
      return NextResponse.json(
        { error: '잘못된 요청입니다' },
        { status: 400 }
      )
    }

    const parsedTargetId = parseInt(targetId)
    if (isNaN(parsedTargetId)) {
      return NextResponse.json(
        { error: '잘못된 요청입니다' },
        { status: 400 }
      )
    }

    if (session) {
      const like = await prisma.like.findUnique({
        where: {
          uk_likes_user_target: {
            userId: parseInt(session.user.id),
            targetType,
            targetId: parsedTargetId,
          },
        },
      })

      return NextResponse.json({ liked: !!like })
    } else if (anonymousId) {
      const like = await prisma.like.findFirst({
        where: {
          anonymousId,
          targetType,
          targetId: parsedTargetId,
        },
      })

      return NextResponse.json({ liked: !!like })
    }

    return NextResponse.json({ liked: false })
  } catch (error) {
    console.error('Like GET error:', error)
    return NextResponse.json(
      { error: '좋아요 상태 확인에 실패했습니다' },
      { status: 500 }
    )
  }
}

async function updateLikeCount(
  targetType: TargetType,
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
