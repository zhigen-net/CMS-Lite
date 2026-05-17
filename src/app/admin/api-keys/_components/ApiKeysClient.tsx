'use client'

import { useState } from 'react'
import type { ApiKey } from '@/types'

const PERM_LABELS: Record<string, string> = {
  'content:write': '发布/编辑文章',
  'agent:run': '触发 AI Agent',
}

function fmtDate(ts: number | null) {
  if (!ts) return '从未使用'
  return new Date(ts * 1000).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ApiKeysClient({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [perms, setPerms] = useState<string[]>(['content:write', 'agent:run'])
  const [saving, setSaving] = useState(false)
  const [newKey, setNewKey] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), permissions: perms }),
      })
      if (!res.ok) return
      const data = await res.json() as { key: string }
      setNewKey(data.key)
      setName('')
      setPerms(['content:write', 'agent:run'])
      setCreating(false)
      // refresh list
      const r2 = await fetch('/api/user/api-keys')
      if (r2.ok) setKeys(await r2.json() as ApiKey[])
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/user/api-keys/${id}`, { method: 'DELETE' })
    setKeys(k => k.filter(x => x.id !== id))
    setDeleteId(null)
  }

  function togglePerm(p: string) {
    setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function copyKey() {
    navigator.clipboard.writeText(newKey).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }
  const btn = (primary?: boolean): React.CSSProperties => ({
    padding: '7px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '8px', cursor: 'pointer', border: 'none',
    background: primary ? '#18181b' : '#fff',
    color: primary ? '#fff' : '#374151',
    ...(primary ? {} : { border: '1px solid #e4e4e7' }),
  })

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: '720px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#18181b', margin: 0 }}>API 密钥</h1>
          <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>用于通过 API 调用发布内容或触发 AI Agent</p>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} style={btn(true)}>创建密钥</button>
        )}
      </div>

      {/* 新 key 展示 */}
      {newKey && (
        <div style={{ ...card, marginBottom: '20px', border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
          <div style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#15803d', margin: '0 0 8px' }}>✓ 密钥已创建 — 请立即复制，关闭后将无法再次查看</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <code style={{ flex: 1, fontSize: '12px', background: '#fff', padding: '9px 12px', borderRadius: '8px', border: '1px solid #bbf7d0', wordBreak: 'break-all', color: '#15803d', lineHeight: 1.5 }}>
                {newKey}
              </code>
              <button onClick={copyKey} style={{ ...btn(), color: copied ? '#059669' : '#374151', flexShrink: 0, border: '1px solid #bbf7d0' }}>
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <button onClick={() => setNewKey('')} style={{ marginTop: '10px', fontSize: '12px', color: '#71717a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              我已复制，关闭
            </button>
          </div>
        </div>
      )}

      {/* 创建表单 */}
      {creating && (
        <div style={{ ...card, marginBottom: '20px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f4f4f5', background: '#fafafa' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: 0 }}>新建 API 密钥</p>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>名称</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="如：Zapier、自动化脚本…"
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e4e4e7', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '8px' }}>权限</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(PERM_LABELS).map(([p, label]) => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                    <input type="checkbox" checked={perms.includes(p)} onChange={() => togglePerm(p)} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                    {label}
                    <code style={{ fontSize: '11px', background: '#f4f4f5', padding: '1px 6px', borderRadius: '4px', color: '#6b7280' }}>{p}</code>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCreate} disabled={saving || !name.trim()} style={{ ...btn(true), opacity: saving || !name.trim() ? 0.5 : 1 }}>
                {saving ? '创建中…' : '创建'}
              </button>
              <button onClick={() => { setCreating(false); setName(''); setPerms(['content:write', 'agent:run']) }} style={btn()}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 密钥列表 */}
      {keys.length === 0 && !creating ? (
        <div style={{ ...card, textAlign: 'center', padding: '4rem 0', color: '#a1a1aa' }}>
          <p style={{ fontSize: '13px' }}>还没有 API 密钥</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>点击右上角「创建密钥」开始</p>
        </div>
      ) : keys.length > 0 && (
        <div style={card}>
          {keys.map((k, i) => (
            <div key={k.id} style={{ padding: '14px 20px', borderBottom: i < keys.length - 1 ? '1px solid #f4f4f5' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>{k.name}</span>
                    <code style={{ fontSize: '11px', background: '#f4f4f5', padding: '1px 7px', borderRadius: '5px', color: '#6b7280' }}>
                      cmsk_{k.key_prefix}…
                    </code>
                  </div>
                  <div style={{ marginTop: '5px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {k.permissions.map(p => (
                      <span key={p} style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '99px', background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                        {PERM_LABELS[p] ?? p}
                      </span>
                    ))}
                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>创建于 {fmtDate(k.created_at)}</span>
                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>最后使用: {fmtDate(k.last_used_at)}</span>
                  </div>
                </div>

                {deleteId === k.id ? (
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => handleDelete(k.id)} style={{ ...btn(), color: '#ef4444', border: '1px solid #fecaca', fontSize: '12px', padding: '5px 12px' }}>确认删除</button>
                    <button onClick={() => setDeleteId(null)} style={{ ...btn(), fontSize: '12px', padding: '5px 12px' }}>取消</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteId(k.id)} style={{ ...btn(), fontSize: '12px', padding: '5px 12px', color: '#ef4444', border: '1px solid #fecaca', flexShrink: 0 }}>删除</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 使用说明 */}
      <div style={{ marginTop: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#475569', margin: '0 0 8px' }}>如何使用</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            在 HTTP 请求头中添加：<code style={{ background: '#fff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>Authorization: Bearer cmsk_your_key</code>
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            触发内容 Agent：<code style={{ background: '#fff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>POST /api/agents/run {'{ "agent": "content" }'}</code>
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            发布文章：<code style={{ background: '#fff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>POST /api/contents</code>（附文章数据）
          </p>
        </div>
      </div>
    </div>
  )
}
