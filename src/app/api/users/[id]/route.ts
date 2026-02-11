import { NextRequest, NextResponse } from 'next/server'
import { parseId } from '@/lib/api/helpers'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { id: userId, error } = parseId(id)
    if (error) return error

    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        nickname: true,
        profileImage: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            posts: { where: { isDeleted: false } },
            comments: { where: { isDeleted: false } },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      nickname: user.nickname,
      profileImage: user.profileImage,
      bio: user.bio,
      createdAt: user.createdAt,
      postCount: user._count.posts,
      commentCount: user._count.comments,
    })
  } catch (error) {
    console.error('User GET error:', error)
    return NextResponse.json(
      { error: '사용자 정보를 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}
