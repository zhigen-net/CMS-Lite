'use client'

import { useRef, useState, useEffect } from 'react'
import { ImageIcon } from '@/components/icons'

interface Props {
  content: string
  onChange: (md: string) => void
}

type MediaItem = { id: string; url: string; filename: string; mime_type: string }

type Btn = {
  label: string
  title: string
  action: (ta: HTMLTextAreaElement, onChange: (v: string) => void) => void
}

function wrap(ta: HTMLTextAreaElement, onChange: (v: string) => void, before: string, after: string, placeholder: string) {
  const { selectionStart: s, selectionEnd: e, value } = ta
  const selected = value.slice(s, e) || placeholder
  const newVal = value.slice(0, s) + before + selected + after + value.slice(e)
  onChange(newVal)
  setTimeout(() => {
    ta.focus()
    ta.setSelectionRange(s + before.length, s + before.length + selected.length)
  }, 0)
}

function insertLine(ta: HTMLTextAreaElement, onChange: (v: string) => void, prefix: string) {
  const { selectionStart: s, value } = ta
  const lineStart = value.lastIndexOf('\n', s - 1) + 1
  const lineEnd = value.indexOf('\n', s)
  const end = lineEnd === -1 ? value.length : lineEnd
  const line = value.slice(lineStart, end)
  const already = line.startsWith(prefix)
  const newLine = already ? line.slice(prefix.length) : prefix + line
  const newVal = value.slice(0, lineStart) + newLine + value.slice(end)
  onChange(newVal)
  setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + newLine.length, lineStart + newLine.length) }, 0)
}

const BTNS: Btn[] = [
  { label: 'B',   title: '粗体 (Ctrl+B)',   action: (ta, cb) => wrap(ta, cb, '**', '**', '粗体文字') },
  { label: 'I',   title: '斜体 (Ctrl+I)',   action: (ta, cb) => wrap(ta, cb, '*', '*', '斜体文字') },
  { label: 'S',   title: '删除线',           action: (ta, cb) => wrap(ta, cb, '~~', '~~', '删除文字') },
  { label: 'H1',  title: '标题 1',          action: (ta, cb) => insertLine(ta, cb, '# ') },
  { label: 'H2',  title: '标题 2',          action: (ta, cb) => insertLine(ta, cb, '## ') },
  { label: 'H3',  title: '标题 3',          action: (ta, cb) => insertLine(ta, cb, '### ') },
  { label: '`',   title: '行内代码',         action: (ta, cb) => wrap(ta, cb, '`', '`', '代码') },
  { label: '```', title: '代码块',           action: (ta, cb) => wrap(ta, cb, '```\n', '\n```', '代码') },
  { label: '•—',  title: '无序列表',         action: (ta, cb) => insertLine(ta, cb, '- ') },
  { label: '1.',  title: '有序列表',         action: (ta, cb) => insertLine(ta, cb, '1. ') },
  { label: '" "', title: '引用',            action: (ta, cb) => insertLine(ta, cb, '> ') },
  { label: '—',   title: '分割线',          action: (ta, cb) => {
    const { selectionStart: s, value } = ta
    const ins = '\n---\n'
    const newVal = value.slice(0, s) + ins + value.slice(s)
    cb(newVal)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + ins.length, s + ins.length) }, 0)
  }},
]

