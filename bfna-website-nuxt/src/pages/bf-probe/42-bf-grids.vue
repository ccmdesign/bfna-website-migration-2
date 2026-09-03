<script setup lang="ts">
/**
 * Probe — issue 42 / gh#51: `bfGridInsights` + `bfGridProjects`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## Why fixed-width rails and not three viewports
 *
 * The contract under test is stated at three viewports — "both reflow
 * responsively at 1200/800/400px" — and the headless harness runs at **one**
 * (#109: the viewport is an input to the verdict, set once through
 * `Emulation.setDeviceMetricsOverride`). Probe 03 answered that by deriving its
 * expected track count from whatever width it measured, which proves the
 * arithmetic but can never say *"three columns"*.
 *
 * This probe does both. Each grid is mounted three times inside a **rail** of
 * fixed inline size — 1200 / 800 / 400px, each carrying `.container`'s own
 * `padding-inline: var(--space-m)`, so the grid sees the content width it would
 * see inside a real container at that viewport. Every rail then gets two rows:
 *
 *  - the **pinned** count (3 / 2 / 1 for insights, 2 / 1 / 1 for projects), which
 *    is the acceptance criterion in the words the spec uses; and
 *  - an **arithmetic agreement** row, `floor((W + gap) / (min(floor, W) + gap))`
 *    against the measured width, floor and gap at ±1px — probe 03's method,
 *    kept so a failure names its reason rather than only its number.
 *
 * The one honest caveat, stated rather than hidden: `--space-m` is a fluid
 * Utopia clamp, so a rail's padding resolves at the *harness* viewport, not at
 * the width the rail emulates. It moves the content width by a few pixels and
 * every pinned count here sits far from its boundary — measured on this page,
 * the 1200 rail gives **1140px** of content against a 30px gap, where three
 * 300px tracks need ≥ 960px and a fourth would need ≥ 1290px — which is what
 * the arithmetic row exists to prove rather than assert on faith.
 *
 * ## What it proves
 *
 *  1. **No column count is authored anywhere.** Neither `<ul>` carries a `style`
 *     attribute, and no `bf-*` rule in the live CSSOM declares
 *     `grid-template-columns` — the runtime half of the spec's `grep` gate.
 *  2. **Both grids reflow**, to the counts above, at all three widths.
 *  3. **`minWidth` is the column policy**: the default rails resolve
 *     `--_grid-min-width: 300px` (insights, `l`) and `400px` (projects, `xl`),
 *     and an explicit `min-width="s"` rail resolves `200px` and a different
 *     count at the same width.
 *  4. **`data-gap="m"` is kept from the frozen sources** — the resolved
 *     `column-gap` equals `--space-m` on every rail.
 *  5. **No margin leakage** (the D-36.7 failure, found in `bfFooter`'s review):
 *     `base/typography.css` declares `li { margin-bottom: 0.5em }` in
 *     `@layer defaults`, and a block margin on a **grid item** is added to the
 *     row gap. Every card reports `margin-block: 0px`, and the 400px rail —
 *     where the grid has collapsed to one column and the row gap is therefore
 *     measurable between two stacked cards — reports a row gap **equal to** its
 *     column gap.
 *  6. **`extraChips` reaches the card.** The function is applied per row by the
 *     grid; the one row it answers for renders the extra chip, the five it
 *     returns `undefined` for do not.
 *  7. **`headingLevel` is forwarded, not re-decided.** Unset, cards render `h3`
 *     (the card's own default); `heading-level="4"` renders `h4`.
 *  8. **Structure**: one `<li>` per row, cards are direct children of the
 *     `<ul>`, and the `<ul>`'s class list is exactly `grid` — the grid adds no
 *     wrapper and no class of its own.
 *  9. **`$attrs` reaches the `<ul>`** (`aria-labelledby` on every rail, which is
 *     also how a real template names the list).
 * 10. No `bf-*` rule on the page uses `:not()` with a complex selector (D-20.5).
 *
 * ## Real rows, not fixtures
 *
 * The **page** queries ten real documents — six `bfInsights`, four
 * `bfProjects` — and hands them over as props (BRIEF §5 rule 10; the
 * components themselves fetch nothing, D8). They are chosen for spread across
 * the fields these cards actually render, not for convenience: excerpts from
 * **0 to 1550 characters** (three insight rows carry none at all, as 195 of the
 * 371 real rows do — so a card with no `<p>` sits beside one truncated at 140),
 * archived rows next to live ones, three of the four `format` values, a project
 * with a `pending` flag and an external URL, and `cepi-2010` — no `kind`, no
 * `external_url`, no `pending` — which renders no chip cluster at all.
 *
 * Row heights therefore differ inside every grid, which is the case that
 * matters for a card in a grid track: it is what makes the row-gap measurement
 * below a measurement rather than a restatement of the declared value.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 42`,
 * per the gh#20–#41 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
import type { GridMinWidth, Insight, Project } from '~/types/bf-contracts'
import { formatLabel } from '~/utils/format'

defineOptions({ name: 'BfProbe42BfGrids' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 42 — bfGridInsights + bfGridProjects'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/**
 * The six insight slugs, named once so the assertions can quote them.
 *
 * `a-green-light-for-lichtenberg` is the row `extraChips` answers for.
 * `12-days-of-christmas-in-europe`, `a-developing-dilemma-…` and
 * `a-new-constellation` carry no excerpt at all (195 of the 371 real rows do
 * not), so three of the six cards render no `<p>` and the grid holds rows of
 * unequal height; those three are also the archived ones, so the `Archive` chip
 * is present on half the grid and absent on the other half.
 */
