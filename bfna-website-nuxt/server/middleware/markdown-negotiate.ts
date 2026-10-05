import {
  MARKDOWN_CONTENT_TYPE,
  VARY_ACCEPT,
  classifyAgentRequest,
  normalizePath,
} from '../../utils/agentContent'

/**
 * Dev parity for the in-memory pages (`/`, `/about`, `/contact`, `/privacy`).
 * Article Markdown is produced in the edge function from the rendered HTML.
 * Prerender and `nuxt preview` skip this so the static HTML stays HTML.
 */
export default defineEventHandler((event) => {
  if (!import.meta.dev) return

  const url = getRequestURL(event)
  const decision = classifyAgentRequest({
    method: event.method,
    pathname: url.pathname,
    accept: getRequestHeader(event, 'accept'),
  })
  if (decision.action !== 'markdown') return

  setResponseStatus(event, decision.status)
  setResponseHeader(event, 'content-type', MARKDOWN_CONTENT_TYPE)
  setResponseHeader(event, 'vary', VARY_ACCEPT)
  return event.method === 'HEAD' ? '' : decision.body
})
