import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getSiteSettings } from '@/lib/config'
import SettingsClient from './_components/SettingsClient'


export default async function SettingsPage() {
  const { env } = getCloudflareContext()
  const settings = await getSiteSettings(env.DB)
  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#18181b', letterSpacing: '-0.02em', margin: 0 }}>设置</h1>
        <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>管理站点基本信息与运营配置</p>
      </div>
      <SettingsClient initialSettings={settings} />
    </div>
  )
}
