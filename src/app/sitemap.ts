import type { MetadataRoute } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContents, getCategories, getAllTags } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const { env } = getCloudflareContext()
    const [settings, { items: posts }, { items: pages }, categories, tags] = await Promise.all([
      getSiteSettings(env.DB),
      getContents(env.DB, { type: 'post', status: 'published', pageSize: 1000 }),
      getContents(env.DB, { type: 'page', status: 'published', pageSize: 200 }),
      getCategories(env.DB, 'post'),
      getAllTags(env.DB),
    ])

    const base = (settings['site.url'] as string) || 'https://localhost'
    const url = (path: string) => `${base.replace(/\/$/, '')}${path}`

    const entries: MetadataRoute.Sitemap = [
      { url: url('/'), lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ]

    for (const post of posts) {
      entries.push({
        url: url(`/post/${post.slug}`),
        lastModified: new Date((post.updated_at || post.published_at || 0) * 1000),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }

    for (const page of pages) {
      entries.push({
        url: url(`/${page.slug}`),
        lastModified: new Date((page.updated_at || 0) * 1000),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }

    for (const cat of categories) {
      entries.push({ url: url(`/category/${cat.slug}`), changeFrequency: 'weekly', priority: 0.5 })
    }

    for (const tag of tags) {
      entries.push({ url: url(`/tag/${tag.slug}`), changeFrequency: 'weekly', priority: 0.4 })
    }

    return entries
  } catch {
    return [{ url: '/', lastModified: new Date() }]
  }
}
