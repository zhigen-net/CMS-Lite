'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { SiteSettings, NavItem } from '@/types'
import { MenuIcon, XIcon, SearchIcon } from '@/components/icons'

interface Props { settings: Partial<SiteSettings> }

export default function Header({ settings }: Props) {
  const siteName = (settings['site.name'] as string) || 'AI CMS'
  const logo = settings['site.logo'] as string | null
  const navItems = (settings['nav.main'] as NavItem[]) || []
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: scrolled ? 'var(--color-bg)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'all 0.2s',
      }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: '60px', gap: '2rem' }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            {logo
              ? <img src={logo} alt={siteName} style={{ height: '28px', width: 'auto' }} />
              : <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-text)', letterSpacing: '-0.03em' }}>{siteName}</span>
            }
          </Link>

          {/* Desktop nav */}
          {navItems.length > 0 && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flex: 1 }}>
              {navItems.map(item => (
                <Link
                  key={item.id}
                  href={item.url}
                  target={item.target}
                  style={{
                    padding: '0.375rem 0.75rem', borderRadius: '6px',
                    fontSize: '0.875rem', color: 'var(--color-text-secondary)',
                    textDecoration: 'none', transition: 'color 0.15s, background 0.15s',
                    fontWeight: 500,
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--color-text)'; el.style.background = 'var(--color-bg-secondary)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--color-text-secondary)'; el.style.background = 'transparent' }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <div style={{ flex: 1 }} />

          {/* Search icon */}
          <Link href="/search" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '8px',
            color: 'var(--color-text-secondary)', textDecoration: 'none',
            transition: 'color 0.15s, background 0.15s',
          }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--color-text)'; el.style.background = 'var(--color-bg-secondary)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--color-text-secondary)'; el.style.background = 'transparent' }}
            title="搜索"
          >
            <SearchIcon size={18} />
          </Link>

          {/* Desktop admin link */}
          <Link href="/admin" style={{
            fontSize: '0.8rem', color: 'var(--color-text-secondary)',
            textDecoration: 'none', padding: '0.375rem 0.75rem',
            border: '1px solid var(--color-border)', borderRadius: '6px',
            transition: 'all 0.15s', display: 'none',
          }} className="header-admin-link">
            管理
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.375rem', color: 'var(--color-text)',
              lineHeight: 0, display: 'flex', alignItems: 'center',
            }}
            className="header-menu-btn"
          >
            {open ? <XIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
        <style>{`
          @media(min-width:768px){
            .header-menu-btn{display:none!important}
            .header-admin-link{display:flex!important;align-items:center}
          }
        `}</style>
      </header>

      {/* Mobile menu overlay */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 39,
          background: 'var(--color-bg)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Overlay top bar */}
          <div style={{
            height: '60px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 1.5rem',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <Link href="/" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
              {logo
                ? <img src={logo} alt={siteName} style={{ height: '28px', width: 'auto' }} />
                : <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-text)', letterSpacing: '-0.03em' }}>{siteName}</span>
              }
            </Link>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', color: 'var(--color-text)', lineHeight: 0 }}
            >
              <XIcon size={22} />
            </button>
          </div>
          {/* Scrollable nav */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1.5rem 2rem' }}>
            {navItems.map(item => (
              <Link
                key={item.id}
                href={item.url}
                target={item.target}
                style={{
                  display: 'flex', alignItems: 'center', padding: '1rem 0',
                  fontSize: '1.2rem', fontWeight: 600,
                  color: 'var(--color-text)', textDecoration: 'none',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/admin" style={{
              display: 'flex', alignItems: 'center', padding: '1rem 0',
              fontSize: '0.95rem', color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}>
              管理后台
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
