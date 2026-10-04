import type { Context } from 'https://edge.netlify.com/v1/index.ts'
import { appendVaryAccept, prefersMarkdown } from './lib/accept.ts'

const MARKDOWN_404 = `# Page not found

The requested URL does not exist on this site.

- [Home](/)
- [Sitemap](/sitemap.xml)
- [Agent instructions](/llms.txt)
`

function pathnameToMdPath(pathname: string): string {
  const path = pathname.replace(/\/$/, '') || '/'
  if (path === '/') return '/index.md'
  return `${path}.md`
}

export default async (request: Request, context: Context) => {
  const accept = request.headers.get('Accept')

  if (!prefersMarkdown(accept)) {
    const response = await context.next()
    const headers = new Headers(response.headers)
    appendVaryAccept(headers)
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  }

  const url = new URL(request.url)
  if (url.pathname.includes('..')) {
    return new Response('Bad Request', { status: 400 })
  }
  const mdPath = pathnameToMdPath(url.pathname)
  const mdUrl = new URL(mdPath, url.origin)

  const mdResponse = await context.rewrite(mdUrl)

  if (mdResponse.ok) {
    const body = await mdResponse.text()
    const headers = new Headers(mdResponse.headers)
    headers.set('Content-Type', 'text/markdown; charset=utf-8')
    appendVaryAccept(headers)
    return new Response(body, { status: mdResponse.status, headers })
  }

  if (mdResponse.status === 404) {
    const headers = new Headers()
    headers.set('Content-Type', 'text/markdown; charset=utf-8')
    appendVaryAccept(headers)
    return new Response(MARKDOWN_404, { status: 404, headers })
  }

  const passThrough = await context.next()
  const headers = new Headers(passThrough.headers)
  appendVaryAccept(headers)
  return new Response(passThrough.body, { status: passThrough.status, statusText: passThrough.statusText, headers })
}
