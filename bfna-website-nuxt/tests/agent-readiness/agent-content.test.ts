import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import handler from '../../netlify/edge-functions/markdown-negotiate'
import {
  CONTACT_EMAIL,
  MARKDOWN_CONTENT_TYPE,
  MCP_PATH,
  MCP_PROTOCOL_VERSION,
  SITE_NAME,
  SITE_URL,
  SITEMAP_EXCLUDED_PREFIXES,
  VARY_ACCEPT,
  aboutPage,
  agentInstructions,
  apiResult,
  classifyAgentRequest,
  contactPage,
  developersPage,
  headersForContext,
  healthDocument,
  homeMarkdown,
  navigationDocument,
  homePlainText,
  isIndexablePath,
  llmsTxt,
  markdownForUpstreamMiss,
  mcpResult,
  mcpServerCard,
  negotiate,
  notFoundMarkdown,
  openapiDocument,
  openapiJson,
  organizationDocument,
  organizationJsonLd,
  pagePlainText,
  privacyPage,
  robotsTxt,
  sitemapXml,
} from '../../utils/agentContent'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CHROME_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'

describe('markdown negotiation', () => {
  it('serves markdown only when it outranks html', () => {
    expect(negotiate('text/markdown', ['text/html', 'text/markdown'])).toBe('text/markdown')
    expect(negotiate('text/markdown, text/html;q=0.8', ['text/html', 'text/markdown'])).toBe('text/markdown')
    expect(negotiate('text/html', ['text/html', 'text/markdown'])).toBe('text/html')
    expect(negotiate('text/markdown;q=0, text/html', ['text/html', 'text/markdown'])).toBe('text/html')
    expect(negotiate('text/markdown;q=0', ['text/html', 'text/markdown'])).toBeNull()
    expect(negotiate(null, ['text/html', 'text/markdown'])).toBe('text/html')
    expect(negotiate(undefined, ['text/html', 'text/markdown'])).toBe('text/html')
    expect(negotiate('', ['text/html', 'text/markdown'])).toBe('text/html')
    expect(negotiate('*/*', ['text/html', 'text/markdown'])).toBe('text/html')
    expect(negotiate(CHROME_ACCEPT, ['text/html', 'text/markdown'])).toBe('text/html')
  })

  it('returns a markdown homepage and leaves html requests alone', () => {
    const markdown = classifyAgentRequest({
      method: 'GET',
      pathname: '/',
      accept: 'text/markdown',
    })
    expect(markdown).toMatchObject({ action: 'markdown', status: 200 })
    if (markdown.action === 'markdown') {
      expect(markdown.body.length).toBeGreaterThan(500)
      expect(markdown.body.startsWith(`# ${SITE_NAME}`)).toBe(true)
    }

    expect(classifyAgentRequest({
      method: 'GET',
      pathname: '/',
      accept: 'text/html',
    })).toEqual({ action: 'delegate' })

    expect(classifyAgentRequest({
      method: 'GET',
      pathname: '/',
      accept: null,
    })).toEqual({ action: 'delegate' })

    expect(classifyAgentRequest({
      method: 'GET',
      pathname: '/',
      accept: '*/*',
    })).toEqual({ action: 'delegate' })

    expect(classifyAgentRequest({
      method: 'GET',
      pathname: '/',
      accept: CHROME_ACCEPT,
    })).toEqual({ action: 'delegate' })

    expect(classifyAgentRequest({
      method: 'POST',
      pathname: '/',
      accept: 'text/markdown',
    })).toEqual({ action: 'delegate' })

    expect(classifyAgentRequest({
      method: 'GET',
      pathname: '/images/logo.svg',
      accept: 'text/markdown',
    })).toEqual({ action: 'delegate' })
  })

  it('keeps HTTP 404 and returns a markdown error with a recovery link', () => {
    expect(classifyAgentRequest({
      method: 'GET',
      pathname: '/__ora-404-probe',
      accept: 'text/markdown',
    })).toEqual({ action: 'check-upstream' })

    const miss = markdownForUpstreamMiss('/__ora-404-probe', 404)
    expect(miss?.status).toBe(404)
    expect(miss?.body.length).toBeGreaterThan(20)
    expect(miss?.body).toContain(`${SITE_URL}/llms.txt`)
    expect(miss?.body).toContain(`${SITE_URL}/sitemap.xml`)
    expect(markdownForUpstreamMiss('/insights', 200)).toBeNull()
    expect(markdownForUpstreamMiss('/missing', 500)).toBeNull()
    expect(MARKDOWN_CONTENT_TYPE.startsWith('text/markdown')).toBe(true)
    expect(VARY_ACCEPT).toBe('Accept')
    expect(notFoundMarkdown('/missing').includes('404')).toBe(true)
  })

  it('runs the edge handler: markdown home, html home, star, markdown 404, upstream 200', async () => {
    const home = await handler(
      new Request(`${SITE_URL}/`, { headers: { accept: 'text/markdown' } }),
      { next: async () => { throw new Error('homepage markdown must not fall through') } },
    )
    expect(home.status).toBe(200)
    expect(home.headers.get('content-type')).toContain('text/markdown')
    expect(home.headers.get('vary')).toBe('Accept')
    expect(await home.text()).toContain(`# ${SITE_NAME}`)

    const html = await handler(
      new Request(`${SITE_URL}/`, { headers: { accept: 'text/html' } }),
      { next: async () => new Response('<html>ok</html>', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }) },
    )
    expect(html.status).toBe(200)
    expect(html.headers.get('content-type')).toContain('text/html')
    expect(await html.text()).toContain('<html>ok</html>')

    const star = await handler(
      new Request(`${SITE_URL}/`),
      { next: async () => new Response('<html>star</html>', { status: 200, headers: { 'content-type': 'text/html' } }) },
    )
    expect(star.status).toBe(200)
    expect(await star.text()).toContain('star')

    const missing = await handler(
      new Request(`${SITE_URL}/__ora-404-probe-srf27dsd`, { headers: { accept: 'text/markdown' } }),
      { next: async () => new Response('<html>missing</html>', { status: 404, headers: { 'content-type': 'text/html' } }) },
    )
    const body = await missing.text()
    expect(missing.status).toBe(404)
    expect(missing.headers.get('content-type')).toContain('text/markdown')
    expect(missing.headers.get('vary')).toBe('Accept')
    expect(body.length).toBeGreaterThan(20)
    expect(body).toContain(`${SITE_URL}/llms.txt`)
    expect(body).not.toContain('missing')

    const html404 = await handler(
      new Request(`${SITE_URL}/__ora-404-probe-srf27dsd`),
      { next: async () => new Response('<html>missing</html>', { status: 404, headers: { 'content-type': 'text/html' } }) },
    )
    expect(html404.status).toBe(404)
    expect(html404.headers.get('content-type')).toContain('text/html')
    expect(await html404.text()).toContain('missing')

    const article = await handler(
      new Request(`${SITE_URL}/insights/example`, { headers: { accept: 'text/markdown' } }),
      { next: async () => new Response('<html><h1>Example</h1></html>', { status: 200, headers: { 'content-type': 'text/html' } }) },
    )
    expect(article.status).toBe(200)
    expect(await article.text()).toContain('<h1>Example</h1>')
  })

  it('is the only edge function and does not fetch the site', () => {
    const edgeDir = resolve(root, 'netlify/edge-functions')
    expect(readdirSync(edgeDir)).toEqual(['markdown-negotiate.ts'])
    const source = readFileSync(resolve(edgeDir, 'markdown-negotiate.ts'), 'utf8')
    expect(source).toContain('export default')
    expect(source).toContain("from '../../utils/agentContent.ts'")
    expect(source).not.toMatch(/\bfetch\s*\(/)
  })
})

