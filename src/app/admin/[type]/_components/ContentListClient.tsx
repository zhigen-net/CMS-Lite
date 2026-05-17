'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Content, ContentStatus } from '@/types'
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
  published: { label: '已发布', bg: 'rgba(16,185,129,0.1)',  color: '#059669' },
  draft:     { label: '草稿',   bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
  scheduled: { label: '定时',   bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
}

const confirmBtnBase: React.CSSProperties = {
  padding: '2px 8px', fontSize: '11px', fontWeight: 600,
  border: 'none', borderRadius: '5px', cursor: 'pointer',
}

export default function ContentListClient({ initialItems, type, typeName, pagination }: Props) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmToggleId, setConfirmToggleId] = useState<string | null>(null)

  // batch
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchWorking, setBatchWorking] = useState(false)
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false)

  const filtered = items.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    return matchSearch && matchStatus
  })

  const allSelected = filtered.length > 0 && filtered.every(i => selectedIds.has(i.id))
  const someSelected = selectedIds.size > 0

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function doDelete(id: string) {
    setConfirmDeleteId(null)
    setDeleting(id)
    try {
      const res = await fetch(`/api/contents/${id}`, { method: 'DELETE' })
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
    } finally { setDeleting(null) }
  }

  async function doToggleStatus(item: Content) {
    setConfirmToggleId(null)
    const newStatus = item.status === 'published' ? 'draft' : 'published'
    const res = await fetch(`/api/contents/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i))
  }

  async function batchSetStatus(status: ContentStatus) {
    setBatchWorking(true)
    try {
      const ids = [...selectedIds]
      await Promise.all(ids.map(id =>
        fetch(`/api/contents/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      ))
      setItems(prev => prev.map(i => selectedIds.has(i.id) ? { ...i, status } : i))
      setSelectedIds(new Set())
    } finally { setBatchWorking(false) }
  }

  async function batchDelete() {
    setBatchWorking(true)
    try {
      const ids = [...selectedIds]
      await Promise.all(ids.map(id => fetch(`/api/contents/${id}`, { method: 'DELETE' })))
      setItems(prev => prev.filter(i => !selectedIds.has(i.id)))
      setSelectedIds(new Set())
    } finally { setBatchWorking(false); setConfirmBatchDelete(false) }
  }

  const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.875rem', fontSize: '0.875rem',
    border: '1px solid #e4e4e7', borderRadius: '8px',
    background: '#fff', color: '#18181b', outline: 'none',
  }

  return (
    <div>
      {/* Toolbar */}
      {someSelected ? (
        /* Batch action bar */
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem',
          padding: '10px 14px', borderRadius: '10px',
          background: '#18181b', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500, flex: 1 }}>
            已选 {selectedIds.size} 条
          </span>

          {confirmBatchDelete ? (
            <>
              <span style={{ fontSize: '12px', color: '#fca5a5' }}>确认删除 {selectedIds.size} 条内容？</span>
              <button onClick={batchDelete} disabled={batchWorking} style={{
                padding: '5px 14px', borderRadius: '6px', border: 'none',
                background: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: 600,
                cursor: batchWorking ? 'not-allowed' : 'pointer', opacity: batchWorking ? 0.6 : 1,
              }}>{batchWorking ? '删除中…' : '确认删除'}</button>
              <button onClick={() => setConfirmBatchDelete(false)} style={{
                padding: '5px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent', color: '#fff', fontSize: '12px', cursor: 'pointer',
              }}>取消</button>
            </>
          ) : (
            <>
              <button onClick={() => batchSetStatus('published')} disabled={batchWorking} style={{
                padding: '5px 14px', borderRadius: '6px', border: 'none',
                background: '#10b981', color: '#fff', fontSize: '12px', fontWeight: 500,
                cursor: batchWorking ? 'not-allowed' : 'pointer', opacity: batchWorking ? 0.6 : 1,
              }}>批量发布</button>
              <button onClick={() => batchSetStatus('draft')} disabled={batchWorking} style={{
                padding: '5px 14px', borderRadius: '6px', border: 'none',
                background: '#6b7280', color: '#fff', fontSize: '12px', fontWeight: 500,
                cursor: batchWorking ? 'not-allowed' : 'pointer', opacity: batchWorking ? 0.6 : 1,
              }}>批量转草稿</button>
              <button onClick={() => setConfirmBatchDelete(true)} disabled={batchWorking} style={{
                padding: '5px 14px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.5)',
                background: 'transparent', color: '#fca5a5', fontSize: '12px', fontWeight: 500,
                cursor: batchWorking ? 'not-allowed' : 'pointer',
              }}>批量删除</button>
              <button onClick={() => setSelectedIds(new Set())} style={{
                padding: '5px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent', color: '#a1a1aa', fontSize: '12px', cursor: 'pointer',
              }}>取消选择</button>
            </>
          )}
        </div>
      ) : (
        /* Normal toolbar */
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a', pointerEvents: 'none', lineHeight: 0 }}>
              <SearchIcon size={15} />
            </span>
            <input
              type="text" placeholder={`搜索${typeName}…`} value={search}
              onChange={e => { setSearch(e.target.value); setSelectedIds(new Set()) }}
              style={{ ...inputStyle, width: '100%', paddingLeft: '2.25rem', boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setSelectedIds(new Set()) }}
            style={{ ...inputStyle, paddingRight: '2rem', cursor: 'pointer' }}
          >
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="scheduled">定时</option>
          </select>
        </div>
      )}

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
          {/* Header row with select-all */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '8px 1.25rem',
            borderBottom: '1px solid #e4e4e7',
            background: '#fafafa',
          }}>
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = !allSelected && someSelected }}
              onChange={toggleAll}
              style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#18181b', flexShrink: 0 }}
            />
            <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 500 }}>
              {someSelected ? `已选 ${selectedIds.size} / ${filtered.length}` : `共 ${filtered.length} 条`}
            </span>
          </div>

          {filtered.map((item, i) => {
            const st = STATUS[item.status] ?? STATUS.draft
            const isConfirmingDelete = confirmDeleteId === item.id
            const isConfirmingToggle = confirmToggleId === item.id
            const isSelected = selectedIds.has(item.id)

            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.875rem 1.25rem',
                borderBottom: i < filtered.length - 1 ? '1px solid #e4e4e7' : 'none',
                background: isSelected ? 'rgba(99,102,241,0.04)' : '#fff',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f9f9f9' }}
                onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(99,102,241,0.04)' : '#fff' }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(item.id)}
                  style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#18181b', flexShrink: 0 }}
                />

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
                  <p style={{ fontSize: '0.75rem', color: '#71717a', margin: 0 }}>
                    /{item.slug} · {item.published_at ? formatDate(item.published_at) : formatDate(item.created_at)}
                  </p>
                </div>

                {/* Status badge / toggle confirm */}
                {isConfirmingToggle ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: '#52525b', whiteSpace: 'nowrap' }}>
                      切换为{item.status === 'published' ? '草稿' : '发布'}?
                    </span>
                    <button onClick={() => doToggleStatus(item)} style={{ ...confirmBtnBase, background: '#18181b', color: '#fff' }}>确认</button>
                    <button onClick={() => setConfirmToggleId(null)} style={{ ...confirmBtnBase, background: '#f4f4f5', color: '#52525b' }}>取消</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmToggleId(item.id)}
                    title="点击切换状态"
                    style={{
                      fontSize: '0.72rem', fontWeight: 600, padding: '0.25rem 0.625rem',
                      borderRadius: '99px', border: 'none', cursor: 'pointer',
                      background: st.bg, color: st.color, flexShrink: 0,
                    }}
                  >
                    {st.label}
                  </button>
                )}

                {/* Actions / delete confirm */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flexShrink: 0 }}>
                  {isConfirmingDelete ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#ef4444', whiteSpace: 'nowrap' }}>确认删除?</span>
                      <button
                        onClick={() => doDelete(item.id)}
                        disabled={deleting === item.id}
                        style={{ ...confirmBtnBase, background: '#ef4444', color: '#fff', opacity: deleting === item.id ? 0.5 : 1 }}
                      >删除</button>
                      <button onClick={() => setConfirmDeleteId(null)} style={{ ...confirmBtnBase, background: '#f4f4f5', color: '#52525b' }}>取消</button>
                    </div>
                  ) : (
                    <>
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
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        disabled={deleting === item.id}
                        title="删除"
                        style={{
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
                    </>
                  )}
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
