import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { JWT } from 'next-auth/jwt'
import type { Account, Session } from 'next-auth'

const MAX_NICKNAME_LENGTH = 50
const SUFFIX_RESERVE = 5 // "_" + 4 chars
const MAX_RETRIES = 3

export async function authorizeCredentials(
  credentials: Partial<Record<string, unknown>>
) {
  if (!credentials?.email || !credentials?.password) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: credentials.email as string },
  })

  if (!user || !user.passwordHash || !user.isActive) {
    return null
  }

  const isValid = await bcrypt.compare(
    credentials.password as string,
    user.passwordHash
  )

  if (!isValid) {
    return null
  }

  // 마지막 로그인 시간 업데이트
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  return {
    id: String(user.id),
    email: user.email,
    name: user.nickname,
    image: user.profileImage,
    role: user.role ?? undefined,
  }
}

export async function handleJwtCallback({
  token,
  user,
  account,
  trigger,
}: {
  token: JWT
  user?: { id?: string; role?: string }
  account?: Account | null
  trigger?: string
}) {
  if (user) {
    token.id = user.id
    token.role = (user as { role?: string }).role || 'user'
    token.picture = (user as { image?: string }).image || token.picture
  }

  // 세션 업데이트 요청 시 DB에서 최신 사용자 정보 반영
  if (trigger === 'update' && token.id) {
    const freshUser = await prisma.user.findUnique({
      where: { id: parseInt(token.id as string) },
      select: { profileImage: true, nickname: true, role: true },
    })
    if (freshUser) {
      token.picture = freshUser.profileImage || undefined
      token.name = freshUser.nickname
      token.role = freshUser.role
    }
  }

  // OAuth 로그인 시 사용자 생성/연결
  if (account && account.provider !== 'credentials') {
    if (!token.email?.trim()) {
      // 이메일 없이는 사용자 생성/연결 불가
      return token
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: token.email },
    })

    if (existingUser) {
      // 비활성 사용자는 로그인 차단
      if (!existingUser.isActive) {
        return token
      }

      token.id = String(existingUser.id)
      token.role = existingUser.role
      token.picture = existingUser.profileImage || token.picture

      // OAuth 계정 연결 (upsert로 TOCTOU 방지 + 토큰 갱신)
      await prisma.oAuthAccount.upsert({
        where: {
          uk_oauth_provider: {
            provider: account.provider,
            providerId: account.providerAccountId,
          },
        },
        update: {},
        create: {
          userId: existingUser.id,
          provider: account.provider,
          providerId: account.providerAccountId,
        },
      })

      // 마지막 로그인 시간 업데이트
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { lastLoginAt: new Date() },
      })
    } else {
      // 새 사용자 생성 (nickname 중복 시 재시도)
      const rawNickname = token.name || `user_${Date.now()}`
      const baseNickname = rawNickname.slice(0, MAX_NICKNAME_LENGTH - SUFFIX_RESERVE)
      let nickname = rawNickname.slice(0, MAX_NICKNAME_LENGTH)
      let retries = 0

      while (retries <= MAX_RETRIES) {
        try {
          const newUser = await prisma.user.create({
            data: {
              email: token.email,
              nickname,
              profileImage: token.picture ?? undefined,
              oauthAccounts: {
                create: {
                  provider: account.provider,
                  providerId: account.providerAccountId,
                },
              },
            },
          })
          token.id = String(newUser.id)
          token.role = newUser.role
          break
        } catch (error: unknown) {
          const prismaError = error as { code?: string; meta?: { target?: string[] } }
          if (prismaError.code === 'P2002' && retries < MAX_RETRIES) {
            const target = prismaError.meta?.target
            if (target?.includes('nickname')) {
              retries++
              const suffix = Math.random().toString(36).slice(2, 6)
              nickname = `${baseNickname}_${suffix}`
            } else if (target?.includes('email')) {
              // email 중복: 동시 요청으로 이미 생성됨 → 기존 사용자로 연결
              const createdUser = await prisma.user.findUnique({
                where: { email: token.email! },
              })
              if (createdUser) {
                token.id = String(createdUser.id)
                token.role = createdUser.role
              }
              break
            } else {
              throw error
            }
          } else {
            throw error
          }
        }
      }
    }
  }

  return token
}

export async function handleSessionCallback({
  session,
  token,
}: {
  session: Session
  token: JWT
}) {
  if (session.user) {
    session.user.id = token.id as string
    session.user.role = token.role as string
    session.user.image = (token.picture as string) || undefined
  }
  return session
}
