/**
 * Acceptance check — issue 16 / gh#25: `bfChip`.
 *
 *   npx tsx scripts/verify-bf-chip.ts
 *
 * The vitest substitution. The harness on `dev` is broken and pre-existing
 * (residual #86), and this issue's acceptance must not depend on it, so the
 * equivalent-strength check is this script plus the probe page at
 * `/bf-probe/16-bf-chip` (spec Decisions; gh#20 – gh#24 precedent).
 *
 * ## What it actually proves
 *
 * As in `verify-bf-button.ts`, the interesting assertions are **relational** —
 * against sources this script does not own — not "the file I wrote contains
 * the strings I put in it":
 *
 *  1. **The box metrics are the wireframe chip's.** Padding, border width and
 *     corner radius are parsed back out of the frozen
 *     `public/css/wireframe.css` and compared with what the component
 *     declares — through the tokens it reaches for, so a hard-coded literal
 *     fails even when it happens to have the right value.
 *  2. **The frozen class is not reused**, and no file under the frozen
 *     wireframe paths was touched — compared against the pre-epic base SHA,
 *     not just against `dev`.
 *  3. **The selected state is a rule, not an inline declaration** — the whole
 *     point of the issue, and the spec's own `grep -c ":style=" == 0`.
 *  4. **No new colour** (BRIEF §5 rule 2 / DoD-6) in the component or the
 *     probe, and no colour *primitive* either.
 *  5. **`@layer components` survived the build** into the emitted stylesheet
 *     (the gh#101 / residual #98 guard; the probe checks the live CSSOM).
 *  6. The prerendered probe really carries all four modes, every toggle with a
 *     real `aria-pressed` state matching its `[data-active]`, and no styled
 *     chip other than the deliberate consumer-override demo. Stated as bounds
 *     and set equalities rather than pinned totals (residual #115), so adding
 *     an instance to the probe cannot fail a correct component.
 *
 * Sections 5 and 7 read `.output/`. Run `npx nuxt generate` first.
 *
 * ## Exit contract
 *
 * `0` only when every check ran **and** passed. A skipped check exits `1` too,
 * as INCOMPLETE: a skip means a check could not be evaluated, and a
 * verification that quietly downgrades itself to "PASS (7 skipped)" is exactly
 * how a broken component ships green. (gh#23's contract, kept.)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(appRoot, '..')

const componentPath = join(appRoot, 'src/components/bf/Chip.vue')
const probePath = join(appRoot, 'src/pages/bf-probe/16-bf-chip.vue')
const contractsPath = join(appRoot, 'src/types/bf-contracts.ts')
const wireframeCssPath = join(appRoot, 'src/public/css/wireframe.css')
const wireframeChipPath = join(appRoot, 'src/components/wireframe/wfChip.vue')
const semanticColorsPath = join(appRoot, 'src/public/css/tokens/semantic-colors.css')
const semanticMiscPath = join(appRoot, 'src/public/css/tokens/semantic-misc.css')
const builtProbePath = join(appRoot, '.output/public/bf-probe/16-bf-chip/index.html')
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
 * The probe's documentation quotes the frozen class name it measures against
 * and both files name gh issue numbers that look like hex colours, so a naive
 * whole-file scan would fail on documentation doing its job. The `[^:]` guard
 * keeps `http://` and `https://` intact.
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

/** Every `--*` token a file references through `var()`. */
const tokensUsed = (source: string): string[] =>
  [...new Set([...source.matchAll(/var\(\s*(--[a-z0-9-]+)/g)].map(m => m[1]!))].sort()

const git = (args: string[]): string =>
  execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

/* ------------------------------------------------------------------ *
 * 1. The spec's own literal acceptance expressions, run as written.
 * ------------------------------------------------------------------ */
console.log('\n1. Spec acceptance expressions')

check('test -f src/components/bf/Chip.vue', existsSync(componentPath), true)

const componentSource = read(componentPath)
const lines = (needle: string) => componentSource.split('\n').filter(l => l.includes(needle)).length

check('grep -c "toggle" src/components/bf/Chip.vue        >= 1', lines('toggle') >= 1, true)
check('grep -c "aria-pressed" src/components/bf/Chip.vue  >= 1', lines('aria-pressed') >= 1, true)
/*
 * Run over the comment-stripped source, like every other check here — a
 * deliberate deviation from the spec's literal `grep`, resolved by residual
 * #115. Run over the whole file, the expression fails a *correct* component
 * the moment a future doc edit merely spells the token in prose, which makes
 * it a check on the comments rather than on the code. The component's prose
 * still avoids spelling it out, so both readings agree today; this one keeps
 * agreeing tomorrow.
 */
const codeLines = (needle: string) => code(componentSource).split('\n').filter(l => l.includes(needle)).length

check('grep -c ":style=" src/components/bf/Chip.vue (code only) == 0', codeLines(':style='), 0)
check('grep -c "wf-chip" src/components/bf/Chip.vue       == 0', lines('wf-chip'), 0)
check(
  'the component carries no reference to the frozen class at all',
  /wf-chip/.test(code(componentSource)),
  false
)

/* ------------------------------------------------------------------ *
 * 2. The selected state is a CSS rule, not an inline declaration.
 * ------------------------------------------------------------------ */
console.log('\n2. The selected state is a rule (the point of the issue)')

const componentCss = componentSource.slice(componentSource.indexOf('<style'))

check(
  'a .bf-chip[data-active] rule exists in the component stylesheet',
  /\.bf-chip\[data-active\]\s*\{/.test(componentCss),
  true
)
check(
  '  …and it re-points the hooks rather than declaring paint directly',
  /\.bf-chip\[data-active\]\s*\{[^}]*--_bf-chip-bg:[^}]*--_bf-chip-color:/.test(componentCss),
  true
)
check(
  'the template binds data-active from the state, absent when unset',
  /:data-active="pressed \|\| undefined"/.test(componentSource),
  true
)
check(
  'the component declares no cssVars computed (nothing to override inline)',
  /cssVars/.test(code(componentSource)),
  false
)
/*
 * The failure this component exists to delete, asserted structurally: the
 * frozen component signals the selected state with an inline attribute, and
 * the search page hand-rolls the same logic twice. Both are read here only to
 * confirm they are still exactly as they were — never edited (D2).
 */
check(
  'the frozen chip still uses the inline-attribute pattern this replaces',
  /:style="active \?/.test(read(wireframeChipPath)),
  true
)

/* ------------------------------------------------------------------ *
 * 3. The toggle contract, at the source level.
 * ------------------------------------------------------------------ */
console.log('\n3. Toggle contract')

check(
  'the toggle branch is a native <button type="button">',
  /<button\b[\s\S]{0,200}type="button"/.test(componentSource),
  true
)
check(
  '  …carrying aria-pressed as an explicit "true"/"false" string',
  /:aria-pressed="ariaPressed"/.test(componentSource)
    && /pressed\.value\s*\?\s*['"]true['"]\s*:\s*['"]false['"]/.test(componentSource),
  true
)
check(
  'it emits update:modelValue, declared as a typed emit',
  /defineEmits<\{[\s\S]*?['"]update:modelValue['"]:\s*\[value: boolean\][\s\S]*?\}>/.test(componentSource),
  true
)
check(
  '  …with the negated value',
  /emit\(\s*['"]update:modelValue['"]\s*,\s*!\s*props\.modelValue\s*\)/.test(componentSource),
  true
)
/*
 * Space and Enter are the platform's job. A `keydown` listener here would mean
 * the component had stopped trusting the native button — which is the
 * hand-rolling this issue removes, not adds.
 */
check(
  'no keydown/keyup handler — Space and Enter are the native button’s job',
  /@key(?:down|up|press)/.test(code(componentSource)),
  false
)
check(
  'no tabindex and no role override',
  /tabindex|role="button"/.test(code(componentSource)),
  false
)

/* ------------------------------------------------------------------ *
 * 4. Box metrics: parsed out of the frozen stylesheet, not typed twice.
 * ------------------------------------------------------------------ */
console.log('\n4. Box metrics come from the wireframe chip class')

const wireframeCss = read(wireframeCssPath)
const wfRule = wireframeCss.match(/\.wireframe \.wf-chip \{([^}]*)\}/)
const semanticMisc = read(semanticMiscPath)

if (!wfRule) {
  skip('the wireframe chip rule is readable', 'rule not found in wireframe.css')
} else {
  const body = wfRule[1]!
  const wfPadding = body.match(/padding:\s*([^;]+);/)?.[1]?.trim()
  const wfBorderWidth = body.match(/border:\s*([0-9.]+px)/)?.[1]
  const wfRadius = body.match(/border-radius:\s*([^;]+);/)?.[1]?.trim()

  const bfPadding = componentCss.match(/--_bf-chip-padding:\s*([^;]+);/)?.[1]?.trim()

  check('the component declares the same padding the wireframe rule does', bfPadding, wfPadding)
  check('  …and it is em-relative, so one font-size change scales the box', /\d(?:\.\d+)?em\b/.test(bfPadding ?? ''), true)

  /*
   * Both the width and the radius are asserted *through their tokens*: the
   * component must not hard-code `1px`/`999px`, it must reach for the existing
   * semantic names — so each token is resolved out of `semantic-misc.css` and
   * the resolved value compared with the frozen rule's literal.
   */
  check(
    'the component uses --border-width-thin, not a literal width',
    /--_bf-chip-border:\s*var\(--border-width-thin\)/.test(componentCss),
    true
  )
  check(
    '  …and that token resolves to the wireframe border width',
    semanticMisc.match(/--border-width-thin:\s*([^;]+);/)?.[1]?.trim(),
    wfBorderWidth
  )
  check(
    'the component uses --radius-pill, not a literal radius',
    /--_bf-chip-radius:\s*var\(--radius-pill\)/.test(componentCss),
    true
  )
  check(
    '  …and that token resolves to the wireframe corner radius',
    semanticMisc.match(/--radius-pill:\s*([^;]+);/)?.[1]?.trim(),
    wfRadius
  )
  /*
   * The one metric deliberately *not* matched: the frozen rule pins a monospace
   * face at a raw rem size. `bf-*` takes the Utopia step instead (BRIEF D5), so
   * the check is that a token step is used and no raw size is hard-coded.
   */
  check(
    'the type step is a token, not a raw size',
    /--_bf-chip-font-size:\s*var\(--size/.test(componentCss),
    true
  )
  /*
   * The `font` **shorthand**, not `font-family` alone (review finding
   * gh#25-P2-1): a `<button>` carries UA `line-height` and font declarations
   * the span/link/anchor branches do not, and only the shorthand resets them
   * all, so that the four modes render as one box. `text-align` is the other
   * UA divergence and is stated explicitly for the same reason.
   */
  check(
    '  …and the face is inherited via the `font` shorthand, not the lo-fi monospace',
    /(^|[^-])font:\s*inherit/m.test(componentCss) && !/monospace/.test(componentCss),
    true
  )
  check(
    '  …so a <button> cannot keep its UA line-height and alignment',
    /font:\s*inherit;[\s\S]{0,200}text-align:\s*center/.test(componentCss),
    true
  )
}

/* ------------------------------------------------------------------ *
 * 5. Colour: no literal, no primitive, semantic tokens only.
 * ------------------------------------------------------------------ */
console.log('\n5. Colour')

check('no colour literal in the component', colourLiterals(code(componentSource)), [])
const probeSource = read(probePath)
check('no colour literal in the probe', colourLiterals(code(probeSource)), [])

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
/*
 * Review finding gh#25-P2-1: the probe was scanned for literals but never for
 * *primitives*, which is how it shipped a `--color-white` while the component's
 * own prose called that out as forbidden. The probe is held to the same bar as
 * the component now.
 */
check(
  'every --color-* the probe uses is a semantic token, never a primitive',
  tokensUsed(code(probeSource)).filter(t => t.startsWith('--color-') && !semanticNames.has(t)),
  []
)
check(
  'the selected state pairs --color-surface-inverse with --color-text-inverse',
  componentColourTokens.includes('--color-surface-inverse')
    && componentColourTokens.includes('--color-text-inverse'),
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
/*
 * The gh#24-P2-1 mirror. Left on `currentcolor`, the selected chip's ring would
 * inherit its light label colour and be painted white on a white page — no
 * visible focus indicator (WCAG 1.4.11). The hook exists so `[data-active]` can
 * re-point it; the probe measures the resulting contrast.
 */
check(
  'a --_bf-chip-focus-color hook exists (the gh#24 focus-ring fix, mirrored)',
  /--_bf-chip-focus-color:\s*currentcolor/.test(componentCss),
  true
)
check(
  '  …and the selected rule re-points it away from currentcolor',
  /\.bf-chip\[data-active\]\s*\{[^}]*--_bf-chip-focus-color:\s*var\(--color-text\)/.test(componentCss),
  true
)
check(
  '  …and the :focus-visible rule reads it rather than currentcolor',
  /:focus-visible\s*\{[^}]*outline:[^;]*var\(--_bf-chip-focus-color\)/.test(componentCss),
  true
)
check(
  'ChipProps is declared in bf-contracts.ts (BRIEF §5 rule 11)',
  /export interface ChipProps/.test(read(contractsPath)),
  true
)
check(
  '  …and imported from there, not re-declared in the component',
  /import type \{ ChipProps \} from '~\/types\/bf-contracts'/.test(componentSource)
    && !/\binterface\s+ChipProps/.test(code(componentSource)),
  true
)
/*
 * Presentational-only (BRIEF D8): props in, one event out.
 */
check(
  'the component reads no content — no queryCollection, no store, no data composable',
  /queryCollection|useState|defineStore|useWfContent|use[A-Z]\w*Content/.test(code(componentSource)),
  false
)

/* ------------------------------------------------------------------ *
 * 6. `@layer components` in the source and in the built CSS.
 * ------------------------------------------------------------------ */
console.log('\n6. Cascade layer survives the build (gh#101 / residual #98)')

check('the component ships @layer components', /@layer components \{/.test(componentSource), true)

if (!existsSync(builtCssDir)) {
  skip('@layer components reaches the emitted stylesheet', 'no .output — run `npx nuxt generate`')
} else {
  /**
   * Every `@layer …{ … }` block removed, brace-matched.
   *
   * The obvious `/@layer components\s*\{[^]*?\.bf-chip/` only proves that an
   * `@layer` opener appears *somewhere before* the selector; it never checks
   * that the block is still open at that point. Deleting the blocks and then
   * looking at what is left is the check that cannot be fooled that way.
   * (Verbatim from `verify-bf-button.ts`.)
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
  const withChip = cssFiles
    .map(f => read(join(builtCssDir, f)))
    .filter(css => css.includes('.bf-chip'))

  check('the component stylesheet was emitted', withChip.length > 0, true)
  check(
    '  …and no .bf-chip rule sits outside a cascade layer',
    withChip.length > 0 && withChip.every(css => !outsideLayers(css).includes('.bf-chip')),
    true
  )
  check(
    '  …with the layer named `components`',
    withChip.length > 0 && withChip.every(css => /@layer\s+components\s*\{/.test(css)),
    true
  )
  check(
    '  …and the selected rule survived into it',
    withChip.length > 0 && withChip.some(css => /\.bf-chip\[data-active\]/.test(css)),
    true
  )
}

/* ------------------------------------------------------------------ *
 * 7. The frozen wireframe sources are byte-identical to the pre-epic base.
 * ------------------------------------------------------------------ */
console.log('\n7. Frozen wireframe sources (BRIEF D2 / DoD-4)')

try {
  git(['cat-file', '-e', `${EPIC_BASE_SHA}^{commit}`])
  const diff = git(['diff', '--stat', EPIC_BASE_SHA, 'HEAD', '--', ...FROZEN_PATHS]).trim()
  check('no frozen wireframe file differs from the pre-epic base', diff, '')
} catch (error) {
  skip('frozen wireframe sources unchanged', `pre-epic base ${EPIC_BASE_SHA.slice(0, 7)} unreachable (${(error as Error).message.split('\n')[0]})`)
}

/* ------------------------------------------------------------------ *
 * 8. The prerendered probe carries all four modes.
 * ------------------------------------------------------------------ */
console.log('\n8. Prerendered probe')

if (!existsSync(builtProbePath)) {
  skip('the probe prerenders all four modes', 'no .output — run `npx nuxt generate`')
} else {
  const html = read(builtProbePath)

  /*
   * Whole tags, not "from `class=` onwards": attribute order in the emitted
   * HTML is the renderer's business. The class is matched as a token rather
   * than as the whole attribute, because `NuxtLink` adds `router-link-active`
   * of its own to the ones pointing at this page.
   */
  const instances = [...html.matchAll(/<(?:a|button|span)\b[^>]*class="[^"]*\bbf-chip\b[^"]*"[^>]*>/g)].map(m => m[0])
  const withEl = (kind: string) => instances.filter(t => t.includes(`data-element="${kind}"`)).length

  /*
   * Bounds and self-consistency, not pinned totals (residual #115). The probe
   * header invites later issues to add instances, and an absolute count breaks
   * on a correct component the moment one does. What is actually load-bearing
   * is that every mode renders at all, and that every rendered chip resolved
   * into exactly one of the four — an unclassified instance means the element
   * resolver fell through, which a pinned total would only catch by accident.
   */
  const modes = { span: withEl('span'), link: withEl('link'), anchor: withEl('anchor'), toggle: withEl('toggle') }
  const classified = modes.span + modes.link + modes.anchor + modes.toggle

  check('every rendered chip resolved into exactly one mode', classified, instances.length)
  check('  …and all four modes render', Object.values(modes).every(n => n >= 1), true)
  check(
    `  …the four modes (span/link/anchor/toggle: ${modes.span}/${modes.link}/${modes.anchor}/${modes.toggle})`,
    instances.length >= 10,
    true
  )
  check(
    '  …[data-external] appears only on <a href> chips',
    instances.filter(t => t.includes('data-external')).every(t => t.includes('data-element="anchor"')),
    true
  )
  check('  …and at least one external anchor carries the marker', instances.filter(t => t.includes('data-external')).length >= 1, true)
  check('  …at least one chip renders selected ([data-active])', instances.filter(t => t.includes('data-active')).length >= 1, true)

  /*
   * `aria-pressed` must be *present* on an unpressed toggle — a toggle button
   * that renders no attribute when off has silently demoted itself to a plain
   * button for assistive technology.
   */
  check('every toggle carries aria-pressed, none of the other modes does', [
    instances.filter(t => t.includes('data-element="toggle"') && t.includes('aria-pressed')).length,
    instances.filter(t => !t.includes('data-element="toggle"') && t.includes('aria-pressed')).length
  ], [modes.toggle, 0])
  check(
    '  …every toggle reads either aria-pressed="true" or "false", never nothing',
    instances.filter(t => /aria-pressed="(?:true|false)"/.test(t)).length,
    modes.toggle
  )
  check(
    '  …and aria-pressed="true" is exactly the set of toggles that are [data-active]',
    [
      instances.filter(t => t.includes('aria-pressed="true"')).every(t => t.includes('data-active')),
      instances.filter(t => t.includes('data-element="toggle"') && t.includes('data-active')).every(t => t.includes('aria-pressed="true"'))
    ],
    [true, true]
  )

  /*
   * The issue's whole subject, asserted against the shipped HTML: the selected
   * state reaches the page as an attribute hook and a stylesheet rule, never as
   * an inline declaration. Exactly one chip carries `style` — the probe's
   * deliberate consumer-override demo.
   */
  const styled = instances.filter(t => /\sstyle="/.test(t))
  check('at least one chip carries a style attribute (the override demo)', styled.length >= 1, true)
  check('  …and every styled chip is a deliberate consumer override, not a selected-state hack', styled.every(t => t.includes('probe-16-override')), true)

  /*
   * The headline precedence rule, asserted against the shipped HTML too
   * (review finding gh#25-P3-9): the instance carrying `to`, `href` AND
   * `toggle` must reach the page as a <button> with no href at all.
   */
  const precedence = instances.find(t => t.includes('probe-16-precedence')) ?? ''
  check('`toggle` + `to` + `href` prerenders as a <button>', /^<button\b/.test(precedence), true)
  check('  …carrying no href', /\shref=/.test(precedence), false)
  check('  …and marked data-element="toggle"', precedence.includes('data-element="toggle"'), true)

  check('the wireframe reference chip prerenders for the metrics check', html.includes('probe-16-wf-chip'), true)

  /*
   * Both verdicts are `pending` in the prerendered HTML by design — the main
   * table's assertions run on mount, and the keyboard panel waits for real key
   * presses. Asserting exactly that and no more: a `fail` baked into the static
   * output would be a real regression, and a `pass` there would mean a
   * three-state verdict had been broken back into two. What this deliberately
   * does **not** claim is that the runtime checks passed; nothing in this
   * process can know that — `scripts/check-probes.ts` (gh#109) is what does,
   * by loading this page in a headless browser.
   */
  const stateOf = (testid: string) =>
    html.match(new RegExp(`data-testid="${testid}"[^>]*data-state="(\\w+)"|data-state="(\\w+)"[^>]*data-testid="${testid}"`))?.slice(1).find(Boolean)

  check('the main verdict cell prerenders in the `pending` state', stateOf('probe-16-verdict'), 'pending')
  check('the keyboard-lab cell prerenders in the `pending` state', stateOf('probe-16-keyboard'), 'pending')
}

/* ------------------------------------------------------------------ */
const status = failures === 0 && skipped === 0 ? 'PASS' : failures === 0 ? 'INCOMPLETE' : 'FAIL'
console.log(`\n${status} — ${failures} failed, ${skipped} skipped`)
process.exit(status === 'PASS' ? 0 : 1)
