'use client'

import Link from 'next/link'
import type { Content, User } from '@/types'
import PostCard from './PostCard'
import PaginationNav from '@/components/PaginationNav'
import { ArrowLeftIcon } from '@/components/icons'

interface Pagination { page: number; totalPages: number; total: number; pageSize: number }

interface Props {
  author: User
  posts: Content[]
  pagination: Pagination
}

const ROLE_LABEL: Record<string, string> = {
  admin: '管理员',
  editor: '编辑',
  author: '作者',
  subscriber: '订阅者',
}

export default function AuthorArchive({ author, posts, pagination }: Props) {
  const initials = author.name.slice(0, 2).toUpperCase()

  return (
    <main style={{ minHeight: '80vh' }}>
      {/* Author header */}
      <div style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        padding: 'clamp(2.5rem, 6vw, 4rem) 1.5rem 2rem',
      }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            fontSize: '0.8rem', color: 'var(--color-text-secondary)',
            textDecoration: 'none', marginBottom: '2rem',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)')}
          >
            <ArrowLeftIcon size={13} />返回首页
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} style={{
                width: '72px', height: '72px', borderRadius: '50%',
                objectFit: 'cover', flexShrink: 0,
                border: '3px solid var(--color-border)',
              }} />
            ) : (
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--color-primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)',
              }}>
                {initials}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--color-text-secondary)',
                }}>作者</span>
                <span style={{
                  fontSize: '0.65rem', padding: '0.1rem 0.5rem', borderRadius: '99px',
                  border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)',
                }}>{ROLE_LABEL[author.role] ?? author.role}</span>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                fontWeight: 900, lineHeight: 1.2,
                letterSpacing: '-0.03em', color: 'var(--color-text)',
                margin: '0 0 0.375rem',
              }}>
                {author.name}
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                共 {pagination.total} 篇文章
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Post grid */}
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-text-secondary)' }}>
            <p style={{ fontSize: '0.875rem' }}>该作者暂无已发布文章</p>
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
              buildHref={p => p === 1 ? `/author/${author.id}` : `/author/${author.id}?page=${p}`}
            />
          </>
        )}
      </div>
    </main>
  )
}
