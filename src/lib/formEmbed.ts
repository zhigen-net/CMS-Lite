// Step 1: preprocess Markdown BEFORE marked.parse()
// Replace [form:slug] with raw HTML that marked will pass through as-is.
export function preprocessFormShortcodes(markdown: string): { markdown: string; slugs: string[] } {
  const found = new Set<string>()
  const processed = markdown.replace(/^\[form:([^\]]+)\]$/gm, (_, slug) => {
    const s = slug.trim()
    found.add(s)
    return `<div data-form="${s}" class="form-embed" style="margin:2rem 0"></div>`
  })
  return { markdown: processed, slugs: [...found] }
}

// Step 2 (fallback): post-process rendered HTML in case any slipped through.
export function processFormEmbeds(html: string): { html: string; slugs: string[] } {
  const found = new Set<string>()

  let processed = html.replace(/<p>\s*\[form:([^\]]+)\]\s*<\/p>/gi, (_, slug) => {
    const s = slug.trim()
    found.add(s)
    return `<div data-form="${s}" class="form-embed" style="margin:2rem 0"></div>`
  })

  processed = processed.replace(/\[form:([^\]]+)\]/gi, (_, slug) => {
    const s = slug.trim()
    found.add(s)
    return `<div data-form="${s}" class="form-embed" style="margin:2rem 0"></div>`
  })

  return { html: processed, slugs: [...found] }
}
