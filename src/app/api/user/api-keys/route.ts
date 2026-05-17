import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser } from '@/lib/auth'
import { generateApiKey, hashApiKey } from '@/lib/auth'
import { createApiKey, listApiKeys } from '@/lib/db'


export async function GET(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  if (!user) return Response.json({ error: '未授权' }, { status: 401 })

  const keys = await listApiKeys(env.DB, user.userId)
  return Response.json(keys)
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  if (!user) return Response.json({ error: '未授权' }, { status: 401 })

  const { name, permissions } = await request.json() as { name: string; permissions: string[] }
  if (!name?.trim()) return Response.json({ error: '请填写名称' }, { status: 400 })

  const validPerms = ['content:write', 'agent:run']
  const perms = (permissions ?? validPerms).filter(p => validPerms.includes(p))

  const key = generateApiKey()
  const hash = await hashApiKey(key)
  const prefix = key.slice(5, 13)  // 8 chars after 'cmsk_'

  await createApiKey(env.DB, user.userId, name.trim(), perms, hash, prefix)

  return Response.json({ key })  // only time full key is returned
}
