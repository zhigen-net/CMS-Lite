import { getCloudflareContext } from '@opennextjs/cloudflare'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Content } from '@/types'
import { color, fontSize, radius, STATUS_MAP } from '@/app/admin/_lib/design'
import DashboardCards from './_components/DashboardCards'

async function getStats(db: D1Database) {
  try {
    const [published, drafts, media, users, recentRows] = await Promise.all([
      db.prepare("SELECT COUNT(*) as n FROM contents WHERE status='published'").first<{ n: number }>(),
      db.prepare("SELECT COUNT(*) as n FROM contents WHERE status='draft'").first<{ n: number }>(),
      db.prepare('SELECT COUNT(*) as n FROM media').first<{ n: number }>(),
      db.prepare('SELECT COUNT(*) as n FROM users').first<{ n: number }>(),
      db.prepare("SELECT id,title,type,status,cover_image,published_at,updated_at FROM contents ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 6")
         .all<Pick<Content, 'id' | 'title' | 'type' | 'status' | 'cover_image' | 'published_at' | 'updated_at'>>(),
    ])
    return {
      published: published?.n ?? 0,
      drafts:    drafts?.n   ?? 0,
      media:     media?.n    ?? 0,
      users:     users?.n    ?? 0,
      recent:    recentRows.results,
    }
  } catch {
    return { published: 0, drafts: 0, media: 0, users: 0, recent: [] }
  }
}

const TYPE_NAME: Record<string, string> = {
  post: '文章', page: '页面',
}

export default async function AdminDashboard() {
  const { env }  = getCloudflareContext()
  const stats    = await getStats(env.DB)

  const statCards = [
    { label: '已发布',  value: stats.published, href: '/admin/post?status=published', color: color.green  },
    { label: '草稿',    value: stats.drafts,    href: '/admin/post?status=draft',     color: color.amber  },
    { label: '媒体文件', value: stats.media,     href: '/admin/media',                 color: color.violet },
    { label: '用户',    value: stats.users,     href: '/admin/users',                 color: color.pink   },
  ]

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 860, margin: '0 auto' }}>
      {/* Page title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: fontSize.xl, fontWeight: 600, color: color.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
          概览
        </h1>
        <p style={{ fontSize: fontSize.base, color: color.textTertiary, marginTop: '4px' }}>
          查看网站当前状态
        </p>
      </div>

      <DashboardCards stats={statCards} />

      {/* Empty state */}
      {stats.recent.length === 0 && (
        <div style={{ marginTop: '32px', textAlign: 'center', padding: '48px 0' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: radius.xl,
            background: color.muted, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 14px', fontSize: '22px',
          }}>
            ✍️
          </div>
          <p style={{ fontSize: fontSize.md, fontWeight: 600, color: color.textPrimary, margin: '0 0 6px' }}>开始创作</p>
          <p style={{ fontSize: fontSize.base, color: color.textTertiary, margin: '0 0 20px' }}>
            还没有任何内容，创建第一篇文章吧
          </p>
          <Link href="/admin/post/new" style={{
            display: 'inline-block', padding: '8px 20px', borderRadius: radius.md,
            background: color.brand, color: '#fff', fontSize: fontSize.base,
            fontWeight: 600, textDecoration: 'none',
          }}>
            新建文章
          </Link>
        </div>
      )}

      {/* Recent content */}
      {stats.recent.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: fontSize.xs, fontWeight: 600, color: color.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              最近更新
            </p>
            <Link href="/admin/post" style={{ fontSize: fontSize.sm, color: color.textTertiary, textDecoration: 'none' }}>
              查看全部 →
            </Link>
          </div>

          <div style={{ border: `1px solid ${color.border}`, borderRadius: radius.lg, overflow: 'hidden', background: color.surface }}>
            {stats.recent.map((item, i) => {
              const s  = STATUS_MAP[item.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.draft
              const ts = item.updated_at ?? item.published_at
              const editHref = `/admin/${item.type}/${item.id}`
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 16px',
                  borderTop: i > 0 ? `1px solid ${color.borderSubtle}` : 'none',
                }}>
                  {/* Thumbnail */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: radius.md, flexShrink: 0,
                    background: item.cover_image ? `url(${item.cover_image}) center/cover` : color.muted,
                    border: `1px solid ${color.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {!item.cover_image && (
                      <span style={{ fontSize: fontSize.xs, color: color.textMuted, fontWeight: 700 }}>
                        {(item.title || '?').slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Title + type */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={editHref} style={{
                      fontSize: fontSize.base, fontWeight: 500, color: color.textPrimary,
                      textDecoration: 'none', display: 'block',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.title || '（无标题）'}
                    </Link>
                    <span style={{ fontSize: fontSize.xs, color: color.textMuted }}>
                      {TYPE_NAME[item.type] ?? item.type}
                    </span>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    fontSize: fontSize.xs, fontWeight: 600, padding: '3px 8px',
                    borderRadius: radius.sm, background: s.bg, color: s.text,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {s.label}
                  </span>

                  {/* Timestamp */}
                  {ts && (
                    <span style={{ fontSize: fontSize.sm, color: color.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
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
