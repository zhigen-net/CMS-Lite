import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCategoryBySlug, getCategories, getContents } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import { loadTheme } from '@/lib/theme-loader'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const PAGE_SIZE = 12

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { env } = getCloudflareContext()
  const category = await getCategoryBySlug(env.DB, 'post', slug)
  if (!category) return {}
  return {
    title: `${category.name} · 分类`,
    description: category.description ?? undefined,
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const { env } = getCloudflareContext()

  const [settings, category, allCategories] = await Promise.all([
    getSiteSettings(env.DB),
    getCategoryBySlug(env.DB, 'post', slug),
    getCategories(env.DB, 'post'),
  ])
  if (!category) notFound()

  const { items: posts, pagination } = await getContents(env.DB, {
    type: 'post',
    status: 'published',
    categoryId: category.id,
    page,
    pageSize: PAGE_SIZE,
  })

  const themeId = settings['theme.active'] as string | undefined
  const theme = await loadTheme(themeId)
  const { Category } = theme

  return (
    <Category
      title={category.name}
      slug={slug}
      description={category.description}
      coverImage={category.cover_image}
      posts={posts}
      pagination={pagination}
      siblings={allCategories}
    />
  )
}
