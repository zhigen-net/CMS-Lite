import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTagBySlug, getTopTags, getContents, countPublishedByTag } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import { loadTheme } from '@/lib/theme-loader'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'

const PAGE_SIZE = 12

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

// 文章少于这个数的标签页内容单薄：不让搜索引擎收录（noindex），但继续跟踪页面上的文章链接
const MIN_POSTS_TO_INDEX = 2

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const { env } = getCloudflareContext()
  const tag = await getTagBySlug(env.DB, decodeURIComponent(slug))
  if (!tag) return {}
  const count = await countPublishedByTag(env.DB, tag.id)
  return {
    title: `#${tag.name} · 标签${page > 1 ? ` - 第 ${page} 页` : ''}`,
    description: `「${tag.name}」相关的 ${count} 篇文章。`,
    alternates: alternatesFor(`/tag/${tag.slug}`, page),
    ...(count < MIN_POSTS_TO_INDEX ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const { env } = getCloudflareContext()

  // 页面上的「其它标签」只放文章最多的 30 个：原来放全部标签（几千个），单页 HTML 超过 1MB，
  // 爬虫批量抓标签页时 Worker 超出 CPU / 内存限制
  const [settings, tag, topTags] = await Promise.all([
    getSiteSettings(env.DB),
    getTagBySlug(env.DB, slug),
    getTopTags(env.DB, 30),
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
      siblings={topTags}
    />
  )
}
