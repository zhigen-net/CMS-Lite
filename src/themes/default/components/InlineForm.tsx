'use client'

import { useState } from 'react'
import type { Form, FormField } from '@/types'

interface Props { form: Form }

export default function InlineForm({ form }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const errs: Record<string, string> = {}
    for (const field of form.fields as FormField[]) {
      if (field.required && !values[field.key]?.trim()) errs[field.key] = `${field.label}不能为空`
      if (field.type === 'email' && values[field.key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field.key]))
        errs[field.key] = '请输入有效的邮箱地址'
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
      setResult({ ok: !!res.ok, message: res.ok ? (data.message || form.submit_message) : (data.error || '提交失败，请稍后重试') })
    } catch {
      setResult({ ok: false, message: '网络错误，请稍后重试' })
    } finally { setSubmitting(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
    border: '1px solid var(--color-border)', fontSize: '0.9rem',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  if (result?.ok) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✓</div>
        <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.375rem' }}>提交成功</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{result.message}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 'clamp(1.25rem,4vw,2rem)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}>
      {form.name && (
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: form.description ? '0.5rem' : '1.25rem' }}>
          {form.name}
        </h3>
      )}
      {form.description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.65 }}>{form.description}</p>
      )}

      {result && !result.ok && (
        <div style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: '0.8rem', marginBottom: '1rem' }}>
          {result.message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(form.fields as FormField[]).map(field => (
          <div key={field.key}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.3rem' }}>
              {field.label}{field.required && <span style={{ color: '#ef4444', marginLeft: '0.2rem' }}>*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea value={values[field.key] || ''} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={3} style={{ ...inp, resize: 'vertical', borderColor: errors[field.key] ? '#ef4444' : 'var(--color-border)' }} />
            ) : field.type === 'select' ? (
              <select value={values[field.key] || ''} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} style={{ ...inp, borderColor: errors[field.key] ? '#ef4444' : 'var(--color-border)' }}>
                <option value="">请选择…</option>
                {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : field.type === 'checkbox' ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={values[field.key] === 'true'} onChange={e => setValues(v => ({ ...v, [field.key]: String(e.target.checked) }))} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{field.placeholder || field.label}</span>
              </label>
            ) : (
              <input type={field.type} value={values[field.key] || ''} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} placeholder={field.placeholder} style={{ ...inp, borderColor: errors[field.key] ? '#ef4444' : 'var(--color-border)' }} />
            )}
            {errors[field.key] && <p style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.25rem' }}>{errors[field.key]}</p>}
          </div>
        ))}

        <button type="submit" disabled={submitting} style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, alignSelf: 'flex-start', fontFamily: 'inherit' }}>
          {submitting ? '提交中…' : '提交'}
        </button>
      </form>
    </div>
  )
}
