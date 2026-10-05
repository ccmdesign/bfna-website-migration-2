import {
  MARKDOWN_CONTENT_TYPE,
  MCP_PATH,
  VARY_ACCEPT,
  apiResult,
  classifyAgentRequest,
  mcpResult,
  normalizePath,
} from '../../utils/agentContent'

/**
 * Dev parity for `nuxt dev`. Prerender and `nuxt preview` skip this so the
 * static HTML stays HTML. Production Markdown is the Netlify edge function.
 */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev) return

  const url = getRequestURL(event)
  const path = normalizePath(url.pathname)
  const method = event.method

  if (path === MCP_PATH) {
    const result = mcpResult({
      method,
      body: method === 'POST' ? await readRawBody(event) ?? null : null,
    })
    if (!result) return
    setResponseStatus(event, result.status)
    for (const [key, value] of Object.entries(result.headers)) setResponseHeader(event, key, value)
    return result.body ?? ''
  }

  const api = apiResult(method, url.pathname, url.searchParams.get('section'))
  if (api) {
    setResponseStatus(event, api.status)
    for (const [key, value] of Object.entries(api.headers)) setResponseHeader(event, key, value)
    return method === 'HEAD' ? '' : api.body
  }

  const decision = classifyAgentRequest({
    method,
    pathname: url.pathname,
    accept: getRequestHeader(event, 'accept'),
  })
  if (decision.action !== 'markdown') return

  setResponseStatus(event, decision.status)
  setResponseHeader(event, 'content-type', MARKDOWN_CONTENT_TYPE)
  setResponseHeader(event, 'vary', VARY_ACCEPT)
  return decision.body
})
