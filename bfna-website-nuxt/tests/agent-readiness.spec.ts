import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { llmsTxt, noindexHeaders, robotsTxt, sitemapXml, whenToUse } from '../src/utils/agent-documents'
import { htmlToMarkdown } from '../src/utils/html-to-markdown'
import {
  NOT_FOUND_MARKDOWN,
  appendVary,
  isPagePath,
  markdownPath,
  negotiate,
  wantsMarkdown
} from '../src/utils/markdown-negotiation'
import { injectNotFoundHtml } from '../src/utils/not-found-html'
import {
  DEFAULT_DESCRIPTION,
  SAME_AS,
  articleJsonLd,
  canonicalUrl,
  homepageJsonLd,
  lastmodFromPublishDate,
  organizationJsonLd
} from '../src/utils/site'
import { CONTACT_SECTIONS, PRIVACY_SECTIONS, trustText, CONTACT_LEAD, PRIVACY_LEAD } from '../src/utils/trust-copy'
import { collectPublicPages } from '../scripts/write-agent-artifacts'
import home from '../content/bf/pages/home.json'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

describe('accept negotiation', () => {
  it('serves markdown only when that type outranks html', () => {
    expect(wantsMarkdown('text/markdown')).toBe(true)
    expect(wantsMarkdown('text/html')).toBe(false)
    expect(wantsMarkdown('text/markdown;q=0')).toBe(false)
    expect(wantsMarkdown('text/markdown;q=0, text/html')).toBe(false)
    expect(wantsMarkdown('text/markdown, text/html;q=0.9')).toBe(true)
    expect(wantsMarkdown('text/html, text/markdown;q=0.1')).toBe(false)
    expect(wantsMarkdown('text/markdown, text/html')).toBe(false)
    expect(wantsMarkdown('*/*')).toBe(false)
    expect(wantsMarkdown(null)).toBe(false)
  })

  it('appends Vary and does not drop Accept-Encoding', () => {
    expect(appendVary('accept-encoding', 'Accept')).toBe('accept-encoding, Accept')
    expect(appendVary('Accept', 'Accept')).toBe('Accept')
    expect(appendVary(null, 'Accept')).toBe('Accept')
  })

  it('maps pages to markdown twins and leaves files alone', () => {
    expect(markdownPath('/')).toBe('/index.md')
    expect(markdownPath('/about/')).toBe('/about.md')
    expect(isPagePath('/insights/example')).toBe(true)
    expect(isPagePath('/llms.txt')).toBe(false)
    expect(isPagePath('/sitemap.xml')).toBe(false)
  })

  it('fetches the twin without Accept: text/markdown and keeps a 404 status', async () => {
    const fetched: RequestInit[] = []
    const response = await negotiate(new Request('https://www.bfna.org/', {
      headers: { accept: 'text/markdown' }
    }), {
      next: async () => new Response('missing', {
        status: 404,
        headers: { vary: 'accept-encoding' }
      }),
      fetch: async (_input, init) => {
        fetched.push(init ?? {})
        return new Response('no twin', { status: 404 })
      }
    })
    expect(fetched).toHaveLength(1)
    const headers = new Headers(fetched[0]?.headers)
    expect(headers.get('accept')).toBe('*/*')
    expect(headers.get('accept')).not.toBe('text/markdown')
    expect(headers.get('x-bf-markdown-twin')).toBe('1')
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(response.headers.get('vary')).toBe('accept-encoding, Accept')
    const body = await response.text()
    expect(body.length).toBeGreaterThan(20)
    expect(body).toContain('/llms.txt')
    expect(body).toContain('/sitemap.xml')
  })

  it('returns the twin as markdown and leaves html requests as html', async () => {
    const markdown = await negotiate(new Request('https://www.bfna.org/about', {
      headers: { accept: 'text/markdown' }
    }), {
      next: async () => new Response('<html></html>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8', vary: 'accept-encoding' }
      }),
      fetch: async () => new Response('# About\n\nHello\n', {
        status: 200,
        headers: { 'content-type': 'text/plain', vary: 'accept-encoding' }
      })
    })
    expect(markdown.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(markdown.headers.get('vary')).toBe('accept-encoding, Accept')
    expect(await markdown.text()).toContain('# About')

    const html = await negotiate(new Request('https://www.bfna.org/about', {
      headers: { accept: 'text/html' }
    }), {
      next: async () => new Response('<main><h1>About</h1></main>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8', vary: 'accept-encoding' }
      }),
      fetch: async () => {
        throw new Error('html requests must not fetch a twin')
      }
    })
    expect(html.headers.get('content-type')).toContain('text/html')
    expect(html.headers.get('vary')).toBe('accept-encoding, Accept')
    expect(await html.text()).toContain('<h1>About</h1>')
  })

  it('does not re-enter when the twin fetch is marked', async () => {
    let fetches = 0
    const response = await negotiate(new Request('https://www.bfna.org/index.md', {
      headers: { accept: 'text/markdown', 'x-bf-markdown-twin': '1' }
    }), {
      next: async () => new Response('# Home\n', { status: 200, headers: { vary: 'accept-encoding' } }),
      fetch: async () => {
        fetches++
        return new Response('', { status: 500 })
      }
    })
    expect(fetches).toBe(0)
    expect(response.status).toBe(200)
    expect(response.headers.get('vary')).toBe('accept-encoding, Accept')
  })
})

