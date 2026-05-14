import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { getFormSubmissionById, getFormById, updateFormSubmission } from '@/lib/db'
import type { FormField } from '@/types'

interface Ctx { params: Promise<{ id: string; sid: string }> }

export async function POST(request: Request, { params }: Ctx) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const { id, sid } = await params
  const [submission, form] = await Promise.all([
    getFormSubmissionById(env.DB, sid),
    getFormById(env.DB, id),
  ])
  if (!submission || !form) return Response.json({ error: '记录不存在' }, { status: 404 })
  if (!form.webhook_url) return Response.json({ error: '表单未配置 Webhook' }, { status: 400 })

  const fieldMap = form.webhook_field_map
  const payload: Record<string, unknown> = {
    form_id: form.id,
    form_name: form.name,
    submitted_at: new Date(submission.created_at * 1000).toISOString(),
  }
  for (const [key, val] of Object.entries(submission.data)) {
    payload[fieldMap[key] || key] = val
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...form.webhook_headers }
  let webhookStatus: 'sent' | 'failed' = 'failed'
  let webhookResponse = ''
  try {
    const res = await fetch(form.webhook_url, { method: 'POST', headers, body: JSON.stringify(payload) })
    webhookResponse = await res.text().catch(() => String(res.status))
    if (res.ok) webhookStatus = 'sent'
  } catch (e) {
    webhookResponse = String(e)
  }

  await updateFormSubmission(env.DB, sid, {
    webhook_status: webhookStatus,
    webhook_sent_at: Math.floor(Date.now() / 1000),
    webhook_response: webhookResponse.slice(0, 500),
  })

  return Response.json({ ok: true, webhook_status: webhookStatus })
}
