import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value

  const path = request.nextUrl.pathname

  const isPublicPath = path === '/auth/login' || path === '/auth/signup'
  const isProtectedPath = path.startsWith('/admin') || path.startsWith('/student')

 if (path === '/') {
    if (token) {
     return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/student/dashboard', request.url))
  }

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: [
    '/auth/login',
    '/auth/signup',
    '/admin/:path*',
    '/student/:path*',
    '/:path*'
  ],
}