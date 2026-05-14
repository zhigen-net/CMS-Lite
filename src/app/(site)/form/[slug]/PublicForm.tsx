'use client'

import { useState } from 'react'
import type { Form, FormField } from '@/types'

interface Props { form: Form }

export default function PublicForm({ form }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const errs: Record<string, string> = {}
    for (const field of form.fields as FormField[]) {
      if (field.required && !values[field.key]?.trim()) {
        errs[field.key] = `${field.label}不能为空`
      }
      if (field.type === 'email' && values[field.key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field.key])) {
        errs[field.key] = '请输入有效的邮箱地址'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/forms/${form.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, _source_url: window.location.href }),
      })
      const data = await res.json() as { ok?: boolean; error?: string; message?: string }
      if (res.ok) {
        setResult({ ok: true, message: data.message || form.submit_message })
      } else {
        setResult({ ok: false, message: data.error || '提交失败，请稍后重试' })
      }
    } catch {
      setResult({ ok: false, message: '网络错误，请稍后重试' })
    } finally {
      setSubmitting(false)
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.875rem', borderRadius: '8px',
    border: '1px solid var(--color-border)', fontSize: '0.9375rem',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  }

  if (result?.ok) {
    return (
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.75rem' }}>✓</div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.75rem' }}>提交成功</h2>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{result.message}</p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: 'clamp(2.5rem,6vw,4rem) 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--color-text)', marginBottom: '0.75rem' }}>
          {form.name}
        </h1>
        {form.description && (
          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', lineHeight: 1.75 }}>{form.description}</p>
        )}
      </div>

      {result && !result.ok && (
        <div style={{ padding: '0.875rem 1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {result.message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {(form.fields as FormField[]).map(field => (
          <div key={field.key}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.375rem' }}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                value={values[field.key] || ''}
                onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                rows={4}
                style={{ ...inputBase, resize: 'vertical', borderColor: errors[field.key] ? '#ef4444' : 'var(--color-border)' }}
              />
            ) : field.type === 'select' ? (
              <select
                value={values[field.key] || ''}
                onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                style={{ ...inputBase, borderColor: errors[field.key] ? '#ef4444' : 'var(--color-border)' }}
              >
                <option value="">请选择…</option>
                {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : field.type === 'checkbox' ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={values[field.key] === 'true'}
                  onChange={e => setValues(v => ({ ...v, [field.key]: String(e.target.checked) }))}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{field.placeholder || field.label}</span>
              </label>
            ) : (
              <input
                type={field.type}
                value={values[field.key] || ''}
                onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                style={{ ...inputBase, borderColor: errors[field.key] ? '#ef4444' : 'var(--color-border)' }}
              />
            )}

            {errors[field.key] && (
              <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.375rem' }}>{errors[field.key]}</p>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          style={{ padding: '0.75rem 2rem', borderRadius: '10px', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, transition: 'opacity 0.15s', marginTop: '0.5rem', fontFamily: 'inherit' }}
        >
          {submitting ? '提交中…' : '提交'}
        </button>
      </form>
    </main>
  )
}
