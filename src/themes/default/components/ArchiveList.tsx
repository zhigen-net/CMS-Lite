'use client'

import Link from 'next/link'
import type { Content, Category, Tag } from '@/types'
import PostCard from './PostCard'
import { ArrowLeftIcon } from '@/components/icons'
import PaginationNav from '@/components/PaginationNav'

interface Pagination { page: number; totalPages: number; total: number; pageSize: number }

interface Props {
  title: string
  slug: string
  description?: string | null
  posts: Content[]
  type: 'category' | 'tag'
  pagination: Pagination
  siblings?: Category[] | Tag[]
}

export default function ArchiveList({ title, slug, description, posts, type, pagination, siblings = [] }: Props) {
  return (
    <main style={{ minHeight: '80vh' }}>
      {/* Archive header */}
      <div style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}>
        <div style={{
          maxWidth: 'var(--max-width)', margin: '0 auto',
          padding: 'clamp(2.5rem, 6vw, 4rem) 1.5rem 0',
        }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            fontSize: '0.8rem', color: 'var(--color-text-secondary)',
            textDecoration: 'none', marginBottom: '1.5rem',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)')}
          >
            <ArrowLeftIcon size={13} />
            返回首页
          </Link>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            }}>
              {type === 'category' ? '分类' : '标签'}
            </span>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
              fontWeight: 900, lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: 'var(--color-text)',
            }}>
              {type === 'tag' ? '#' : ''}{title}
            </h1>
          </div>

          {description && (
            <p style={{
              fontSize: '1rem', color: 'var(--color-text-secondary)',
              lineHeight: 1.7, maxWidth: '560px', marginBottom: '0.5rem',
            }}>
              {description}
            </p>
          )}

          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', opacity: 0.5, marginBottom: '1.25rem' }}>
            {pagination.total} 篇文章
          </p>
        </div>

        {/* Sibling nav (category switcher or tag cloud) */}
        {siblings.length > 0 && (
          <div style={{
            maxWidth: 'var(--max-width)', margin: '0 auto',
            padding: '0 1.5rem',
            overflowX: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem',
            scrollbarWidth: 'none',
          } as React.CSSProperties}>
            {siblings.map(s => {
              const active = s.slug === slug
              const href = type === 'category'
                ? `/category/${s.slug}`
                : `/tag/${s.slug}`
              return (
                <Link
                  key={s.id}
                  href={href}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem', fontWeight: active ? 600 : 400,
                    color: active ? 'var(--color-text)' : 'var(--color-text-secondary)',
                    textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                    borderBottom: active ? '2px solid var(--color-text)' : '2px solid transparent',
                    transition: 'color 0.15s',
                  }}
                >
                  {type === 'tag' ? '#' : ''}{s.name}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Post grid */}
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-text-secondary)' }}>
            <p style={{ fontSize: '0.875rem' }}>暂无文章</p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
              gap: '1.5rem',
            }}>
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
            <PaginationNav
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={pagination.pageSize}
              buildHref={p => {
                const base = type === 'category' ? `/category/${slug}` : `/tag/${slug}`
                return p === 1 ? base : `${base}?page=${p}`
              }}
            />
          </>
        )}
      </div>
    </main>
  )
}
