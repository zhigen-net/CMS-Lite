'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { User, ApiKey } from '@/types'
import { TabBar } from '@/components/TabBar'

// ── 权限标签 ─────────────────────────────────────────────
const PERM_LABELS: Record<string, { label: string; desc: string }> = {
  'content:write': { label: '发布 / 编辑文章', desc: '可通过 API 创建、更新、发布内容' },
  'agent:run':     { label: '触发 AI Agent',   desc: '可远程启动内容生成或 SEO 优化任务' },
}

// ── 工具样式 ──────────────────────────────────────────────
const field: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: '13px',
  border: '1px solid #e4e4e7', borderRadius: '8px',
  outline: 'none', boxSizing: 'border-box', color: '#18181b',
  background: '#fff',
}

const btnPrimary: React.CSSProperties = {
  padding: '8px 20px', fontSize: '13px', fontWeight: 500,
  border: 'none', borderRadius: '8px', cursor: 'pointer',
  background: '#18181b', color: '#fff',
}

const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', fontSize: '13px', fontWeight: 400,
  border: '1px solid #e4e4e7', borderRadius: '8px', cursor: 'pointer',
  background: '#fff', color: '#374151',
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f4f4f5' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#18181b', margin: 0 }}>{title}</p>
        {desc && <p style={{ fontSize: '12px', color: '#71717a', margin: '3px 0 0' }}>{desc}</p>}
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

// ── 代码块 ────────────────────────────────────────────────
function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div style={{ position: 'relative', marginTop: '6px' }}>
      <pre style={{
        margin: 0, padding: '10px 40px 10px 12px', borderRadius: '7px',
        background: '#18181b', color: '#e2e8f0', fontSize: '11.5px',
        lineHeight: 1.65, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
      }}>{children}</pre>
      <button
        onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        style={{
          position: 'absolute', top: '6px', right: '6px',
          padding: '2px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer', border: 'none',
          background: copied ? '#10b981' : 'rgba(255,255,255,0.12)', color: '#fff',
        }}
      >{copied ? '✓' : '复制'}</button>
    </div>
  )
}

