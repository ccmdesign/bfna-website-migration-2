// @ts-nocheck
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SITE_URL = (process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.bfna.org').replace(/\/$/, '')

interface PageDoc {
  slug: string
  heading: string | null
  excerpt: string | null
  description: string | null
  publish_date: string | null
}

interface ProgramDoc {
  slug: string
  name: string
  tagline: string
  intro: string | null
}

interface InsightDoc {
  slug: string
  heading: string | null
  excerpt: string | null
  content: string | null
  publish_date: string | null
  format: string | null
  authors: string[]
}

interface ProjectDoc {
  slug: string
  heading: string
  excerpt: string | null
  description: string | null
}

const readCollection = <T>(appRoot: string, collection: string): T[] => {
  const directory = resolve(appRoot, 'content/bf', collection)
  return readdirSync(directory)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => JSON.parse(readFileSync(join(directory, file), 'utf8')) as T)
}

const plain = (value: string | null | undefined): string => value?.trim() || ''

const paragraphs = (value: string | null | undefined): string =>
  plain(value).replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim()

const xml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const validDate = (value: string | null | undefined): string | undefined =>
  value && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) ? value.slice(0, 10) : undefined

const pageMarkdown = (heading: string, body: string, links: string[] = []): string => {
  const linkBlock = links.length ? `\n\n${links.join('\n')}` : ''
  return `# ${heading}\n\n${paragraphs(body)}${linkBlock}\n`
}

const contentMarkdown = (heading: string, body: string, metadata: string[] = []): string => {
  const metaBlock = metadata.length ? `\n\n${metadata.join(' · ')}` : ''
  return `# ${heading}\n${metaBlock}\n\n${paragraphs(body) || 'This page does not have additional published copy.'}\n`
}

