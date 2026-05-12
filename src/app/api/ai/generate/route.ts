import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { generateArticle, generateSEOMeta } from '@/lib/ai'
import { createContent } from '@/lib/db'
import { generateId, slugify } from '@/lib/utils'
import { z } from 'zod'


const schema = z.object({
  topic: z.string().min(1),
  type: z.string().default('post'),
  style: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  keywords: z.array(z.string()).optional(),
  autoPublish: z.boolean().default(false),
})

export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { topic, type, style, length, keywords, autoPublish } = parsed.data

  // 生成文章
  const article = await generateArticle(env, { topic, style, length, keywords })
  const seo = await generateSEOMeta(env, { title: article.title, content: article.content })

  const id = generateId()
  const slug = slugify(article.title) || id

  await createContent(env.DB, {
    id,
    type,
    title: article.title,
    slug,
    content: article.content,
    excerpt: article.excerpt,
    status: autoPublish ? 'published' : 'draft',
    author_id: user!.userId,
    cover_image: null,
    parent_id: null,
    sort_order: 0,
    published_at: autoPublish ? Math.floor(Date.now() / 1000) : null,
    scheduled_at: null,
    meta_title: seo.metaTitle,
    meta_description: seo.metaDescription,
    og_image: null,
    ai_generated: true,
    ai_reviewed: false,
  })

  return Response.json({ id, slug, title: article.title, status: autoPublish ? 'published' : 'draft' }, { status: 201 })
}
