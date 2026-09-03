/**
 * Acceptance check — issue 15 / gh#24: `bfButton`.
 *
 *   npx tsx scripts/verify-bf-button.ts
 *
 * The vitest substitution. The harness on `dev` is broken and pre-existing
 * (residual #86), and this issue's acceptance must not depend on it, so the
 * equivalent-strength check is this script plus the probe page at
 * `/bf-probe/15-bf-button` (spec Decisions; gh#20–gh#23 precedent).
 *
 * ## What it actually proves
 *
 * The interesting assertions are **relational** — against sources this script
 * does not own — not "the file I wrote contains the strings I put in it":
 *
 *  1. **The box metrics are the wireframe's.** The padding and border width
 *     are parsed back out of the frozen `public/css/wireframe.css` and
 *     compared with what the component declares. Neither number is typed
 *     twice, so a drift on either side fails here rather than by eye.
 *  2. **The frozen class is not reused**, and no file under the frozen
 *     wireframe paths was touched — compared against the pre-epic base SHA,
 *     not just against `dev`.
 *  3. **No new colour** (BRIEF §5 rule 2 / DoD-6) in the component or the
 *     probe, and no colour *primitive* either — every paint is a semantic
 *     token that already exists in `tokens/semantic-colors.css`.
 *  4. **`@layer components` survived the build** into the emitted stylesheet
 *     (the gh#101 / residual #98 guard; the probe checks the live CSSOM).
 *  5. The spec's own literal `test`/`grep` acceptance expressions, run as
 *     written.
 *  6. The prerendered probe really carries the matrix in bulk, with every
 *     element-resolver branch represented, every instance classified into
 *     exactly one of them, and no disabled *link*. Stated as bounds and set
 *     equalities rather than pinned totals (residual #115), so adding an
 *     instance to the probe cannot fail a correct component.
 *
 * Sections 4 and 6 read `.output/`. Run `npx nuxt generate` first.
 *
 * ## Exit contract
 *
 * `0` only when every check ran **and** passed. A skipped check exits `1` too,
 * as INCOMPLETE: a skip means a check could not be evaluated, and a
 * verification that quietly downgrades itself to "PASS (7 skipped)" is
 * exactly how a broken component ships green. (gh#23's contract, kept.)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(appRoot, '..')

const componentPath = join(appRoot, 'src/components/bf/Button.vue')
const probePath = join(appRoot, 'src/pages/bf-probe/15-bf-button.vue')
const contractsPath = join(appRoot, 'src/types/bf-contracts.ts')
const wireframeCssPath = join(appRoot, 'src/public/css/wireframe.css')
const semanticColorsPath = join(appRoot, 'src/public/css/tokens/semantic-colors.css')
const semanticMiscPath = join(appRoot, 'src/public/css/tokens/semantic-misc.css')
const builtProbePath = join(appRoot, '.output/public/bf-probe/15-bf-button/index.html')
const builtCssDir = join(appRoot, '.output/public/_nuxt')

/** Tip of `dev` when issue #1 started — the epic's byte-identity baseline. */
const EPIC_BASE_SHA = 'f757a649361993275a43282456f4746d247be37b'

/** The frozen paths (BRIEF D2 / DoD-4), repo-relative. */
const FROZEN_PATHS = [
  'bfna-website-nuxt/src/pages/wireframes',
  'bfna-website-nuxt/src/components/wireframe',
  'bfna-website-nuxt/src/layouts/wireframe.vue',
  'bfna-website-nuxt/src/public/css/wireframe.css',
  'bfna-website-nuxt/src/composables/useWfContent.ts',
  'bfna-website-nuxt/src/assets/wireframe-data'
]

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
 * Every check below is about what the files *ship*, not what their prose says.
 * The probe's own documentation quotes the frozen class name it measures
 * against, and the component's documentation names the wireframe's white and
 * near-black literals in a mapping table — so a naive whole-file scan would
 * fail on documentation that is doing its job. The `[^:]` guard keeps
 * `http://` and `https://` intact.
 */
const code = (source: string) =>
  source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')

/** Colour literals, as gh#23's `verify-bf-logo.ts` defines them. Kept identical. */
const NAMED_COLOURS = 'white|black|red|green|blue|gray|grey|silver|navy|teal|olive|lime|aqua|cyan|magenta|fuchsia|maroon|purple|yellow|orange|pink|brown|beige|gold|ivory|tan|violet|indigo|transparent'

