import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

export const SITE_ORIGIN = 'https://www.bfna.org'
export const EXCLUDED_DISCOVERY_PREFIXES = ['/docs', '/wireframes', '/search'] as const

const collectionSlugs = (projectRoot: string, collection: string): string[] => {
  try {
    return readdirSync(resolve(projectRoot, 'content/bf', collection), { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
      .map(entry => entry.name.replace(/\.json$/, ''))
      .sort()
  } catch {
    return []
  }
}

export const publicContentRoutes = (projectRoot: string): string[] => [
  '/', '/about', '/archive', '/insights', '/projects', '/privacy',
  ...collectionSlugs(projectRoot, 'programs').map(slug => `/${slug}`),
  ...collectionSlugs(projectRoot, 'insights').map(slug => `/insights/${slug}`),
  ...collectionSlugs(projectRoot, 'projects').map(slug => `/projects/${slug}`),
]

export const prerenderRoutes = (projectRoot: string): string[] => [
  ...publicContentRoutes(projectRoot),
  '/search', '/wireframes', '/wireframes/about', '/wireframes/archive',
  '/wireframes/insights', '/wireframes/projects', '/wireframes/search',
]

export const isDiscoverableRoute = (route: string): boolean =>
  !EXCLUDED_DISCOVERY_PREFIXES.some(prefix => route === prefix || route.startsWith(`${prefix}/`))

export const markdownOutputPath = (route: string): string =>
  route === '/' ? 'index.md' : `${route.replace(/^\//, '').replace(/\/$/, '')}.md`
