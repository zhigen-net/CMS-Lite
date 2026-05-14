import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContentBySlug, getFormBySlug } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import DefaultPost from '@/themes/default/post'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { marked, type Tokens } from 'marked'
import { preprocessFormShortcodes, processFormEmbeds } from '@/lib/formEmbed'

function buildMarked() {
  const renderer = new marked.Renderer()
  renderer.code = ({ text, lang }: Tokens.Code) => {
    const langClass = lang ? `shj-lang-${lang}` : 'shj-lang-plain'
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<pre><code class="${langClass}">${escaped}</code></pre>`
  }
  return marked.use({ renderer })
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { env } = getCloudflareContext()
  const page = await getContentBySlug(env.DB, 'page', slug)
  if (!page) return {}
  return {
    title: page.meta_title || page.title,
    description: page.meta_description || page.excerpt || undefined,
    openGraph: page.og_image ? { images: [page.og_image] } : undefined,
  }
}

export default async function PagePage({ params }: Props) {
  const { slug } = await params
  const { env } = getCloudflareContext()
  const [page, settings] = await Promise.all([
    getContentBySlug(env.DB, 'page', slug),
    getSiteSettings(env.DB),
  ])
  if (!page || page.status !== 'published') notFound()

  buildMarked()
  const { markdown: preprocessed, slugs: preSlugs } = preprocessFormShortcodes(page.content ?? '')
  const rawHtml = preprocessed ? await marked.parse(preprocessed) : ''
  const { html: htmlContent, slugs: postSlugs } = processFormEmbeds(rawHtml)
  const formSlugs = [...new Set([...preSlugs, ...postSlugs])]
  const embeddedForms = (await Promise.all(formSlugs.map(s => getFormBySlug(env.DB, s)))).filter(Boolean)

  return <DefaultPost post={{ ...page, content: htmlContent }} settings={settings} embeddedForms={embeddedForms as NonNullable<typeof embeddedForms[0]>[]} />
}
