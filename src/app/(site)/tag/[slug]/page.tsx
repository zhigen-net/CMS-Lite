import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTagBySlug, getAllTags, getContents } from '@/lib/db'
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
  const tag = await getTagBySlug(env.DB, slug)
  if (!tag) return {}
  return { title: `#${tag.name} · 标签` }
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const { env } = getCloudflareContext()

  const [settings, tag, allTags] = await Promise.all([
    getSiteSettings(env.DB),
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

  const themeId = settings['theme.active'] as string | undefined
  const theme = await loadTheme(themeId)
  const { Tag } = theme

  return (
    <Tag
      title={tag.name}
      slug={slug}
      posts={posts}
      pagination={pagination}
      siblings={allTags}
    />
  )
}
