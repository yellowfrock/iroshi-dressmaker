/**
 * Supabase auth proxy (formerly middleware).
 *
 * This proxy:
 * 1. Refreshes the auth session on every request when Supabase is configured.
 * 2. Protects all /admin routes — redirects unauthenticated users to /admin/login.
 * 3. Redirects logged-in users away from the /admin/login page.
 * 4. Gracefully allows public routes if Supabase credentials are not yet added.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isConfigured = Boolean(url && key && !url.includes('xxxxxxxxxxxx') && url.startsWith('http'))

  const pathname = request.nextUrl.pathname

  // If Supabase is not configured yet, allow public routes freely
  if (!isConfigured) {
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
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

    // Refresh session — IMPORTANT: do not remove this
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protect all /admin routes except /admin/login
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      if (!user) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/admin/login'
        loginUrl.searchParams.set('redirectedFrom', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    // Redirect authenticated users away from /admin/login
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
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, 360 sequence frames, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
