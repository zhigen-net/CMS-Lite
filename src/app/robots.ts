import type { MetadataRoute } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { headers } from 'next/headers'
import { getSiteSettings } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  try {
    const { env } = getCloudflareContext()
    const settings = await getSiteSettings(env.DB)
    // 后台没填「站点网址」时用当前访问的域名，保证 robots.txt 里有站点地图地址
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host')
    const base = (settings['site.url'] as string) || (host ? `https://${host}` : '')
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
