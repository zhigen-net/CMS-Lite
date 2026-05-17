export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getSiteSettings } from '@/lib/config'
import { loadTheme } from '@/lib/theme-loader'
import type { SiteSettings } from '@/types'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { env } = getCloudflareContext()
    const s = await getSiteSettings(env.DB)
    const verification = s['seo.googleVerification'] as string | undefined
    return {
      title: {
        template: (s['seo.titleTemplate'] as string) || `%s | ${s['site.name']}`,
        default: s['site.name'] as string,
      },
      description: s['site.description'] as string,
      robots: (s['seo.robots'] as string) || 'index,follow',
      alternates: {
        types: { 'application/rss+xml': '/feed.xml' },
      },
      ...(verification ? { verification: { google: verification } } : {}),
    }
  } catch {
    return {}
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let settings: Partial<SiteSettings> = {}
  try {
    const { env } = getCloudflareContext()
    settings = await getSiteSettings(env.DB)
  } catch { /* local dev fallback */ }

  const themeId = settings['theme.active'] as string | undefined
  const theme = await loadTheme(themeId)
  const { Layout } = theme
  return <Layout settings={settings as SiteSettings}>{children}</Layout>
}