describe('public api and mcp', () => {
  it('returns JSON for the published operations and JSON errors otherwise', async () => {
    const org = await handler(
      new Request(`${SITE_URL}/api/v1/organization`, { headers: { accept: 'application/json' } }),
      { next: async () => { throw new Error('api must not fall through') } },
    )
    expect(org.status).toBe(200)
    expect(org.headers.get('content-type')).toContain('application/json')
    expect(JSON.parse(await org.text())).toEqual(organizationDocument())

    const missing = await handler(
      new Request(`${SITE_URL}/api/v1/does-not-exist`),
      { next: async () => { throw new Error('api 404 must not fall through') } },
    )
    expect(missing.status).toBe(404)
    expect(missing.headers.get('content-type')).toContain('application/json')
    const error = JSON.parse(await missing.text())
    expect(error.error.code).toBe('not_found')
    expect(error.error.message.length).toBeGreaterThan(10)
    expect(error.error.hint).toContain('/openapi.json')

    const posted = await handler(
      new Request(`${SITE_URL}/api/v1/organization`, { method: 'POST' }),
      { next: async () => { throw new Error('api 405 must not fall through') } },
    )
    expect(posted.status).toBe(405)
    const postedBody = JSON.parse(await posted.text())
    expect(postedBody.error.code).toBe('method_not_allowed')
    expect(posted.headers.get('allow')).toContain('GET')

    const badSection = apiResult('GET', '/api/v1/navigation', 'docs')
    expect(badSection?.status).toBe(400)
    expect(JSON.parse(badSection?.body || '').error.code).toBe('invalid_section')
    expect(healthDocument().status).toBe('ok')
    expect(readFileSync(resolve(root, 'public/api/v1/organization'), 'utf8')).toBe(`${JSON.stringify(organizationDocument())}\n`)
    expect(readFileSync(resolve(root, 'public/api/v1/navigation'), 'utf8')).toBe(`${JSON.stringify(navigationDocument(null))}\n`)
    expect(readFileSync(resolve(root, 'public/api/v1/health'), 'utf8')).toBe(`${JSON.stringify(healthDocument())}\n`)
    expect(readFileSync(resolve(root, 'public/.well-known/mcp'), 'utf8')).toBe(`${JSON.stringify(mcpServerCard, null, 2)}\n`)
  })

  it('answers an MCP initialize handshake at /.well-known/mcp', async () => {
    const card = await handler(
      new Request(`${SITE_URL}${MCP_PATH}`),
      { next: async () => { throw new Error('mcp must not fall through') } },
    )
    expect(card.status).toBe(200)
    expect(card.headers.get('content-type')).toContain('application/json')
    const cardBody = JSON.parse(await card.text())
    expect(cardBody.transport.type).toBe('streamable-http')
    expect(cardBody.transport.endpoint).toBe(MCP_PATH)
    expect(cardBody.protocolVersion).toBe(MCP_PROTOCOL_VERSION)

    const init = await handler(
      new Request(`${SITE_URL}${MCP_PATH}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: MCP_PROTOCOL_VERSION,
            capabilities: {},
            clientInfo: { name: 'ora', version: '1.0.0' },
          },
        }),
      }),
      { next: async () => { throw new Error('mcp initialize must not fall through') } },
    )
    expect(init.status).toBe(200)
    expect(init.headers.get('mcp-session-id')).toBeTruthy()
    const payload = JSON.parse(await init.text())
    expect(payload.result.protocolVersion).toBe(MCP_PROTOCOL_VERSION)
    expect(payload.result.serverInfo.name).toBe(SITE_NAME)
    expect(payload.result.capabilities.tools).toBeTruthy()

    const tools = mcpResult({
      method: 'POST',
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
    })
    const listed = JSON.parse(tools?.body || '')
    const names = listed.result.tools.map((tool: { name: string }) => tool.name)
    expect(names).toContain('get_organization')
    expect(listed.result.tools.every((tool: { description: string; inputSchema: object }) => tool.description && tool.inputSchema)).toBe(true)
    expect(mcpServerCard.authentication.required).toBe(false)
  })

  it('describes every operation with an id, a description, and a schema', () => {
    const paths = Object.values(openapiDocument.paths)
    expect(paths.length).toBeGreaterThan(0)
    const ids = new Set<string>()
    for (const path of paths) {
      for (const operation of Object.values(path)) {
        expect(operation.operationId).toBeTruthy()
        expect(ids.has(operation.operationId)).toBe(false)
        ids.add(operation.operationId)
        expect(operation.description.length).toBeGreaterThan(20)
        expect(operation.responses['200'].content['application/json'].schema).toBeTruthy()
      }
    }
    const sectionParam = openapiDocument.paths['/api/v1/navigation']?.get.parameters?.[0]
    expect(sectionParam && 'schema' in sectionParam && sectionParam.schema && 'enum' in sectionParam.schema ? sectionParam.schema.enum : []).toContain('programs')
    const file = readFileSync(resolve(root, 'public/openapi.json'), 'utf8')
    expect(file).toBe(openapiJson())
  })
})

describe('agent instructions', () => {
  it('puts when-to-use guidance in llms.txt and keeps the excluded routes out', () => {
    const file = readFileSync(resolve(root, 'public/llms.txt'), 'utf8')
    expect(file).toBe(llmsTxt)
    expect(file.startsWith(`# ${SITE_NAME}\n`)).toBe(true)
    expect(file).toMatch(/^> /m)
    expect(file.toLowerCase()).toContain('when to use this')
    expect(file).toContain('Accept: text/markdown')
    expect(file).toContain(CONTACT_EMAIL)

    const firstH2 = file.indexOf('\n## ')
    const preamble = file.slice(0, firstH2)
    expect(preamble.includes('\n# ')).toBe(false)

    const sections = file.split('\n## ').slice(1)
    expect(sections.length).toBeGreaterThan(0)
    for (const section of sections) {
      const items = section.split('\n').filter((line: string) => line.startsWith('- '))
      expect(items.length).toBeGreaterThan(0)
      for (const item of items) {
        expect(item).toMatch(/^- \[[^\]]+\]\(https:\/\/www\.bfna\.org\/[^)]+\)/)
        for (const prefix of SITEMAP_EXCLUDED_PREFIXES) {
          expect(item).not.toContain(`https://www.bfna.org${prefix}`)
        }
      }
    }
  })

  it('publishes a dedicated agent-instructions file and robots rules', () => {
    const file = readFileSync(resolve(root, 'public/agent-instructions.md'), 'utf8')
    expect(file).toBe(agentInstructions)
    expect(file).toMatch(/^## When to use this$/m)
    expect(file).toContain(CONTACT_EMAIL)
    expect(file).toContain('Accept: text/markdown')

    const robots = readFileSync(resolve(root, 'public/robots.txt'), 'utf8')
    expect(robots).toBe(robotsTxt)
    expect(robots).toContain('Disallow: /docs')
    expect(robots).toContain('Disallow: /wireframes')
    expect(robots).toContain('Disallow: /search')
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
    expect(readFileSync(resolve(root, 'src/public/robots.txt'), 'utf8')).toBe(robotsTxt)
  })
})

describe('trust pages, sitemap filter, and organization schema', () => {
  it('gives about, contact, and privacy at least 500 characters each', () => {
    expect(pagePlainText(aboutPage).length).toBeGreaterThanOrEqual(500)
    expect(pagePlainText(contactPage).length).toBeGreaterThanOrEqual(500)
    expect(pagePlainText(privacyPage).length).toBeGreaterThanOrEqual(500)
    expect(pagePlainText(developersPage).length).toBeGreaterThanOrEqual(500)
    expect(homePlainText().length).toBeGreaterThanOrEqual(500)
    expect(homeMarkdown()).toContain(SITE_NAME)
    const privacyLead = privacyPage.sections[0]
    expect(privacyLead).toBeTruthy()
    expect(privacyLead?.paragraphs.join(' ')).toContain('TODO(owner)')
    expect(JSON.stringify(organizationJsonLd)).not.toMatch(/telephone|streetAddress/)
  })

  it('emits valid Organization JSON-LD with contactPoint and PostalAddress', () => {
    const parsed = JSON.parse(JSON.stringify(organizationJsonLd))
    expect(parsed['@context']).toBe('https://schema.org')
    expect(parsed['@type']).toBe('Organization')
    expect(parsed.name).toBe(SITE_NAME)
    expect(parsed.url).toBe(SITE_URL)
    expect(parsed.description.length).toBeGreaterThan(20)
    expect(parsed.address['@type']).toBe('PostalAddress')
    expect(parsed.address.addressLocality).toBe('Washington')
    expect(parsed.address.addressRegion).toBe('DC')
    expect(parsed.address.addressCountry).toBe('US')
    expect(parsed.contactPoint['@type']).toBe('ContactPoint')
    expect(parsed.contactPoint.contactType.length).toBeGreaterThan(0)
    expect(parsed.contactPoint.email).toBe(CONTACT_EMAIL)
    expect(parsed.sameAs.length).toBeGreaterThan(0)
  })

  it('keeps docs, wireframes, and search out of the sitemap and noindexes non-production', () => {
    expect(isIndexablePath('/docs')).toBe(false)
    expect(isIndexablePath('/docs/components/button')).toBe(false)
    expect(isIndexablePath('/wireframes')).toBe(false)
    expect(isIndexablePath('/wireframes/about')).toBe(false)
    expect(isIndexablePath('/search')).toBe(false)
    expect(isIndexablePath('/insights/example')).toBe(true)
    expect(isIndexablePath('/')).toBe(true)
    expect(isIndexablePath('/404')).toBe(false)

    const xml = sitemapXml([
      { loc: `${SITE_URL}/`, lastmod: '2026-10-05' },
      { loc: `${SITE_URL}/about`, lastmod: '2026-10-05' },
    ])
    expect(xml).toContain('<loc>https://www.bfna.org/</loc>')
    expect(xml).toContain('<lastmod>2026-10-05</lastmod>')
    expect(xml).not.toContain('/docs')
    expect(xml).not.toContain('/search')

    const base = readFileSync(resolve(root, 'public/_headers'), 'utf8')
    expect(base).toContain('Content-Type: text/markdown')
    expect(base).not.toContain('X-Robots-Tag')
    const preview = headersForContext(base, 'deploy-preview')
    expect(preview).toContain('Content-Type: text/plain')
    expect(preview).toContain('X-Robots-Tag: noindex')
    expect(headersForContext(base, 'production')).not.toContain('noindex')
    expect(headersForContext(base, undefined)).toContain('X-Robots-Tag: noindex')
    expect(headersForContext(headersForContext(base, 'deploy-preview'), 'branch-deploy').match(/noindex/g)?.length).toBe(1)
  })
})
