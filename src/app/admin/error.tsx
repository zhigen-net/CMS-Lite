'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin Error]', error)
  }, [error])

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem', textAlign: 'center',
    }}>
      <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</p>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#18181b', marginBottom: '0.5rem' }}>
        页面加载出错
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#71717a', marginBottom: '0.5rem', maxWidth: '400px' }}>
        {error.message || '发生了未知错误，请重试'}
      </p>
      {error.digest && (
        <p style={{ fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
          错误码: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          padding: '8px 20px', fontSize: '13px', fontWeight: 500,
          background: '#18181b', color: '#fff', border: 'none',
          borderRadius: '8px', cursor: 'pointer',
        }}
      >
        重试
      </button>
    </div>
  )
}
