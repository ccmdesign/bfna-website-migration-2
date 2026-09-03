<script setup lang="ts">
/**
 * Probe — issue 43 / gh#52: `bfSearchShell`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue (#68) removes
 * `bf-probe/`.
 *
 * ## What it proves
 *
 * 1. **The fixture set renders.** One row per `results` entry, in the order
 *    given, each an `<li>` inside a real `<ol>` — the ranking *is* the order,
 *    which a `<ul>` would throw away — carrying its chip, its linked heading
 *    and its rank/percentage label.
 * 2. **The meter is driven by the custom property, not by an inline width.**
 *    Two rows with different scores measure different bar widths, the widths
 *    are the frozen source's own arithmetic (`max(6, pct * 1.6)` px), and
 *    neither the meter nor the bar carries an inline `width` declaration —
 *    which is the entire point of the port (spec § Scope; the `bfMedia` lesson
 *    from gh#26: an inline `width` is un-outrankable by any author rule).
 * 3. **`update:query` is debounced.** Three synthetic input events inside one
 *    250 ms window emit **nothing** at first and then **exactly one** event
 *    carrying the final value. A second shell with `debounce-ms="0"` emits
 *    three, synchronously — so the assertion is about the debounce and not
 *    about the harness being slow.
 * 4. **The draft resynchronises to the prop.** An external change to `query`
 *    (a cleared search, a restored `?q=`) reaches the input, while the page
 *    echoing our own emit back does not.
 * 5. **`update:selectedFilters` fires on a facet click,** with the new array,
 *    forwarded from `bfFilterBar` unchanged.
 * 6. **The empty state appears at zero results and not otherwise,** measured
 *    with `checkVisibility()` (D-31.6 — Chrome hides closed `<details>` with
 *    `content-visibility`, so a bounding rect is not the question to ask).
 * 7. **The count line is a persistently rendered live region** (residual
 *    #169): `role="status"` is in the DOM in *both* states, with different
 *    text, rather than being inserted already containing its message.
 * 8. **The search control is a real labelled control with a focus ring.**
 *    <kbd>Tab</kbd> is dispatched by the harness as trusted input (gh#28) and
 *    must land on the `<input type="search">`; its accessible name must come
 *    from a `<label for>`; and `:focus-visible` must resolve to a non-zero
 *    `outline-width` — residual #157's ring, which `bfFormField` declares at
 *    source and this asserts on the rendered control rather than trusting.
 * 9. **The bar's rule lives in `@layer components`,** read from the live
 *    CSSOM, so a `postcss-preset-env` layer regression fails a row.
 * 10. **No data access.** The shell renders exactly the rows it was handed and
 *    invents none; the source-level grep for `queryCollection` /
 *    `useWfContent` is the acceptance command's half of the same claim.
 *
 * ## Why the typing is synthetic and the Tab is not
 *
 * The harness's CDP key map (`docs/decisions/probe-harness.md` § Decision 4)
 * carries `Tab`, `Enter`, `Escape`, `Space`, the arrows and `Home`/`End` — no
 * character keys, by design. Question 8 is about the browser's own sequential
 * focus navigation, which only a trusted `Tab` can answer, so it uses the
 * harness. Question 3 is about a `setTimeout` in this component's own handler,
 * which a synthetic `input` event reaches through exactly the same code path
 * (`bfFormField` reads `event.target.value` and emits); a trusted keystroke
 * would prove nothing extra and cannot be sent. Both choices are the smallest
 * tool that answers the actual question.
 *
 * ## DOM order is load-bearing
 *
 * The lab shell is the **first focusable thing on the page**, because § 1's
 * first assertion is that Tab lands on its search control. Nothing focusable
 * may be added above it. The `<h1>` carries `tabindex="-1"` so the script can
 * focus and release it just before the handshake, pinning Chrome's sequential
 * focus navigation starting point above the lab (the gh#39 lesson).
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 43`,
 * per the gh#20–#51 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
import type { Filter, SearchResultRow } from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe43BfSearchShell' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 43 — bfSearchShell'
})

/* --- fixtures ------------------------------------------------------------ */

