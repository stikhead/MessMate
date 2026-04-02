import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value
  const { pathname } = request.nextUrl

  const isAuthPath = pathname.startsWith('/auth')
  const isVerifyPath = pathname === '/auth/verify'
  const isProtectedPath = pathname.startsWith('/admin') || pathname.startsWith('/student')

  if (pathname === '/') {
    if (token) return NextResponse.redirect(new URL('/student/dashboard', request.url))
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (token) {
    try {
      const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const decoded = JSON.parse(atob(payloadBase64))
      
      const userRole = decoded.role
      const isVerified = decoded.isVerified

      if (isAuthPath && !isVerifyPath) {
         const target = userRole === 'admin' ? '/admin/dashboard' : '/student/dashboard'
         return NextResponse.redirect(new URL(target, request.url))
      }

      if (!isVerified && pathname.startsWith('/student') && !isVerifyPath) {
        return NextResponse.redirect(new URL(`/auth/verify?email=${decoded.email}`, request.url))
      }

      if (pathname.startsWith('/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/student/dashboard', request.url))
      }
      if (pathname.startsWith('/student') && userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }

    } catch (error) {
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      response.cookies.delete('accessToken')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}