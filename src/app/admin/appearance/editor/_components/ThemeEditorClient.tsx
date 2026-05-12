'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { CheckIcon } from '@/components/icons'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface Tab {
  id: string
  label: string
  lang: string
  settingKey: string
  placeholder: string
  description: string
}

const TABS: Tab[] = [
  {
    id: 'css',
    label: 'CSS',
    lang: 'css',
    settingKey: 'theme.customCss',
    placeholder: '/* 自定义全局样式 */\n\n.my-class {\n  color: var(--color-primary);\n}',
    description: '注入到全站 <style> 标签，支持 CSS 变量、媒体查询等所有 CSS 特性',
  },
  {
    id: 'header',
    label: 'Header HTML',
    lang: 'html',
    settingKey: 'theme.headerHtml',
    placeholder: '<!-- 注入到 Header 下方 -->\n<!-- 可用于公告栏、通知条等 -->\n\n<div class="announcement-bar">\n  欢迎访问我们的网站！\n</div>',
    description: '注入到网站顶部导航栏下方，适合公告条、Banner 等',
  },
  {
    id: 'footer',
    label: 'Footer HTML',
    lang: 'html',
    settingKey: 'theme.footerHtml',
    placeholder: '<!-- 注入到 Footer 上方 -->\n<!-- 可用于版权声明、备案号等 -->\n\n<div style="text-align:center;padding:1rem;font-size:0.8rem;color:#999">\n  京ICP备XXXXXXXX号\n</div>',
    description: '注入到网站底部 Footer 上方，适合备案信息、自定义版权等',
  },
  {
    id: 'js',
    label: 'JavaScript',
    lang: 'javascript',
    settingKey: 'theme.customJs',
    placeholder: '// 自定义 JS，在页面底部执行\n// 可用于统计代码、第三方 SDK 等\n\nconsole.log("Hello from Theme Studio!")',
    description: '注入到页面底部 </body> 前执行，适合统计脚本、第三方集成等',
  },
]

interface Props {
  initialCss: string
  initialHeaderHtml: string
  initialFooterHtml: string
  initialJs: string
}

export default function ThemeEditorClient({ initialCss, initialHeaderHtml, initialFooterHtml, initialJs }: Props) {
  const [activeTab, setActiveTab] = useState('css')
  const [values, setValues] = useState<Record<string, string>>({
    'theme.customCss': initialCss,
    'theme.headerHtml': initialHeaderHtml,
    'theme.footerHtml': initialFooterHtml,
    'theme.customJs': initialJs,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const currentTab = TABS.find(t => t.id === activeTab)!

  const handleChange = useCallback((value: string | undefined) => {
    const val = value ?? ''
    setValues(prev => ({ ...prev, [currentTab.settingKey]: val }))
    setDirty(true)
    setSaved(false)
  }, [currentTab.settingKey])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (res.ok) {
        setSaved(true)
        setDirty(false)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        borderBottom: '1px solid #e4e4e7',
        background: '#fafafa',
        padding: '0 8px',
        flexShrink: 0,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              fontSize: '12px', fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#18181b' : '#71717a',
              border: 'none', borderBottom: activeTab === tab.id ? '2px solid #18181b' : '2px solid transparent',
              background: 'none', cursor: 'pointer',
              transition: 'color 0.1s',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || (!dirty && !saved)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 16px', borderRadius: '6px', border: 'none',
            background: saved ? '#10b981' : dirty ? '#18181b' : '#d4d4d8',
            color: '#fff', fontWeight: 600, fontSize: '12px',
            cursor: saving || (!dirty && !saved) ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          {saved && <CheckIcon size={13} />}
          {saving ? '保存中…' : saved ? '已保存' : '保存全部'}
        </button>
      </div>

      {/* Description bar */}
      <div style={{
        padding: '8px 16px',
        fontSize: '11px', color: '#71717a',
        background: '#fafafa',
        borderBottom: '1px solid #e4e4e7',
        flexShrink: 0,
      }}>
        {currentTab.description}
      </div>

      {/* Monaco Editor */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <MonacoEditor
          key={activeTab}
          language={currentTab.lang}
          value={values[currentTab.settingKey]}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            fontSize: 13,
            lineHeight: 20,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            tabSize: 2,
            formatOnPaste: true,
            suggest: { showSnippets: true },
            quickSuggestions: { strings: true, other: true, comments: false },
          }}
          height="100%"
        />
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 16px',
        fontSize: '11px',
        background: '#1e1e1e', color: '#858585',
        flexShrink: 0,
      }}>
        <span>{currentTab.lang.toUpperCase()}</span>
        <span>{dirty ? '● 有未保存的修改' : saved ? '✓ 已保存' : '无修改'}</span>
      </div>
    </div>
  )
}