const INSIGHT_SLUGS = [
  '12-days-of-christmas-in-europe',
  'a-developing-dilemma-united-states-europe-china-and-the-choices-for-the-global-south',
  'a-green-light-for-lichtenberg',
  'a-kettle-full-of-steam',
  'a-nameless-alliance',
  'a-new-constellation'
] as const

/** The four project slugs. `cepi-2010` is the no-chips row. */
const PROJECT_SLUGS = [
  'city-solutions-series',
  'bfna-documentaries',
  'bridging-the-atlantic',
  'cepi-2010'
] as const

/** The row `extraChips` answers for, and what it answers with. */
const CHIPPED_SLUG = 'a-green-light-for-lichtenberg'
const EXTRA_CHIPS = ['Democracy', 'Berlin']

/**
 * The grid's `extraChips` contract: a function of the row, `undefined` for the
 * rows that get nothing. Exactly the shape `wfGridInsights.vue` declares.
 */
const extraChips = (i: Insight): string[] | undefined =>
  i.slug === CHIPPED_SLUG ? EXTRA_CHIPS : undefined

/** The three emulated widths, in the order the rails are mounted. */
const RAILS = [1200, 800, 400] as const

/** What each grid must resolve at each rail. See the doc comment. */
const EXPECTED_TRACKS: Record<'insights' | 'projects', Record<number, number>> = {
  insights: { 1200: 3, 800: 2, 400: 1 },
  projects: { 1200: 2, 800: 1, 400: 1 }
}

/** The floors `composition/grid.css` maps, restated so the probe can assert them. */
const FLOORS: Record<GridMinWidth, number> = {
  xs: 160, s: 200, m: 240, l: 300, xl: 400, '2xl': 500
}

const { data } = await useAsyncData('bf-probe-42', async () => {
  const insights = await Promise.all(
    INSIGHT_SLUGS.map(slug => queryCollection('bfInsights').where('slug', '=', slug).first())
  )
  const projects = await Promise.all(
    PROJECT_SLUGS.map(slug => queryCollection('bfProjects').where('slug', '=', slug).first())
  )
  return { insights, projects }
})

/*
 * Assignability checks, not casts (probe 21's note): if `bfInsightSchema` or
 * `bfProjectSchema` drifts from the exported type these stop compiling, which
 * is the point of the grid taking `Insight[]` rather than a loose row shape.
 */
