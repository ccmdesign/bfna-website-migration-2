import type { Dirent } from 'node:fs'
import { appendFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { blocks, lastmod } from './agent-content-helpers'

const moduleDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(moduleDir, '../..')
const contentRoot = resolve(projectRoot, 'content/bf')

const SITE_NAME = 'Bertelsmann Foundation North America'

type JsonDoc = Record<string, unknown>

function collectionSlugs(collection: string): string[] {
  try {
    return readdirSync(resolve(contentRoot, collection), { withFileTypes: true })
      .filter((entry: Dirent) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry: Dirent) => entry.name.replace(/\.json$/, ''))
      .sort()
  } catch {
    return []
  }
}

function readJson(relativePath: string): JsonDoc | null {
  try {
    return JSON.parse(readFileSync(resolve(contentRoot, relativePath), 'utf8')) as JsonDoc
  } catch {
    return null
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function firstParagraph(text: string): string {
  const trimmed = blocks(text)
  if (!trimmed) return ''
  const para = trimmed.split(/\n\n+/)[0]?.trim()
  return para ?? trimmed
}

function bodyField(doc: JsonDoc): string {
  const order = ['description', 'intro', 'content', 'excerpt'] as const
  for (const key of order) {
    const value = doc[key]
    if (typeof value === 'string' && value.trim()) return blocks(value)
  }
  return ''
}

export function buildSitemapXml(
  paths: string[],
  siteUrl: string,
  lastmodByPath: Record<string, string | undefined>
): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ]
  for (const path of paths) {
    const loc = `${siteUrl}${path === '/' ? '/' : path}`
    lines.push('  <url>')
    lines.push(`    <loc>${escapeXml(loc)}</loc>`)
    const mod = lastmodByPath[path]
    if (mod) lines.push(`    <lastmod>${mod}</lastmod>`)
    lines.push('  </url>')
  }
  lines.push('</urlset>')
  return `${lines.join('\n')}\n`
}

function collectRoutes(): string[] {
  const programSlugs = collectionSlugs('programs')
  const insightSlugs = collectionSlugs('insights')
  const projectSlugs = collectionSlugs('projects')

  return [
    '/',
    '/about',
    '/archive',
    '/insights',
    '/projects',
    '/privacy',
    ...programSlugs.map(slug => `/${slug}`),
    ...insightSlugs.map(slug => `/insights/${slug}`),
    ...projectSlugs.map(slug => `/projects/${slug}`)
  ]
}

function lastmodForPath(path: string): string | undefined {
  if (path === '/' || path === '/about' || path === '/archive' || path === '/insights' || path === '/projects' || path === '/privacy') {
    return undefined
  }
  if (path.startsWith('/insights/')) {
    const slug = path.slice('/insights/'.length)
    const doc = readJson(`insights/${slug}.json`)
    return lastmod(doc?.publish_date as string | null | undefined)
  }
  return undefined
}

