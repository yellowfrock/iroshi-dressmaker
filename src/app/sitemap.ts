import type { MetadataRoute } from 'next'
import { getAllDressCodes } from '@/lib/supabase/queries'
import { sampleDresses } from '@/lib/data/sample-dresses'
import { siteConfig } from '@/config/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url

  // Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/bridal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rental`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Dress dynamic routes
  const dbCodes = await getAllDressCodes()
  const sampleCodes = sampleDresses.map((d) => d.dress_code)
  const allCodes = Array.from(new Set([...dbCodes, ...sampleCodes]))

  const dressRoutes: MetadataRoute.Sitemap = allCodes.map((code) => ({
    url: `${baseUrl}/dress/${code}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...dressRoutes]
}