// ── 主组件 ────────────────────────────────────────────────
export default function AccountClient({ user, initialApiKeys }: { user: User; initialApiKeys: ApiKey[] }) {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'profile' | 'password' | 'apikeys'>(
    searchParams.get('tab') === 'apikeys' ? 'apikeys' : 'profile'
  )

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t === 'apikeys' || t === 'password' || t === 'profile') setTab(t)
  }, [searchParams])

  // Profile
  const [name, setName] = useState(user.name ?? '')
  const [profileMsg, setProfileMsg] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Password
  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

  // API Keys
  const [keys, setKeys] = useState<ApiKey[]>(initialApiKeys)
  const [creating, setCreating] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [perms, setPerms] = useState(['content:write', 'agent:run'])
  const [keySaving, setKeySaving] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [keyCopied, setKeyCopied] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-site.com'

  async function saveProfile() {
    setProfileSaving(true); setProfileMsg('')
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setProfileSaving(false)
    if (res.ok) setProfileMsg('保存成功')
    else { const d = await res.json() as { error?: string }; setProfileMsg(d.error ?? '保存失败') }
    setTimeout(() => setProfileMsg(''), 3000)
  }

  async function savePassword() {
    if (!curPwd || !newPwd) { setPwdMsg('请填写所有字段'); return }
    if (newPwd.length < 6) { setPwdMsg('新密码至少 6 位'); return }
    setPwdSaving(true); setPwdMsg('')
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
    })
    setPwdSaving(false)
    if (res.ok) { setCurPwd(''); setNewPwd(''); setPwdMsg('密码修改成功') }
    else { const d = await res.json() as { error?: string }; setPwdMsg(d.error ?? '修改失败') }
    setTimeout(() => setPwdMsg(''), 3000)
  }

  async function createKey() {
    if (!keyName.trim() || perms.length === 0) return
    setKeySaving(true)
    const res = await fetch('/api/user/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: keyName.trim(), permissions: perms }),
    })
    if (res.ok) {
      const d = await res.json() as { key: string }
      setNewKey(d.key)
      setKeyName(''); setPerms(['content:write', 'agent:run']); setCreating(false)
      const r2 = await fetch('/api/user/api-keys')
      if (r2.ok) setKeys(await r2.json() as ApiKey[])
    }
    setKeySaving(false)
  }

  async function deleteKey(id: string) {
    await fetch(`/api/user/api-keys/${id}`, { method: 'DELETE' })
    setKeys(k => k.filter(x => x.id !== id))
    setDeleteId(null)
  }

  function fmtDate(ts: number | null) {
    if (!ts) return '从未'
    return new Date(ts * 1000).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const tabs = [
    { key: 'profile',  label: '个人资料' },
    { key: 'password', label: '修改密码' },
    { key: 'apikeys',  label: 'API 密钥' },
  ] as const

  return (
    <div style={{ padding: '32px 40px 48px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#18181b', margin: 0 }}>账户设置</h1>
        <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>{user.email}</p>
      </div>

      {/* Tab bar */}
      <div style={{ marginBottom: '24px' }}>
        <TabBar tabs={tabs} active={tab} onChange={k => setTab(k as typeof tab)} />
      </div>

      {/* ── 个人资料 ── */}
      {tab === 'profile' && (
        <SectionCard title="个人资料">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '360px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>显示名称</label>
              <input value={name} onChange={e => setName(e.target.value)} style={field} placeholder="你的名字" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>邮箱</label>
              <input value={user.email} disabled style={{ ...field, background: '#f9fafb', color: '#9ca3af' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>角色</label>
              <input value={user.role === 'admin' ? '管理员' : user.role === 'editor' ? '编辑' : '作者'} disabled style={{ ...field, background: '#f9fafb', color: '#9ca3af' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={saveProfile} disabled={profileSaving} style={{ ...btnPrimary, opacity: profileSaving ? 0.6 : 1 }}>
                {profileSaving ? '保存中…' : '保存资料'}
              </button>
              {profileMsg && (
                <span style={{ fontSize: '13px', color: profileMsg.includes('成功') ? '#059669' : '#dc2626' }}>{profileMsg}</span>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── 修改密码 ── */}
      {tab === 'password' && (
        <SectionCard title="修改密码" desc="建议使用 12 位以上包含大小写和数字的密码">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '360px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>当前密码</label>
              <input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)} style={field} placeholder="输入当前密码" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>新密码</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} style={field} placeholder="至少 6 位" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={savePassword} disabled={pwdSaving} style={{ ...btnPrimary, opacity: pwdSaving ? 0.6 : 1 }}>
                {pwdSaving ? '修改中…' : '修改密码'}
              </button>
              {pwdMsg && (
                <span style={{ fontSize: '13px', color: pwdMsg.includes('成功') ? '#059669' : '#dc2626' }}>{pwdMsg}</span>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── API 密钥 ── */}
      {tab === 'apikeys' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 密钥管理卡片 */}
          <SectionCard title="我的 API 密钥" desc="密钥用于通过 API 调用发布内容或触发 AI Agent，请妥善保管">
            {/* 新 key 展示 */}
            {newKey && (
              <div style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#15803d', margin: '0 0 8px' }}>
                  ✓ 密钥已创建 — 请立即复制，关闭后将无法再次查看
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <code style={{ flex: 1, fontSize: '12px', background: '#fff', padding: '8px 10px', borderRadius: '7px', border: '1px solid #bbf7d0', wordBreak: 'break-all', color: '#15803d', lineHeight: 1.5 }}>
                    {newKey}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(newKey); setKeyCopied(true); setTimeout(() => setKeyCopied(false), 2000) }}
                    style={{ ...btnSecondary, border: '1px solid #bbf7d0', color: keyCopied ? '#059669' : '#374151', flexShrink: 0 }}
                  >{keyCopied ? '已复制 ✓' : '复制'}</button>
                </div>
                <button onClick={() => setNewKey('')} style={{ marginTop: '10px', fontSize: '12px', color: '#71717a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  我已复制，关闭
                </button>
              </div>
            )}

            {/* 创建表单 */}
            {creating ? (
              <div style={{ border: '1px solid #e4e4e7', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#18181b', margin: '0 0 12px' }}>新建 API 密钥</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>密钥名称</label>
                    <input
                      type="text" value={keyName} onChange={e => setKeyName(e.target.value)}
                      placeholder="如：Zapier 集成、自动发布脚本…"
                      style={field} autoFocus
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '8px' }}>权限</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(PERM_LABELS).map(([p, { label, desc }]) => (
                        <label key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', cursor: 'pointer' }}>
                          <input
                            type="checkbox" checked={perms.includes(p)}
                            onChange={() => setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                            style={{ marginTop: '2px', width: '14px', height: '14px', cursor: 'pointer' }}
                          />
                          <div>
                            <p style={{ fontSize: '13px', color: '#18181b', margin: 0 }}>{label}</p>
                            <p style={{ fontSize: '11px', color: '#71717a', margin: '1px 0 0' }}>{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={createKey} disabled={keySaving || !keyName.trim() || perms.length === 0}
                      style={{ ...btnPrimary, opacity: keySaving || !keyName.trim() || perms.length === 0 ? 0.5 : 1 }}>
                      {keySaving ? '创建中…' : '创建密钥'}
                    </button>
                    <button onClick={() => { setCreating(false); setKeyName(''); setPerms(['content:write', 'agent:run']) }} style={btnSecondary}>
                      取消
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setCreating(true)} style={{ ...btnPrimary, marginBottom: keys.length > 0 ? '16px' : '0' }}>
                + 创建 API 密钥
              </button>
            )}

            {/* 密钥列表 */}
            {keys.length > 0 && (
              <div style={{ border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' }}>
                {keys.map((k, i) => (
                  <div key={k.id} style={{ padding: '12px 14px', borderBottom: i < keys.length - 1 ? '1px solid #f4f4f5' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#18181b' }}>{k.name}</span>
                        <code style={{ fontSize: '11px', background: '#f4f4f5', padding: '1px 7px', borderRadius: '5px', color: '#6b7280' }}>
                          cmsk_{k.key_prefix}…
                        </code>
                      </div>
                      <div style={{ marginTop: '4px', display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {k.permissions.map(p => (
                          <span key={p} style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '99px', background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.18)' }}>
                            {PERM_LABELS[p]?.label ?? p}
                          </span>
                        ))}
                        <span style={{ fontSize: '11px', color: '#a1a1aa' }}>最后使用: {fmtDate(k.last_used_at)}</span>
                      </div>
                    </div>
                    {deleteId === k.id ? (
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => deleteKey(k.id)} style={{ ...btnSecondary, color: '#ef4444', border: '1px solid #fecaca', fontSize: '12px', padding: '5px 10px' }}>确认删除</button>
                        <button onClick={() => setDeleteId(null)} style={{ ...btnSecondary, fontSize: '12px', padding: '5px 10px' }}>取消</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteId(k.id)} style={{ ...btnSecondary, fontSize: '12px', padding: '5px 10px', color: '#ef4444', border: '1px solid #fecaca', flexShrink: 0 }}>
                        删除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {keys.length === 0 && !creating && (
              <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '12px 0 0' }}>还没有 API 密钥，点击上方按钮创建</p>
            )}
          </SectionCard>

          {/* 使用文档 */}
          <SectionCard title="API 使用说明" desc="通过 HTTP 请求直接调用 CMS 功能">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* 认证方式 */}
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: '0 0 6px' }}>认证方式</p>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px' }}>在所有请求的 Header 中添加：</p>
                <Code>{`Authorization: Bearer cmsk_your_api_key`}</Code>
              </div>

              {/* 触发内容 Agent */}
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: '0 0 4px' }}>
                  触发内容 Agent
                  <span style={{ fontSize: '11px', fontWeight: 400, background: 'rgba(99,102,241,0.08)', color: '#6366f1', padding: '1px 7px', borderRadius: '99px', marginLeft: '8px' }}>agent:run</span>
                </p>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px' }}>自动生成并发布文章：</p>
                <Code>{`curl -X POST ${origin}/api/agents/run \\
  -H "Authorization: Bearer cmsk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"agent":"content"}'`}</Code>
              </div>

              {/* 触发 SEO Agent */}
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: '0 0 4px' }}>
                  触发 SEO Agent
                  <span style={{ fontSize: '11px', fontWeight: 400, background: 'rgba(99,102,241,0.08)', color: '#6366f1', padding: '1px 7px', borderRadius: '99px', marginLeft: '8px' }}>agent:run</span>
                </p>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px' }}>批量补全文章 SEO meta：</p>
                <Code>{`curl -X POST ${origin}/api/agents/run \\
  -H "Authorization: Bearer cmsk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"agent":"seo"}'`}</Code>
              </div>

              {/* 发布文章 */}
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: '0 0 4px' }}>
                  发布文章
                  <span style={{ fontSize: '11px', fontWeight: 400, background: 'rgba(99,102,241,0.08)', color: '#6366f1', padding: '1px 7px', borderRadius: '99px', marginLeft: '8px' }}>content:write</span>
                </p>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px' }}>直接发布一篇文章（status 改为 <code style={{ background: '#f4f4f5', padding: '0 4px', borderRadius: '3px' }}>draft</code> 则保存草稿）：</p>
                <Code>{`curl -X POST ${origin}/api/contents \\
  -H "Authorization: Bearer cmsk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "post",
    "title": "文章标题",
    "content": "正文内容（支持 Markdown）",
    "excerpt": "摘要",
    "status": "published"
  }'`}</Code>
              </div>

              {/* 更新文章 */}
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: '0 0 4px' }}>
                  更新文章
                  <span style={{ fontSize: '11px', fontWeight: 400, background: 'rgba(99,102,241,0.08)', color: '#6366f1', padding: '1px 7px', borderRadius: '99px', marginLeft: '8px' }}>content:write</span>
                </p>
                <Code>{`curl -X PATCH ${origin}/api/contents/{id} \\
  -H "Authorization: Bearer cmsk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"新标题","status":"published"}'`}</Code>
              </div>

              {/* 查询文章列表 */}
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: '0 0 4px' }}>
                  查询文章列表
                  <span style={{ fontSize: '11px', fontWeight: 400, background: 'rgba(16,185,129,0.08)', color: '#059669', padding: '1px 7px', borderRadius: '99px', marginLeft: '8px' }}>无需权限</span>
                </p>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px' }}>返回已发布的文章（公开接口）：</p>
                <Code>{`curl "${origin}/api/contents?type=post&status=published&page=1"`}</Code>
              </div>

              {/* 响应示例 */}
              <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '8px', padding: '12px 14px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>响应说明</p>
                <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    ['200 / ok: true', '操作成功'],
                    ['401', 'API Key 无效或未提供'],
                    ['403', '该 Key 缺少所需权限'],
                    ['400', '请求参数错误'],
                  ].map(([code, desc]) => (
                    <li key={code} style={{ fontSize: '12px', color: '#71717a' }}>
                      <code style={{ background: '#f4f4f5', padding: '0 5px', borderRadius: '3px', fontSize: '11px' }}>{code}</code>
                      {' — '}{desc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  )
}
