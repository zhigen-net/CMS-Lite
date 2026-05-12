'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'

export default function SearchBox({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: '560px' }}>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="输入关键词搜索文章…"
        autoFocus
        style={{
          flex: 1, height: '44px',
          padding: '0 1rem',
          fontSize: '0.9375rem',
          border: '1.5px solid var(--color-border)',
          borderRadius: '10px',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)')}
        onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)')}
      />
      <button type="submit" style={{
        height: '44px', padding: '0 1.25rem',
        borderRadius: '10px', border: 'none',
        background: 'var(--color-text)', color: '#fff',
        fontSize: '0.875rem', fontWeight: 600,
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'opacity 0.15s',
      }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
      >
        搜索
      </button>
    </form>
  )
}