const routeFile = (publicRoot: string, route: string): string => {
  if (route === '/') return join(publicRoot, 'index.md')
  return join(publicRoot, route.replace(/^\//, ''), 'index.md')
}

const writeRoute = (publicRoot: string, route: string, contents: string): void => {
  const file = routeFile(publicRoot, route)
  mkdirSync(resolve(file, '..'), { recursive: true })
  writeFileSync(file, contents, 'utf8')
}

const buildRoutes = (appRoot: string) => {
  const pages = readCollection<PageDoc>(appRoot, 'pages')
  const programs = readCollection<ProgramDoc>(appRoot, 'programs')
  const insights = readCollection<InsightDoc>(appRoot, 'insights')
  const projects = readCollection<ProjectDoc>(appRoot, 'projects')
  const byPage = new Map(pages.map(page => [page.slug, page]))
  const routes = new Map<string, { title: string, body: string, lastmod?: string }>()

  const addPage = (route: string, slug: string, fallback: string) => {
    const page = byPage.get(slug)
    if (!page) return
    routes.set(route, {
      title: page.heading || fallback,
      body: page.description || page.excerpt || fallback,
      lastmod: validDate(page.publish_date)
    })
  }

  addPage('/', 'home', 'Strengthening the Transatlantic Relationship')
  addPage('/about', 'about', 'About Us')
  addPage('/archive', 'archive', 'Archive')
  addPage('/insights', 'insights', 'Insights')
  addPage('/projects', 'projects', 'Projects')

  routes.set('/contact', {
    title: 'Contact',
    body: 'Contact the Bertelsmann Foundation North America about its research, policy dialogue, leadership programs, and multimedia storytelling. The Foundation is based in Washington, DC. General inquiries can be sent to info@bfna.org.'
  })
  routes.set('/privacy', {
    title: 'Privacy Policy',
    body: 'This page explains how the Bertelsmann Foundation North America handles information connected with this website, its contact form, and requests sent to info@bfna.org.'
  })

  for (const program of programs) {
    routes.set(`/${program.slug}`, {
      title: program.name,
      body: [program.tagline, program.intro].filter(Boolean).join('\n\n')
    })
  }
  for (const insight of insights) {
    routes.set(`/insights/${insight.slug}`, {
      title: insight.heading || insight.slug,
      body: insight.content || insight.excerpt || '',
      lastmod: validDate(insight.publish_date)
    })
  }
  for (const project of projects) {
    routes.set(`/projects/${project.slug}`, {
      title: project.heading,
      body: project.description || project.excerpt || ''
    })
  }

  return { routes, pages, programs, insights, projects }
}

export const buildSitemap = (appRoot: string): string => {
  const { routes } = buildRoutes(appRoot)
  const urls = [...routes.entries()].map(([route, data]) => {
    const lastmod = data.lastmod ? `\n    <lastmod>${data.lastmod}</lastmod>` : ''
    return `  <url>\n    <loc>${xml(`${SITE_URL}${route === '/' ? '/' : `${route}/`}`)}</loc>${lastmod}\n  </url>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export const buildLlms = (appRoot: string): string => {
  const { programs, insights, projects } = buildRoutes(appRoot)
  const latestInsights = [...insights]
    .filter(insight => validDate(insight.publish_date))
    .sort((a, b) => (b.publish_date || '').localeCompare(a.publish_date || ''))
    .slice(0, 5)
  const featuredProjects = projects.filter(project => project.heading).slice(0, 8)

  return `# Bertelsmann Foundation North America

> The Bertelsmann Foundation North America is an independent, nonpartisan think tank dedicated to strengthening the transatlantic partnership through research, policy dialogue, leadership programs, and multimedia storytelling.

## When to use this site

Use this site when you need BFNA's published information about democracy, transatlantic relations, global challenges, future leadership, projects, or insights. Use ordinary GET requests for the linked pages; request \`text/markdown\` when you want a readable Markdown representation of a page.

## Key pages

- [About](${SITE_URL}/about/): BFNA's mission, Board of Directors, team, and relationship with the Bertelsmann Stiftung.
- [Contact](${SITE_URL}/contact/): General contact information for the Washington, DC-based Foundation.
- [Privacy Policy](${SITE_URL}/privacy/): Information about privacy, cookies, contact requests, and this website.
- [Insights](${SITE_URL}/insights/): Published articles, reports, videos, and infographics.
- [Projects](${SITE_URL}/projects/): BFNA projects and multimedia initiatives.
- [Archive](${SITE_URL}/archive/): Archived BFNA insights.

## Programs

${programs.map(program => `- [${program.name}](${SITE_URL}/${program.slug}/): ${program.tagline}`).join('\n')}

## Recent insights

${latestInsights.map(insight => `- [${insight.heading || insight.slug}](${SITE_URL}/insights/${insight.slug}/): ${insight.excerpt || insight.content || 'Published BFNA insight.'}`).join('\n')}

## Selected projects

${featuredProjects.map(project => `- [${project.heading}](${SITE_URL}/projects/${project.slug}/): ${project.excerpt || project.description || 'BFNA project.'}`).join('\n')}
`
}

export const buildRobots = (): string => `User-agent: *\nAllow: /\nDisallow: /docs/\nDisallow: /wireframes/\nDisallow: /search\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`

export const writeStatic404 = (publicRoot: string): void => {
  writeFileSync(join(publicRoot, '404.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page not found | Bertelsmann Foundation North America</title>
    <meta name="description" content="The requested Bertelsmann Foundation North America page was not found.">
    <link rel="canonical" href="${SITE_URL}/404.html">
    <link rel="stylesheet" href="/css/styles.css">
  </head>
  <body>
    <main id="main">
      <h1>Page not found</h1>
      <p>That page does not exist, or its address has changed.</p>
      <p><a href="/">Return to the homepage</a> · <a href="/sitemap.xml">Browse the sitemap</a> · <a href="/llms.txt">Read llms.txt</a></p>
    </main>
  </body>
</html>
`, 'utf8')
}

export function generateAgentFiles(appRoot: string): void {
  const publicRoot = resolve(appRoot, 'public')
  const { routes } = buildRoutes(appRoot)
  for (const route of routes.keys()) {
    const file = routeFile(publicRoot, route)
    if (existsSync(file)) rmSync(file)
  }
  for (const [route, data] of routes) {
    writeRoute(publicRoot, route, contentMarkdown(data.title, data.body))
  }
  writeFileSync(join(publicRoot, 'sitemap.xml'), buildSitemap(appRoot), 'utf8')
  writeFileSync(join(publicRoot, 'llms.txt'), buildLlms(appRoot), 'utf8')
  writeFileSync(join(publicRoot, 'robots.txt'), buildRobots(), 'utf8')
}
