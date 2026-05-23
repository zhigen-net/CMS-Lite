import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
  getContentBySlug, getContentBySlugWithMeta, getFormBySlug,
  getPagesByParent, getContent, getContentTypes, getContents,
  getRelatedPosts,
} from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import { loadTheme } from '@/lib/theme-loader'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Form } from '@/types'
import { marked, type Tokens } from 'marked'
import { preprocessFormShortcodes, processFormEmbeds } from '@/lib/formEmbed'

// These types have their own named routes and must never be caught here
const SYSTEM_TYPES = new Set(['post', 'page', 'category', 'tag'])

function buildMarked() {
  const renderer = new marked.Renderer()
  renderer.code = ({ text, lang }: Tokens.Code) => {
    const langClass = lang ? `shj-lang-${lang}` : 'shj-lang-plain'
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<pre><code class="${langClass}">${escaped}</code></pre>`
  }
  return marked.use({ renderer })
}

interface Props {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: segments } = await params
  const { env } = getCloudflareContext()

  if (segments.length === 1) {
    const slug = segments[0]
    const page = await getContentBySlug(env.DB, 'page', slug)
    if (page) return { title: page.meta_title || page.title, description: page.meta_description || page.excerpt || undefined }
    const types = await getContentTypes(env.DB)
    const ct = types.find(t => t.slug === slug || t.id === slug)
    if (ct) return { title: ct.name }
  }

  if (segments.length === 2) {
    const [type, slug] = segments
    if (SYSTEM_TYPES.has(type)) return {}
    const content = await getContentBySlugWithMeta(env.DB, type, slug)
    if (!content) return {}
    return {
      title: content.meta_title || content.title,
      description: content.meta_description || content.excerpt || undefined,
      openGraph: content.og_image ? { images: [content.og_image] } : undefined,
    }
  }

  return {}
}

export default async function SlugPage({ params }: Props) {
  const { slug: segments } = await params
  if (segments.length === 0 || segments.length > 2) notFound()

  const { env } = getCloudflareContext()
  const settings = await getSiteSettings(env.DB)
  const themeId = settings['theme.active'] as string | undefined

  // ── 1-segment: page content or content-type archive ──────────
  if (segments.length === 1) {
    const slug = decodeURIComponent(segments[0])
    const page = await getContentBySlug(env.DB, 'page', slug)

    if (page && page.status === 'published') {
      const [parentPage, allChildren] = await Promise.all([
        page.parent_id ? getContent(env.DB, page.parent_id) : Promise.resolve(null),
        getPagesByParent(env.DB, page.id),
      ])
      const childPages = allChildren.filter(c => c.status === 'published')

      buildMarked()
      const { markdown: preprocessed, slugs: preSlugs } = preprocessFormShortcodes(page.content ?? '')
      const rawHtml = preprocessed ? await marked.parse(preprocessed) : ''
      const { html: htmlContent, slugs: postSlugs } = processFormEmbeds(rawHtml)
      const formSlugs = [...new Set([...preSlugs, ...postSlugs])]
      const formResults = await Promise.all(formSlugs.map(s => getFormBySlug(env.DB, s)))
      const embeddedForms = formResults.filter((f): f is Form => f !== null)

      const theme = await loadTheme(themeId)
      return (
        <theme.Page
          post={{ ...page, content: htmlContent }}
          settings={settings}
          embeddedForms={embeddedForms}
          parentPage={parentPage}
          childPages={childPages}
        />
      )
    }

    // Fallback: content type archive
    const types = await getContentTypes(env.DB)
    const ct = types.find(t => t.slug === slug || t.id === slug)
    if (ct) {
      const { items, pagination } = await getContents(env.DB, { type: ct.id, status: 'published', pageSize: 20 })
      const theme = await loadTheme(themeId)
      return (
        <theme.Category
          title={ct.name}
          slug={slug}
          description={null}
          posts={items}
          pagination={pagination}
        />
      )
    }

    notFound()
  }

  // ── 2-segment: custom content type item ──────────────────────
  const [rawType, rawSlug] = segments
  const type = decodeURIComponent(rawType)
  const slug = decodeURIComponent(rawSlug)

  if (SYSTEM_TYPES.has(type)) notFound()

  const content = await getContentBySlugWithMeta(env.DB, type, slug)
  if (!content || content.status !== 'published') notFound()

  buildMarked()
  const { markdown: preprocessed, slugs: preSlugs } = preprocessFormShortcodes(content.content ?? '')
  const rawHtml = preprocessed ? await marked.parse(preprocessed) : ''
  const { html: htmlContent, slugs: postSlugs } = processFormEmbeds(rawHtml)
  const formSlugs = [...new Set([...preSlugs, ...postSlugs])]

  const [related, formResults] = await Promise.all([
    getRelatedPosts(env.DB, content.id, 3),
    Promise.all(formSlugs.map(s => getFormBySlug(env.DB, s))),
  ])
  const embeddedForms = formResults.filter((f): f is Form => f !== null)

  const theme = await loadTheme(themeId)
  return (
    <theme.Post
      post={{ ...content, content: htmlContent }}
      settings={settings}
      related={related}
      embeddedForms={embeddedForms}
    />
  )
}
