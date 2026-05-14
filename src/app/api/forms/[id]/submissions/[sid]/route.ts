import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { deleteFormSubmission } from '@/lib/db'

interface Ctx { params: Promise<{ id: string; sid: string }> }

export async function DELETE(request: Request, { params }: Ctx) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError
  const { sid } = await params
  await deleteFormSubmission(env.DB, sid)
  return Response.json({ ok: true })
}