function robotsText(siteUrl: string): string {
  return `User-agent: *
Allow: /
Disallow: /docs/
Disallow: /wireframes/
Disallow: /search

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
}

function llmsText(siteUrl: string): string {
  const home = readJson('pages/home.json')
  const excerpt = typeof home?.excerpt === 'string' ? home.excerpt : ''

  const programLines = collectionSlugs('programs').map(slug => {
    const doc = readJson(`programs/${slug}.json`)
    const name = typeof doc?.name === 'string' ? doc.name : slug
    const tagline = typeof doc?.tagline === 'string' ? doc.tagline : ''
    return `- [${name}](${siteUrl}/${slug}): ${tagline}`
  })

  const projectBullets: string[] = []
  for (const slug of collectionSlugs('projects')) {
    const doc = readJson(`projects/${slug}.json`)
    if (!doc) continue
    if (doc.nav !== true && doc.featured !== true) continue
    const heading = typeof doc.heading === 'string' ? doc.heading.trim() : ''
    if (!heading) continue
    const excerptText = typeof doc.excerpt === 'string' ? doc.excerpt : ''
    projectBullets.push(`- [${heading}](${siteUrl}/projects/${slug}): ${excerptText}`)
  }

  const insightCandidates = collectionSlugs('insights')
    .map(slug => ({ slug, doc: readJson(`insights/${slug}.json`) }))
    .filter(({ doc }) => doc && lastmod(doc.publish_date as string | undefined))
    .sort((a, b) => String(b.doc!.publish_date).localeCompare(String(a.doc!.publish_date)))
    .slice(0, 10)

  const insightBullets = insightCandidates.map(({ slug, doc }) => {
    const heading = typeof doc!.heading === 'string' ? doc!.heading.trim() : ''
    const desc =
      (typeof doc!.excerpt === 'string' && doc!.excerpt.trim())
        ? doc!.excerpt
        : firstParagraph(String(doc!.content ?? ''))
    return `- [${heading}](${siteUrl}/insights/${slug}): ${desc}`
  }).filter(line => !line.startsWith('- []'))

  return `# ${SITE_NAME}

> ${excerpt}

## When to use this site

Use this site when you need Bertelsmann Foundation North America research on the transatlantic relationship, democracy, or US-European cooperation. Read /democracy for the democracy program, /transatlantic-relations-global-challenges for geopolitical and economic change, and /future-leadership for the fellowship and leadership work. Read /insights/<slug> for a single article, video, or report, and /projects/<slug> for a program such as RANGE or the Transatlantic Barometer. Read /about for the mission, board, team, and the contact email info@bfna.org. Read /privacy for what this website collects. This site is not an API and it has no developer portal; /docs is an internal design system and is out of scope.

## Programs

${programLines.join('\n')}

## Projects

${projectBullets.join('\n')}

## Insights

${insightBullets.join('\n')}

## Organization

- [About](${siteUrl}/about): Mission, board, team, and contact.
- [Contact](${siteUrl}/about#contact): Email info@bfna.org. The form on that band does not submit.
- [Privacy](${siteUrl}/privacy): What this website does with personal information.
- [Insights index](${siteUrl}/insights): All insights.
- [Projects index](${siteUrl}/projects): All projects.
- [Archive](${siteUrl}/archive): Archived work.
`
}

function twinForRoute(path: string, siteUrl: string): string {
  let heading = SITE_NAME
  let body = ''

  if (path === '/') {
    const home = readJson('pages/home.json')
    const homeHeading = typeof home?.heading === 'string' ? home.heading : ''
    heading = `${homeHeading}\n\n${SITE_NAME}`
    body = bodyField(home ?? {})
  } else if (path === '/privacy') {
    heading = 'Privacy'
    body = 'The Bertelsmann Foundation North America publishes this website as a static collection of pages about its research, programs, projects, and insights.'
  } else if (path === '/about' || path === '/archive' || path === '/insights' || path === '/projects') {
    const slug = path.slice(1)
    const page = readJson(`pages/${slug}.json`)
    heading = typeof page?.heading === 'string' ? page.heading : slug
    body = bodyField(page ?? {})
  } else if (path.startsWith('/insights/')) {
    const slug = path.slice('/insights/'.length)
    const doc = readJson(`insights/${slug}.json`)
    heading = typeof doc?.heading === 'string' ? doc.heading : slug
    body = bodyField(doc ?? {})
  } else if (path.startsWith('/projects/')) {
    const slug = path.slice('/projects/'.length)
    const doc = readJson(`projects/${slug}.json`)
    heading = typeof doc?.heading === 'string' ? doc.heading : slug
    body = bodyField(doc ?? {})
  } else {
    const slug = path.slice(1)
    const doc = readJson(`programs/${slug}.json`)
    heading = typeof doc?.name === 'string' ? doc.name : slug
    body = bodyField(doc ?? {})
  }

  const canonicalPath = path === '/' ? '/' : path
  return `# ${heading}

${body}

Canonical: ${siteUrl}${canonicalPath}
`
}

function twinOutputPath(routePath: string, outputDir: string): string {
  const twin = routePath === '/' ? '/index.md' : `${routePath}.md`
  if (twin === '/index.md') return resolve(outputDir, 'index.md')
  return resolve(outputDir, twin.slice(1))
}

/** Netlify CONTEXT: production | deploy-preview | branch-deploy | dev. Unset locally and in CI. */
export function writeNoindexHeaders(outputDir: string): void {
  mkdirSync(outputDir, { recursive: true })
  const file = `${outputDir}/_headers`
  const markdown = [
    '# Generated by server/utils/write-agent-files.ts. Do not commit.',
    '/*.md',
    '  Content-Type: text/markdown; charset=utf-8',
    '  Vary: Accept, Accept-Encoding',
    '/*/*.md',
    '  Content-Type: text/markdown; charset=utf-8',
    '  Vary: Accept, Accept-Encoding',
    ''
  ].join('\n')
  writeFileSync(file, markdown)
  const context = process.env.CONTEXT
  if (context && context !== 'production') {
    appendFileSync(file, [
      '/*',
      '  X-Robots-Tag: noindex, nofollow',
      ''
    ].join('\n'))
  }
}

export async function writeAgentFiles(): Promise<void> {
  const outputDir = resolve(moduleDir, '../../.output/public')
  const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || 'https://www.bfna.org').replace(/\/$/, '')

  mkdirSync(outputDir, { recursive: true })

  const routes = collectRoutes()
  const lastmodByPath: Record<string, string | undefined> = {}
  for (const path of routes) {
    lastmodByPath[path] = lastmodForPath(path)
  }

  writeFileSync(resolve(outputDir, 'sitemap.xml'), buildSitemapXml(routes, siteUrl, lastmodByPath))
  writeFileSync(resolve(outputDir, 'llms.txt'), llmsText(siteUrl))
  writeFileSync(resolve(outputDir, 'robots.txt'), robotsText(siteUrl))

  for (const path of routes) {
    const filePath = twinOutputPath(path, outputDir)
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, twinForRoute(path, siteUrl))
  }

  writeNoindexHeaders(outputDir)
}
