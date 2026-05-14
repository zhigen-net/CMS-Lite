import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { getForms, createForm } from '@/lib/db'
import { generateId } from '@/lib/utils'

export async function GET(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError
  const forms = await getForms(env.DB)
  return Response.json(forms)
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const body = await request.json() as Record<string, unknown>
  const name = (body.name as string)?.trim()
  if (!name) return Response.json({ error: '名称不能为空' }, { status: 400 })

  const rawSlug = (body.slug as string)?.trim() || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-')
  const slug = rawSlug || generateId()
  const id = generateId()

  await createForm(env.DB, {
    id, name, slug,
    description: (body.description as string) || '',
    fields: (body.fields as []) || [],
    webhook_url: (body.webhook_url as string) || '',
    webhook_headers: (body.webhook_headers as Record<string, string>) || {},
    webhook_field_map: (body.webhook_field_map as Record<string, string>) || {},
    submit_message: (body.submit_message as string) || '提交成功！我们会尽快与您联系。',
    status: (body.status as 'active' | 'paused') || 'active',
  })

  return Response.json({ id, slug }, { status: 201 })
}
