import { readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

export interface AgentRoute {
  path: string
  lastmod?: string
}

const EXCLUDED_PREFIXES = ['/wireframes', '/docs', '/bf-probe']
const EXCLUDED_EXACT = new Set(['/search'])

export function collectionSlugs(appRoot: string, collection: string): string[] {
  try {
    return readdirSync(resolve(appRoot, 'content/bf', collection), { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
      .map(entry => entry.name.replace(/\.json$/, ''))
      .sort()
  } catch {
    return []
  }
}

export function publicPrerenderPaths(appRoot: string): string[] {
  return [
    '/',
    '/about',
    '/archive',
    '/insights',
    '/projects',
    '/contact',
    '/privacy',
    ...collectionSlugs(appRoot, 'programs').map(slug => `/${slug}`),
    ...collectionSlugs(appRoot, 'insights').map(slug => `/insights/${slug}`),
    ...collectionSlugs(appRoot, 'projects').map(slug => `/projects/${slug}`)
  ]
}

export function isAgentIndexable(path: string): boolean {
  if (EXCLUDED_EXACT.has(path)) {
    return false
  }
  return !EXCLUDED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

export function lastmodForJsonFile(filePath: string): string | undefined {
  try {
    return statSync(filePath).mtime.toISOString().slice(0, 10)
  } catch {
    return undefined
  }
}

export function agentIndexRoutes(appRoot: string): AgentRoute[] {
  const paths = publicPrerenderPaths(appRoot).filter(isAgentIndexable)
  return paths.map(path => {
    let lastmod: string | undefined
    if (path === '/') {
      lastmod = lastmodForJsonFile(resolve(appRoot, 'content/bf/pages/home.json'))
    } else if (path === '/about') {
      lastmod = lastmodForJsonFile(resolve(appRoot, 'content/bf/pages/about.json'))
    } else if (path.startsWith('/insights/')) {
      const slug = path.slice('/insights/'.length)
      lastmod = lastmodForJsonFile(resolve(appRoot, 'content/bf/insights', `${slug}.json`))
    } else if (path.startsWith('/projects/')) {
      const slug = path.slice('/projects/'.length)
      lastmod = lastmodForJsonFile(resolve(appRoot, 'content/bf/projects', `${slug}.json`))
    } else if (path.startsWith('/') && path.split('/').length === 2) {
      const slug = path.slice(1)
      lastmod = lastmodForJsonFile(resolve(appRoot, 'content/bf/programs', `${slug}.json`))
    }
    return { path, lastmod }
  })
}

export function markdownPathForRoute(routePath: string): string {
  if (routePath === '/') {
    return '/index.md'
  }
  return `${routePath.replace(/\/$/, '')}.md`
}
