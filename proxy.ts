import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// This file is the Next.js Middleware.
// It effectively acts as a proxy or interceptor for requests.
// Note: Next.js requires this file to be named 'middleware.ts' and placed in the project root.

const SECRET_KEY = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-prod'
const key = new TextEncoder().encode(SECRET_KEY)

async function verify(token: string) {
    try {
        await jwtVerify(token, key)
        return true
    } catch (error) {
        return false
    }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Example Proxy / Rewrite Logic
  // If you want to proxy requests from /api/external to an actual external API:
  // if (pathname.startsWith('/api/external')) {
  //   const newUrl = new URL(pathname.replace('/api/external', ''), 'https://external-api.com')
  //   return NextResponse.rewrite(newUrl)
  // }

  // 2. Authentication / Route Protection Logic

  // Define protected routes
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Define public routes (like login/signup) to redirect logged-in users away from
  const authRoutes = ['/auth/login', '/auth/sign-up']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Get token from cookies
  const token = request.cookies.get('token')?.value
  const isValidToken = token ? await verify(token) : false

  // Redirect unauthenticated users accessing protected routes to login
  if (isProtectedRoute && !isValidToken) {
    const loginUrl = new URL('/auth/login', request.url)
    // Optional: Save the original URL to redirect back after login
    // loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users trying to access auth pages (login/signup) to dashboard
  if (isAuthRoute && isValidToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Continue the request if no conditions match
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!auth|api|_next|favicon.ico).*)',
  ],
}
