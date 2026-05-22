import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { getThemeContentTypes } from '@/themes/registry'
import { getContentType, createContentType } from '@/lib/db'

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
  if (!contentTypes.length) return Response.json({ created: [] })

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

  return Response.json({ created })
}
