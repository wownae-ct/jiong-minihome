import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { guestbookSchema } from '@/lib/validations/guestbook'
import { parsePagination } from '@/lib/api/helpers'

// GET: 방명록 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePagination(searchParams)

    const session = await auth()

    const [entries, total] = await Promise.all([
      prisma.guestbookEntry.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.guestbookEntry.count({ where: { isDeleted: false } }),
    ])

    // 비밀글 처리: 작성자 또는 관리자만 내용 확인 가능
    const processedEntries = entries.map((entry) => {
      if (entry.isPrivate) {
        const isOwner = session?.user?.id === String(entry.userId)
        const isAdmin = session?.user?.role === 'admin'

        if (!isOwner && !isAdmin) {
          return {
            ...entry,
            content: '비밀글입니다.',
            guestName: entry.guestName,
          }
        }
      }
      return entry
    })

    return NextResponse.json({
      entries: processedEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Guestbook GET error:', error)
    return NextResponse.json(
      { error: '방명록을 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST: 방명록 작성
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()

    const result = guestbookSchema.safeParse(body)
    if (!result.success) {
      const firstError = result.error.issues[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    const { content, guestName, guestPassword, isPrivate } = result.data

    // 비회원인 경우 이름과 비밀번호 필수
    if (!session) {
      if (!guestName || !guestPassword) {
        return NextResponse.json(
          { error: '비회원은 이름과 비밀번호를 입력해야 합니다' },
          { status: 400 }
        )
      }
    }

    const passwordHash = guestPassword
      ? await bcrypt.hash(guestPassword, 10)
      : null

    const entry = await prisma.guestbookEntry.create({
      data: {
        userId: session ? parseInt(session.user.id) : null,
        guestName: session ? null : guestName,
        guestPassword: passwordHash,
        content,
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
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Guestbook POST error:', error)
    return NextResponse.json(
      { error: '방명록 작성에 실패했습니다' },
      { status: 500 }
    )
  }
}
