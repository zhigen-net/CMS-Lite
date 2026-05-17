import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContents, createContent, setContentTags, setContentCategories } from '@/lib/db'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { generateId, slugify } from '@/lib/utils'
import { z } from 'zod'


// GET /api/contents?type=post&status=published&page=1&pageSize=20
export async function GET(request: Request) {
  const { env } = getCloudflareContext()
  const url = new URL(request.url)

  const result = await getContents(env.DB, {
    type: url.searchParams.get('type') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
    categoryId: url.searchParams.get('categoryId') ?? undefined,
    tagId: url.searchParams.get('tagId') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
    page: Number(url.searchParams.get('page') ?? 1),
    pageSize: Number(url.searchParams.get('pageSize') ?? 20),
  })

  return Response.json(result)
}

const createSchema = z.object({
  type: z.string(),
  title: z.string().min(1),
  slug: z.string().optional(),
  content: z.string().nullable().optional(),
  excerpt: z.string().nullable().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  author_id: z.string().optional(),
  category_ids: z.array(z.string()).optional(),
  cover_image: z.string().nullable().optional(),
  published_at: z.number().nullable().optional(),
  scheduled_at: z.number().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  og_image: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  parent_id: z.string().nullable().optional(),
  sort_order: z.number().optional(),
})

// POST /api/contents
export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 })
  }

  const data = parsed.data
  const id = generateId()
  const slug = data.slug || slugify(data.title) || id

  await createContent(env.DB, {
    id,
    type: data.type,
    title: data.title,
    slug,
    content: data.content ?? null,
    excerpt: data.excerpt ?? null,
    status: data.status,
    author_id: user!.userId,
    cover_image: data.cover_image ?? null,
    published_at: data.status === 'published' ? Math.floor(Date.now() / 1000) : null,
    scheduled_at: data.scheduled_at ?? null,
    meta_title: data.meta_title ?? null,
    meta_description: data.meta_description ?? null,
    og_image: data.og_image ?? null,
    ai_generated: false,
    ai_reviewed: false,
    parent_id: data.parent_id ?? null,
    sort_order: data.sort_order ?? 0,
  })

  if (data.category_ids?.length) {
    await setContentCategories(env.DB, id, data.category_ids)
  }
  if (data.tags?.length) {
    await setContentTags(env.DB, id, data.tags)
  }

  return Response.json({ id, slug }, { status: 201 })
}
