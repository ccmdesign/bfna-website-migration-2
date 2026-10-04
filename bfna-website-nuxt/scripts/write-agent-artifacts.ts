// @ts-nocheck
// `nuxt.config.ts` imports this file, so `nuxt typecheck` follows it into the
// app project. That project has no Node types. Checking it there adds
// diagnostics the typecheck gate treats as new failures. `npm run
// typecheck:scripts` skips a nocheck file too; `tests/agent-readiness.spec.ts`
// is what locks the behaviour.
/**
 * Write the agent-facing files into the generated site.
 *
 * Called from `nitro:init` → `prerender:done` in `src/nuxt.config.ts`, so
 * `npx nuxt generate` produces them. They are not committed: `.output/` is
 * gitignored, and this script does not write `public/`.
 *
 * Sitemap `lastmod` comes from insight `publish_date` only. A missing or
 * unparseable date omits the tag. File mtime is not consulted.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  llmsTxt,
  noindexHeaders,
  robotsTxt,
  sitemapXml,
  whenToUse,
  type LlmsSection,
  type SitemapUrl
} from '../src/utils/agent-documents'
import { htmlToMarkdown } from '../src/utils/html-to-markdown'
import { injectNotFoundHtml } from '../src/utils/not-found-html'
import {
  DEFAULT_DESCRIPTION,
  canonicalUrl,
  lastmodFromPublishDate,
  oneLine,
  siteOrigin
} from '../src/utils/site'
import { CONTACT_LEAD, PRIVACY_LEAD } from '../src/utils/trust-copy'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDir, '..')
const contentRoot = resolve(appRoot, 'content/bf')

interface LooseDoc {
  slug?: string
  heading?: string | null
  name?: string | null
  excerpt?: string | null
  description?: string | null
  tagline?: string | null
  intro?: string | null
  content?: string | null
  publish_date?: string | null
  order?: number
  archived?: boolean
  featured?: boolean
  nav?: boolean
}

function readCollection(collection: string): LooseDoc[] {
  const dir = resolve(contentRoot, collection)
  return readdirSync(dir)
    .filter((name: string) => name.endsWith('.json'))
    .sort()
    .map((name: string) => JSON.parse(readFileSync(resolve(dir, name), 'utf8')) as LooseDoc)
}

function pageDoc(slug: string): LooseDoc | undefined {
  return readCollection('pages').find(doc => doc.slug === slug)
}

export interface PublicPage {
  path: string
  title: string
  description: string
  lastmod?: string
  kind: 'page' | 'program' | 'project' | 'insight'
  featured?: boolean
}

/** Public URLs. `/docs`, `/wireframes`, and `/search` are not in this list. */
export function collectPublicPages(): PublicPage[] {
  const pages: PublicPage[] = []
  const add = (page: PublicPage) => {
    pages.push(page)
  }

  const home = pageDoc('home')
  const about = pageDoc('about')
  const insights = pageDoc('insights')
  const projects = pageDoc('projects')
  const archive = pageDoc('archive')

  add({ path: '/', title: 'Home', description: oneLine(home?.excerpt || home?.description || DEFAULT_DESCRIPTION), kind: 'page' })
  add({ path: '/about', title: about?.heading || 'About', description: oneLine(about?.excerpt || about?.description), kind: 'page' })
  add({ path: '/contact', title: 'Contact', description: oneLine(CONTACT_LEAD), kind: 'page' })
  add({ path: '/privacy', title: 'Privacy', description: oneLine(PRIVACY_LEAD), kind: 'page' })
  add({ path: '/archive', title: archive?.heading || 'Archive', description: oneLine(archive?.excerpt || archive?.description), kind: 'page' })
  add({ path: '/insights', title: insights?.heading || 'Insights', description: oneLine(insights?.excerpt || insights?.description), kind: 'page' })
  add({ path: '/projects', title: projects?.heading || 'Projects', description: oneLine(projects?.excerpt || projects?.description), kind: 'page' })

  for (const program of readCollection('programs').sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
    if (!program.slug) continue
    add({
      path: `/${program.slug}`,
      title: program.name || program.slug,
      description: oneLine(program.tagline || program.intro),
      kind: 'program'
    })
  }

  for (const project of readCollection('projects')) {
    if (!project.slug) continue
    add({
      path: `/projects/${project.slug}`,
      title: project.heading || project.slug,
      description: oneLine(project.excerpt || project.description),
      kind: 'project',
      featured: Boolean(project.featured || project.nav) && !project.archived
    })
  }

  for (const insight of readCollection('insights')) {
    if (!insight.slug) continue
    add({
      path: `/insights/${insight.slug}`,
      title: insight.heading || insight.slug,
      description: oneLine(insight.excerpt || insight.content),
      lastmod: lastmodFromPublishDate(insight.publish_date),
      kind: 'insight'
    })
  }

  return pages
}

