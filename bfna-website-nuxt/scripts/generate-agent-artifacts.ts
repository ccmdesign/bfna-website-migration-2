import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { SITE_ORIGIN, isDiscoverableRoute, markdownOutputPath, publicContentRoutes } from './lib/agent-routes'
import { validPublishDate } from '../src/utils/publish-date'

export { validPublishDate } from '../src/utils/publish-date'
type JsonRecord = Record<string, unknown>
export interface AgentDocument { route: string; title: string; description: string; body: string; publishDate?: string }
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : ''
const decodeEntities = (value: string): string => value.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&nbsp;', ' ')
export const readableMarkdown = (value: unknown): string => decodeEntities(text(value).replaceAll('\r\n', '\n')).replace(/<\s*br\s*\/?>/gi, '\n').replace(/<\/(p|div|section|article|h[1-6]|li|blockquote)>/gi, '\n\n').replace(/<li[^>]*>/gi, '- ').replace(/<[^>]+>/g, '').split('\n').map(line => line.replace(/[ \t]+$/g, '')).join('\n').replace(/\n{3,}/g, '\n\n').trim()
const readJson = async (path: string): Promise<JsonRecord> => JSON.parse(await readFile(path, 'utf8')) as JsonRecord
const contentPathFor = (projectRoot: string, route: string): string | undefined => {
  if (route === '/') return resolve(projectRoot, 'content/bf/pages/home.json')
  if (['/about', '/archive', '/privacy'].includes(route)) return resolve(projectRoot, `content/bf/pages/${route.slice(1)}.json`)
  if (route === '/insights' || route === '/projects') return undefined
  if (route.startsWith('/insights/')) return resolve(projectRoot, `content/bf/insights/${route.split('/').at(-1)}.json`)
  if (route.startsWith('/projects/')) return resolve(projectRoot, `content/bf/projects/${route.split('/').at(-1)}.json`)
  return resolve(projectRoot, `content/bf/programs/${route.slice(1)}.json`)
}
const documentFromRecord = (route: string, record: JsonRecord): AgentDocument => {
  const title = text(record.heading) || text(record.title) || text(record.name) || 'Bertelsmann Foundation North America'
  const description = text(record.excerpt) || text(record.subheading) || text(record.intro)
  const body = readableMarkdown(record.content) || readableMarkdown(record.description) || readableMarkdown(record.intro) || description
  return { route, title, description, body, publishDate: validPublishDate(record.publish_date) }
}
export const loadAgentDocuments = async (projectRoot: string): Promise<AgentDocument[]> => {
  const routes = publicContentRoutes(projectRoot).filter(isDiscoverableRoute)
  return Promise.all(routes.map(async route => {
    const path = contentPathFor(projectRoot, route)
    if (path) return documentFromRecord(route, await readJson(path))
    const collection = route === '/insights' ? 'insights' : 'projects'
    const detailRoutes = routes.filter(candidate => candidate.startsWith(`/${collection}/`))
    const title = collection === 'insights' ? 'Insights' : 'Projects'
    const links = await Promise.all(detailRoutes.map(async detailRoute => { const detail = documentFromRecord(detailRoute, await readJson(contentPathFor(projectRoot, detailRoute)!)); return `- [${detail.title}](${detailRoute})${detail.description ? ` — ${detail.description}` : ''}` }))
    return { route, title, description: `Explore BFNA ${title.toLowerCase()}.`, body: links.join('\n') }
  }))
}
export const renderMarkdownDocument = (document: AgentDocument): string => [`# ${document.title}`, document.description, document.body, `Source: ${SITE_ORIGIN}${document.route === '/' ? '/' : document.route}`].filter(Boolean).join('\n\n') + '\n'
const xmlEscape = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
export const renderSitemap = (documents: AgentDocument[]): string => ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...documents.map(document => ['  <url>', `    <loc>${xmlEscape(`${SITE_ORIGIN}${document.route === '/' ? '/' : document.route}`)}</loc>`, ...(document.publishDate ? [`    <lastmod>${document.publishDate}</lastmod>`] : []), '  </url>'].join('\n')), '</urlset>', ''].join('\n')
export const renderLlms = (documents: AgentDocument[]): string => {
  const programs = documents.filter(document => !['/', '/about', '/archive', '/privacy', '/insights', '/projects'].includes(document.route) && !document.route.startsWith('/insights/') && !document.route.startsWith('/projects/'))
  const latestInsights = documents.filter(document => document.route.startsWith('/insights/')).sort((left, right) => (right.publishDate ?? '').localeCompare(left.publishDate ?? '')).slice(0, 10)
  const projects = documents.filter(document => document.route.startsWith('/projects/')).slice(0, 10)
  const link = (document: AgentDocument): string => `- [${document.title}](${document.route})${document.description ? ` — ${document.description}` : ''}`
  return ['# Bertelsmann Foundation North America', '', '> BFNA is a nonpartisan think tank in Washington, DC focused on transatlantic policy challenges.', '', '## When to use this site', '', 'Use BFNA for its published analysis, projects, programs, and organizational information. Prefer each page\'s Markdown representation by sending `Accept: text/markdown`; cite the canonical HTML URL as the source.', '', '## Start here', '', '- [About](/about)', '- [Insights](/insights)', '- [Projects](/projects)', '- [Privacy](/privacy)', '', '## Programs', '', ...programs.map(link), '', '## Latest insights', '', ...latestInsights.map(link), '', '## Selected projects', '', ...projects.map(link), '', '## Discovery', '', '- [XML sitemap](/sitemap.xml)', '- [Crawler policy](/robots.txt)', ''].join('\n')
}
const robotGroup = (agent: string): string[] => [`User-agent: ${agent}`, 'Allow: /', 'Disallow: /docs/', 'Disallow: /wireframes/', 'Disallow: /search', '']
export const renderRobots = (): string => [...robotGroup('*'), ...robotGroup('GPTBot'), ...robotGroup('ChatGPT-User'), ...robotGroup('ClaudeBot'), ...robotGroup('PerplexityBot'), `Sitemap: ${SITE_ORIGIN}/sitemap.xml`, ''].join('\n')
export const renderNotFoundHtml = (): string => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Bertelsmann Foundation North America</title><link rel="stylesheet" href="/css/styles.css"></head><body><main id="main-content"><h1>Page not found</h1><p>The page you requested does not exist or may have moved. Continue with BFNA's current analysis, projects, and organization information.</p><nav aria-label="Recovery links"><ul><li><a href="/">BFNA home</a></li><li><a href="/insights">Insights</a></li><li><a href="/projects">Projects</a></li><li><a href="/sitemap.xml">Sitemap</a></li><li><a href="/llms.txt">AI guidance</a></li></ul></nav></main></body></html>\n`
export const generateAgentArtifacts = async (projectRoot: string, outputRoot: string, context = process.env.CONTEXT): Promise<void> => {
  const documents = await loadAgentDocuments(projectRoot)
  await Promise.all(documents.map(async document => { const outputPath = resolve(outputRoot, markdownOutputPath(document.route)); await mkdir(dirname(outputPath), { recursive: true }); await writeFile(outputPath, renderMarkdownDocument(document), 'utf8') }))
  await Promise.all([writeFile(resolve(outputRoot, 'sitemap.xml'), renderSitemap(documents), 'utf8'), writeFile(resolve(outputRoot, 'llms.txt'), renderLlms(documents), 'utf8'), writeFile(resolve(outputRoot, 'robots.txt'), renderRobots(), 'utf8'), writeFile(resolve(outputRoot, '404.html'), renderNotFoundHtml(), 'utf8')])
  if (context && context !== 'production') await writeFile(resolve(outputRoot, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n', 'utf8')
  else await rm(resolve(outputRoot, '_headers'), { force: true })
}
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  void generateAgentArtifacts(projectRoot, resolve(projectRoot, '.output/public'))
}
