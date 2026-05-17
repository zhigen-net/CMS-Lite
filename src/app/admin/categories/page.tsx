import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCategoriesWithCount } from '@/lib/db'
import CategoriesClient from './_components/CategoriesClient'

export default async function CategoriesPage() {
  const { env } = getCloudflareContext()
  const [posts, pages] = await Promise.all([
    getCategoriesWithCount(env.DB, 'post'),
    getCategoriesWithCount(env.DB, 'page'),
  ])
  return <CategoriesClient initialPost={posts} initialPage={pages} />
}
