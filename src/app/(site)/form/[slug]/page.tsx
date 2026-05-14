export const dynamic = 'force-dynamic'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getFormBySlug } from '@/lib/db'
import { notFound } from 'next/navigation'
import PublicForm from './PublicForm'

interface Props { params: Promise<{ slug: string }> }

export default async function FormPage({ params }: Props) {
  const { slug } = await params
  const { env } = getCloudflareContext()
  const form = await getFormBySlug(env.DB, slug)
  if (!form || form.status !== 'active') notFound()
  return <PublicForm form={form} />
}
