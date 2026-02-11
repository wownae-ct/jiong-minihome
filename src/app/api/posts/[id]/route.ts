import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { postSchema } from '@/lib/validations/post'
import { parseId, verifyGuestPassword } from '@/lib/api/helpers'

// GET: 게시글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { id: postId, error: idError } = parseId(id)
    if (idError) return idError

    const post = await prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 조회수 증가
    await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({ ...post, viewCount: (post.viewCount ?? 0) + 1 })
  } catch (error) {
    console.error('Post GET error:', error)
    return NextResponse.json(
      { error: '게시글을 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// PUT: 게시글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { id: postId, error: idError } = parseId(id)
    if (idError) return idError
    const session = await auth()

    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // 회원 글인 경우
    if (post.userId) {
      if (!session) {
        return NextResponse.json(
          { error: '로그인이 필요합니다' },
          { status: 401 }
        )
      }

      const isOwner = session.user.id === String(post.userId)
      const isAdmin = session.user.role === 'admin'

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: '수정 권한이 없습니다' },
          { status: 403 }
        )
      }
    } else {
      // 비회원 글인 경우 - 비밀번호 확인 (admin은 비밀번호 없이 가능)
      const passwordError = await verifyGuestPassword(post.guestPassword, body.password, session)
      if (passwordError) return passwordError
    }

    const result = postSchema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.issues[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    const { title, content, categoryId, isPrivate } = result.data

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        categoryId,
        isPrivate: isPrivate || false,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
        category: true,
      },
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Post PUT error:', error)
    return NextResponse.json(
      { error: '게시글 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}

// DELETE: 게시글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { id: postId, error: idError } = parseId(id)
    if (idError) return idError
    const session = await auth()

    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 회원 글인 경우
    if (post.userId) {
      if (!session) {
        return NextResponse.json(
          { error: '로그인이 필요합니다' },
          { status: 401 }
        )
      }

      const isOwner = session.user.id === String(post.userId)
      const isAdmin = session.user.role === 'admin'

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: '삭제 권한이 없습니다' },
          { status: 403 }
        )
      }
    } else {
      // 비회원 글인 경우 - 비밀번호 확인 (admin은 비밀번호 없이 가능)
      const body = await request.json().catch(() => ({}))
      const passwordError = await verifyGuestPassword(post.guestPassword, body.password, session)
      if (passwordError) return passwordError
    }

    // Soft delete
    await prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true },
    })

    return NextResponse.json({ message: '삭제되었습니다' })
  } catch (error) {
    console.error('Post DELETE error:', error)
    return NextResponse.json(
      { error: '삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}
