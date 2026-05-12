import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getUserById, updateUser, updateUserPassword } from '@/lib/db'
import { getCurrentUser, requireAdmin, hashPassword, verifyPassword } from '@/lib/auth'
import { getUserByEmail } from '@/lib/db'

export async function GET(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const err = requireAdmin(user)
  if (err) return err
  const me = await getUserById(env.DB, user!.userId)
  if (!me) return Response.json({ error: '用户不存在' }, { status: 404 })
  return Response.json(me)
}

export async function PATCH(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const err = requireAdmin(user)
  if (err) return err

  const body = await request.json() as { name?: string; currentPassword?: string; newPassword?: string }

  if (body.newPassword !== undefined) {
    if (!body.currentPassword) return Response.json({ error: '需要填写当前密码' }, { status: 400 })
    if (body.newPassword.trim().length < 6) return Response.json({ error: '新密码至少 6 位' }, { status: 400 })
    const me = await getUserByEmail(env.DB, (await getUserById(env.DB, user!.userId))!.email)
    if (!me || !(await verifyPassword(body.currentPassword, me.password_hash))) {
      return Response.json({ error: '当前密码错误' }, { status: 400 })
    }
    await updateUserPassword(env.DB, user!.userId, await hashPassword(body.newPassword.trim()))
  }

  if (body.name?.trim()) {
    await updateUser(env.DB, user!.userId, { name: body.name.trim() })
  }

  return Response.json({ ok: true })
}