const colourLiterals = (source: string): string[] =>
  [
    ...source.matchAll(
      new RegExp(
        '#[0-9a-fA-F]{3,8}\\b'
        + '|\\b(?:hsla?|rgba?|oklch|oklab|lab|lch|color-mix)\\('
        + '|\\bfill="(?!currentColor|none)[^"]*"'
        + `|:\\s*(?:${NAMED_COLOURS})\\b`,
        'g'
      )
    )
  ].map(m => m[0])

/** Every `--color-*` / `--outline-*` / `--size*` / `--space*` token a file references. */
const tokensUsed = (source: string): string[] =>
  [...new Set([...source.matchAll(/var\(\s*(--[a-z0-9-]+)/g)].map(m => m[1]!))].sort()

const git = (args: string[]): string =>
  execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

/* ------------------------------------------------------------------ *
 * 1. The spec's own literal acceptance expressions, run as written.
 * ------------------------------------------------------------------ */
console.log('\n1. Spec acceptance expressions')

check('test -f src/components/bf/Button.vue', existsSync(componentPath), true)

const componentSource = read(componentPath)

check(
  'grep -c "NuxtLink" src/components/bf/Button.vue  >= 1',
  componentSource.split('\n').filter(l => l.includes('NuxtLink')).length >= 1,
  true
)
check(
  'grep -c "variant" src/components/bf/Button.vue   >= 1',
  componentSource.split('\n').filter(l => l.includes('variant')).length >= 1,
  true
)
/*
 * Run over the whole file, comments included, exactly as the spec writes it —
 * this is the one expression whose value depends on it. The component's prose
 * deliberately never spells the frozen class name for that reason.
 */
check(
  'grep -c "wf-button" src/components/bf/Button.vue == 0',
  componentSource.split('\n').filter(l => l.includes('wf-button')).length,
  0
)
check(
  'the component carries no `class="wf-button"` and no `.wf-button` rule',
  /wf-button/.test(code(componentSource)),
  false
)

/* ------------------------------------------------------------------ *
 * 2. Box metrics: parsed out of the frozen stylesheet, not typed twice.
 * ------------------------------------------------------------------ */
console.log('\n2. Box metrics come from the wireframe class')

const wireframeCss = read(wireframeCssPath)
const wfRule = wireframeCss.match(/\.wireframe \.wf-button \{([^}]*)\}/)

if (!wfRule) {
  skip('the wireframe button rule is readable', 'rule not found in wireframe.css')
} else {
  const body = wfRule[1]!
  const wfPadding = body.match(/padding:\s*([^;]+);/)?.[1]?.trim()
  const wfBorderWidth = body.match(/border:\s*([0-9.]+px)/)?.[1]

  const componentCss = componentSource.slice(componentSource.indexOf('<style'))
  const bfPadding = componentCss.match(/--_bf-button-padding:\s*([^;]+);/)?.[1]?.trim()

  check('the component declares the same padding the wireframe class does', bfPadding, wfPadding)
  check('  …and it is em-relative, so one font-size change scales the box', /\d(?:\.\d+)?em\b/.test(bfPadding ?? ''), true)

  /*
   * The border width is asserted through the token rather than the literal:
   * the component must not hard-code `2px`, it must reach for the existing
   * `--border-width-medium` — so this resolves that token out of
   * `semantic-misc.css` and compares the resolved value with the wireframe's.
   */
  const tokenValue = read(semanticMiscPath).match(/--border-width-medium:\s*([^;]+);/)?.[1]?.trim()
  check('the component uses --border-width-medium, not a literal width', /--_bf-button-border:\s*var\(--border-width-medium\)/.test(componentCss), true)
  check('  …and that token resolves to the wireframe border width', tokenValue, wfBorderWidth)
}

/* ------------------------------------------------------------------ *
 * 3. Colour: no literal, no primitive, semantic tokens only.
 * ------------------------------------------------------------------ */
console.log('\n3. Colour')

check('no colour literal in the component', colourLiterals(code(componentSource)), [])
check('no colour literal in the probe', colourLiterals(code(read(probePath))), [])

const semanticColours = read(semanticColorsPath)
/** The names declared in the semantic layer — anything else is a primitive. */
const semanticNames = new Set(
  [...semanticColours.matchAll(/^\s*(--color-[a-z0-9-]+):/gm)].map(m => m[1]!)
)

