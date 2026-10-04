/**
 * Minimal Accept negotiation for agent markdown (acceptmarkdown.com).
 * Splits on commas and respects q=0 rejections.
 */
export function parseAcceptHeader(header: string | null | undefined): Array<{ type: string; subtype: string; q: number }> {
  if (!header?.trim()) return []

  return header
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const [media, ...params] = part.split(';').map(s => s.trim())
      const [typeRaw, subtype = '*'] = (media ?? '').split('/')
      const type = typeRaw ?? '*'
      let q = 1
      for (const param of params) {
        const [key, value] = param.split('=').map(s => s.trim())
        if (key === 'q' && value) {
          const parsed = Number.parseFloat(value)
          if (!Number.isNaN(parsed)) q = parsed
        }
      }
      return { type: type.toLowerCase(), subtype: subtype.toLowerCase(), q }
    })
}

export function prefersMarkdown(acceptHeader: string | null | undefined): boolean {
  const types = parseAcceptHeader(acceptHeader)
  if (types.length === 0) return false

  let markdownQ = -1
  let htmlQ = -1

  for (const entry of types) {
    const isMarkdown =
      (entry.type === 'text' && entry.subtype === 'markdown')
      || (entry.type === 'text' && entry.subtype === '*')
      || (entry.type === '*' && entry.subtype === '*')
    const isHtml =
      (entry.type === 'text' && (entry.subtype === 'html' || entry.subtype === '*'))
      || (entry.type === '*' && entry.subtype === '*')

    if (isMarkdown && entry.q > markdownQ) markdownQ = entry.q
    if (isHtml && entry.q > htmlQ) htmlQ = entry.q
  }

  if (markdownQ < 0) return false
  if (markdownQ === 0) return false
  if (htmlQ < 0) return true
  return markdownQ >= htmlQ
}

export function appendVaryAccept(headers: Headers): void {
  const existing = headers.get('Vary')
  const parts = existing
    ? existing.split(',').map(s => s.trim()).filter(Boolean)
    : []
  if (!parts.some(p => p.toLowerCase() === 'accept')) {
    parts.push('Accept')
  }
  headers.set('Vary', parts.join(', '))
}
