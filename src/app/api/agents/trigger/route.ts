import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getSiteSettings } from '@/lib/config'
import { runAgent } from '@/lib/agents'
import type { AgentType } from '@/lib/agents'
import { listUsers } from '@/lib/db'


export async function GET(request: Request) {
  const { env } = getCloudflareContext()
  const url = new URL(request.url)

  const token = url.searchParams.get('token') ?? ''
  const agent = (url.searchParams.get('agent') ?? 'content') as AgentType

  if (!token) {
    return Response.json({ error: '缺少 token 参数' }, { status: 400 })
  }
  if (!['content', 'seo'].includes(agent)) {
    return Response.json({ error: 'agent 参数无效，可选 content / seo' }, { status: 400 })
  }

  const settings = await getSiteSettings(env.DB)
  const triggerToken = settings['ai.trigger.token'] as string | undefined

  if (!triggerToken || token !== triggerToken) {
    return Response.json({ error: '无效的触发 Token' }, { status: 401 })
  }

  const users = await listUsers(env.DB)
  const adminUser = users.find(u => u.role === 'admin')

  try {
    const { taskId, result } = await runAgent(agent, env, adminUser?.id)
    return Response.json({ ok: true, taskId, ...result })
  } catch (err) {
    console.error('[agent trigger]', err)
    return Response.json({ ok: false, error: '执行失败' }, { status: 500 })
  }
}