describe('html to markdown', () => {
  it('keeps headings and paragraphs on separate lines', () => {
    const markdown = htmlToMarkdown(`
      <html><body><main>
        <h1>About</h1>
        <p>First paragraph.</p>
        <p>Second paragraph.</p>
        <h2>Board</h2>
        <ul><li><a href="/about">About</a></li></ul>
      </main></body></html>
    `)
    expect(markdown).toContain('# About\n')
    expect(markdown).toContain('First paragraph.')
    expect(markdown).toContain('Second paragraph.')
    expect(markdown).toContain('## Board')
    expect(markdown).toContain('[About](/about)')
    expect(markdown.split('\n').length).toBeGreaterThan(4)
    expect(markdown).not.toBe('# About First paragraph. Second paragraph. ## Board [About](/about)\n')
  })
})

describe('not-found html', () => {
  it('puts the fallback in noscript and leaves the Nuxt root empty', () => {
    const filled = injectNotFoundHtml('<html lang="en"><body><div id="__nuxt" data-ssr="false"></div></body></html>')
    expect(filled).toContain('lang="en"')
    expect(filled).toContain('<noscript><main id="bf-not-found"><h1>Page not found</h1>')
    expect(filled).toContain('href="/llms.txt"')
    expect(filled).toContain('<div id="__nuxt" data-ssr="false"></div>')
    expect(filled.indexOf('bf-not-found')).toBeLessThan(filled.indexOf('id="__nuxt"'))
    expect(NOT_FOUND_MARKDOWN.length).toBeGreaterThan(20)
    const again = injectNotFoundHtml(filled)
    expect(again).toBe(filled)
  })
})

describe('sitemap, robots, llms', () => {
  it('omits lastmod when the publish date cannot be parsed', () => {
    expect(lastmodFromPublishDate('2024-02-26')).toBe('2024-02-26')
    expect(lastmodFromPublishDate('2024-02-26T15:00:00Z')).toBe('2024-02-26')
    expect(lastmodFromPublishDate('February 26, 2024')).toBeUndefined()
    expect(lastmodFromPublishDate('2024-02-31')).toBeUndefined()
    expect(lastmodFromPublishDate('2024-13-01')).toBeUndefined()
    expect(lastmodFromPublishDate(null)).toBeUndefined()
    expect(lastmodFromPublishDate('')).toBeUndefined()

    const xml = sitemapXml([
      { loc: 'https://www.bfna.org/about/' },
      { loc: 'https://www.bfna.org/insights/example/', lastmod: '2024-02-26' }
    ])
    const about = xml.split('<url>').find(block => block.includes('https://www.bfna.org/about/'))
    expect(about).toBeTruthy()
    expect(about).not.toContain('<lastmod>')
    expect(xml).toContain('<lastmod>2024-02-26</lastmod>')
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
  })

  it('disallows internal paths for every crawler and points at the production sitemap', () => {
    const robots = robotsTxt('https://www.bfna.org')
    for (const agent of ['*', 'GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot']) {
      expect(robots).toContain(`User-agent: ${agent}`)
    }
    expect(robots).toContain('Disallow: /docs/')
    expect(robots).toContain('Disallow: /wireframes/')
    expect(robots).toContain('Disallow: /search')
    expect(robots).toContain('Sitemap: https://www.bfna.org/sitemap.xml')
    expect(robots).toContain('Allow: /')
  })

  it('writes noindex headers only off production', () => {
    expect(noindexHeaders(undefined)).toBeNull()
    expect(noindexHeaders('production')).toBeNull()
    expect(noindexHeaders('branch-deploy')).toContain('X-Robots-Tag: noindex')
    expect(noindexHeaders('deploy-preview')).toContain('X-Robots-Tag: noindex')
  })

  it('builds llms.txt from real public pages and leaves /docs out', () => {
    const pages = collectPublicPages()
    expect(pages.some(page => page.path === '/docs' || page.path.startsWith('/docs/'))).toBe(false)
    expect(pages.some(page => page.path.startsWith('/wireframes'))).toBe(false)
    expect(pages.some(page => page.path === '/search')).toBe(false)
    expect(pages.some(page => page.path === '/privacy')).toBe(true)
    expect(pages.some(page => page.path === '/contact')).toBe(true)
    const insight = pages.find(page => page.path === '/insights/zeitenwende-the-next-era-of-german-security')
    expect(insight?.lastmod).toBe('2024-02-26')

    const programs = pages.filter(page => page.kind === 'program')
    const text = llmsTxt({
      summary: DEFAULT_DESCRIPTION,
      whenToUse: whenToUse(programs.map(program => ({ name: program.title, path: program.path }))),
      sections: [
        { heading: 'Programs', links: programs.map(program => ({ href: `https://www.bfna.org${program.path}/`, title: program.title, description: program.description })) }
      ]
    })
    expect(text.length).toBeGreaterThan(100)
    expect(text.toLowerCase()).toContain('when to use')
    expect(text).not.toContain('/docs')
    expect(text).toContain('Democracy')
    expect(DEFAULT_DESCRIPTION).toBe(home.excerpt)
  })
})

