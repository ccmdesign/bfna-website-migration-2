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
 *  1. **The artwork has the legacy shape.** The drawable inventory of
 *     `components/bf/Logo.vue` — 13 `<path>`, 2 `<polygon>`, 1 `<rect>`, 15
 *     `d`/`points` values, and the `695.1 x 266.6` viewBox — is asserted
 *     literally. A redraw, a re-export from Illustrator, or a dropped sub-path
 *     still fails here.
 *  2. **No new colour** (BRIEF §5 rule 2 / DoD-6), including in the probe page,
 *     and the two colourways resolve through the *existing* semantic tokens
 *     the legacy stylesheet's `fill` values map onto.
 *  3. **The legacy files are gone** — retiring them was issue 58 (gh#67), and
 *     this script now asserts their absence where it used to assert that they
 *     were untouched.
 *  4. The spec's own literal `grep` acceptance expressions, run as written.
 *
 * ## What gh#67 removed, and why
 *
 * Sections 2 and 3 used to compare `bf/Logo.vue` byte-for-byte against
 * `components/legacy/atoms/{Logo,LogoWhite}.vue` — the strongest assertions in
 * the file, because their reference lived outside this script. Issue 58 deleted
 * those two files by design (DoD-5), so those comparisons have no reference left
 * and cannot be evaluated by anything, ever. They are removed rather than
 * skipped: the exit contract below treats a skip as INCOMPLETE, and a check whose
 * subject was deliberately retired is finished, not incomplete. What survives is
 * the intrinsic half — the shape of the artwork and the consolidation's visible
 * consequences — plus, in section 6, the retirement itself.
 *
 * Section 7 reads `.output/` — the prerendered probe page and the compiled
 * stylesheet — for six marks, the `<title>`/`aria-labelledby` wiring, the
 * `--_bf-logo-size` values, and no colour literal in the emitted SVG. Run
 * `npx nuxt generate` first.
 *
 * ## Exit contract
 *
 * `0` only when every check ran **and** passed. A skipped check exits `1`
 * too, as INCOMPLETE: a skip means a check could not be evaluated (no build
 * output, no `dev` ref in a shallow clone), and a verification that quietly
 * downgrades itself to "PASS (7 skipped)" is worse than no verification —
 * it is exactly how a broken component ships green.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const bfLogoPath = join(appRoot, 'src/components/bf/Logo.vue')
const legacyLogoPath = join(appRoot, 'src/components/legacy/atoms/Logo.vue')
const legacyWhitePath = join(appRoot, 'src/components/legacy/atoms/LogoWhite.vue')
const probePath = join(appRoot, 'src/pages/bf-probe/14-bf-logo.vue')
const contractsPath = join(appRoot, 'src/types/bf-contracts.ts')
const semanticColorsPath = join(appRoot, 'src/public/css/tokens/semantic-colors.css')
const builtProbePath = join(appRoot, '.output/public/bf-probe/14-bf-logo/index.html')
const builtCssDir = join(appRoot, '.output/public/_nuxt')

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
const NAMED_COLOURS = 'white|black|red|green|blue|gray|grey|silver|navy|teal|olive|lime|aqua|cyan|magenta|fuchsia|maroon|purple|yellow|orange|pink|brown|beige|gold|ivory|tan|violet|indigo|transparent'

const colourLiterals = (source: string): string[] =>
  [
    ...source.matchAll(
      new RegExp(
        // #hex
        '#[0-9a-fA-F]{3,8}\\b'
        // a colour function
        + '|\\b(?:hsla?|rgba?|oklch|oklab|lab|lch|color-mix)\\('
        // an SVG paint attribute that is not currentColor
        + '|\\bfill="(?!currentColor|none)[^"]*"'
        // a bare CSS named colour as a declaration value — `transparent`
        // included, since the epic counts any hard-coded paint as a colour.
        // `var(--color-white)` does not match: `var(` follows the colon.
        + `|:\\s*(?:${NAMED_COLOURS})\\b`,
        'g'
      )
    )
  ].map(m => m[0]!)

/* ------------------------------------------------------- 0. file exists -- */

console.log('\n0. the component exists')
check('src/components/bf/Logo.vue exists', existsSync(bfLogoPath), true)
if (!existsSync(bfLogoPath)) {
  console.log('\nFAIL — nothing else can be checked')
  process.exit(1)
}

const bfLogo = code(read(bfLogoPath))
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

console.log('\n2. the artwork still has the legacy shape')
const bfGeometry = geometry(bfLogo)
check('15 d/points values (13 path + 2 polygon; <rect> has neither)', bfGeometry.length, 15)
check(
  'drawable element counts (13 path, 2 polygon, 1 rect)',
  ['path', 'polygon', 'rect'].map(tag => (bfLogo.match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length),
  [13, 2, 1]
)
check('viewBox is the legacy artboard', /viewBox="0 0 695\.1 266\.6"/.test(bfLogo), true)
check('the inert `class="st0"` is gone from the markup', /class="st0"/.test(bfLogo), false)

/* ------------------------------------------- 3. the consolidation is real -- */

console.log('\n3. one component replaces two legacy files')
check('bf/Logo.vue ships exactly one copy of the artwork', (bfLogo.match(/<svg/g) ?? []).length, 1)
check('both colourways come from the one `variant` prop', /data-variant/.test(bfLogo), true)
check("`variant` is typed in bf-contracts, not inline", /export type LogoVariant = 'default' \| 'white'/.test(contracts), true)
check('the component imports its props type from bf-contracts', /from '~\/types\/bf-contracts'/.test(bfLogo), true)
check('no shared type declared inline in the component', /^(export )?(interface|type) /m.test(bfLogo.split('<template>')[0] ?? ''), false)

/* --------------------------------------------------- 4. colour discipline -- */

console.log('\n4. no new colour (BRIEF §5 rule 2 / DoD-6)')
check('no colour literal of any form in the component', colourLiterals(bfLogo), [])
check('no colour literal of any form in the probe page', colourLiterals(probe), [])
check('the component defines no new --color-* token', /--color-[a-z-]+\s*:/.test(bfLogo), false)
check('the probe page defines no new --color-* token', /--color-[a-z-]+\s*:/.test(probe), false)
check('default colourway reads --color-text', /--_bf-logo-color:\s*var\(--color-text\)\s*;/.test(bfLogo), true)
/*
 * gh#101 (residual #99): the white colourway used to read `--color-white`, a
 * *primitive*, which BRIEF §5 rule 2 forbids. `semantic-colors.css` now carries
 * `--color-text-inverse` as an alias of that same primitive, so the component
 * reads the semantic name. Both halves are asserted — the component must use
 * the alias, and it must no longer reach past it to the primitive.
 */
check('white colourway reads --color-text-inverse', /--_bf-logo-color:\s*var\(--color-text-inverse\)/.test(bfLogo), true)
check('  …and no longer reaches for the --color-white primitive', /var\(--color-white\)/.test(bfLogo), false)
check('the artwork paints currentColor', /<g fill="currentColor">/.test(bfLogo), true)

/*
 * The aliases themselves: defined in the semantic layer, and defined as
 * `var()` references to existing primitives — never as a literal. A future
 * edit that gives either one a colour value of its own fails here, which is
 * what keeps DoD-6 ("no new colour") true of the token layer and not just of
 * this component.
 */
const semanticTokens = read(semanticColorsPath)
for (const [alias, primitive] of [
  ['--color-text-inverse', '--color-white'],
  ['--color-surface-inverse', '--color-black']
] as const) {
  check(
    `${alias} is a var() alias of ${primitive}, not a new value`,
    new RegExp(`${alias}:\\s*var\\(${primitive}\\)\\s*;`).test(semanticTokens),
    true
  )
}

/* ----------------------------------------- 5. CSS-variable + a11y contract -- */

console.log('\n5. the epic conventions this component sets the precedent for')
check('CSS-variable hook is --_bf-logo-size', /--_bf-logo-size:\s*1\.25rem/.test(bfLogo), true)
check('  …and it drives block-size', /block-size:\s*var\(--_bf-logo-size\)/.test(bfLogo), true)
check('  …with the viewBox aspect ratio', /aspect-ratio:\s*695\.1\s*\/\s*266\.6/.test(bfLogo), true)
check('styles are in @layer components', /@layer components\s*\{/.test(bfLogo), true)
check('accessible name is wired with aria-labelledby → <title>', /:aria-labelledby="titleId"/.test(bfLogo) && /<title :id="titleId">Bertelsmann Foundation North America<\/title>/.test(bfLogo), true)
check('`$attrs` falls through (no inheritAttrs: false)', /inheritAttrs:\s*false/.test(bfLogo), false)
check('presentational only — no data access', /queryCollection|useAsyncData|useState|defineStore|composables\/data/.test(bfLogo), false)

/* ------------------------------------------ 6. legacy files retired (58) -- */

console.log('\n6. the legacy logo files are gone — issue 58 retired them (DoD-5)')
check('components/legacy/atoms/Logo.vue is gone', existsSync(legacyLogoPath), false)
check('components/legacy/atoms/LogoWhite.vue is gone', existsSync(legacyWhitePath), false)
check('components/legacy/ is gone entirely', existsSync(join(appRoot, 'src/components/legacy')), false)

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
    'the m/l marks got their --_bf-logo-size through $attrs; s got none',
    marks.map(m => /--_bf-logo-size:\s*([^;"]+)/.exec(m)?.[1]?.trim() ?? '').join(','),
    ',2.5rem,5rem,,2.5rem,5rem'
  )
  check('no colour literal in the emitted marks', marks.flatMap(colourLiterals), [])
  check('the geometry survived the render', geometry(marks[0] ?? ''), legacyGeometry)
  check(
    'the first mark passes no --_bf-logo-size, so the CSS default applies',
    /--_bf-logo-size/.test(marks[0] ?? ''),
    false
  )

  /*
   * gh#101 (residual #98): this used to be an `info` disclosure, because
   * `postcss-preset-env` at `stage: 1` ran its cascade-layers polyfill over
   * every Vite-compiled stylesheet and flattened the wrapper away, so section
   * 5's source-text match was true of the source and false of the artifact.
   * `nuxt.config.ts` now sets `features: { 'cascade-layers': false }`, so it
   * is a hard check: a future config change that re-enables the polyfill
   * fails here instead of silently unlayering every `bf-*` component.
   *
   * Co-occurrence in a file is not the assertion — `.bf-logo` must sit
   * *inside* the `@layer components` block, so the block is brace-matched and
   * the rule looked for within it.
   */
  /**
   * Replace the *contents* of CSS strings and comments with `x`, preserving
   * length and the delimiters. Braces inside `content: "}"` or inside a
   * comment are not structural, and counting them shifts the extracted body
   * silently — a brace-counter that reads raw text can pass or fail against
   * the wrong slice of CSS with no error.
   */
  const maskLiterals = (css: string): string => {
    let out = ''
    let i = 0
    while (i < css.length) {
      const ch = css[i]!
      if (ch === '"' || ch === "'") {
        out += ch
        i += 1
        while (i < css.length && css[i] !== ch) {
          // A backslash escapes the next character, quote included.
          if (css[i] === '\\' && i + 1 < css.length) {
            out += 'xx'
            i += 2
            continue
          }
          out += 'x'
          i += 1
        }
        if (i < css.length) { out += ch; i += 1 }
        continue
      }
      if (ch === '/' && css[i + 1] === '*') {
        const end = css.indexOf('*/', i + 2)
        const stop = end === -1 ? css.length : end + 2
        out += '/*' + 'x'.repeat(Math.max(0, stop - i - 4)) + (end === -1 ? '' : '*/')
        i = stop
        continue
      }
      out += ch
      i += 1
    }
    return out
  }

  const layerComponentsBody = (raw: string): string => {
    const css = maskLiterals(raw)
    const opener = /@layer\s+components\s*\{/g
    let match: RegExpExecArray | null
    const bodies: string[] = []
    while ((match = opener.exec(css)) !== null) {
      let depth = 1
      let i = match.index + match[0].length
      const start = i
      while (i < css.length && depth > 0) {
        if (css[i] === '{') depth += 1
        else if (css[i] === '}') depth -= 1
        i += 1
      }
      // An unbalanced tail means the block never closed — not a body.
      if (depth === 0) bodies.push(css.slice(start, i - 1))
    }
    return bodies.join('\n')
  }

  /*
   * The class token exactly — `\b` would also fire on a future `.bf-logo-mark`
   * (the boundary sits at the letter→hyphen), so the real `.bf-logo` rule
   * could be renamed away while an unrelated sibling kept these checks green.
   */
  const BF_LOGO_SELECTOR = /\.bf-logo(?![\w-])/

  const cssFiles = readdirSync(builtCssDir).filter(f => f.endsWith('.css'))
  const bfLogoSheets = cssFiles
    .map(f => read(join(builtCssDir, f)))
    .filter(css => BF_LOGO_SELECTOR.test(css))

  check('a compiled stylesheet carries the .bf-logo rules', bfLogoSheets.length > 0, true)
  check(
    '@layer survived the build (postcss cascade-layers polyfill is off)',
    bfLogoSheets.some(css => /@layer\s+components\s*\{/.test(css)),
    true
  )
  check(
    '  …and the .bf-logo rules sit *inside* @layer components',
    bfLogoSheets.some(css => BF_LOGO_SELECTOR.test(layerComponentsBody(css))),
    true
  )
  check(
    '  …including the white colourway, reading the semantic alias',
    bfLogoSheets.some(css =>
      /--_bf-logo-color:\s*var\(--color-text-inverse\)/.test(layerComponentsBody(css))
    ),
    true
  )
} else {
  skip('prerendered markup', 'run `npx nuxt generate` first')
}

/* ------------------------------------------------------------- verdict -- */

if (failures > 0) {
  console.log(`\nFAIL — ${failures} check(s)${skipped ? `, ${skipped} skipped` : ''}`)
  process.exit(1)
}
if (skipped > 0) {
  console.log(
    `\nINCOMPLETE — ${skipped} check(s) could not be evaluated. Acceptance is not`
    + '\nsatisfied until every check runs: `npx nuxt generate` first, and run this'
    + '\nfrom a checkout that has the `dev` ref.'
  )
  process.exit(1)
}
console.log('\nPASS')
process.exit(0)
