import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContents, getCategories, getTopTags } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import { loadTheme } from '@/lib/theme-loader'
import type { Category, Tag } from '@/types'
import type { Metadata } from 'next'
import { alternatesFor, openGraphFor } from '@/lib/seo'

const PAGE_SIZE = 12

interface Props { searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  try {
    const { env } = getCloudflareContext()
    const { page: pageStr } = await searchParams
    const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
    const s = await getSiteSettings(env.DB)
    const title = s['seo.home.title'] || s['site.name'] || ''
    const description = s['seo.home.description'] || s['site.description'] || ''
    const ogImage = s['seo.home.ogImage'] || s['seo.defaultOgImage'] || ''
    return {
      // 首页标题不套标题模板（模板一般是「%s | 站点名」，首页会变成「站点名 | 站点名」）
      title: { absolute: page > 1 ? `${title} - 第 ${page} 页` : title },
      description,
      alternates: alternatesFor('/', page),
      openGraph: openGraphFor(s, { title, description, url: '/', ...(ogImage ? { images: [ogImage] } : {}) }),
    }
  } catch { return {} }
}

export default async function HomePage({ searchParams }: Props) {
  const { env } = getCloudflareContext()
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)

  const [settings, categories, tags, { items: posts, pagination }] = await Promise.all([
    getSiteSettings(env.DB),
    getCategories(env.DB, 'post'),
    getTopTags(env.DB, 20),
    getContents(env.DB, { type: 'post', status: 'published', page, pageSize: PAGE_SIZE }),
  ])

  const categoryMap = Object.fromEntries((categories as Category[]).map(c => [c.id, c]))
  const topTags = tags as (Tag & { count: number })[]

  const themeId = settings['theme.active'] as string | undefined
  const theme = await loadTheme(themeId)
  const { Home } = theme

  return (
    <Home
      posts={posts}
      settings={settings}
      categories={categories}
      categoryMap={categoryMap}
      pagination={pagination}
      tags={topTags}
    />
  )
}
