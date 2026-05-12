export async function uploadToR2(
  env: CloudflareEnv,
  key: string,
  file: ArrayBuffer,
  contentType: string
): Promise<string> {
  await env.R2.put(key, file, { httpMetadata: { contentType } })
  return `/uploads/${key}`
}

export async function deleteFromR2(env: CloudflareEnv, key: string): Promise<void> {
  await env.R2.delete(key)
}

export function getR2Url(key: string): string {
  return `/uploads/${key}`
}

export function generateMediaKey(filename: string): string {
  const ext = filename.split('.').pop() ?? 'bin'
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const date = new Date().toISOString().slice(0, 7)   // YYYY-MM
  return `media/${date}/${timestamp}-${random}.${ext}`
}

export function isAllowedMimeType(mimeType: string): boolean {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml',
    'video/mp4', 'video/webm',
    'application/pdf',
  ]
  return allowed.includes(mimeType)
}
