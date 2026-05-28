import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { getThemeContentTypes, getThemeDefaultNav, getThemeDefaultPages } from '@/themes/registry'
import { getContentType, createContentType, getContentBySlug, createContent, getSettings, setSetting } from '@/lib/db'
import { generateId } from '@/lib/utils'

interface Params { params: Promise<{ id: string }> }

// POST /api/themes/:id/provision
// Idempotently creates content types declared by the theme (skips existing ones).
export async function POST(request: Request, { params }: Params) {
  const { id: themeId } = await params
  const { env } = getCloudflareContext()

  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const contentTypes = getThemeContentTypes(themeId)
  const created: string[] = []

  for (const def of contentTypes) {
    const existing = await getContentType(env.DB, def.id)
    if (existing) continue

    await createContentType(env.DB, {
      id: def.id,
      name: def.name,
      slug: def.slug,
      icon: def.icon,
      has_timeline: def.has_timeline ?? false,
      has_author: def.has_author ?? false,
      has_category: def.has_category ?? true,
      has_tag: def.has_tag ?? false,
      fields: def.fields,
    })
    created.push(def.id)
  }

  // Seed default nav if the theme provides one and nav.main is not yet configured
  const defaultNav = getThemeDefaultNav(themeId)
  if (defaultNav.length) {
    const existing = await getSettings(env.DB, ['nav.main'])
    if (!existing['nav.main'] || (existing['nav.main'] as unknown[]).length === 0) {
      await setSetting(env.DB, 'nav.main', defaultNav)
    }
  }

  // Seed default pages declared by the theme (idempotent: skips existing slugs)
  const defaultPages = getThemeDefaultPages(themeId)
  const createdPages: string[] = []
  for (const def of defaultPages) {
    const existing = await getContentBySlug(env.DB, 'page', def.slug)
    if (existing) continue
    await createContent(env.DB, {
      id: generateId(),
      type: 'page',
      title: def.title,
      slug: def.slug,
      excerpt: def.excerpt ?? null,
      content: def.content ?? null,
      status: 'published',
      author_id: null,
      cover_image: null,
      published_at: Math.floor(Date.now() / 1000),
      scheduled_at: null,
      meta_title: null,
      meta_description: null,
      og_image: null,
      ai_generated: false,
      ai_reviewed: false,
      parent_id: null,
      sort_order: 0,
    })
    createdPages.push(def.slug)
  }

  return Response.json({ created, createdPages })
}
