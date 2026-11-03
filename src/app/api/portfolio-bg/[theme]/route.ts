import { NextResponse, type NextRequest } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/queries'

export const revalidate = 3600 // Cache for 1 hour at edge

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ theme: string }> }
) {
  const { theme } = await params
  if (!['classic', 'custom'].includes(theme)) {
    return new NextResponse('Not found', { status: 404 })
  }

  if (!isSupabaseConfigured()) {
    const fallback = theme === 'classic' ? '/portfolio/background.jpg' : '/portfolio/custom-background.png'
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  try {
    const supabase = createPublicClient()
    const selectCol = theme === 'classic' ? 'classic_url' : 'custom_url'
    const { data } = await supabase
      .from('portfolio_backgrounds')
      .select(selectCol)
      .limit(1)
      .maybeSingle()

    const targetUrl = (data as Record<string, string | null> | null)?.[selectCol]

    if (!targetUrl) {
      const fallback = theme === 'classic' ? '/portfolio/background.jpg' : '/portfolio/custom-background.png'
      return NextResponse.redirect(new URL(fallback, request.url))
    }

    // If it's a normal URL, redirect directly
    if (!targetUrl.startsWith('data:')) {
      return NextResponse.redirect(new URL(targetUrl, request.url))
    }

    // Parse base64 data URL: data:image/png;base64,xxxx
    const match = targetUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) {
      return new NextResponse('Invalid image format', { status: 500 })
    }

    const mimeType = match[1]
    const base64Data = match[2]
    const buffer = Buffer.from(base64Data, 'base64')

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('[portfolio-bg-api] error:', error)
    const fallback = theme === 'classic' ? '/portfolio/background.jpg' : '/portfolio/custom-background.png'
    return NextResponse.redirect(new URL(fallback, request.url))
  }
}

