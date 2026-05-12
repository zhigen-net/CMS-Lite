import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { generateImage } from '@/lib/ai'
import { uploadToR2 } from '@/lib/r2'
import { generateId } from '@/lib/utils'

export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const { prompt } = await request.json() as { prompt: string }
  if (!prompt?.trim()) return Response.json({ error: '缺少提示词' }, { status: 400 })

  const buffer = await generateImage(env, prompt)
  const key = `ai-images/${new Date().toISOString().slice(0, 7)}/${generateId()}.jpg`
  const url = await uploadToR2(env, key, buffer as ArrayBuffer, 'image/jpeg')

  return Response.json({ url })
}