describe('json-ld and trust pages', () => {
  it('publishes the organization from facts already on the site', () => {
    const org = organizationJsonLd('https://www.bfna.org')
    expect(org.name).toBe('Bertelsmann Foundation North America')
    expect(org.url).toBe('https://www.bfna.org/')
    expect(org.logo.url).toBe('https://www.bfna.org/images/bfna-og.jpg')
    expect(org.address.addressLocality).toBe('Washington')
    expect(org.address.addressRegion).toBe('DC')
    expect(org.contactPoint.email).toBe('info@bfna.org')
    expect(org.contactPoint).not.toHaveProperty('telephone')
    expect(JSON.stringify(org)).not.toMatch(/telephone/i)
    expect(org.sameAs).toEqual([...SAME_AS])
    expect(org.sameAs.some(url => url.includes('bluesky') || url.startsWith('#'))).toBe(false)

    const graph = homepageJsonLd('https://www.bfna.org')
    expect(graph['@graph'].map(node => node['@type'])).toEqual(['Organization', 'WebSite'])

    const article = articleJsonLd('https://www.bfna.org', {
      path: '/insights/zeitenwende-the-next-era-of-german-security',
      headline: 'Zeitenwende: The Next Era of German Security',
      datePublished: 'not a date',
      authors: ['Courtney Flynn Martino']
    })
    expect(article).not.toHaveProperty('datePublished')
    expect(article.author).toEqual([{ '@type': 'Person', name: 'Courtney Flynn Martino' }])

    const footer = readFileSync(resolve(appRoot, 'src/components/bf/Footer.vue'), 'utf8')
    const urls = [...footer.matchAll(/url: '([^']+)'/g)].map(match => match[1]).filter(url => url?.startsWith('https://'))
    expect(urls.sort()).toEqual([...SAME_AS].sort())
    expect(canonicalUrl('https://www.bfna.org', '/about')).toBe('https://www.bfna.org/about/')
    expect(canonicalUrl('https://preview.example', '/images/bfna-og.jpg')).toBe('https://preview.example/images/bfna-og.jpg')
  })

  it('gives privacy and contact more than 500 characters of real copy', () => {
    expect(trustText(PRIVACY_LEAD, PRIVACY_SECTIONS).length).toBeGreaterThan(500)
    expect(trustText(CONTACT_LEAD, CONTACT_SECTIONS).length).toBeGreaterThan(500)
    const privacy = readFileSync(resolve(appRoot, 'src/pages/privacy.vue'), 'utf8')
    const contact = readFileSync(resolve(appRoot, 'src/pages/contact.vue'), 'utf8')
    expect(privacy).toContain("definePageMeta({ layout: 'bf-default' })")
    expect(contact).toContain("definePageMeta({ layout: 'bf-default' })")
    expect(privacy).not.toContain('<NuxtLayout')
    expect(contact).not.toContain('<NuxtLayout')
    expect(privacy).not.toContain('TODO')
    expect(contact).not.toContain('TODO')
  })
})

describe('netlify registration', () => {
  it('registers the edge function once, in netlify.toml, without a build override', () => {
    const toml = readFileSync(resolve(appRoot, 'netlify.toml'), 'utf8')
    const fn = readFileSync(resolve(appRoot, 'netlify/edge-functions/markdown.ts'), 'utf8')
    expect(toml.match(/\[\[edge_functions\]\]/g)).toHaveLength(1)
    expect(toml).toContain('function = "markdown"')
    expect(toml).toContain('"/**/*.md"')
    expect(toml).not.toMatch(/^\[build\]/m)
    expect(fn).not.toContain('export const config')
    expect(fn).toContain('context.next()')
    const rules = readFileSync(resolve(appRoot, 'server/utils/legacy-redirect-rules.ts'), 'utf8')
    expect(rules).toContain("'/privacy-policy': '/privacy'")
  })
})
