/**
 * Supabase auth proxy.
 *
 * Performance-optimized:
 * 1. Public routes bypass Supabase Auth calls entirely (0ms overhead for visitors).
 * 2. Only /admin routes verify active admin sessions and refresh tokens.
 * 3. Gracefully redirects unauthenticated users away from /admin to /admin/login.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Fast path: Public routes do not need Supabase Auth checks
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next({ request })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isConfigured = Boolean(url && key && !url.includes('xxxxxxxxxxxx') && url.startsWith('http'))

  // If Supabase is not configured yet, allow login page or redirect to login
  if (!isConfigured) {
    if (pathname !== '/admin/login') {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      url!,
      key!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Verify admin session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protect all /admin routes except /admin/login
    if (pathname !== '/admin/login') {
      if (!user) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/admin/login'
        loginUrl.searchParams.set('redirectedFrom', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    // Redirect authenticated users away from /admin/login to /admin dashboard
    if (pathname === '/admin/login' && user) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/admin'
      return NextResponse.redirect(dashboardUrl)
    }

    return supabaseResponse
  } catch (error) {
    console.error('[Proxy] Supabase client error:', error)
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
  ],
}

