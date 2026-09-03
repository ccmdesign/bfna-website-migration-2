/**
 * Acceptance check — issue 21 / gh#30: `bfCardInsight`.
 *
 *   npx tsx scripts/verify-bf-card-insight.ts
 *
 * The vitest substitution. The harness on `dev` is broken and pre-existing
 * (residual #86), and this issue's acceptance must not depend on it, so the
 * equivalent-strength check is this script plus the probe page at
 * `/bf-probe/21-bf-card-insight` under `scripts/check-probes.ts` (gh#109).
 * Same contract and same shape as `verify-bf-chip.ts` / `verify-bf-button.ts`.
 *
 * ## What it actually proves
 *
 * The probe answers the *runtime* questions — the rendered chip set, the
 * conditional `Archive`, the measured no-overflow. This script answers the
 * questions a browser cannot see, and the interesting ones are **relational**,
 * against sources it does not own:
 *
 *  1. **Prop parity with the frozen `wfCardInsight.vue`.** Every prop name and
 *     both defaults are parsed back out of the frozen file and compared, so a
 *     silently renamed prop or a changed `excerptLength` fails here rather
 *     than at a call site in issue 42.
 *  2. **The route delta is the ONLY content delta.** The frozen source links
 *     to `/wireframes/insights/`; this one must link to `/insights/` and must
 *     not mention the wireframe route at all.
 *  3. **Presentational-only (BRIEF D8)** — no `queryCollection`, no
 *     `useAsyncData`, no `useBf*`/`useWf*` composable, no store, in the
 *     **comment-stripped** source. The component's own documentation names all
 *     of those in the course of explaining that it does not call them, so a
 *     naive whole-file `grep` is a check on the prose, not on the code
 *     (residual #115's finding, applied here).
 *  4. **`plain()` is not re-derived** — the helper is retired (issue 10) and
 *     the normaliser already stores plain text.
 *  5. **The wrapper contract**: `inheritAttrs: false` *and* an explicit
 *     `v-bind="$attrs"` on the `bfCard` root. Either without the other is a
 *     bug (attributes applied twice, or not at all), and this is the pattern
 *     #31–#36 copy.
 *  6. **`Insight` comes from `~/types/bf-contracts`** and is not redeclared —
 *     BRIEF §5 rule 11, asserted against the contracts file's own export.
 *  7. **No stylesheet, therefore no new colour and no `:not()`** (BRIEF §5
 *     rule 2; D-20.5's ban on `:not()` with a complex selector, which
 *     `postcss-preset-env` mis-lowers).
 *  8. **The frozen wireframe sources are byte-identical** to the pre-epic base
 *     — compared against the base SHA, not merely against `dev`.
 *  9. The prerendered probe really carries the three real slugs, the `Archive`
 *     chip and the bf-* routes, and its verdict cell prerenders `pending`.
 *
 * Section 9 reads `.output/`. Run `npx nuxt generate` first.
 *
 * ## Exit contract
 *
 * `0` only when every check ran **and** passed. A skipped check exits `1` too,
 * as INCOMPLETE: a skip means a check could not be evaluated, and a
 * verification that quietly downgrades itself to "PASS (7 skipped)" is exactly
 * how a broken component ships green. (gh#23's contract, kept.)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(appRoot, '..')

const componentPath = join(appRoot, 'src/components/bf/CardInsight.vue')
const probePath = join(appRoot, 'src/pages/bf-probe/21-bf-card-insight.vue')
const contractsPath = join(appRoot, 'src/types/bf-contracts.ts')
const basePath = join(appRoot, 'src/components/bf/Card.vue')
const frozenPath = join(appRoot, 'src/components/wireframe/wfCardInsight.vue')
const formatPath = join(appRoot, 'src/utils/format.ts')
const builtProbePath = join(appRoot, '.output/public/bf-probe/21-bf-card-insight/index.html')

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

/** The three real `bfInsights` slugs the probe renders. */
const PROBE_SLUGS = [
  'dual-vocational-training',
  'there-and-back-again',
  'episode-6-the-near-future-of-transatlantic-relations'
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
 * Source with comments removed. Every check below is about what the file
 * *ships*, not what its prose says — and this component's documentation names
 * `queryCollection`, `useAsyncData` and `plain()` precisely in order to say it
 * does not call them. Kept byte-identical to `verify-bf-chip.ts`'s helper; the
 * `[^:]` guard keeps `http://` and `https://` intact.
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

const git = (args: string[]): string =>
  execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

/* ------------------------------------------------------------------ *
 * 1. The spec's own literal acceptance expressions, run as written.
 * ------------------------------------------------------------------ */
console.log('\n1. Spec acceptance expressions')

check('test -f src/components/bf/CardInsight.vue', existsSync(componentPath), true)
check('test -f src/pages/bf-probe/21-bf-card-insight.vue', existsSync(probePath), true)

const componentSource = read(componentPath)
const componentCode = code(componentSource)
const probeSource = read(probePath)

check(
  'grep -q "insight: Insight" src/components/bf/CardInsight.vue',
  /\binsight:\s*Insight\b/.test(componentCode),
  true
)

/*
 * The spec writes `grep -Lq "plain("` over the whole file. Run that way it is a
 * check on the documentation — which names the retired helper in order to say
 * it is not called — so it runs over the comment-stripped source instead, the
 * deviation residual #115 already resolved for `verify-bf-chip.ts`'s
 * `:style=` check. Noted here rather than left for a reader to notice.
 */
check('grep -c "plain(" src/components/bf/CardInsight.vue (code only) == 0',
  (componentCode.match(/\bplain\s*\(/g) ?? []).length, 0)

/* ------------------------------------------------------------------ *
 * 2. Prop parity with the frozen wfCardInsight.vue.
 * ------------------------------------------------------------------ */
console.log('\n2. Prop parity with the frozen source')

if (!existsSync(frozenPath)) {
  skip('prop parity with wfCardInsight.vue', 'frozen source missing')
} else {
  const frozen = read(frozenPath)

  /*
   * Prop names, parsed out of each file's own props type. The `interface Props`
   * arm accepts an `extends` clause: since gh#31 the bf-* wrapper extends the
   * shared `CardWrapperProps` (#128), and a regex that silently failed to match
   * would report *no* props rather than a mismatch — a check that passes by
   * finding nothing is worse than one that fails.
   */
  const propNames = (source: string): string[] => {
    const block = source.match(/defineProps<\s*\{([\s\S]*?)\}\s*>|interface Props\b[^{]*\{([\s\S]*?)\n\}/)
    const body = block?.[1] ?? block?.[2] ?? ''
    return [...body.matchAll(/^\s*(\w+)\??\s*:/gm)].map(m => m[1]!).sort()
  }

  /**
   * The props the shared card-wrapper contract contributes — added across the
   * whole wrapper family in gh#31 (residual #128) because heading level is a
   * function of the page outline rather than of the component.
   *
   * They arrive by **extending** `CardWrapperProps`, not by being written into
   * this component's own `Props` body, which is why the parity row below still
   * compares equal to the frozen four: the two are checked separately, so a
   * prop declared inline here would still fail parity while the shared one is
   * asserted at its real source.
   */
  const SHARED_WRAPPER_PROPS = ['headingLevel']

  const frozenProps = propNames(frozen)
  const bfProps = propNames(componentSource)

  check('every wf-* prop name survives, none added inline', bfProps, frozenProps)
  check('  …and there really were props to compare', frozenProps.length, 4)
  check('  …which came from a props block that actually parsed',
    bfProps.includes('insight'), true)

  /*
   * The shared half, asserted at its source rather than by counting names the
   * `Props` body does not contain: the interface extends the shared contract,
   * the contract is imported from the one module BRIEF §5 rule 11 allows, and
   * the contract really declares what this file relies on.
   */
  check('the wrapper extends the shared CardWrapperProps (#128)',
    /interface Props extends CardWrapperProps\b/.test(componentCode), true)
  check('  …imported from ~/types/bf-contracts, not redeclared',
    /import type \{[^}]*\bCardWrapperProps\b[^}]*\} from '~\/types\/bf-contracts'/.test(componentCode),
    true)
  check('  …and that module declares exactly the shared props it promises',
    SHARED_WRAPPER_PROPS.filter(name =>
      new RegExp(`interface CardWrapperProps[\\s\\S]*?\\b${name}\\?:`).test(read(contractsPath))),
    SHARED_WRAPPER_PROPS)
  check('  …with no shared prop redeclared inline on the wrapper',
    bfProps.filter(name => SHARED_WRAPPER_PROPS.includes(name)), [])

  /*
   * Defaults, parsed out of each file's `withDefaults` call. Written to accept
   * both spellings of the props type — the frozen file passes an inline type
   * literal to `defineProps`, the bf-* one names a documented `Props`
   * interface — because the shapes must agree and the syntax need not.
   *
   * Run over the **comment-stripped** source (residual #115's rule, applied
   * here too): the bf-* file documents its defaults inside the object literal,
   * and a `word: value` pair in prose would otherwise be parsed as a default.
   */
  const defaults = (source: string): string => {
    const block = source.match(/withDefaults\(\s*defineProps<[\s\S]*?>\(\)\s*,\s*\{([\s\S]*?)\}\s*\)/)
    return [...(block?.[1] ?? '').matchAll(/(\w+)\s*:\s*([^,\n]+)/g)]
      .map(m => `${m[1]}=${m[2]!.trim()}`)
      .filter(entry => !entry.endsWith('=undefined'))
      .filter(entry => !SHARED_WRAPPER_PROPS.some(name => entry.startsWith(`${name}=`)))
      .sort()
      .join(' ')
  }

  check('excerpt/excerptLength defaults match the frozen source',
    defaults(componentCode), defaults(code(frozen)))
  check('  …and those defaults are the documented ones',
    defaults(componentCode), 'excerpt=true excerptLength=140')
  check('the shared headingLevel default is the no-change value, 3',
    /headingLevel:\s*3\b/.test(componentCode), true)

  /* The truncation arithmetic, minus the retired `plain()` call. */
  check('the truncation arithmetic is the frozen one (slice/trimEnd/…)',
    /slice\(0,\s*props\.excerptLength\)\.trimEnd\(\)\s*\+\s*'…'/.test(componentCode),
    /slice\(0,\s*props\.excerptLength\)\.trimEnd\(\)\s*\+\s*'…'/.test(code(frozen)))

  /* ---------------------------------------------------------------- *
   * 3. The route delta is the only content delta.
   * ---------------------------------------------------------------- */
  console.log('\n3. The one deliberate content delta')

  check('the frozen source really links into /wireframes/insights/',
    code(frozen).includes('/wireframes/insights/'), true)
  check('the bf-* component links to /insights/${insight.slug}',
    /`\/insights\/\$\{insight\.slug\}`/.test(componentCode), true)
  check('  …and mentions no /wireframes/ route at all',
    componentCode.includes('/wireframes'), false)
  check('  …and reuses no frozen wf-* class',
    /\bwf-[a-z]/.test(componentCode), false)
}

/* ------------------------------------------------------------------ *
 * 4. Presentational-only (BRIEF D8).
 * ------------------------------------------------------------------ */
console.log('\n4. Presentational-only')

const forbidden = [
  'queryCollection',
  'useAsyncData',
  'useFetch',
  'useWfContent',
  'useBfInsights',
  'defineStore',
  'usePinia',
  '$fetch'
]

for (const needle of forbidden) {
  check(`the component calls no ${needle}`, componentCode.includes(needle), false)
}

/*
 * The other half of the same rule, and the reason it is worth stating twice:
 * the *probe* is allowed to query, and does. If it did not, the component's
 * "renders a real row" acceptance would be met by a literal in a page.
 */
check('the probe page DOES query the real collection', code(probeSource).includes('queryCollection'), true)
for (const slug of PROBE_SLUGS) {
  check(`  …for the real slug ${slug}`, probeSource.includes(slug), true)
}

/* ------------------------------------------------------------------ *
 * 5. The wrapper contract — the pattern #31–#36 copy.
 * ------------------------------------------------------------------ */
console.log('\n5. The wrapper contract')

check('inheritAttrs: false', /inheritAttrs:\s*false/.test(componentCode), true)
check('  …paired with an explicit v-bind="$attrs" on the base',
  /<bfCard\s+v-bind="\$attrs"/.test(componentCode), true)
/*
 * The first tag inside `<template>` is `<bfCard>` — the wrapper renders the
 * base as its own root rather than nesting it in a `<div>` of its own, which
 * is what makes a caller's `class` land on the `<li>` a grid actually lays out.
 */
check('the root element of the template is bfCard, not a div of its own',
  componentCode.match(/<template>\s*(<[\w-]+)/)?.[1], '<bfCard')
check('the base it wraps exists', existsSync(basePath), true)
check('bfTime replaces the wireframe\'s attribute-less <time>',
  /<bfTime\s+:date="insight\.publish_date"/.test(componentCode), true)
check('bfChip replaces the wireframe\'s <span class="wf-chip">',
  (componentCode.match(/<bfChip\b/g) ?? []).length, 3)
check('the Archive chip is conditional on insight.archived',
  /<bfChip\s+v-if="insight\.archived">Archive<\/bfChip>/.test(componentCode), true)

/*
 * The two gh#31 retrofits, pinned in the source as well as in probe 21's
 * runtime rows — a source check catches a regression that deletes the feature
 * outright, where the probe catches one that keeps it and breaks it.
 */
check('the heading level comes from headingLevel, not a hard-coded <h3> (#128)',
  /<component\s+:is="`h\$\{headingLevel\}`"/.test(componentCode), true)
check('  …and no literal <h3> survives in the template',
  /<h3[\s>]/.test(componentCode), false)
check('a blank heading renders no heading element and no link (#130)',
  /<component[^>]*\bv-if="hasHeading"/.test(componentCode), true)
check('  …with the dev-time warning that names the defect',
  /import\.meta\.dev/.test(componentCode) && /console\.warn/.test(componentCode), true)

/* ------------------------------------------------------------------ *
 * 6. Shared types live in bf-contracts (BRIEF §5 rule 11).
 * ------------------------------------------------------------------ */
console.log('\n6. Types')

check('Insight is imported from ~/types/bf-contracts',
  /import type \{[^}]*\bInsight\b[^}]*\} from '~\/types\/bf-contracts'/.test(componentCode), true)
