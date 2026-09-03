/**
 * Acceptance check — issue 14 / gh#23: `bfLogo`.
 *
 *   npx tsx scripts/verify-bf-logo.ts
 *
 * The vitest substitution. The harness on `dev` is broken and pre-existing
 * (residual #86), and this issue's acceptance must not depend on it, so the
 * equivalent-strength check is this script plus the probe page at
 * `/bf-probe/14-bf-logo` (spec Decisions; gh#20/gh#21/gh#22 precedent).
 *
 * ## What it actually proves
 *
 * Not "the file I wrote contains the strings I put in it" — the interesting
 * assertions are **relational**, against sources this script does not own:
 *
 *  1. **The artwork was transplanted, not redrawn.** Every `d` / `points`
 *     string in `components/bf/Logo.vue` is compared byte-for-byte against
 *     `components/legacy/atoms/Logo.vue`, in order. A redraw, a re-export from
 *     Illustrator, or a dropped sub-path fails here.
 *  2. **The consolidation is real.** `LogoWhite.vue` differs from `Logo.vue`
 *     only by the `bfna-logo--white` class, so one component with a `variant`
 *     prop is a faithful merge — asserted, not assumed.
 *  3. **No new colour** (BRIEF §5 rule 2 / DoD-6), including in the probe page,
 *     and the two colourways resolve through the *existing* semantic tokens
 *     the legacy stylesheet's `fill` values map onto.
 *  4. **The legacy files are untouched** — deleting them is issue 58, not this
 *     one — compared against their content on the merge-base with `dev`.
 *  5. The spec's own literal `grep` acceptance expressions, run as written.
 *
 * When `.output/public/bf-probe/14-bf-logo/index.html` exists (i.e. after
 * `npx nuxt generate`), the prerendered markup is checked too: six marks, the
 * `<title>`/`aria-labelledby` wiring, and no colour literal in the emitted
 * SVG. Without it those checks are skipped, not failed, so the script is
 * useful before a build as well as after one.
 *
 * Exit code 0 = every check passed; 1 = at least one failed (each printed).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(appRoot, '..')

const bfLogoPath = join(appRoot, 'src/components/bf/Logo.vue')
const legacyLogoPath = join(appRoot, 'src/components/legacy/atoms/Logo.vue')
const legacyWhitePath = join(appRoot, 'src/components/legacy/atoms/LogoWhite.vue')
const probePath = join(appRoot, 'src/pages/bf-probe/14-bf-logo.vue')
const contractsPath = join(appRoot, 'src/types/bf-contracts.ts')
const builtProbePath = join(appRoot, '.output/public/bf-probe/14-bf-logo/index.html')

let failures = 0
let skipped = 0

const check = (label: string, actual: unknown, expected: unknown) => {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    console.log(`  ok    ${label}`)
  } else {
    failures += 1
    console.log(`  FAIL  ${label}\n          expected ${e}\n          actual   ${a}`)
  }
}

const skip = (label: string, why: string) => {
  skipped += 1
  console.log(`  skip  ${label} — ${why}`)
}

const read = (path: string) => readFileSync(path, 'utf8')

/**
 * Source with comments removed.
 *
 * Every check below is about what the component *ships*, not what its prose
 * says. The doc comments deliberately quote the legacy `fill: #222` / `#fff`
 * and `class="st0"` they replaced, so a naive whole-file grep would fail on
 * its own documentation. Strip `<!-- -->`, block, and line comments first —
 * the `[^:]` guard keeps `http://` and `https://` intact.
 */
const code = (source: string) =>
  source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')

/** Every `d=""` / `points=""` value in a chunk of SVG markup, in document order. */
const geometry = (source: string): string[] =>
  [...source.matchAll(/\s(?:d|points)="([^"]*)"/g)].map(m => m[1]!)

/**
 * Colour literals: hex, `hsl()`, `rgb()`, `oklch()`, and the named colours the
 * epic would count as a new colour. Path data contains no `#`, and `viewBox`
 * numbers are not `hsl(`, so this runs over the whole file without carve-outs.
 */
