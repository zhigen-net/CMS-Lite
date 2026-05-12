import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { suggestTopics } from '@/lib/agents/content-agent'
import { getContents } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import { DEFAULT_MODELS } from '@/lib/ai'
import { z } from 'zod'

const schema = z.object({
  count: z.number().int().min(1).max(20).optional(),
})

export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: '无效参数' }, { status: 400 })

  const settings = await getSiteSettings(env.DB)
  const siteName       = (settings['site.name'] as string) || '我的站点'
  const siteTopics     = (settings['ai.content.siteTopics'] as string) || ''
  const targetAudience = (settings['ai.content.targetAudience'] as string) || ''
  const avoidTopics    = (settings['ai.content.avoidTopics'] as string) || ''
  const topicModel     = (settings['ai.topic.model'] as string) || DEFAULT_MODELS.topic
  const topicPrompt    = (settings['ai.topic.prompt'] as string) || ''
  const count = parsed.data.count || Number(settings['ai.content.count']) || 5

  const { items: recent } = await getContents(env.DB, { type: 'post', pageSize: 30 })
  const existingTitles = recent.map(p => p.title)

  try {
    const topics = await suggestTopics(env, existingTitles, {
      siteName, count, siteTopics, targetAudience, avoidTopics,
      topicPrompt: topicPrompt || undefined,
      model: topicModel,
    })
    return Response.json({ topics })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : '生成失败' }, { status: 500 })
  }
}
