import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import Naver from 'next-auth/providers/naver'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.passwordHash) {
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
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    }),
    Naver({
      clientId: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role || 'user'
      }

      // OAuth 로그인 시 사용자 생성/연결
      if (account && account.provider !== 'credentials') {
        const existingUser = await prisma.user.findUnique({
          where: { email: token.email! },
        })

        if (existingUser) {
          token.id = String(existingUser.id)
          token.role = existingUser.role

          // OAuth 계정 연결 확인
          const oauthAccount = await prisma.oAuthAccount.findUnique({
            where: {
              uk_oauth_provider: {
                provider: account.provider,
                providerId: account.providerAccountId,
              },
            },
          })

          if (!oauthAccount) {
            await prisma.oAuthAccount.create({
              data: {
                userId: existingUser.id,
                provider: account.provider,
                providerId: account.providerAccountId,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                expiresAt: account.expires_at
                  ? new Date(account.expires_at * 1000)
                  : null,
              },
            })
          }
        } else {
          // 새 사용자 생성
          const newUser = await prisma.user.create({
            data: {
              email: token.email!,
              nickname: token.name || `user_${Date.now()}`,
              profileImage: token.picture,
              oauthAccounts: {
                create: {
                  provider: account.provider,
                  providerId: account.providerAccountId,
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token,
                  expiresAt: account.expires_at
                    ? new Date(account.expires_at * 1000)
                    : null,
                },
              },
            },
          })
          token.id = String(newUser.id)
          token.role = newUser.role
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})

// 타입 확장
declare module 'next-auth' {
  interface User {
    role?: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      role: string
    }
  }
}
