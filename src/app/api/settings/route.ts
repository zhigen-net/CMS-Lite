import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getSiteSettings, updateSiteSettings } from '@/lib/config'
import { getCurrentUser, requireAdmin } from '@/lib/auth'


export async function GET() {
  const { env } = getCloudflareContext()
  const settings = await getSiteSettings(env.DB)
  return Response.json(settings)
}

export async function PATCH(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const body = await request.json() as Record<string, unknown>
  await updateSiteSettings(env.DB, body as Parameters<typeof updateSiteSettings>[1])
  return Response.json({ ok: true })
}
