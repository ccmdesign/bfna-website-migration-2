import { afterEach, describe, expect, it, vi } from 'vitest'
import markdown, { acceptsMarkdown, appendVary, markdownPathFor } from '../../../netlify/edge-functions/markdown'

type EdgeContext = Parameters<typeof markdown>[1]
const contextWith = (next: (request?: Request) => Promise<Response>): EdgeContext => ({ next } as unknown as EdgeContext)
afterEach(() => vi.restoreAllMocks())

describe('Markdown Accept negotiation', () => {
  it.each([[null, false], ['*/*', false], ['text/markdown', true], ['TEXT/MARKDOWN; Q=0.5', true], ['text/html, text/markdown;q=0', false], ['text/markdown;q=bogus, text/html', false], ['text/markdown;q=1.1', false]])('parses %s', (accept, expected) => expect(acceptsMarkdown(accept)).toBe(expected))
  it('appends Accept to Vary without replacing or duplicating values', () => { const headers = new Headers({ vary: 'Accept-Encoding' }); appendVary(headers, 'Accept'); appendVary(headers, 'accept'); expect(headers.get('vary')).toBe('Accept-Encoding, Accept') })
  it('maps root, nested, and trailing-slash paths', () => { expect(markdownPathFor('/')).toBe('/index.md'); expect(markdownPathFor('/about')).toBe('/about.md'); expect(markdownPathFor('/insights/example/')).toBe('/insights/example.md') })
})

describe('Markdown Edge Function', () => {
  it('passes HTML through with status, body, headers, and an appended Vary', async () => {
    const next = vi.fn(async () => new Response('<h1>HTML</h1>', { status: 203, headers: { vary: 'Accept-Encoding', 'x-origin': 'yes' } }))
    const response = await markdown(new Request('https://example.test/about', { headers: { accept: 'text/html,*/*' } }), contextWith(next))
    expect(next).toHaveBeenCalledWith(); expect(response.status).toBe(203); expect(await response.text()).toBe('<h1>HTML</h1>'); expect(response.headers.get('x-origin')).toBe('yes'); expect(response.headers.get('vary')).toBe('Accept-Encoding, Accept')
  })
  it('rewrites a Markdown request through context.next and never self-fetches', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch'); let downstreamRequest: Request | undefined
    const next = vi.fn(async (request?: Request) => { downstreamRequest = request; return new Response('# About', { headers: { etag: 'fixture' } }) })
    const response = await markdown(new Request('https://example.test/about?campaign=x', { headers: { accept: 'text/markdown' } }), contextWith(next))
    expect(downstreamRequest?.url).toBe('https://example.test/about.md'); expect(fetchSpy).not.toHaveBeenCalled(); expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8'); expect(response.headers.get('etag')).toBe('fixture'); expect(await response.text()).toBe('# About')
  })
  it('returns a useful Markdown 404 when the twin is missing', async () => {
    const response = await markdown(new Request('https://example.test/not-real', { headers: { accept: 'text/markdown' } }), contextWith(async () => new Response('origin miss', { status: 404 })))
    expect(response.status).toBe(404); expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8'); const body = await response.text(); expect(body).toContain('# Page not found'); expect(body).toContain('[BFNA home](/)'); expect(body).toContain('[Sitemap](/sitemap.xml)'); expect(body).toContain('[AI guidance](/llms.txt)')
  })
})
