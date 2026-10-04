import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { generateAgentArtifacts } from './generate-agent-artifacts'
import { isDiscoverableRoute, markdownOutputPath, publicContentRoutes } from './lib/agent-routes'

const projectRoot = resolve(import.meta.dirname, '..')
const outputRoot = resolve(projectRoot, '.output/public')
const mustContain = async (path: string, values: string[]) => { const body = await readFile(path, 'utf8'); for (const value of values) if (!body.includes(value)) throw new Error(`${path} is missing ${value}`); return body }
const main = async (): Promise<void> => {
  await generateAgentArtifacts(projectRoot, outputRoot)
  const routes = publicContentRoutes(projectRoot).filter(isDiscoverableRoute)
  for (const route of routes) await access(resolve(outputRoot, markdownOutputPath(route)))
  for (const excluded of ['/search.md', '/docs/example.md', '/wireframes/example.md']) { try { await access(resolve(outputRoot, excluded.slice(1))); throw new Error(`excluded twin exists: ${excluded}`) } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error } }
  const sitemap = await mustContain(resolve(outputRoot, 'sitemap.xml'), ['<urlset', 'https://www.bfna.org'])
  if (sitemap.includes('/docs') || sitemap.includes('/wireframes') || sitemap.includes('/search')) throw new Error('sitemap contains excluded routes')
  const llms = await mustContain(resolve(outputRoot, 'llms.txt'), ['## When to use this site', '/privacy'])
  if (llms.includes('/docs') || llms.includes('/wireframes') || llms.includes('/search')) throw new Error('llms.txt contains excluded routes')
  await mustContain(resolve(outputRoot, 'robots.txt'), ['Disallow: /docs/', 'Disallow: /wireframes/', 'Disallow: /search', 'Sitemap: https://www.bfna.org/sitemap.xml'])
  await mustContain(resolve(outputRoot, '404.html'), ['Page not found', '/sitemap.xml', '/llms.txt'])
  if (process.env.CONTEXT && process.env.CONTEXT !== 'production') await mustContain(resolve(outputRoot, '_headers'), ['X-Robots-Tag: noindex, nofollow'])
  console.log(`Verified ${routes.length} public Markdown twins and discovery artifacts.`)
}

void main()
