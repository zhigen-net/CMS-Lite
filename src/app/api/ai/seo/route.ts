import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { generateSEOMeta } from '@/lib/ai'


export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const { title, content } = await request.json() as { title: string; content: string }
  if (!title) return Response.json({ error: '缺少 title' }, { status: 400 })

  const result = await generateSEOMeta(env, { title, content: content ?? '' })
  return Response.json(result)
}
