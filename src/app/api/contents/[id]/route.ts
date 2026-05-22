import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContent, updateContent, deleteContent, setContentTags, setContentCategories, saveContentFields } from '@/lib/db'
import { getCurrentUser, requireAdmin } from '@/lib/auth'


interface Params { params: Promise<{ id: string }> }

// GET /api/contents/:id
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const { env } = getCloudflareContext()
  const content = await getContent(env.DB, id)
  if (!content) return Response.json({ error: '内容不存在' }, { status: 404 })
  return Response.json(content)
}

// PATCH /api/contents/:id
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const body = await request.json() as Record<string, unknown>

  // 提取关联数据，不传入 updateContent
  const tags = Array.isArray(body.tags) ? (body.tags as string[]) : null
  const categoryIds = Array.isArray(body.category_ids) ? (body.category_ids as string[]) : null
  const fields = body.fields && typeof body.fields === 'object' ? body.fields as Record<string, unknown> : null
  delete body.tags
  delete body.category_ids
  delete body.fields

  // 发布时自动设置 published_at
  if (body.status === 'published') {
    const content = await getContent(env.DB, id)
    if (content && !content.published_at) {
      body.published_at = Math.floor(Date.now() / 1000)
    }
  }

  await updateContent(env.DB, id, body)

  if (categoryIds !== null) {
    await setContentCategories(env.DB, id, categoryIds)
  }
  if (tags !== null) {
    await setContentTags(env.DB, id, tags)
  }
  if (fields !== null) {
    await saveContentFields(env.DB, id, fields)
  }

  return Response.json({ ok: true })
}

// DELETE /api/contents/:id
export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  await deleteContent(env.DB, id)
  return Response.json({ ok: true })
}
