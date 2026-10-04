import type { Context, Config } from '@netlify/edge-functions'

const MARKDOWN = 'text/markdown; charset=utf-8'

function wantsMarkdown(request: Request): boolean {
  const accept = request.headers.get('Accept') || ''
  return accept.toLowerCase().includes('text/markdown')
}

function markdownAssetPath(pathname: string): string {
  const path = pathname.replace(/\/$/, '') || '/'
  if (path === '/') {
    return '/index.md'
  }
  return `${path}.md`
}

function withVary(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('Vary', 'Accept')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

function markdown404(origin: string): Response {
  const body = `# Page not found

The requested URL is not on this site. Try the [home page](${origin}/), [sitemap](${origin}/sitemap.xml), or [llms.txt](${origin}/llms.txt) for navigation.
`
  return new Response(body, {
    status: 404,
    headers: {
      'Content-Type': MARKDOWN,
      Vary: 'Accept'
    }
  })
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)

  if (!wantsMarkdown(request)) {
    const response = await context.next()
    return withVary(response)
  }

  const assetPath = markdownAssetPath(url.pathname)
  const assetUrl = new URL(assetPath, url.origin)
  const mdResponse = await fetch(assetUrl.toString(), {
    headers: { Accept: 'text/markdown,text/plain,*/*' }
  })

  if (mdResponse.ok) {
    const body = await mdResponse.text()
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': MARKDOWN,
        Vary: 'Accept'
      }
    })
  }

  const originResponse = await context.next()
  if (originResponse.status === 404) {
    return markdown404(url.origin)
  }

  return withVary(originResponse)
}

export const config: Config = {
  path: '/*',
  excludedPath: ['/.netlify/*']
}
