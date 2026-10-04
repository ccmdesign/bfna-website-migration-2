/**
 * Turn a prerendered page into markdown a person can read.
 *
 * Block tags become their own paragraphs or headings. Whitespace inside a
 * line is collapsed; blank lines between paragraphs are kept. This is the
 * opposite of stripping every tag and joining the page into one line.
 */

interface HtmlNode {
  kind: 'text' | 'el'
  text?: string
  tag?: string
  attrs?: Record<string, string>
  children?: HtmlNode[]
}

const SKIP = new Set(['script', 'style', 'svg', 'noscript', 'template'])
const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'
])

function decode(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_match, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, '\'')
    .replace(/&amp;/gi, '&')
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const re = /([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let match: RegExpExecArray | null
  while ((match = re.exec(raw))) {
    const name = match[1]
    if (!name) continue
    attrs[name.toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '')
  }
  return attrs
}

function parseFragment(html: string): HtmlNode[] {
  const root: HtmlNode[] = []
  const stack: HtmlNode[][] = [root]
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)\b([^>]*?)(\/?)>|([^<]+)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    if (match[0].startsWith('<!--')) continue
    if (match[5] !== undefined) {
      stack[stack.length - 1]?.push({ kind: 'text', text: decode(match[5]) })
      continue
    }
    if (match[1]) {
      const tag = match[1].toLowerCase()
      while (stack.length > 1) {
        stack.pop()
        const parentList = stack[stack.length - 1]
        const parent = parentList?.[parentList.length - 1]
        if (parent?.tag === tag) break
      }
      continue
    }
    const tag = (match[2] ?? '').toLowerCase()
    const el: HtmlNode = {
      kind: 'el',
      tag,
      attrs: parseAttrs(match[3] ?? ''),
      children: []
    }
    stack[stack.length - 1]?.push(el)
    if (!match[4] && !VOID.has(tag)) stack.push(el.children ?? [])
  }
  return root
}

function collapseLine(value: string): string {
  return value.replace(/[ \t\r\f\v]+/g, ' ').replace(/\n+/g, ' ').trim()
}

function renderNodes(nodes: HtmlNode[]): string {
  let out = ''
  for (const node of nodes) {
    if (node.kind === 'text') {
      out += node.text ?? ''
      continue
    }
    const tag = node.tag ?? ''
    if (SKIP.has(tag)) continue
    const inner = renderNodes(node.children ?? [])
    if (/^h[1-6]$/.test(tag)) {
      const text = collapseLine(inner)
      if (text) out += `\n\n${'#'.repeat(Number(tag[1]))} ${text}\n\n`
      continue
    }
    if (tag === 'p') {
      const text = collapseLine(inner)
      if (text) out += `\n\n${text}\n\n`
      continue
    }
    if (tag === 'li') {
      const text = collapseLine(inner)
      if (text) out += `\n- ${text}`
      continue
    }
    if (tag === 'br') {
      out += '\n'
      continue
    }
    if (tag === 'blockquote') {
      const text = collapseLine(inner)
      if (text) out += `\n\n> ${text}\n\n`
      continue
    }
    if (tag === 'pre') {
      const text = inner.replace(/^\n+|\n+$/g, '')
      if (text) out += `\n\n\`\`\`\n${text}\n\`\`\`\n\n`
      continue
    }
    if (tag === 'a') {
      const href = node.attrs?.href
      const text = collapseLine(inner)
      if (!text) continue
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) out += text
      else out += `[${text}](${href})`
      continue
    }
    if (tag === 'img') {
      const src = node.attrs?.src
      if (!src) continue
      out += `\n\n![${collapseLine(node.attrs?.alt ?? '')}](${src})\n\n`
      continue
    }
    out += inner
  }
  return out
}

function extractMain(html: string): string {
  const match = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)
  return match?.[1] ?? html
}

/** Markdown for one prerendered document, ending in a newline when non-empty. */
export function htmlToMarkdown(html: string): string {
  const markdown = renderNodes(parseFragment(extractMain(html)))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return markdown ? `${markdown}\n` : ''
}