function walkHtml(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) walkHtml(path, out)
    else if (entry.endsWith('.html')) out.push(path)
  }
  return out
}

function markdownRel(htmlRel: string): string | undefined {
  const norm = htmlRel.replace(/\\/g, '/')
  if (norm === 'index.html') return 'index.md'
  if (norm === '404.html' || norm === '200.html') return undefined
  if (norm.endsWith('/index.html')) return `${norm.slice(0, -'/index.html'.length)}.md`
  return undefined
}

function writeMarkdownTwins(publicDir: string): number {
  let written = 0
  for (const file of walkHtml(publicDir)) {
    const rel = relative(publicDir, file)
    const target = markdownRel(rel)
    if (!target) continue
    const markdown = htmlToMarkdown(readFileSync(file, 'utf8'))
    if (!markdown.trim()) continue
    writeFileSync(join(publicDir, target), markdown)
    written++
  }
  return written
}

function injectNotFound(publicDir: string): void {
  const file = join(publicDir, '404.html')
  const html = readFileSync(file, 'utf8')
  const next = injectNotFoundHtml(html)
  if (!next.includes('id="bf-not-found"')) {
    throw new Error('404.html has no place to put the no-JS not-found fallback.')
  }
  if (next !== html) writeFileSync(file, next)
}

export function writeAgentArtifacts(publicDir: string, env: NodeJS.ProcessEnv = process.env): void {
  const siteUrl = siteOrigin(env.NUXT_PUBLIC_SITE_URL)
  const pages = collectPublicPages()

  const twins = writeMarkdownTwins(publicDir)
  injectNotFound(publicDir)
  // `src/public/images/bfna-og.jpg` is the share card. Nitro publishes
  // `public/`, which does not contain it, so the canonical og:image would 404.
  const og = resolve(appRoot, 'src/public/images/bfna-og.jpg')
  if (existsSync(og)) {
    const dest = join(publicDir, 'images/bfna-og.jpg')
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(og, dest)
  }
  // Chrome requests /favicon.ico even when no <link> names it, and check-routes
  // treats that 404 as a console error. The icon lives in src/public; Nitro
  // publishes public/, which only symlinks css across.
  const favicon = resolve(appRoot, 'src/public/favicon.ico')
  if (existsSync(favicon)) copyFileSync(favicon, join(publicDir, 'favicon.ico'))

  const urls: SitemapUrl[] = pages.map(page => ({
    loc: canonicalUrl(siteUrl, page.path),
    ...(page.lastmod ? { lastmod: page.lastmod } : {})
  }))
  writeFileSync(join(publicDir, 'sitemap.xml'), sitemapXml(urls))

  const programs = pages.filter(page => page.kind === 'program')
  const latestInsights = pages
    .filter(page => page.kind === 'insight' && page.lastmod && page.title)
    .sort((a, b) => (a.lastmod! < b.lastmod! ? 1 : a.lastmod! > b.lastmod! ? -1 : a.path < b.path ? -1 : 1))
    .slice(0, 8)
  const featuredProjects = pages.filter(page => page.kind === 'project' && page.featured)

  const link = (page: PublicPage) => ({
    href: canonicalUrl(siteUrl, page.path),
    title: page.title,
    description: page.description
  })

  const sections: LlmsSection[] = [
    {
      heading: 'Key pages',
      links: pages.filter(page => page.kind === 'page').map(link)
    },
    { heading: 'Programs', links: programs.map(link) },
    { heading: 'Projects', links: featuredProjects.map(link) },
    { heading: 'Latest insights', links: latestInsights.map(link) }
  ]

  writeFileSync(join(publicDir, 'llms.txt'), llmsTxt({
    summary: DEFAULT_DESCRIPTION,
    whenToUse: whenToUse(programs.map(program => ({ name: program.title, path: program.path }))),
    sections
  }))
  writeFileSync(join(publicDir, 'robots.txt'), robotsTxt(siteUrl))

  const headers = noindexHeaders(env.CONTEXT)
  if (headers) writeFileSync(join(publicDir, '_headers'), headers)

  console.log(
    `agent artifacts: ${twins} markdown twins, ${urls.length} sitemap urls, `
    + `llms.txt, robots.txt${headers ? ', _headers noindex (' + env.CONTEXT + ')' : ''}`
  )
}
