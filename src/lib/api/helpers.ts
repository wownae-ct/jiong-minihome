import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Session } from 'next-auth'
import { ZodError } from 'zod'
import { auth } from '@/lib/auth'

type AuthResult<T> =
  | { session: T; error?: undefined }
  | { session?: undefined; error: NextResponse }

export async function requireAdmin(): Promise<AuthResult<Session & { user: { id: string; role: string } }>> {
  const session = await auth()

  if (!session?.user) {
    return { error: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }) }
  }

  if (session.user.role !== 'admin') {
    return { error: NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 }) }
  }

  return { session: session as Session & { user: { id: string; role: string } } }
}

export async function requireAuth(): Promise<AuthResult<Session & { user: { id: string } }>> {
  const session = await auth()

  if (!session?.user) {
    return { error: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }) }
  }

  return { session: session as Session & { user: { id: string } } }
}

export function parseId(raw: string): { id: number; error?: undefined } | { id?: undefined; error: NextResponse } {
  const id = parseInt(raw, 10)
  if (isNaN(id)) {
    return { error: NextResponse.json({ error: '유효하지 않은 ID입니다.' }, { status: 400 }) }
  }
  return { id }
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit = 10
): { page: number; limit: number; skip: number } {
  const page = parseInt(searchParams.get('page') || '1', 10) || 1
  const limit = parseInt(searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

export async function verifyGuestPassword(
  storedHash: string | null,
  inputPassword: string | undefined,
  session: Session | null
): Promise<NextResponse | null> {
  const isAdmin = session?.user?.role === 'admin'
  if (isAdmin) return null

  if (!inputPassword) {
    return NextResponse.json({ error: '비밀번호를 입력해주세요' }, { status: 400 })
  }

  if (!storedHash) {
    return NextResponse.json({ error: '비밀번호 정보가 없습니다' }, { status: 500 })
  }

  const isValid = await bcrypt.compare(inputPassword, storedHash)
  if (!isValid) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다' }, { status: 403 })
  }

  return null
}

export function formatZodError(error: ZodError): string {
  return error.issues[0]?.message || '유효하지 않은 데이터입니다.'
}

type PrismaTransaction = {
  tag: {
    upsert: (args: { where: { name: string }; create: { name: string }; update: Record<string, never> }) => Promise<{ id: number }>
  }
  portfolioTag: {
    deleteMany: (args: { where: { portfolioId: number } }) => Promise<unknown>
    create: (args: { data: { portfolioId: number; tagId: number } }) => Promise<unknown>
  }
}

export async function upsertPortfolioTags(
  tx: PrismaTransaction,
  portfolioId: number,
  tags: string[]
): Promise<void> {
  for (const tagName of tags) {
    const tag = await tx.tag.upsert({
      where: { name: tagName },
      create: { name: tagName },
      update: {},
    })

    await tx.portfolioTag.create({
      data: {
        portfolioId,
        tagId: tag.id,
      },
    })
  }
}
