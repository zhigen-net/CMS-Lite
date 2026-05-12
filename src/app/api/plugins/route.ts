import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getPlugins, setPluginEnabled } from '@/lib/db'
import { getCurrentUser, requireAdmin } from '@/lib/auth'


export async function GET() {
  const { env } = getCloudflareContext()
  const plugins = await getPlugins(env.DB)
  return Response.json(plugins)
}

export async function PATCH(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const { id, enabled } = await request.json() as { id: string; enabled: boolean }
  await setPluginEnabled(env.DB, id, enabled)
  return Response.json({ ok: true })
}