check('  …and that module really exports it',
  /export type Insight\b/.test(read(contractsPath)), true)
check('the component redeclares no shared entity type',
  /(?:interface|type)\s+Insight\b/.test(componentCode), false)
check('formatLabel is imported from utils/format, not re-derived',
  /import \{ formatLabel \} from '~\/utils\/format'/.test(componentCode), true)
check('  …and that module really exports it',
  /export function formatLabel\b/.test(read(formatPath)), true)
check('FORMAT_LABELS is not copied into the component',
  componentCode.includes('FORMAT_LABELS'), false)

/* ------------------------------------------------------------------ *
 * 7. No stylesheet — therefore no new colour and no banned construct.
 * ------------------------------------------------------------------ */
console.log('\n7. Styling')

/*
 * Comment-stripped, like every other source check here: the component's own
 * documentation says the words "ships no `<style>` block", and a whole-file
 * scan would fail on prose telling the truth.
 */
check('the wrapper ships no <style> block at all',
  /<style[\s>]/.test(componentCode), false)
check('  …so it declares no colour literal (BRIEF §5 rule 2)',
  colourLiterals(componentCode), [])
check('  …and no :not() to be mis-lowered (D-20.5)',
  componentCode.includes(':not('), false)
check('the probe declares no :not() either (D-20.5)',
  code(probeSource).includes(':not('), false)
