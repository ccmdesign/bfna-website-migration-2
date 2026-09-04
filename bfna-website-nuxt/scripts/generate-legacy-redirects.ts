/**
 * Emit the two generated halves of the legacy redirect map (gh#66, spec
 * `docs/ds-epic/issues/57-cutover-redirects.md`):
 *
 * 1. `server/utils/legacy-slug-map.ts` — the one-segment legacy slug →
 *    `/insights/:slug` | `/projects/:slug` lookup, statically imported by
 *    `server/middleware/redirects.ts`.
 * 2. `public/_redirects` — the same map, plus every rule in
 *    `server/utils/legacy-redirect-rules.ts`, in Netlify's `_redirects`
 *    grammar, so the rules hold on the deployed **static** site where no Nitro
 *    server runs.
 *
 * Run: `npm run redirects:generate`.  Verify: `npm run redirects:check` (exit 1
 * if either artefact is stale, so drift is detectable without re-reading them).
 *
 * ## Why a generated map rather than a glob
 *
 * `src/utils/bf-programs.ts` derives its list with `import.meta.glob`. That is a
 * **Vite** transform; Nitro bundles everything under `server/**` with rollup and
 * never sees it, so the same trick is unavailable inside middleware. Reading
 * `content/bf/**` from disk at request time is worse still — it is a runtime file
 * read in a bundle that may not ship the content directory at all. Generating a
 * plain `Record<string, string>` and importing it statically keeps the lookup at
 * O(1) with no I/O, and keeps `_redirects` derived from the same table rather
 * than hand-copied.
 *
 * ## How a bare slug resolves to a bucket
 *
 * 02 §E says to resolve `/:slug` "the same way the legacy `pages/[...slug].vue`
 * branch-resolution does today" — try super-product/product, then publication/
 * video/infographic. That chain is five `queryCollection` calls. The static
 * equivalent already exists because issue #151 carried each legacy record's
 * identity onto its `bf-*` document as `legacy` (source/type/workstream/
 * product_type/id) and `aka` (the extra legacy slugs a project absorbed): the
 * bucket a slug belongs to is simply which `content/bf/**` directory holds it.
 *
 * - `content/bf/insights/<slug>.json`  → `/insights/<slug>`
 * - `content/bf/projects/<slug>.json`  → `/projects/<slug>`
 * - every `aka[].slug` on a project    → `/projects/<that project's slug>`
 *
 * ## What is deliberately excluded
 *
 * A slug that collides with a route the site actually serves must not be
 * redirected away from it — `content/bf/insights/democracy.json` has the slug
 * `democracy`, which is also a program hub. The hub wins; the insight stays
 * reachable at `/insights/democracy`. Rather than hand-list the exceptions, the
 * reserved set is derived from what exists: the top-level route names under
 * `src/pages`, the three program slugs, every path named in the rule table, and
 * every entry at the root of `public/`.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  LEGACY_GONE_EXACT,
  LEGACY_GONE_SENTINEL,
  LEGACY_REDIRECT_COLLAPSE_PREFIXES,
  LEGACY_REDIRECT_EXACT,
  LEGACY_REDIRECT_PREFIXES,
  LEGACY_UNTOUCHED_PREFIXES
} from '../server/utils/legacy-redirect-rules'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDir, '..')

const CONTENT_ROOT = resolve(appRoot, 'content/bf')
const PAGES_ROOT = resolve(appRoot, 'src/pages')
const PUBLIC_ROOT = resolve(appRoot, 'public')

const SLUG_MAP_FILE = resolve(appRoot, 'server/utils/legacy-slug-map.ts')
const REDIRECTS_FILE = resolve(PUBLIC_ROOT, '_redirects')

/** One `content/bf/<collection>/*.json` document, only the fields used here. */
interface BfDocument {
  slug?: string
  aka?: { slug?: string }[] | null
}

function readCollection(collection: string): BfDocument[] {
  const dir = resolve(CONTENT_ROOT, collection)
  return readdirSync(dir)
    .filter(name => name.endsWith('.json'))
    .sort()
    .map(name => JSON.parse(readFileSync(resolve(dir, name), 'utf8')) as BfDocument)
}

/**
 * Route names the site serves itself, and therefore must never be slug-mapped.
 *
 * Derived, not listed: top-level entries of `src/pages` (skipping dynamic
 * `[...]` segments, which match everything and would empty the set), the program
 * slugs, every path the rule table names, and the root of `public/` so a static
 * asset can never be shadowed.
 */
