import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getSiteSettings } from '@/lib/config'
import MenusClient from './_components/MenusClient'
import type { NavItem } from '@/types'

export default async function MenusPage() {
  const { env } = getCloudflareContext()
  const settings = await getSiteSettings(env.DB)

  const mainNav = (settings['nav.main'] as NavItem[]) || []
  const footerNav = (settings['nav.footer'] as NavItem[]) || []

  return (
    <div style={{ padding: '32px 40px 48px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#18181b', letterSpacing: '-0.02em', margin: 0 }}>导航菜单</h1>
        <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>编辑主导航和页脚链接，支持添加、排序和删除</p>
      </div>
      <MenusClient initialMain={mainNav} initialFooter={footerNav} />
    </div>
  )
}
