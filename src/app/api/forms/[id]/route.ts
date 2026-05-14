import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { getFormById, updateForm, deleteForm } from '@/lib/db'

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Ctx) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError
  const { id } = await params
  const form = await getFormById(env.DB, id)
  if (!form) return Response.json({ error: '表单不存在' }, { status: 404 })
  return Response.json(form)
}

export async function PUT(request: Request, { params }: Ctx) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError
  const { id } = await params
  const form = await getFormById(env.DB, id)
  if (!form) return Response.json({ error: '表单不存在' }, { status: 404 })

  const body = await request.json() as Record<string, unknown>
  await updateForm(env.DB, id, {
    name: body.name as string | undefined,
    slug: body.slug as string | undefined,
    description: body.description as string | undefined,
    fields: body.fields as [] | undefined,
    webhook_url: body.webhook_url as string | undefined,
    webhook_headers: body.webhook_headers as Record<string, string> | undefined,
    webhook_field_map: body.webhook_field_map as Record<string, string> | undefined,
    submit_message: body.submit_message as string | undefined,
    status: body.status as 'active' | 'paused' | undefined,
  })
  return Response.json({ ok: true })
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError
  const { id } = await params
  await deleteForm(env.DB, id)
  return Response.json({ ok: true })
}
