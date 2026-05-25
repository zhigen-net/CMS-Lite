'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Form, FormField, FormSubmission } from '@/types'
import { PlusIcon, TrashIcon, ArrowLeftIcon, ExternalLinkIcon, RefreshIcon, CheckIcon } from '@/components/icons'
import { formatDate } from '@/lib/utils'
import { TabBar } from '@/components/TabBar'

const FIELD_TYPES = [
  { value: 'text', label: '单行文本' },
  { value: 'email', label: '邮箱' },
  { value: 'tel', label: '电话' },
  { value: 'number', label: '数字' },
  { value: 'url', label: '网址' },
  { value: 'textarea', label: '多行文本' },
  { value: 'select', label: '下拉选择' },
  { value: 'checkbox', label: '复选框' },
]

interface Props {
  form: Form
  submissions: FormSubmission[]
  submissionsTotal: number
}

export default function FormEditor({ form: initialForm, submissions: initialSubs, submissionsTotal }: Props) {
  const [tab, setTab] = useState<'basic' | 'fields' | 'webhook' | 'submissions'>('basic')
  const [form, setForm] = useState(initialForm)
  const [submissions, setSubmissions] = useState(initialSubs)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const update = (patch: Partial<Form>) => setForm(prev => ({ ...prev, ...patch }))

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  // ── Field builder ──
  function addField() {
    const newField: FormField = { key: `field_${Date.now()}`, label: '新字段', type: 'text', required: false }
    update({ fields: [...form.fields, newField] })
  }

  function updateField(idx: number, patch: Partial<FormField>) {
    const fields = [...form.fields]
    fields[idx] = { ...fields[idx], ...patch }
    if (patch.label !== undefined && !patch.key) {
      fields[idx].key = patch.label.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '').slice(0, 30) || fields[idx].key
    }
    update({ fields })
  }

  function removeField(idx: number) {
    update({ fields: form.fields.filter((_, i) => i !== idx) })
  }

  function moveField(idx: number, dir: -1 | 1) {
    const fields = [...form.fields]
    const target = idx + dir
    if (target < 0 || target >= fields.length) return;
    [fields[idx], fields[target]] = [fields[target], fields[idx]]
    update({ fields })
  }

  // ── Webhook headers helper ──
  const headerEntries = Object.entries(form.webhook_headers)
  function setHeader(idx: number, key: string, val: string) {
    const entries = [...headerEntries]
    entries[idx] = [key, val]
    update({ webhook_headers: Object.fromEntries(entries) })
  }
  function addHeader() { update({ webhook_headers: { ...form.webhook_headers, '': '' } }) }
  function removeHeader(key: string) {
    const h = { ...form.webhook_headers }
    delete h[key]
    update({ webhook_headers: h })
  }

  // ── Field map helper ──
  const mapEntries = Object.entries(form.webhook_field_map)
  function setMap(idx: number, formKey: string, crmKey: string) {
    const entries = [...mapEntries]
    entries[idx] = [formKey, crmKey]
    update({ webhook_field_map: Object.fromEntries(entries) })
  }
  function addMap() { update({ webhook_field_map: { ...form.webhook_field_map, '': '' } }) }
  function removeMap(key: string) {
    const m = { ...form.webhook_field_map }
    delete m[key]
    update({ webhook_field_map: m })
  }

  // ── Retry webhook ──
  async function retryWebhook(sid: string) {
    await fetch(`/api/forms/${form.id}/submissions/${sid}/retry`, { method: 'POST' })
    setSubmissions(prev => prev.map(s => s.id === sid ? { ...s, webhook_status: 'sent' as const } : s))
  }

  async function deleteSubmission(sid: string) {
    if (!confirm('确认删除这条提交记录？')) return
    await fetch(`/api/forms/${form.id}/submissions/${sid}`, { method: 'DELETE' })
    setSubmissions(prev => prev.filter(s => s.id !== sid))
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.875rem', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem', display: 'block' }
  const sectionStyle: React.CSSProperties = { marginBottom: '1.5rem' }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px 48px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/forms" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          <ArrowLeftIcon size={14} /> 返回
        </Link>
        <h1 style={{ flex: 1, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{form.name}</h1>
        <Link href={`/form/${form.slug}`} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          <ExternalLinkIcon size={13} /> 预览
        </Link>
        <button onClick={handleSave} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: saved ? '#10b981' : '#18181b', color: '#fff', border: 'none', fontWeight: 500, fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}>
          {saved ? <><CheckIcon size={14} /> 已保存</> : saving ? '保存中…' : '保存'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <TabBar
          tabs={[
            { key: 'basic', label: '基本信息' },
            { key: 'fields', label: `字段 (${form.fields.length})` },
            { key: 'webhook', label: 'Webhook' },
            { key: 'submissions', label: `提交记录 (${submissionsTotal})` },
          ]}
          active={tab}
          onChange={t => setTab(t as typeof tab)}
        />
      </div>

      {/* Tab: basic */}
      {tab === 'basic' && (
        <div>
          <div style={sectionStyle}>
            <label style={labelStyle}>表单名称</label>
            <input style={inputStyle} value={form.name} onChange={e => update({ name: e.target.value })} />
          </div>
          <div style={sectionStyle}>
            <label style={labelStyle}>Slug（URL标识）</label>
            <input style={inputStyle} value={form.slug} onChange={e => update({ slug: e.target.value })} />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>访问地址：/form/{form.slug}</p>
          </div>
          <div style={sectionStyle}>
            <label style={labelStyle}>描述（选填）</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => update({ description: e.target.value })} />
          </div>
          <div style={sectionStyle}>
            <label style={labelStyle}>提交成功提示语</label>
            <input style={inputStyle} value={form.submit_message} onChange={e => update({ submit_message: e.target.value })} />
          </div>
          <div style={sectionStyle}>
            <label style={labelStyle}>状态</label>
            <select style={{ ...inputStyle, width: 'auto' }} value={form.status} onChange={e => update({ status: e.target.value as 'active' | 'paused' })}>
              <option value="active">启用</option>
              <option value="paused">暂停（拒绝新提交）</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button onClick={handleSave} disabled={saving} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              background: saved ? '#10b981' : '#18181b',
              color: '#fff', fontWeight: 500, fontSize: '13px',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}>
              {saved && <CheckIcon size={14} />}
              {saving ? '保存中…' : saved ? '已保存' : '保存设置'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: fields */}
      {tab === 'fields' && (
        <div>
          {form.fields.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>还没有字段，点击下方按钮添加</div>
          )}
          {form.fields.map((field, idx) => (
            <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '0.75rem', background: 'var(--color-bg)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.75rem', alignItems: 'end', marginBottom: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>字段名称</label>
                  <input style={inputStyle} value={field.label} onChange={e => updateField(idx, { label: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>类型</label>
                  <select style={inputStyle} value={field.type} onChange={e => updateField(idx, { type: e.target.value as FormField['type'] })}>
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={labelStyle}>必填</label>
                  <input type="checkbox" checked={field.required} onChange={e => updateField(idx, { required: e.target.checked })} style={{ width: '18px', height: '18px', marginTop: '0.25rem' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'flex-end' }}>
                  <button onClick={() => moveField(idx, -1)} disabled={idx === 0} title="上移" style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1, color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>↑</button>
                  <button onClick={() => moveField(idx, 1)} disabled={idx === form.fields.length - 1} title="下移" style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'none', cursor: idx === form.fields.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === form.fields.length - 1 ? 0.4 : 1, color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>↓</button>
                  <button onClick={() => removeField(idx)} title="删除" style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'none', cursor: 'pointer', color: '#dc2626' }}>
                    <TrashIcon size={13} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>字段 Key（英文）</label>
                  <input style={inputStyle} value={field.key} onChange={e => updateField(idx, { key: e.target.value.replace(/\s/g, '_') })} />
                </div>
                <div>
                  <label style={labelStyle}>占位符文字（选填）</label>
                  <input style={inputStyle} value={field.placeholder || ''} onChange={e => updateField(idx, { placeholder: e.target.value })} />
                </div>
              </div>

              {field.type === 'select' && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label style={labelStyle}>选项（每行一个）</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                    value={(field.options || []).join('\n')}
                    onChange={e => updateField(idx, { options: e.target.value.split('\n').filter(Boolean) })}
                    placeholder="选项1&#10;选项2&#10;选项3"
                  />
                </div>
              )}
            </div>
          ))}
          <button onClick={addField} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px dashed var(--color-border)', color: 'var(--color-text-secondary)', background: 'none', cursor: 'pointer', fontSize: '0.875rem', width: '100%', justifyContent: 'center' }}>
            <PlusIcon size={14} /> 添加字段
          </button>
        </div>
      )}

      {/* Tab: webhook */}
      {tab === 'webhook' && (
        <div>
          <div style={sectionStyle}>
            <label style={labelStyle}>Webhook URL</label>
            <input style={inputStyle} value={form.webhook_url} onChange={e => update({ webhook_url: e.target.value })} placeholder="https://your-crm.com/api/leads" />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>留空则不推送，提交数据以 JSON POST 发送</p>
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>请求 Headers（如 Authorization）</label>
              <button onClick={addHeader} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <PlusIcon size={12} /> 添加
              </button>
            </div>
            {headerEntries.map(([key, val], idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input style={inputStyle} value={key} placeholder="Header名" onChange={e => setHeader(idx, e.target.value, val)} />
                <input style={inputStyle} value={val} placeholder="值" onChange={e => setHeader(idx, key, e.target.value)} />
                <button onClick={() => removeHeader(key)} style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'none', cursor: 'pointer', color: '#dc2626' }}><TrashIcon size={13} /></button>
              </div>
            ))}
            {headerEntries.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>暂无自定义 Header</p>}
          </div>

          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ ...labelStyle, marginBottom: '0.125rem' }}>字段映射（表单字段 → CRM字段名）</label>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>不配置则直接使用字段 Key</p>
              </div>
              <button onClick={addMap} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <PlusIcon size={12} /> 添加
              </button>
            </div>
            {mapEntries.map(([fk, ck], idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <select style={inputStyle} value={fk} onChange={e => setMap(idx, e.target.value, ck)}>
                  <option value="">选择表单字段</option>
                  {form.fields.map(f => <option key={f.key} value={f.key}>{f.label} ({f.key})</option>)}
                </select>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', padding: '0 0.25rem' }}>→</span>
                <input style={inputStyle} value={ck} placeholder="CRM 字段名" onChange={e => setMap(idx, fk, e.target.value)} />
                <button onClick={() => removeMap(fk)} style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'none', cursor: 'pointer', color: '#dc2626' }}><TrashIcon size={13} /></button>
              </div>
            ))}
            {mapEntries.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>暂无字段映射，将使用原始字段 Key</p>}
          </div>

          {/* Payload preview */}
          <div style={{ padding: '1rem', borderRadius: '10px', background: '#0f172a', color: '#e2e8f0', fontSize: '0.8rem', fontFamily: 'monospace', lineHeight: 1.7 }}>
            <p style={{ color: '#94a3b8', marginBottom: '0.5rem', fontFamily: 'inherit' }}>// Webhook 推送示例 payload</p>
            <pre style={{ margin: 0, fontFamily: 'inherit' }}>{JSON.stringify({
              form_id: form.id,
              form_name: form.name,
              submitted_at: new Date().toISOString(),
              ...Object.fromEntries(form.fields.map(f => [form.webhook_field_map[f.key] || f.key, `<${f.label}>`])),
            }, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Tab: submissions */}
      {tab === 'submissions' && (
        <div>
          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>暂无提交记录</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {submissions.map(sub => (
                <div key={sub.id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', flex: 1 }}>{formatDate(sub.created_at)} · {sub.ip || '未知IP'}</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '99px', fontWeight: 600, background: sub.webhook_status === 'sent' ? 'rgba(34,197,94,0.1)' : sub.webhook_status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.15)', color: sub.webhook_status === 'sent' ? '#16a34a' : sub.webhook_status === 'failed' ? '#dc2626' : '#64748b' }}>
                      {sub.webhook_status === 'sent' ? 'Webhook 已推送' : sub.webhook_status === 'failed' ? 'Webhook 失败' : sub.webhook_status === 'skipped' ? '无 Webhook' : '待推送'}
                    </span>
                    {sub.webhook_status === 'failed' && (
                      <button onClick={() => retryWebhook(sub.id)} title="重试" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.72rem', color: 'var(--color-text-secondary)', background: 'none', cursor: 'pointer' }}>
                        <RefreshIcon size={11} /> 重试
                      </button>
                    )}
                    <button onClick={() => deleteSubmission(sub.id)} style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.375rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'none', color: '#dc2626', cursor: 'pointer' }}>
                      <TrashIcon size={12} />
                    </button>
                  </div>
                  <div style={{ padding: '0.875rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem 2rem' }}>
                    {Object.entries(sub.data).map(([key, val]) => {
                      const fieldDef = form.fields.find(f => f.key === key)
                      return (
                        <div key={key}>
                          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.15rem' }}>{fieldDef?.label || key}</p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{String(val)}</p>
                        </div>
                      )
                    })}
                  </div>
                  {sub.webhook_response && (
                    <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.72rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', fontFamily: 'monospace' }}>
                      响应: {sub.webhook_response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
