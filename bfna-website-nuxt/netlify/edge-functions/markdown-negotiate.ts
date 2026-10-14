import {
  MARKDOWN_CONTENT_TYPE,
  VARY_ACCEPT,
  appendVaryAccept,
  classifyAgentRequest,
  markdownBodyForUpstream,
} from '../../utils/agentContent.ts'

const MARKDOWN_HEADERS = {
  'content-type': MARKDOWN_CONTENT_TYPE,
  vary: VARY_ACCEPT,
}

function isHtml(headers: Headers): boolean {
  return (headers.get('content-type') ?? '').toLowerCase().includes('text/html')
}

/** HTML from upstream must vary on Accept, or a cache can serve it to a markdown client. */
function htmlWithVary(response: Response): Response {
  if (!isHtml(response.headers)) return response
  const headers = new Headers(response.headers)
  appendVaryAccept(headers)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * One edge function. Helpers live in utils/agentContent.ts.
 * Markdown only when Accept ranks text/markdown above text/html.
 * context.next() is the upstream response. This file never fetches the site.
 */
export default async function handler(
  request: Request,
  context: { next: () => Promise<Response> },
): Promise<Response> {
  const url = new URL(request.url)
  const decision = classifyAgentRequest({
    method: request.method,
    pathname: url.pathname,
    accept: request.headers.get('accept'),
  })

  if (decision.action === 'delegate') return htmlWithVary(await context.next())

  if (decision.action === 'markdown') {
    return new Response(request.method === 'HEAD' ? null : decision.body, {
      status: decision.status,
      headers: MARKDOWN_HEADERS,
    })
  }

  const upstream = await context.next()
  const html = await upstream.text()
  const body = markdownBodyForUpstream(url.pathname, upstream.status, html)
  if (!body) {
    const headers = new Headers(upstream.headers)
    if (isHtml(headers)) appendVaryAccept(headers)
    return new Response(request.method === 'HEAD' ? null : html, {
      status: upstream.status,
      headers,
    })
  }

  return new Response(request.method === 'HEAD' ? null : body.body, {
    status: body.status,
    headers: MARKDOWN_HEADERS,
  })
}

export const config = {
  path: '/*',
  excludedPath: ['/_nuxt/*', '/assets/*', '/.netlify/*'],
}
