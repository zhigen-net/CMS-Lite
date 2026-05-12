import type { MetadataRoute } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getSiteSettings } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  try {
    const { env } = getCloudflareContext()
    const settings = await getSiteSettings(env.DB)
    const base = (settings['site.url'] as string) || ''
    const robotsValue = (settings['seo.robots'] as string) || 'index,follow'
    const noIndex = robotsValue.includes('noindex')

    return {
      rules: noIndex
        ? { userAgent: '*', disallow: '/' }
        : { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
      sitemap: base ? `${base.replace(/\/$/, '')}/sitemap.xml` : undefined,
    }
  } catch {
    return { rules: { userAgent: '*', allow: '/' } }
  }
}