const insightRows = computed<(Insight | null)[]>(() => data.value?.insights ?? [])
const projectRows = computed<(Project | null)[]>(() => data.value?.projects ?? [])

/**
 * The non-null rows, in slug order. A missing document would fail row 0 loudly
 * rather than quietly shrinking the grid and taking a track count with it.
 */
const insights = computed<Insight[]>(() =>
  insightRows.value.filter((r): r is Insight => r !== null)
)
const projects = computed<Project[]>(() =>
  projectRows.value.filter((r): r is Project => r !== null)
)

const checks = ref<Check[]>([])
let reported = false
const seen = { timedOut: false }

const px = (n: number): string => `${Math.round(n * 100) / 100}px`

const el = (testid: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-testid="${testid}"]`)

/** The content width of an element: border box minus padding and borders. */
const contentWidth = (node: HTMLElement, cs: CSSStyleDeclaration): number =>
  node.getBoundingClientRect().width
  - Number.parseFloat(cs.paddingInlineStart) - Number.parseFloat(cs.paddingInlineEnd)
  - Number.parseFloat(cs.borderInlineStartWidth) - Number.parseFloat(cs.borderInlineEndWidth)

/** The track count `auto-fill` implies for a width, floor and gap. */
const fits = (w: number, floor: number, gap: number): number =>
  Math.max(1, Math.floor((w + gap) / (Math.min(floor, w) + gap) + 1e-9))

/**
 * The per-rail rows: the pinned count, the arithmetic agreement, the absence of
 * an inline `style`, and the resolved floor.
 */
const railChecks = (
  kind: 'insights' | 'projects',
  width: number,
  expectedFloor: number
): Check[] => {
  const testid = `${kind}-${width}`
  const node = el(testid)
  const label = `${kind} @ ${width}px`

  if (!node) {
    return [{ label: `${label} — element present`, expected: 'present', actual: 'element missing' }]
  }

  const cs = getComputedStyle(node)
  const tracks = cs.gridTemplateColumns.split(' ').filter(Boolean).length
  const gap = Number.parseFloat(cs.columnGap) || 0
  const inline = contentWidth(node, cs)
  const floor = Number.parseFloat(cs.getPropertyValue('--_grid-min-width')) || 240
  /* ±1px of tolerance: a sub-pixel container width must not decide a verdict. */
  const agrees = [inline - 1, inline, inline + 1].some(w => fits(w, floor, gap) === tracks)

  return [
    {
      label: `${label} — resolves ${EXPECTED_TRACKS[kind][width]} track(s)`,
      expected: EXPECTED_TRACKS[kind][width] as number,
      actual: tracks
    },
    {
      label: `${label} — ${tracks} track(s) agrees with auto-fill at ${px(inline)} / ${px(floor)} floor / ${px(gap)} gap`,
      expected: 'track count matches the width',
      actual: agrees
        ? 'track count matches the width'
        : `${tracks} tracks, width implies ${fits(inline, floor, gap)}`
    },
    {
      label: `${label} — no inline style (the column count is never authored)`,
      expected: 'no style attribute',
      actual: node.hasAttribute('style') ? 'style attribute present' : 'no style attribute'
    },
    {
      label: `${label} — minWidth resolves --_grid-min-width`,
      expected: px(expectedFloor),
      actual: px(floor)
    }
  ]
}

const report = (): void => {
  if (reported) return
  reported = true

  const results: Check[] = []

  if (seen.timedOut) {
    results.push({ label: 'assertions ran before the 6s budget', expected: 'yes', actual: 'timed out' })
  }

  /* -- 0. the data actually arrived; every row below depends on it ---------- */
  results.push(
    { label: 'six real bfInsights rows reached the probe', expected: 6, actual: insights.value.length },
    { label: 'four real bfProjects rows reached the probe', expected: 4, actual: projects.value.length }
  )

  /* -- 1–3. the three rails per grid --------------------------------------- */
  for (const w of RAILS) results.push(...railChecks('insights', w, FLOORS.l))
  for (const w of RAILS) results.push(...railChecks('projects', w, FLOORS.xl))

  /* -- 4. `minWidth` is honoured, not ignored ------------------------------- */
  const override = el('insights-1200-s')
  const overrideCs = override ? getComputedStyle(override) : null
  results.push(
    {
      label: 'min-width="s" overrides the default floor (200px, not 300px)',
      expected: px(FLOORS.s),
      actual: overrideCs
        ? px(Number.parseFloat(overrideCs.getPropertyValue('--_grid-min-width')) || 240)
        : 'element missing'
    },
    {
      label: '  …and the narrower floor resolves more tracks at the same width',
      expected: 'more than 3',
      actual: overrideCs
        ? (() => {
            const t = overrideCs.gridTemplateColumns.split(' ').filter(Boolean).length
            return t > 3 ? 'more than 3' : `${t} tracks`
          })()
        : 'element missing'
    },
    {
      label: 'min-width reaches the DOM as data-min-width',
      expected: 'l|xl|s',
      actual: [el('insights-1200'), el('projects-1200'), override]
        .map(n => n?.getAttribute('data-min-width') ?? 'missing').join('|')
    }
  )

  /* -- 5. the gap is the frozen sources' `m`, on every rail ----------------- */
  const spaceM = getComputedStyle(document.documentElement).getPropertyValue('--space-m').trim()
  const probeRoot = document.querySelector<HTMLElement>('[data-probe="42"]')!
  const spaceMPx = (() => {
    /* Resolve the clamp by measuring it, rather than parsing a `clamp()` string. */
    const ruler = document.createElement('div')
    ruler.style.inlineSize = 'var(--space-m)'
    ruler.style.position = 'absolute'
    ruler.style.visibility = 'hidden'
    probeRoot.append(ruler)
    const v = ruler.getBoundingClientRect().width
    ruler.remove()
    return v
  })()

  const gaps = [...RAILS.map(w => `insights-${w}`), ...RAILS.map(w => `projects-${w}`)]
    .map(id => {
      const n = el(id)
      return n ? Math.round(Number.parseFloat(getComputedStyle(n).columnGap)) : NaN
    })
  results.push({
    label: `data-gap="m" resolves --space-m (${px(spaceMPx)}) on all six rails`,
    expected: RAILS.map(() => Math.round(spaceMPx)).concat(RAILS.map(() => Math.round(spaceMPx))).join('|'),
    actual: gaps.join('|')
  })
  results.push({
    label: '--space-m is a real token (not the var() fallback)',
    expected: 'declared',
    actual: spaceM === '' ? 'undeclared' : 'declared'
  })

  /* -- 6. no margin leakage — the D-36.7 failure --------------------------- */
  const allCards = Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="insights-"] > li, [data-testid^="projects-"] > li'))
  const leaky = allCards.filter(li => {
    const s = getComputedStyle(li)
    return Number.parseFloat(s.marginBlockStart) !== 0 || Number.parseFloat(s.marginBlockEnd) !== 0
  })
  results.push({
    label: `every card <li> reports margin-block: 0 (${allCards.length} cards)`,
    expected: 0,
    actual: leaky.length
  })

  /*
   * The consequence rather than the rule: at 400px both grids have collapsed
   * to one column, so the row gap is measured *between two stacked cards* and
   * must equal the column gap. A leaked `li { margin-bottom }` shows up here
   * as a row gap larger than the column gap — the bug the frozen skin's
   * `ul.grid > li { margin-block: 0 }` exists to prevent.
   */
  for (const kind of ['insights', 'projects'] as const) {
    const node = el(`${kind}-400`)
    if (!node) {
      results.push({ label: `${kind} @ 400px — row gap equals column gap`, expected: 'equal', actual: 'element missing' })
      continue
    }
    const cs = getComputedStyle(node)
    const rowGap = Number.parseFloat(cs.rowGap)
    const colGap = Number.parseFloat(cs.columnGap)
    /* Measured, not declared: the distance between the first two stacked cards. */
    const kids = Array.from(node.children) as HTMLElement[]
    const measured = kids.length >= 2
      ? (kids[1] as HTMLElement).getBoundingClientRect().top - (kids[0] as HTMLElement).getBoundingClientRect().bottom
      : NaN
    results.push(
      {
        label: `${kind} @ 400px — declared row gap equals column gap`,
        expected: px(colGap),
        actual: px(rowGap)
      },
      {
        label: `${kind} @ 400px — measured distance between two stacked cards equals the gap`,
        expected: px(colGap),
        actual: Number.isNaN(measured) ? 'fewer than two cards' : px(Math.round(measured * 100) / 100)
      }
    )
  }

  /* -- 7. `extraChips` reaches the card ------------------------------------ */
  const chipTexts = (testid: string, slug: string): string[] => {
    const grid = el(testid)
    if (!grid) return ['grid missing']
    const card = Array.from(grid.children).find(li =>
      li.querySelector(`a[href="/insights/${slug}"]`)
    ) as HTMLElement | undefined
    if (!card) return ['card missing']
    return Array.from(card.querySelectorAll('.bf-chip')).map(c => (c.textContent ?? '').trim())
  }

  const chipped = chipTexts('insights-1200', CHIPPED_SLUG)
  const unchipped = chipTexts('insights-1200', 'a-kettle-full-of-steam')
  results.push(
    {
      label: 'extraChips reaches the card it answers for',
      expected: EXTRA_CHIPS.join('|'),
      actual: EXTRA_CHIPS.filter(c => chipped.includes(c)).join('|') || `no extra chips (saw: ${chipped.join(', ')})`
    },
    {
      /*
       * Order, not just presence: `bfCardInsight` renders the format chip
       * first, then the extras, then `Archive`. `formatLabel` is called here
       * rather than a label being spelled out, so a change to the map cannot
       * make this row lie.
       */
      label: '  …and the extras sit after the format chip, in order',
      expected: [
        formatLabel(insights.value.find(i => i.slug === CHIPPED_SLUG)?.format ?? null),
        ...EXTRA_CHIPS
      ].join('|'),
      actual: chipped.slice(0, 1 + EXTRA_CHIPS.length).join('|')
    },
    {
      label: 'a row extraChips returns undefined for gets none of them',
      expected: 0,
      actual: EXTRA_CHIPS.filter(c => unchipped.includes(c)).length
    }
  )

  /* -- 8. `headingLevel` is forwarded, not re-decided ----------------------- */
  const levelOf = (testid: string): string => {
    const grid = el(testid)
    if (!grid) return 'grid missing'
    const first = grid.querySelector('li')?.firstElementChild
    return first ? first.tagName.toLowerCase() : 'no heading'
  }
  results.push(
    {
      label: 'unset headingLevel leaves the card default (h3)',
      expected: 'h3|h3',
      actual: `${levelOf('insights-1200')}|${levelOf('projects-1200')}`
    },
    {
      label: 'heading-level="4" is forwarded to every card',
      expected: 'h4',
      actual: levelOf('insights-1200-h4')
    }
  )

  /* -- 9. structure: the grid is a <ul class="grid"> of <li> cards ---------- */
  for (const [kind, count] of [['insights', insights.value.length], ['projects', projects.value.length]] as const) {
    const node = el(`${kind}-1200`)
    const kids = node ? Array.from(node.children) : []
    results.push(
      {
        label: `${kind} — one <li> per row, all direct children`,
        expected: `${count}|${count}`,
        actual: node ? `${kids.length}|${kids.filter(k => k.tagName === 'LI').length}` : 'element missing'
      },
      {
        label: `${kind} — the <ul> is a bare .grid (no wrapper class of the component's own)`,
        expected: 'grid',
        actual: node ? Array.from(node.classList).sort().join(' ') : 'element missing'
      },
      {
        label: `${kind} — every child is a .bf-card`,
        expected: count,
        actual: kids.filter(k => k.classList.contains('bf-card')).length
      },
      {
        label: `${kind} — $attrs reaches the <ul> (aria-labelledby)`,
        expected: `probe-${kind}-title`,
        actual: node?.getAttribute('aria-labelledby') ?? 'missing'
      }
    )
  }

  /* -- 10. the CSSOM rows: no authored columns, no complex :not() ----------- */
  const bfRules: CSSStyleRule[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRule[]
    try {
      rules = Array.from(sheet.cssRules)
    } catch {
      continue /* cross-origin (the icon font) — nothing of ours is in it */
    }
    const walk = (list: CSSRule[]): void => {
      for (const rule of list) {
        if (rule instanceof CSSStyleRule) bfRules.push(rule)
        const nested = (rule as CSSGroupingRule).cssRules
        if (nested) walk(Array.from(nested))
      }
    }
    walk(rules)
  }

  const bfSelectors = bfRules.filter(r => r.selectorText?.includes('.bf-'))
  const authoredColumns = bfSelectors.filter(r => r.style.getPropertyValue('grid-template-columns').trim() !== '')
  const badNots = bfSelectors
    .map(r => r.selectorText)
    .filter(sel => /:not\(([^)]*[\s>+~][^)]*)\)/.test(sel))

  results.push(
    {
      label: 'no bf-* rule declares grid-template-columns (the D9 gate, at runtime)',
      expected: 0,
      actual: authoredColumns.length === 0 ? 0 : authoredColumns.map(r => r.selectorText).join(' ; ')
    },
    {
      label: 'no bf-* rule uses :not() with a complex selector (D-20.5)',
      expected: 0,
      actual: badNots.length === 0 ? 0 : badNots.join(' ; ')
    }
  )

  checks.value = results
}

