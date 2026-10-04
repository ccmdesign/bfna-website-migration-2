import { acceptsMarkdown } from '../../src/utils/accept'

interface Context {
  next: (options?: { rewrite?: URL | string }) => Promise<Response>
}

const withVary = (headers: Headers): Headers => {
  const values = headers.get('Vary')?.split(',').map(value => value.trim()).filter(Boolean) || []
  if (!values.some(value => value.toLowerCase() === 'accept')) values.push('Accept')
  const updated = new Headers(headers)
  updated.set('Vary', values.join(', '))
  return updated
}

export default async (request: Request, context: Context): Promise<Response> => {
  const url = new URL(request.url)
  if (url.pathname.endsWith('.md')) return context.next()

  const wantsMarkdown = acceptsMarkdown(request.headers.get('Accept'))
  const response = wantsMarkdown
    ? await context.next({ rewrite: `${url.pathname === '/' ? '' : url.pathname}/index.md` })
    : await context.next()

  if (wantsMarkdown && response.status === 404) {
    return new Response(
      `# Page not found\n\nThe requested page does not exist. Return to the [homepage](${url.origin}/), browse the [sitemap](${url.origin}/sitemap.xml), or read [llms.txt](${url.origin}/llms.txt).\n`,
      { status: 404, headers: withVary(new Headers({ 'Content-Type': 'text/markdown; charset=utf-8' })) }
    )
  }

  const headers = withVary(response.headers)
  if (wantsMarkdown && response.ok) headers.set('Content-Type', 'text/markdown; charset=utf-8')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
