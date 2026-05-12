'use client'

import { useState } from 'react'
import type { SiteSettings, NavItem } from '@/types'
import type { ThemeMeta } from '@/themes'
import MenusClient from '../menus/_components/MenusClient'
import ThemeManager from './ThemeManager'

type PrimaryTab = 'menus' | 'theme'

interface Props {
  initialSettings: SiteSettings
  themes: ThemeMeta[]
  activeThemeId: string
  initialMain: NavItem[]
  initialFooter: NavItem[]
  initialCss: string
  initialHeaderHtml: string
  initialFooterHtml: string
  initialJs: string
}

export default function AppearanceHub({
  initialSettings, themes, activeThemeId,
  initialMain, initialFooter,
  initialCss, initialHeaderHtml, initialFooterHtml, initialJs,
}: Props) {
  const [primary, setPrimary] = useState<PrimaryTab>('theme')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', overflow: 'hidden' }}>

      {/* Primary tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid #e4e4e7',
        background: '#fff', padding: '0 24px',
        flexShrink: 0,
      }}>
        {([['theme', '主题切换'], ['menus', '导航菜单']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setPrimary(id)}
            style={{
              padding: '14px 16px', fontSize: '13px',
              fontWeight: primary === id ? 600 : 400,
              color: primary === id ? '#18181b' : '#71717a',
              border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: primary === id ? '2px solid #18181b' : '2px solid transparent',
              marginBottom: '-1px', transition: 'color 0.1s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {primary === 'menus' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 48px' }}>
            <div style={{ maxWidth: '680px' }}>
              <MenusClient initialMain={initialMain} initialFooter={initialFooter} />
            </div>
          </div>
        )}

        {primary === 'theme' && (
          <ThemeManager
            themes={themes}
            activeThemeId={activeThemeId}
            initialSettings={initialSettings}
            initialCss={initialCss}
            initialHeaderHtml={initialHeaderHtml}
            initialFooterHtml={initialFooterHtml}
            initialJs={initialJs}
          />
        )}
      </div>
    </div>
  )
}
