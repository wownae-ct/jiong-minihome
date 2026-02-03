import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { commentSchema } from '@/lib/validations/comment'

// GET: 게시글의 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const postId = parseInt(id)

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
    const postId = parseInt(id)
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = commentSchema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.issues[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    const { content, parentId } = result.data

    // 게시글 존재 확인
    const post = await prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 부모 댓글 확인 (대댓글인 경우)
    let depth = 0
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
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
        userId: parseInt(session.user.id),
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

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Comments POST error:', error)
    return NextResponse.json(
      { error: '댓글 작성에 실패했습니다' },
      { status: 500 }
    )
  }
}
