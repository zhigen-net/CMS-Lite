import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getFormBySlug, getFormById, createFormSubmission, updateFormSubmission } from '@/lib/db'
import { generateId } from '@/lib/utils'
import type { FormField } from '@/types'

interface Ctx { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Ctx) {
  const { env } = getCloudflareContext()
  const { id } = await params

  // id can be either the form id or slug
  const form = await getFormById(env.DB, id) ?? await getFormBySlug(env.DB, id)
  if (!form) return Response.json({ error: '表单不存在' }, { status: 404 })
  if (form.status !== 'active') return Response.json({ error: '表单已暂停' }, { status: 403 })

  const body = await request.json() as Record<string, unknown>

  // Validate required fields
  const missing: string[] = []
  for (const field of form.fields as FormField[]) {
    if (field.required && !body[field.key]) missing.push(field.label)
  }
  if (missing.length > 0) return Response.json({ error: `必填项缺失：${missing.join('、')}` }, { status: 400 })

  // Only keep declared field keys
  const data: Record<string, unknown> = {}
  for (const field of form.fields as FormField[]) {
    if (body[field.key] !== undefined) data[field.key] = body[field.key]
  }

  const submissionId = generateId()
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || ''
  const sourceUrl = (body._source_url as string) || ''

  const webhookPending = Boolean(form.webhook_url)
  await createFormSubmission(env.DB, {
    id: submissionId,
    form_id: form.id,
    data,
    source_url: sourceUrl,
    ip,
    webhook_status: webhookPending ? 'pending' : 'skipped',
    webhook_sent_at: null,
    webhook_response: '',
  })

  // Fire-and-forget webhook
  if (webhookPending) {
    const ctx = { waitUntil: (p: Promise<unknown>) => p.catch(() => {}) }
    ctx.waitUntil(sendWebhook(env.DB, submissionId, form, data))
  }

  return Response.json({ ok: true, message: form.submit_message })
}

async function sendWebhook(
  db: D1Database,
  submissionId: string,
  form: { id: string; name: string; webhook_url: string; webhook_headers: Record<string, string>; webhook_field_map: Record<string, string> },
  data: Record<string, unknown>,
) {
  // Apply field mapping
  const payload: Record<string, unknown> = {
    form_id: form.id,
    form_name: form.name,
    submitted_at: new Date().toISOString(),
  }
  const fieldMap = form.webhook_field_map
  for (const [key, val] of Object.entries(data)) {
    const mappedKey = fieldMap[key] || key
    payload[mappedKey] = val
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...form.webhook_headers }
  let webhookStatus: 'sent' | 'failed' = 'failed'
  let webhookResponse = ''

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
      const res = await fetch(form.webhook_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      webhookResponse = await res.text().catch(() => String(res.status))
      if (res.ok) { webhookStatus = 'sent'; break }
    } catch (e) {
      webhookResponse = String(e)
    }
  }

  await updateFormSubmission(db, submissionId, {
    webhook_status: webhookStatus,
    webhook_sent_at: Math.floor(Date.now() / 1000),
    webhook_response: webhookResponse.slice(0, 500),
  })
}
