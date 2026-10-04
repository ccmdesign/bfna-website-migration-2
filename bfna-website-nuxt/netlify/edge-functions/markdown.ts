/**
 * Netlify Edge Function: Markdown negotiation + agent-friendly 404s
 *
 * When a request has `Accept: text/markdown`:
 *  1. Try to serve a pre-generated .md twin (e.g. /index.md for /)
 *  2. If no .md file exists, serve a Markdown 404 body (status 404)
 *
 * For all other requests (including machine-readable files like
 * sitemap.xml, robots.txt, llms.txt), pass through unchanged
 * (with Vary: Accept added).
 */
interface EdgeContext {
  req: Request
  next: () => Promise<Response>
}

// Paths to skip (machine-readable files)
const SKIP_PATHS = new Set([
  '/sitemap.xml', '/robots.txt', '/llms.txt',
])

// Extensions that are not content pages
function isMachineReadable(pathname: string): boolean {
  const ext = pathname.split('.').pop()?.toLowerCase() || ''
  return ['xml', 'json', 'txt', 'svg', 'css', 'js', 'ico'].includes(ext)
}

function getMdPath(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'index.md'
  return pathname.slice(1) + '.md'
}

function isMarkdownAccept(req: Request): boolean {
  const accept = req.headers.get('Accept') || ''
  const types = accept.split(',').map(t => t.trim().split(';')[0].trim())
  return types.includes('text/markdown')
}

function markdown404Body(): string {
  return [
    '# Page Not Found',
    '',
    'The page you are looking for does not exist or may have been moved.',
    '',
    '## Try these instead',
    '',
    '- [Home Page](https://www.bfna.org/) — Main landing page',
    '- [Sitemap](https://www.bfna.org/sitemap.xml) — Full list of pages',
    '- [llms.txt](https://www.bfna.org/llms.txt) — Site overview for agents',
    '- [About](https://www.bfna.org/about) — About BFNA',
    '',
    'If you believe this is an error, please [contact us](https://www.bfna.org/about#contact).',
    ''
  ].join('\n')
}

export default async function (context: EdgeContext) {
  const { req, next } = context
  const pathname = new URL(req.url).pathname

  // Skip machine-readable files (sitemap, robots, llms.txt, etc.)
  if (SKIP_PATHS.has(pathname) || isMachineReadable(pathname)) {
    const response = await next()
    response.headers.set('Vary', 'Accept')
    return response
  }

  // Not a markdown request? Pass through.
  if (!isMarkdownAccept(req)) {
    const response = await next()
    response.headers.set('Vary', 'Accept')
    return response
  }

  // Try to serve the markdown twin
  const mdPath = getMdPath(pathname)
  try {
    const mdResp = await fetch(`/${mdPath}`)
    if (mdResp.ok && mdResp.status === 200) {
      const body = await mdResp.text()
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Vary': 'Accept'
        }
      })
    }
  } catch {
    // File not found or fetch error — fall through to 404
  }

  // No markdown twin available — serve a Markdown 404 body
  return new Response(markdown404Body(), {
    status: 404,
    statusText: 'Not Found',
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept'
    }
  })
}
