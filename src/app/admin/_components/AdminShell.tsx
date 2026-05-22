'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeIcon, FileTextIcon, FilesIcon, ImageIcon, BotIcon,
  PaletteIcon, SettingsIcon, ExternalLinkIcon,
  MenuIcon, XIcon, UsersIcon, UserIcon, KeyIcon, LogOutIcon,
  FolderIcon, TagIcon, ClipboardIcon, LayersIcon,
} from '@/components/icons'

type NavItem = { href: string; label: string; icon: React.FC<{ size?: number }>; exact?: boolean }
type NavGroup = { group: string; items: NavItem[] }
type NavEntry = NavItem | NavGroup

const NAV: NavEntry[] = [
  { href: '/admin', label: '概览', icon: HomeIcon, exact: true },
  { href: '/admin/ai', label: 'AI 运营', icon: BotIcon },
  {
    group: '内容',
    items: [
      { href: '/admin/post', label: '文章', icon: FileTextIcon },
      { href: '/admin/page', label: '页面', icon: FilesIcon },
      { href: '/admin/content-types', label: '内容类型', icon: LayersIcon },
    ],
  },
  {
    group: '管理',
    items: [
      { href: '/admin/categories', label: '分类', icon: FolderIcon },
      { href: '/admin/tags', label: '标签', icon: TagIcon },
      { href: '/admin/media', label: '媒体', icon: ImageIcon },
      { href: '/admin/forms', label: '表单', icon: ClipboardIcon },
    ],
  },
  {
    group: '系统',
    items: [
      { href: '/admin/users', label: '用户', icon: UsersIcon },
      { href: '/admin/appearance', label: '外观', icon: PaletteIcon },
      { href: '/admin/settings', label: '设置', icon: SettingsIcon },
    ],
  },
]

const s = {
  sidebar: {
    width: 210,
    bg: '#fff',
    border: '#ebebeb',
    text: '#6b7280',
    textActive: '#111827',
    bgActive: '#f3f4f6',
    bgHover: '#f9fafb',
    brand: '#111827',
  },
  main: { bg: '#f5f5f5' },
}

interface Me { id: string; name: string; email: string; role: string }

