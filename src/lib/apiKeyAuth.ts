import { getTokenFromRequest, verifyToken, hashApiKey } from './auth'
import { getApiKeyByHash, getUserById } from './db'

export async function getCurrentUserWithApiKey(
  request: Request,
  env: CloudflareEnv,
): Promise<{ userId: string; role: string; permissions?: string[] } | null> {
  const token = await getTokenFromRequest(request)
  if (!token) return null

  if (!token.startsWith('cmsk_')) {
    return verifyToken(token, env)
  }

  const hash = await hashApiKey(token)
  const apiKey = await getApiKeyByHash(env.DB, hash)
  if (!apiKey) return null

  const user = await getUserById(env.DB, apiKey.user_id)
  if (!user) return null

  return { userId: apiKey.user_id, role: user.role, permissions: apiKey.permissions }
}