/**
 * Three rows, deliberately covering all three optional-field combinations the
 * projection allows: a dated insight, an undated project, and a dated,
 * archived insight. Scores are the *normalised* 0–1 values issue 54's page
 * will hand over (`r.score / topScore`), not raw ranking output.
 *
 * The facets below are the frozen `pages/wireframes/search.vue:77-82`
 * `FORMATS` array, copied by value — the wireframe layer is a specification,
 * not a dependency (BRIEF D2).
 */
const RESULTS: SearchResultRow[] = [
  {
    slug: 'how-do-we-fix-democracy',
    heading: 'How do we fix democracy?',
    to: '/insights/how-do-we-fix-democracy',
    chip: 'Article',
    date: '2024-05-14',
    score: 1
  },
  {
    slug: 'the-transponder',
    heading: 'The Transponder',
    to: '/projects/the-transponder',
    chip: 'Initiative',
    score: 0.5
  },
  {
    slug: 'an-older-report',
    heading: 'An older report, since archived',
    to: '/insights/an-older-report',
    chip: 'Report',
    archived: true,
    date: '2019-11-02',
    score: 0.125
  }
]

const FORMATS: Filter[] = [
  { key: 'article', label: 'Articles' },
  { key: 'report', label: 'Reports' },
  { key: 'video', label: 'Videos' },
  { key: 'infographic', label: 'Infographics' }
]

/** The widths the frozen arithmetic must produce, in px, in fixture order. */
const EXPECTED_WIDTHS = ['160px', '80px', '20.8px']

/* --- § 1–§ 4: the lab shell ---------------------------------------------- */

const labQuery = ref('')
const labSelected = ref<string[]>([])

/** Every `update:query` this page received from the lab shell, in order. */
const queryEmits: string[] = []
/** Every `update:selectedFilters` it received, as joined keys. */
const filterEmits: string[] = []

const onLabQuery = (value: string): void => {
  queryEmits.push(value)
  /* A real consumer: the page owns the value and echoes it back. */
  labQuery.value = value
}

const onLabFilters = (value: string[]): void => {
  filterEmits.push(value.join(','))
  labSelected.value = value
}

/* --- § 3b: the undebounced shell ----------------------------------------- */

const instantQuery = ref('')
const instantEmits: string[] = []

const onInstantQuery = (value: string): void => {
  instantEmits.push(value)
  instantQuery.value = value
}

/* --- § 6: the empty shell ------------------------------------------------ */

const emptyQuery = ref('nothing at all matches this')

/* --- harness plumbing ---------------------------------------------------- */

interface Check {
  label: string
  expected: string | number
  actual: string | number
}

const checks = ref<Check[]>([])

/** Published only once every listener is attached — the gh#28 handshake. */
const armed = ref(false)

const root = ref<HTMLElement | null>(null)
const heading = ref<HTMLElement | null>(null)

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const shellOf = (name: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-probe-shell="${name}"]`)

const inputOf = (name: string): HTMLInputElement | null =>
  shellOf(name)?.querySelector<HTMLInputElement>('input[type="search"]') ?? null

const rowsOf = (name: string): HTMLElement[] =>
  Array.from(shellOf(name)?.querySelectorAll<HTMLElement>('[data-bf-search-shell="row"]') ?? [])

/**
 * Drive the control the way a keystroke does — `bfFormField` reads
 * `event.target.value` and emits `update:modelValue`, so a synthetic `input`
 * event reaches this component's debounce through the real code path. See the
 * block comment for why this is not a harness keystroke.
 */
const typeInto = async (input: HTMLInputElement, value: string): Promise<void> => {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

/**
 * Walk every reachable stylesheet — `@import`ed ones included, since
 * `/css/styles.css` is nothing but a list of imports — for a style rule whose
 * selector matches `pattern` and whose ancestry includes a `@layer components`
 * block. Cross-origin sheets throw on `cssRules`; they are skipped, not
 * failed, so the Google Fonts link does not sink the check. (Same helper as
 * probes 14–18, 28–30 and 42.)
 */
const layeredRuleFound = (pattern: RegExp): boolean => {
  const LAYER_BLOCK = globalThis.CSSLayerBlockRule
  if (!LAYER_BLOCK) return false

  const walk = (rules: CSSRuleList, insideComponents: boolean): boolean => {
    for (const rule of Array.from(rules)) {
      const nowInside =
        insideComponents
        || (rule instanceof LAYER_BLOCK && (rule as CSSLayerBlockRule).name === 'components')

      if (nowInside && rule instanceof CSSStyleRule && pattern.test(rule.selectorText)) {
        return true
      }

      if (rule instanceof CSSImportRule) {
        try {
          const imported = rule.styleSheet?.cssRules
          if (imported && walk(imported, nowInside)) return true
        } catch {
          // Cross-origin import target — unreadable, not a failure.
        }
        continue
      }

      const nested = (rule as CSSGroupingRule).cssRules
      if (nested && walk(nested, nowInside)) return true
    }
    return false
  }

  return Array.from(document.styleSheets).some(sheet => {
    try {
      return walk(sheet.cssRules, false)
    } catch {
      return false
    }
  })
}

/** The accessible name of a control, by the `<label for>` route only. */
const labelTextFor = (input: HTMLInputElement | null): string => {
  if (!input?.id) return 'no id'
  const label = document.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`)
  return label?.textContent?.trim() ?? 'no label'
}

