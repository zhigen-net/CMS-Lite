'use client'

import Link from 'next/link'

interface Props {
  page: number
  totalPages: number
  total: number
  pageSize: number
  buildHref: (page: number) => string
  /** compact mode for admin */
  compact?: boolean
}

function pageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}

export default function PaginationNav({ page, totalPages, total, pageSize, buildHref, compact = false }: Props) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const pages = pageRange(page, totalPages)

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: compact ? '30px' : '36px', height: compact ? '30px' : '36px',
    padding: '0 6px',
    borderRadius: '7px', fontSize: compact ? '12px' : '13px',
    fontWeight: 500, textDecoration: 'none',
    border: compact ? '1px solid #e4e4e7' : '1px solid var(--color-border, #e4e4e7)',
    background: compact ? '#fff' : 'var(--color-bg, #fff)',
    color: compact ? '#52525b' : 'var(--color-text-secondary, #52525b)',
    transition: 'all 0.1s', cursor: 'pointer',
  }

  const activeBtn: React.CSSProperties = {
    ...btnBase,
    background: compact ? '#18181b' : 'var(--color-text, #18181b)',
    color: compact ? '#fff' : 'var(--color-bg, #fff)',
    borderColor: compact ? '#18181b' : 'var(--color-text, #18181b)',
  }

  const disabledBtn: React.CSSProperties = {
    ...btnBase, opacity: 0.35, pointerEvents: 'none',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: compact ? 'flex-end' : 'space-between',
      flexWrap: 'wrap', gap: '0.75rem',
      marginTop: compact ? '1rem' : '3rem',
    }}>
      {!compact && (
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary, #71717a)' }}>
          显示 {from}–{to}，共 {total} 篇
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Prev */}
        {page > 1
          ? <Link href={buildHref(page - 1)} style={btnBase}>←</Link>
          : <span style={disabledBtn}>←</span>
        }

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} style={{ ...btnBase, border: 'none', background: 'none', cursor: 'default', color: '#a1a1aa' }}>…</span>
            : <Link key={p} href={buildHref(p)} style={p === page ? activeBtn : btnBase}>{p}</Link>
        )}

        {/* Next */}
        {page < totalPages
          ? <Link href={buildHref(page + 1)} style={btnBase}>→</Link>
          : <span style={disabledBtn}>→</span>
        }
      </div>
    </div>
  )
}