check('the probe declares no colour literal',
  colourLiterals(code(probeSource)), [])

/* ------------------------------------------------------------------ *
 * 8. The frozen wireframe sources are byte-identical to the pre-epic base.
 * ------------------------------------------------------------------ */
console.log('\n8. Frozen wireframe sources (BRIEF D2 / DoD-4)')

try {
  git(['cat-file', '-e', `${EPIC_BASE_SHA}^{commit}`])
  const diff = git(['diff', '--stat', EPIC_BASE_SHA, 'HEAD', '--', ...FROZEN_PATHS]).trim()
  check('no frozen wireframe file differs from the pre-epic base', diff, '')
} catch (error) {
  skip('frozen wireframe sources unchanged', `pre-epic base ${EPIC_BASE_SHA.slice(0, 7)} unreachable (${(error as Error).message.split('\n')[0]})`)
}

/* ------------------------------------------------------------------ *
 * 9. The prerendered probe.
 * ------------------------------------------------------------------ */
console.log('\n9. Prerendered probe')

if (!existsSync(builtProbePath)) {
  skip('the probe prerenders the real rows', 'no .output — run `npx nuxt generate`')
} else {
  const html = read(builtProbePath)

  check('the probe carries the conditional Archive chip', html.includes('>Archive<'), true)
  for (const slug of PROBE_SLUGS) {
    check(`  …and links to /insights/${slug}`, html.includes(`/insights/${slug}`), true)
  }
  check('no card links into the frozen /wireframes/ route',
    /href="\/wireframes/.test(html), false)
  check('the harness root convention is present (#109)',
    /data-probe="21"[^>]*data-probe-verdict=|data-probe-verdict=[^>]*data-probe="21"/.test(html), true)

  /*
   * `pending` in the prerendered HTML by design — the assertions run on mount.
   * A `fail` baked into static output would be a real regression, and a `pass`
   * there would mean the three-state verdict had been broken back into two.
   * What this deliberately does not claim is that the runtime checks passed;
   * `scripts/check-probes.ts` is what knows that.
   */
  const state = html.match(/data-testid="probe-21-verdict"[^>]*data-state="(\w+)"|data-state="(\w+)"[^>]*data-testid="probe-21-verdict"/)?.slice(1).find(Boolean)
  check('the verdict cell prerenders in the `pending` state', state, 'pending')
}

/* ------------------------------------------------------------------ */
const status = failures === 0 && skipped === 0 ? 'PASS' : failures === 0 ? 'INCOMPLETE' : 'FAIL'
console.log(`\n${status} — ${failures} failed, ${skipped} skipped`)
process.exit(status === 'PASS' ? 0 : 1)
