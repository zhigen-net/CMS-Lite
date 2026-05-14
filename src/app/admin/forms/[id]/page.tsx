import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getFormById, getFormSubmissions } from '@/lib/db'
import { notFound } from 'next/navigation'
import FormEditor from '../_components/FormEditor'

interface Props { params: Promise<{ id: string }> }

export default async function FormDetailPage({ params }: Props) {
  const { id } = await params
  const { env } = getCloudflareContext()
  const [form, { items: submissions, total }] = await Promise.all([
    getFormById(env.DB, id),
    getFormSubmissions(env.DB, id, 1, 20),
  ])
  if (!form) notFound()
  return <FormEditor form={form} submissions={submissions} submissionsTotal={total} />
}
