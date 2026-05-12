import { nanoid } from 'nanoid'

export function generateId(): string {
  return nanoid(16)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getEnv(): CloudflareEnv {
  return process.env as unknown as CloudflareEnv
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status)
}

export function formatDate(timestamp: number, locale = 'zh-CN'): string {
  return new Date(timestamp * 1000).toLocaleDateString(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function estimateReadingTime(content: string): number {
  const wordsPerMinute = 300
  const wordCount = content.replace(/<[^>]*>/g, '').length
  return Math.max(1, Math.round(wordCount / wordsPerMinute))
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '…'
}
