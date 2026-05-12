import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContentWithMeta, getContentType } from '@/lib/db'
import { notFound } from 'next/navigation'
import ContentEditor from '../_components/ContentEditor'


interface Props { params: Promise<{ type: string; id: string }> }

export default async function EditContentPage({ params }: Props) {
  const { type, id } = await params
  const { env } = getCloudflareContext()
  const [contentType, content] = await Promise.all([
    getContentType(env.DB, type),
    getContentWithMeta(env.DB, id),
  ])
  if (!contentType || !content) notFound()

  return <ContentEditor contentType={contentType} initialContent={content} />
}
