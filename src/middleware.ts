import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// 로그인이 필요한 경로
const protectedRoutes = [
  '/diary/write',
  '/settings',
]

// 로그인 상태에서 접근 불가 경로
const authRoutes = ['/login', '/signup']

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const pathname = nextUrl.pathname

  // 로그인이 필요한 페이지
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // 인증 페이지 (로그인/회원가입)
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // 로그인 필요 페이지에 비로그인 상태로 접근
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 로그인 상태에서 로그인/회원가입 페이지 접근
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/', nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|health|metrics|error|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
