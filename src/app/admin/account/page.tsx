export const dynamic = 'force-dynamic'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getUserById, listApiKeys } from '@/lib/db'
import { notFound } from 'next/navigation'
import AccountClient from './_components/AccountClient'


export default async function AccountPage() {
  const { env } = getCloudflareContext()
  const cookieStore = await cookies()
  const token = cookieStore.get('cms_token')?.value
  if (!token) notFound()

  const session = await verifyToken(token, env)
  if (!session) notFound()

  const [user, apiKeys] = await Promise.all([
    getUserById(env.DB, session.userId),
    listApiKeys(env.DB, session.userId),
  ])
  if (!user) notFound()

  return <AccountClient user={user} initialApiKeys={apiKeys} />
}
