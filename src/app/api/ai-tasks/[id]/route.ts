import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { getAITask } from '@/lib/db'


interface Params { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const { id } = await params
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const task = await getAITask(env.DB, id)
  if (!task) return Response.json({ error: '任务不存在' }, { status: 404 })
  return Response.json(task)
}
