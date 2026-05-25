'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Form } from '@/types'
import { PlusIcon, TrashIcon, EditIcon, ExternalLinkIcon } from '@/components/icons'
import { formatDate } from '@/lib/utils'

interface Props { initialForms: Form[] }

export default function FormsClient({ initialForms }: Props) {
  const [forms, setForms] = useState(initialForms)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const router = useRouter()

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (res.ok) {
        const { id } = await res.json() as { id: string }
        router.push(`/admin/forms/${id}`)
      }
    } finally { setCreating(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`确认删除表单「${name}」及其所有提交记录？`)) return
    await fetch(`/api/forms/${id}`, { method: 'DELETE' })
    setForms(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>表单管理</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>创建和管理表单，收集用户信息并推送至 CRM</p>
        </div>
        <button
          onClick={() => { setNewName(''); setCreating(true) }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          <PlusIcon size={15} /> 新建表单
        </button>
      </div>

      {/* Create inline */}
      {creating && (
        <div style={{ padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: '12px', marginBottom: '1.5rem', background: 'var(--color-bg-secondary)', display: 'flex', gap: '0.75rem' }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
            placeholder="表单名称，如：咨询申请表"
            style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.875rem', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }}
          />
          <button onClick={handleCreate} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}>创建</button>
          <button onClick={() => setCreating(false)} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }}>取消</button>
        </div>
      )}

      {/* Forms list */}
      {forms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
          <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>暂无表单</p>
          <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>点击「新建表单」开始创建</p>
          <button onClick={() => setCreating(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}>
            <PlusIcon size={14} /> 新建表单
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {forms.map(form => (
            <div key={form.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)', transition: 'box-shadow 0.15s' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' }}>{form.name}</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '99px', background: form.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: form.status === 'active' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {form.status === 'active' ? '启用' : '暂停'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  <span>{form.fields.length} 个字段</span>
                  <span>/{form.slug}</span>
                  {form.webhook_url && <span>⚡ Webhook 已配置</span>}
                  <span>{formatDate(form.created_at)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <Link href={`/form/${form.slug}`} target="_blank" title="预览表单" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.375rem', borderRadius: '6px', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                  <ExternalLinkIcon size={14} />
                </Link>
                <Link href={`/admin/forms/${form.id}`} title="编辑" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.375rem', borderRadius: '6px', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                  <EditIcon size={14} />
                </Link>
                <button onClick={() => handleDelete(form.id, form.name)} title="删除" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.375rem', borderRadius: '6px', border: '1px solid var(--color-border)', color: '#dc2626', background: 'none', cursor: 'pointer' }}>
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
