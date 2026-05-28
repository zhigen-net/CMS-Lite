'use client'

import Link from 'next/link'
import { PlusIcon, SparklesIcon, ImageIcon, FilesIcon } from '@/components/icons'
import { color, fontSize, radius, shadow, transition } from '@/app/admin/_lib/design'

interface Stat { label: string; value: number; href: string; color: string }

const ACTIONS = [
  { label: '新建文章', href: '/admin/post/new', desc: '创建并发布一篇文章', icon: PlusIcon },
  { label: 'AI 写作',  href: '/admin/ai',       desc: '让 AI 帮你生成内容', icon: SparklesIcon },
  { label: '上传媒体', href: '/admin/media',     desc: '管理图片和文件',     icon: ImageIcon },
  { label: '新建页面', href: '/admin/page/new',  desc: '创建独立页面',       icon: FilesIcon },
]

export default function DashboardCards({ stats }: { stats: Stat[] }) {
  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {stats.map(({ label, value, href, color: c }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: color.surface, borderRadius: radius.lg,
              border: `1px solid ${color.border}`,
              borderTop: `3px solid ${c}`,
              padding: '16px 20px',
              transition: `border-color ${transition.base}, box-shadow ${transition.base}`,
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = c
                el.style.boxShadow   = shadow.md
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor    = color.border
                el.style.borderTopColor = c
                el.style.boxShadow      = 'none'
              }}
            >
              <p style={{ fontSize: fontSize.sm, color: color.textTertiary, marginBottom: '10px', fontWeight: 500 }}>{label}</p>
              <p style={{ fontSize: fontSize['3xl'], fontWeight: 700, color: color.textPrimary, letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>
                {value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p style={{ fontSize: fontSize.xs, fontWeight: 600, color: color.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          快速开始
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
          {ACTIONS.map(({ label, href, desc, icon: Icon }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: radius.lg,
                border: `1px solid ${color.border}`, background: color.surface,
                transition: `border-color ${transition.base}, background ${transition.base}`,
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = color.borderStrong
                  el.style.background  = color.surfaceHover
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = color.border
                  el.style.background  = color.surface
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: radius.md,
                  background: color.muted, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, color: color.textSecondary,
                }}>
                  <Icon size={15} />
                </div>
                <div>
                  <p style={{ fontSize: fontSize.base, fontWeight: 500, color: color.textPrimary, marginBottom: '1px', margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontSize: fontSize.sm, color: color.textTertiary, margin: 0 }}>{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
