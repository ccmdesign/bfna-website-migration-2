import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { SITE_URL, headersForContext, isIndexablePath, sitemapXml } from '../../utils/agentContent'

/**
 * Writes sitemap.xml and, outside production, the noindex `_headers` rule
 * into Nitro's real public dir. No per-context block in netlify.toml.
 * Does not emit markdown copies of articles.
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('close', () => {
    if (nitro.options.dev) return
    const publicDir = nitro.options.output.publicDir
    if (!publicDir || !existsSync(publicDir)) return

    const urls = htmlRoutes(publicDir)
    if (urls.length > 0) {
      writeFileSync(join(publicDir, 'sitemap.xml'), sitemapXml(urls))
    }

    const headersPath = join(publicDir, '_headers')
    const base = existsSync(headersPath) ? readFileSync(headersPath, 'utf8') : ''
    writeFileSync(headersPath, headersForContext(base, process.env.CONTEXT))
  })
})

function htmlRoutes(publicDir: string): { loc: string; lastmod: string }[] {
  const urls: { loc: string; lastmod: string }[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue
      const rel = relative(publicDir, full).split(sep).join('/')
      let route = `/${rel.replace(/index\.html$/, '').replace(/\.html$/, '')}`
      if (route.length > 1) route = route.replace(/\/$/, '')
      if (!isIndexablePath(route)) continue
      const lastmod = statSync(full).mtime.toISOString().slice(0, 10)
      urls.push({ loc: route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`, lastmod })
    }
  }
  walk(publicDir)
  urls.sort((a, b) => a.loc.localeCompare(b.loc))
  return urls
}
