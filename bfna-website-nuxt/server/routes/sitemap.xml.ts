/**
 * server/routes/sitemap.xml.ts — Prerendered sitemap.xml
 *
 * Generates a valid XML sitemap listing all indexable pages.
 * Excludes /wireframes/**, /docs/**, /search.
 * URL base is configurable via SITE_URL env var; defaults to production origin.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = process.cwd()
const SITE_URL = process.env.SITE_URL || 'https://www.bfna.org'

function loadJson(path: string) {
  try { return JSON.parse(readFileSync(path, 'utf-8')) }
  catch { return null }
}

function loadSlugs(dir: string) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isFile() && e.name.endsWith('.json'))
      .map(e => e.name.replace(/\.json$/, ''))
  } catch { return [] }
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

// Format date as XML schema (YYYY-MM-DDTHH:MM:SSZ)
function xmlDate(date: Date | string | null): string {
  if (!date) return new Date().toISOString().split('T')[0]
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export default defineEventHandler(async (event) => {
  // Set cache headers (sitemaps change infrequently)
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  const baseUrl = SITE_URL.replace(/\/$/, '')
  const today = new Date().toISOString().split('T')[0]

  const urls: string[] = []

  // Core pages
  const corePages = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/about', priority: '0.9', changefreq: 'monthly' },
    { path: '/archive', priority: '0.7', changefreq: 'monthly' },
    { path: '/insights', priority: '0.9', changefreq: 'weekly' },
    { path: '/projects', priority: '0.9', changefreq: 'weekly' },
    { path: '/contact', priority: '0.6', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.5', changefreq: 'yearly' },
  ]

  for (const page of corePages) {
    urls.push(xmlUrl(baseUrl + page.path, today, page.priority, page.changefreq))
  }

  // Programs
  const programSlugs = loadSlugs(resolve(repoRoot, 'content/bf/programs'))
  for (const slug of programSlugs) {
    const data = loadJson(resolve(repoRoot, `content/bf/programs/${slug}.json`))
    const lastmod = data?.publish_date ? xmlDate(data.publish_date) : today
    urls.push(xmlUrl(`${baseUrl}/${slug}`, lastmod, '0.7', 'monthly'))
  }

  // Insights
  const insightSlugs = loadSlugs(resolve(repoRoot, 'content/bf/insights'))
  for (const slug of insightSlugs) {
    const data = loadJson(resolve(repoRoot, `content/bf/insights/${slug}.json`))
    const lastmod = data?.publish_date ? xmlDate(data.publish_date) : today
    urls.push(xmlUrl(`${baseUrl}/insights/${slug}`, lastmod, '0.7', 'monthly'))
  }

  // Projects
  const projectSlugs = loadSlugs(resolve(repoRoot, 'content/bf/projects'))
  for (const slug of projectSlugs) {
    const data = loadJson(resolve(repoRoot, `content/bf/projects/${slug}.json`))
    const lastmod = data?.publish_date ? xmlDate(data.publish_date) : today
    urls.push(xmlUrl(`${baseUrl}/projects/${slug}`, lastmod, '0.7', 'monthly'))
  }

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>'
  ].join('\n')

  return sitemap
})

function xmlUrl(loc: string, lastmod: string, priority: string, changefreq: string) {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${escapeXml(changefreq)}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}
