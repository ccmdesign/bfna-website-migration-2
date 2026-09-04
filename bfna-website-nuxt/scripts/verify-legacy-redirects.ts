/**
 * Verify the legacy redirect map (gh#66, spec `docs/ds-epic/issues/57-cutover-redirects.md`),
 * on **both** paths it has to hold on:
 *
 * - the **middleware** path — `server/middleware/redirects.ts`, which is what
 *   answers in `nuxt dev`, during prerender, and on an SSR deploy;
 * - the **static** path — `public/_redirects`, which is what answers on the
 *   deployed site, where `nuxt generate` publishes `.output/public` to Netlify's
 *   CDN and no Nitro server runs.
 *
 * The epic's harness rule (residual #86) says not to add a vitest test and to
 * substitute an equivalent-strength check; this is that substitution, recorded as
 * D-57.7 in the spec. It asserts every row of the redirect table, not a sample of
 * it, and exits non-zero on the first failure so a broken rule cannot merge quietly.
 *
 * ## Usage
 *
 * ```
 * npx tsx scripts/verify-legacy-redirects.ts --static-only     # no server needed
 * npx nuxt dev &                                                # then, against it:
 * npx tsx scripts/verify-legacy-redirects.ts --base http://localhost:3000
 * ```
 *
 * `--static-only` skips the live half, so the check is still meaningful in an
 * environment with no server to point at. With a `--base`, both halves run.
 *
 * ## What is checked live vs. exhaustively
 *
 * Every rule — the 410s, the exact 301s, both kinds of prefix family and all
 * slug-map rows — is asserted against `public/_redirects`. Against a live server
 * the fixed rules are all asserted too, plus a representative slice of the slug
 * map (both buckets and every `aka` alias) and the behaviours a table cannot
 * express: `/docs` untouched, an unknown one-segment path falling through rather
 * than being guessed at, a preserved query string, and a normalised trailing
 * slash. Firing one HTTP request per slug to prove a `Record` lookup works would
 * be slower without being stronger; the map's own correctness is the exhaustive
 * static half's job.
 *
 * gh#67 added the collapsing families (`<from>/<rest>` → `<to>`, splat dropped)
 * for residuals #206 and #208, and asserts them on both halves.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { LEGACY_SLUG_MAP } from '../server/utils/legacy-slug-map'
import {
  LEGACY_GONE_EXACT,
  LEGACY_GONE_SENTINEL,
  LEGACY_REDIRECT_COLLAPSE_PREFIXES,
  LEGACY_REDIRECT_EXACT,
  LEGACY_REDIRECT_PREFIXES,
  LEGACY_UNTOUCHED_PREFIXES
} from '../server/utils/legacy-redirect-rules'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REDIRECTS_FILE = resolve(appRoot, 'public/_redirects')

/** A slug used to prove a prefix family preserves its splat. */
const SPLAT_PROBE = 'a-legacy-child-path'

let failures = 0
let checks = 0

function assert(ok: boolean, label: string, detail = ''): void {
  checks += 1
  if (ok) return
  failures += 1
  console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
}

/* ── static half: public/_redirects ─────────────────────────────────────── */

