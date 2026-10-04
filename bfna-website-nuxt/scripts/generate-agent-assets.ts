import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isSitemapExcluded } from '../src/utils/agent-sitemap.ts'
import { agentSitemapRoutes } from './lib/agent-routes.ts'
import { htmlToMarkdown } from './html-to-markdown.ts'
import { siteUrlFromEnv, absoluteUrl } from '../src/utils/site-url.ts'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const outputDir = resolve(projectRoot, '.output/public')
mkdirSync(outputDir, { recursive: true })
const contentRoot = resolve(projectRoot, 'content/bf')

const origin = siteUrlFromEnv(process.env as Record<string, string | undefined>)

function htmlPathForRoute(route: string): string {
  if (route === '/') return join(outputDir, 'index.html')
  const asDir = join(outputDir, route, 'index.html')
  const asFile = join(outputDir, `${route.replace(/^\//, '')}.html`)
  try {
    statSync(asDir)
    return asDir
  } catch {
    return asFile
  }
}

function mdPathForRoute(route: string): string {
  if (route === '/') return join(outputDir, 'index.md')
  return join(outputDir, `${route.replace(/^\//, '')}.md`)
}

function lastmodForRoute(route: string): string | undefined {
  const segments = route.split('/').filter(Boolean)
  if (segments[0] === 'insights' && segments[1]) {
    return lastmodFromJson(join(contentRoot, 'insights', `${segments[1]}.json`))
  }
  if (segments[0] === 'projects' && segments[1]) {
    return lastmodFromJson(join(contentRoot, 'projects', `${segments[1]}.json`))
  }
  if (segments.length === 1 && segments[0] !== 'insights' && segments[0] !== 'projects') {
    const program = join(contentRoot, 'programs', `${segments[0]}.json`)
    const page = join(contentRoot, 'pages', `${segments[0]}.json`)
    return lastmodFromJson(program) ?? lastmodFromJson(page)
  }
  if (route === '/about' || route === '/archive') {
    const slug = route.replace('/', '')
    return lastmodFromJson(join(contentRoot, 'pages', `${slug}.json`))
  }
  if (route === '/privacy') {
    return new Date().toISOString().slice(0, 10)
  }
  if (route === '/') {
    return lastmodFromJson(join(contentRoot, 'pages', 'home.json'))
  }
  return undefined
}

function lastmodFromJson(path: string): string | undefined {
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as { publish_date?: string | null }
    if (!raw.publish_date) return undefined
    const parsed = Date.parse(raw.publish_date)
    if (Number.isNaN(parsed)) return undefined
    return new Date(parsed).toISOString().slice(0, 10)
  } catch {
    return undefined
  }
}

function writeMarkdownTwins(routes: string[]) {
  for (const route of routes) {
    const htmlPath = htmlPathForRoute(route)
    try {
      const html = readFileSync(htmlPath, 'utf8')
      const md = htmlToMarkdown(html)
      const mdPath = mdPathForRoute(route)
      mkdirSync(dirname(mdPath), { recursive: true })
      writeFileSync(mdPath, md)
    } catch {
      console.warn(`generate-agent-assets: skip markdown twin (no HTML) for ${route}`)
    }
  }
}

function writeSitemap(routes: string[]) {
  const urls = routes
    .filter(r => !isSitemapExcluded(r))
    .map(route => {
      const loc = absoluteUrl(route, origin)
      const lastmod = lastmodForRoute(route)
      const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
      return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  writeFileSync(join(outputDir, 'sitemap.xml'), xml)
}

function writeRobots() {
  const body = `User-agent: *
Allow: /

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

Disallow: /docs/
Disallow: /wireframes/
Disallow: /search

Sitemap: ${absoluteUrl('/sitemap.xml', origin)}
`
  writeFileSync(join(outputDir, 'robots.txt'), body)
}

function writeLlmsTxt() {
  const programs = listSlugs('programs').slice(0, 6)
  const insights = listSlugs('insights').slice(0, 8)
  const projects = listSlugs('projects').slice(0, 6)

  const programLines = programs.map(slug => `- [${titleFromProgram(slug)}](${absoluteUrl(`/${slug}`, origin)}): Program hub and related work.`)
  const insightLines = insights.map(slug => `- [${titleFromInsight(slug)}](${absoluteUrl(`/insights/${slug}`, origin)}): Insight article or report.`)
  const projectLines = projects.map(slug => `- [${titleFromProject(slug)}](${absoluteUrl(`/projects/${slug}`, origin)}): Project overview and related content.`)

  const body = `# Bertelsmann Foundation North America

> The Bertelsmann Foundation North America (BFNA) is an independent, nonpartisan think tank that strengthens the transatlantic partnership through research, policy dialogue, leadership programs, and multimedia storytelling.

## When to use this site

Use BFNA when you need primary-source context on transatlantic relations, democracy, future leadership, and related policy research—not generic news summaries. Prefer /insights/ for analysis and reports, /projects/ for named initiatives and series, program hubs for thematic collections, and /about for mission, team, and contact details.

## Key pages

- [Home](${absoluteUrl('/', origin)}): Mission overview and featured programs, projects, and insights.
- [About](${absoluteUrl('/about', origin)}): Mission, board, team, Stiftung relationship, and contact.
- [Insights index](${absoluteUrl('/insights', origin)}): Searchable library of articles, reports, videos, and infographics.
- [Projects index](${absoluteUrl('/projects', origin)}): Project catalog grouped by program.
- [Archive](${absoluteUrl('/archive', origin)}): Archived insights and historical material.
- [Privacy](${absoluteUrl('/privacy', origin)}): How this site handles information you provide and third-party services.

## Programs

${programLines.join('\n')}

## Recent insights (sample)

${insightLines.join('\n')}

## Projects (sample)

${projectLines.join('\n')}

## Machine-readable

- [Sitemap](${absoluteUrl('/sitemap.xml', origin)})
- [Robots](${absoluteUrl('/robots.txt', origin)})
`

  writeFileSync(join(outputDir, 'llms.txt'), body)
}

function listSlugs(collection: string): string[] {
  try {
    return readdirSync(join(contentRoot, collection))
      .filter(name => name.endsWith('.json'))
      .map(name => name.replace(/\.json$/, ''))
      .sort()
  } catch {
    return []
  }
}

function titleFromProgram(slug: string): string {
  return readHeading(join(contentRoot, 'programs', `${slug}.json`)) ?? slug
}

function titleFromInsight(slug: string): string {
  return readHeading(join(contentRoot, 'insights', `${slug}.json`)) ?? slug
}

function titleFromProject(slug: string): string {
  return readHeading(join(contentRoot, 'projects', `${slug}.json`)) ?? slug
}

function readHeading(path: string): string | undefined {
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as { heading?: string; name?: string }
    return raw.name ?? raw.heading
  } catch {
    return undefined
  }
}

const routes = agentSitemapRoutes()
writeMarkdownTwins(routes)
writeSitemap(routes)
writeRobots()
writeLlmsTxt()

console.log(`generate-agent-assets: wrote sitemap (${routes.length} routes), robots.txt, llms.txt, markdown twins under ${outputDir}`)
