import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { User } from '@/types'

const COOKIE_NAME = 'cms_token'
const TOKEN_EXPIRY = '7d'

function getSecret(env: CloudflareEnv): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET || 'dev-secret-change-in-production')
}

export async function signToken(payload: { userId: string; role: string }, env: CloudflareEnv): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret(env))
}

export async function verifyToken(token: string, env: CloudflareEnv): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(env))
    return payload as { userId: string; role: string }
  } catch {
    return null
  }
}

export async function getTokenFromRequest(request: Request): Promise<string | null> {
  // 优先从 Authorization header 读取
  const auth = request.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)

  // 从 Cookie 读取
  const cookie = request.headers.get('Cookie')
  if (!cookie) return null
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  return match?.[1] ?? null
}

export async function getCurrentUser(request: Request, env: CloudflareEnv): Promise<{ userId: string; role: string } | null> {
  const token = await getTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token, env)
}

export function requireAdmin(user: { role: string } | null): Response | null {
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return new Response(JSON.stringify({ error: '未授权，请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return null
}

export function requireSuperAdmin(user: { role: string } | null): Response | null {
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: '权限不足，需要管理员权限' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return null
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password)
  return inputHash === hash
}
