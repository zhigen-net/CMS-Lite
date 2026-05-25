'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { PlusIcon, EditIcon, TrashIcon } from '@/components/icons'
import type { CategoryWithCount } from '@/lib/db'
import { TabBar } from '@/components/TabBar'

interface Props {
  initialPost: CategoryWithCount[]
  initialPage: CategoryWithCount[]
}

const inp: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: '13px',
  border: '1px solid #e4e4e7', borderRadius: '7px',
  outline: 'none', boxSizing: 'border-box', color: '#18181b',
}

type ModalMode = { type: 'create' } | { type: 'edit'; item: CategoryWithCount }

function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}
function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// Build display order: top-level cats in sort_order, each followed by their children
function buildTree(cats: CategoryWithCount[]): { cat: CategoryWithCount; depth: number }[] {
  const roots = cats.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order)
  const result: { cat: CategoryWithCount; depth: number }[] = []
  for (const root of roots) {
    result.push({ cat: root, depth: 0 })
    const children = cats.filter(c => c.parent_id === root.id).sort((a, b) => a.sort_order - b.sort_order)
    for (const child of children) {
      result.push({ cat: child, depth: 1 })
    }
  }
  // orphaned children (parent deleted) shown at end
  const listedIds = new Set(result.map(r => r.cat.id))
  cats.filter(c => !listedIds.has(c.id)).forEach(c => result.push({ cat: c, depth: 1 }))
  return result
}

