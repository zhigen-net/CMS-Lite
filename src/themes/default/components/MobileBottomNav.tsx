'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, SearchIcon, FolderIcon } from '@/components/icons'

export default function MobileBottomNav() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: '首页', Icon: HomeIcon, exact: true },
    { href: '/search', label: '搜索', Icon: SearchIcon },
    { href: '/category', label: '分类', Icon: FolderIcon },
  ]

  return (
    <>
      <style>{`
        .mobile-bottom-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 30;
          background: var(--color-bg);
          border-top: 1px solid var(--color-border);
          padding-bottom: env(safe-area-inset-bottom);
          backdrop-filter: blur(16px) saturate(160%);
          -webkit-backdrop-filter: blur(16px) saturate(160%);
        }
        @media(prefers-color-scheme:dark){
          .mobile-bottom-nav { background: rgba(15,23,42,0.92); }
        }
        @media(max-width:767px){ .mobile-bottom-nav { display: flex; } }
        .mobile-nav-item { flex: 1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; padding:10px 0 8px; text-decoration:none; font-size:10px; font-weight:500; color:var(--color-text-muted); transition:color 0.15s; }
        .mobile-nav-item.active { color:var(--color-primary); }
        .mobile-nav-item:hover { color:var(--color-text); }
        /* Push page content above bottom nav on mobile */
        @media(max-width:767px){ body { padding-bottom: calc(64px + env(safe-area-inset-bottom)); } }
        /* Push back-to-top button above nav */
        @media(max-width:767px){ button[aria-label="回到顶部"] { bottom: calc(5rem + env(safe-area-inset-bottom)) !important; right: 1rem !important; } }
      `}</style>
      <nav className="mobile-bottom-nav">
        {links.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`mobile-nav-item${active ? ' active' : ''}`}>
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
