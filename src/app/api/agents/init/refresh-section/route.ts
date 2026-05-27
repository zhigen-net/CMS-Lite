import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdmin } from '@/lib/auth'
import { getCurrentUserWithApiKey } from '@/lib/apiKeyAuth'
import { refreshSection } from '@/lib/agents/init-agent'
import { z } from 'zod'

const schema = z.object({
  sectionType: z.enum(['contact', 'about', 'team', 'services', 'cases']),
  contentSourceUrl: z.string().url(),
})

export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUserWithApiKey(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: '无效参数' }, { status: 400 })

  try {
    const data = await refreshSection(env, parsed.data.sectionType, parsed.data.contentSourceUrl)
    return Response.json({ ok: true, data })
  } catch (err) {
    console.error('[refresh-section]', err)
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
