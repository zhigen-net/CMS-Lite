import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContentType } from '@/lib/db'
import { notFound } from 'next/navigation'
import ContentEditor from '../_components/ContentEditor'


interface Props { params: Promise<{ type: string }> }

export default async function NewContentPage({ params }: Props) {
  const { type } = await params
  const { env } = getCloudflareContext()
  const contentType = await getContentType(env.DB, type)
  if (!contentType) notFound()

  return <ContentEditor contentType={contentType} />
}