const componentColourTokens = tokensUsed(code(componentSource)).filter(t => t.startsWith('--color-'))
check(
  'every --color-* the component uses is a semantic token, never a primitive',
  componentColourTokens.filter(t => !semanticNames.has(t)),
  []
)
check(
  'the component reads --color-text-inverse (the gh#101 semantic alias)',
  componentColourTokens.includes('--color-text-inverse'),
  true
)
check(
  'the component adds no --color-* token of its own',
  /--color-[a-z0-9-]+\s*:/.test(code(componentSource)),
  false
)
check(
  'the focus ring reuses the existing --outline-focus token',
  tokensUsed(code(componentSource)).includes('--outline-focus'),
  true
)
check(
  '  …and that token exists in the token layer',
  /--outline-focus:/.test(read(semanticMiscPath)),
  true
)
check(
  'ButtonProps is declared in bf-contracts.ts (BRIEF §5 rule 11)',
  /export interface ButtonProps/.test(read(contractsPath)),
  true
)
check(
  '  …and imported from there, not re-declared in the component',
  /import type \{ ButtonProps \} from '~\/types\/bf-contracts'/.test(componentSource)
    && !/\binterface\s+ButtonProps/.test(code(componentSource)),
  true
)

/* ------------------------------------------------------------------ *
 * 4. `@layer components` in the source and in the built CSS.
 * ------------------------------------------------------------------ */
console.log('\n4. Cascade layer survives the build (gh#101 / residual #98)')

