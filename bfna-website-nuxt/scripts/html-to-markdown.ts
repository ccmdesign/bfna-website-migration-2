import { JSDOM } from 'jsdom'

/**
 * Convert prerendered page HTML to readable Markdown (headings + paragraphs).
 */
export function htmlToMarkdown(html: string): string {
  const dom = new JSDOM(html)
  const doc = dom.window.document
  const main = doc.querySelector('main') ?? doc.body
  const lines: string[] = []

  const walk = (node: Element) => {
    const tag = node.tagName.toLowerCase()
    if (tag === 'script' || tag === 'style' || tag === 'nav' || tag === 'footer') return

    if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag[1])
      const text = node.textContent?.trim()
      if (text) lines.push(`${'#'.repeat(level)} ${text}`, '')
      return
    }

    if (tag === 'p') {
      const text = node.textContent?.trim()
      if (text) lines.push(text, '')
      return
    }

    if (tag === 'a') {
      const href = node.getAttribute('href')
      const text = node.textContent?.trim()
      if (text && href) lines.push(`[${text}](${href})`)
      return
    }

    if (tag === 'li') {
      const text = node.textContent?.trim()
      if (text) lines.push(`- ${text}`)
      return
    }

    for (const child of Array.from(node.children)) {
      walk(child)
    }
  }

  for (const child of Array.from(main.children)) {
    walk(child)
  }

  const body = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  return body.length > 0 ? `${body}\n` : '# Page\n\n'
}
