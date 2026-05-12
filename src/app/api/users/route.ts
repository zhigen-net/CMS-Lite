import { getCloudflareContext } from '@opennextjs/cloudflare'
import { listUsers, createUser } from '@/lib/db'
import { getCurrentUser, requireSuperAdmin, hashPassword } from '@/lib/auth'
import { generateId } from '@/lib/utils'

export async function GET(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const err = requireSuperAdmin(user)
  if (err) return err
  const users = await listUsers(env.DB)
  return Response.json(users)
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const err = requireSuperAdmin(user)
  if (err) return err

  const body = await request.json() as { name?: string; email?: string; password?: string; role?: string }
  if (!body.name?.trim() || !body.email?.trim() || !body.password?.trim()) {
    return Response.json({ error: '姓名、邮箱、密码不能为空' }, { status: 400 })
  }
  const role = body.role && ['admin', 'editor', 'author'].includes(body.role) ? body.role : 'editor'
  const id = generateId()
  const passwordHash = await hashPassword(body.password.trim())
  try {
    await createUser(env.DB, { id, email: body.email.trim(), name: body.name.trim(), role, password_hash: passwordHash })
  } catch {
    return Response.json({ error: '邮箱已存在' }, { status: 409 })
  }
  return Response.json({ id }, { status: 201 })
}