onMounted(() => {
  /*
   * One tick: nothing here is cycled, every rail is in the DOM as soon as Vue
   * has patched it, and `getComputedStyle` forces style recalculation on
   * demand. Deliberately not `requestAnimationFrame`, which is throttled to a
   * near stop in a backgrounded or embedded view and would leave the verdict
   * PENDING for ever (probe 33's note).
   */
  void nextTick().then(report)

  setTimeout(() => {
    if (reported) return
    seen.timedOut = true
    report()
  }, 6000)
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

const state = computed<'pending' | 'pass' | 'fail'>(() => {
  if (checks.value.length === 0) return 'pending'
  return passed.value === checks.value.length ? 'pass' : 'fail'
})

const verdict = computed(() =>
  state.value === 'pending'
    ? 'PENDING — assertions run on mount'
    : `${state.value === 'pass' ? 'PASS' : 'FAIL'} — ${passed.value}/${checks.value.length} checks`
)
</script>

<template>
  <!--
    Harness contract (docs/decisions/probe-harness.md): the root carries
    `data-probe` + `data-probe-verdict`, and every check row carries
    `data-probe-row` + `data-ok`. No `data-probe-keys` — nothing here is a
    keyboard question.
  -->
  <main
    class="probe"
    data-probe="42"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 42 — <code>bfGridInsights</code> + <code>bfGridProjects</code></h1>

    <p class="probe__lede">
      Each grid mounted three times, in rails of fixed inline size emulating a
      1200 / 800 / 400px viewport inside a <code>.container</code>. Every column
      count below is resolved by <code>auto-fill</code> from
      <code>data-min-width</code>; no element on this page authors one.
    </p>

    <section class="probe__stage" aria-labelledby="probe-insights-heading">
      <h2 id="probe-insights-heading">
        <code>bfGridInsights</code> — <code>min-width="l"</code> (300px floor), the default
      </h2>

      <div v-for="w in RAILS" :key="`i-${w}`" class="probe__scroller">
        <p class="probe__note">
          <code>{{ w }}px</code> — must resolve
          <strong>{{ EXPECTED_TRACKS.insights[w] }}</strong> track(s)
        </p>
        <div class="probe__rail" :style="{ '--_rail-width': `${w}px` }">
          <!--
            `data-testid` and `aria-labelledby` both ride `$attrs` onto the
            `<ul>` — the second is what a real template uses to name the list
            from its section heading, and row 9 asserts it arrived.
          -->
          <bfGridInsights
            :insights="insights"
            :extra-chips="extraChips"
            :data-testid="`insights-${w}`"
            aria-labelledby="probe-insights-title"
          />
        </div>
      </div>

      <span id="probe-insights-title" hidden>Insights</span>
    </section>

    <section class="probe__stage" aria-labelledby="probe-projects-heading">
      <h2 id="probe-projects-heading">
        <code>bfGridProjects</code> — <code>min-width="xl"</code> (400px floor), the default
      </h2>

      <div v-for="w in RAILS" :key="`p-${w}`" class="probe__scroller">
        <p class="probe__note">
          <code>{{ w }}px</code> — must resolve
          <strong>{{ EXPECTED_TRACKS.projects[w] }}</strong> track(s)
        </p>
        <div class="probe__rail" :style="{ '--_rail-width': `${w}px` }">
          <bfGridProjects
            :projects="projects"
            :data-testid="`projects-${w}`"
            aria-labelledby="probe-projects-title"
          />
        </div>
      </div>

      <span id="probe-projects-title" hidden>Projects</span>
    </section>

    <section class="probe__stage" aria-labelledby="probe-overrides-heading">
      <h2 id="probe-overrides-heading">Prop overrides</h2>

      <p class="probe__note">
        <code>min-width="s"</code> at the 1200px rail — a 200px floor, so more
        than three tracks at the same width.
      </p>
      <div class="probe__scroller">
        <div class="probe__rail" :style="{ '--_rail-width': '1200px' }">
          <bfGridInsights
            :insights="insights"
            min-width="s"
            data-testid="insights-1200-s"
          />
        </div>
      </div>

      <p class="probe__note">
        <code>heading-level="4"</code> — forwarded to every card (#128).
      </p>
      <div class="probe__scroller">
        <div class="probe__rail" :style="{ '--_rail-width': '1200px' }">
          <bfGridInsights
            :insights="insights"
            :heading-level="4"
            data-testid="insights-1200-h4"
          />
        </div>
      </div>
    </section>

    <section class="probe__report" aria-labelledby="probe-title">
      <h2 id="probe-title">Assertions</h2>

      <p
        class="probe__verdict"
        :data-state="state"
        data-testid="probe-42-verdict"
      >
        {{ verdict }}
      </p>

      <table class="probe__table" data-testid="probe-42-table">
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
    </section>
  </main>
</template>

<style scoped>
/*
  The ground is the `bf-probe` layout's job (gh#116): it paints `html` from
  `--color-surface-page` / `--color-text` and pins `color-scheme: light`.

  Nothing here declares `grid-template-columns` — the rails set an inline size
  and the composition layer resolves the columns.
*/

.probe {
  padding: var(--space-l, 2rem) var(--space-m, 1.5rem);
  min-block-size: 100dvh;
}

.probe__lede {
  max-inline-size: 75ch;
}

.probe__stage {
  margin-block-start: var(--space-l, 2rem);
}

/*
  The rail is wider than the harness viewport at 1200px, so each one gets its
  own scroll container rather than letting the *document* scroll horizontally —
  a page-level overflow would shift every `getBoundingClientRect()` reading on
  the page, including the stacked-card distance measured at 400px.
*/
.probe__scroller {
  overflow-x: auto;
  margin-block-start: var(--space-s, 1rem);
}

/*
  `.container`'s own geometry minus the `max-inline-size` cap: a fixed inline
  size standing in for the viewport, with the same `--space-m` inline padding.
  The grid inside therefore sees the content width it would see in a real
  container at that viewport.
*/
.probe__rail {
  inline-size: var(--_rail-width);
  padding-inline: var(--space-m, 1.5rem);
  outline: 1px dashed currentcolor;
  outline-offset: 2px;
}

.probe__note {
  font-size: 0.875rem;
  margin-block: var(--space-s, 1rem) var(--space-2xs, 0.5rem);
}

.probe__report {
  margin-block-start: var(--space-l, 2rem);
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
