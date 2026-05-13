'use client'

import Link from 'next/link'
import type { SiteSettings, NavItem } from '@/types'

interface Props { settings: Partial<SiteSettings> }

export default function Footer({ settings }: Props) {
  const siteName = (settings['site.name'] as string) || 'AI CMS'
  const siteDesc = settings['site.description'] as string | null
  const navItems = (settings['nav.footer'] as NavItem[]) || (settings['nav.main'] as NavItem[]) || []
  const year = new Date().getFullYear()

  return (
    <footer style={{ borderTop: '1px solid var(--color-border)', marginTop: '6rem' }}>
      <style>{`
        .footer-grid { display: grid; grid-template-columns: 1fr auto; gap: 3rem; margin-bottom: 3rem; align-items: start; }
        .footer-nav { display: flex; flex-direction: column; gap: 0.625rem; align-items: flex-end; }
        @media(max-width:640px){
          .footer-grid { grid-template-columns: 1fr; gap: 2rem; }
          .footer-nav { align-items: flex-start; flex-direction: row; flex-wrap: wrap; gap: 0.75rem 1.25rem; }
        }
      `}</style>
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '3rem 1.5rem 2.5rem' }}>
        <div className="footer-grid">
          <div style={{ maxWidth: '320px' }}>
            <Link href="/" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text)', textDecoration: 'none', letterSpacing: '-0.02em', display: 'block', marginBottom: '0.625rem' }}>
              {siteName}
            </Link>
            {siteDesc && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                {siteDesc}
              </p>
            )}
          </div>
          {navItems.length > 0 && (
            <nav className="footer-nav">
              {navItems.map(item => (
                <Link
                  key={item.id}
                  href={item.url}
                  target={item.target}
                  style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)')}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)',
          flexWrap: 'wrap', gap: '0.5rem',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            © {year} {siteName}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Powered by <Link href="/admin" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>AI CMS</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
