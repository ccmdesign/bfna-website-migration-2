/**
 * Accept negotiation for the static Netlify deploy.
 *
 * The edge function in `netlify/edge-functions/markdown.ts` is a thin wrapper
 * around `negotiate`. Keeping the rules here means they can be tested without
 * Netlify, and the function never `fetch()`es the same URL with
 * `Accept: text/markdown` (that re-enters the function and Netlify returns 508).
 */

import { NOT_FOUND_SENTENCE } from './not-found-html'

export const MARKDOWN_FETCH_HEADER = 'x-bf-markdown-twin'

export const NOT_FOUND_MARKDOWN = `# Page not found

${NOT_FOUND_SENTENCE}

- [Home](/)
- [Sitemap](/sitemap.xml)
- [Guide for agents](/llms.txt)
`

const MARKDOWN_TYPES = new Set(['text/markdown', 'text/x-markdown'])
const HTML_TYPES = new Set(['text/html', 'application/xhtml+xml'])

interface MediaRange {
  type: string
  q: number
}

export function parseAccept(header: string | null): MediaRange[] {
  if (!header) return []
  const ranges: MediaRange[] = []
  for (const part of header.split(',')) {
    const bits = part.split(';').map(bit => bit.trim()).filter(Boolean)
    const type = bits[0]?.toLowerCase()
    if (!type) continue
    let q = 1
    for (const bit of bits.slice(1)) {
      const eq = bit.indexOf('=')
      if (eq === -1) continue
      const key = bit.slice(0, eq).trim().toLowerCase()
      if (key !== 'q') continue
      const n = Number(bit.slice(eq + 1).trim())
      q = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0
    }
    ranges.push({ type, q })
  }
  return ranges
}

/**
 * True only when the client names a markdown type at a higher q than HTML.
 *
 * `q=0` rejects the type. A tie, or no markdown type at all, stays HTML so a
 * browser `Accept` is unchanged. A wildcard range does not imply markdown.
 */
export function wantsMarkdown(accept: string | null): boolean {
  let markdownQ = -1
  let htmlQ = -1
  for (const range of parseAccept(accept)) {
    if (MARKDOWN_TYPES.has(range.type)) markdownQ = Math.max(markdownQ, range.q)
    else if (HTML_TYPES.has(range.type)) htmlQ = Math.max(htmlQ, range.q)
  }
  if (markdownQ <= 0) return false
  const htmlScore = htmlQ >= 0 ? htmlQ : 0
  return markdownQ > htmlScore
}

/** Append a Vary token. Never replaces tokens already on the response. */
export function appendVary(existing: string | null, token: string): string {
  const parts = (existing ?? '').split(',').map(part => part.trim()).filter(Boolean)
  if (!parts.some(part => part.toLowerCase() === token.toLowerCase())) parts.push(token)
  return parts.join(', ')
}

export function withVary(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('vary', appendVary(headers.get('vary'), 'Accept'))
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

/** HTML pages only. A dotted last segment (`llms.txt`, `sitemap.xml`, assets) is not negotiated. */
export function isPagePath(pathname: string): boolean {
  const bare = (pathname.split('?')[0] ?? '/').split('#')[0] ?? '/'
  const trimmed = bare.length > 1 ? bare.replace(/\/+$/, '') : '/'
  if (trimmed === '/') return true
  const last = trimmed.split('/').pop() ?? ''
  return !last.includes('.')
}

/** `/` → `/index.md`, `/about/` → `/about.md`. */
export function markdownPath(pathname: string): string {
  const bare = (pathname.split('?')[0] ?? '/').split('#')[0] ?? '/'
  const trimmed = bare.length > 1 ? bare.replace(/\/+$/, '') : '/'
  if (trimmed === '/') return '/index.md'
  return `${trimmed}.md`
}

export function markdownNotFoundResponse(varyFrom?: string | null): Response {
  return new Response(NOT_FOUND_MARKDOWN, {
    status: 404,
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      vary: appendVary(varyFrom ?? null, 'Accept')
    }
  })
}

function markdownResponse(origin: Response): Response {
  const headers = new Headers(origin.headers)
  headers.set('content-type', 'text/markdown; charset=utf-8')
  headers.set('vary', appendVary(headers.get('vary'), 'Accept'))
  return new Response(origin.body, {
    status: origin.status,
    statusText: origin.statusText,
    headers
  })
}

export interface NegotiateDeps {
  next: () => Promise<Response>
  fetch: (input: string | URL, init?: RequestInit) => Promise<Response>
}

const TWIN_HEADERS = {
  accept: '*/*',
  [MARKDOWN_FETCH_HEADER]: '1'
}

/**
 * Serve a prebuilt markdown twin, or the HTML page.
 *
 * The twin is fetched with a wildcard Accept and the `x-bf-markdown-twin` header, never with
 * the caller's `Accept: text/markdown`. `excludedPath` in netlify.toml also
 * keeps `*.md` from re-entering this function. If that exclusion misses, the
 * header short-circuits so the fetch cannot recurse.
 */
export async function negotiate(request: Request, deps: NegotiateDeps): Promise<Response> {
  if (request.headers.get(MARKDOWN_FETCH_HEADER) === '1') {
    return withVary(await deps.next())
  }

  const url = new URL(request.url)
  if (!isPagePath(url.pathname) || !wantsMarkdown(request.headers.get('accept'))) {
    return withVary(await deps.next())
  }

  const mdUrl = new URL(markdownPath(url.pathname), request.url)
  let origin = await deps.fetch(mdUrl, { headers: TWIN_HEADERS, redirect: 'manual' })

  if (origin.status >= 300 && origin.status < 400) {
    const location = origin.headers.get('location')
    if (location && new URL(location, mdUrl).pathname.endsWith('.md')) {
      origin = await deps.fetch(new URL(location, mdUrl), {
        headers: TWIN_HEADERS,
        redirect: 'manual'
      })
    }
  }

  if (origin.ok) return markdownResponse(origin)

  const html = await deps.next()
  if (html.status === 404) return markdownNotFoundResponse(html.headers.get('vary'))
  return withVary(html)
}
