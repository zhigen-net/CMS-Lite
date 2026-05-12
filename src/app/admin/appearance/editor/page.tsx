import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getSiteSettings } from '@/lib/config'
import ThemeEditorClient from './_components/ThemeEditorClient'

export default async function ThemeEditorPage() {
  const { env } = getCloudflareContext()
  const settings = await getSiteSettings(env.DB)

  return (
    /* calc: 100vh - admin topbar 48px */
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid #e4e4e7', flexShrink: 0 }}>
        <h1 style={{ fontSize: '15px', fontWeight: 600, color: '#18181b', margin: 0 }}>主题编辑器</h1>
        <p style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>
          编辑 CSS、HTML 注入和自定义 JS，保存后实时生效，无需重新部署
        </p>
      </div>
      <ThemeEditorClient
        initialCss={(settings['theme.customCss'] as string) || ''}
        initialHeaderHtml={(settings['theme.headerHtml'] as string) || ''}
        initialFooterHtml={(settings['theme.footerHtml'] as string) || ''}
        initialJs={(settings['theme.customJs'] as string) || ''}
      />
    </div>
  )
}
