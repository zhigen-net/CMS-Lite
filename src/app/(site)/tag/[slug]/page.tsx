import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTagBySlug, getAllTags, getContents } from '@/lib/db'
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
  const tag = await getTagBySlug(env.DB, slug)
  if (!tag) return {}
  return { title: `#${tag.name} · 标签` }
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const { env } = getCloudflareContext()

  const [tag, allTags] = await Promise.all([
    getTagBySlug(env.DB, slug),
    getAllTags(env.DB),
  ])
  if (!tag) notFound()

  const { items: posts, pagination } = await getContents(env.DB, {
    type: 'post',
    status: 'published',
    tagId: tag.id,
    page,
    pageSize: PAGE_SIZE,
  })

  return (
    <ArchiveList
      title={tag.name}
      slug={slug}
      posts={posts}
      type="tag"
      pagination={pagination}
      siblings={allTags}
    />
  )
}