/** `from` → `[to, status]`, parsed out of the generated `_redirects` file. */
function parseRedirectsFile(): Map<string, [to: string, status: string]> {
  const rows = new Map<string, [string, string]>()
  for (const line of readFileSync(REDIRECTS_FILE, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [from, to, status] = trimmed.split(/\s+/)
    if (!from || !to || !status) continue
    rows.set(from, [to, status])
  }
  return rows
}

function verifyStatic(): void {
  console.log(`\nstatic — public/_redirects`)
  const rows = parseRedirectsFile()

  const expectRow = (from: string, to: string, status: string) => {
    const actual = rows.get(from)
    assert(
      Boolean(actual) && actual![0] === to && actual![1] === status,
      `${from} -> ${to} ${status}`,
      actual ? `got ${actual[0]} ${actual[1]}` : 'no rule'
    )
  }

  for (const path of LEGACY_GONE_EXACT) expectRow(path, LEGACY_GONE_SENTINEL, '410!')
  for (const [from, to] of Object.entries(LEGACY_REDIRECT_EXACT)) expectRow(from, to, '301!')
  for (const [from, to] of LEGACY_REDIRECT_PREFIXES) expectRow(`${from}/*`, `${to}/:splat`, '301!')
  for (const [from, to] of LEGACY_REDIRECT_COLLAPSE_PREFIXES) expectRow(`${from}/*`, to, '301!')
  for (const [slug, target] of Object.entries(LEGACY_SLUG_MAP)) expectRow(`/${slug}`, target, '301!')

  // 02 §E: /docs is explicitly unchanged, and "no rule" is how that is expressed.
  for (const prefix of LEGACY_UNTOUCHED_PREFIXES) {
    assert(!rows.has(prefix), `${prefix} carries no rule`)
    assert(!rows.has(`${prefix}/*`), `${prefix}/* carries no rule`)
  }

  const expectedCount =
    LEGACY_GONE_EXACT.length +
    Object.keys(LEGACY_REDIRECT_EXACT).length +
    LEGACY_REDIRECT_PREFIXES.length +
    LEGACY_REDIRECT_COLLAPSE_PREFIXES.length +
    Object.keys(LEGACY_SLUG_MAP).length
  assert(rows.size === expectedCount, `no extra rules (${expectedCount})`, `file has ${rows.size}`)
}

/* ── live half: the middleware, via a running server ────────────────────── */

/** Named `HttpResult`, not `Response`, so it does not shadow the global type. */
interface HttpResult {
  status: number
  location: string | null
}

async function head(base: string, path: string): Promise<HttpResult> {
  const res = await fetch(`${base}${path}`, { redirect: 'manual' })
  // Drain so the socket is released; a redirect body is empty anyway.
  await res.arrayBuffer().catch(() => undefined)
  return { status: res.status, location: res.headers.get('location') }
}

async function verifyLive(base: string): Promise<void> {
  console.log(`\nmiddleware — ${base}`)

  const expectRedirect = async (from: string, to: string) => {
    const { status, location } = await head(base, from)
    assert(status === 301 && location === to, `${from} -> 301 ${to}`, `got ${status} ${location}`)
  }

  const expectGone = async (from: string) => {
    const { status } = await head(base, from)
    assert(status === 410, `${from} -> 410`, `got ${status}`)
  }

  for (const path of LEGACY_GONE_EXACT) await expectGone(path)
  for (const [from, to] of Object.entries(LEGACY_REDIRECT_EXACT)) await expectRedirect(from, to)
  for (const [from, to] of LEGACY_REDIRECT_PREFIXES) {
    await expectRedirect(`${from}/${SPLAT_PROBE}`, `${to}/${SPLAT_PROBE}`)
  }
  // Collapsing families (gh#67): the splat is dropped, so the target is the whole
  // answer. Asserting the *absence* of the child path is the point — #206 was a
  // 301 that landed on a 404.
  for (const [from, to] of LEGACY_REDIRECT_COLLAPSE_PREFIXES) {
    await expectRedirect(`${from}/${SPLAT_PROBE}`, to)
  }

  // A slice of the slug map: one from each bucket plus every `aka` alias, which
  // are the only rows whose target is not a restatement of their own slug.
  const slugRows = Object.entries(LEGACY_SLUG_MAP)
  const sample = [
    slugRows.find(([slug, target]) => target === `/insights/${slug}`)!,
    slugRows.find(([slug, target]) => target === `/projects/${slug}`)!,
    ...slugRows.filter(([slug, target]) => target !== `/insights/${slug}` && target !== `/projects/${slug}`)
  ]
  for (const [slug, target] of sample) await expectRedirect(`/${slug}`, target)

  // /docs is untouched: served, with no Location header.
  for (const prefix of LEGACY_UNTOUCHED_PREFIXES) {
    const { status, location } = await head(base, prefix)
    assert(status === 200 && location === null, `${prefix} untouched`, `got ${status} ${location}`)
  }

  // An unknown one-segment path is not in the map and must fall through, not be
  // guessed at — no 3xx, whatever the page layer then decides to answer.
  const unknown = await head(base, '/definitely-not-a-legacy-slug-zzz')
  assert(
    unknown.status < 300 || unknown.status >= 400,
    '/definitely-not-a-legacy-slug-zzz falls through',
    `got ${unknown.status} ${unknown.location}`
  )

  // Inherited object keys are not slugs. A plain-object lookup answers for
  // `constructor`, `toString`, `valueOf`… with a truthy native function, which
  // would have been sent as a Location header; the middleware uses a `Map`.
  for (const key of ['constructor', 'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf']) {
    const { status, location } = await head(base, `/${key}`)
    assert(status < 300 || status >= 400, `/${key} is not a slug`, `got ${status} ${location}`)
  }

  // Query strings survive, ahead of a fragment; a trailing slash normalises.
  await expectRedirect('/team?utm_source=x', '/about?utm_source=x#team')
  await expectRedirect('/updates/', '/insights')
}

/* ── entry point ────────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const staticOnly = args.includes('--static-only')
  const baseIndex = args.indexOf('--base')
  const base = baseIndex === -1 ? 'http://localhost:3000' : args[baseIndex + 1]

  verifyStatic()
  if (!staticOnly) await verifyLive(base.replace(/\/$/, ''))

  console.log(
    `\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks} assertions, ${failures} failure${failures === 1 ? '' : 's'}`
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
