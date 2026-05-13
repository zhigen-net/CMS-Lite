'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import type { Content, SiteSettings } from '@/types'
import type { CSSProperties } from 'react'
import { formatDate, estimateReadingTime } from '@/lib/utils'
import TableOfContents from './components/TableOfContents'
import PostCard from './components/PostCard'

interface Props {
  post: Content
  settings: SiteSettings
  related?: Content[]
}

export default function DefaultPost({ post, settings, related = [] }: Props) {
  void settings
  const readTime = post.content ? estimateReadingTime(post.content) : 0
  const date = post.published_at ? formatDate(post.published_at) : null

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/shj-github-dark.css'
    document.head.appendChild(link)

    import('@speed-highlight/core').then(({ highlightAll }) => {
      highlightAll()
    }).catch(() => { /* ignore */ })

    return () => { link.remove() }
  }, [post.content])

  return (
    <main>
      <style>{`
        @media(max-width:640px){
          .post-cover{max-height:240px!important}
          .post-cover img{height:240px!important}
          .post-layout{padding:1.5rem 1.25rem 4rem!important;grid-template-columns:1fr!important;gap:0!important}
          .post-toc{display:none!important}
          .post-header-meta{flex-direction:column;align-items:flex-start!important;gap:0.5rem!important}
        }
        @media(max-width:1024px){
          .post-toc{display:none!important}
          .post-layout{grid-template-columns:1fr!important}
        }
      `}</style>
      {/* Cover image */}
      {post.cover_image && (
        <div className="post-cover" style={{ width: '100%', overflow: 'hidden', maxHeight: '520px' }}>
          <img
            src={post.cover_image} alt={post.title}
            style={{ width: '100%', height: '520px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div className="post-layout" style={{
        maxWidth: '1100px', margin: '0 auto',
        padding: '3rem 1.5rem 6rem',
        display: 'grid',
        gridTemplateColumns: '1fr 220px',
        gap: '3rem',
        alignItems: 'start',
      }}>
        {/* Main content */}
        <div>
          {/* Breadcrumb */}
          <nav style={{ marginBottom: '2.5rem' }}>
            <Link href="/" style={{
              fontSize: '0.875rem', color: 'var(--color-text-secondary)',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              transition: 'color 0.15s',
            }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)')}
            >
              ← 返回
            </Link>
          </nav>

          {/* Article header */}
          <header style={{ marginBottom: '3rem' }}>
            {post.ai_generated && (
              <span style={{
                display: 'inline-block', marginBottom: '1.25rem',
                fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.75rem',
                borderRadius: '4px', border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)', letterSpacing: '0.05em',
              }}>AI 生成</span>
            )}

            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
              fontWeight: 900, lineHeight: 1.2,
              letterSpacing: '-0.03em',
              color: 'var(--color-text)',
              marginBottom: '1.5rem',
            }}>
              {post.title}
            </h1>

            {post.excerpt && (
              <p style={{
                fontSize: '1.1rem', color: 'var(--color-text-secondary)',
                lineHeight: 1.75, marginBottom: '1.75rem',
              }}>
                {post.excerpt}
              </p>
            )}

            <div className="post-header-meta" style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem',
              fontSize: '0.85rem', color: 'var(--color-text-secondary)',
              paddingBottom: '2rem', borderBottom: '1px solid var(--color-border)',
            }}>
              {post.categories?.map(cat => (
                <Link key={cat.id} href={`/category/${cat.slug}`} style={{
                  fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.625rem',
                  borderRadius: '99px', background: 'var(--color-primary)',
                  color: '#fff', letterSpacing: '0.01em', textDecoration: 'none',
                  transition: 'opacity 0.15s',
                } as CSSProperties}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.8')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                >{cat.name}</Link>
              ))}
              {post.author && (
                <Link href={`/author/${post.author.id}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  textDecoration: 'none', color: 'var(--color-text-secondary)',
                  transition: 'color 0.15s',
                } as CSSProperties}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)')}
                >
                  {post.author.avatar ? (
                    <img src={post.author.avatar} alt={post.author.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, flexShrink: 0 }}>
                      {post.author.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span style={{ fontSize: '0.8rem' }}>{post.author.name}</span>
                </Link>
              )}
              {date && <span>{date}</span>}
              {readTime > 0 && (
                <>
                  <span style={{ opacity: 0.35 }}>·</span>
                  <span>{readTime} 分钟阅读</span>
                </>
              )}
            </div>
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', marginBottom: '1rem' }}>
                {post.tags.map(tag => (
                  <Link key={tag.id} href={`/tag/${tag.slug}`} style={{
                    fontSize: '0.75rem', padding: '0.2rem 0.625rem',
                    borderRadius: '99px', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)', textDecoration: 'none',
                    transition: 'border-color 0.15s, color 0.15s',
                  } as CSSProperties}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-text)'; el.style.color = 'var(--color-text)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-text-secondary)' }}
                  >#{tag.name}</Link>
                ))}
              </div>
            )}
          </header>

          {/* Article body */}
          <div
            className="prose"
            style={{ lineHeight: 1.85, fontSize: '1.0625rem', color: 'var(--color-text)' }}
            dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
          />

          {/* Share buttons */}
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>分享：</span>
            <ShareButton href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} label="Twitter / X" />
            <ShareButton href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} label="Facebook" />
            <CopyLinkButton />
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <section style={{ marginTop: '4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>相关文章</h2>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: '1.25rem' }}>
                {related.map(p => <PostCard key={p.id} post={p} />)}
              </div>
            </section>
          )}

          {/* Footer nav */}
          <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
            <Link href="/" style={{
              fontSize: '0.875rem', color: 'var(--color-text-secondary)',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              transition: 'color 0.15s',
            }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)')}
            >
              ← 返回首页
            </Link>
          </div>
        </div>

        {/* TOC sidebar */}
        <aside className="post-toc" style={{
          position: 'sticky', top: '80px',
          maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
          paddingLeft: '1.5rem',
          borderLeft: '1px solid var(--color-border)',
        }}>
          <TableOfContents />
        </aside>
      </div>
    </main>
  )
}

function ShareButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '0.3rem 0.75rem', borderRadius: '6px',
      border: '1px solid var(--color-border)',
      fontSize: '0.75rem', fontWeight: 500,
      color: 'var(--color-text-secondary)', textDecoration: 'none',
      transition: 'border-color 0.15s, color 0.15s',
    }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-text)'; el.style.color = 'var(--color-text)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-text-secondary)' }}
    >{label}</a>
  )
}

function CopyLinkButton() {
  return (
    <button onClick={() => {
      navigator.clipboard.writeText(window.location.href)
        .then(() => { /* copied */ })
        .catch(() => { /* ignore */ })
    }} style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '0.3rem 0.75rem', borderRadius: '6px',
      border: '1px solid var(--color-border)',
      fontSize: '0.75rem', fontWeight: 500,
      color: 'var(--color-text-secondary)',
      background: 'none', cursor: 'pointer',
      transition: 'border-color 0.15s, color 0.15s',
    }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-text)'; el.style.color = 'var(--color-text)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-text-secondary)' }}
    >复制链接</button>
  )
}
