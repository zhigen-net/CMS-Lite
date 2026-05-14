import { getCloudflareContext } from '@opennextjs/cloudflare'
import { updateCategorySortOrders } from '@/lib/db'
import { getCurrentUser, requireAdmin } from '@/lib/auth'

// PATCH /api/categories/sort — body: { orders: [{id, sort_order}] }
export async function PATCH(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const { orders } = await request.json() as { orders: { id: string; sort_order: number }[] }
  if (!Array.isArray(orders) || orders.length === 0) return Response.json({ error: '参数不完整' }, { status: 400 })

  await updateCategorySortOrders(env.DB, orders)
  return Response.json({ ok: true })
}
