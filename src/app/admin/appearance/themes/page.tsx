import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getSiteSettings } from '@/lib/config'
import themes from '@/themes'
import ThemesClient from './_components/ThemesClient'

export default async function ThemesPage() {
  const { env } = getCloudflareContext()
  const settings = await getSiteSettings(env.DB)
  const activeThemeId = (settings['theme.active'] as string) || 'default'

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#18181b', letterSpacing: '-0.02em', margin: 0 }}>主题</h1>
        <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>选择并启用站点主题，每个主题有独立的样式和布局风格</p>
      </div>
      <ThemesClient themes={themes} activeThemeId={activeThemeId} />
    </div>
  )
}