function reservedSegments(): Set<string> {
  const reserved = new Set<string>([''])

  for (const entry of readdirSync(PAGES_ROOT, { withFileTypes: true })) {
    const name = entry.isFile() ? entry.name.replace(/\.vue$/, '') : entry.name
    if (name.startsWith('[')) continue
    reserved.add(name === 'index' ? '' : name)
  }

  for (const doc of readCollection('programs')) {
    if (doc.slug) reserved.add(doc.slug)
  }

  for (const entry of readdirSync(PUBLIC_ROOT, { withFileTypes: true })) {
    reserved.add(entry.name)
  }

  const ruledPaths = [
    ...LEGACY_UNTOUCHED_PREFIXES,
    ...LEGACY_GONE_EXACT,
    ...Object.keys(LEGACY_REDIRECT_EXACT),
    ...LEGACY_REDIRECT_PREFIXES.map(([from]) => from),
    ...LEGACY_REDIRECT_COLLAPSE_PREFIXES.map(([from]) => from)
  ]
  for (const path of ruledPaths) reserved.add(path.replace(/^\//, ''))

  return reserved
}

/** `slug` → absolute target path, for every one-segment legacy content URL. */
function buildSlugMap(): Map<string, string> {
  const reserved = reservedSegments()
  const map = new Map<string, string>()

  const claim = (slug: string | undefined, target: string, origin: string) => {
    if (!slug || reserved.has(slug)) return
    const existing = map.get(slug)
    if (existing && existing !== target) {
      throw new Error(`slug "${slug}" claimed twice: ${existing} vs ${target} (${origin})`)
    }
    map.set(slug, target)
  }

  // Projects first: a project's own slug outranks anything else, and its `aka`
  // slugs are legacy products it absorbed, so they land on the parent.
  for (const doc of readCollection('projects')) {
    claim(doc.slug, `/projects/${doc.slug}`, 'projects')
    for (const alias of doc.aka ?? []) {
      claim(alias.slug, `/projects/${doc.slug}`, `projects aka of ${doc.slug}`)
    }
  }

  for (const doc of readCollection('insights')) {
    claim(doc.slug, `/insights/${doc.slug}`, 'insights')
  }

  return new Map([...map].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
}

function renderSlugMapModule(map: Map<string, string>): string {
  const entries = [...map]
    .map(([slug, target]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(target)}`)
    .join(',\n')

  return `/**
 * GENERATED by \`scripts/generate-legacy-redirects.ts\` — do not edit by hand.
 * Regenerate with \`npm run redirects:generate\`; \`npm run redirects:check\` fails
 * if this file has drifted from \`content/bf/**\`.
 *
 * Every one-segment legacy content URL, mapped to where that document lives in
 * the \`bf-*\` site. Read by \`server/middleware/redirects.ts\` and mirrored
 * into \`public/_redirects\` for the static deploy. See the generator's header for
 * how a slug's bucket is resolved and what is excluded.
 *
 * ${map.size} entries.
 */
export const LEGACY_SLUG_MAP: Readonly<Record<string, string>> = {
${entries}
}
`
}

function renderRedirectsFile(map: Map<string, string>): string {
  const lines: string[] = [
    '# GENERATED by scripts/generate-legacy-redirects.ts — do not edit by hand.',
    '# Regenerate with `npm run redirects:generate`.',
    '#',
    '# The deployed site is static (`nuxt generate` -> Netlify CDN), so the Nitro',
    '# server middleware in server/middleware/redirects.ts does not run for a',
    '# prerendered path in production. This file is the same table, applied by the',
    '# CDN. Both are generated from server/utils/legacy-redirect-rules.ts.',
    '#',
    '# Every rule is forced (`!`) because Netlify serves a matching static file',
    '# ahead of an unforced rule. The legacy page files these rules replace are gone',
    '# as of issue #58 (gh#67), but `!` is kept: it states the intent independently',
    '# of what happens to be in .output/public on any given build.',
    '#',
    `# Absent below by design: ${LEGACY_UNTOUCHED_PREFIXES.join(', ')} and any sub-path.`,
    '# 02 §E marks them explicitly unchanged, and "no rule" is how that is expressed.',
    ''
  ]

  lines.push('# --- gone (410, no body) ---')
  for (const path of [...LEGACY_GONE_EXACT].sort()) {
    lines.push(row(path, LEGACY_GONE_SENTINEL, '410!'))
  }

  lines.push('', '# --- exact 301s ---')
  for (const [from, to] of Object.entries(LEGACY_REDIRECT_EXACT).sort(([a], [b]) => (a < b ? -1 : 1))) {
    lines.push(row(from, to, '301!'))
  }

  lines.push('', '# --- prefix families (splat preserved) ---')
  for (const [from, to] of LEGACY_REDIRECT_PREFIXES) {
    lines.push(row(`${from}/*`, `${to}/:splat`, '301!'))
  }

  lines.push('', '# --- prefix families (splat dropped: the target takes no second segment) ---')
  for (const [from, to] of LEGACY_REDIRECT_COLLAPSE_PREFIXES) {
    lines.push(row(`${from}/*`, to, '301!'))
  }

  lines.push('', `# --- one-segment legacy content slugs (${map.size}) ---`)
  for (const [slug, target] of map) {
    lines.push(row(`/${slug}`, target, '301!'))
  }

  lines.push('')
  return lines.join('\n')
}

/** One `_redirects` row, column-aligned so the file stays readable by hand. */
function row(from: string, to: string, status: string): string {
  return `${from.padEnd(72)} ${to.padEnd(56)} ${status}`
}

function main(): void {
  const check = process.argv.includes('--check')
  const map = buildSlugMap()

  const artefacts: [file: string, contents: string][] = [
    [SLUG_MAP_FILE, renderSlugMapModule(map)],
    [REDIRECTS_FILE, renderRedirectsFile(map)]
  ]

  let stale = 0
  for (const [file, contents] of artefacts) {
    const current = existsSync(file) ? readFileSync(file, 'utf8') : null
    if (current === contents) {
      if (!check) console.log(`unchanged  ${file}`)
      continue
    }
    if (check) {
      stale += 1
      console.error(`STALE      ${file}`)
      continue
    }
    writeFileSync(file, contents)
    console.log(`written    ${file}`)
  }

  if (check && stale > 0) {
    console.error(`\n${stale} generated redirect artefact(s) out of date — run \`npm run redirects:generate\`.`)
    process.exit(1)
  }

  console.log(`${map.size} one-segment legacy slugs mapped.`)
}

main()
