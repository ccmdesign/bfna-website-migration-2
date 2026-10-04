/**
 * CI-friendly checks for agent artifacts (vitest/nuxt harness optional).
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  buildLlmsTxt,
  buildRobotsTxt,
  buildSitemapXml,
  MARKDOWN_404_BODY
} from './generate-agent-artifacts'
import { agentIndexRoutes, markdownPathForRoute } from './lib/agent-routes'

const appRoot = resolve(import.meta.dirname, '..')
const publicRoot = resolve(appRoot, 'public')

function fail(message: string): never {
  console.error(`check:agent — ${message}`)
  process.exit(1)
}

const llms = buildLlmsTxt(appRoot)
if (llms.length < 100) {
  fail('llms.txt builder output too short')
}
if (!/when to use/i.test(llms)) {
  fail('llms.txt missing when-to-use section')
}

const robots = buildRobotsTxt()
if (!robots.includes('Sitemap: https://www.bfna.org/sitemap.xml')) {
  fail('robots.txt missing Sitemap line')
}

const sitemap = buildSitemapXml(appRoot)
if (!sitemap.includes('<loc>https://www.bfna.org/</loc>')) {
  fail('sitemap missing homepage')
}
if (sitemap.includes('/wireframes') || sitemap.includes('/docs/')) {
  fail('sitemap includes excluded paths')
}

if (MARKDOWN_404_BODY.length < 20 || !MARKDOWN_404_BODY.includes('llms.txt')) {
  fail('404 markdown body incomplete')
}

for (const file of ['llms.txt', 'robots.txt', 'sitemap.xml', 'index.md']) {
  if (!existsSync(resolve(publicRoot, file))) {
    fail(`missing public/${file} — run npm run agent:generate`)
  }
}

const sampleRoute = agentIndexRoutes(appRoot).find(r => r.path === '/about')
if (!sampleRoute) {
  fail('sitemap route list missing /about')
}

const aboutMd = resolve(publicRoot, markdownPathForRoute('/about').replace(/^\//, ''))
if (!existsSync(aboutMd)) {
  fail('missing about.md twin')
}

console.log('check:agent — ok')
