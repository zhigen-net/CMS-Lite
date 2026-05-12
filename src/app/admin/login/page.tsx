'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setError(data.error || '登录失败'); return }
      window.location.href = '/admin'
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '40px', height: '40px', borderRadius: '10px',
            background: '#18181b', marginBottom: '12px',
          }}>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>A</span>
          </div>
          <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#18181b', margin: 0 }}>
            管理后台
          </h1>
          <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px', margin: '4px 0 0' }}>
            首次登录自动创建管理员账号
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: '#fff',
          border: '1px solid #e4e4e7',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                邮箱
              </label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                style={{
                  width: '100%', padding: '8px 12px',
                  border: '1px solid #e4e4e7', borderRadius: '8px',
                  fontSize: '14px', color: '#18181b',
                  background: '#fff', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#a1a1aa')}
                onBlur={e => (e.target.style.borderColor = '#e4e4e7')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                密码
              </label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少 6 位"
                style={{
                  width: '100%', padding: '8px 12px',
                  border: '1px solid #e4e4e7', borderRadius: '8px',
                  fontSize: '14px', color: '#18181b',
                  background: '#fff', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#a1a1aa')}
                onBlur={e => (e.target.style.borderColor = '#e4e4e7')}
              />
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#ef4444', margin: 0, padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '9px 16px', borderRadius: '8px', border: 'none',
              background: '#18181b', color: '#fff',
              fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, marginTop: '2px',
              transition: 'opacity 0.15s',
            }}>
              {loading ? '登录中…' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
