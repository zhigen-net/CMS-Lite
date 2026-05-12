'use client'

import Link from 'next/link'
import type { Content, SiteSettings, Category } from '@/types'
import PostCard from './components/PostCard'
import PaginationNav from '@/components/PaginationNav'

interface Pagination { page: number; totalPages: number; total: number; pageSize: number }

interface Props {
  posts: Content[]
  settings: SiteSettings
  categories?: Category[]
  categoryMap?: Record<string, Category>
  pagination?: Pagination
}

export default function DefaultHome({ posts, settings, categories = [], categoryMap = {}, pagination }: Props) {
  const siteName = settings['site.name'] as string
  const siteDesc = settings['site.description'] as string | null

  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <main>
      {/* Hero — compact when posts exist */}
      <section style={{
        padding: posts.length > 0
          ? 'clamp(2.5rem, 6vw, 4rem) 1.5rem clamp(2rem, 5vw, 3rem)'
          : 'clamp(4rem, 10vw, 7rem) 1.5rem',
        textAlign: 'center',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: posts.length > 0
              ? 'clamp(1.75rem, 5vw, 2.75rem)'
              : 'clamp(2.25rem, 6vw, 4rem)',
            fontWeight: 900, lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'var(--color-text)',
            marginBottom: siteDesc ? '0.875rem' : 0,
          }}>
            {siteName}
          </h1>
          {siteDesc && (
            <p style={{
              fontSize: posts.length > 0 ? '1rem' : 'clamp(1rem, 2.5vw, 1.2rem)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
            }}>
              {siteDesc}
            </p>
          )}
        </div>
      </section>

      {/* Category filter nav */}
      {categories.length > 0 && (
        <div style={{
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          position: 'sticky', top: '60px', zIndex: 10,
        }}>
          <div style={{
            maxWidth: 'var(--max-width)', margin: '0 auto',
            padding: '0 1.5rem',
            overflowX: 'auto',
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            scrollbarWidth: 'none',
          } as React.CSSProperties}>
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem', fontWeight: 600,
              color: 'var(--color-text)',
              textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              borderBottom: '2px solid var(--color-text)',
            }}>
              全部
            </Link>
            {categories.map(cat => (
              <Link key={cat.id} href={`/category/${cat.slug}`} style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem', fontWeight: 400,
                color: 'var(--color-text-secondary)',
                textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                borderBottom: '2px solid transparent',
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)' }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '3.5rem 1.5rem 5rem' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--color-text-secondary)' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>暂无内容</p>
            <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>还没有发布任何文章</p>
            <Link href="/admin" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.6rem 1.25rem',
              fontSize: '0.875rem', fontWeight: 500,
              border: '1px solid var(--color-border)', borderRadius: '8px',
              color: 'var(--color-text)', textDecoration: 'none',
              transition: 'background 0.15s',
            }}>
              前往后台发布 →
            </Link>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <section style={{ marginBottom: '4rem' }}>
                <PostCard post={featured} featured category={categoryMap[featured.categories?.[0]?.id ?? '']} />
              </section>
            )}

            {/* Rest of posts */}
            {rest.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700,
                    color: 'var(--color-text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap',
                  }}>最新文章</h2>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    共 {pagination?.total ?? rest.length + 1} 篇
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
                  gap: '1.5rem',
                }}>
                  {rest.map(post => (
                    <PostCard key={post.id} post={post} category={categoryMap[post.categories?.[0]?.id ?? '']} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {pagination && pagination.totalPages > 1 && (
          <PaginationNav
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.pageSize}
            buildHref={p => p === 1 ? '/' : `/?page=${p}`}
          />
        )}
      </div>
    </main>
  )
}
