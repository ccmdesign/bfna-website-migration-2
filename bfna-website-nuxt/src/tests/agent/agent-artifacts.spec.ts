import { describe, expect, it } from 'vitest'

import {
  buildLlmsTxt,
  buildRobotsTxt,
  buildSitemapXml,
  MARKDOWN_404_BODY
} from '../../scripts/generate-agent-artifacts'
import {
  agentIndexRoutes,
  isAgentIndexable,
  markdownPathForRoute
} from '../../scripts/lib/agent-routes'
import { absoluteUrl, normalizeSiteUrl } from '~/utils/site-url'

import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

describe('site-url', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizeSiteUrl('https://www.bfna.org/')).toBe('https://www.bfna.org')
  })

  it('builds canonical home URL', () => {
    expect(absoluteUrl('https://www.bfna.org', '/')).toBe('https://www.bfna.org/')
  })
})

describe('agent routes', () => {
  it('excludes internal sections from the sitemap set', () => {
    expect(isAgentIndexable('/docs/button')).toBe(false)
    expect(isAgentIndexable('/wireframes/about')).toBe(false)
    expect(isAgentIndexable('/search')).toBe(false)
    expect(isAgentIndexable('/about')).toBe(true)
  })

  it('maps homepage markdown path', () => {
    expect(markdownPathForRoute('/')).toBe('/index.md')
    expect(markdownPathForRoute('/about')).toBe('/about.md')
  })

  it('includes privacy and contact in index routes', () => {
    const paths = agentIndexRoutes(appRoot).map(r => r.path)
    expect(paths).toContain('/privacy')
    expect(paths).toContain('/contact')
  })
})

describe('agent artifacts', () => {
  it('llms.txt includes when-to-use guidance and enough content', () => {
    const text = buildLlmsTxt(appRoot)
    expect(text.length).toBeGreaterThan(100)
    expect(text.toLowerCase()).toMatch(/when to use/)
  })

  it('robots.txt references production sitemap', () => {
    const robots = buildRobotsTxt()
    expect(robots).toContain('Sitemap: https://www.bfna.org/sitemap.xml')
    expect(robots).toContain('GPTBot')
  })

  it('sitemap.xml lists public URLs with lastmod where available', () => {
    const xml = buildSitemapXml(appRoot)
    expect(xml).toContain('<urlset')
    expect(xml).toContain('<loc>https://www.bfna.org/</loc>')
    expect(xml).not.toContain('/wireframes')
    expect(xml).not.toContain('/docs')
    expect(xml).not.toContain('/search</loc>')
  })

  it('404 markdown body links to recovery resources', () => {
    expect(MARKDOWN_404_BODY.length).toBeGreaterThan(20)
    expect(MARKDOWN_404_BODY).toContain('llms.txt')
    expect(MARKDOWN_404_BODY).toContain('sitemap')
  })
})
