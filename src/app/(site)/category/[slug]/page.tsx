import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCategoryBySlug, getCategories, getContents } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ArchiveList from '@/themes/default/components/ArchiveList'


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
  const { slug } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const { env } = getCloudflareContext()

  const [category, allCategories] = await Promise.all([
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

  return (
    <ArchiveList
      title={category.name}
      slug={slug}
      description={category.description}
      posts={posts}
      type="category"
      pagination={pagination}
      siblings={allCategories}
    />
  )
}
