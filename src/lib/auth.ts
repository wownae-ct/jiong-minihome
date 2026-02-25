import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import Naver from 'next-auth/providers/naver'
import {
  authorizeCredentials,
  handleJwtCallback,
  handleSessionCallback,
} from './auth-callbacks'

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      authorize: authorizeCredentials,
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
    async jwt({ token, user, account, trigger }) {
      return handleJwtCallback({ token, user, account, trigger })
    },
    async session({ session, token }) {
      return handleSessionCallback({ session, token })
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