const visible = (el: Element | null): boolean =>
  Boolean(el && (el as HTMLElement).checkVisibility?.())

/* --- the run ------------------------------------------------------------- */

/** Where the harness's trusted Tab landed, recorded before anything else. */
let tabLanded = 'not run'
let tabOutlineWidth = 'not run'

const finalise = async (): Promise<void> => {
  const active = document.activeElement as HTMLElement | null
  const labInput = inputOf('lab')

  tabLanded = active === labInput ? 'search input' : (active?.tagName.toLowerCase() ?? 'nothing')
  tabOutlineWidth = active ? getComputedStyle(active).outlineWidth : 'no element'

  /* --------------------------------------------------------------------
   * § 3 — the debounce. Three input events inside one window.
   * ------------------------------------------------------------------ */
  let emitsDuringBurst = -1
  let emitsAfterWindow = -1
  let valueAfterWindow = 'not run'

  if (labInput) {
    await typeInto(labInput, 'demo')
    await typeInto(labInput, 'democ')
    await typeInto(labInput, 'democracy')
    emitsDuringBurst = queryEmits.length

    /* Comfortably past the 250 ms default, and the only wait on the page. */
    await wait(450)
    emitsAfterWindow = queryEmits.length
    valueAfterWindow = queryEmits[queryEmits.length - 1] ?? 'nothing emitted'
  }

  /* --------------------------------------------------------------------
   * § 3b — `debounce-ms="0"` emits synchronously, once per event.
   * ------------------------------------------------------------------ */
  let instantCount = -1
  const instantInput = inputOf('instant')
  if (instantInput) {
    await typeInto(instantInput, 'a')
    await typeInto(instantInput, 'ab')
    await typeInto(instantInput, 'abc')
    instantCount = instantEmits.length
  }

  /* --------------------------------------------------------------------
   * § 4 — an external change to `query` reaches the input; our own echo,
   * already applied above, did not reset the caret.
   * ------------------------------------------------------------------ */
  labQuery.value = 'set from outside'
  await nextTick()
  const afterExternal = inputOf('lab')?.value ?? 'no input'

  /* --------------------------------------------------------------------
   * § 5 — a facet click emits the new array.
   * ------------------------------------------------------------------ */
  let facetEmit = 'not run'
  const firstChip = shellOf('lab')?.querySelector<HTMLElement>('[data-filter-key="report"]')
  if (firstChip) {
    firstChip.click()
    await nextTick()
    facetEmit = filterEmits[filterEmits.length - 1] ?? 'nothing emitted'
  }

  /* --------------------------------------------------------------------
   * § 2 — the meter.
   * ------------------------------------------------------------------ */
  const labRows = rowsOf('lab')
  const bars = labRows.map(r => r.querySelector<HTMLElement>('[data-bf-search-shell="bar"]'))
  /**
   * Rounded to one decimal before comparison. Chrome resolves a used
   * `inline-size` at layout precision, so `20.8px` comes back as
   * `20.7969px` — a sub-pixel artefact of the layout engine, not a fact about
   * the arithmetic under test. The same reasoning as the harness's own ±1px
   * grid tolerance (docs/decisions/probe-harness.md § Consequences): a check
   * that fails on a correct component is not a check.
   */
  const roundPx = (value: string): string => {
    const n = Number.parseFloat(value)
    return Number.isNaN(n) ? value : `${Math.round(n * 10) / 10}px`
  }

  const widths = bars.map(b => (b ? roundPx(getComputedStyle(b).inlineSize) : 'no bar'))
  const meters = labRows.map(r => r.querySelector<HTMLElement>('[data-bf-search-shell="meter"]'))

  const inlineWidthDeclarations = [...meters, ...bars].filter(
    el => Boolean(el?.style.width)
  ).length

  const customPropertiesSet = meters.filter(
    m => Boolean(m?.style.getPropertyValue('--_bf-search-shell-meter-width'))
  ).length

  /* --------------------------------------------------------------------
   * § 6/§ 7 — the empty state and the live regions.
   * ------------------------------------------------------------------ */
  const labEmpty = shellOf('lab')?.querySelector('[data-bf-search-shell="empty"]') ?? null
  const emptyEmpty = shellOf('empty')?.querySelector('[data-bf-search-shell="empty"]') ?? null
  const labCount = shellOf('lab')?.querySelector('[data-bf-search-shell="count"]') ?? null
  const emptyCount = shellOf('empty')?.querySelector('[data-bf-search-shell="count"]') ?? null

  checks.value = [
    /* § 1 — the control */
    { label: '§1 trusted Tab lands on the search input', expected: 'search input', actual: tabLanded },
    { label: '§1 the focused control has a :focus-visible outline (#157)', expected: 'non-zero', actual: tabOutlineWidth === '0px' || tabOutlineWidth === 'no element' ? tabOutlineWidth : 'non-zero' },
    { label: '§1 the control is named by a <label for>', expected: 'Semantic search', actual: labelTextFor(labInput) },
    { label: '§1 the control is type="search"', expected: 'search', actual: labInput?.type ?? 'no input' },

    /* § 2 — the meter */
    { label: '§2 one row per fixture result', expected: RESULTS.length, actual: labRows.length },
    { label: '§2 the rows are <li> inside an <ol>', expected: 'li|OL', actual: `${labRows[0]?.tagName.toLowerCase() ?? '?'}|${labRows[0]?.parentElement?.tagName ?? '?'}` },
    { label: '§2 bar widths follow max(6, pct * 1.6)px', expected: EXPECTED_WIDTHS.join(','), actual: widths.join(',') },
    { label: '§2 two different scores measure different widths', expected: 'true', actual: String(widths[0] !== widths[1]) },
    { label: '§2 every meter sets --_bf-search-shell-meter-width inline', expected: RESULTS.length, actual: customPropertiesSet },
    { label: '§2 no inline width: declaration anywhere in the meter', expected: 0, actual: inlineWidthDeclarations },
    { label: '§2 the bar rule is inside @layer components', expected: 'true', actual: String(layeredRuleFound(/\.bf-search-shell__bar(?![\w-])/)) },
    { label: '§2 the archived row renders its Archive chip', expected: 'true', actual: String((labRows[2]?.textContent ?? '').includes('Archive')) },
    { label: '§2 the rank label reads #1 · 100%', expected: '#1 · 100%', actual: labRows[0]?.querySelector('.bf-search-shell__rank')?.textContent?.trim() ?? 'missing' },

    /* § 3 — the debounce */
    { label: '§3 nothing is emitted during the burst', expected: 0, actual: emitsDuringBurst },
    { label: '§3 exactly one emit after the window', expected: 1, actual: emitsAfterWindow },
    { label: '§3 and it carries the final value', expected: 'democracy', actual: valueAfterWindow },
    { label: '§3b debounce-ms="0" emits once per input event', expected: 3, actual: instantCount },

    /* § 4 — the resync */
    { label: '§4 an external query change reaches the input', expected: 'set from outside', actual: afterExternal },

    /* § 5 — the facets */
    { label: '§5 a facet click emits update:selectedFilters', expected: 'report', actual: facetEmit },

    /* § 6 — the empty state */
    { label: '§6 no empty state while there are results', expected: 'false', actual: String(labEmpty !== null) },
    { label: '§6 the empty state is visible at zero results', expected: 'true', actual: String(visible(emptyEmpty)) },
    { label: '§6 and it reads "No results"', expected: 'No results', actual: emptyEmpty?.querySelector('h1')?.textContent?.trim() ?? 'missing' },
    { label: '§6 no results list rendered at zero results', expected: 0, actual: rowsOf('empty').length },

    /* § 7 — the live region (#169) */
    { label: '§7 the count line is role="status" with results', expected: 'status', actual: labCount?.getAttribute('role') ?? 'missing' },
    { label: '§7 …and is still present at zero results', expected: 'status', actual: emptyCount?.getAttribute('role') ?? 'missing' },
    { label: '§7 the zero-results count line reads 0 results', expected: 'true', actual: String((emptyCount?.textContent ?? '').includes('0 results for')) },

    /* § 10 — no data access */
    { label: '§10 the shell invents no rows of its own', expected: RESULTS.length, actual: labRows.length }
  ]
}

