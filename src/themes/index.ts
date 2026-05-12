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

const themes: ThemeMeta[] = [
  {
    id: 'default',
    name: 'Default',
    description: '简洁现代的博客主题，适合内容创作者和个人站点',
    version: '1.0.0',
    author: 'AI CMS',
    tags: ['博客', '简洁', '响应式'],
    preview: null,
    variables: {
      '--color-primary': '#3b82f6',
      '--color-primary-hover': '#2563eb',
      '--color-bg': '#ffffff',
      '--color-bg-secondary': '#f9fafb',
      '--color-text': '#111827',
      '--color-text-secondary': '#6b7280',
      '--color-border': '#e5e7eb',
      '--font-heading': 'system-ui, sans-serif',
      '--font-body': 'system-ui, sans-serif',
      '--radius': '8px',
      '--max-width': '1200px',
    },
  },
]

export default themes

export function getThemeById(id: string): ThemeMeta {
  return themes.find(t => t.id === id) ?? themes[0]
}
