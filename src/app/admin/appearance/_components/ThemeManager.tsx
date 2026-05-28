'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { SiteSettings } from '@/types'
import type { ThemeMeta } from '@/themes'
import { CheckIcon } from '@/components/icons'
import AppearanceClient from './AppearanceClient'

const ThemeEditorClient = dynamic(
  () => import('../editor/_components/ThemeEditorClient'),
  { ssr: false }
)

type View = 'cards' | 'config' | 'editor'

interface Props {
  themes: ThemeMeta[]
  activeThemeId: string
  initialSettings: SiteSettings
  initialCss: string
  initialHeaderHtml: string
  initialFooterHtml: string
  initialJs: string
}

export default function ThemeManager({
  themes, activeThemeId, initialSettings,
  initialCss, initialHeaderHtml, initialFooterHtml, initialJs,
}: Props) {
  const [active, setActive] = useState(activeThemeId)
  const [activating, setActivating] = useState<string | null>(null)
  const [view, setView] = useState<View>('cards')
  const [viewTheme, setViewTheme] = useState<ThemeMeta>(
    themes.find(t => t.id === activeThemeId) ?? themes[0]
  )

  async function handleActivate(themeId: string) {
    if (themeId === active) return
    setActivating(themeId)
    try {
      const [settingsRes] = await Promise.all([
        fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 'theme.active': themeId }),
        }),
        fetch(`/api/themes/${themeId}/provision`, { method: 'POST' }),
      ])
      if (settingsRes.ok) setActive(themeId)
    } finally { setActivating(null) }
  }

  function openConfig(theme: ThemeMeta) {
    setViewTheme(theme)
    setView('config')
  }

  function openEditor(theme: ThemeMeta) {
    setViewTheme(theme)
    setView('editor')
  }

  // ── Editor view ──
  if (view === 'editor') {
    return (
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 20px', borderBottom: '1px solid #e4e4e7',
          background: '#fafafa', flexShrink: 0,
        }}>
          <button onClick={() => setView('cards')} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', fontSize: '12px', fontWeight: 500,
            border: '1px solid #e4e4e7', borderRadius: '6px',
            background: '#fff', color: '#52525b', cursor: 'pointer',
          }}>← 返回</button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>
            编辑主题 · {viewTheme.name}
          </span>
        </div>
        <ThemeEditorClient
          initialCss={initialCss}
          initialHeaderHtml={initialHeaderHtml}
          initialFooterHtml={initialFooterHtml}
          initialJs={initialJs}
        />
      </div>
    )
  }

  // ── Config view ──
  if (view === 'config') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 48px' }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <button onClick={() => setView('cards')} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', fontSize: '12px', fontWeight: 500,
              border: '1px solid #e4e4e7', borderRadius: '6px',
              background: '#fff', color: '#52525b', cursor: 'pointer',
            }}>← 返回</button>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#18181b' }}>
              配置主题 · {viewTheme.name}
            </span>
          </div>
          <AppearanceClient initialSettings={initialSettings} />
        </div>
      </div>
    )
  }

  // ── Cards view ──
  const activeTheme = themes.find(t => t.id === active) ?? themes[0]
  const otherThemes = themes.filter(t => t.id !== active)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 48px' }}>
      <div style={{ maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Current theme */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            当前主题
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            <ThemeCard
              theme={activeTheme}
              isActive
              activating={false}
              onActivate={() => {}}
              onConfig={() => openConfig(activeTheme)}
              onEdit={() => openEditor(activeTheme)}
            />
          </div>
        </div>

        {/* Other themes */}
        {otherThemes.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              可用主题
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {otherThemes.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={false}
                  activating={activating === theme.id}
                  onActivate={() => handleActivate(theme.id)}
                  onConfig={() => openConfig(theme)}
                  onEdit={() => openEditor(theme)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Coming soon */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            即将推出
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {[
              { name: 'Minimal', desc: '极简个人站，专注内容本身' },
              { name: 'Landing', desc: '产品/企业落地页，转化率优先' },
              { name: 'Docs', desc: '文档站，支持侧边栏导航树' },
            ].map(t => (
              <div key={t.name} style={{ border: '1px dashed #e4e4e7', borderRadius: '12px', overflow: 'hidden', opacity: 0.5 }}>
                <div style={{ height: '148px', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#a1a1aa' }}>预览图即将上线</span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>{t.name}</span>
                    <span style={{ fontSize: '10px', color: '#a1a1aa', border: '1px solid #e4e4e7', borderRadius: '4px', padding: '1px 5px' }}>即将推出</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#71717a', margin: 0 }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ThemeCard({ theme, isActive, activating, onActivate, onConfig, onEdit }: {
  theme: ThemeMeta
  isActive: boolean
  activating: boolean
  onActivate: () => void
  onConfig: () => void
  onEdit: () => void
}) {
  return (
    <div style={{
      border: `1.5px solid ${isActive ? '#18181b' : '#e4e4e7'}`,
      borderRadius: '12px', overflow: 'hidden',
      boxShadow: isActive ? '0 0 0 3px rgba(24,24,27,0.07)' : 'none',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Preview */}
      <div style={{
        height: '148px',
        background: theme.preview ? `url(${theme.preview}) center/cover` : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {!theme.preview && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#3b82f6', letterSpacing: '-0.04em' }}>Aa</div>
            <div style={{ fontSize: '11px', color: '#93c5fd', marginTop: '2px' }}>{theme.name}</div>
          </div>
        )}
        {isActive && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: '#18181b', color: '#fff',
            fontSize: '11px', fontWeight: 600,
            padding: '3px 8px', borderRadius: '99px',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <CheckIcon size={11} /> 使用中
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>{theme.name}</span>
          <span style={{ fontSize: '11px', color: '#a1a1aa' }}>v{theme.version}</span>
        </div>
        <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 12px', lineHeight: 1.5 }}>
          {theme.description}
        </p>

        {/* 3 action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: isActive ? '1fr 1fr' : '1fr 1fr 1fr', gap: '6px' }}>
          {!isActive && (
            <button
              onClick={onActivate}
              disabled={activating}
              style={{
                padding: '6px 0', fontSize: '12px', fontWeight: 600,
                border: 'none', borderRadius: '7px',
                background: '#18181b', color: '#fff',
                cursor: activating ? 'not-allowed' : 'pointer',
                opacity: activating ? 0.6 : 1,
              }}
            >
              {activating ? '应用中…' : '应用'}
            </button>
          )}
          <button
            onClick={onConfig}
            style={{
              padding: '6px 0', fontSize: '12px', fontWeight: 500,
              border: '1px solid #e4e4e7', borderRadius: '7px',
              background: '#fff', color: '#52525b', cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#f4f4f5')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#fff')}
          >
            配置
          </button>
          <button
            onClick={onEdit}
            style={{
              padding: '6px 0', fontSize: '12px', fontWeight: 500,
              border: '1px solid #e4e4e7', borderRadius: '7px',
              background: '#fff', color: '#52525b', cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#f4f4f5')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#fff')}
          >
            编辑
          </button>
        </div>
      </div>
    </div>
  )
}
