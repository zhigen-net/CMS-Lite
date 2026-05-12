import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getMediaById, deleteMedia } from '@/lib/db'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { deleteFromR2 } from '@/lib/r2'


interface Params { params: Promise<{ id: string }> }

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const media = await getMediaById(env.DB, id)
  if (!media) return Response.json({ error: '媒体文件不存在' }, { status: 404 })

  await Promise.all([
    deleteFromR2(env, media.r2_key),
    deleteMedia(env.DB, id),
  ])

  return Response.json({ ok: true })
}
