import { getCloudflareContext } from '@opennextjs/cloudflare'
import { updateUser, updateUserPassword, deleteUser, getUserById } from '@/lib/db'
import { getCurrentUser, requireSuperAdmin, hashPassword } from '@/lib/auth'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const err = requireSuperAdmin(user)
  if (err) return err

  const body = await request.json() as { name?: string; role?: string; password?: string }

  if (body.password !== undefined) {
    if (!body.password.trim() || body.password.trim().length < 6) {
      return Response.json({ error: '密码至少 6 位' }, { status: 400 })
    }
    await updateUserPassword(env.DB, id, await hashPassword(body.password.trim()))
  }

  const update: { name?: string; role?: string } = {}
  if (body.name?.trim()) update.name = body.name.trim()
  if (body.role && ['admin', 'editor', 'author'].includes(body.role)) update.role = body.role

  if (Object.keys(update).length) await updateUser(env.DB, id, update)
  return Response.json({ ok: true })
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const err = requireSuperAdmin(user)
  if (err) return err

  if (user!.userId === id) {
    return Response.json({ error: '不能删除自己' }, { status: 400 })
  }
  const target = await getUserById(env.DB, id)
  if (!target) return Response.json({ error: '用户不存在' }, { status: 404 })
  await deleteUser(env.DB, id)
  return Response.json({ ok: true })
}
