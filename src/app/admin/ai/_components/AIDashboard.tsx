'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { AITask, AITaskType, Category, CategoryPlan, SiteSettings } from '@/types'
import { formatDate } from '@/lib/utils'
import { TabBar } from '@/components/TabBar'

// ── 常量 ────────────────────────────────────────────────────────────────

const TEXT_MODELS = [
  { value: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', label: 'Llama 3.3 70B（快速，推荐）' },
  { value: '@cf/meta/llama-3.1-70b-instruct',           label: 'Llama 3.1 70B' },
  { value: '@cf/meta/llama-3.1-8b-instruct',            label: 'Llama 3.1 8B（轻量）' },
  { value: '@cf/meta/llama-3.2-3b-instruct',            label: 'Llama 3.2 3B（极轻量）' },
  { value: '@cf/mistral/mistral-7b-instruct-v0.1',      label: 'Mistral 7B' },
  { value: '@cf/qwen/qwen1.5-14b-chat-awq',             label: 'Qwen 1.5 14B' },
  { value: '@cf/qwen/qwen1.5-7b-chat-awq',              label: 'Qwen 1.5 7B' },
]

const WRITING_STYLES = [
  { value: 'professional', label: '专业严谨' },
  { value: 'casual',       label: '轻松友好' },
  { value: 'academic',     label: '学术深度' },
  { value: 'creative',     label: '创意文学' },
]

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: '待执行', bg: 'rgba(113,113,122,0.1)', color: '#71717a' },
  running: { label: '执行中', bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
  done:    { label: '已完成', bg: 'rgba(16,185,129,0.1)',  color: '#059669' },
  failed:  { label: '失败',   bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
}

const TYPE_LABEL: Record<AITaskType, string> = {
  content:   '内容 Agent',
  seo:       'SEO 优化',
  review:    '审核 Agent',
  design:    '设计',
  analytics: '分析',
  setup:     '初始化',
}

const DEFAULT_TOPIC_PROMPT = `你是一个内容策略师，正在为名为"{{siteName}}"的网站规划内容。
{{siteTopics}}{{audience}}{{avoidTopics}}
已有文章标题（避免重复选题）：
{{existingTitles}}

请建议 {{count}} 个全新的、有吸引力的文章选题。
直接返回 JSON 数组，不要其他内容：["选题1", "选题2", ...]`

const DEFAULT_SYSTEM_PROMPT = `你是一位专业的内容创作者，擅长SEO友好的内容写作。请严格按照指定格式输出。`

const DEFAULT_USER_PROMPT = `请围绕主题"{{topic}}"写一篇{{wordCount}}字左右的文章。
{{keywords}}{{style}}{{siteTopics}}{{audience}}
严格按以下格式输出，不要添加任何其他内容：

===TITLE===
（在此写文章标题，一行）
===EXCERPT===
（在此写100字以内的摘要，一行）
===META===
（在此写SEO描述，一行，100字以内）
===CONTENT===
（在此写Markdown格式正文）
===END===`

// ── 共用样式常量 ─────────────────────────────────────────────────────────

const card: React.CSSProperties = { background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px' }
const inputBase: React.CSSProperties = {
  padding: '6px 9px', fontSize: '13px', border: '1px solid #e4e4e7',
  borderRadius: '7px', background: '#fff', color: '#18181b', outline: 'none',
  boxSizing: 'border-box', width: '100%',
}
const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' }
const labelStyle: React.CSSProperties = { fontSize: '13px', color: '#3f3f46', width: '72px', flexShrink: 0 }

// ── Props ────────────────────────────────────────────────────────────────

interface Props {
  initialTasks: AITask[]
  totalTasks: number
  initialSettings: Partial<SiteSettings>
}

// ── 子组件 ───────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
      <div onClick={() => onChange(!checked)} style={{
        width: '34px', height: '19px', borderRadius: '10px', flexShrink: 0,
        background: checked ? '#6366f1' : '#e4e4e7', position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
      }}>
        <div style={{ position: 'absolute', top: '2px', left: checked ? '17px' : '2px', width: '15px', height: '15px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
      </div>
      <div>
        <p style={{ fontSize: '13px', fontWeight: 500, color: '#18181b', margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: '12px', color: '#71717a', margin: '1px 0 0' }}>{desc}</p>}
      </div>
    </label>
  )
}

function SegLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{children}</p>
}

function Divider() {
  return <div style={{ height: '1px', background: '#f4f4f5', margin: '18px 0' }} />
}