export default function CategoriesClient({ initialPost, initialPage }: Props) {
  const [tab, setTab] = useState<'post' | 'page'>('post')
  const [postCats, setPostCats] = useState(initialPost)
  const [pageCats, setPageCats] = useState(initialPage)
  const [modal, setModal] = useState<ModalMode | null>(null)
  const [delId, setDelId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState('')
  const [saving, setSaving] = useState(false)
  const [sortSaving, setSortSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const cats = tab === 'post' ? postCats : pageCats
  const setCats = tab === 'post' ? setPostCats : setPageCats

  const tree = buildTree(cats)

  // Only top-level cats available as parents (max 2 levels)
  const topLevel = cats.filter(c => !c.parent_id)

  function openCreate() {
    setName(''); setDescription(''); setParentId(''); setMsg('')
    setModal({ type: 'create' })
  }

  function openEdit(item: CategoryWithCount) {
    setName(item.name)
    setDescription(item.description ?? '')
    setParentId(item.parent_id ?? '')
    setMsg('')
    setModal({ type: 'edit', item })
  }

  async function handleSave() {
    if (!name.trim()) { setMsg('名称不能为空'); return }
    setSaving(true); setMsg('')
    try {
      if (modal?.type === 'create') {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, parent_id: parentId || null, content_type: tab }),
        })
        if (!res.ok) { setMsg('创建失败'); return }
        const cat = await res.json() as CategoryWithCount
        setCats(prev => [...prev, {
          ...cat,
          description: description || null,
          cover_image: null,
          created_at: Date.now() / 1000,
          sort_order: prev.length,
          count: 0,
        }])
      } else if (modal?.type === 'edit') {
        const res = await fetch(`/api/categories/${modal.item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, parent_id: parentId || null }),
        })
        if (!res.ok) { setMsg('保存失败'); return }
        setCats(prev => prev.map(c =>
          c.id === modal.item.id
            ? { ...c, name, description: description || null, parent_id: parentId || null }
            : c
        ))
      }
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    // also delete children
    const childIds = cats.filter(c => c.parent_id === id).map(c => c.id)
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    for (const cid of childIds) {
      await fetch(`/api/categories/${cid}`, { method: 'DELETE' })
    }
    setCats(prev => prev.filter(c => c.id !== id && c.parent_id !== id))
    setDelId(null)
  }

  async function moveItem(id: string, direction: 'up' | 'down') {
    const cat = cats.find(c => c.id === id)!
    const siblings = cats
      .filter(c => c.parent_id === cat.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order)
    const idx = siblings.findIndex(c => c.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= siblings.length) return

    const newSiblings = [...siblings]
    ;[newSiblings[idx], newSiblings[swapIdx]] = [newSiblings[swapIdx], newSiblings[idx]]
    const updated = newSiblings.map((c, i) => ({ ...c, sort_order: i }))

    setCats(prev => prev.map(c => {
      const u = updated.find(u => u.id === c.id)
      return u ? { ...c, sort_order: u.sort_order } : c
    }))

    setSortSaving(true)
    try {
      await fetch('/api/categories/sort', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: updated.map(c => ({ id: c.id, sort_order: c.sort_order })) }),
      })
    } finally {
      setSortSaving(false)
    }
  }

  const delTarget = delId ? cats.find(c => c.id === delId) : null
  const delChildren = delId ? cats.filter(c => c.parent_id === delId) : []

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 1160, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#18181b', letterSpacing: '-0.02em', margin: 0 }}>分类管理</h1>
          <p style={{ fontSize: '13px', color: '#71717a', margin: '4px 0 0' }}>
            {cats.length} 个分类
            {sortSaving && <span style={{ marginLeft: '8px', color: '#a1a1aa' }}>保存排序…</span>}
          </p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
          background: '#18181b', color: '#fff', border: 'none', borderRadius: '8px',
          fontSize: '13px', fontWeight: 500, cursor: 'pointer',
        }}>
          <PlusIcon size={14} />新建分类
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <TabBar
          tabs={[{ key: 'post', label: '文章分类' }, { key: 'page', label: '页面分类' }]}
          active={tab}
          onChange={k => setTab(k as 'post' | 'page')}
        />
      </div>

      {tree.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#a1a1aa', border: '1px dashed #e4e4e7', borderRadius: '12px' }}>
          <p style={{ fontSize: '14px', margin: 0 }}>还没有分类</p>
          <p style={{ fontSize: '12px', marginTop: '6px' }}>点击「新建分类」开始</p>
        </div>
      ) : (
        <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
          {tree.map(({ cat, depth }, i) => {
            const siblings = cats
              .filter(c => c.parent_id === cat.parent_id)
              .sort((a, b) => a.sort_order - b.sort_order)
            const sibIdx = siblings.findIndex(c => c.id === cat.id)
            const isFirst = sibIdx === 0
            const isLast = sibIdx === siblings.length - 1

            return (
              <div key={cat.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 16px',
                borderBottom: i < tree.length - 1 ? '1px solid #f4f4f5' : 'none',
                background: depth === 1 ? '#fafafa' : '#fff',
              }}>
                {/* depth indent */}
                {depth === 1 && (
                  <div style={{ width: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: '#d4d4d8' }}>
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                      <path d="M2 0 L2 7 L10 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                )}

                {/* Sort controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                  <button onClick={() => moveItem(cat.id, 'up')} disabled={isFirst} title="上移" style={{
                    padding: '3px 4px', border: '1px solid #e4e4e7', borderRadius: '4px',
                    background: '#fff', cursor: isFirst ? 'default' : 'pointer',
                    color: isFirst ? '#d4d4d8' : '#71717a', lineHeight: 0,
                  }}>
                    <ChevronUpIcon />
                  </button>
                  <button onClick={() => moveItem(cat.id, 'down')} disabled={isLast} title="下移" style={{
                    padding: '3px 4px', border: '1px solid #e4e4e7', borderRadius: '4px',
                    background: '#fff', cursor: isLast ? 'default' : 'pointer',
                    color: isLast ? '#d4d4d8' : '#71717a', lineHeight: 0,
                  }}>
                    <ChevronDownIcon />
                  </button>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: depth === 0 ? 500 : 400, color: '#18181b' }}>{cat.name}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 500,
                      color: cat.count > 0 ? '#6366f1' : '#a1a1aa',
                      background: cat.count > 0 ? '#eef2ff' : '#f4f4f5',
                      padding: '1px 7px', borderRadius: '99px',
                    }}>
                      {cat.count} 篇
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>
                    /{cat.slug}{cat.description ? ` · ${cat.description}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => openEdit(cat)} style={{
                    padding: '5px 8px', border: '1px solid #e4e4e7', borderRadius: '6px',
                    background: '#fff', cursor: 'pointer', color: '#71717a', lineHeight: 0,
                  }}>
                    <EditIcon size={13} />
                  </button>
                  <button onClick={() => setDelId(cat.id)} style={{
                    padding: '5px 8px', border: '1px solid #fecaca', borderRadius: '6px',
                    background: '#fff', cursor: 'pointer', color: '#ef4444', lineHeight: 0,
                  }}>
                    <TrashIcon size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      {modal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#18181b', margin: '0 0 18px' }}>
              {modal.type === 'create' ? '新建分类' : '编辑分类'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>名称 *</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="分类名称"
                  onKeyDown={e => e.key === 'Enter' && handleSave()} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>描述</label>
                <input value={description} onChange={e => setDescription(e.target.value)} style={inp} placeholder="可选" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '5px' }}>父级分类</label>
                <select value={parentId} onChange={e => setParentId(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">无（顶级）</option>
                  {topLevel
                    .filter(c => modal.type === 'edit' ? c.id !== modal.item.id : true)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <p style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>最多支持两级层级</p>
              </div>
            </div>
            {msg && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '10px' }}>{msg}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#374151' }}>取消</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', background: '#18181b', color: '#fff', fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete confirm */}
      {delId && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setDelId(null) }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#18181b', margin: '0 0 8px' }}>删除分类</h2>
            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 4px' }}>
              删除后文章的分类关联也会移除，不可恢复。
            </p>
            {delChildren.length > 0 && (
              <p style={{ fontSize: '13px', color: '#ef4444', margin: '0 0 16px' }}>
                该分类下有 {delChildren.length} 个子分类，也将一并删除。
              </p>
            )}
            {!delChildren.length && <div style={{ marginBottom: '16px' }} />}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDelId(null)} style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#374151' }}>取消</button>
              <button onClick={() => handleDelete(delId)} style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                删除{delChildren.length > 0 ? `（含 ${delChildren.length} 个子分类）` : ''}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
