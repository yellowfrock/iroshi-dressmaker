import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // 1. Verify admin authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin session required.' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const rawUrl = body?.url?.trim()

    if (!rawUrl) {
      return NextResponse.json({ success: false, error: 'Behance project URL is required.' }, { status: 400 })
    }

    if (!rawUrl.includes('behance.net')) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL. Please enter a valid Behance link (e.g. https://www.behance.net/gallery/...)' },
        { status: 400 }
      )
    }

    // Normalize URL
    let targetUrl = rawUrl
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`
    }

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    }

    let foundImages: string[] = []
    let projectTitle = 'Behance Project'

    // 3. Attempt direct HTML fetch
    try {
      const pageRes = await fetch(targetUrl, { headers, next: { revalidate: 0 } })

      if (pageRes.ok) {
        const html = await pageRes.text()

        // Extract title
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
        if (titleMatch && titleMatch[1]) {
          projectTitle = titleMatch[1].replace(/:: Behance.*$/i, '').trim()
        }

        // Regex for Behance CDN image URLs
        const cdnRegex = /https:\/\/[^"'\s\\]+behance\.net\/[^"'\s\\]+\.(?:jpe?g|png|webp)/gi
        const matched = html.match(cdnRegex) || []

        for (const imgUrl of matched) {
          // Clean escaping
          const clean = imgUrl.replace(/\\/g, '')

          // Filter out tiny icons, user profile avatars, and badges
          if (
            clean.includes('/user/') ||
            clean.includes('/avatars/') ||
            clean.includes('profile_') ||
            clean.includes('/50/') ||
            clean.includes('/100/')
          ) {
            continue
          }

          foundImages.push(clean)
        }

        // Also extract og:image if available
        const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
        if (ogMatch && ogMatch[1]) {
          foundImages.push(ogMatch[1])
        }
      }
    } catch (fetchErr) {
      console.warn('Direct fetch failed, trying oEmbed fallback:', fetchErr)
    }

    // 4. Fallback to Behance oEmbed if direct fetch returned no images
    if (foundImages.length === 0) {
      try {
        const oembedUrl = `https://www.behance.net/services/oembed?url=${encodeURIComponent(targetUrl)}&format=json`
        const oembedRes = await fetch(oembedUrl, { headers, next: { revalidate: 0 } })

        if (oembedRes.ok) {
          const oembedData = await oembedRes.json()
          if (oembedData?.title) {
            projectTitle = oembedData.title
          }
          if (oembedData?.thumbnail_url) {
            foundImages.push(oembedData.thumbnail_url)
          }
        }
      } catch (oembedErr) {
        console.warn('oEmbed attempt also failed:', oembedErr)
      }
    }

    // Deduplicate and filter images
    const uniqueImages = Array.from(new Set(foundImages))

    // 5. If no images could be extracted (e.g. Behance anti-scraping / rate-limit), return clear friendly error
    if (uniqueImages.length === 0) {
      return NextResponse.json({
        success: false,
        error:
          'Could not automatically extract images from this Behance project (Behance may have blocked automated access or the project requires a login). You can paste the direct image URLs into the manual URL box below.',
        fallbackAllowed: true,
      })
    }

    return NextResponse.json({
      success: true,
      projectTitle,
      projectUrl: targetUrl,
      images: uniqueImages,
    })
  } catch (error: unknown) {
    console.error('[behance-import] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import from Behance.',
      },
      { status: 500 }
    )
  }
}
