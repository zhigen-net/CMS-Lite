'use client'

import { useState } from 'react'
import type { SiteSettings } from '@/types'
import { CheckIcon } from '@/components/icons'

interface Props { initialSettings: SiteSettings }

const field: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.875rem', fontSize: '0.875rem',
  border: '1px solid #e4e4e7', borderRadius: '8px',
  background: '#fff', color: '#18181b',
  outline: 'none', boxSizing: 'border-box',
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: '0.375rem' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#18181b' }}>{children}</label>
      {hint && <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.125rem' }}>{hint}</p>}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e4e4e7', background: '#f4f4f5' }}>
        <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#18181b', letterSpacing: '0.01em' }}>{title}</h2>
      </div>
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  )
}

export default function SettingsClient({ initialSettings }: Props) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function update(key: keyof SiteSettings, value: unknown) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } finally { setSaving(false) }
  }

  const val = (key: keyof SiteSettings) => (settings[key] as string) ?? ''
  const handleChange = (key: keyof SiteSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => update(key, e.target.value)
  const inputProps = (key: keyof SiteSettings) => ({
    style: field, value: val(key), onChange: handleChange(key),
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#2563eb'),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#e4e4e7'),
  })
  const selectProps = (key: keyof SiteSettings) => ({ style: { ...field, cursor: 'pointer' as const }, value: val(key), onChange: handleChange(key) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Card title="基本信息">
        <div>
          <Label>站点名称</Label>
          <input type="text" placeholder="My Website" {...inputProps('site.name')} />
        </div>
        <div>
          <Label>站点描述</Label>
          <textarea rows={3} placeholder="用一句话描述你的网站" {...inputProps('site.description')} style={{ ...field, resize: 'none' }} />
        </div>
        <div>
          <Label hint="用于生成 sitemap、RSS、JSON-LD 等，末尾不带斜杠">站点网址</Label>
          <input type="url" placeholder="https://example.com" {...inputProps('site.url')} />
        </div>
        <div>
          <Label>默认语言</Label>
          <select {...selectProps('site.language')}>
            <option value="zh-CN">简体中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>
      </Card>

      <Card title="SEO 设置">
        <div>
          <Label hint="使用 %s 作为页面标题占位符">标题模板</Label>
          <input type="text" placeholder="%s | 站点名称" {...inputProps('seo.titleTemplate')} />
        </div>
        <div>
          <Label hint="当页面没有单独描述时使用">默认 Meta 描述</Label>
          <textarea rows={3} placeholder="网站默认 SEO 描述" {...inputProps('seo.defaultDesc')} style={{ ...field, resize: 'none' }} />
        </div>
        <div>
          <Label>Robots 策略</Label>
          <select {...selectProps('seo.robots')}>
            <option value="index,follow">index, follow（推荐）</option>
            <option value="noindex,nofollow">noindex, nofollow</option>
          </select>
        </div>
      </Card>

      <Card title="AI 运营">
        <div>
          <Label hint="决定 AI 可以自主执行哪些操作">AI 自主权限</Label>
          <select {...selectProps('ai.autonomyLevel')}>
            <option value="conservative">保守模式 — AI 只提建议，人工确认</option>
            <option value="standard">标准模式 — 内容自动执行，代码需确认</option>
            <option value="autonomous">自主模式 — AI 全权处理，每日汇报</option>
          </select>
        </div>
        <div>
          <Label>内容发布频率</Label>
          <select {...selectProps('ai.contentFrequency')}>
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
            <option value="biweekly">每两周</option>
            <option value="manual">手动触发</option>
          </select>
        </div>
        <div>
          <Label>写作风格</Label>
          <select {...selectProps('ai.writingStyle')}>
            <option value="professional">专业严谨</option>
            <option value="casual">轻松友好</option>
            <option value="academic">学术深度</option>
            <option value="creative">创意文学</option>
          </select>
        </div>
      </Card>


      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave} disabled={saving}
          style={{
            padding: '0.625rem 1.5rem', borderRadius: '8px', border: 'none',
            background: saved ? '#10b981' : '#2563eb',
            color: '#fff', fontWeight: 600, fontSize: '0.875rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'background 0.2s',
          }}
        >
          {saved && <CheckIcon size={15} />}
          {saving ? '保存中…' : saved ? '已保存' : '保存设置'}
        </button>
      </div>
    </div>
  )
}