// 左导航项
function NavItem({ active, label, badge, onClick }: { active: boolean; label: string; badge?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '8px 14px',
        fontSize: '13px', fontWeight: active ? 600 : 400,
        color: active ? '#6366f1' : '#52525b',
        background: active ? 'rgba(99,102,241,0.08)' : 'transparent',
        border: 'none', borderRadius: '7px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '6px',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {label}
      {badge && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />}
    </button>
  )
}

// 任务历史
function TaskHistory({ tasks, total }: { tasks: AITask[]; total: number }) {
  const [filter, setFilter] = useState<'all' | 'content' | 'review'>('all')
  const shown = filter === 'all' ? tasks : tasks.filter(t => t.type === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {(['all', 'content', 'review'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '6px', cursor: 'pointer',
            border: filter === f ? '1.5px solid #6366f1' : '1px solid #e4e4e7',
            background: filter === f ? 'rgba(99,102,241,0.07)' : '#fff',
            color: filter === f ? '#6366f1' : '#71717a',
          }}>
            {f === 'all' ? `全部（${total}）` : f === 'content' ? '内容 Agent' : '审核 Agent'}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#a1a1aa', fontSize: '13px' }}>暂无执行记录</div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>
          {shown.map((task, i) => {
            const st = STATUS_MAP[task.status] ?? STATUS_MAP.pending
            const output = task.output as Record<string, unknown> | null
            const articles = output?.articles as { id: string; title: string }[] | undefined
            const taskErrors = output?.errors as { topic: string; step: string; error: string }[] | undefined
            const summary = task.status === 'done'
              ? task.type === 'content'
                ? `生成 ${(output?.generated as number) ?? 0} 篇${taskErrors?.length ? `，${taskErrors.length} 个错误` : ''}`
                : task.type === 'review'
                  ? `审核 ${(output?.reviewed as number) ?? 0} 篇${taskErrors?.length ? `，${taskErrors.length} 篇失败` : ''}`
                  : `优化 ${(output?.optimized as number) ?? 0} 篇`
              : (task.error ?? '')

            return (
              <div key={task.id} style={{ padding: '10px 14px', borderBottom: i < shown.length - 1 ? '1px solid #f4f4f5' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '99px', background: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</span>
                  <span style={{ fontSize: '11px', color: '#a1a1aa', flexShrink: 0, width: '64px' }}>{TYPE_LABEL[task.type] ?? task.type}</span>
                  <span style={{ flex: 1, fontSize: '12px', color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</span>
                  <span style={{ fontSize: '11px', color: '#a1a1aa', flexShrink: 0 }}>{formatDate(task.created_at)}</span>
                  {task.completed_at && <span style={{ fontSize: '11px', color: '#a1a1aa', flexShrink: 0 }}>{task.completed_at - task.created_at}s</span>}
                </div>
                {articles && articles.length > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {articles.map(a => (
                      <Link key={a.id} href={`/admin/post/${a.id}`} style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '5px', background: '#f4f4f5', color: '#3f3f46', textDecoration: 'none', border: '1px solid #e4e4e7' }}>
                        {a.title.length > 22 ? a.title.slice(0, 22) + '…' : a.title}
                      </Link>
                    ))}
                  </div>
                )}
                {taskErrors && taskErrors.length > 0 && (
                  <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {taskErrors.slice(0, 3).map((e, ei) => (
                      <div key={ei} style={{ fontSize: '11px', padding: '3px 7px', borderRadius: '5px', background: 'rgba(239,68,68,0.06)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.12)' }}>
                        <span style={{ fontWeight: 600 }}>[{e.step}]</span>{' '}
                        {e.topic.slice(0, 15)}：{e.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 主组件 ───────────────────────────────────────────────────────────────

export default function AIDashboard({ initialTasks, totalTasks, initialSettings }: Props) {
  const [activeTab, setActiveTab] = useState<'content' | 'review' | 'history'>('content')
  const [contentSection, setContentSection] = useState<'basic' | 'plans' | 'schedule' | 'prompts'>('basic')

  const [tasks, setTasks] = useState<AITask[]>(initialTasks)
  const [total, setTotal] = useState(totalTasks)
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [lastResult, setLastResult] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [copied, setCopied] = useState('')

  // ── 内容 Agent ──
  const [writingStyle, setWritingStyle]       = useState(String(initialSettings['ai.writingStyle'] || 'professional'))
  const [count, setCount]                     = useState(Number(initialSettings['ai.content.count']) || 2)
  const [autoPublish, setAutoPublish]         = useState(Boolean(initialSettings['ai.content.autoPublish']))
  const [length, setLength]                   = useState<'short' | 'medium' | 'long'>((initialSettings['ai.content.length'] as 'short' | 'medium' | 'long') || 'medium')
  const [imageSource, setImageSource]         = useState<'ai' | 'unsplash' | 'none'>((initialSettings['ai.content.imageSource'] as 'ai' | 'unsplash' | 'none') || 'none')
  const [unsplashKey, setUnsplashKey]         = useState(String(initialSettings['ai.content.unsplashKey'] || ''))
  const [bodyImageSource, setBodyImageSource] = useState<'none' | 'unsplash' | 'ai'>((initialSettings['ai.content.bodyImageSource'] as 'none' | 'unsplash' | 'ai') || 'none')
  const [siteTopics, setSiteTopics]           = useState(String(initialSettings['ai.content.siteTopics'] || ''))
  const [targetAudience, setTargetAudience]   = useState(String(initialSettings['ai.content.targetAudience'] || ''))
  const [avoidTopics, setAvoidTopics]         = useState(String(initialSettings['ai.content.avoidTopics'] || ''))
  const [topicModel, setTopicModel]           = useState(String(initialSettings['ai.topic.model'] || '@cf/meta/llama-3.3-70b-instruct-fp8-fast'))
  const [contentModel, setContentModel]       = useState(String(initialSettings['ai.content.model'] || '@cf/meta/llama-3.3-70b-instruct-fp8-fast'))
  const [categoryPlans, setCategoryPlans]     = useState<CategoryPlan[]>((initialSettings['ai.content.categoryPlans'] as CategoryPlan[]) || [])
  const [categories, setCategories]           = useState<Category[]>([])
  const [scheduleEnabled, setScheduleEnabled] = useState(Boolean(initialSettings['ai.schedule.enabled']))
  const [scheduleRunMin, setScheduleRunMin]   = useState(Number(initialSettings['ai.schedule.runMin'] ?? 1))
  const [scheduleRunMax, setScheduleRunMax]   = useState(Number(initialSettings['ai.schedule.runMax'] ?? 1))
  const [scheduleDailyMax, setScheduleDailyMax] = useState(Number(initialSettings['ai.schedule.dailyMax'] ?? 10))
  const [topicPrompt, setTopicPrompt]         = useState(String(initialSettings['ai.topic.prompt'] || ''))
  const [systemPrompt, setSystemPrompt]       = useState(String(initialSettings['ai.content.systemPrompt'] || ''))
  const [userPrompt, setUserPrompt]           = useState(String(initialSettings['ai.content.userPrompt'] || ''))

  // ── 触发 Token ──
  const [triggerToken, setTriggerToken] = useState(String(initialSettings['ai.trigger.token'] || ''))
  const [tokenSaving, setTokenSaving]   = useState(false)
  const [showToken, setShowToken]       = useState(false)

  // ── 预览选题 ──
  const [previewTopics, setPreviewTopics]   = useState<string[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  // ── 审核 Agent ──
  const [reviewBatchSize, setReviewBatchSize]             = useState(Number(initialSettings['ai.review.batchSize'] ?? initialSettings['ai.seo.batchSize'] ?? 8))
  const [reviewPriorityUnreviewed, setReviewPriorityUnreviewed] = useState(initialSettings['ai.review.priorityUnreviewed'] !== false)
  const [reviewFixMeta, setReviewFixMeta]                 = useState(initialSettings['ai.review.fixMeta'] !== false)
  const [reviewFixExcerpt, setReviewFixExcerpt]           = useState(initialSettings['ai.review.fixExcerpt'] !== false)
  const [reviewModel, setReviewModel]                     = useState(String(initialSettings['ai.review.model'] || initialSettings['ai.seo.model'] || '@cf/meta/llama-3.1-8b-instruct'))

  useEffect(() => {
    fetch('/api/categories?type=post')
      .then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setCategories(d as Category[]) })
      .catch(() => {})
  }, [])

  const refreshTasks = useCallback(async () => {
    const res = await fetch('/api/ai-tasks')
    if (res.ok) {
      const d = await res.json() as { items: AITask[]; pagination: { total: number } }
      setTasks(d.items)
      setTotal(d.pagination.total)
    }
  }, [])

  async function handleRun(agent: 'content' | 'review') {
    setRunning(r => ({ ...r, [agent]: true }))
    setLastResult(r => ({ ...r, [agent]: '' }))
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent }),
      })
      const data = await res.json() as { success?: boolean; summary?: string; error?: string }
      setLastResult(r => ({ ...r, [agent]: !res.ok ? `失败: ${data.error || '未知错误'}` : (data.summary ?? (data.success ? '完成' : '运行失败')) }))
      if (res.ok) await refreshTasks()
    } catch (e) {
      setLastResult(r => ({ ...r, [agent]: `请求失败: ${e instanceof Error ? e.message : '网络错误'}` }))
    } finally {
      setRunning(r => ({ ...r, [agent]: false }))
    }
  }

  async function handleGenerateToken() {
    setTokenSaving(true)
    const token = crypto.randomUUID().replace(/-/g, '')
    try {
      const res = await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ 'ai.trigger.token': token }) })
      if (res.ok) { setTriggerToken(token); setShowToken(true) }
    } finally { setTokenSaving(false) }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000) })
  }

  function buildUrl(agent: string, mode?: string) {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return `${base}/api/agents/trigger?token=${triggerToken}&agent=${agent}${mode ? `&mode=${mode}` : ''}`
  }

  async function handlePreviewTopics() {
    setPreviewLoading(true); setPreviewTopics([])
    try {
      const res = await fetch('/api/agents/preview-topics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: Math.min(count, 8) }) })
      const data = await res.json() as { topics?: string[]; error?: string }
      if (data.topics) setPreviewTopics(data.topics)
    } catch { /* ignore */ } finally { setPreviewLoading(false) }
  }

  async function handleSave() {
    setSaving(true); setSaveMsg('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'ai.writingStyle': writingStyle,
          'ai.content.count': count,
          'ai.content.autoPublish': autoPublish,
          'ai.content.length': length,
          'ai.content.imageSource': imageSource,
          'ai.content.unsplashKey': unsplashKey,
          'ai.content.bodyImageSource': bodyImageSource,
          'ai.content.siteTopics': siteTopics,
          'ai.content.targetAudience': targetAudience,
          'ai.content.avoidTopics': avoidTopics,
          'ai.topic.model': topicModel,
          'ai.content.model': contentModel,
          'ai.content.categoryPlans': categoryPlans,
          'ai.schedule.enabled': scheduleEnabled,
          'ai.schedule.runMin': scheduleRunMin,
          'ai.schedule.runMax': scheduleRunMax,
          'ai.schedule.dailyMax': scheduleDailyMax,
          'ai.topic.prompt': topicPrompt,
          'ai.content.systemPrompt': systemPrompt,
          'ai.content.userPrompt': userPrompt,
          'ai.review.batchSize': reviewBatchSize,
          'ai.review.priorityUnreviewed': reviewPriorityUnreviewed,
          'ai.review.fixMeta': reviewFixMeta,
          'ai.review.fixExcerpt': reviewFixExcerpt,
          'ai.review.model': reviewModel,
        }),
      })
      setSaveMsg(res.ok ? '保存成功' : '保存失败')
    } catch { setSaveMsg('保存失败') } finally {
      setSaving(false); setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  function addCategoryPlan(categoryId: string) {
    if (categoryPlans.find(p => p.categoryId === categoryId)) return
    setCategoryPlans(prev => [...prev, { categoryId, count: 2, topicFocus: '', weight: 1 }])
  }
  function removeCategoryPlan(categoryId: string) {
    setCategoryPlans(prev => prev.filter(p => p.categoryId !== categoryId))
  }
  function updateCategoryPlan(categoryId: string, field: 'count' | 'topicFocus' | 'weight', value: string | number) {
    setCategoryPlans(prev => prev.map(p => p.categoryId === categoryId ? { ...p, [field]: value } : p))
  }

  const promptsCustomized = !!(topicPrompt || systemPrompt || userPrompt)
  const saveBtnStyle: React.CSSProperties = {
    padding: '8px 24px', fontSize: '13px', fontWeight: 500, border: 'none', borderRadius: '8px',
    cursor: saving ? 'not-allowed' : 'pointer',
    background: saving ? '#f4f4f5' : '#6366f1',
    color: saving ? '#71717a' : '#fff',
  }

  const tabs = [
    { key: 'content', label: '内容 Agent' },
    { key: 'review',  label: '审核 Agent' },
    { key: 'history', label: '历史记录' },
  ] as const

  // ── Webhook URL 区块（内容 Agent 专用）────────────────────────────────

  function WebhookBlock({ agent }: { agent: 'content' | 'review' }) {
    const urls = agent === 'content'
      ? [
          { label: '完整运行', url: buildUrl('content'), key: 'content-full' },
          ...(scheduleEnabled ? [{ label: '计划触发', url: buildUrl('content', 'schedule'), key: 'content-sched' }] : []),
        ]
      : [{ label: '触发审核', url: buildUrl('review'), key: 'review' }]

    return (
      <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', paddingTop: '7px', flexShrink: 0 }}>Webhook</span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {triggerToken ? urls.map(({ label, url, key }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#a1a1aa', width: '52px', flexShrink: 0 }}>{label}</span>
              <code style={{ flex: 1, fontSize: '11px', color: '#52525b', background: '#f4f4f5', padding: '5px 8px', borderRadius: '6px', wordBreak: 'break-all', lineHeight: 1.5 }}>{url}</code>
              <button onClick={() => copyText(url, key)} style={{
                flexShrink: 0, padding: '5px 10px', fontSize: '11px', fontWeight: 500,
                border: '1px solid #e4e4e7', borderRadius: '6px', cursor: 'pointer',
                background: copied === key ? 'rgba(16,185,129,0.08)' : '#fff',
                color: copied === key ? '#059669' : '#71717a', transition: 'all 0.15s',
              }}>{copied === key ? '已复制' : '复制'}</button>
            </div>
          )) : (
            <span style={{ fontSize: '12px', color: '#a1a1aa', paddingTop: '5px' }}>尚未生成 Token，点击右侧按钮生成</span>
          )}
        </div>
        <button onClick={handleGenerateToken} disabled={tokenSaving} style={{
          flexShrink: 0, padding: '5px 12px', fontSize: '12px', fontWeight: 500,
          border: '1px solid #e4e4e7', borderRadius: '7px', cursor: tokenSaving ? 'not-allowed' : 'pointer',
          background: '#fff', color: '#71717a',
        }}>
          {tokenSaving ? '生成中…' : triggerToken ? '重置 Token' : '生成 Token'}
        </button>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TabBar tabs={tabs} active={activeTab} onChange={k => setActiveTab(k as typeof activeTab)} />

      {/* ══ 内容 Agent ══════════════════════════════════════════════════ */}
      {activeTab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* 操作区 */}
          <div style={{ ...card }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleRun('content')}
                disabled={!!running['content']}
                style={{
                  padding: '7px 20px', fontSize: '13px', fontWeight: 500, border: 'none', borderRadius: '8px',
                  cursor: running['content'] ? 'not-allowed' : 'pointer',
                  background: running['content'] ? '#f4f4f5' : '#6366f1',
                  color: running['content'] ? '#71717a' : '#fff',
                }}
              >{running['content'] ? '生成中…' : '立即运行'}</button>
              <button
                onClick={handlePreviewTopics}
                disabled={previewLoading}
                style={{
                  padding: '7px 14px', fontSize: '12px', fontWeight: 500, borderRadius: '8px', cursor: previewLoading ? 'not-allowed' : 'pointer',
                  border: '1px solid #e4e4e7', background: '#fff', color: '#71717a',
                }}
              >{previewLoading ? '…' : '预览选题'}</button>
              {lastResult['content'] && (
                <span style={{
                  fontSize: '12px', padding: '4px 10px', borderRadius: '6px',
                  background: lastResult['content'].includes('失败') ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)',
                  color: lastResult['content'].includes('失败') ? '#ef4444' : '#059669',
                }}>{lastResult['content']}</span>
              )}
            </div>
            <WebhookBlock agent="content" />
          </div>

          {previewTopics.length > 0 && (
            <div style={{ ...card, overflow: 'hidden' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', padding: '8px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>预览选题</p>
              {previewTopics.map((t, i) => (
                <div key={i} style={{ fontSize: '12px', color: '#3f3f46', padding: '5px 12px', borderTop: '1px solid #f4f4f5' }}>{i + 1}. {t}</div>
              ))}
            </div>
          )}

          {/* 配置区：左导航 + 右内容 */}
          <div style={{ ...card, display: 'flex', minHeight: '400px', overflow: 'hidden' }}>

            {/* 左导航 */}
            <div style={{ width: '130px', flexShrink: 0, borderRight: '1px solid #f4f4f5', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <NavItem active={contentSection === 'basic'}    label="基础设置" onClick={() => setContentSection('basic')} />
              <NavItem active={contentSection === 'plans'}    label="分类计划" badge={categoryPlans.length > 0} onClick={() => setContentSection('plans')} />
              <NavItem active={contentSection === 'schedule'} label="发布计划" badge={scheduleEnabled} onClick={() => setContentSection('schedule')} />
              <NavItem active={contentSection === 'prompts'}  label="提示词"   badge={promptsCustomized} onClick={() => setContentSection('prompts')} />
            </div>

            {/* 右内容 */}
            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>

              {/* ─ 基础设置 ─ */}
              {contentSection === 'basic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  <SegLabel>生成设置</SegLabel>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={rowStyle}>
                      <span style={labelStyle}>写作风格</span>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {WRITING_STYLES.map(({ value, label }) => (
                          <button key={value} onClick={() => setWritingStyle(value)} style={{
                            padding: '5px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '6px', cursor: 'pointer',
                            border: writingStyle === value ? '1.5px solid #6366f1' : '1px solid #e4e4e7',
                            background: writingStyle === value ? 'rgba(99,102,241,0.07)' : '#fff',
                            color: writingStyle === value ? '#6366f1' : '#71717a',
                          }}>{label}</button>
                        ))}
                      </div>
                    </div>

                    <div style={rowStyle}>
                      <span style={labelStyle}>文章长度</span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {([['short','短文'],['medium','中等'],['long','长文']] as const).map(([v, l]) => (
                          <button key={v} onClick={() => setLength(v)} style={{
                            padding: '5px 14px', fontSize: '12px', fontWeight: 500, borderRadius: '6px', cursor: 'pointer',
                            border: length === v ? '1.5px solid #6366f1' : '1px solid #e4e4e7',
                            background: length === v ? 'rgba(99,102,241,0.07)' : '#fff',
                            color: length === v ? '#6366f1' : '#71717a',
                          }}>{l}</button>
                        ))}
                      </div>
                    </div>

                    <div style={rowStyle}>
                      <span style={labelStyle}>自动发布</span>
                      <Toggle checked={autoPublish} onChange={setAutoPublish} label={autoPublish ? '直接发布' : '保存为草稿'} />
                    </div>

                    {categoryPlans.length === 0 && (
                      <div style={rowStyle}>
                        <span style={labelStyle}>每次篇数</span>
                        <input type="number" min={1} max={20} value={count} onChange={e => setCount(Number(e.target.value))}
                          style={{ ...inputBase, width: '60px', textAlign: 'center' }} />
                        <span style={{ fontSize: '12px', color: '#a1a1aa' }}>篇（配置分类计划后此项由计划控制）</span>
                      </div>
                    )}
                  </div>

                  <Divider />
                  <SegLabel>内容方向</SegLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {([
                      ['主题领域', siteTopics,     setSiteTopics,     '科技、AI、前端开发…'],
                      ['目标读者', targetAudience, setTargetAudience, '技术开发者、产品经理…'],
                      ['禁止话题', avoidTopics,    setAvoidTopics,    '政治、广告、违规内容…'],
                    ] as [string, string, (v: string) => void, string][]).map(([label, val, setter, ph]) => (
                      <div key={label} style={rowStyle}>
                        <span style={labelStyle}>{label}</span>
                        <input value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                          style={{ ...inputBase, maxWidth: '340px' }} />
                      </div>
                    ))}
                  </div>

                  <Divider />
                  <SegLabel>图片</SegLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {([
                      ['封面图',   imageSource,     setImageSource as (v: string) => void,     [['none','不生成'],['ai','AI 生成'],['unsplash','Unsplash']]],
                      ['正文配图', bodyImageSource, setBodyImageSource as (v: string) => void, [['none','不插入'],['unsplash','Unsplash'],['ai','AI 生成']]],
                    ] as [string, string, (v: string) => void, [string, string][]][]).map(([label, val, setter, opts]) => (
                      <div key={label} style={rowStyle}>
                        <span style={labelStyle}>{label}</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {opts.map(([v, l]) => (
                            <button key={v} onClick={() => setter(v)} style={{
                              padding: '5px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '6px', cursor: 'pointer',
                              border: val === v ? '1.5px solid #6366f1' : '1px solid #e4e4e7',
                              background: val === v ? 'rgba(99,102,241,0.07)' : '#fff',
                              color: val === v ? '#6366f1' : '#71717a',
                            }}>{l}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(imageSource === 'unsplash' || bodyImageSource !== 'none') && (
                      <div style={rowStyle}>
                        <span style={labelStyle}>Unsplash Key</span>
                        <input type="password" value={unsplashKey} onChange={e => setUnsplashKey(e.target.value)}
                          placeholder="unsplash.com/developers"
                          style={{ ...inputBase, maxWidth: '260px' }} />
                      </div>
                    )}
                  </div>

                  <Divider />
                  <SegLabel>模型</SegLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {([['选题模型', topicModel, setTopicModel], ['内容模型', contentModel, setContentModel]] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
                      <div key={label} style={rowStyle}>
                        <span style={labelStyle}>{label}</span>
                        <select value={val} onChange={e => setter(e.target.value)}
                          style={{ ...inputBase, maxWidth: '260px', cursor: 'pointer' }}>
                          {TEXT_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─ 分类计划 ─ */}
              {contentSection === 'plans' && (
                <div>
                  <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 14px' }}>
                    手动运行时按每个分类的篇数生成；发布计划模式下按权重随机选一个分类触发。
                  </p>

                  {categories.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#a1a1aa' }}>暂无分类，请先在内容管理中创建分类</p>
                  ) : (
                    <>
                      {categoryPlans.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                          {categoryPlans.map(plan => {
                            const cat = categories.find(c => c.id === plan.categoryId)
                            if (!cat) return null
                            const totalW = categoryPlans.reduce((s, p) => s + Math.max(1, p.weight ?? 1), 0)
                            const pct = Math.round(Math.max(1, plan.weight ?? 1) / totalW * 100)
                            return (
                              <div key={plan.categoryId} style={{ border: '1px solid #e4e4e7', borderRadius: '9px', padding: '12px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#3f3f46', flex: 1 }}>{cat.name}</span>
                                  <span style={{ fontSize: '11px', color: '#a1a1aa' }}>手动</span>
                                  <input type="number" min={1} max={20} value={plan.count}
                                    onChange={e => updateCategoryPlan(plan.categoryId, 'count', Number(e.target.value))}
                                    style={{ ...inputBase, width: '48px', textAlign: 'center' }} />
                                  <span style={{ fontSize: '11px', color: '#a1a1aa' }}>篇 | 权重</span>
                                  <input type="number" min={1} max={100} value={plan.weight ?? 1}
                                    onChange={e => updateCategoryPlan(plan.categoryId, 'weight', Number(e.target.value))}
                                    style={{ ...inputBase, width: '48px', textAlign: 'center' }} />
                                  <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, width: '32px' }}>{pct}%</span>
                                  <button onClick={() => removeCategoryPlan(plan.categoryId)}
                                    style={{ fontSize: '14px', color: '#d4d4d8', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>✕</button>
                                </div>
                                <input value={plan.topicFocus} onChange={e => updateCategoryPlan(plan.categoryId, 'topicFocus', e.target.value)}
                                  placeholder="主题方向（留空则使用基础设置中的主题领域）"
                                  style={{ ...inputBase }} />
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div>
                        <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '0 0 8px' }}>点击添加分类：</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {categories.filter(c => !categoryPlans.find(p => p.categoryId === c.id)).map(cat => (
                            <button key={cat.id} onClick={() => addCategoryPlan(cat.id)} style={{
                              fontSize: '12px', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                              border: '1px dashed #d4d4d8', background: '#fafafa', color: '#71717a',
                            }}>+ {cat.name}</button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ─ 发布计划 ─ */}
              {contentSection === 'schedule' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Toggle
                    checked={scheduleEnabled}
                    onChange={setScheduleEnabled}
                    label="启用发布计划"
                    desc="开启后通过计划触发 URL 调用时，随机决定篇数并按权重选取分类；未启用则 Webhook 触发完整计划"
                  />

                  {scheduleEnabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
                      {([
                        ['最少篇数', scheduleRunMin, (v: number) => { setScheduleRunMin(v); if (scheduleRunMax < v) setScheduleRunMax(v) }, 1, 20],
                        ['最多篇数', scheduleRunMax, (v: number) => setScheduleRunMax(Math.max(scheduleRunMin, v)), scheduleRunMin, 20],
                        ['每日上限', scheduleDailyMax, setScheduleDailyMax, 1, 100],
                      ] as [string, number, (v: number) => void, number, number][]).map(([label, val, setter, min, max]) => (
                        <div key={label} style={rowStyle}>
                          <span style={labelStyle}>{label}</span>
                          <input type="number" min={min} max={max} value={val}
                            onChange={e => setter(Number(e.target.value))}
                            style={{ ...inputBase, width: '70px', textAlign: 'center' }} />
                          <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{label === '每日上限' ? '篇 / 天' : '篇'}</span>
                        </div>
                      ))}
                      <p style={{ fontSize: '12px', color: '#71717a', background: '#f9f9fb', borderRadius: '7px', padding: '8px 12px', margin: 0 }}>
                        每次触发随机生成 {scheduleRunMin}–{scheduleRunMax} 篇，当日累计超过 {scheduleDailyMax} 篇后自动跳过。
                        使用操作区的「计划触发」Webhook URL 配合外部调度器控制时间。
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ─ 提示词 ─ */}
              {contentSection === 'prompts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { title: '选题提示词', sub: '控制 AI 如何生成文章选题', value: topicPrompt, setter: setTopicPrompt, def: DEFAULT_TOPIC_PROMPT, rows: 9, vars: ['{{siteName}}', '{{siteTopics}}', '{{audience}}', '{{avoidTopics}}', '{{existingTitles}}', '{{count}}'] },
                    { title: '内容 System Prompt', sub: '定义 AI 角色和写作规则', value: systemPrompt, setter: setSystemPrompt, def: DEFAULT_SYSTEM_PROMPT, rows: 4, vars: [] },
                    { title: '内容 User Prompt', sub: '控制文章结构和具体写作要求', value: userPrompt, setter: setUserPrompt, def: DEFAULT_USER_PROMPT, rows: 14, vars: ['{{topic}}', '{{wordCount}}', '{{keywords}}', '{{style}}', '{{siteTopics}}', '{{audience}}'] },
                  ].map(({ title, sub, value, setter, def, rows, vars }) => (
                    <div key={title}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: '0 0 2px' }}>{title}</p>
                          <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>{sub}</p>
                        </div>
                        <button onClick={() => setter('')} style={{ fontSize: '12px', color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>恢复默认</button>
                      </div>
                      <textarea value={value || def} onChange={e => setter(e.target.value === def ? '' : e.target.value)} rows={rows}
                        style={{ ...inputBase, fontFamily: 'monospace', fontSize: '12px', resize: 'vertical', lineHeight: 1.6 }} />
                      {vars.length > 0 && (
                        <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {vars.map(v => <code key={v} style={{ fontSize: '11px', background: '#f4f4f5', padding: '2px 6px', borderRadius: '4px', color: '#6366f1' }}>{v}</code>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 保存 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving} style={saveBtnStyle}>{saving ? '保存中…' : '保存配置'}</button>
            {saveMsg && <span style={{ fontSize: '13px', color: saveMsg.includes('失败') ? '#ef4444' : '#059669' }}>{saveMsg}</span>}
          </div>
        </div>
      )}

      {/* ══ 审核 Agent ══════════════════════════════════════════════════ */}
      {activeTab === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* 操作区 */}
          <div style={card}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleRun('review')}
                disabled={!!running['review']}
                style={{
                  padding: '7px 20px', fontSize: '13px', fontWeight: 500, border: 'none', borderRadius: '8px',
                  cursor: running['review'] ? 'not-allowed' : 'pointer',
                  background: running['review'] ? '#f4f4f5' : '#0ea5e9',
                  color: running['review'] ? '#71717a' : '#fff',
                }}
              >{running['review'] ? '审核中…' : '立即运行'}</button>
              {lastResult['review'] && (
                <span style={{
                  fontSize: '12px', padding: '4px 10px', borderRadius: '6px',
                  background: lastResult['review'].includes('失败') ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)',
                  color: lastResult['review'].includes('失败') ? '#ef4444' : '#059669',
                }}>{lastResult['review']}</span>
              )}
            </div>
            <WebhookBlock agent="review" />
          </div>

          {/* 配置 */}
          <div style={card}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f4f4f5' }}>
              <SegLabel>处理范围</SegLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={rowStyle}>
                  <span style={labelStyle}>每批篇数</span>
                  <input type="number" min={1} max={50} value={reviewBatchSize}
                    onChange={e => setReviewBatchSize(Number(e.target.value))}
                    style={{ ...inputBase, width: '70px', textAlign: 'center' }} />
                  <span style={{ fontSize: '12px', color: '#a1a1aa' }}>篇（建议 ≤ 20，避免超时）</span>
                </div>
                <Toggle checked={reviewPriorityUnreviewed} onChange={setReviewPriorityUnreviewed} label="优先处理未审核文章" desc="跳过已标记 ai_reviewed 的文章" />
              </div>
            </div>

            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f4f4f5' }}>
              <SegLabel>功能开关</SegLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Toggle checked={reviewFixMeta} onChange={setReviewFixMeta} label="补全 Meta 信息" desc="为缺少 meta_title 或 meta_description 的文章自动生成" />
                <Toggle checked={reviewFixExcerpt} onChange={setReviewFixExcerpt} label="补全摘要" desc="为缺少摘要（excerpt）的文章根据正文生成 100 字摘要" />
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <SegLabel>模型</SegLabel>
              <div style={rowStyle}>
                <span style={labelStyle}>审核模型</span>
                <select value={reviewModel} onChange={e => setReviewModel(e.target.value)}
                  style={{ ...inputBase, maxWidth: '260px', cursor: 'pointer' }}>
                  {TEXT_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '6px 0 0 84px' }}>建议使用轻量模型（Llama 3.1 8B），审核任务不需要大模型</p>
            </div>
          </div>

          {/* 保存 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving} style={saveBtnStyle}>{saving ? '保存中…' : '保存配置'}</button>
            {saveMsg && <span style={{ fontSize: '13px', color: saveMsg.includes('失败') ? '#ef4444' : '#059669' }}>{saveMsg}</span>}
          </div>
        </div>
      )}

      {/* ══ 历史记录 ═════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <TaskHistory tasks={tasks} total={total} />
      )}
    </div>
  )
}
