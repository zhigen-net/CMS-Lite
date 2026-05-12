import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { runAgent } from '@/lib/agents'
import type { AgentType } from '@/lib/agents'
import { z } from 'zod'


const schema = z.object({
  agent: z.enum(['content', 'seo']),
})

export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: '无效参数' }, { status: 400 })

  const { agent } = parsed.data
  const { taskId, result } = await runAgent(agent as AgentType, env)

  return Response.json({ taskId, ...result }, { status: result.success ? 200 : 500 })
}
