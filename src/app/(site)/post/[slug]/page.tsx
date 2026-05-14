import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContentBySlugWithMeta, getRelatedPosts, getFormBySlug } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import DefaultPost from '@/themes/default/post'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Form } from '@/types'
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
  const post = await getContentBySlugWithMeta(env.DB, 'post', slug)
  if (!post) return {}
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || undefined,
    openGraph: post.og_image ? { images: [post.og_image] } : undefined,
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const { env } = getCloudflareContext()
  const [post, settings] = await Promise.all([
    getContentBySlugWithMeta(env.DB, 'post', slug),
    getSiteSettings(env.DB),
  ])
  if (!post || post.status !== 'published') notFound()

  buildMarked()
  const { markdown: preprocessed, slugs: preSlugs } = preprocessFormShortcodes(post.content ?? '')
  const rawHtml = preprocessed ? await marked.parse(preprocessed) : ''
  const { html: htmlContent, slugs: postSlugs } = processFormEmbeds(rawHtml)
  const formSlugs = [...new Set([...preSlugs, ...postSlugs])]

  // Fetch independently to avoid mixed-type destructuring
  const [related, formResults] = await Promise.all([
    getRelatedPosts(env.DB, post.id, 3),
    Promise.all(formSlugs.map(s => getFormBySlug(env.DB, s))),
  ])
  const embeddedForms = formResults.filter((f): f is Form => f !== null)

  const base = (settings['site.url'] as string | undefined)?.replace(/\/$/, '') || ''
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.cover_image || undefined,
    datePublished: post.published_at ? new Date(post.published_at * 1000).toISOString() : undefined,
    dateModified: post.updated_at ? new Date(post.updated_at * 1000).toISOString() : undefined,
    url: `${base}/post/${post.slug}`,
    author: { '@type': 'Organization', name: settings['site.name'] || '' },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DefaultPost post={{ ...post, content: htmlContent }} settings={settings} related={related} embeddedForms={embeddedForms} />
    </>
  )
}
