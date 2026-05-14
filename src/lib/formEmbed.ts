// Extract [form:slug] shortcodes from markdown or rendered HTML
// and replace them with <div data-form="slug"> placeholders.

export function processFormEmbeds(html: string): { html: string; slugs: string[] } {
  const found = new Set<string>()

  // Match <p>[form:slug]</p> (standalone paragraph)
  let processed = html.replace(/<p>\s*\[form:([^\]]+)\]\s*<\/p>/gi, (_, slug) => {
    const s = slug.trim()
    found.add(s)
    return `<div data-form="${s}" class="form-embed" style="margin:2rem 0"></div>`
  })

  // Match any remaining [form:slug] inline
  processed = processed.replace(/\[form:([^\]]+)\]/gi, (_, slug) => {
    const s = slug.trim()
    found.add(s)
    return `<div data-form="${s}" class="form-embed" style="margin:2rem 0"></div>`
  })

  return { html: processed, slugs: [...found] }
}
