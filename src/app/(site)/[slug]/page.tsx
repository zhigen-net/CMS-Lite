import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContentBySlug } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import DefaultPost from '@/themes/default/post'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'


interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { env } = getCloudflareContext()
  const page = await getContentBySlug(env.DB, 'page', slug)
  if (!page) return {}
  return {
    title: page.meta_title || page.title,
    description: page.meta_description || page.excerpt || undefined,
    openGraph: page.og_image ? { images: [page.og_image] } : undefined,
  }
}

export default async function PagePage({ params }: Props) {
  const { slug } = await params
  const { env } = getCloudflareContext()
  const [page, settings] = await Promise.all([
    getContentBySlug(env.DB, 'page', slug),
    getSiteSettings(env.DB),
  ])
  if (!page || page.status !== 'published') notFound()
  return <DefaultPost post={page} settings={settings} />
}
