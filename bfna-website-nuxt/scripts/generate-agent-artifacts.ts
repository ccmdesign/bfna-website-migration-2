/**
 * Build-time agent artifacts: llms.txt, robots.txt, sitemap.xml, Markdown twins.
 *
 *   npm run agent:generate          # write into public/ (before nuxt generate)
 *   npm run agent:generate -- --post  # patch .output/public/404.html after generate
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  agentIndexRoutes,
  markdownPathForRoute,
  publicPrerenderPaths
} from './lib/agent-routes'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDir, '..')
const publicRoot = resolve(appRoot, 'public')
const outputRoot = resolve(appRoot, '.output/public')

const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || 'https://www.bfna.org').replace(/\/+$/, '')

interface PageDoc {
  slug?: string
  heading?: string | null
  name?: string | null
  description?: string | null
  excerpt?: string | null
  content?: string | null
  publish_date?: string | null
  authors?: string[] | null
}

function readJson<T>(path: string): T | undefined {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch {
    return undefined
  }
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstParagraph(text: string, max = 320): string {
  const plain = stripHtml(text)
  if (plain.length <= max) {
    return plain
  }
  return `${plain.slice(0, max - 1).trim()}…`
}

function programLines(appRoot: string): string[] {
  const dir = resolve(appRoot, 'content/bf/programs')
  return readdirSorted(dir).map(file => {
    const doc = readJson<PageDoc>(resolve(dir, file))
    if (!doc?.slug) {
      return null
    }
    const label = doc.name || doc.slug
    const blurb = firstParagraph(doc.description || doc.excerpt || doc.heading || label, 120)
    return `- [${label}](${siteUrl}/${doc.slug}): ${blurb}`
  }).filter((line): line is string => Boolean(line))
}

function readdirSorted(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter(name => name.endsWith('.json'))
      .sort()
  } catch {
    return []
  }
}

function latestInsightLines(appRoot: string, limit = 6): string[] {
  const dir = resolve(appRoot, 'content/bf/insights')
  const rows = readdirSorted(dir)
    .map(file => readJson<PageDoc>(resolve(dir, file)))
    .filter((doc): doc is PageDoc => Boolean(doc?.slug))
    .sort((a, b) => String(b.publish_date || '').localeCompare(String(a.publish_date || '')))
    .slice(0, limit)

  return rows.map(doc => {
    const title = doc.heading || doc.slug || 'Insight'
    const blurb = firstParagraph(doc.excerpt || doc.description || '', 100)
    return `- [${title}](${siteUrl}/insights/${doc.slug}): ${blurb}`
  })
}

export function buildLlmsTxt(appRoot: string): string {
  const home = readJson<PageDoc>(resolve(appRoot, 'content/bf/pages/home.json'))
  const summary =
    home?.description ||
    home?.excerpt ||
    'The Bertelsmann Foundation North America publishes research and dialogue on transatlantic relations, democracy, and global challenges.'

  const programs = programLines(appRoot)
  const insights = latestInsightLines(appRoot)

  return `# Bertelsmann Foundation North America

> ${summary}

## When to use this site

Use this site when you need primary-source information from the Bertelsmann Foundation North America (BFNA) about transatlantic policy, democracy, future leadership, and related research programs—not generic news aggregation. Prefer BFNA pages for official program descriptions, curated project portfolios, and the foundation’s own publications (insights, reports, and multimedia). For organization background and people, start with About; for publication lists and article text, use Insights; for flagship initiatives and tools, use Projects or the program hubs linked below. Do not treat \`/docs\` as the public website—it is an internal design-system reference.

## Key pages

- [Home](${siteUrl}/): Overview of BFNA programs, featured projects, and latest insights.
- [About](${siteUrl}/about): Mission, board, team, and contact information.
- [Contact](${siteUrl}/contact): Contact form and visit details.
- [Privacy](${siteUrl}/privacy): How this site handles data and third-party services.
- [Insights index](${siteUrl}/insights): Searchable archive of BFNA publications and analysis.
- [Projects index](${siteUrl}/projects): Flagship initiatives, tools, and series.
- [Archive](${siteUrl}/archive): Older material retained for reference.
- [Sitemap](${siteUrl}/sitemap.xml): Machine-readable list of public URLs.
- [llms.txt](${siteUrl}/llms.txt): This file.

## Programs

${programs.join('\n')}

## Recent insights

${insights.join('\n')}
`
}

export function buildRobotsTxt(): string {
  return `# Bertelsmann Foundation North America (${siteUrl})
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
}

export function buildSitemapXml(appRoot: string): string {
  const routes = agentIndexRoutes(appRoot)
  const urls = routes
    .map(({ path, lastmod }) => {
      const loc = path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`
      const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
      return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

function markdownForRoute(appRoot: string, routePath: string): string | null {
  if (routePath === '/') {
    const home = readJson<PageDoc>(resolve(appRoot, 'content/bf/pages/home.json'))
    if (!home) {
      return null
    }
    return `# ${home.heading || 'Bertelsmann Foundation North America'}

${home.description || home.excerpt || ''}

## Links

- [About](${siteUrl}/about)
- [Insights](${siteUrl}/insights)
- [Projects](${siteUrl}/projects)
- [llms.txt](${siteUrl}/llms.txt)
`
  }

  if (routePath === '/about') {
    const about = readJson<PageDoc>(resolve(appRoot, 'content/bf/pages/about.json'))
    if (!about) {
      return null
    }
    return `# ${about.heading || 'About'}

${about.description || about.excerpt || ''}

[Contact](${siteUrl}/contact) · [Privacy](${siteUrl}/privacy)
`
  }

  if (routePath === '/contact') {
    return `# Contact

Reach the Bertelsmann Foundation North America by email at [info@bfna.org](mailto:info@bfna.org) or use the contact form on [${siteUrl}/contact](${siteUrl}/contact).

Visit information and mailing address: see the Contact page. TODO(owner): confirm street address and phone for public listings.

[About](${siteUrl}/about) · [Privacy](${siteUrl}/privacy)
`
  }

  if (routePath === '/privacy') {
    return `# Privacy

Privacy policy for ${siteUrl}. See the full page at [${siteUrl}/privacy](${siteUrl}/privacy).
`
  }

  if (routePath === '/insights') {
    const page = readJson<PageDoc>(resolve(appRoot, 'content/bf/pages/insights.json'))
    return `# ${page?.heading || 'Insights'}

${page?.description || page?.excerpt || 'Publications and analysis from BFNA.'}
`
  }

  if (routePath === '/projects') {
    const page = readJson<PageDoc>(resolve(appRoot, 'content/bf/pages/projects.json'))
    return `# ${page?.heading || 'Projects'}

${page?.description || page?.excerpt || 'Flagship BFNA initiatives and tools.'}
`
  }

  if (routePath === '/archive') {
    const page = readJson<PageDoc>(resolve(appRoot, 'content/bf/pages/archive.json'))
    return `# ${page?.heading || 'Archive'}

${page?.description || page?.excerpt || 'Archived BFNA material.'}
`
  }

  const programMatch = routePath.match(/^\/([^/]+)$/)
  if (programMatch) {
    const slug = programMatch[1]
    const doc = readJson<PageDoc & { intro?: string }>(
      resolve(appRoot, 'content/bf/programs', `${slug}.json`)
    )
    if (doc) {
      return `# ${doc.name || slug}

${doc.intro || doc.description || doc.excerpt || ''}
`
    }
  }

  const insightMatch = routePath.match(/^\/insights\/([^/]+)$/)
  if (insightMatch) {
    const slug = insightMatch[1]
    const doc = readJson<PageDoc>(resolve(appRoot, 'content/bf/insights', `${slug}.json`))
    if (doc) {
      const byline = doc.authors?.length ? `\n\n_Authors: ${doc.authors.join(', ')}_` : ''
      const date = doc.publish_date ? `\n\n_Published: ${doc.publish_date}_` : ''
      const body = doc.content ? `\n\n${firstParagraph(doc.content, 4000)}` : `\n\n${doc.excerpt || ''}`
      return `# ${doc.heading || slug}${date}${byline}${body}`
    }
  }

  const projectMatch = routePath.match(/^\/projects\/([^/]+)$/)
  if (projectMatch) {
    const slug = projectMatch[1]
    const doc = readJson<PageDoc>(resolve(appRoot, 'content/bf/projects', `${slug}.json`))
    if (doc) {
      return `# ${doc.heading || doc.name || slug}

${doc.description || doc.excerpt || ''}
`
    }
  }

  return null
}

export function writeAgentArtifacts(appRoot: string, targetRoot: string): void {
  mkdirSync(targetRoot, { recursive: true })

  writeFileSync(resolve(targetRoot, 'llms.txt'), buildLlmsTxt(appRoot), 'utf8')
  writeFileSync(resolve(targetRoot, 'robots.txt'), buildRobotsTxt(), 'utf8')
  writeFileSync(resolve(targetRoot, 'sitemap.xml'), buildSitemapXml(appRoot), 'utf8')

  for (const routePath of publicPrerenderPaths(appRoot)) {
    const md = markdownForRoute(appRoot, routePath)
    if (!md) {
      continue
    }
    const rel = markdownPathForRoute(routePath).replace(/^\//, '')
    const outPath = resolve(targetRoot, rel)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, md, 'utf8')
  }
}

export const MARKDOWN_404_BODY = `# Page not found

The requested URL is not on this site. Try the [home page](${siteUrl}/), [sitemap](${siteUrl}/sitemap.xml), or [llms.txt](${siteUrl}/llms.txt) for navigation.
`

export function patchStatic404Html(outputDir: string): void {
  const file = resolve(outputDir, '404.html')
  if (!existsSync(file)) {
    return
  }
  const html = readFileSync(file, 'utf8')
  const injection = `<div id="bf-static-404" style="max-width:40rem;margin:2rem auto;font-family:system-ui,sans-serif;line-height:1.5">
<h1>Page not found</h1>
<p>That page does not exist, or its address has changed.</p>
<p><a href="/">Back to home</a> · <a href="/sitemap.xml">Sitemap</a> · <a href="/llms.txt">llms.txt</a></p>
</div>`
  if (html.includes('id="bf-static-404"')) {
    return
  }
  const updated = html.includes('id="__nuxt"')
    ? html.replace('id="__nuxt"', `${injection}<div id="__nuxt"`)
    : `${injection}${html}`
  writeFileSync(file, updated, 'utf8')
}

function main(): void {
  const post = process.argv.includes('--post')
  if (post) {
    patchStatic404Html(outputRoot)
    return
  }
  writeAgentArtifacts(appRoot, publicRoot)
}

const invokedDirectly =
  process.argv[1]?.endsWith('generate-agent-artifacts.ts')
  || process.argv[1]?.includes('generate-agent-artifacts')

if (invokedDirectly) {
  main()
}
