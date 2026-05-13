'use client'

import Link from 'next/link'
import type { Content, Category } from '@/types'
import { formatDate, estimateReadingTime } from '@/lib/utils'

interface Props {
  post: Content
  featured?: boolean
  category?: Category
}

export default function PostCard({ post, featured = false, category }: Props) {
  const href = post.type === 'page' ? `/${post.slug}` : `/post/${post.slug}`
  const readTime = post.content ? estimateReadingTime(post.content) : 0
  const date = post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)
  const cat = category ?? post.categories?.[0]

  if (featured) {
    return (
      <article className="featured-card" style={{
        display: 'grid',
        gridTemplateColumns: post.cover_image ? '1fr 1fr' : '1fr',
        borderRadius: '16px', overflow: 'hidden',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}>
        <style>{`
          @media(max-width:640px){
            .featured-card{grid-template-columns:1fr!important}
            .featured-card-img{aspect-ratio:16/7!important;max-height:220px}
          }
        `}</style>
        {post.cover_image && (
          <Link href={href} className="featured-card-img" style={{ display: 'block', overflow: 'hidden', aspectRatio: '16/9' }}>
            <img
              src={post.cover_image} alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.03)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
            />
          </Link>
        )}
        <div style={{
          padding: '2.5rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--color-primary)',
            }}>精选</span>
            {cat && (
              <Link href={`/category/${cat.slug}`} style={{
                fontSize: '0.7rem', fontWeight: 600,
                padding: '0.15rem 0.5rem', borderRadius: '99px',
                background: 'var(--color-primary)', color: '#fff',
                textDecoration: 'none',
              }}>{cat.name}</Link>
            )}
            {post.ai_generated && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem',
                borderRadius: '4px', border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}>AI</span>
            )}
          </div>
          <Link href={href} style={{ textDecoration: 'none' }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
              fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em',
              color: 'var(--color-text)', marginBottom: '0.875rem',
              transition: 'color 0.15s',
            }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-primary)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text)')}
            >
              {post.title}
            </h2>
          </Link>
          {post.excerpt && (
            <p style={{
              color: 'var(--color-text-secondary)', lineHeight: 1.75,
              fontSize: '0.95rem', marginBottom: '1.5rem',
            }}>
              {post.excerpt}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.875rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{date}</span>
            {readTime > 0 && <><span style={{ opacity: 0.4 }}>·</span><span>{readTime} 分钟阅读</span></>}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article style={{
      borderRadius: '12px', overflow: 'hidden',
      border: '1px solid var(--color-border)',
      background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; el.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'none'; el.style.transform = 'translateY(0)' }}
    >
      {post.cover_image ? (
        <Link href={href} style={{ display: 'block', overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={post.cover_image} alt={post.title}
            style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.04)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
          />
        </Link>
      ) : (
        /* Placeholder when no cover */
        <Link href={href} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '120px', flexShrink: 0,
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, transparent), color-mix(in srgb, var(--color-primary) 4%, transparent))',
          fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)',
          color: 'var(--color-primary)', opacity: 0.7,
          textDecoration: 'none',
        }}>
          {post.title.slice(0, 1)}
        </Link>
      )}

      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Category + AI badge row */}
        {(cat || post.ai_generated) && (
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {cat && (
              <Link href={`/category/${cat.slug}`} style={{
                fontSize: '0.68rem', fontWeight: 600,
                padding: '0.15rem 0.5rem', borderRadius: '99px',
                background: 'var(--color-primary)', color: '#fff',
                textDecoration: 'none', letterSpacing: '0.01em',
              }}>{cat.name}</Link>
            )}
            {post.ai_generated && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem',
                borderRadius: '4px', border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}>AI</span>
            )}
          </div>
        )}

        <Link href={href} style={{ textDecoration: 'none', flex: 1 }}>
          <h3 style={{
            fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700,
            lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--color-text)',
            marginBottom: '0.5rem', transition: 'color 0.15s',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-primary)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text)')}
          >
            {post.title}
          </h3>
          {post.excerpt && (
            <p style={{
              color: 'var(--color-text-secondary)', lineHeight: 1.65, fontSize: '0.875rem',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}>
              {post.excerpt}
            </p>
          )}
        </Link>

        <div style={{
          display: 'flex', gap: '0.75rem', fontSize: '0.75rem',
          color: 'var(--color-text-secondary)', alignItems: 'center',
          marginTop: '0.5rem', paddingTop: '0.875rem',
          borderTop: '1px solid var(--color-border)',
        }}>
          <span>{date}</span>
          {readTime > 0 && <><span style={{ opacity: 0.4 }}>·</span><span>{readTime} 分钟</span></>}
        </div>
      </div>
    </article>
  )
}
