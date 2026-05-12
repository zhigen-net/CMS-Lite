import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getPlugins } from '@/lib/db'
import PluginsClient from './_components/PluginsClient'


export default async function PluginsPage() {
  const { env } = getCloudflareContext()
  const plugins = await getPlugins(env.DB)
  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: '640px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#18181b', letterSpacing: '-0.02em', margin: 0 }}>插件</h1>
        <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>启用或禁用插件，扩展 CMS 功能</p>
      </div>
      <PluginsClient initialPlugins={plugins} />
    </div>
  )
}
