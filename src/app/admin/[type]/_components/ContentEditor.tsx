'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Content, ContentType, Category, Tag } from '@/types'
import { ArrowLeftIcon, SparklesIcon, SlidersIcon, XIcon } from '@/components/icons'

const RichEditor = dynamic(() => import('./RichEditor'), {
  ssr: false,
  loading: () => <div style={{ height: '360px', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e4e4e7' }} />,
})

interface Props {
  contentType: ContentType
  initialContent?: Content
}

const inputBase: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: '13px',
  border: '1px solid #e4e4e7', borderRadius: '7px',
  background: '#fff', color: '#18181b', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

const textareaBase: React.CSSProperties = { ...inputBase, resize: 'none', lineHeight: 1.6 }

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 500,
  color: '#52525b', marginBottom: '5px',
}

const mobileCSS = `
  .ce-root { display: flex; height: 100vh; overflow: hidden; background: #f9fafb; font-family: system-ui, -apple-system, sans-serif; }
  .ce-sidebar { width: 232px; flex-shrink: 0; overflow-y: auto; background: #fff; border-left: 1px solid #e4e4e7; }
  .ce-settings-btn { display: none; align-items: center; gap: 5px; }
  .ce-ai-label { }
  .ce-sidebar-close { display: none; }
  .ce-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 55; }

  @media (max-width: 767px) {
    .ce-ai-label { display: none; }
    .ce-settings-btn { display: flex !important; }
    .ce-sidebar {
      position: fixed !important;
      inset: auto 0 0 0 !important;
      width: 100% !important;
      max-height: 78vh;
      overflow-y: auto;
      border-left: none !important;
      border-top: 1px solid #e4e4e7;
      border-radius: 16px 16px 0 0;
      box-shadow: 0 -4px 32px rgba(0,0,0,0.12);
      z-index: 60;
    }
    .ce-sidebar-hidden { display: none !important; }
    .ce-sidebar-close { display: flex !important; }
    .ce-overlay-open { display: block !important; }
  }
`

export default function ContentEditor({ contentType, initialContent }: Props) {
  const router = useRouter()
  const isEdit = !!initialContent

  const [title, setTitle] = useState(initialContent?.title ?? '')
  const [slug, setSlug] = useState(initialContent?.slug ?? '')
  const [content, setContent] = useState(initialContent?.content ?? '')
  const [excerpt, setExcerpt] = useState(initialContent?.excerpt ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>((initialContent?.status as 'draft' | 'published') ?? 'draft')
  const [metaTitle, setMetaTitle] = useState(initialContent?.meta_title ?? '')
  const [metaDesc, setMetaDesc] = useState(initialContent?.meta_description ?? '')
  const [categoryIds, setCategoryIds] = useState<string[]>(
    initialContent?.categories?.map(c => c.id) ?? []
  )
  const [parentId, setParentId] = useState<string | null>(initialContent?.parent_id ?? null)
  const [sortOrder, setSortOrder] = useState<number>(initialContent?.sort_order ?? 0)
  const [availablePages, setAvailablePages] = useState<{ id: string; title: string; slug: string }[]>([])
  const [tags, setTags] = useState<string[]>(initialContent?.tags?.map(t => t.name) ?? [])
  const [tagInput, setTagInput] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPanel, setAiPanel] = useState(false)
  const [aiTab, setAiTab] = useState<'generate' | 'rewrite' | 'translate'>('generate')
  const [aiPrompt, setAiPrompt] = useState('')
  const [translateLang, setTranslateLang] = useState('en')
  const [aiImageLoading, setAiImageLoading] = useState(false)
  const [error, setError] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatParent, setNewCatParent] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [showNewCatForm, setShowNewCatForm] = useState(false)
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([])
  const [coverImage, setCoverImage] = useState<string | null>(initialContent?.cover_image ?? null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [pickerMedia, setPickerMedia] = useState<{ id: string; url: string; filename: string; mime_type: string }[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const isDirtyRef = useRef(false)
  const savedRef = useRef(false)

  const autoSlug = useCallback((t: string) =>
    t.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '').slice(0, 80), [])

  useEffect(() => {
    const fetchMeta = async () => {
      const [catRes, tagRes] = await Promise.all([
        fetch(`/api/categories?type=${contentType.id}`),
        fetch('/api/tags'),
      ])
      if (catRes.ok) setCategories(await catRes.json() as Category[])
      if (tagRes.ok) setAllTags(await tagRes.json() as Tag[])
    }
    if (contentType.has_category || contentType.has_tag) fetchMeta()
  }, [contentType.id, contentType.has_category, contentType.has_tag])

  useEffect(() => {
    if (contentType.id !== 'page') return
    fetch('/api/contents?type=page&pageSize=200')
      .then(r => r.ok ? r.json() : null)
      .then((d: unknown) => {
        const data = d as { items: { id: string; title: string; slug: string }[] } | null
        if (data?.items) setAvailablePages(data.items.filter(p => p.id !== initialContent?.id))
      })
  }, [contentType.id, initialContent?.id])

  useEffect(() => {
    if (!tagInput.trim()) { setTagSuggestions([]); return }
    const q = tagInput.toLowerCase()
    setTagSuggestions(allTags.filter(t => t.name.toLowerCase().includes(q) && !tags.includes(t.name)).slice(0, 6))
  }, [tagInput, allTags, tags])

  useEffect(() => {
    isDirtyRef.current = true
  }, [title, slug, content, excerpt, status, metaTitle, metaDesc, categoryIds, tags, coverImage, parentId, sortOrder])

  useEffect(() => {
    if (!isEdit) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirtyRef.current && !savedRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isEdit])

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!isEdit || !initialContent?.slug) setSlug(autoSlug(v))
  }

  function addTag(name: string) {
    const trimmed = name.trim()
    if (!trimmed || tags.includes(trimmed)) return
    setTags(prev => [...prev, trimmed])
    setTagInput('')
    setTagSuggestions([])
  }

  function removeTag(name: string) {
    setTags(prev => prev.filter(t => t !== name))
  }

  function toggleCategory(id: string) {
    setCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleAddCategory() {
    const trimmed = newCatName.trim()
    if (!trimmed) return
    const duplicate = categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())
    if (duplicate) { setError(`分类「${trimmed}」已存在`); return }
    setAddingCat(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          content_type: contentType.id,
          parent_id: newCatParent || undefined,
        }),
      })
      if (res.ok) {
        const cat = await res.json() as Category
        setCategories(prev => [...prev, cat])
        setCategoryIds(prev => [...prev, cat.id])
        setNewCatName('')
        setNewCatParent('')
        setShowNewCatForm(false)
      } else {
        const d = await res.json() as { error?: string }
        setError(typeof d.error === 'string' ? d.error : '分类创建失败')
      }
    } finally { setAddingCat(false) }
  }

  async function handleSave() {
    if (!title.trim()) { setError('标题不能为空'); return }
    const finalSlug = slug || autoSlug(title)
    if (finalSlug && !/^[a-z0-9\u4e00-\u9fa5][a-z0-9\u4e00-\u9fa5-]*$/.test(finalSlug)) {
      setError('URL Slug 只能包含小写字母、数字、汉字和连字符，且不能以连字符开头')
      return
    }
    setSaving(true); setError('')
    try {
      const body: Record<string, unknown> = {
        type: contentType.id, title, slug: finalSlug,
        content, excerpt, status,
        meta_title: metaTitle, meta_description: metaDesc,
        category_ids: categoryIds,
        tags,
        cover_image: coverImage ?? null,
      }
      if (contentType.id === 'page') {
        body.parent_id = parentId
        body.sort_order = sortOrder
      }
      const res = await fetch(
        isEdit ? `/api/contents/${initialContent!.id}` : '/api/contents',
        { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      )
      if (!res.ok) { const d = await res.json() as { error?: string }; setError(typeof d.error === 'string' ? d.error : '保存失败'); return }
      if (isEdit) {
        isDirtyRef.current = false
        savedRef.current = true
        setSaveSuccess(true)
        setTimeout(() => { setSaveSuccess(false); savedRef.current = false }, 2000)
      } else {
        const d = await res.json() as { id: string }
        window.location.href = `/admin/${contentType.id}/${d.id}`
      }
    } finally { setSaving(false) }
  }

  function getPreviewUrl() {
    const s = slug || autoSlug(title)
    if (contentType.id === 'page') return `/${s}`
    if (contentType.id === 'post') return `/post/${s}`
    return `/${contentType.id}/${s}`
  }

  async function handlePreview() {
    await handleSave()
    window.open(getPreviewUrl(), '_blank')
  }

  async function handleCoverUpload(file: File) {
    setCoverUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/media', { method: 'POST', body: fd })
      if (res.ok) {
        const d = await res.json() as { url: string }
        setCoverImage(d.url)
      }
    } finally { setCoverUploading(false) }
  }

  async function openCoverPicker() {
    setCoverPickerOpen(true)
    if (pickerMedia.length > 0) return
    setPickerLoading(true)
    try {
      const res = await fetch('/api/media?page=1')
      if (res.ok) {
        const d = await res.json() as { items: { id: string; url: string; filename: string; mime_type: string }[] }
        setPickerMedia(d.items.filter(m => m.mime_type.startsWith('image/')))
      }
    } finally { setPickerLoading(false) }
  }

  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: aiPrompt, type: contentType.id, length: 'medium' }) })
      if (res.ok) {
        const d = await res.json() as { id: string }
        router.push(`/admin/${contentType.id}/${d.id}`)
      } else {
        const d = await res.json() as { error?: string }
        setError(typeof d.error === 'string' ? d.error : 'AI 生成失败，请稍后重试')
      }
    } catch {
      setError('网络错误，请检查连接后重试')
    } finally { setAiLoading(false); setAiPanel(false); setAiPrompt('') }
  }

  async function handleAISEO() {
    if (!title || !content) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/seo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content }) })
      if (res.ok) {
        const d = await res.json() as { metaTitle?: string; metaDescription?: string; excerpt?: string }
        if (d.metaTitle) setMetaTitle(d.metaTitle)
        if (d.metaDescription) setMetaDesc(d.metaDescription)
        if (!excerpt && d.excerpt) setExcerpt(d.excerpt)
      } else {
        const d = await res.json() as { error?: string }
        setError(typeof d.error === 'string' ? d.error : 'AI SEO 优化失败')
      }
    } catch {
      setError('网络错误，请检查连接后重试')
    } finally { setAiLoading(false) }
  }

  async function handleAIRewrite(instruction: 'polish' | 'expand' | 'condense') {
    if (!content.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/rewrite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, instruction }) })
      if (res.ok) {
        const d = await res.json() as { content: string }
        if (d.content) setContent(d.content)
      } else {
        const d = await res.json() as { error?: string }
        setError(typeof d.error === 'string' ? d.error : 'AI 改写失败')
      }
    } catch {
      setError('网络错误，请检查连接后重试')
    } finally { setAiLoading(false) }
  }

  async function handleAITranslate() {
    if (!content.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, targetLang: translateLang }) })
      if (res.ok) {
        const d = await res.json() as { title: string; content: string }
        if (d.title) setTitle(d.title)
        if (d.content) setContent(d.content)
      } else {
        const d = await res.json() as { error?: string }
        setError(typeof d.error === 'string' ? d.error : 'AI 翻译失败')
      }
    } catch {
      setError('网络错误，请检查连接后重试')
    } finally { setAiLoading(false) }
  }

  async function handleAIImage() {
    const prompt = title || aiPrompt
    if (!prompt.trim()) return
    setAiImageLoading(true)
    try {
      const imagePrompt = `A high quality professional blog cover image for an article titled: "${prompt}". Clean, modern, suitable for a tech/content website.`
      const res = await fetch('/api/ai/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: imagePrompt }) })
      if (res.ok) {
        const d = await res.json() as { url: string }
        if (d.url) setCoverImage(d.url)
      }
    } finally { setAiImageLoading(false) }
  }

  const wordCount = content.replace(/<[^>]*>/g, '').length
  const readTime = Math.max(1, Math.round(wordCount / 300))

  return (
    <div className="ce-root">
      <style>{mobileCSS}</style>

      {/* Mobile sidebar overlay */}
      <div
        className={`ce-overlay${mobileSidebarOpen ? ' ce-overlay-open' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Main editing area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', height: '52px', flexShrink: 0,
          background: '#fff', borderBottom: '1px solid #e4e4e7', gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <button onClick={() => router.back()} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '5px 8px', border: 'none', background: 'none',
              cursor: 'pointer', color: '#71717a', fontSize: '13px', borderRadius: '6px', flexShrink: 0,
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f4f4f5'; el.style.color = '#18181b' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'none'; el.style.color = '#71717a' }}
            >
              <ArrowLeftIcon size={14} />返回
            </button>
            <div style={{ width: '1px', height: '16px', background: '#e4e4e7', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isEdit ? `编辑${contentType.name}` : `新建${contentType.name}`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {saveSuccess && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 500 }}>已保存 ✓</span>}
            {error && <span style={{ fontSize: '12px', color: '#ef4444', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={error}>{error}</span>}
            <button onClick={() => setAiPanel(!aiPanel)} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '6px 10px', fontSize: '13px', fontWeight: 500,
              border: '1px solid #e4e4e7', borderRadius: '7px',
              background: aiPanel ? '#f4f4f5' : '#fff', color: '#52525b', cursor: 'pointer',
            }}>
              <SparklesIcon size={13} />
              <span className="ce-ai-label">AI 助手</span>
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '6px 12px', fontSize: '13px', fontWeight: 500,
              border: '1px solid #e4e4e7', borderRadius: '7px',
              background: '#fff', color: '#52525b', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}>{saving ? '保存中…' : '保存'}</button>
            <button onClick={handlePreview} disabled={saving} style={{
              padding: '6px 12px', fontSize: '13px', fontWeight: 500,
              border: 'none', borderRadius: '7px',
              background: '#18181b', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}>预览</button>
            <button className="ce-settings-btn" onClick={() => setMobileSidebarOpen(o => !o)} style={{
              padding: '6px 10px', fontSize: '13px', fontWeight: 500,
              border: '1px solid #e4e4e7', borderRadius: '7px',
              background: mobileSidebarOpen ? '#f4f4f5' : '#fff', color: '#52525b', cursor: 'pointer',
            }}>
              <SlidersIcon size={13} />设置
            </button>
          </div>
        </div>

        {/* AI Panel */}
        {aiPanel && (
          <div style={{ margin: '12px 16px 0', background: '#fff', border: '1px solid #e4e4e7', borderRadius: '10px', flexShrink: 0, overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e4e4e7', background: '#fafafa' }}>
              {([['generate', '生成'], ['rewrite', '改写'], ['translate', '翻译']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setAiTab(tab)} style={{
                  padding: '8px 14px', fontSize: '12px', fontWeight: aiTab === tab ? 600 : 400,
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: aiTab === tab ? '#18181b' : '#71717a',
                  borderBottom: aiTab === tab ? '2px solid #18181b' : '2px solid transparent',
                  marginBottom: '-1px', transition: 'color 0.1s',
                }}>{label}</button>
              ))}
            </div>

            <div style={{ padding: '12px 14px' }}>
              {/* 生成 tab */}
              {aiTab === 'generate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAIGenerate()} placeholder="输入主题，AI 帮你生成完整文章…" style={{ ...inputBase, flex: 1, minWidth: '160px' }} />
                    <button onClick={handleAIGenerate} disabled={aiLoading || !aiPrompt.trim()} style={{ padding: '7px 12px', fontSize: '13px', fontWeight: 500, border: 'none', borderRadius: '7px', background: '#18181b', color: '#fff', cursor: aiLoading || !aiPrompt.trim() ? 'not-allowed' : 'pointer', opacity: aiLoading || !aiPrompt.trim() ? 0.5 : 1 }}>
                      {aiLoading ? '生成中…' : '生成文章'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={handleAIImage} disabled={aiImageLoading || (!title.trim() && !aiPrompt.trim())} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, border: '1px solid #e4e4e7', borderRadius: '7px', background: '#fff', color: '#52525b', cursor: aiImageLoading || (!title.trim() && !aiPrompt.trim()) ? 'not-allowed' : 'pointer', opacity: aiImageLoading || (!title.trim() && !aiPrompt.trim()) ? 0.5 : 1 }}>
                      {aiImageLoading ? '生成中…' : '✦ AI 生成封面图'}
                    </button>
                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>根据文章标题自动生成</span>
                  </div>
                </div>
              )}

              {/* 改写 tab */}
              {aiTab === 'rewrite' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>对当前编辑器中的内容进行 AI 改写</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {([['polish', '润色', '提升语言质量和流畅度'], ['expand', '扩写', '补充细节，丰富内容'], ['condense', '精简', '压缩至原文 60%']] as const).map(([inst, label, tip]) => (
                      <button key={inst} onClick={() => handleAIRewrite(inst)} disabled={aiLoading || !content.trim()} title={tip} style={{
                        padding: '7px 16px', fontSize: '13px', fontWeight: 500,
                        border: '1px solid #e4e4e7', borderRadius: '7px',
                        background: '#fff', color: '#18181b',
                        cursor: aiLoading || !content.trim() ? 'not-allowed' : 'pointer',
                        opacity: aiLoading || !content.trim() ? 0.5 : 1,
                        transition: 'background 0.1s',
                      }}
                        onMouseEnter={e => { if (!aiLoading && content.trim()) (e.currentTarget as HTMLElement).style.background = '#f4f4f5' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
                      >
                        {aiLoading ? '处理中…' : label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 翻译 tab */}
              {aiTab === 'translate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>将当前文章标题和内容翻译为目标语言（会替换当前内容）</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={translateLang} onChange={e => setTranslateLang(e.target.value)} style={{ ...inputBase, width: 'auto', flex: 1, minWidth: '120px', cursor: 'pointer' }}>
                      <option value="en">英文</option>
                      <option value="ja">日文</option>
                      <option value="ko">韩文</option>
                      <option value="fr">法文</option>
                      <option value="de">德文</option>
                      <option value="es">西班牙文</option>
                    </select>
                    <button onClick={handleAITranslate} disabled={aiLoading || !content.trim()} style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 500, border: 'none', borderRadius: '7px', background: '#18181b', color: '#fff', cursor: aiLoading || !content.trim() ? 'not-allowed' : 'pointer', opacity: aiLoading || !content.trim() ? 0.5 : 1 }}>
                      {aiLoading ? '翻译中…' : '开始翻译'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder={`${contentType.name}标题`} style={{ width: '100%', fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700, border: 'none', outline: 'none', background: 'transparent', color: '#18181b', fontFamily: 'system-ui, sans-serif', marginBottom: '8px', boxSizing: 'border-box', letterSpacing: '-0.02em' }} />
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>/{contentType.id === 'page' ? '' : contentType.id + '/'}</span>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="url-slug" style={{ fontSize: '12px', color: '#a1a1aa', background: 'transparent', border: 'none', outline: 'none', minWidth: '100px', fontFamily: 'monospace' }} />
          </div>
          <RichEditor content={content} onChange={setContent} />
        </div>
      </div>

      {/* Right sidebar */}
      <aside className={`ce-sidebar${mobileSidebarOpen ? '' : ' ce-sidebar-hidden'}`}>
        {/* Mobile close button */}
        <div className="ce-sidebar-close" style={{ padding: '12px 16px', borderBottom: '1px solid #f4f4f5', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>文章设置</span>
          <button onClick={() => setMobileSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', lineHeight: 0, padding: '4px' }}>
            <XIcon size={16} />
          </button>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Publish status */}
          <div>
            <p style={{ ...labelStyle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>发布状态</p>
            <div style={{ display: 'flex', borderRadius: '8px', border: '1px solid #e4e4e7', overflow: 'hidden' }}>
              {(['draft', 'published'] as const).map((s, i) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    flex: 1, padding: '7px 0', fontSize: '12px', fontWeight: 500,
                    border: 'none',
                    borderLeft: i > 0 ? '1px solid #e4e4e7' : 'none',
                    background: status === s ? (s === 'published' ? '#18181b' : '#f4f4f5') : '#fff',
                    color: status === s ? (s === 'published' ? '#fff' : '#18181b') : '#71717a',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {s === 'draft' ? '草稿' : '已发布'}
                </button>
              ))}
            </div>
            {status === 'published' && (
              <p style={{ fontSize: '11px', color: '#10b981', marginTop: '5px' }}>保存后将对外公开显示</p>
            )}
          </div>

          <div style={{ height: '1px', background: '#f4f4f5' }} />

          {/* Cover image */}
          <div>
            <p style={{ ...labelStyle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>封面图</p>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleCoverUpload(file)
                e.target.value = ''
              }}
            />

            {/* Media picker modal */}
            {coverPickerOpen && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
              }} onClick={() => setCoverPickerOpen(false)}>
                <div style={{
                  background: '#fff', borderRadius: '14px',
                  width: '100%', maxWidth: '560px', maxHeight: '80vh',
                  display: 'flex', flexDirection: 'column',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e4e4e7' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#18181b' }}>从媒体库选择</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => { setCoverPickerOpen(false); coverInputRef.current?.click() }}
                        style={{ fontSize: '12px', padding: '5px 10px', border: '1px solid #e4e4e7', borderRadius: '6px', background: '#fff', color: '#52525b', cursor: 'pointer' }}
                      >
                        上传新图片
                      </button>
                      <button onClick={() => setCoverPickerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', lineHeight: 0, padding: '4px' }}>
                        <XIcon size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
                    {pickerLoading ? (
                      <div style={{ textAlign: 'center', padding: '3rem 0', color: '#a1a1aa', fontSize: '13px' }}>加载中…</div>
                    ) : pickerMedia.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem 0', color: '#a1a1aa', fontSize: '13px' }}>
                        <p style={{ marginBottom: '12px' }}>媒体库暂无图片</p>
                        <button
                          onClick={() => { setCoverPickerOpen(false); coverInputRef.current?.click() }}
                          style={{ fontSize: '12px', padding: '6px 14px', border: '1px solid #e4e4e7', borderRadius: '7px', background: '#fff', color: '#52525b', cursor: 'pointer' }}
                        >
                          上传图片
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                        {pickerMedia.map(m => (
                          <div
                            key={m.id}
                            onClick={() => { setCoverImage(m.url); setCoverPickerOpen(false) }}
                            style={{
                              aspectRatio: '1', borderRadius: '8px', overflow: 'hidden',
                              cursor: 'pointer', border: '2px solid #e4e4e7',
                              transition: 'border-color 0.1s, transform 0.1s',
                            }}
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

            {coverImage ? (
              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e4e4e7' }}>
                <img src={coverImage} alt="封面图" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.45)'; Array.from((e.currentTarget as HTMLElement).children).forEach(c => ((c as HTMLElement).style.opacity = '1')) }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0)'; Array.from((e.currentTarget as HTMLElement).children).forEach(c => ((c as HTMLElement).style.opacity = '0')) }}
                >
                  <button onClick={openCoverPicker} style={{ opacity: 0, transition: 'opacity 0.15s', padding: '5px 10px', fontSize: '11px', fontWeight: 600, background: '#fff', color: '#18181b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>更换</button>
                  <button onClick={() => setCoverImage(null)} style={{ opacity: 0, transition: 'opacity 0.15s', padding: '5px 10px', fontSize: '11px', fontWeight: 600, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>移除</button>
                </div>
              </div>
            ) : (
              <button
                onClick={openCoverPicker}
                disabled={coverUploading}
                style={{
                  width: '100%', aspectRatio: '16/9',
                  border: '1.5px dashed #d4d4d8', borderRadius: '8px',
                  background: coverUploading ? '#f9fafb' : '#fff',
                  cursor: coverUploading ? 'not-allowed' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', color: '#a1a1aa', transition: 'border-color 0.15s, background 0.15s',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => { if (!coverUploading) { (e.currentTarget as HTMLElement).style.borderColor = '#71717a'; (e.currentTarget as HTMLElement).style.background = '#f9fafb' } }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d4d4d8'; (e.currentTarget as HTMLElement).style.background = '#fff' }}
              >
                {coverUploading ? <span style={{ fontSize: '12px' }}>上传中…</span> : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span style={{ fontSize: '11px' }}>选择或上传封面图</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div style={{ height: '1px', background: '#f4f4f5' }} />

          {/* 页面层级（page 专用） */}
          {contentType.id === 'page' && (
            <div>
              <label style={labelStyle}>父页面</label>
              <select
                value={parentId ?? ''}
                onChange={e => setParentId(e.target.value || null)}
                style={{ ...inputBase, appearance: 'auto' }}
              >
                <option value="">（无，顶级页面）</option>
                {availablePages.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <div style={{ marginTop: '8px' }}>
                <label style={{ ...labelStyle, marginBottom: '4px' }}>排序（数字越小越靠前）</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={e => setSortOrder(Number(e.target.value))}
                  min={0}
                  style={{ ...inputBase, width: '80px' }}
                />
              </div>
            </div>
          )}

          {/* Category — WordPress 风格多选复选框 */}
          {contentType.has_category && (
            <div>
              <label style={labelStyle}>分类</label>

              {/* 复选框列表（支持层级缩进） */}
              {categories.length > 0 ? (
                <div style={{
                  border: '1px solid #e4e4e7', borderRadius: '7px',
                  maxHeight: '160px', overflowY: 'auto',
                  background: '#fff',
                }}>
                  {/* 顶级分类 */}
                  {categories.filter(c => !c.parent_id).map(parent => (
                    <div key={parent.id}>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '6px 10px', cursor: 'pointer',
                        borderBottom: '1px solid #f4f4f5',
                        fontSize: '12px', color: '#18181b',
                      }}>
                        <input
                          type="checkbox"
                          checked={categoryIds.includes(parent.id)}
                          onChange={() => toggleCategory(parent.id)}
                          style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: '#18181b' }}
                        />
                        {parent.name}
                      </label>
                      {/* 子分类（缩进） */}
                      {categories.filter(c => c.parent_id === parent.id).map(child => (
                        <label key={child.id} style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          padding: '6px 10px 6px 24px', cursor: 'pointer',
                          borderBottom: '1px solid #f4f4f5',
                          fontSize: '12px', color: '#52525b',
                        }}>
                          <input
                            type="checkbox"
                            checked={categoryIds.includes(child.id)}
                            onChange={() => toggleCategory(child.id)}
                            style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: '#18181b' }}
                          />
                          {child.name}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>暂无分类</p>
              )}

              {/* 新建分类 */}
              <div style={{ marginTop: '8px' }}>
                {!showNewCatForm ? (
                  <button
                    onClick={() => setShowNewCatForm(true)}
                    style={{
                      width: '100%', padding: '5px 0', fontSize: '12px',
                      border: '1px dashed #d4d4d8', borderRadius: '6px',
                      background: 'transparent', color: '#71717a', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#a1a1aa'; (e.currentTarget as HTMLElement).style.color = '#18181b' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d4d4d8'; (e.currentTarget as HTMLElement).style.color = '#71717a' }}
                  >
                    + 新建分类
                  </button>
                ) : (
                  <>
                    <input
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                      placeholder="分类名称…"
                      style={{ ...inputBase, fontSize: '12px', padding: '5px 8px', marginBottom: '4px' }}
                      autoFocus
                    />
                    {categories.length > 0 && (
                      <select
                        value={newCatParent}
                        onChange={e => setNewCatParent(e.target.value)}
                        style={{ ...inputBase, fontSize: '12px', padding: '5px 8px', marginBottom: '4px', cursor: 'pointer' }}
                      >
                        <option value="">— 顶级分类 —</option>
                        {categories.filter(c => !c.parent_id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={handleAddCategory}
                        disabled={addingCat || !newCatName.trim()}
                        style={{
                          flex: 1, padding: '5px 0', fontSize: '12px', border: 'none',
                          borderRadius: '6px', background: '#18181b', color: '#fff',
                          cursor: addingCat || !newCatName.trim() ? 'not-allowed' : 'pointer',
                          opacity: addingCat || !newCatName.trim() ? 0.5 : 1,
                        }}
                      >
                        {addingCat ? '添加中…' : '确认添加'}
                      </button>
                      <button
                        onClick={() => { setShowNewCatForm(false); setNewCatName(''); setNewCatParent('') }}
                        style={{
                          padding: '5px 10px', fontSize: '12px',
                          border: '1px solid #e4e4e7', borderRadius: '6px',
                          background: '#fff', color: '#71717a', cursor: 'pointer',
                        }}
                      >取消</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {contentType.has_tag && (
            <div>
              <label style={labelStyle}>标签</label>
              {/* Tag chips */}
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                  {tags.map(tag => (
                    <span key={tag} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      padding: '2px 8px', borderRadius: '99px',
                      background: '#f4f4f5', color: '#52525b',
                      fontSize: '12px', fontWeight: 500,
                    }}>
                      {tag}
                      <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0, color: '#a1a1aa' }}>
                        <XIcon size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Tag input with suggestions */}
              <div style={{ position: 'relative' }}>
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
                    if (e.key === 'Backspace' && !tagInput && tags.length > 0) removeTag(tags[tags.length - 1])
                  }}
                  placeholder="输入标签，回车确认…"
                  style={{ ...inputBase, fontSize: '12px', padding: '5px 8px' }}
                />
                {tagSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    background: '#fff', border: '1px solid #e4e4e7', borderRadius: '7px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginTop: '2px',
                    overflow: 'hidden',
                  }}>
                    {tagSuggestions.map(t => (
                      <button
                        key={t.id}
                        onMouseDown={e => { e.preventDefault(); addTag(t.name) }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', fontSize: '12px', color: '#18181b', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f4f4f5' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#f9fafb')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ height: '1px', background: '#f4f4f5' }} />

          {/* Excerpt */}
          <div>
            <label style={labelStyle}>摘要</label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="留空则自动截取" rows={4} style={textareaBase} />
          </div>

          <div style={{ height: '1px', background: '#f4f4f5' }} />

          {/* SEO */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ ...labelStyle, marginBottom: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>SEO</p>
              <button onClick={handleAISEO} disabled={aiLoading} style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: aiLoading ? 'not-allowed' : 'pointer', padding: 0, opacity: aiLoading ? 0.5 : 1 }}>AI 优化</button>
            </div>
            <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="SEO 标题（留空则使用文章标题）" style={{ ...inputBase, marginBottom: '6px' }} />
            <div style={{ position: 'relative' }}>
              <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)} placeholder="搜索引擎描述（155字以内）" rows={3} maxLength={155} style={textareaBase} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <button
                  onClick={() => { if (excerpt) setMetaDesc(excerpt.slice(0, 155)) }}
                  disabled={!excerpt}
                  style={{ fontSize: '11px', color: excerpt ? '#2563eb' : '#a1a1aa', background: 'none', border: 'none', cursor: excerpt ? 'pointer' : 'default', padding: 0 }}
                >
                  使用摘要
                </button>
                <span style={{ fontSize: '11px', color: metaDesc.length > 130 ? '#f59e0b' : '#a1a1aa' }}>{metaDesc.length}/155</span>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px', lineHeight: 1.5 }}>
              仅用于搜索引擎，不在页面显示。摘要是给读者看的列表预览。
            </p>
          </div>

          <div style={{ height: '1px', background: '#f4f4f5' }} />

          {/* Stats */}
          <div>
            <p style={{ ...labelStyle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>统计</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#71717a' }}>字数</span>
                <span style={{ color: '#18181b', fontWeight: 500 }}>{wordCount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#71717a' }}>阅读时长</span>
                <span style={{ color: '#18181b', fontWeight: 500 }}>{readTime} 分钟</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
