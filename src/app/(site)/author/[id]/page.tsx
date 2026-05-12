import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getUserById, getContents } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AuthorArchive from '@/themes/default/components/AuthorArchive'

const PAGE_SIZE = 12

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { env } = getCloudflareContext()
  const author = await getUserById(env.DB, id)
  if (!author) return {}
  return { title: `${author.name} 的文章` }
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const { id } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const { env } = getCloudflareContext()

  const author = await getUserById(env.DB, id)
  if (!author) notFound()

  const { items: posts, pagination } = await getContents(env.DB, {
    type: 'post',
    status: 'published',
    authorId: id,
    page,
    pageSize: PAGE_SIZE,
  })

  return <AuthorArchive author={author} posts={posts} pagination={pagination} />
}
