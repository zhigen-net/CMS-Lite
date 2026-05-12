'use client'

import { useState } from 'react'
import type { ThemeMeta } from '@/themes'
import { CheckIcon } from '@/components/icons'

interface Props {
  themes: ThemeMeta[]
  activeThemeId: string
}

export default function ThemesClient({ themes, activeThemeId }: Props) {
  const [active, setActive] = useState(activeThemeId)
  const [activating, setActivating] = useState<string | null>(null)

  async function handleActivate(themeId: string) {
    if (themeId === active) return
    setActivating(themeId)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'theme.active': themeId }),
      })
      if (res.ok) setActive(themeId)
    } finally {
      setActivating(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Active theme section */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
          当前主题
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {themes.filter(t => t.id === active).map(theme => (
            <ThemeCard key={theme.id} theme={theme} isActive activating={false} onActivate={() => {}} />
          ))}
        </div>
      </div>

      {/* Available themes */}
      {themes.filter(t => t.id !== active).length > 0 && (
        <div>
          <h2 style={{ fontSize: '12px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            可用主题
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {themes.filter(t => t.id !== active).map(theme => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={false}
                activating={activating === theme.id}
                onActivate={() => handleActivate(theme.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Coming soon */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
          即将推出
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {[
            { name: 'Minimal', desc: '极简个人站，专注内容本身' },
            { name: 'Landing', desc: '产品/企业落地页，转化率优先' },
            { name: 'Docs', desc: '文档站，支持侧边栏导航树' },
          ].map(t => (
            <div key={t.name} style={{
              border: '1px dashed #e4e4e7', borderRadius: '12px',
              overflow: 'hidden', opacity: 0.6,
            }}>
              <div style={{
                height: '160px', background: '#f4f4f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '13px', color: '#a1a1aa' }}>预览图即将上线</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#18181b' }}>{t.name}</span>
                  <span style={{ fontSize: '11px', color: '#a1a1aa', border: '1px solid #e4e4e7', borderRadius: '4px', padding: '1px 6px' }}>
                    即将推出
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ThemeCard({ theme, isActive, activating, onActivate }: {
  theme: ThemeMeta
  isActive: boolean
  activating: boolean
  onActivate: () => void
}) {
  return (
    <div style={{
      border: `1.5px solid ${isActive ? '#18181b' : '#e4e4e7'}`,
      borderRadius: '12px', overflow: 'hidden',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      boxShadow: isActive ? '0 0 0 3px rgba(24,24,27,0.08)' : 'none',
    }}>
      {/* Preview area */}
      <div style={{
        height: '160px',
        background: theme.preview
          ? `url(${theme.preview}) center/cover`
          : 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {!theme.preview && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#3b82f6', letterSpacing: '-0.04em', marginBottom: '4px' }}>
              Aa
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>Default Theme</div>
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
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#18181b' }}>{theme.name}</span>
          <span style={{ fontSize: '11px', color: '#71717a' }}>v{theme.version}</span>
        </div>
        <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 12px', lineHeight: 1.5 }}>
          {theme.description}
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {theme.tags.map(tag => (
            <span key={tag} style={{
              fontSize: '11px', padding: '1px 7px', borderRadius: '99px',
              border: '1px solid #e4e4e7', color: '#52525b',
            }}>{tag}</span>
          ))}
        </div>
        {isActive ? (
          <div style={{
            fontSize: '12px', color: '#52525b', textAlign: 'center',
            padding: '6px', borderRadius: '7px', border: '1px solid #e4e4e7',
          }}>
            当前使用中
          </div>
        ) : (
          <button
            onClick={onActivate}
            disabled={activating}
            style={{
              width: '100%', padding: '7px', borderRadius: '7px',
              border: 'none', background: '#18181b', color: '#fff',
              fontSize: '12px', fontWeight: 600,
              cursor: activating ? 'not-allowed' : 'pointer',
              opacity: activating ? 0.6 : 1, transition: 'opacity 0.15s',
            }}
          >
            {activating ? '启用中…' : '启用主题'}
          </button>
        )}
      </div>
    </div>
  )
}
