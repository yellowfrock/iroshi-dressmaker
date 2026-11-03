/**
 * Supabase server client (for use in Server Components, Route Handlers, Server Actions).
 * Uses cookies for session management.
 * The service role key is only used in server-side admin operations.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

let publicClientInstance: ReturnType<typeof createSupabaseClient> | null = null

/**
 * Public server client — uses the anon key directly WITHOUT cookies.
 * Does NOT trigger dynamic rendering or cookies() opt-out in Next.js.
 * Safe and performant for all read-only public queries and static/ISR pages.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!url || !key) {
    return createSupabaseClient(url, key)
  }

  if (!publicClientInstance) {
    publicClientInstance = createSupabaseClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }

  return publicClientInstance
}

/**
 * Standard server client — uses the anon key with RLS enforced.
 * Use for all public data fetching in Server Components.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component: cookie changes will be handled by middleware
          }
        },
      },
    }
  )
}

/**
 * Admin server client — uses the service role key, bypasses RLS.
 * ONLY use in trusted server-side admin operations.
 * NEVER expose this client to the browser.
 */
export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignored in server components
          }
        },
      },
    }
  )
}
