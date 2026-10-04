import type { Context } from '@netlify/edge-functions'

const MARKDOWN_TYPE = 'text/markdown'

export const acceptsMarkdown = (accept: string | null): boolean => {
  if (!accept) return false
  return accept.split(',').some(range => {
    const [rawType, ...rawParameters] = range.split(';')
    if (rawType?.trim().toLowerCase() !== MARKDOWN_TYPE) return false
    let quality = 1
    for (const parameter of rawParameters) {
      const [rawName, rawValue] = parameter.split('=', 2)
      if (rawName?.trim().toLowerCase() !== 'q') continue
      const parsed = Number(rawValue?.trim())
      quality = Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0
    }
    return quality > 0
  })
}

export const appendVary = (headers: Headers, token: string): void => {
  const values = (headers.get('vary') ?? '').split(',').map(value => value.trim()).filter(Boolean)
  if (!values.some(value => value.toLowerCase() === token.toLowerCase())) values.push(token)
  headers.set('vary', values.join(', '))
}

export const markdownPathFor = (pathname: string): string => pathname === '/' ? '/index.md' : `${pathname.replace(/\/+$/, '')}.md`

const markdownNotFound = (pathname: string): Response => {
  const headers = new Headers({ 'content-type': `${MARKDOWN_TYPE}; charset=utf-8` })
  appendVary(headers, 'Accept')
  return new Response(`# Page not found\n\nNo Markdown representation exists for \`${pathname}\`.\n\n- [BFNA home](/)\n- [Sitemap](/sitemap.xml)\n- [AI guidance](/llms.txt)\n`, { status: 404, headers })
}

export default async function markdown(request: Request, context: Context): Promise<Response> {
  if (!acceptsMarkdown(request.headers.get('accept'))) {
    const response = await context.next(); const headers = new Headers(response.headers); appendVary(headers, 'Accept')
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  }
  const requestedUrl = new URL(request.url); const markdownUrl = new URL(markdownPathFor(requestedUrl.pathname), requestedUrl); markdownUrl.search = ''
  const response = await context.next(new Request(markdownUrl, request))
  if (response.status === 404) return markdownNotFound(requestedUrl.pathname)
  const headers = new Headers(response.headers); headers.set('content-type', `${MARKDOWN_TYPE}; charset=utf-8`); appendVary(headers, 'Accept')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
