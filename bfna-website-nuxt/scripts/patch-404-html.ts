import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = resolve(fileURLToPath(new URL('../.output/public', import.meta.url)))
const path404 = join(outputDir, '404.html')

const fallback = `
<div id="ssr-404-fallback" class="bf-shell">
  <main id="main">
    <h1>Page not found</h1>
    <p>That page does not exist, or its address has changed.</p>
    <p><a href="/">Back to home</a> · <a href="/sitemap.xml">Sitemap</a> · <a href="/llms.txt">llms.txt</a></p>
  </main>
</div>
`

try {
  let html = readFileSync(path404, 'utf8')
  if (!html.includes('id="ssr-404-fallback"')) {
    html = html.replace('<div id="__nuxt"', `${fallback}<div id="__nuxt"`)
    writeFileSync(path404, html)
    console.log('patch-404-html: injected SSR-visible fallback into 404.html')
  }
} catch (error) {
  console.warn('patch-404-html: skipped —', (error as Error).message)
}
