import { readdirSync, type Dirent } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))

const collectionSlugs = (collection: string): string[] => {
  try {
    return readdirSync(resolve(projectRoot, 'content/bf', collection), { withFileTypes: true })
      .filter((entry: Dirent) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry: Dirent) => entry.name.replace(/\.json$/, ''))
      .sort()
  } catch {
    return []
  }
}

/** Public indexable routes aligned with `prerenderRoutes` plus agent extras. */
export function agentSitemapRoutes(): string[] {
  return [
    '/',
    '/about',
    '/archive',
    '/insights',
    '/projects',
    '/privacy',
    ...collectionSlugs('programs').map(slug => `/${slug}`),
    ...collectionSlugs('insights').map(slug => `/insights/${slug}`),
    ...collectionSlugs('projects').map(slug => `/projects/${slug}`)
  ]
}
