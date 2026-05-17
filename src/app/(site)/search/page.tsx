import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContents, getCategories } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import { loadTheme } from '@/lib/theme-loader'
import type { Metadata } from 'next'
import type { Category } from '@/types'

interface Props { searchParams: Promise<{ q?: string; page?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return { title: q ? `搜索"${q}"` : '搜索', robots: 'noindex' }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const query = q.trim()

  const { env } = getCloudflareContext()

  const [settings, categories, result] = await Promise.all([
    getSiteSettings(env.DB),
    getCategories(env.DB, 'post'),
    query
      ? getContents(env.DB, { type: 'post', status: 'published', search: query, page, pageSize: 12 })
      : Promise.resolve({ items: [], pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 } }),
  ])

  const categoryMap = Object.fromEntries((categories as Category[]).map(c => [c.id, c]))
  const { items: posts, pagination } = result

  const themeId = settings['theme.active'] as string | undefined
  const theme = await loadTheme(themeId)
  const { Search } = theme

  return <Search query={query} posts={posts} pagination={pagination} categoryMap={categoryMap} />
}
