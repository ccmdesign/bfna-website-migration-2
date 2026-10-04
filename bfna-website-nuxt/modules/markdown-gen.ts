/**
 * Nuxt module: generates Markdown twins from content/bf JSON data.
 *
 * Runs during the Nitro build phase and writes .md files to
 * the static output directory (.output/public/).
 *
 * The Netlify Edge Function (netlify/edge-functions/markdown.ts)
 * serves these files for Accept: text/markdown requests.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

interface NuxtInstance {
  options: { rootDir: string }
  hook: (name: string, fn: (...args: any[]) => void | Promise<void>) => void
}

export default function mdGenModule(_options: any, nuxt: NuxtInstance) {
  const repoRoot = nuxt.options.rootDir
  const outputDir = resolve(repoRoot, '.output', 'public')

  function loadJson(path: string) {
    try { return JSON.parse(readFileSync(path, 'utf-8')) }
    catch { return null }
  }

  function loadDirSlugs(dir: string): string[] {
    try {
      return readdirSync(dir, { withFileTypes: true })
        .filter(e => e.isFile() && e.name.endsWith('.json'))
        .map(e => e.name.replace(/\.json$/, ''))
    } catch { return [] }
  }

  function ensureDir(dir: string) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }

  function mdPage(title: string, description: string, metadata = {}, links: [string, string][] = []) {
    const lines: string[] = [`# ${title}`]
    if (description) { lines.push(''); lines.push(description) }
    if (Object.keys(metadata).length > 0) {
      lines.push('')
      for (const [key, val] of Object.entries(metadata)) {
        if (val) lines.push(`**${key}**: ${String(val)}`)
      }
    }
    if (links.length > 0) {
      lines.push('')
      lines.push('## Related Links')
      lines.push('')
      for (const [label, url] of links) lines.push(`- [${label}](${url})`)
    }
    lines.push('')
    return lines.join('\n')
  }

  const SITE_BASE = 'https://www.bfna.org'

  // Hook into Nitro's build phase
  nuxt.hook('nitro:build:public-assets', async (_nitro) => {
    console.log('[md-gen] Generating markdown twins...')
    let count = 0

    // Homepage
    const home = loadJson(resolve(repoRoot, 'content/bf/pages/home.json'))
    const about = loadJson(resolve(repoRoot, 'content/bf/pages/about.json'))
    const homeMd = mdPage(
      home?.heading || 'Bertelsmann Foundation North America',
      home?.description || home?.excerpt ||
        (about?.excerpt || 'Bertelsmann Foundation North America is an independent, nonpartisan think tank dedicated to strengthening the transatlantic partnership.'),
      {},
      [
        ['About', `${SITE_BASE}/about`],
        ['Insights', `${SITE_BASE}/insights`],
        ['Projects', `${SITE_BASE}/projects`],
        ['Contact', `${SITE_BASE}/about#contact`],
      ]
    )
    writeFileSync(resolve(outputDir, 'index.md'), homeMd)
    count++

    // About
    const aboutMd = mdPage(
      about?.heading || 'About Us',
      about?.description || about?.excerpt || '',
      {},
      [
        ['Board of Directors', `${SITE_BASE}/about#board`],
        ['Team', `${SITE_BASE}/about#team`],
        ['Contact', `${SITE_BASE}/about#contact`],
      ]
    )
    writeFileSync(resolve(outputDir, 'about.md'), aboutMd)
    count++

    // Archive
    const archive = loadJson(resolve(repoRoot, 'content/bf/pages/archive.json'))
    const archiveMd = mdPage(
      archive?.heading || 'Archive',
      archive?.description || archive?.excerpt || 'Archive of past BFNA work.',
      {}
    )
    writeFileSync(resolve(outputDir, 'archive.md'), archiveMd)
    count++

    // Programs
    const programSlugs = loadDirSlugs(resolve(repoRoot, 'content/bf/programs'))
    for (const slug of programSlugs) {
      const data = loadJson(resolve(repoRoot, `content/bf/programs/${slug}.json`))
      if (data) {
        const date = data.publish_date ? new Date(data.publish_date).toLocaleDateString() : null
        const md = mdPage(
          data.heading || slug,
          data.excerpt || data.description || '',
          date ? { Date: date } : {},
          [['Insights', `${SITE_BASE}/insights`], ['Projects', `${SITE_BASE}/projects`]]
        )
        writeFileSync(resolve(outputDir, `${slug}.md`), md)
        count++
      }
    }

    // Insights
    const insightSlugs = loadDirSlugs(resolve(repoRoot, 'content/bf/insights'))
    const insightsDir = resolve(outputDir, 'insights')
    ensureDir(insightsDir)
    for (const slug of insightSlugs) {
      const data = loadJson(resolve(repoRoot, `content/bf/insights/${slug}.json`))
      if (data) {
        const date = data.publish_date ? new Date(data.publish_date).toLocaleDateString() : null
        const author = (data.authors && Array.isArray(data.authors) && data.authors[0]) || null
        const meta: Record<string, string> = {}
        if (date) meta.Date = date
        if (author) meta['Written by'] = String(author)
        const md = mdPage(
          data.heading || slug,
          data.excerpt || data.description || '',
          meta,
          [['Programs', `${SITE_BASE}/programs`], ['Projects', `${SITE_BASE}/projects`]]
        )
        writeFileSync(resolve(insightsDir, `${slug}.md`), md)
        count++
      }
    }

    // Projects
    const projectSlugs = loadDirSlugs(resolve(repoRoot, 'content/bf/projects'))
    const projectsDir = resolve(outputDir, 'projects')
    ensureDir(projectsDir)
    for (const slug of projectSlugs) {
      const data = loadJson(resolve(repoRoot, `content/bf/projects/${slug}.json`))
      if (data) {
        const date = data.publish_date ? new Date(data.publish_date).toLocaleDateString() : null
        const md = mdPage(
          data.heading || slug,
          data.excerpt || data.description || '',
          date ? { Date: date } : {},
          [['Insights', `${SITE_BASE}/insights`], ['Programs', `${SITE_BASE}/programs`]]
        )
        writeFileSync(resolve(projectsDir, `${slug}.md`), md)
        count++
      }
    }

    // Privacy
    const privacyMd = [
      '# Privacy Policy',
      '',
      'BFNA respects your privacy. This page describes what data we collect and how it is used.',
      '',
      'TODO(owner): Add full privacy policy text covering analytics, cookies, forms, and third-party services.',
      ''
    ].join('\n')
    writeFileSync(resolve(outputDir, 'privacy.md'), privacyMd)
    count++

    // Contact
    const contactMd = [
      '# Contact',
      '',
      'Bertelsmann Foundation North America welcomes your questions and inquiries.',
      '',
      '## Get in Touch',
      '',
      '- **Email**: TODO(owner): Provide a contact email address',
      '- **Address**: TODO(owner): Provide mailing address',
      '',
      'For press inquiries, please visit our [About](https://www.bfna.org/about#contact) page.',
      ''
    ].join('\n')
    writeFileSync(resolve(outputDir, 'contact.md'), contactMd)
    count++

    console.log(`[md-gen] Generated ${count} markdown files in ${outputDir}`)
  })
}
