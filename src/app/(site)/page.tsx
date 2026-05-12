import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContents, getCategories } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import DefaultHome from '@/themes/default/home'
import type { Category } from '@/types'

const PAGE_SIZE = 12

interface Props { searchParams: Promise<{ page?: string }> }

export default async function HomePage({ searchParams }: Props) {
  const { env } = getCloudflareContext()
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)

  const [settings, categories, { items: posts, pagination }] = await Promise.all([
    getSiteSettings(env.DB),
    getCategories(env.DB, 'post'),
    getContents(env.DB, { type: 'post', status: 'published', page, pageSize: PAGE_SIZE }),
  ])

  const categoryMap = Object.fromEntries(
    (categories as Category[]).map(c => [c.id, c])
  )

  return (
    <DefaultHome
      posts={posts}
      settings={settings}
      categories={categories}
      categoryMap={categoryMap}
      pagination={pagination}
    />
  )
}
