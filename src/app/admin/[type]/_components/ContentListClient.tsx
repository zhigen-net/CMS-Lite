'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Content } from '@/types'
import { formatDate } from '@/lib/utils'
import { SearchIcon, EditIcon, TrashIcon, EyeIcon } from '@/components/icons'
import PaginationNav from '@/components/PaginationNav'

interface Pagination { page: number; totalPages: number; total: number; pageSize: number }

interface Props {
  initialItems: Content[]
  type: string
  typeName: string
  pagination: Pagination
}

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  published: { label: '已发布', bg: 'rgba(16,185,129,0.1)', color: '#059669' },
  draft:     { label: '草稿',   bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
  scheduled: { label: '定时',   bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
}

export default function ContentListClient({ initialItems, type, typeName, pagination }: Props) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = items.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleDelete(id: string, title: string) {
    if (!confirm(`确定删除「${title}」吗？此操作不可撤销。`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/contents/${id}`, { method: 'DELETE' })
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
    } finally { setDeleting(null) }
  }

  async function handleToggleStatus(item: Content) {
    const newStatus = item.status === 'published' ? 'draft' : 'published'
    const res = await fetch(`/api/contents/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i))
  }

  const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.875rem', fontSize: '0.875rem',
    border: '1px solid #e4e4e7', borderRadius: '8px',
    background: '#fff', color: '#18181b',
    outline: 'none',
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a', pointerEvents: 'none', lineHeight: 0 }}>
            <SearchIcon size={15} />
          </span>
          <input
            type="text" placeholder={`搜索${typeName}…`} value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: '2.25rem', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, paddingRight: '2rem', cursor: 'pointer' }}
        >
          <option value="all">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="scheduled">定时</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#71717a' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <SearchIcon size={20} />
          </div>
          <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
            {search ? '没有找到匹配的内容' : `还没有${typeName}`}
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            {search ? '换个关键词试试' : `创建第一条${typeName}吧`}
          </p>
        </div>
      ) : (
        <div style={{ border: '1px solid #e4e4e7', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
          {filtered.map((item, i) => {
            const st = STATUS[item.status] ?? STATUS.draft
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.875rem 1.25rem',
                borderBottom: i < filtered.length - 1 ? '1px solid #e4e4e7' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f4f4f5')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                {/* Title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <Link href={`/admin/${type}/${item.id}`} style={{
                      fontSize: '0.9rem', fontWeight: 500, color: '#18181b',
                      textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.title}
                    </Link>
                    {item.ai_generated && (
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 600, padding: '0.1rem 0.4rem',
                        borderRadius: '4px', background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                        flexShrink: 0, letterSpacing: '0.03em',
                      }}>AI</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#71717a' }}>
                    /{item.slug} · {item.published_at ? formatDate(item.published_at) : formatDate(item.created_at)}
                  </p>
                </div>

                {/* Status badge */}
                <button onClick={() => handleToggleStatus(item)} title="点击切换状态" style={{
                  fontSize: '0.72rem', fontWeight: 600, padding: '0.25rem 0.625rem',
                  borderRadius: '99px', border: 'none', cursor: 'pointer',
                  background: st.bg, color: st.color, flexShrink: 0,
                }}>
                  {st.label}
                </button>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flexShrink: 0 }}>
                  <Link href={item.type === 'post' ? `/post/${item.slug}` : `/${item.slug}`} target="_blank" title="预览" style={{
                    padding: '0.375rem', borderRadius: '6px', color: '#71717a',
                    textDecoration: 'none', lineHeight: 0, display: 'block',
                    transition: 'background 0.1s, color 0.1s',
                  }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f4f4f5'; el.style.color = '#18181b' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = '#71717a' }}
                  >
                    <EyeIcon size={15} />
                  </Link>
                  <Link href={`/admin/${type}/${item.id}`} title="编辑" style={{
                    padding: '0.375rem', borderRadius: '6px', color: '#71717a',
                    textDecoration: 'none', lineHeight: 0, display: 'block',
                    transition: 'background 0.1s, color 0.1s',
                  }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f4f4f5'; el.style.color = '#2563eb' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = '#71717a' }}
                  >
                    <EditIcon size={15} />
                  </Link>
                  <button onClick={() => handleDelete(item.id, item.title)} disabled={deleting === item.id} title="删除" style={{
                    padding: '0.375rem', borderRadius: '6px', background: 'none',
                    border: 'none', cursor: 'pointer', lineHeight: 0,
                    color: '#71717a', transition: 'background 0.1s, color 0.1s',
                    opacity: deleting === item.id ? 0.4 : 1,
                  }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(239,68,68,0.08)'; el.style.color = '#ef4444' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = '#71717a' }}
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <PaginationNav
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        pageSize={pagination.pageSize}
        buildHref={p => p === 1 ? `/admin/${type}` : `/admin/${type}?page=${p}`}
        compact
      />
    </div>
  )
}
