import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getMediaList } from '@/lib/db'
import MediaLibraryClient from './_components/MediaLibraryClient'


export default async function MediaPage() {
  const { env } = getCloudflareContext()
  const { items, pagination } = await getMediaList(env.DB, 1, 60)

  return (
    <div style={{ padding: '32px 32px 48px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#18181b', letterSpacing: '-0.02em', margin: 0 }}>
          媒体库
        </h1>
        <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>共 {pagination.total} 个文件</p>
      </div>
      <MediaLibraryClient initialItems={items} />
    </div>
  )
}
