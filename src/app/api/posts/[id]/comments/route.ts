import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { commentSchema, guestCommentSchema } from '@/lib/validations/comment'
import { createNotification } from '@/lib/notifications'
import { parseId } from '@/lib/api/helpers'

// GET: 게시글의 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { id: postId, error: idError } = parseId(id)
    if (idError) return idError

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        isDeleted: false,
        parentId: null, // 최상위 댓글만
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        replies: {
          where: { isDeleted: false },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Comments GET error:', error)
    return NextResponse.json(
      { error: '댓글을 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST: 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { id: postId, error: idError } = parseId(id)
    if (idError) return idError
    const session = await auth()
    const body = await request.json()

    // 로그인 여부에 따라 다른 스키마로 검증
    let content: string
    let parentId: number | undefined
    let guestName: string | undefined
    let guestPasswordHash: string | null = null

    if (session) {
      const result = commentSchema.safeParse(body)
      if (!result.success) {
        const firstError = result.error.issues[0]
        return NextResponse.json({ error: firstError.message }, { status: 400 })
      }
      content = result.data.content
      parentId = result.data.parentId
    } else {
      const result = guestCommentSchema.safeParse(body)
      if (!result.success) {
        const firstError = result.error.issues[0]
        return NextResponse.json({ error: firstError.message }, { status: 400 })
      }
      content = result.data.content
      parentId = result.data.parentId
      guestName = result.data.guestName
      guestPasswordHash = await bcrypt.hash(result.data.guestPassword, 10)
    }

    // 게시글 존재 확인 (카테고리 정보 포함 - 알림 링크용)
    const post = await prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      include: { category: { select: { slug: true } } },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 부모 댓글 확인 (대댓글인 경우)
    let depth = 0
    let parentComment: { id: number; postId: number; depth: number | null; userId: number | null } | null = null
    if (parentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      })

      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json(
          { error: '유효하지 않은 부모 댓글입니다' },
          { status: 400 }
        )
      }

      // 대댓글은 depth 1까지만 허용
      if ((parentComment.depth ?? 0) >= 1) {
        return NextResponse.json(
          { error: '더 이상 답글을 작성할 수 없습니다' },
          { status: 400 }
        )
      }

      depth = 1
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: session ? parseInt(session.user.id) : null,
        guestName: session ? null : guestName,
        guestPassword: session ? null : guestPasswordHash,
        parentId: parentId || null,
        content,
        depth,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    })

    // 게시글의 댓글 수 증가
    await prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    })

    const actorId = session ? parseInt(session.user.id) : undefined
    const postLink = `/community/${post.category.slug}/${postId}`
    const actorName = session
      ? (comment.user?.nickname || session.user.name || '사용자')
      : (guestName || '익명')

    // 알림: 게시글 작성자에게 댓글 알림 (대댓글이 아닌 경우)
    if (post.userId && !parentId) {
      createNotification({
        userId: post.userId,
        type: 'comment',
        actorId,
        targetType: 'post',
        targetId: postId,
        message: `${actorName}님이 회원님의 게시글에 댓글을 남겼습니다.`,
        link: postLink,
      }).catch(console.error)
    }

    // 알림: 부모 댓글 작성자에게 대댓글 알림
    if (parentComment?.userId) {
      createNotification({
        userId: parentComment.userId,
        type: 'reply',
        actorId,
        targetType: 'comment',
        targetId: parentComment.id,
        message: `${actorName}님이 회원님의 댓글에 답글을 남겼습니다.`,
        link: postLink,
      }).catch(console.error)
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Comments POST error:', error)
    return NextResponse.json(
      { error: '댓글 작성에 실패했습니다' },
      { status: 500 }
    )
  }
}
