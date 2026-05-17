'use client'

import { useState, useEffect } from 'react'
import type { User } from '@/types'
import { UserIcon, KeyIcon, TrashIcon, PlusIcon, XIcon, CheckIcon } from '@/components/icons'

const ROLES = [
  { value: 'admin', label: '管理员', color: '#7c3aed', bg: '#ede9fe' },
  { value: 'editor', label: '编辑', color: '#0369a1', bg: '#e0f2fe' },
  { value: 'author', label: '作者', color: '#15803d', bg: '#dcfce7' },
]

function RoleBadge({ role }: { role: string }) {
  const r = ROLES.find(x => x.value === role) ?? ROLES[1]
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px',
      color: r.color, background: r.bg,
    }}>{r.label}</span>
  )
}

function Avatar({ user }: { user: User }) {
  if (user.avatar) {
    return <img src={user.avatar} alt={user.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: '#e4e4e7',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <UserIcon size={16} />
    </div>
  )
}

function formatDate(ts: number | null) {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: '13px',
  border: '1px solid #e4e4e7', borderRadius: '7px',
  background: '#fff', color: '#18181b', outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: '#52525b', marginBottom: '5px' }

interface CreateForm { name: string; email: string; password: string; role: string }
interface EditForm { name: string; role: string }
interface PwdForm { password: string; confirm: string }

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<User | null>(null)

  // modals
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>({ name: '', email: '', password: '', role: 'editor' })
  const [createError, setCreateError] = useState('')
  const [createSaving, setCreateSaving] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ name: '', role: 'editor' })
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [pwdUserId, setPwdUserId] = useState<string | null>(null)
  const [pwdForm, setPwdForm] = useState<PwdForm>({ password: '', confirm: '' })
  const [pwdError, setPwdError] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.ok ? r.json() as Promise<User[]> : []),
      fetch('/api/users/me').then(r => r.ok ? r.json() as Promise<User> : null),
    ]).then(([us, m]) => { setUsers(us); setMe(m) }).finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError('请填写所有必填项'); return
    }
    setCreateSaving(true); setCreateError('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        const list = await fetch('/api/users').then(r => r.json() as Promise<User[]>)
        setUsers(list); setCreating(false); setCreateForm({ name: '', email: '', password: '', role: 'editor' })
      } else {
        const d = await res.json() as { error?: string }
        setCreateError(d.error ?? '创建失败')
      }
    } finally { setCreateSaving(false) }
  }

  function startEdit(u: User) {
    setEditingId(u.id); setEditForm({ name: u.name, role: u.role }); setEditError('')
  }

  async function handleEdit() {
    if (!editForm.name.trim()) { setEditError('姓名不能为空'); return }
    setEditSaving(true); setEditError('')
    try {
      const res = await fetch(`/api/users/${editingId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === editingId ? { ...u, name: editForm.name, role: editForm.role as User['role'] } : u))
        setEditingId(null)
      } else {
        const d = await res.json() as { error?: string }
        setEditError(d.error ?? '保存失败')
      }
    } finally { setEditSaving(false) }
  }

  async function handlePassword() {
    if (pwdForm.password.length < 6) { setPwdError('密码至少 6 位'); return }
    if (pwdForm.password !== pwdForm.confirm) { setPwdError('两次密码不一致'); return }
    setPwdSaving(true); setPwdError('')
    try {
      const res = await fetch(`/api/users/${pwdUserId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwdForm.password }),
      })
      if (res.ok) { setPwdUserId(null); setPwdForm({ password: '', confirm: '' }) }
      else { const d = await res.json() as { error?: string }; setPwdError(d.error ?? '设置失败') }
    } finally { setPwdSaving(false) }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id))
    setDeletingId(null)
  }

  const modalBase: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
  }
  const panelBase: React.CSSProperties = {
    background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '420px',
    padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa', fontSize: '13px' }}>加载中…</div>

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#18181b', letterSpacing: '-0.02em', margin: 0 }}>用户管理</h1>
          <p style={{ fontSize: '13px', color: '#71717a', margin: '4px 0 0' }}>{users.length} 个账户</p>
        </div>
        <button onClick={() => { setCreating(true); setCreateError('') }} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', borderRadius: '8px', border: 'none',
          background: '#18181b', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
        }}>
          <PlusIcon size={13} /> 新建用户
        </button>
      </div>

      {/* User list */}
      <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
        {users.map((u, i) => (
          editingId === u.id ? (
            /* Edit row */
            <div key={u.id} style={{ padding: '16px', background: '#fafafa', borderBottom: i < users.length - 1 ? '1px solid #f4f4f5' : 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={labelStyle}>姓名</label>
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} autoFocus />
                </div>
                <div>
                  <label style={labelStyle}>角色</label>
                  <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, appearance: 'auto' }}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              {editError && <p style={{ fontSize: '12px', color: '#ef4444', margin: '0 0 8px' }}>{editError}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleEdit} disabled={editSaving} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#18181b', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  {editSaving ? '保存中…' : '保存'}
                </button>
                <button onClick={() => setEditingId(null)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e4e4e7', background: '#fff', color: '#52525b', fontSize: '12px', cursor: 'pointer' }}>取消</button>
              </div>
            </div>
          ) : (
            /* Normal row */
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
              borderBottom: i < users.length - 1 ? '1px solid #f4f4f5' : 'none',
            }}>
              <Avatar user={u} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>{u.name}</span>
                  <RoleBadge role={u.role} />
                  {me?.id === u.id && <span style={{ fontSize: '11px', color: '#a1a1aa' }}>（你）</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#71717a' }}>
                  {u.email} · 最后登录 {formatDate(u.last_login)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button onClick={() => startEdit(u)} title="编辑" style={iconBtn}>
                  <CheckIcon size={13} />
                </button>
                <button onClick={() => { setPwdUserId(u.id); setPwdForm({ password: '', confirm: '' }); setPwdError('') }} title="重置密码" style={iconBtn}>
                  <KeyIcon size={13} />
                </button>
                {me?.id !== u.id && (
                  <button onClick={() => setDeletingId(u.id)} title="删除" style={{ ...iconBtn, color: '#ef4444' }}>
                    <TrashIcon size={13} />
                  </button>
                )}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Create modal */}
      {creating && (
        <div style={modalBase} onClick={() => setCreating(false)}>
          <div style={panelBase} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#18181b', margin: 0 }}>新建用户</h2>
              <button onClick={() => setCreating(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#71717a', lineHeight: 0 }}><XIcon size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>姓名 *</label>
                <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="张三" style={inputStyle} autoFocus />
              </div>
              <div>
                <label style={labelStyle}>邮箱 *</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="zhang@example.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>初始密码 *</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="至少 6 位" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>角色</label>
                <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, appearance: 'auto' }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.value === 'admin' ? '完全权限' : r.value === 'editor' ? '可管理内容' : '仅管理自己的内容'}</option>)}
                </select>
              </div>
              {createError && <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>{createError}</p>}
              <button onClick={handleCreate} disabled={createSaving} style={{
                padding: '9px', borderRadius: '8px', border: 'none',
                background: '#18181b', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '4px',
              }}>
                {createSaving ? '创建中…' : '创建用户'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {pwdUserId && (
        <div style={modalBase} onClick={() => setPwdUserId(null)}>
          <div style={panelBase} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#18181b', margin: 0 }}>
                重置密码 · {users.find(u => u.id === pwdUserId)?.name}
              </h2>
              <button onClick={() => setPwdUserId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#71717a', lineHeight: 0 }}><XIcon size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>新密码</label>
                <input type="password" value={pwdForm.password} onChange={e => setPwdForm(f => ({ ...f, password: e.target.value }))} placeholder="至少 6 位" style={inputStyle} autoFocus />
              </div>
              <div>
                <label style={labelStyle}>确认密码</label>
                <input type="password" value={pwdForm.confirm} onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} placeholder="再次输入" style={inputStyle} />
              </div>
              {pwdError && <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>{pwdError}</p>}
              <button onClick={handlePassword} disabled={pwdSaving} style={{
                padding: '9px', borderRadius: '8px', border: 'none',
                background: '#18181b', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
                {pwdSaving ? '设置中…' : '设置新密码'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deletingId && (
        <div style={modalBase} onClick={() => setDeletingId(null)}>
          <div style={{ ...panelBase, maxWidth: '360px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#18181b', margin: '0 0 8px' }}>确认删除</h2>
            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 20px' }}>
              删除用户 <strong>{users.find(u => u.id === deletingId)?.name}</strong>？此操作无法撤销。
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => setDeletingId(null)} style={{ padding: '8px 20px', borderRadius: '7px', border: '1px solid #e4e4e7', background: '#fff', color: '#52525b', fontSize: '13px', cursor: 'pointer' }}>取消</button>
              <button onClick={() => handleDelete(deletingId)} style={{ padding: '8px 20px', borderRadius: '7px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  padding: '5px', border: '1px solid #e4e4e7', borderRadius: '6px',
  background: '#fff', color: '#52525b', cursor: 'pointer', lineHeight: 0,
}
