import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { getFormSubmissions } from '@/lib/db'

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Ctx) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const { id } = await params
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const { items, total } = await getFormSubmissions(env.DB, id, page, 20)
  return Response.json({ items, total, page })
}