export default function RichEditor({ content, onChange }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null)

  const [imgPickerOpen, setImgPickerOpen] = useState(false)
  const [imgMedia, setImgMedia] = useState<MediaItem[]>([])
  const [imgLoading, setImgLoading] = useState(false)
  const [imgUploading, setImgUploading] = useState(false)
  const imgInputRef = useRef<HTMLInputElement>(null)

  const [formPickerOpen, setFormPickerOpen] = useState(false)
  const [formList, setFormList] = useState<{ id: string; name: string; slug: string }[]>([])
  const [formLoading, setFormLoading] = useState(false)

  // Auto-grow textarea
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.max(400, ta.scrollHeight) + 'px'
  }, [content])

  async function openImgPicker() {
    setImgPickerOpen(true)
    if (imgMedia.length > 0) return
    setImgLoading(true)
    try {
      const res = await fetch('/api/media?page=1')
      if (res.ok) {
        const d = await res.json() as { items: MediaItem[] }
        setImgMedia(d.items.filter(m => m.mime_type.startsWith('image/')))
      }
    } finally { setImgLoading(false) }
  }

  async function openFormPicker() {
    setFormPickerOpen(true)
    if (formList.length > 0) return
    setFormLoading(true)
    try {
      const res = await fetch('/api/forms')
      if (res.ok) setFormList(await res.json() as { id: string; name: string; slug: string }[])
    } finally { setFormLoading(false) }
  }

  function insertFormShortcode(slug: string) {
    const ta = taRef.current
    if (!ta) return
    const s = ta.selectionStart
    const ins = `\n\n[form:${slug}]\n\n`
    onChange(content.slice(0, s) + ins + content.slice(s))
    setFormPickerOpen(false)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + ins.length, s + ins.length) }, 0)
  }

  function insertImageMd(url: string, filename = 'image') {
    const ta = taRef.current
    if (!ta) return
    const s = ta.selectionStart
    const ins = `![${filename}](${url})`
    const newVal = content.slice(0, s) + ins + content.slice(s)
    onChange(newVal)
    setImgPickerOpen(false)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + ins.length, s + ins.length) }, 0)
  }

  async function handleImgUpload(file: File) {
    setImgUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/media', { method: 'POST', body: fd })
      if (res.ok) {
        const d = await res.json() as { url: string; id: string; filename: string; mime_type: string }
        setImgMedia(prev => [d, ...prev])
        insertImageMd(d.url, d.filename)
      }
    } finally { setImgUploading(false) }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); wrap(ta, onChange, '**', '**', '粗体文字') }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); wrap(ta, onChange, '*', '*', '斜体文字') }
    if (e.key === 'Tab') {
      e.preventDefault()
      const { selectionStart: s, selectionEnd: en } = ta
      const newVal = content.slice(0, s) + '  ' + content.slice(en)
      onChange(newVal)
      setTimeout(() => { ta.focus(); ta.setSelectionRange(s + 2, s + 2) }, 0)
    }
  }

  const btnStyle: React.CSSProperties = {
    padding: '4px 8px', fontSize: '12px', fontFamily: 'monospace',
    borderRadius: '5px', border: 'none', cursor: 'pointer',
    background: 'transparent', color: '#52525b', transition: 'background 0.1s',
    flexShrink: 0,
  }

  return (
    <div style={{ border: '1px solid #e4e4e7', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>

      {/* Image picker modal */}
      {imgPickerOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setImgPickerOpen(false)}>
          <div style={{
            background: '#fff', borderRadius: '14px',
            width: '100%', maxWidth: '600px', maxHeight: '80vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e4e4e7' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#18181b' }}>插入图片</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImgUpload(file)
                    e.target.value = ''
                  }}
                />
                <button
                  onClick={() => imgInputRef.current?.click()}
                  disabled={imgUploading}
                  style={{ fontSize: '12px', padding: '5px 10px', border: '1px solid #e4e4e7', borderRadius: '6px', background: '#fff', color: '#52525b', cursor: imgUploading ? 'not-allowed' : 'pointer', opacity: imgUploading ? 0.6 : 1 }}
                >
                  {imgUploading ? '上传中…' : '上传新图片'}
                </button>
                <button onClick={() => setImgPickerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: '18px', lineHeight: 1, padding: '2px 6px' }}>×</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
              {imgLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#a1a1aa', fontSize: '13px' }}>加载中…</div>
              ) : imgMedia.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#a1a1aa', fontSize: '13px' }}>
                  <p style={{ marginBottom: '12px' }}>媒体库暂无图片</p>
                  <button onClick={() => imgInputRef.current?.click()} style={{ fontSize: '12px', padding: '6px 14px', border: '1px solid #e4e4e7', borderRadius: '7px', background: '#fff', color: '#52525b', cursor: 'pointer' }}>上传图片</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                  {imgMedia.map(m => (
                    <div
                      key={m.id}
                      onClick={() => insertImageMd(m.url, m.filename)}
                      title={m.filename}
                      style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '2px solid #e4e4e7', transition: 'border-color 0.1s, transform 0.1s' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#18181b'; el.style.transform = 'scale(1.02)' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e4e4e7'; el.style.transform = 'scale(1)' }}
                    >
                      <img src={m.url} alt={m.filename} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '8px', borderBottom: '1px solid #e4e4e7', background: '#fafafa' }}>
        {BTNS.map(btn => (
          <button
            key={btn.label}
            type="button"
            title={btn.title}
            onClick={() => taRef.current && btn.action(taRef.current, onChange)}
            style={btnStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f4f4f5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            {btn.label}
          </button>
        ))}

        <div style={{ width: '1px', height: '16px', background: '#e4e4e7', margin: '0 2px', alignSelf: 'center' }} />
        <button
          type="button"
          title="插入图片"
          onClick={openImgPicker}
          style={{ ...btnStyle, display: 'flex', alignItems: 'center', padding: '4px 6px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f4f4f5' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <ImageIcon size={14} strokeWidth={1.75} />
        </button>

        <div style={{ width: '1px', height: '16px', background: '#e4e4e7', margin: '0 2px', alignSelf: 'center' }} />
        <button
          type="button"
          title="插入表单"
          onClick={openFormPicker}
          style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '11px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f4f4f5' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          📋 表单
        </button>
      </div>

      {/* Form picker modal */}
      {formPickerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setFormPickerOpen(false) }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '420px', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#18181b' }}>选择要嵌入的表单</span>
              <button onClick={() => setFormPickerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#71717a' }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '0.75rem' }}>
              {formLoading && <p style={{ textAlign: 'center', color: '#71717a', padding: '2rem', fontSize: '0.875rem' }}>加载中…</p>}
              {!formLoading && formList.length === 0 && (
                <p style={{ textAlign: 'center', color: '#71717a', padding: '2rem', fontSize: '0.875rem' }}>暂无表单，请先在「表单」页面创建</p>
              )}
              {formList.map(form => (
                <button key={form.id} onClick={() => insertFormShortcode(form.slug)}
                  style={{ display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e4e4e7', background: '#fff', cursor: 'pointer', marginBottom: '0.5rem', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2563eb' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e4e4e7' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#18181b', marginBottom: '0.2rem' }}>{form.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#71717a', fontFamily: 'monospace' }}>[form:{form.slug}]</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Markdown textarea */}
      <textarea
        ref={taRef}
        value={content}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="开始写作… 支持 Markdown 格式"
        style={{
          display: 'block', width: '100%', minHeight: '400px',
          padding: '20px 24px', boxSizing: 'border-box',
          fontSize: '14px', lineHeight: '1.8',
          fontFamily: '"SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", monospace',
          color: '#18181b', background: '#fff',
          border: 'none', outline: 'none', resize: 'vertical',
          overflowY: 'hidden',
          tabSize: 2,
        }}
      />
    </div>
  )
}
