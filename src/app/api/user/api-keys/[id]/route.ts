import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser } from '@/lib/auth'
import { deleteApiKey } from '@/lib/db'


export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  if (!user) return Response.json({ error: '未授权' }, { status: 401 })

  const { id } = await params
  await deleteApiKey(env.DB, id, user.userId)
  return Response.json({ ok: true })
}
