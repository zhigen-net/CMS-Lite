import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getContents } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import { marked } from 'marked'

export const dynamic = 'force-dynamic'

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET() {
  try {
    const { env } = getCloudflareContext()
    const [settings, { items: posts }] = await Promise.all([
      getSiteSettings(env.DB),
      getContents(env.DB, { type: 'post', status: 'published', page: 1, pageSize: 20 }),
    ])

    const base = ((settings['site.url'] as string) || 'https://localhost').replace(/\/$/, '')
    const siteName = (settings['site.name'] as string) || 'Blog'
    const siteDesc = (settings['site.description'] as string) || ''
    const now = new Date().toUTCString()

    const items = await Promise.all(posts.map(async post => {
      const pubDate = post.published_at
        ? new Date(post.published_at * 1000).toUTCString()
        : now
      const link = `${base}/post/${post.slug}`
      const htmlContent = post.content ? await marked.parse(post.content) : ''
      const desc = post.excerpt || post.title

      const cats = post.categories?.map(c => `<category>${esc(c.name)}</category>`).join('') || ''

      return `<item>
  <title>${esc(post.title)}</title>
  <link>${link}</link>
  <guid isPermaLink="true">${link}</guid>
  <pubDate>${pubDate}</pubDate>
  <description>${esc(desc)}</description>
  <content:encoded><![CDATA[${htmlContent}]]></content:encoded>
  ${cats}
</item>`
    }))

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(siteName)}</title>
  <link>${base}</link>
  <description>${esc(siteDesc)}</description>
  <language>zh-CN</language>
  <lastBuildDate>${now}</lastBuildDate>
  <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
${items.join('\n')}
</channel>
</rss>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (e) {
    return new Response('<?xml version="1.0"?><rss version="2.0"><channel><title>Error</title></channel></rss>', {
      status: 500,
      headers: { 'Content-Type': 'application/rss+xml' },
    })
  }
}
