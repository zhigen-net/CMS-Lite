import { getCloudflareContext } from '@opennextjs/cloudflare'
import DashboardCards from './_components/DashboardCards'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Content } from '@/types'

async function getStats(db: D1Database) {
  try {
    const [published, drafts, media, users, recentRows] = await Promise.all([
      db.prepare("SELECT COUNT(*) as n FROM contents WHERE status='published'").first<{ n: number }>(),
      db.prepare("SELECT COUNT(*) as n FROM contents WHERE status='draft'").first<{ n: number }>(),
      db.prepare('SELECT COUNT(*) as n FROM media').first<{ n: number }>(),
      db.prepare('SELECT COUNT(*) as n FROM users').first<{ n: number }>(),
      db.prepare("SELECT id,title,type,status,published_at,updated_at FROM contents ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 6").all<Pick<Content, 'id' | 'title' | 'type' | 'status' | 'published_at' | 'updated_at'>>(),
    ])
    return {
      published: published?.n ?? 0,
      drafts: drafts?.n ?? 0,
      media: media?.n ?? 0,
      users: users?.n ?? 0,
      recent: recentRows.results,
    }
  } catch { return { published: 0, drafts: 0, media: 0, users: 0, recent: [] } }
}

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  published: { label: '已发布', bg: 'rgba(16,185,129,0.1)', color: '#059669' },
  draft:     { label: '草稿',   bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
  scheduled: { label: '定时',   bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
}

export default async function AdminDashboard() {
  const { env } = getCloudflareContext()
  const stats = await getStats(env.DB)

  const statCards = [
    { label: '已发布', value: stats.published, href: '/admin/post?status=published', color: '#10b981' },
    { label: '草稿', value: stats.drafts, href: '/admin/post?status=draft', color: '#f59e0b' },
    { label: '媒体文件', value: stats.media, href: '/admin/media', color: '#6366f1' },
    { label: '用户', value: stats.users, href: '/admin/users', color: '#ec4899' },
  ]

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#18181b', letterSpacing: '-0.02em', margin: 0 }}>
          概览
        </h1>
        <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>
          你好，查看网站当前状态
        </p>
      </div>

      <DashboardCards stats={statCards} />

      {/* Recent content */}
      {stats.recent.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              最近更新
            </p>
            <Link href="/admin/post" style={{ fontSize: '12px', color: '#71717a', textDecoration: 'none' }}>
              查看全部 →
            </Link>
          </div>
          <div style={{ border: '1px solid #e4e4e7', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
            {stats.recent.map((item, i) => {
              const s = STATUS_STYLE[item.status] ?? STATUS_STYLE.draft
              const ts = item.updated_at ?? item.published_at
              const editHref = `/admin/${item.type}/${item.id}`
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 16px',
                  borderTop: i > 0 ? '1px solid #f4f4f5' : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={editHref} style={{
                      fontSize: '13px', fontWeight: 500, color: '#18181b',
                      textDecoration: 'none', display: 'block',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.title || '（无标题）'}
                    </Link>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 500, padding: '2px 7px',
                    borderRadius: '99px', background: s.bg, color: s.color,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>{s.label}</span>
                  {ts && (
                    <span style={{ fontSize: '12px', color: '#a1a1aa', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatDate(ts)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