check('the component ships @layer components', /@layer components \{/.test(componentSource), true)

if (!existsSync(builtCssDir)) {
  skip('@layer components reaches the emitted stylesheet', 'no .output — run `npx nuxt generate`')
} else {
  /**
   * Every `@layer …{ … }` block removed, brace-matched.
   *
   * The obvious `/@layer components\s*\{[^]*?\.bf-button/` only proves that an
   * `@layer` opener appears *somewhere before* the selector; it never checks
   * that the block is still open at that point, so a flattened rule sharing a
   * chunk with a layered one would still match. Deleting the blocks and then
   * looking for what is left is the check that cannot be fooled that way.
   */
  const outsideLayers = (css: string): string => {
    let out = ''
    let i = 0
    while (i < css.length) {
      const at = css.indexOf('@layer', i)
      if (at === -1) { out += css.slice(i); break }
      const brace = css.indexOf('{', at)
      const semi = css.indexOf(';', at)
      // A layer-order statement (`@layer a, b;`) opens no block.
      if (brace === -1 || (semi !== -1 && semi < brace)) {
        out += css.slice(i, semi === -1 ? css.length : semi + 1)
        i = semi === -1 ? css.length : semi + 1
        continue
      }
      out += css.slice(i, at)
      let depth = 1
      let j = brace + 1
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth += 1
        else if (css[j] === '}') depth -= 1
        j += 1
      }
      i = j
    }
    return out
  }

  const cssFiles = readdirSync(builtCssDir).filter(f => f.endsWith('.css'))
  const withButton = cssFiles
    .map(f => read(join(builtCssDir, f)))
    .filter(css => css.includes('.bf-button'))

  check('the component stylesheet was emitted', withButton.length > 0, true)
  check(
    '  …and no .bf-button rule sits outside a cascade layer',
    withButton.length > 0 && withButton.every(css => !outsideLayers(css).includes('.bf-button')),
    true
  )
  check(
    '  …with the layer named `components`',
    withButton.length > 0 && withButton.every(css => /@layer\s+components\s*\{/.test(css)),
    true
  )
}

/* ------------------------------------------------------------------ *
 * 5. The frozen wireframe sources are byte-identical to the pre-epic base.
 * ------------------------------------------------------------------ */
console.log('\n5. Frozen wireframe sources (BRIEF D2 / DoD-4)')

try {
  git(['cat-file', '-e', `${EPIC_BASE_SHA}^{commit}`])
  const diff = git(['diff', '--stat', EPIC_BASE_SHA, 'HEAD', '--', ...FROZEN_PATHS]).trim()
  check('no frozen wireframe file differs from the pre-epic base', diff, '')
} catch (error) {
  skip('frozen wireframe sources unchanged', `pre-epic base ${EPIC_BASE_SHA.slice(0, 7)} unreachable (${(error as Error).message.split('\n')[0]})`)
}

/* ------------------------------------------------------------------ *
 * 6. The prerendered probe carries the matrix.
 * ------------------------------------------------------------------ */
console.log('\n6. Prerendered probe')

if (!existsSync(builtProbePath)) {
  skip('the probe prerenders the full matrix', 'no .output — run `npx nuxt generate`')
} else {
  const html = read(builtProbePath)

  /*
   * Whole tags, not "from `class=` onwards": attribute order in the emitted
   * HTML is the renderer's business, and a check that silently depends on it
   * is a check that breaks on an unrelated upgrade. The class is matched as a
   * token rather than as the whole attribute, because `NuxtLink` adds
   * `router-link-active` of its own to the ones pointing at this page.
   */
  const instances = [...html.matchAll(/<(?:a|button)\b[^>]*class="[^"]*\bbf-button\b[^"]*"[^>]*>/g)].map(m => m[0])

  /*
   * Bounds and self-consistency, not pinned totals (residual #115). The probe
   * header invites later issues to add instances, and an absolute count breaks
   * on a correct component the moment one does. The load-bearing claims are
   * that every branch of the element resolver renders, that every rendered
   * button classified into exactly one of them, and that the marker attributes
   * land only where they belong — none of which a total was checking.
   */
  const modes = {
    link: instances.filter(a => a.includes('data-element="link"')).length,
    anchor: instances.filter(a => a.includes('data-element="anchor"')).length,
    button: instances.filter(a => a.includes('data-element="button"')).length
  }

  check('every rendered button resolved into exactly one mode', modes.link + modes.anchor + modes.button, instances.length)
  check('  …and all three modes render', Object.values(modes).every(n => n >= 1), true)
  check(
    `  …and the matrix still renders in bulk — ${instances.length} instances (link/anchor/button: ${modes.link}/${modes.anchor}/${modes.button}), floor 20`,
    instances.length >= 20,
    true
  )
  check('  …at least one instance is variant="primary"', instances.filter(a => a.includes('data-variant="primary"')).length >= 1, true)
  check(
    '  …[data-external] appears only on <a href> instances',
    instances.filter(a => a.includes('data-external')).every(a => a.includes('data-element="anchor"')),
    true
  )
  check('  …and at least one external anchor carries the marker', instances.filter(a => a.includes('data-external')).length >= 1, true)

  /*
   * The failure this component exists to prevent, asserted against the shipped
   * HTML: no `<a>` anywhere on the page is disabled-looking, and every
   * `disabled` attribute sits on a `<button>`.
   */
  /*
   * A bare `disabled` **attribute**, not the substring: the page also contains
   * `id="disabled-heading"` and `class="probe__disabled"`, and a `\b`-anchored
   * scan would happily count those as disabled elements.
   */
  const disabledTags = [...html.matchAll(/<(\w+)[^>]*\sdisabled(?=[\s>=])/g)].map(m => m[1])
  check('every disabled element in the prerendered page is a <button>', [...new Set(disabledTags)], ['button'])
  check('  …and the disabled demo renders at all', disabledTags.length >= 1, true)
  check('no anchor carries aria-disabled instead', /aria-disabled/.test(html), false)

  /*
   * The verdict is `pending` in the prerendered HTML by design — the 37
   * runtime assertions run on mount. This asserts exactly that and no more:
   * a `fail` baked into the static output would be a real regression, and a
   * `pass` there would mean the three-state verdict had been broken back into
   * two. What it deliberately does **not** claim is that the runtime checks
   * passed; nothing in this process can know that — `scripts/check-probes.ts`
   * (gh#109) is what does, by loading this page in a headless browser.
   */
  check(
    'the verdict cell prerenders in the `pending` state',
    html.match(/data-testid="probe-15-verdict"[^>]*data-state="(\w+)"|data-state="(\w+)"[^>]*data-testid="probe-15-verdict"/)?.slice(1).find(Boolean),
    'pending'
  )
  check('the wireframe reference button prerenders for the metrics check', html.includes('probe-15-wf-button'), true)
}

/* ------------------------------------------------------------------ */
const status = failures === 0 && skipped === 0 ? 'PASS' : failures === 0 ? 'INCOMPLETE' : 'FAIL'
console.log(`\n${status} — ${failures} failed, ${skipped} skipped`)
process.exit(status === 'PASS' ? 0 : 1)
