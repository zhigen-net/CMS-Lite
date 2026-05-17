export const dynamic = 'force-dynamic'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { listApiKeys } from '@/lib/db'
import { notFound } from 'next/navigation'
import ApiKeysClient from './_components/ApiKeysClient'


export default async function ApiKeysPage() {
  const { env } = getCloudflareContext()
  const cookieStore = await cookies()
  const token = cookieStore.get('cms_token')?.value
  if (!token) notFound()

  const user = await verifyToken(token, env)
  if (!user) notFound()

  const keys = await listApiKeys(env.DB, user.userId)
  return <ApiKeysClient initialKeys={keys} />
}
