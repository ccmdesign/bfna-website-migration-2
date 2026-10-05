import {
  MARKDOWN_CONTENT_TYPE,
  MCP_PATH,
  VARY_ACCEPT,
  apiResult,
  classifyAgentRequest,
  markdownForUpstreamMiss,
  mcpResult,
  normalizePath,
} from '../../utils/agentContent.ts'

const MARKDOWN_HEADERS = {
  'content-type': MARKDOWN_CONTENT_TYPE,
  vary: VARY_ACCEPT,
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
  const path = normalizePath(url.pathname)

  if (path === MCP_PATH) {
    const result = mcpResult({
      method: request.method,
      body: request.method === 'POST' ? await request.text() : null,
    })
    if (result) {
      return new Response(request.method === 'HEAD' || result.body === null ? null : result.body, {
        status: result.status,
        headers: result.headers,
      })
    }
  }

  const api = apiResult(request.method, url.pathname, url.searchParams.get('section'))
  if (api) {
    return new Response(request.method === 'HEAD' ? null : api.body, {
      status: api.status,
      headers: api.headers,
    })
  }

  const decision = classifyAgentRequest({
    method: request.method,
    pathname: url.pathname,
    accept: request.headers.get('accept'),
  })

  if (decision.action === 'delegate') return context.next()

  if (decision.action === 'markdown') {
    return new Response(request.method === 'HEAD' ? null : decision.body, {
      status: decision.status,
      headers: MARKDOWN_HEADERS,
    })
  }

  const upstream = await context.next()
  const miss = markdownForUpstreamMiss(url.pathname, upstream.status)
  if (!miss) return upstream

  return new Response(request.method === 'HEAD' ? null : miss.body, {
    status: miss.status,
    headers: MARKDOWN_HEADERS,
  })
}

export const config = {
  path: '/*',
  excludedPath: ['/_nuxt/*', '/assets/*', '/.netlify/*'],
}
