import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCategories, getTagsWithCount } from '@/lib/db'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: '全部分类' }

export default async function CategoriesIndexPage() {
  const { env } = getCloudflareContext()
  const [categories, tags] = await Promise.all([
    getCategories(env.DB, 'post'),
    getTagsWithCount(env.DB),
  ])
  const topTags = tags.filter(t => t.count > 0).sort((a, b) => b.count - a.count).slice(0, 30)

  return (
    <main style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: 'clamp(2.5rem,6vw,4rem) 1.5rem 6rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem,5vw,2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--color-text)', marginBottom: '3rem' }}>
        探索内容
      </h1>

      {/* Categories */}
      {categories.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>分类</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px,100%),1fr))', gap: '0.75rem' }}>
            {categories.map(cat => (
              <Link key={cat.id} href={`/category/${cat.slug}`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                textDecoration: 'none', color: 'var(--color-text)',
                transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                boxShadow: 'var(--shadow-sm)',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-primary)'; el.style.boxShadow = 'var(--shadow-md)'; el.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.boxShadow = 'var(--shadow-sm)'; el.style.transform = 'none' }}
              >
                <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{cat.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tags */}
      {topTags.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>热门标签</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
            {topTags.map(tag => (
              <Link key={tag.id} href={`/tag/${tag.slug}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.4rem 0.875rem', borderRadius: '99px',
                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                fontSize: '0.875rem', color: 'var(--color-text-secondary)',
                textDecoration: 'none', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-primary)'; el.style.color = 'var(--color-primary)'; el.style.background = 'color-mix(in srgb, var(--color-primary) 8%, var(--color-bg))' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-text-secondary)'; el.style.background = 'var(--color-bg)' }}
              >
                <span style={{ opacity: 0.5, fontSize: '0.8em' }}>#</span>
                {tag.name}
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{tag.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
