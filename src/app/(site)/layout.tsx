export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getSiteSettings } from '@/lib/config'
import Header from '@/themes/default/components/Header'
import Footer from '@/themes/default/components/Footer'
import type { SiteSettings } from '@/types'

type PartialSettings = Partial<SiteSettings>


export async function generateMetadata(): Promise<Metadata> {
  try {
    const { env } = getCloudflareContext()
    const s = await getSiteSettings(env.DB)
    return {
      title: {
        template: (s['seo.titleTemplate'] as string) || `%s | ${s['site.name']}`,
        default: s['site.name'] as string,
      },
      description: s['site.description'] as string,
      robots: (s['seo.robots'] as string) || 'index,follow',
      alternates: {
        types: { 'application/rss+xml': '/feed.xml' },
      },
    }
  } catch {
    return {}
  }
}

function buildCssVars(settings: PartialSettings): string {
  const vars = (settings['theme.variables'] as Record<string, string>) || {}
  const custom = (settings['theme.customCss'] as string) || ''
  const declarations = Object.entries(vars)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
  return declarations ? `:root{${declarations}}${custom}` : custom
}

const proseStyles = `
  .prose h1,.prose h2,.prose h3,.prose h4 {
    font-family: var(--font-heading);
    font-weight: 700;
    line-height: 1.3;
    margin: 1.75em 0 0.75em;
    color: var(--color-text);
  }
  .prose h1 { font-size: 2rem; }
  .prose h2 { font-size: 1.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.4em; }
  .prose h3 { font-size: 1.25rem; }
  .prose p { margin: 1.25em 0; }
  .prose a { color: var(--color-primary); text-decoration: underline; text-underline-offset: 3px; }
  .prose strong { font-weight: 700; }
  .prose em { font-style: italic; }
  .prose blockquote {
    border-left: 3px solid var(--color-primary);
    padding: 0.5em 1em;
    margin: 1.5em 0;
    color: var(--color-text-secondary);
    background: color-mix(in srgb, var(--color-primary) 8%, transparent);
    border-radius: 0 var(--radius) var(--radius) 0;
  }
  .prose pre {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 1.25em;
    border-radius: var(--radius);
    overflow-x: auto;
    font-size: 0.9em;
    margin: 1.5em 0;
  }
  .prose code {
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-size: 0.875em;
  }
  .prose pre code { background: none; color: inherit; padding: 0; }
  .prose ul,.prose ol { padding-left: 1.75em; margin: 1.25em 0; }
  .prose li { margin: 0.4em 0; line-height: 1.7; }
  .prose ul li { list-style-type: disc; }
  .prose ol li { list-style-type: decimal; }
  .prose hr { border: none; border-top: 1px solid var(--color-border); margin: 2em 0; }
  .prose img { max-width: 100%; border-radius: var(--radius); margin: 1.5em 0; }
  .prose table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 0.9em; }
  .prose th,.prose td { border: 1px solid var(--color-border); padding: 0.5em 0.75em; }
  .prose th { background: color-mix(in srgb, var(--color-primary) 8%, transparent); font-weight: 600; }
`

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let settings: PartialSettings = {}
  let inlineStyle = ''
  try {
    const { env } = getCloudflareContext()
    settings = await getSiteSettings(env.DB)
    inlineStyle = buildCssVars(settings)
  } catch { /* local dev fallback */ }

  const headerHtml = (settings['theme.headerHtml'] as string) || ''
  const footerHtml = (settings['theme.footerHtml'] as string) || ''
  const customJs = (settings['theme.customJs'] as string) || ''

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: proseStyles + (inlineStyle ? inlineStyle : '') }} />
      <Header settings={settings} />
      {headerHtml && <div dangerouslySetInnerHTML={{ __html: headerHtml }} />}
      {children}
      {footerHtml && <div dangerouslySetInnerHTML={{ __html: footerHtml }} />}
      <Footer settings={settings} />
      {customJs && <script dangerouslySetInnerHTML={{ __html: customJs }} />}
    </>
  )
}
