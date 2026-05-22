export const dynamic = 'force-dynamic'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContentTypes, getCategoriesWithCount } from '@/lib/db'
import CategoriesClient from './_components/CategoriesClient'

export default async function CategoriesPage() {
  const { env } = getCloudflareContext()

  const allTypes = await getContentTypes(env.DB)
  const typesWithCats = allTypes.filter(t => t.has_category)

  const categoriesByType = await Promise.all(
    typesWithCats.map(t => getCategoriesWithCount(env.DB, t.id))
  )

  const types = typesWithCats.map((t, i) => ({
    id:         t.id,
    name:       t.name,
    icon:       t.icon || '📄',
    categories: categoriesByType[i],
  }))

  return <CategoriesClient types={types} />
}
