'use client'

import { useState } from 'react'
import type { Plugin } from '@/types'
import {
  BarChartIcon, ClockIcon, ListIcon, GlobeIcon, SearchIcon,
  LinkIcon, SparklesIcon, ImageIcon, EyeIcon, PuzzleIcon, ClipboardIcon,
} from '@/components/icons'
import Link from 'next/link'

const PLUGIN_META: Record<string, { desc: string; icon: React.ComponentType<{size?: number}>; requiresAI?: boolean; manageHref?: string }> = {
  'seo-analyzer':     { icon: BarChartIcon, desc: '分析文章 SEO 质量，给出评分和优化建议' },
  'reading-time':     { icon: ClockIcon, desc: '自动计算并展示文章预计阅读时长' },
  'toc':              { icon: ListIcon, desc: '为长文章自动生成目录导航' },
  'sitemap':          { icon: GlobeIcon, desc: '自动生成并更新 sitemap.xml' },
  'full-text-search': { icon: SearchIcon, desc: '基于 D1 FTS5 的全文搜索功能' },
  'related-posts':    { icon: LinkIcon, desc: '基于内容相似度推荐相关文章' },
  'ai-writer':        { icon: SparklesIcon, desc: '编辑器内嵌 AI 写作助手', requiresAI: true },
  'og-image':         { icon: ImageIcon, desc: '自动为文章生成 Open Graph 封面图', requiresAI: true },
  'ai-alt':           { icon: EyeIcon, desc: '自动为上传图片生成 Alt 描述文字', requiresAI: true },
  'form-builder':     { icon: ClipboardIcon, desc: '可视化表单构建，收集用户信息并推送至 CRM', manageHref: '/admin/forms' },
}

interface Props { initialPlugins: Plugin[] }

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative', width: '40px', height: '22px', flexShrink: 0,
        borderRadius: '99px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: on ? '#2563eb' : '#e4e4e7',
        transition: 'background 0.2s', opacity: disabled ? 0.5 : 1, padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: on ? '21px' : '3px',
        width: '16px', height: '16px',
        borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

export default function PluginsClient({ initialPlugins }: Props) {
  const [plugins, setPlugins] = useState(initialPlugins)
  const [toggling, setToggling] = useState<string | null>(null)

  async function handleToggle(plugin: Plugin) {
    setToggling(plugin.id)
    try {
      const res = await fetch('/api/plugins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plugin.id, enabled: !plugin.enabled }),
      })
      if (res.ok) setPlugins(prev => prev.map(p => p.id === plugin.id ? { ...p, enabled: !p.enabled } : p))
    } finally { setToggling(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Built-in plugins */}
      <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e4e4e7', background: '#f4f4f5' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#18181b' }}>内置插件</h2>
        </div>
        {plugins.map((plugin, i) => {
          const meta = PLUGIN_META[plugin.id]
          const Icon = meta?.icon ?? PuzzleIcon
          return (
            <div key={plugin.id} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1rem 1.25rem',
              borderBottom: i < plugins.length - 1 ? '1px solid #e4e4e7' : 'none',
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                background: plugin.enabled ? 'color-mix(in srgb, #2563eb 10%, transparent)' : '#f4f4f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: plugin.enabled ? '#2563eb' : '#71717a',
                transition: 'all 0.2s',
              }}>
                <Icon size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#18181b' }}>{plugin.name}</span>
                  <span style={{ fontSize: '0.7rem', color: '#71717a' }}>v{plugin.version}</span>
                  {meta?.requiresAI && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 600, padding: '0.1rem 0.4rem',
                      borderRadius: '4px', background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                      letterSpacing: '0.02em',
                    }}>需要 AI</span>
                  )}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#71717a', lineHeight: 1.5 }}>{meta?.desc}</p>
              </div>
              {meta?.manageHref && plugin.enabled && (
                <Link href={meta.manageHref} style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  管理
                </Link>
              )}
              <Toggle
                on={plugin.enabled}
                onClick={() => handleToggle(plugin)}
                disabled={toggling === plugin.id}
              />
            </div>
          )
        })}
      </div>

      {/* Marketplace placeholder */}
      <div style={{
        border: '1px dashed #e4e4e7', borderRadius: '12px',
        padding: '2.5rem', textAlign: 'center',
        background: '#fff',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: '#f4f4f5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem', color: '#71717a',
        }}>
          <PuzzleIcon size={22} />
        </div>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#18181b', marginBottom: '0.375rem' }}>插件市场即将上线</p>
        <p style={{ fontSize: '0.8rem', color: '#71717a' }}>
          配置 GitHub Token 后可从社区一键安装插件
        </p>
      </div>
    </div>
  )
}
