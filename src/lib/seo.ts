import { headers } from 'next/headers'
import type { Metadata } from 'next'
import type { SiteSettings } from '@/types'

/**
 * 站点的正式网址：优先后台「站点网址」（site.url），没填时用当前访问的域名。
 * 用作 metadataBase，让 canonical、Open Graph 里的相对路径都解析成完整网址。
 */
export async function siteBaseUrl(settings: Partial<SiteSettings>): Promise<string | null> {
  const configured = (settings['site.url'] as string | undefined)?.trim().replace(/\/$/, '')
  if (configured) return configured
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host')
    return host ? `https://${host}` : null
  } catch {
    return null
  }
}

/**
 * 页面的 canonical（相对路径，配合 layout 里的 metadataBase）。第 2 页以后带上 ?page=N，
 * 每一页各自是 canonical，避免分页被当成重复内容。RSS 链接一并带上（子页面的 alternates 会整体覆盖 layout 的）。
 */
export function alternatesFor(path: string, page = 1): Metadata['alternates'] {
  return {
    canonical: page > 1 ? `${path}?page=${page}` : path,
    types: { 'application/rss+xml': '/feed.xml' },
  }
}

/** 列表页 / 文章页的 Open Graph：子页面的 openGraph 会整体覆盖 layout 的，所以站点名、语言每次都带上 */
export function openGraphFor(settings: Partial<SiteSettings>, og: NonNullable<Metadata['openGraph']>): Metadata['openGraph'] {
  return {
    siteName: (settings['site.name'] as string) || undefined,
    locale: 'zh_CN',
    type: 'website',
    ...og,
  }
}
