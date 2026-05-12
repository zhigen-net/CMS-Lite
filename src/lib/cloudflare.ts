// 统一获取 Cloudflare 上下文，兼容本地 next dev 开发模式

let _ctx: { env: CloudflareEnv } | null = null

export function getEnv(): CloudflareEnv {
  // 生产/preview 环境：从 OpenNext 上下文获取
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare')
    const ctx = getCloudflareContext()
    return ctx.env
  } catch {
    // 本地 next dev 开发模式：返回 process.env 作为 mock
    return process.env as unknown as CloudflareEnv
  }
}
