import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getAllTags } from '@/lib/db'


// GET /api/tags
export async function GET() {
  const { env } = getCloudflareContext()
  const tags = await getAllTags(env.DB)
  return Response.json(tags)
}
