import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getSiteSettings } from '@/lib/config'
import themes from '@/themes'
import type { NavItem } from '@/types'
import AppearanceHub from './_components/AppearanceHub'

export default async function AppearancePage() {
  const { env } = getCloudflareContext()
  const settings = await getSiteSettings(env.DB)
  const activeThemeId = (settings['theme.active'] as string) || 'default'

  return (
    <AppearanceHub
      initialSettings={settings}
      themes={themes}
      activeThemeId={activeThemeId}
      initialMain={(settings['nav.main'] as NavItem[]) || []}
      initialFooter={(settings['nav.footer'] as NavItem[]) || []}
      initialCss={(settings['theme.customCss'] as string) || ''}
      initialHeaderHtml={(settings['theme.headerHtml'] as string) || ''}
      initialFooterHtml={(settings['theme.footerHtml'] as string) || ''}
      initialJs={(settings['theme.customJs'] as string) || ''}
    />
  )
}
