'use client'

import Link from 'next/link'
import { PlusIcon, SparklesIcon, ImageIcon, FilesIcon } from '@/components/icons'

interface Stat { label: string; value: number; href: string; color: string }

const ACTIONS = [
  { label: '新建文章', href: '/admin/post/new', desc: '创建并发布一篇文章', icon: PlusIcon },
  { label: 'AI 写作', href: '/admin/post/new', desc: '让 AI 帮你生成内容', icon: SparklesIcon },
  { label: '上传媒体', href: '/admin/media', desc: '管理图片和文件', icon: ImageIcon },
  { label: '新建页面', href: '/admin/page/new', desc: '创建独立页面', icon: FilesIcon },
]

export default function DashboardCards({ stats }: { stats: Stat[] }) {
  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {stats.map(({ label, value, href, color }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', border: '1px solid #e4e4e7', borderRadius: '10px',
              padding: '16px 20px', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = '#d1d1d6')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = '#e4e4e7')}
            >
              <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '10px', fontWeight: 500 }}>{label}</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#18181b', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {value}
              </p>
              <div style={{ width: '24px', height: '2px', background: color, borderRadius: '1px', marginTop: '10px' }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          快速开始
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
          {ACTIONS.map(({ label, href, desc, icon: Icon }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '8px',
                border: '1px solid #e4e4e7', background: '#fff',
                transition: 'border-color 0.15s, background 0.15s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#d1d1d6'; el.style.background = '#fafafa' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e4e4e7'; el.style.background = '#fff' }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '7px',
                  background: '#f4f4f5', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, color: '#52525b',
                }}>
                  <Icon size={15} />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#18181b', marginBottom: '1px' }}>{label}</p>
                  <p style={{ fontSize: '12px', color: '#71717a' }}>{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