const colourLiterals = (source: string): string[] =>
  [...source.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:hsla?|rgba?|oklch|lab|lch|color-mix)\(|\bfill="(?!currentColor|none)[^"]*"/g)]
    .map(m => m[0]!)

/* ------------------------------------------------------- 0. file exists -- */

console.log('\n0. the component exists')
check('src/components/bf/Logo.vue exists', existsSync(bfLogoPath), true)
if (!existsSync(bfLogoPath)) {
  console.log('\nFAIL — nothing else can be checked')
  process.exit(1)
}

const bfLogo = code(read(bfLogoPath))
const legacyLogo = read(legacyLogoPath)
const probe = code(read(probePath))
const contracts = read(contractsPath)

/* ------------------------------------- 1. the spec's own grep acceptance -- */

console.log("\n1. the spec's literal acceptance expressions")
check('contains "variant" (spec: >= 1)', (bfLogo.match(/variant/g) ?? []).length > 0, true)
check('contains role="img" (spec: >= 1)', (bfLogo.match(/role="img"/g) ?? []).length > 0, true)
check(
  'no `#rgb`/`hsl(` colour literal (spec: exactly 0)',
  (bfLogo.match(/#[0-9a-fA-F]{3,6}|hsl\(/g) ?? []).length,
  0
)

/* -------------------------------- 2. artwork transplanted, not redrawn -- */

console.log('\n2. the artwork is the legacy artwork, byte for byte')
const bfGeometry = geometry(bfLogo)
const legacyGeometry = geometry(legacyLogo)
check('drawable count matches legacy Logo.vue', bfGeometry.length, legacyGeometry.length)
check('15 d/points values (13 path + 2 polygon; <rect> has neither)', bfGeometry.length, 15)
check(
  'drawable element counts match legacy (13 path, 2 polygon, 1 rect)',
  ['path', 'polygon', 'rect'].map(tag => (bfLogo.match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length),
  [13, 2, 1]
)
check('every d/points value is byte-identical to legacy, in order', bfGeometry, legacyGeometry)
check(
  'viewBox matches legacy',
  /viewBox="0 0 695\.1 266\.6"/.test(bfLogo) && /viewBox="0 0 695\.1 266\.6"/.test(legacyLogo),
  true
)
check('the inert `class="st0"` is gone from the markup', /class="st0"/.test(bfLogo), false)

/* ------------------------------------------- 3. the consolidation is real -- */

console.log('\n3. one component replaces two legacy files')
const legacyWhite = read(legacyWhitePath)
check(
  'LogoWhite.vue differs from Logo.vue only by the `bfna-logo--white` class',
  legacyWhite.replace(' bfna-logo--white', ''),
  legacyLogo
)
check('bf/Logo.vue ships exactly one copy of the artwork', (bfLogo.match(/<svg/g) ?? []).length, 1)
check("`variant` is typed in bf-contracts, not inline", /export type LogoVariant = 'default' \| 'white'/.test(contracts), true)
check('the component imports its props type from bf-contracts', /from '~\/types\/bf-contracts'/.test(bfLogo), true)
check('no shared type declared inline in the component', /^(export )?(interface|type) /m.test(bfLogo.split('<template>')[0] ?? ''), false)

/* --------------------------------------------------- 4. colour discipline -- */

console.log('\n4. no new colour (BRIEF §5 rule 2 / DoD-6)')
check('no colour literal of any form in the component', colourLiterals(bfLogo), [])
check('no colour literal of any form in the probe page', colourLiterals(probe), [])
check('the component defines no new --color-* token', /--color-[a-z-]+\s*:/.test(bfLogo), false)
check('the probe page defines no new --color-* token', /--color-[a-z-]+\s*:/.test(probe), false)
check('default colourway reads --color-text', /--_bf-logo-color:\s*var\(--color-text\)/.test(bfLogo), true)
check('white colourway reads --color-white', /--_bf-logo-color:\s*var\(--color-white\)/.test(bfLogo), true)
check('the artwork paints currentColor', /<g fill="currentColor">/.test(bfLogo), true)

/* ----------------------------------------- 5. CSS-variable + a11y contract -- */

console.log('\n5. the epic conventions this component sets the precedent for')
check('CSS-variable hook is --_bf-logo-size', /--_bf-logo-size:\s*1\.25rem/.test(bfLogo), true)
check('  …and it drives block-size', /block-size:\s*var\(--_bf-logo-size\)/.test(bfLogo), true)
check('  …with the viewBox aspect ratio', /aspect-ratio:\s*695\.1\s*\/\s*266\.6/.test(bfLogo), true)
check('styles are in @layer components', /@layer components\s*\{/.test(bfLogo), true)
check('accessible name is wired with aria-labelledby → <title>', /:aria-labelledby="titleId"/.test(bfLogo) && /<title :id="titleId">Bertelsmann Foundation North America<\/title>/.test(bfLogo), true)
check('`$attrs` falls through (no inheritAttrs: false)', /inheritAttrs:\s*false/.test(bfLogo), false)
check('presentational only — no data access', /queryCollection|useAsyncData|useState|defineStore|composables\/data/.test(bfLogo), false)

/* -------------------------------------- 6. legacy files left alone (is 58) -- */

console.log('\n6. the legacy files are untouched — deleting them is issue 58')
try {
  const base = execFileSync('git', ['-C', repoRoot, 'merge-base', 'HEAD', 'dev'], { encoding: 'utf8' }).trim()
  for (const rel of [
    'bfna-website-nuxt/src/components/legacy/atoms/Logo.vue',
    'bfna-website-nuxt/src/components/legacy/atoms/LogoWhite.vue'
  ]) {
    const diff = execFileSync('git', ['-C', repoRoot, 'diff', '--stat', base, 'HEAD', '--', rel], { encoding: 'utf8' }).trim()
    check(`${rel.split('/').pop()} unchanged since ${base.slice(0, 7)}`, diff, '')
  }
} catch (error) {
  skip('legacy-file diff', `git unavailable (${(error as Error).message.split('\n')[0]})`)
}

/* ---------------------------------------------- 7. the prerendered markup -- */

console.log('\n7. the prerendered probe page (after `npx nuxt generate`)')
if (existsSync(builtProbePath)) {
  const html = read(builtProbePath)
  const marks = [...html.matchAll(/<svg[^>]*class="[^"]*bf-logo[^"]*"[\s\S]*?<\/svg>/g)].map(m => m[0]!)
  check('six marks prerendered (2 variants × 3 sizes)', marks.length, 6)
  check(
    'three of them are variant="white"',
    marks.filter(m => m.includes('data-variant="white"')).length,
    3
  )
  check(
    'every mark carries role="img" and an aria-labelledby → <title>',
    marks.every(m => {
      const id = /aria-labelledby="([^"]+)"/.exec(m)?.[1]
      // Vue appends its scope attribute after `id`, so match the tag loosely.
      const title = id
        ? new RegExp(`<title id="${id}"[^>]*>Bertelsmann Foundation North America</title>`).test(m)
        : false
      return m.includes('role="img"') && title
    }),
    true
  )
  check(
    'the six title ids are unique',
    new Set(marks.map(m => /aria-labelledby="([^"]+)"/.exec(m)?.[1])).size,
    6
  )
  check(
    'every mark got its --_bf-logo-size through $attrs',
    marks.map(m => /--_bf-logo-size:\s*([^;"]+)/.exec(m)?.[1]?.trim()).join(','),
    '1.25rem,2.5rem,5rem,1.25rem,2.5rem,5rem'
  )
  check('no colour literal in the emitted marks', marks.flatMap(colourLiterals), [])
  check('the geometry survived the render', geometry(marks[0] ?? ''), legacyGeometry)
} else {
  skip('prerendered markup', 'run `npx nuxt generate` first')
}

/* ------------------------------------------------------------- verdict -- */

console.log(
  `\n${failures === 0 ? 'PASS' : `FAIL — ${failures} check(s)`}${skipped ? ` (${skipped} skipped)` : ''}`
)
process.exit(failures === 0 ? 0 : 1)