onMounted(async () => {
  await nextTick()

  document.addEventListener('keyup', event => {
    if (event.key === 'Tab') void finalise()
  })

  /*
   * State the sequential focus navigation starting point rather than rely on
   * it (the gh#39 lesson): focus and immediately release the heading, which is
   * above the lab and not itself tabbable.
   */
  heading.value?.focus()
  heading.value?.blur()

  /* Only now — with the listener attached — ask for the key. */
  armed.value = true
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states, not two. The assertions need a keyboard, so before one arrives
 * the honest answer is `pending` — the prerendered HTML has run nothing, and
 * baking `FAIL` into it would read as a regression to the next issue that
 * greps the file. The harness treats a probe still PENDING at timeout as a
 * failure, never a skip.
 */
const state = computed<'pending' | 'pass' | 'fail'>(() => {
  if (checks.value.length === 0) return 'pending'
  return passed.value === checks.value.length ? 'pass' : 'fail'
})

const verdict = computed(() =>
  state.value === 'pending'
    ? 'PENDING — press Tab (the harness does this for you)'
    : `${state.value === 'pass' ? 'PASS' : 'FAIL'} — ${passed.value}/${checks.value.length} checks`
)
</script>

<template>
  <!--
    Harness contract (docs/decisions/probe-harness.md): the root carries
    `data-probe` + `data-probe-verdict`, and every check row carries
    `data-probe-row` + `data-ok`, so `scripts/check-probes.ts` fails the build
    on a red probe instead of relying on someone opening the page.

    `data-probe-keys` is bound rather than written, so it appears only after
    `onMounted` has attached the listener — the gh#28 handshake.
  -->
  <main
    ref="root"
    class="probe container"
    data-probe="43"
    :data-probe-verdict="state.toUpperCase()"
    :data-probe-keys="armed ? 'Tab' : undefined"
  >
    <h1 ref="heading" tabindex="-1">Probe 43 — <code>bfSearchShell</code></h1>
    <p class="probe__lede">
      The search page's four moving parts as one props-in/events-out organism:
      a labelled <code>&lt;input type="search"&gt;</code> that emits
      <code>update:query</code> <em>debounced</em>, a facet row that emits
      <code>update:selectedFilters</code>, a count line, a ranked
      <code>&lt;ol&gt;</code> of rows each with a relevance meter, and an empty
      state. It computes none of it — ranking, indexing and
      <code>topScore</code> normalisation belong to issue 54.
    </p>

    <!--
      § 1 FIRST IN THE DOM, and deliberately so: the first assertion is that
      the harness's trusted Tab lands on this shell's search control, which is
      only meaningful if nothing focusable precedes it. Do not add a link, a
      button or a tabbable element above this section.
    -->
    <section aria-labelledby="lab-heading">
      <h2 id="lab-heading">§ 1–§ 5, § 7 — the lab shell</h2>
      <p class="probe__lede">
        Three fixture rows with scores <code>1</code>, <code>0.5</code> and
        <code>0.125</code>; the frozen <code>search.vue</code>'s own four format
        facets. <kbd>Tab</kbd> must land on the search control, three input
        events inside one 250&nbsp;ms window must emit exactly one
        <code>update:query</code>, and a facet click must emit the new array.
      </p>

      <bfSearchShell
        data-probe-shell="lab"
        :query="labQuery"
        :filters="FORMATS"
        :selected-filters="labSelected"
        :results="RESULTS"
        :result-count="412"
        @update:query="onLabQuery"
        @update:selected-filters="onLabFilters"
      />

      <p class="probe__note">
        <code>query</code> now: <code>{{ labQuery || '(empty)' }}</code> ·
        selection: <code>[{{ labSelected.join(', ') }}]</code>
      </p>
    </section>

    <section aria-labelledby="instant-heading">
      <h2 id="instant-heading">§ 3b — <code>debounce-ms="0"</code></h2>
      <p class="probe__lede">
        The same component with the timer turned off: every input event emits,
        synchronously. Present so that § 3's "exactly one" is an assertion about
        the debounce rather than about the harness being slow.
      </p>

      <bfSearchShell
        data-probe-shell="instant"
        :query="instantQuery"
        :filters="[]"
        :selected-filters="[]"
        :results="RESULTS"
        :result-count="RESULTS.length"
        :debounce-ms="0"
        label="Search (no debounce)"
        @update:query="onInstantQuery"
      />
    </section>

    <section aria-labelledby="empty-heading">
      <h2 id="empty-heading">§ 6 — zero results</h2>
      <p class="probe__lede">
        No rows, no list — and the count line is still in the DOM, because a
        live region inserted already containing its message is not reliably
        announced (residual #169). It reads <code>0 results for …</code>, which
        is the announcement; <code>bfEmptyState</code> sits outside it as
        ordinary page content.
      </p>

      <bfSearchShell
        data-probe-shell="empty"
        :query="emptyQuery"
        :filters="FORMATS"
        :selected-filters="[]"
        :results="[]"
        :result-count="0"
        label="Search (no matches)"
      />
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-43-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-43-table">
      <thead>
        <tr>
          <th scope="col">Check</th>
          <th scope="col">Expected</th>
          <th scope="col">Actual</th>
          <th scope="col">Result</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="c in checks"
          :key="c.label"
          :data-state="String(c.actual) === String(c.expected) ? 'pass' : 'fail'"
          :data-probe-row="c.label"
          :data-ok="String(c.actual) === String(c.expected) ? 'true' : 'false'"
        >
          <td>{{ c.label }}</td>
          <td><code>{{ c.expected }}</code></td>
          <td><code>{{ c.actual }}</code></td>
          <td>{{ String(c.actual) === String(c.expected) ? 'pass' : 'fail' }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
/*
  The ground is the `bf-probe` layout's job (gh#116): it paints `html` from
  `--color-surface-page` / `--color-text` and pins `color-scheme: light`.

  No `:not()` here or anywhere in this file — D-20.5 (gh#29).
*/

.probe {
  padding-block: var(--space-l, 2rem);
  min-block-size: 100dvh;
}

.probe__lede {
  max-inline-size: 75ch;
}

.probe__note {
  font-size: 0.875rem;
  margin-block: var(--space-3xs, 0.25rem) var(--space-s, 1rem);
}

.probe__verdict {
  font-weight: 700;
}

.probe__verdict[data-state='fail'] {
  color: var(--color-error);
}

.probe__verdict[data-state='pending'] {
  font-weight: 400;
  font-style: italic;
}

.probe__table {
  border-collapse: collapse;
  inline-size: 100%;
  margin-block-end: var(--space-m, 1.5rem);
}

.probe__table th,
.probe__table td {
  border-block-end: 1px solid currentcolor;
  padding: 0.25rem 0.75rem 0.25rem 0;
  text-align: start;
  vertical-align: top;
}

.probe__table tr[data-state='fail'] {
  color: var(--color-error);
}
</style>
