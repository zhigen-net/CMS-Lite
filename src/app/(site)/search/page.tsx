import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContents, getCategories } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import type { Metadata } from 'next'
import type { Category } from '@/types'
import PostCard from '@/themes/default/components/PostCard'
import PaginationNav from '@/components/PaginationNav'
import SearchBox from './SearchBox'

interface Props { searchParams: Promise<{ q?: string; page?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return { title: q ? `搜索"${q}"` : '搜索', robots: 'noindex' }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const query = q.trim()

  const { env } = getCloudflareContext()

  const [settings, categories, result] = await Promise.all([
    getSiteSettings(env.DB),
    getCategories(env.DB, 'post'),
    query
      ? getContents(env.DB, { type: 'post', status: 'published', search: query, page, pageSize: 12 })
      : Promise.resolve({ items: [], pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 } }),
  ])

  void settings
  const categoryMap = Object.fromEntries((categories as Category[]).map(c => [c.id, c]))
  const { items: posts, pagination } = result

  return (
    <main style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: 900, letterSpacing: '-0.03em',
          color: 'var(--color-text)', marginBottom: '1.5rem',
        }}>搜索</h1>
        <SearchBox defaultValue={query} />
      </div>

      {/* Results */}
      {query && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem',
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {pagination.total > 0
                ? <>找到 <strong style={{ color: 'var(--color-text)' }}>{pagination.total}</strong> 篇与 <strong style={{ color: 'var(--color-text)' }}>"{query}"</strong> 相关的文章</>
                : <>没有找到与 <strong style={{ color: 'var(--color-text)' }}>"{query}"</strong> 相关的文章</>
              }
            </p>
          </div>

          {posts.length > 0 ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem',
              }}>
                {posts.map(post => (
                  <PostCard key={post.id} post={post} category={categoryMap[post.categories?.[0]?.id ?? '']} />
                ))}
              </div>

              <PaginationNav
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                pageSize={pagination.pageSize}
                buildHref={p => `/search?q=${encodeURIComponent(query)}&page=${p}`}
              />
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-text-secondary)' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>未找到相关内容</p>
              <p style={{ fontSize: '0.875rem' }}>换个关键词试试吧</p>
            </div>
          )}
        </>
      )}

      {!query && (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-text-secondary)' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>输入关键词开始搜索</p>
          <p style={{ fontSize: '0.875rem' }}>支持标题、摘要和正文全文检索</p>
        </div>
      )}
    </main>
  )
}
