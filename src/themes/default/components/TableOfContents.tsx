'use client'

import { useEffect, useState } from 'react'

interface TocItem { id: string; text: string; level: number }

export default function TableOfContents({ contentSelector = '.prose' }: { contentSelector?: string }) {
  const [items, setItems] = useState<TocItem[]>([])
  const [active, setActive] = useState<string>('')

  useEffect(() => {
    const container = document.querySelector(contentSelector)
    if (!container) return

    const headings = Array.from(container.querySelectorAll('h2, h3, h4')) as HTMLElement[]
    const toc: TocItem[] = headings.map((h, i) => {
      if (!h.id) h.id = `toc-${i}`
      return { id: h.id, text: h.textContent || '', level: parseInt(h.tagName[1]) }
    })
    setItems(toc)

    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) { setActive(e.target.id); break }
        }
      },
      { rootMargin: '-60px 0px -60% 0px', threshold: 0 }
    )
    headings.forEach(h => observer.observe(h))
    return () => observer.disconnect()
  }, [contentSelector])

  if (items.length < 2) return null

  return (
    <nav style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
      <p style={{
        fontWeight: 700, color: 'var(--color-text)',
        marginBottom: '0.75rem', fontSize: '0.75rem',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>目录</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map(item => (
          <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 0.875}rem` }}>
            <a
              href={`#${item.id}`}
              style={{
                display: 'block',
                padding: '0.2rem 0',
                color: active === item.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontWeight: active === item.id ? 600 : 400,
                transition: 'color 0.15s',
                borderLeft: `2px solid ${active === item.id ? 'var(--color-primary)' : 'transparent'}`,
                paddingLeft: `${(item.level - 2) * 0.875 + 0.625}rem`,
              }}
              onClick={e => {
                e.preventDefault()
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
