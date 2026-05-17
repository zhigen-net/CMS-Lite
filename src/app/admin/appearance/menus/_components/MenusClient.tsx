'use client'

import { useState, useEffect } from 'react'
import type { NavItem } from '@/types'
import { CheckIcon } from '@/components/icons'
import { TabBar } from '@/components/TabBar'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

interface Props {
  initialMain: NavItem[]
  initialFooter: NavItem[]
}

interface EditingItem {
  id: string
  label: string
  url: string
  target: '_blank' | '_self'
}

const emptyEdit = (): EditingItem => ({ id: '', label: '', url: '', target: '_self' })

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', fontSize: '13px',
  border: '1px solid #e4e4e7', borderRadius: '7px',
  background: '#fff', color: '#18181b', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

export default function MenusClient({ initialMain, initialFooter }: Props) {
  const [activeTab, setActiveTab] = useState<'main' | 'footer'>('main')
  const [mainItems, setMainItems] = useState<NavItem[]>(initialMain)
  const [footerItems, setFooterItems] = useState<NavItem[]>(initialFooter)
  const [editing, setEditing] = useState<EditingItem | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saveError, setSaveError] = useState('')

  const items = activeTab === 'main' ? mainItems : footerItems
  const setItems = activeTab === 'main' ? setMainItems : setFooterItems

  function markDirty() { setDirty(true); setSaved(false) }  // kept for potential future use

  function move(index: number, dir: -1 | 1) {
    const next = [...items]
    const target = index + dir
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    const newMain = activeTab === 'main' ? next : mainItems
    const newFooter = activeTab === 'footer' ? next : footerItems
    saveToDb(newMain, newFooter)
  }

  function remove(id: string) {
    const next = items.filter(i => i.id !== id)
    setItems(next)
    const newMain = activeTab === 'main' ? next : mainItems
    const newFooter = activeTab === 'footer' ? next : footerItems
    saveToDb(newMain, newFooter)
  }

  function startEdit(item: NavItem) {
    setEditing({ id: item.id, label: item.label, url: item.url, target: item.target ?? '_self' })
    setAddingNew(false)
  }

  function startAdd() {
    setEditing(emptyEdit())
    setAddingNew(true)
  }

  function cancelEdit() { setEditing(null); setAddingNew(false) }

  async function saveToDb(newMain: NavItem[], newFooter: NavItem[]) {
    setSaving(true); setSaveError('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'nav.main': newMain, 'nav.footer': newFooter }),
      })
      if (res.ok) {
        setSaved(true); setDirty(false)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const d = await res.json() as { error?: string }
        setSaveError(d.error || `保存失败 (${res.status})`)
      }
    } catch {
      setSaveError('网络错误，请重试')
    } finally { setSaving(false) }
  }

  function saveEdit() {
    if (!editing) return
    if (!editing.label.trim() || !editing.url.trim()) return
    let newMain = mainItems
    let newFooter = footerItems
    if (addingNew) {
      const newItem = { id: generateId(), label: editing.label.trim(), url: editing.url.trim(), target: editing.target }
      if (activeTab === 'main') newMain = [...mainItems, newItem]
      else newFooter = [...footerItems, newItem]
    } else {
      const update = (list: NavItem[]) => list.map(i => i.id === editing.id
        ? { ...i, label: editing.label.trim(), url: editing.url.trim(), target: editing.target }
        : i
      )
      if (activeTab === 'main') newMain = update(mainItems)
      else newFooter = update(footerItems)
    }
    setMainItems(newMain); setFooterItems(newFooter)
    setEditing(null); setAddingNew(false)
    saveToDb(newMain, newFooter)
  }

  async function handleSave() {
    saveToDb(mainItems, footerItems)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Tabs + Save */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <TabBar
          tabs={[{ key: 'main', label: '主导航' }, { key: 'footer', label: '页脚导航' }]}
          active={activeTab}
          onChange={tab => { setActiveTab(tab as 'main' | 'footer'); setEditing(null); setAddingNew(false) }}
        />
        {saveError && <span style={{ fontSize: '12px', color: '#ef4444' }}>{saveError}</span>}
        <button onClick={handleSave} disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 18px', borderRadius: '7px', border: 'none',
            background: saved ? '#10b981' : '#18181b',
            color: '#fff', fontWeight: 600, fontSize: '13px',
            cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
          }}>
          {saved && <CheckIcon size={13} />}
          {saving ? '保存中…' : saved ? '已保存' : '保存'}
        </button>
      </div>

      {/* Menu list */}
      <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
        {items.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa', fontSize: '13px' }}>
            暂无菜单项，点击下方添加
          </div>
        ) : (
          <div>
            {items.map((item, index) => (
              <div key={item.id}>
                {editing && editing.id === item.id ? (
                  <EditForm editing={editing} setEditing={setEditing} onSave={saveEdit} onCancel={cancelEdit} />
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px',
                    borderBottom: index < items.length - 1 ? '1px solid #f4f4f5' : 'none',
                  }}>
                    {/* Reorder */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
                      <button onClick={() => move(index, -1)} disabled={index === 0}
                        style={{ ...arrowBtn, opacity: index === 0 ? 0.25 : 1 }}>▲</button>
                      <button onClick={() => move(index, 1)} disabled={index === items.length - 1}
                        style={{ ...arrowBtn, opacity: index === items.length - 1 ? 0.25 : 1 }}>▼</button>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.url}
                        {item.target === '_blank' && <span style={{ marginLeft: '6px', color: '#a1a1aa' }}>新标签</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => startEdit(item)} style={actionBtn}>编辑</button>
                      <button onClick={() => remove(item.id)}
                        style={{ ...actionBtn, color: '#ef4444', borderColor: '#fecaca' }}>删除</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new inline form */}
        {addingNew && editing && (
          <div style={{ borderTop: items.length > 0 ? '1px solid #f4f4f5' : 'none' }}>
            <EditForm editing={editing} setEditing={setEditing} onSave={saveEdit} onCancel={cancelEdit} isNew />
          </div>
        )}
      </div>

      {/* Add button */}
      {!addingNew && (
        <button onClick={startAdd} style={{
          width: '100%', padding: '10px', borderRadius: '8px',
          border: '1.5px dashed #e4e4e7', background: 'transparent',
          color: '#52525b', fontSize: '13px', fontWeight: 500,
          cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#a1a1aa'; (e.currentTarget as HTMLElement).style.color = '#18181b' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e4e4e7'; (e.currentTarget as HTMLElement).style.color = '#52525b' }}
        >
          + 添加菜单项
        </button>
      )}

      <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>
        修改后点击"保存"按钮生效，前台导航实时更新
      </p>
    </div>
  )
}

type PickerTab = 'page' | 'post' | 'category' | 'tag'

interface PickerItem { label: string; url: string }

const PICKER_TABS: { id: PickerTab; label: string }[] = [
  { id: 'page', label: '页面' },
  { id: 'post', label: '文章' },
  { id: 'category', label: '分类' },
  { id: 'tag', label: '标签' },
]

function InternalPicker({ onSelect }: { onSelect: (item: PickerItem) => void }) {
  const [tab, setTab] = useState<PickerTab>('page')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<PickerItem[]>([])
  const [loading, setLoading] = useState(false)

  async function load(t: PickerTab) {
    setLoading(true); setItems([])
    try {
      if (t === 'page' || t === 'post') {
        const r = await fetch(`/api/contents?type=${t}&status=published&pageSize=100`)
        const d = await r.json() as { items: { title: string; slug: string }[] }
        setItems((d.items || []).map(i => ({
          label: i.title,
          url: t === 'post' ? `/post/${i.slug}` : `/${i.slug}`,
        })))
      } else if (t === 'category') {
        const r = await fetch('/api/categories')
        const d = await r.json() as { id: string; name: string; slug: string }[]
        setItems((d || []).map(i => ({ label: i.name, url: `/category/${i.slug}` })))
      } else {
        const r = await fetch('/api/tags')
        const d = await r.json() as { id: string; name: string; slug: string }[]
        setItems((d || []).map(i => ({ label: i.name, url: `/tag/${i.slug}` })))
      }
    } catch { setItems([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load('page') }, [])

  function switchTab(t: PickerTab) { setTab(t); setSearch(''); load(t) }

  const filtered = items.filter(i =>
    !search || i.label.toLowerCase().includes(search.toLowerCase()) || i.url.includes(search)
  )

  return (
    <div style={{ border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden', background: '#fff', marginBottom: '10px' }}>
      {/* Tab bar */}
      <div style={{ padding: '6px 6px 0', background: '#fafafa', borderBottom: '1px solid #f4f4f5' }}>
        <TabBar
          tabs={PICKER_TABS.map(pt => ({ key: pt.id, label: pt.label }))}
          active={tab}
          onChange={t => switchTab(t as PickerTab)}
        />
      </div>
      {/* Search */}
      <div style={{ padding: '8px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索…" style={{ ...inputStyle, fontSize: '12px' }} />
      </div>
      {/* List */}
      <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#a1a1aa' }}>加载中…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#a1a1aa' }}>暂无内容</div>
        ) : filtered.map((item, i) => (
          <button key={i} onClick={() => onSelect(item)} style={{
            display: 'flex', width: '100%', textAlign: 'left', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 12px', border: 'none', background: 'none', cursor: 'pointer',
            borderTop: i > 0 ? '1px solid #f4f4f5' : 'none',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f4f4f5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
          >
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#18181b' }}>{item.label}</span>
            <span style={{ fontSize: '11px', color: '#a1a1aa', marginLeft: '8px', flexShrink: 0 }}>{item.url}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function EditForm({ editing, setEditing, onSave, onCancel, isNew }: {
  editing: EditingItem
  setEditing: (v: EditingItem) => void
  onSave: () => void
  onCancel: () => void
  isNew?: boolean
}) {
  const [showPicker, setShowPicker] = useState(false)
  const valid = editing.label.trim() && editing.url.trim()

  function handleSelect(item: PickerItem) {
    setEditing({ ...editing, label: editing.label || item.label, url: item.url })
    setShowPicker(false)
  }

  return (
    <div style={{ padding: '16px', background: '#fafafa', borderTop: isNew ? '1px solid #e4e4e7' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>
          {isNew ? '添加菜单项' : '编辑菜单项'}
        </span>
        <button onClick={() => setShowPicker(v => !v)} style={{
          padding: '3px 10px', fontSize: '11px', fontWeight: 500,
          border: `1px solid ${showPicker ? '#18181b' : '#e4e4e7'}`,
          borderRadius: '5px', background: showPicker ? '#18181b' : '#fff',
          color: showPicker ? '#fff' : '#52525b', cursor: 'pointer',
        }}>
          {showPicker ? '关闭选择器' : '从站内选择'}
        </button>
      </div>

      {showPicker && <InternalPicker onSelect={handleSelect} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#71717a', display: 'block', marginBottom: '4px' }}>显示名称</label>
          <input value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })}
            placeholder="首页" style={inputStyle} autoFocus={!showPicker} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#71717a', display: 'block', marginBottom: '4px' }}>链接地址</label>
          <input value={editing.url} onChange={e => setEditing({ ...editing, url: e.target.value })}
            placeholder="/" style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '11px', color: '#71717a', display: 'block', marginBottom: '4px' }}>打开方式</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['_self', '_blank'] as const).map(t => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#52525b' }}>
              <input type="radio" name="target" value={t} checked={editing.target === t}
                onChange={() => setEditing({ ...editing, target: t })} />
              {t === '_self' ? '当前标签' : '新标签页'}
            </label>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onSave} disabled={!valid} style={{
          padding: '6px 16px', borderRadius: '7px', border: 'none',
          background: valid ? '#18181b' : '#d4d4d8', color: '#fff',
          fontSize: '12px', fontWeight: 600, cursor: valid ? 'pointer' : 'not-allowed',
        }}>
          {isNew ? '添加' : '保存'}
        </button>
        <button onClick={onCancel} style={{
          padding: '6px 14px', borderRadius: '7px', border: '1px solid #e4e4e7',
          background: '#fff', color: '#52525b', fontSize: '12px', cursor: 'pointer',
        }}>
          取消
        </button>
      </div>
    </div>
  )
}

const arrowBtn: React.CSSProperties = {
  padding: '1px 5px', fontSize: '9px', border: '1px solid #e4e4e7',
  borderRadius: '4px', background: '#fff', cursor: 'pointer', lineHeight: 1.5, color: '#71717a',
}

const actionBtn: React.CSSProperties = {
  padding: '4px 10px', fontSize: '12px', fontWeight: 500,
  border: '1px solid #e4e4e7', borderRadius: '6px',
  background: '#fff', color: '#52525b', cursor: 'pointer',
}
