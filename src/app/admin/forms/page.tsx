import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getForms } from '@/lib/db'
import FormsClient from './_components/FormsClient'

export default async function FormsPage() {
  const { env } = getCloudflareContext()
  const forms = await getForms(env.DB)
  return <FormsClient initialForms={forms} />
}
