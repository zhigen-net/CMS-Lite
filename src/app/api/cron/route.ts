/**
 * Cron trigger endpoint.
 *
 * Production wiring (Cloudflare Workers):
 *   Deploy a tiny Worker with [triggers] crons = ["0 2 * * *"] whose
 *   scheduled() handler does:
 *     await fetch('https://your-site.pages.dev/api/cron', {
 *       method: 'POST',
 *       headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
 *       body: JSON.stringify({ agents: ['content', 'seo'] }),
 *     })
 *
 * Manual test:
 *   curl -X POST /api/cron \
 *     -H "Authorization: Bearer <CRON_SECRET>" \
 *     -d '{"agents":["content"]}'
 */
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { runAgent } from '@/lib/agents'
import type { AgentType } from '@/lib/agents'
import { z } from 'zod'
import { listUsers, publishScheduled } from '@/lib/db'


const schema = z.object({
  agents: z.array(z.enum(['content', 'seo'])).default(['content', 'seo']),
})

export async function POST(request: Request) {
  const { env } = getCloudflareContext()

  // Validate cron secret
  const cronSecret = (env as unknown as Record<string, string>).CRON_SECRET
  const auth = request.headers.get('Authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return Response.json({ error: '未授权，请提供有效的 CRON_SECRET' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  const agents = parsed.success ? parsed.data.agents : ['content', 'seo']

  // Use first admin user as author for cron-triggered content
  const users = await listUsers(env.DB)
  const adminUser = users.find(u => u.role === 'admin')
  const userId = adminUser?.id

  // 定时发布：先于 agents 运行，将到期的 scheduled 内容切换为 published
  let scheduledResult: { published: number; ids: string[] } = { published: 0, ids: [] }
  try {
    scheduledResult = await publishScheduled(env.DB)
  } catch (err) {
    console.error('publishScheduled error', err)
  }

  const results: Record<string, unknown> = {}
  for (const agent of agents) {
    try {
      const { taskId, result } = await runAgent(agent as AgentType, env, userId)
      results[agent] = { taskId, ...result }
    } catch (err) {
      console.error(`[cron] agent ${agent} failed`, err)
      results[agent] = { success: false, error: '执行失败' }
    }
  }

  return Response.json({ ok: true, scheduled: scheduledResult, results })
}
