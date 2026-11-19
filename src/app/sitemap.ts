import type { MetadataRoute } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { headers } from 'next/headers'
import { getCategories, getSitemapContents, getSitemapTags } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const { env } = getCloudflareContext()
    // 只取网址需要的列（原来读全部文章正文，且文章最多 1000 篇）；标签只放至少 2 篇文章的
    const [settings, posts, pages, categories, tags] = await Promise.all([
      getSiteSettings(env.DB),
      getSitemapContents(env.DB, 'post'),
      getSitemapContents(env.DB, 'page', 1000),
      getCategories(env.DB, 'post'),
      getSitemapTags(env.DB, 2),
    ])

    // 后台没填「站点网址」时用当前访问的域名，不再输出 https://localhost
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host')
    const base = (settings['site.url'] as string) || (host ? `https://${host}` : 'https://localhost')
    const url = (path: string) => `${base.replace(/\/$/, '')}${path}`

    const entries: MetadataRoute.Sitemap = [
      { url: url('/'), lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ]

    for (const post of posts) {
      entries.push({
        url: url(`/post/${encodeURIComponent(post.slug)}`),
        lastModified: new Date((post.updated_at || post.published_at || 0) * 1000),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }

    for (const page of pages) {
      entries.push({
        url: url(`/${encodeURIComponent(page.slug)}`),
        lastModified: new Date((page.updated_at || 0) * 1000),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }

    for (const cat of categories) {
      entries.push({ url: url(`/category/${encodeURIComponent(cat.slug)}`), changeFrequency: 'weekly', priority: 0.5 })
    }

    for (const tag of tags) {
      entries.push({ url: url(`/tag/${encodeURIComponent(tag.slug)}`), changeFrequency: 'weekly', priority: 0.4 })
    }

    return entries
  } catch {
    return [{ url: '/', lastModified: new Date() }]
  }
}
