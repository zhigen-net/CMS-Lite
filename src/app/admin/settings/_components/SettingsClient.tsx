'use client'

import { useState, useRef } from 'react'
import type { SiteSettings } from '@/types'
import { CheckIcon } from '@/components/icons'

interface Props { initialSettings: SiteSettings }

const field: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: '13px',
  border: '1px solid #e4e4e7', borderRadius: '7px',
  background: '#fff', color: '#18181b',
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 500,
  color: '#52525b', marginBottom: '4px',
}

const hintStyle: React.CSSProperties = {
  fontSize: '11px', color: '#a1a1aa', marginTop: '3px',
}

const sectionLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: '#a1a1aa',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: '14px',
}

function ImageUploader({ value, onChange, label }: { value: string; onChange: (url: string) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')

  async function handleFile(file: File) {
    setErr(''); setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/media', { method: 'POST', body: fd })
      if (!res.ok) { setErr('上传失败'); return }
      const data = await res.json() as { url: string }
      onChange(data.url)
    } catch { setErr('上传出错') }
    finally { setUploading(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: '72px', height: '72px', borderRadius: '10px',
          border: '1.5px dashed #d4d4d8', background: '#fafafa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#18181b')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#d4d4d8')}
      >
        {value
          ? <img src={value} alt={label || 'image'} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
          : <span style={{ fontSize: '11px', color: '#a1a1aa', textAlign: 'center', lineHeight: 1.4, padding: '8px' }}>
              {uploading ? '上传中…' : '点击上传'}
            </span>
        }
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} style={{
          padding: '6px 12px', borderRadius: '7px', border: '1px solid #e4e4e7',
          background: '#fff', fontSize: '13px', fontWeight: 500,
          cursor: uploading ? 'not-allowed' : 'pointer', color: '#374151',
          opacity: uploading ? 0.6 : 1,
        }}>{uploading ? '上传中…' : value ? '重新上传' : '选择图片'}</button>
        {value && (
          <button type="button" onClick={() => onChange('')} style={{
            padding: '6px 12px', borderRadius: '7px', border: '1px solid #fecaca',
            background: '#fff', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', color: '#ef4444',
          }}>移除</button>
        )}
      </div>
      {err && <p style={{ fontSize: '12px', color: '#ef4444', width: '100%', margin: 0 }}>{err}</p>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
    </div>
  )
}

const TABS = [
  { id: 'basic', label: '基本设置' },
  { id: 'seo', label: 'SEO' },
] as const
type Tab = typeof TABS[number]['id']

export default function SettingsClient({ initialSettings }: Props) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('basic')

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
  const inp = (key: keyof SiteSettings) => ({
    style: field, value: val(key),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(key, e.target.value),
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#18181b'),
    onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#e4e4e7'),
  })
  const sel = (key: keyof SiteSettings) => ({
    style: { ...field, cursor: 'pointer' as const },
    value: val(key),
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => update(key, e.target.value),
  })

  const divider = <div style={{ height: '1px', background: '#f4f4f5', margin: '4px 0' }} />

  const saveBtn = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
      <button onClick={handleSave} disabled={saving} style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 20px', borderRadius: '8px', border: 'none',
        background: saved ? '#10b981' : '#18181b',
        color: '#fff', fontWeight: 500, fontSize: '13px',
        cursor: saving ? 'not-allowed' : 'pointer',
        opacity: saving ? 0.7 : 1, transition: 'background 0.2s',
      }}>
        {saved && <CheckIcon size={14} />}
        {saving ? '保存中…' : saved ? '已保存' : '保存设置'}
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: '2px', background: '#f4f4f5', borderRadius: '9px', padding: '3px', width: 'fit-content' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '6px 16px', borderRadius: '7px', border: 'none',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              background: activeTab === t.id ? '#fff' : 'transparent',
              color: activeTab === t.id ? '#18181b' : '#71717a',
              boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* 基本设置 tab */}
      {activeTab === 'basic' && (
        <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div>
              <label style={labelStyle}>网站 Logo</label>
              <ImageUploader value={val('site.logo')} onChange={url => update('site.logo', url)} label="logo" />
              <p style={hintStyle}>上传后将替代导航栏中的站点名称文字</p>
            </div>

            <div>
              <label style={labelStyle}>站点名称</label>
              <input type="text" placeholder="My Website" {...inp('site.name')} />
            </div>

            <div>
              <label style={labelStyle}>站点描述</label>
              <textarea rows={2} placeholder="用一句话描述你的网站" {...inp('site.description')} style={{ ...field, resize: 'none' }} />
              <p style={hintStyle}>用于页面 meta description、RSS、首页展示</p>
            </div>

            <div>
              <label style={labelStyle}>站点网址</label>
              <input type="url" placeholder="https://example.com" {...inp('site.url')} />
              <p style={hintStyle}>用于 sitemap、RSS、JSON-LD，末尾不带斜杠</p>
            </div>

            {divider}

            <div>
              <label style={labelStyle}>AI 写作风格</label>
              <select {...sel('ai.writingStyle')} style={{ ...field, cursor: 'pointer', width: 'auto' }}>
                <option value="professional">专业严谨</option>
                <option value="casual">轻松友好</option>
                <option value="academic">学术深度</option>
                <option value="creative">创意文学</option>
              </select>
              <p style={hintStyle}>影响 AI 生成内容和对话的语气风格</p>
            </div>

          </div>
          <div style={{ padding: '16px 20px', borderTop: '1px solid #f4f4f5', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSave} disabled={saving} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              background: saved ? '#10b981' : '#18181b',
              color: '#fff', fontWeight: 500, fontSize: '13px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, transition: 'background 0.2s',
            }}>
              {saved && <CheckIcon size={14} />}
              {saving ? '保存中…' : saved ? '已保存' : '保存设置'}
            </button>
          </div>
        </div>
      )}

      {/* SEO tab */}
      {activeTab === 'seo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 全局 SEO */}
          <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f4f4f5', background: '#fafafa' }}>
              <p style={sectionLabel}>全局 SEO</p>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div>
                <label style={labelStyle}>标题模板</label>
                <input type="text" placeholder="%s | 站点名称" {...inp('seo.titleTemplate')} />
                <p style={hintStyle}>使用 %s 作为页面标题占位符，适用于所有子页面</p>
              </div>

              <div>
                <label style={labelStyle}>Robots 策略</label>
                <select {...sel('seo.robots')} style={{ ...field, cursor: 'pointer', width: 'auto' }}>
                  <option value="index,follow">index, follow（推荐）</option>
                  <option value="noindex,nofollow">noindex, nofollow</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>默认 OG 图片</label>
                <ImageUploader value={val('seo.defaultOgImage')} onChange={url => update('seo.defaultOgImage', url)} label="og image" />
                <p style={hintStyle}>当页面没有设置 OG 图片时使用此图片（推荐 1200×630px）</p>
              </div>

              <div>
                <label style={labelStyle}>Google Search Console 验证码</label>
                <input type="text" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" {...inp('seo.googleVerification')} />
                <p style={hintStyle}>在 Google Search Console → 验证 → HTML 标记 中获取 content 属性值</p>
              </div>

            </div>
          </div>

          {/* 页面 SEO */}
          <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f4f4f5', background: '#fafafa' }}>
              <p style={sectionLabel}>页面 SEO</p>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* 首页 */}
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#18181b', marginBottom: '12px' }}>
                  首页 <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 400 }}>（空则使用站点名称 / 站点描述）</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>标题</label>
                    <input type="text" placeholder={val('site.name') || '站点名称'} {...inp('seo.home.title')} />
                  </div>
                  <div>
                    <label style={labelStyle}>描述</label>
                    <textarea rows={2} placeholder={val('site.description') || '站点描述'} {...inp('seo.home.description')} style={{ ...field, resize: 'none' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>OG 图片</label>
                    <ImageUploader value={val('seo.home.ogImage')} onChange={url => update('seo.home.ogImage', url)} label="首页 OG" />
                    <p style={hintStyle}>空则使用默认 OG 图片</p>
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', background: '#f4f4f5' }} />

              {/* 分类列表页 */}
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#18181b', marginBottom: '12px' }}>
                  分类列表页 <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 400 }}>（/category）</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>标题</label>
                    <input type="text" placeholder="全部分类" {...inp('seo.categoryList.title')} />
                  </div>
                  <div>
                    <label style={labelStyle}>描述</label>
                    <textarea rows={2} placeholder="浏览所有分类" {...inp('seo.categoryList.description')} style={{ ...field, resize: 'none' }} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {saveBtn}
        </div>
      )}

    </div>
  )
}
