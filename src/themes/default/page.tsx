'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import type { ThemePageProps } from '@/types/theme'
import InlineForm from './components/InlineForm'
import type { Form } from '@/types'

function ProseWithForms({ html, forms, style }: { html: string; forms: Form[]; style?: React.CSSProperties }) {
  const formMap = Object.fromEntries(forms.map(f => [f.slug, f]))
  const parts = html.split(/<div[^>]*data-form="([^"]+)"[^>]*><\/div>/g)
  if (parts.length === 1) {
    return <div className="prose" style={style} dangerouslySetInnerHTML={{ __html: html }} />
  }
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) {
          return part.trim() ? <div key={i} className="prose" style={style} dangerouslySetInnerHTML={{ __html: part }} /> : null
        }
        const form = formMap[part]
        return form ? <InlineForm key={i} form={form} /> : null
      })}
    </>
  )
}

export default function DefaultPage({ post, settings: _settings, embeddedForms = [] }: ThemePageProps) {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/shj-github-dark.css'
    document.head.appendChild(link)
    import('@speed-highlight/core').then(({ highlightAll }) => { highlightAll() }).catch(() => {})
    return () => { link.remove() }
  }, [post.content])

  return (
    <main>
      <style>{`
        .page-cover { width:100%; overflow:hidden; }
        .page-cover-img { width:100%; height:clamp(180px,30vw,380px); object-fit:cover; display:block; }
        .page-layout { max-width:820px; margin:0 auto; padding:3.5rem 1.5rem 6rem; }
        @media(max-width:600px){ .page-layout{padding:2rem 1.25rem 4rem} }
      `}</style>

      {post.cover_image && (
        <div className="page-cover">
          <img src={post.cover_image} alt={post.title} className="page-cover-img" />
        </div>
      )}

      <div className="page-layout">
        <nav style={{ marginBottom: '2rem' }}>
          <Link href="/" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)')}
          >← 返回</Link>
        </nav>

        <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.75rem,4.5vw,2.75rem)',
            fontWeight: 900, lineHeight: 1.2,
            letterSpacing: '-0.03em', color: 'var(--color-text)',
          }}>
            {post.title}
          </h1>
          {post.excerpt && (
            <p style={{ fontSize: '1.0625rem', color: 'var(--color-text-secondary)', lineHeight: 1.8, marginTop: '1rem' }}>
              {post.excerpt}
            </p>
          )}
        </header>

        <ProseWithForms
          html={post.content ?? ''}
          forms={embeddedForms}
          style={{ lineHeight: 1.85, fontSize: '1.0625rem', color: 'var(--color-text)' }}
        />
      </div>
    </main>
  )
}
