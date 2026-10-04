import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { blocks, lastmod } from '../server/utils/agent-content-helpers'
import {
  buildSitemapXml,
  writeNoindexHeaders
} from '../server/utils/write-agent-files'
import {
  injectNotFoundHtml,
  markdown404Body,
  wantsMarkdown
} from '../netlify/edge-functions/negotiate'

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

function assert(condition: boolean, message: string): void {
  if (!condition) fail(message)
}

const acceptCases: Array<[string | null, boolean]> = [
  [null, false],
  ['text/html', false],
  ['text/markdown', true],
  ['text/markdown;q=0, text/html', false],
  ['text/html;q=0.8, text/markdown;q=0.2', false],
  ['text/html;q=0.5, text/markdown;q=0.9', true],
  ['text/markdown, text/html', false]
]

for (const [header, expected] of acceptCases) {
  assert(wantsMarkdown(header) === expected, `wantsMarkdown(${JSON.stringify(header)})`)
}

assert(lastmod('2024-02-26') === '2024-02-26', 'lastmod valid date')
assert(lastmod('2024-02-31') === undefined, 'lastmod invalid date')
assert(lastmod('February 26, 2024') === undefined, 'lastmod non-iso')
assert(lastmod(null) === undefined, 'lastmod null')

const blocked = blocks('One.\n\nTwo.')
assert(blocked.includes('\n\n'), 'blocks preserves paragraph breaks')

const md404 = markdown404Body()
assert(md404.length >= 20, 'markdown404Body length')
assert(md404.includes('/sitemap.xml') && md404.includes('/llms.txt') && md404.includes('(/'), 'markdown404Body links')

const injected = injectNotFoundHtml('<div id="__nuxt"></div>')
assert(injected.includes('Page not found') && injected.includes('href="/llms.txt"'), 'injectNotFoundHtml')

const sitemap = buildSitemapXml(
  ['/', '/about', '/privacy'],
  'https://www.bfna.org',
  {}
)
assert(sitemap.includes('https://www.bfna.org/privacy'), 'sitemap privacy')
assert(!sitemap.includes('/docs') && !sitemap.includes('/wireframes') && !sitemap.includes('/search'), 'sitemap excludes')

const headerDir = join(tmpdir(), `bfna-agent-headers-${process.pid}`)
rmSync(headerDir, { recursive: true, force: true })
mkdirSync(headerDir, { recursive: true })

const savedContext = process.env.CONTEXT
try {
  delete process.env.CONTEXT
  writeNoindexHeaders(headerDir)
  let headers = readFileSync(join(headerDir, '_headers'), 'utf8')
  assert(headers.includes('Content-Type: text/markdown'), 'headers markdown content-type')
  assert(!headers.includes('X-Robots-Tag'), 'headers no noindex when CONTEXT unset')

  process.env.CONTEXT = 'branch-deploy'
  writeNoindexHeaders(headerDir)
  headers = readFileSync(join(headerDir, '_headers'), 'utf8')
  assert(headers.includes('X-Robots-Tag: noindex, nofollow'), 'headers branch-deploy noindex')

  process.env.CONTEXT = 'production'
  writeNoindexHeaders(headerDir)
  headers = readFileSync(join(headerDir, '_headers'), 'utf8')
  assert(!headers.includes('X-Robots-Tag'), 'headers production no noindex')
} finally {
  if (savedContext === undefined) delete process.env.CONTEXT
  else process.env.CONTEXT = savedContext
  rmSync(headerDir, { recursive: true, force: true })
}

console.log('check-agent-readiness: ok')
