import type { ComponentType } from 'react'
import type {
  ThemeLayoutProps, ThemeHomeProps, ThemePostProps, ThemePageProps,
  ThemeArchiveProps, ThemeAuthorProps, ThemeSearchProps,
} from '@/types/theme'

export interface ThemeMeta {
  id: string
  name: string
  description: string
  version: string
  author: string
  tags: string[]
  preview: string | null
  variables: Record<string, string>
}

export interface ThemeModule {
  Layout: ComponentType<ThemeLayoutProps>
  Home: ComponentType<ThemeHomeProps>
  Post: ComponentType<ThemePostProps>
  Page: ComponentType<ThemePageProps>
  Category: ComponentType<ThemeArchiveProps>
  Tag: ComponentType<ThemeArchiveProps>
  Author: ComponentType<ThemeAuthorProps>
  Search: ComponentType<ThemeSearchProps>
}

// ── Theme Registry ────────────────────────────────────────────────────────────
// Adding a new theme requires only editing this file:
//   1. Create src/themes/{id}/ with all required components
//   2. Add one entry to REGISTRY below

import defaultConfig from '@/themes/default/theme.config'

const REGISTRY: Array<{ meta: ThemeMeta; load: () => Promise<ThemeModule> }> = [
  {
    meta: {
      id: defaultConfig.id,
      name: defaultConfig.name,
      version: defaultConfig.version,
      author: defaultConfig.author,
      variables: defaultConfig.variables,
      description: '简洁现代的博客主题，适合内容创作者和个人站点',
      tags: ['博客', '简洁', '响应式'],
      preview: null,
    },
    load: () => import('@/themes/default') as Promise<ThemeModule>,
  },
]

// ── Public API ────────────────────────────────────────────────────────────────

export const themes: ThemeMeta[] = REGISTRY.map(r => r.meta)

export function getThemeById(id: string): ThemeMeta {
  return themes.find(t => t.id === id) ?? themes[0]
}

export async function loadTheme(themeId?: string | null): Promise<ThemeModule> {
  const id = themeId || 'default'
  const entry = REGISTRY.find(r => r.meta.id === id) ?? REGISTRY[0]
  return entry.load()
}