function UserMenu() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/users/me').then(r => r.json()).then((d: unknown) => {
      const data = d as Me; setMe(data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (
        btnRef.current?.contains(e.target as Node) ||
        dropRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const toggleOpen = useCallback(() => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.top, left: r.left, width: r.width })
    }
    setOpen(o => !o)
  }, [open])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }


  if (!me) return null

  const initials = (me.name || me.email || '?').slice(0, 1).toUpperCase()

  const dropdownEl = open ? createPortal(
    <div ref={dropRef} style={{
      position: 'fixed',
      left: dropPos.left,
      top: dropPos.top - 8,
      width: dropPos.width,
      transform: 'translateY(-100%)',
      background: '#fff', border: '1px solid #e8e8e8',
      borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      padding: '4px', zIndex: 9999,
    }}>
      {[
        { icon: UserIcon, label: '修改资料', href: '/admin/account?tab=profile' },
        { icon: KeyIcon,  label: '修改密码', href: '/admin/account?tab=password' },
        { icon: KeyIcon,  label: 'API 管理', href: '/admin/account?tab=apikeys' },
      ].map(({ icon: Icon, label, href }) => (
        <a key={label} href={href} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 10px', borderRadius: '6px', border: 'none',
          background: 'none', cursor: 'pointer', fontSize: '13px', color: '#374151',
          textDecoration: 'none',
        }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#f4f4f5')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
        >
          <Icon size={13} />{label}
        </a>
      ))}
      <div style={{ height: '1px', background: '#f0f0f0', margin: '3px 4px' }} />
      <button onClick={logout} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
        padding: '7px 10px', borderRadius: '6px', border: 'none',
        background: 'none', cursor: 'pointer', fontSize: '13px', color: '#dc2626',
      }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#fef2f2')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
      >
        <LogOutIcon size={13} />退出登录
      </button>
    </div>,
    document.body
  ) : null

  return (
    <>
      <button ref={btnRef} onClick={toggleOpen} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
        padding: '7px 8px', borderRadius: '8px', border: 'none',
        background: open ? '#f3f4f6' : 'transparent',
        cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.12s',
      }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: '#18181b', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {me.name || me.email}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
            {me.role === 'admin' ? '管理员' : me.role === 'editor' ? '编辑' : '作者'}
          </div>
        </div>
      </button>
      {dropdownEl}
    </>
  )
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Collapsed state per group; default: expand group containing current page
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const result: Record<string, boolean> = {}
    for (const entry of NAV) {
      if ('group' in entry) {
        const hasActive = entry.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
        result[entry.group] = !hasActive
      }
    }
    return result
  })

  function toggleGroup(group: string) {
    setCollapsed(prev => ({ ...prev, [group]: !prev[group] }))
  }

  useEffect(() => { setOpen(false) }, [pathname])

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: s.main.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @media (min-width: 960px) {
          .adm-sidebar { transform: translateX(0) !important; position: sticky !important; height: 100vh !important; }
          .adm-overlay { display: none !important; }
          .adm-topbar { display: none !important; }
        }
        @media (max-width: 959px) {
          .adm-sidebar { position: fixed !important; z-index: 50; height: 100vh !important; box-shadow: 4px 0 32px rgba(0,0,0,0.3); }
        }
        .adm-nav-item:hover { background: ${s.sidebar.bgHover} !important; color: ${s.sidebar.textActive} !important; }
        .adm-group-btn:hover { background: ${s.sidebar.bgHover} !important; color: #374151 !important; }
      `}</style>

      {/* Overlay */}
      {open && (
        <div className="adm-overlay" onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 40, backdropFilter: 'blur(1px)' }} />
      )}

      {/* Sidebar */}
      <aside className="adm-sidebar" style={{
        width: s.sidebar.width, flexShrink: 0,
        background: s.sidebar.bg,
        borderRight: `1px solid ${s.sidebar.border}`,
        display: 'flex', flexDirection: 'column',
        top: 0,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.22s ease',
      }}>
        {/* Brand */}
        <div style={{ padding: '16px 14px 12px', borderBottom: `1px solid ${s.sidebar.border}` }}>
          <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
              <BotIcon size={14} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: s.sidebar.brand, letterSpacing: '-0.02em' }}>
              AI CMS
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 8px 8px', overflowY: 'auto' }}>
          {NAV.map((entry, idx) => {
            if ('group' in entry) {
              const isCollapsed = collapsed[entry.group] ?? false
              const hasActive = entry.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
              return (
                <div key={entry.group} style={{ marginTop: idx === 0 ? 0 : '2px' }}>
                  <button
                    className="adm-group-btn"
                    onClick={() => toggleGroup(entry.group)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '6px 8px', border: 'none', borderRadius: '7px',
                      background: 'transparent', cursor: 'pointer',
                      color: hasActive ? '#374151' : '#9ca3af',
                      transition: 'background 0.12s, color 0.12s',
                    }}
                  >
                    <span style={{ fontSize: '11.5px', fontWeight: 500, letterSpacing: '0.01em' }}>
                      {entry.group}
                    </span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transition: 'transform 0.2s ease', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', flexShrink: 0, opacity: 0.6 }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div style={{
                    overflow: 'hidden',
                    maxHeight: isCollapsed ? 0 : `${entry.items.length * 34}px`,
                    transition: 'max-height 0.22s ease',
                  }}>
                    {entry.items.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href || pathname.startsWith(href + '/')
                      return (
                        <Link key={href} href={href} className={active ? '' : 'adm-nav-item'} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '6px 8px', borderRadius: '7px', marginBottom: '1px',
                          textDecoration: 'none', fontSize: '13.5px', fontWeight: active ? 500 : 400,
                          color: active ? s.sidebar.textActive : s.sidebar.text,
                          background: active ? s.sidebar.bgActive : 'transparent',
                          transition: 'background 0.12s, color 0.12s',
                        }}>
                          <span style={{ lineHeight: 0, color: active ? '#374151' : '#9ca3af' }}><Icon size={15} /></span>
                          {label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            }
            const { href, label, icon: Icon, exact } = entry
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} className={active ? '' : 'adm-nav-item'} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 8px', borderRadius: '7px', marginBottom: '1px',
                textDecoration: 'none', fontSize: '13.5px', fontWeight: active ? 500 : 400,
                color: active ? s.sidebar.textActive : s.sidebar.text,
                background: active ? s.sidebar.bgActive : 'transparent',
                transition: 'background 0.12s, color 0.12s',
              }}>
                <span style={{ lineHeight: 0, color: active ? '#374151' : '#9ca3af' }}><Icon size={15} /></span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '8px', borderTop: `1px solid ${s.sidebar.border}` }}>
          <Link href="/" target="_blank" style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            fontSize: '12px', color: '#9ca3af', textDecoration: 'none',
            padding: '6px 8px', borderRadius: '7px', marginBottom: '4px',
            transition: 'color 0.12s, background 0.12s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#374151'; (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <ExternalLinkIcon size={13} />
            查看网站
          </Link>
          <UserMenu />
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar */}
        <header className="adm-topbar" style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '0 16px', height: '48px',
          background: '#fff', borderBottom: `1px solid ${s.sidebar.border}`,
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button onClick={() => setOpen(o => !o)} style={{
            padding: '6px', border: 'none', background: 'none',
            cursor: 'pointer', color: '#52525b', lineHeight: 0, borderRadius: '6px',
          }}>
            {open ? <XIcon size={18} /> : <MenuIcon size={18} />}
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>AI CMS</span>
        </header>

        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
