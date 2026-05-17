import type { ComponentType } from 'react'
import type {
  ThemeLayoutProps, ThemeHomeProps, ThemePostProps, ThemePageProps,
  ThemeArchiveProps, ThemeAuthorProps, ThemeSearchProps,
} from '@/types/theme'

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

// All theme imports must be static strings for bundler analysis.
// To add a new theme: add an entry here and create src/themes/{id}/index.ts
const THEME_LOADERS: Record<string, () => Promise<ThemeModule>> = {
  default: () => import('@/themes/default') as Promise<ThemeModule>,
}

export async function loadTheme(themeId?: string | null): Promise<ThemeModule> {
  const id = themeId || 'default'
  const loader = THEME_LOADERS[id] ?? THEME_LOADERS.default
  return loader()
}
