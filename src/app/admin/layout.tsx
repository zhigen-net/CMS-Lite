export const dynamic = 'force-dynamic'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContentTypes } from '@/lib/db'
import AdminShell from './_components/AdminShell'

export type CustomTypeNavItem = { id: string; slug: string; name: string; icon: string }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let customTypes: CustomTypeNavItem[] = []
  try {
    const { env } = getCloudflareContext()
    const all = await getContentTypes(env.DB)
    customTypes = all
      .filter(t => !t.is_builtin)
      .map(t => ({ id: t.id, slug: t.slug, name: t.name, icon: t.icon || '📄' }))
  } catch {}
  return <AdminShell customTypes={customTypes}>{children}</AdminShell>
}
