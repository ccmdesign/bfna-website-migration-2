import { injectNotFoundHtml, markdown404Body, markdownTwinPath, wantsMarkdown } from './negotiate.ts'

interface EdgeContext {
  next: () => Promise<Response>
  deploy?: { context?: string }
}

const SKIP_PREFIXES = ['/docs', '/wireframes']

function skipped(pathname: string): boolean {
  if (pathname === '/search' || pathname.startsWith('/search/')) return true
  return SKIP_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function appendVary(headers: Headers): void {
  const current = headers.get('vary')
  const parts = current ? current.split(',').map(part => part.trim()).filter(Boolean) : []
  if (!parts.some(part => part.toLowerCase() === 'accept')) parts.push('Accept')
  headers.set('vary', parts.join(', '))
}

function applyNoindex(headers: Headers, deployContext: string | undefined): void {
  if (deployContext && deployContext !== 'production') {
    headers.set('x-robots-tag', 'noindex, nofollow')
  }
}

function pass(response: Response, headers: Headers): Response {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

export default async (request: Request, context: EdgeContext) => {
  const url = new URL(request.url)
  const path = url.pathname

  // *.md is excluded in netlify.toml. This branch is the brake if a twin
  // request still arrives: serve the file, do not rewrite, do not fetch.
  if (path.endsWith('.md')) {
    const response = await context.next()
    const headers = new Headers(response.headers)
    headers.set('content-type', 'text/markdown; charset=utf-8')
    headers.delete('content-length')
    appendVary(headers)
    applyNoindex(headers, context.deploy?.context)
    return pass(response, headers)
  }

  const response = await context.next()
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  appendVary(headers)
  applyNoindex(headers, context.deploy?.context)

  if (!wantsMarkdown(request.headers.get('accept'))) {
    if (response.status !== 404) return pass(response, headers)
    const html = await response.text()
    headers.set('content-type', 'text/html; charset=utf-8')
    return new Response(injectNotFoundHtml(html), { status: 404, headers })
  }

  if (response.status === 404) {
    headers.set('content-type', 'text/markdown; charset=utf-8')
    return new Response(markdown404Body(), { status: 404, headers })
  }

  if (skipped(path)) return pass(response, headers)

  // The page exists. Load the prebuilt twin.
  // Accept is text/plain on purpose. Accept: text/markdown on this same host
  // re-enters the function and Netlify returns 508.
  // Do not fetch(request.url). Do not return new URL() after context.next();
  // the chain has already run. excludedPath keeps the twin fetch out of this
  // function. A rewrite via `return new URL()` would also force the rewrite
  // status path and cannot carry this 404 branch.
  const twin = await fetch(new URL(markdownTwinPath(path), request.url), {
    headers: { accept: 'text/plain' }
  })
  if (!twin.ok) return pass(response, headers)

  headers.set('content-type', 'text/markdown; charset=utf-8')
  return new Response(await twin.text(), { status: 200, headers })
}
