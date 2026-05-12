'use client'

import { useState } from 'react'
import type { SiteSettings } from '@/types'
import { CheckIcon } from '@/components/icons'

interface Props { initialSettings: SiteSettings }

const PRESETS = [
  { name: '蓝调', primary: '#3b82f6', bg: '#ffffff', text: '#111827' },
  { name: '紫韵', primary: '#8b5cf6', bg: '#ffffff', text: '#1f2937' },
  { name: '翠绿', primary: '#10b981', bg: '#ffffff', text: '#111827' },
  { name: '珊瑚', primary: '#ef4444', bg: '#ffffff', text: '#111827' },
  { name: '暗夜', primary: '#60a5fa', bg: '#0f172a', text: '#f1f5f9' },
  { name: '墨绿', primary: '#059669', bg: '#f8fafc', text: '#0f172a' },
  { name: '琥珀', primary: '#d97706', bg: '#fffbf0', text: '#1c1917' },
  { name: '玫瑰', primary: '#e11d48', bg: '#fff1f2', text: '#1c1917' },
]

const CSS_VARS = [
  { key: '--color-primary', label: '主色调', type: 'color' as const },
  { key: '--color-bg', label: '背景色', type: 'color' as const },
  { key: '--color-text', label: '正文色', type: 'color' as const },
  { key: '--font-heading', label: '标题字体', type: 'text' as const, placeholder: 'system-ui, sans-serif' },
  { key: '--font-body', label: '正文字体', type: 'text' as const, placeholder: 'system-ui, sans-serif' },
  { key: '--radius', label: '圆角', type: 'text' as const, placeholder: '8px' },
  { key: '--max-width', label: '最大宽度', type: 'text' as const, placeholder: '1200px' },
]

const inputBase: React.CSSProperties = {
  padding: '0.5rem 0.75rem', fontSize: '0.875rem',
  border: '1px solid #e4e4e7', borderRadius: '8px',
  background: '#fff', color: '#18181b',
  outline: 'none',
}

export default function AppearanceClient({ initialSettings }: Props) {
  const [vars, setVars] = useState<Record<string, string>>(
    (initialSettings['theme.variables'] as Record<string, string>) || {}
  )
  const [customCss, setCustomCss] = useState<string>(
    (initialSettings['theme.customCss'] as string) || ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function applyPreset(p: typeof PRESETS[0]) {
    setVars(prev => ({ ...prev, '--color-primary': p.primary, '--color-bg': p.bg, '--color-text': p.text }))
    setSaved(false)
  }

  function updateVar(key: string, value: string) {
    setVars(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'theme.variables': vars, 'theme.customCss': customCss }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } finally { setSaving(false) }
  }

  const currentPrimary = vars['--color-primary'] || '#3b82f6'
  const activeName = PRESETS.find(p => p.primary === currentPrimary)?.name

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Presets */}
      <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e4e4e7', background: '#f4f4f5' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#18181b' }}>预设主题</h2>
        </div>
        <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: '0.625rem' }}>
          {PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.625rem 0.75rem', borderRadius: '8px',
                border: `1.5px solid ${activeName === p.name ? p.primary : '#e4e4e7'}`,
                background: activeName === p.name ? `${p.primary}10` : 'transparent',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: p.primary, flexShrink: 0,
                boxShadow: `0 0 0 2px ${p.bg}, 0 0 0 3px ${p.primary}40`,
              }} />
              <span style={{ fontSize: '0.8rem', fontWeight: activeName === p.name ? 600 : 400, color: '#18181b', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CSS Vars */}
      <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e4e4e7', background: '#f4f4f5' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#18181b' }}>样式变量</h2>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {CSS_VARS.map(v => (
            <div key={v.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#18181b', width: '80px', flexShrink: 0 }}>{v.label}</label>
              {v.type === 'color' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1 }}>
                  <label style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    border: '1.5px solid #e4e4e7', overflow: 'hidden',
                    cursor: 'pointer', flexShrink: 0, display: 'block',
                    background: vars[v.key] || '#000',
                  }}>
                    <input type="color" value={vars[v.key] || '#000000'} onChange={e => updateVar(v.key, e.target.value)}
                      style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                  </label>
                  <input type="text" value={vars[v.key] || ''} onChange={e => updateVar(v.key, e.target.value)}
                    style={{ ...inputBase, flex: 1, fontFamily: 'monospace' }} />
                </div>
              ) : (
                <input type="text" value={vars[v.key] || ''} onChange={e => updateVar(v.key, e.target.value)}
                  placeholder={v.placeholder} style={{ ...inputBase, flex: 1 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom CSS */}
      <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e4e4e7', background: '#f4f4f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#18181b' }}>自定义 CSS</h2>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>实时生效，无需重新部署</span>
          </div>
        </div>
        <div style={{ padding: '1rem' }}>
          <textarea
            value={customCss}
            onChange={e => { setCustomCss(e.target.value); setSaved(false) }}
            placeholder="/* 在此输入自定义 CSS */"
            rows={10}
            spellCheck={false}
            style={{
              ...inputBase, width: '100%', resize: 'vertical',
              fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave} disabled={saving}
          style={{
            padding: '0.625rem 1.5rem', borderRadius: '8px', border: 'none',
            background: saved ? '#10b981' : '#2563eb',
            color: '#fff', fontWeight: 600, fontSize: '0.875rem',
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s',
          }}
        >
          {saved && <CheckIcon size={15} />}
          {saving ? '保存中…' : saved ? '已保存' : '保存外观设置'}
        </button>
      </div>
    </div>
  )
}
