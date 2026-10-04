export function wantsMarkdown(header: string | null): boolean {
  if (!header || !header.trim()) return false

  type Part = { type: string, q: number }
  const parts: Part[] = []

  for (const segment of header.split(',')) {
    const trimmed = segment.trim()
    if (!trimmed) continue
    const [typePart, ...params] = trimmed.split(';').map(p => p.trim())
    const type = typePart.toLowerCase()
    let q = 1
    for (const param of params) {
      const [key, value] = param.split('=').map(p => p.trim())
      if (key?.toLowerCase() === 'q') {
        const parsed = Number(value)
        q = Number.isFinite(parsed) ? parsed : 0
      }
    }
    if (q === 0) continue
    parts.push({ type, q })
  }

  const markdownTypes = new Set(['text/markdown', 'text/x-markdown'])
  const htmlTypes = new Set(['text/html', 'application/xhtml+xml'])

  const markdown = parts.filter(p => markdownTypes.has(p.type))
  const html = parts.filter(p => htmlTypes.has(p.type))

  if (markdown.length === 0) return false
  if (html.length === 0) return true

  const bestMarkdown = Math.max(...markdown.map(p => p.q))
  const bestHtml = Math.max(...html.map(p => p.q))

  return bestMarkdown > bestHtml
}

export function markdownTwinPath(pathname: string): string {
  let path = pathname
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1)
  }
  if (path === '/') return '/index.md'
  return `${path}.md`
}

export function markdown404Body(): string {
  return `# Page not found

That page does not exist, or its address has changed.

- [Home](/)
- [Sitemap](/sitemap.xml)
- [llms.txt](/llms.txt)
`
}

const NOT_FOUND_MAIN =
  '<main id="main"><h1>Page not found</h1><p>That page does not exist, or its address has changed.</p><p><a href="/">Home</a> · <a href="/sitemap.xml">Sitemap</a> · <a href="/llms.txt">llms.txt</a></p></main>'

export function injectNotFoundHtml(html: string): string {
  if (html.includes('Page not found')) return html
  const replaced = html.replace(
    /<div id="__nuxt"([^>]*)>\s*<\/div>/i,
    `<div id="__nuxt"$1>${NOT_FOUND_MAIN}</div>`
  )
  return replaced
}
