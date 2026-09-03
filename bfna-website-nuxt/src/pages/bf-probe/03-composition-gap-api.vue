<script setup lang="ts">
/**
 * Probe — issue 03 / gh#12: `data-gap` honoured on every primitive.
 *
 * Dev-only route, never linked from nav. Renders `.stack`, `.cluster`,
 * `.switcher` and `.grid` at three `data-gap` values plus one `data-space`
 * alias row each, so the three gaps can be read as visibly distinct and
 * asserted numerically via `getComputedStyle`.
 *
 * The composition stylesheet ships from `src/public/css` and is pulled in the
 * same way `layouts/wireframe.vue` does it, so the probe stands alone with no
 * layout (the default layout would wrap it in legacy chrome).
 *
 * Extended for issue 04 / gh#13 with a `.grid[data-min-width]` section: the
 * responsive contract is viewport-dependent, so those grids are read back at
 * 1200 / 800 / 400px and must resolve 3 / 2 / 1 tracks with no inline `style`.
 *
 * Extended again for issue 05 / gh#14 with a `[data-measure]` section: the
 * attribute used to work only through `.center`, so a bare `<p>`, `<div>` or
 * `<li>` carrying it was inert. Those three elements are read back with
 * `getComputedStyle(el).maxInlineSize` and must resolve 60ch / 90ch / 75ch,
 * all narrower than the unset control. A `.center[data-measure="narrow"]`
 * row is included as the non-regression case: the universal rule must not
 * take over `.center`'s own `max-inline-size`.
 */
defineOptions({ name: 'BfProbe03CompositionGapApi' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 03 — composition gap API'
})

/** The three deliberately far-apart steps of the Utopia scale under test. */
const gaps = ['xs', 'l', '3xl'] as const

/** The four primitives this issue makes `data-gap`-aware. */
const primitives = [
  { key: 'stack', label: 'stack', note: 'gap = margin-block-start on `> * + *`' },
  { key: 'cluster', label: 'cluster', note: 'gap = flex `gap`' },
  { key: 'switcher', label: 'switcher', note: 'gap = flex `gap`' },
  { key: 'grid', label: 'grid', note: 'gap = grid `gap`' }
] as const

const items = ['A', 'B', 'C']

/**
 * Issue 04 — `.grid[data-min-width]`. Six items so a 300px floor can resolve
 * three, two or one track without the item count being the limiting factor.
 */
const gridItems = ['1', '2', '3', '4', '5', '6']

/**
 * Issue 05 — `[data-measure]`. Long enough to overflow a 90ch cap at any
 * realistic viewport, so the three caps read as visibly different line
 * lengths rather than as three copies of the same short line.
 */
const measureText =
  'Measure is the line length a reader can track without losing their place. '
  + 'This paragraph is deliberately long enough that every cap in the scale '
  + 'wraps well before the container edge, so the difference between 60ch, '
  + '75ch and 90ch is legible as a difference in line length and not merely '
  + 'as a number read back out of the computed style. If this text renders '
  + 'full-bleed across the container, the rule is inert and the issue has '
  + 'regressed.'
/* ------------------------------------------------------------------ *
 * Runtime assertions — issue 15b / gh#109.
 *
 * This probe used to prove its three contracts to the eye and to
 * `getComputedStyle` typed into a console: everything below was measured by
 * hand. The harness (`scripts/check-probes.ts`) needs a machine-readable
 * verdict, so the measurements now run on mount and publish themselves.
 *
 * Every assertion is deliberately **viewport-agnostic**. The `data-min-width`
 * contract was specified at 1200 / 800 / 400px, but a headless run has one
 * viewport, so the expected track count is derived from the container width
 * and the resolved floor rather than pinned — the same arithmetic `auto-fill`
 * does, which is the claim worth making at any width.
 * ------------------------------------------------------------------ */

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

const checks = ref<Check[]>([])

const px = (n: number) => (Number.isFinite(n) ? `${Math.round(n * 100) / 100}px` : 'n/a')

onMounted(() => {
  const results: Check[] = []
  const el = (testid: string) => document.querySelector<HTMLElement>(`[data-testid="${testid}"]`)

  /**
   * The resolved gap in px. `.stack` spaces with `margin-block-start` on
   * `> * + *`; `.cluster`, `.switcher` and `.grid` use real `gap`. Reading the
   * computed value rather than the attribute is the whole point — a rule that
   * never matched would read back as the default, not as the requested step.
   */
  const gapOf = (node: HTMLElement | null): number => {
    if (!node) return Number.NaN
    if (node.classList.contains('stack')) {
      const second = node.children[1] as HTMLElement | undefined
      return second ? Number.parseFloat(getComputedStyle(second).marginBlockStart) : Number.NaN
    }
    return Number.parseFloat(getComputedStyle(node).rowGap)
  }

  /* -- issue 03: `data-gap` on every primitive, and the alias -- */
  for (const p of primitives) {
    const xs = gapOf(el(`${p.key}-gap-xs`))
    const l = gapOf(el(`${p.key}-gap-l`))
    const xxxl = gapOf(el(`${p.key}-gap-3xl`))

    results.push({
      label: `.${p.key} — data-gap xs < l < 3xl (${px(xs)} / ${px(l)} / ${px(xxxl)})`,
      expected: 'strictly increasing',
      actual: Number.isFinite(xs) && xs < l && l < xxxl ? 'strictly increasing' : 'not increasing'
    })
    results.push({
      label: `.${p.key} — data-space="l" alias resolves the same gap as data-gap="l"`,
      expected: px(l),
      actual: px(gapOf(el(`${p.key}-space-l`)))
    })
    results.push({
      label: `.${p.key} — data-gap wins over data-space when both are set (D-03.1)`,
      expected: px(xxxl),
      actual: px(gapOf(el(`${p.key}-both`)))
    })
  }

  /* -- issue 04: `.grid[data-min-width]` resolves its own track count -- */
  const gridCases = [
    { testid: 'grid-min-width-l', label: '.grid[data-min-width="l"]' },
    { testid: 'grid-min-width-2xl', label: '.grid[data-min-width="2xl"]' },
    { testid: 'grid-min-width-l-gap-3xl', label: '.grid[data-min-width="l"][data-gap="3xl"]' }
  ]

  for (const g of gridCases) {
    const node = el(g.testid)

    results.push({
      label: `${g.label} — no inline style (the column count is never authored)`,
      expected: 'no style attribute',
      actual: node ? (node.hasAttribute('style') ? 'style attribute present' : 'no style attribute') : 'element missing'
    })

    if (!node) {
      results.push({ label: `${g.label} — track count matches the available width`, expected: 'measured', actual: 'element missing' })
      continue
    }

    const cs = getComputedStyle(node)
    const tracks = cs.gridTemplateColumns.split(' ').filter(Boolean).length
    const gap = Number.parseFloat(cs.columnGap) || 0
    const inline = node.getBoundingClientRect().width
      - Number.parseFloat(cs.paddingInlineStart) - Number.parseFloat(cs.paddingInlineEnd)
      - Number.parseFloat(cs.borderInlineStartWidth) - Number.parseFloat(cs.borderInlineEndWidth)
    /* `min(<floor>, 100%)` — the documented collapse when the floor exceeds the container. */
    const floor = Number.parseFloat(cs.getPropertyValue('--_grid-min-width')) || 240
    const track = Math.min(floor, inline)
    const fits = (w: number) => Math.max(1, Math.floor((w + gap) / (track + gap)))
    /* ±1px of tolerance: sub-pixel container widths must not decide a verdict. */
    const expected = fits(inline)
    const agrees = [inline - 1, inline, inline + 1].some(w => fits(w) === tracks)

    results.push({
      label: `${g.label} — ${tracks} track(s) at ${px(inline)} with a ${px(track)} floor and a ${px(gap)} gap (auto-fill implies ${expected})`,
      expected: 'track count matches the width',
      actual: agrees ? 'track count matches the width' : `${tracks} tracks, width implies ${expected}`
    })
  }

  /* -- issue 05: `[data-measure]` on any element, and the `.center` non-regression -- */
  const capOf = (testid: string): string => {
    const node = el(testid)
    return node ? getComputedStyle(node).maxInlineSize : 'element missing'
  }
  const capPx = (testid: string): number => {
    const value = capOf(testid)
    return value === 'none' || value === 'element missing' ? Number.NaN : Number.parseFloat(value)
  }

  const narrow = capPx('measure-p-narrow')
  const normal = capPx('measure-li-normal')
  const wide = capPx('measure-div-wide')
  const centerNarrow = capPx('measure-center-narrow')

  results.push({
    label: 'bare <p data-measure="narrow"> is capped at all (the rule used to be inert off .center)',
    expected: 'capped',
    actual: Number.isFinite(narrow) ? 'capped' : capOf('measure-p-narrow')
  })
  results.push({
    label: `[data-measure] narrow < normal < wide on bare elements (${px(narrow)} / ${px(normal)} / ${px(wide)})`,
    expected: 'strictly increasing',
    actual: narrow < normal && normal < wide ? 'strictly increasing' : 'not increasing'
  })
  results.push({
    label: 'the control <p> with no attribute has no cap',
    expected: 'none',
    actual: capOf('measure-control')
  })
  results.push({
    label: `.center[data-measure="narrow"] is capped below .center's own default (${px(centerNarrow)})`,
    expected: 'capped and narrower than the default',
    actual: Number.isFinite(centerNarrow) && centerNarrow < 1100
      ? 'capped and narrower than the default'
      : capOf('measure-center-narrow')
  })
  results.push({
    label: 'non-regression — plain .center keeps its own 1100px default, not 75ch',
    expected: '1100px',
    actual: capOf('measure-center-default')
  })

  checks.value = results
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states, not two — probe 14's reasoning, kept: the assertions run in
 * `onMounted`, so during prerender `checks` is empty, and a two-state verdict
 * would bake `FAIL` into the static HTML for a page that is fine.
 */
const state = computed<'pending' | 'pass' | 'fail'>(() => {
  if (checks.value.length === 0) return 'pending'
  return passed.value === checks.value.length ? 'pass' : 'fail'
})

const verdict = computed(() =>
  state.value === 'pending'
    ? 'PENDING — assertions run on mount; open this page in a browser'
    : `${state.value === 'pass' ? 'PASS' : 'FAIL'} — ${passed.value}/${checks.value.length} checks`
)
</script>

<template>
  <!--
    Harness contract (docs/decisions/probe-harness.md): the root carries
    `data-probe` + `data-probe-verdict`, and every check row carries
    `data-probe-row` + `data-ok`, so `scripts/check-probes.ts` can fail the
    build on a red probe instead of relying on someone opening the page.
  -->
  <main
    class="probe container"
    data-probe="03"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 03 — composition gap API</h1>
    <p class="probe__lede">
      Each primitive is rendered at <code>data-gap="xs"</code>,
      <code>data-gap="l"</code> and <code>data-gap="3xl"</code>. The three gaps
      must be visibly distinct and strictly increasing. A fourth row uses the
      <code>data-space</code> alias at <code>l</code> and must equal the
      <code>data-gap="l"</code> row.
    </p>

    <section
      v-for="p in primitives"
      :key="p.key"
      class="probe__section"
    >
      <h2>.{{ p.label }}</h2>
      <p class="probe__note">{{ p.note }}</p>

      <div
        v-for="g in gaps"
        :key="g"
        class="probe__case"
      >
        <p class="probe__caption">
          <code>data-gap="{{ g }}"</code>
        </p>
        <div
          :class="p.key"
          :data-gap="g"
          :data-testid="`${p.key}-gap-${g}`"
        >
          <div
            v-for="i in items"
            :key="i"
            class="probe__item"
          >
            {{ i }}
          </div>
        </div>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          <code>data-space="l"</code> (alias — must equal the <code>data-gap="l"</code> row)
        </p>
        <div
          :class="p.key"
          data-space="l"
          :data-testid="`${p.key}-space-l`"
        >
          <div
            v-for="i in items"
            :key="i"
            class="probe__item"
          >
            {{ i }}
          </div>
        </div>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          <code>data-gap="3xl" data-space="xs"</code> (precedence — must equal
          the <code>data-gap="3xl"</code> row)
        </p>
        <div
          :class="p.key"
          data-gap="3xl"
          data-space="xs"
          :data-testid="`${p.key}-both`"
        >
          <div
            v-for="i in items"
            :key="i"
            class="probe__item"
          >
            {{ i }}
          </div>
        </div>
      </div>
    </section>

    <section class="probe__section">
      <h2>.grid[data-min-width] — responsive contract (issue 04)</h2>
      <p class="probe__note">
        Column count is never authored. None of the three grids below carries
        an inline <code>style</code>; each track list is resolved from the
        available inline size against the <code>data-min-width</code> floor.
      </p>

      <div class="probe__case">
        <p class="probe__caption">
          <code>data-min-width="l"</code> (300px floor) — must resolve 3 tracks
          at 1200px, 2 at 800px, 1 at 400px
        </p>
        <div
          class="grid"
          data-min-width="l"
          data-testid="grid-min-width-l"
        >
          <div
            v-for="i in gridItems"
            :key="i"
            class="probe__item"
          >
            {{ i }}
          </div>
        </div>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          <code>data-min-width="2xl"</code> (500px floor) — the
          <code>min(…, 100%)</code> case: at 400px the floor exceeds the
          container, so the track must collapse to one full-width column
          instead of overflowing the page
        </p>
        <div
          class="grid"
          data-min-width="2xl"
          data-testid="grid-min-width-2xl"
        >
          <div
            v-for="i in gridItems"
            :key="i"
            class="probe__item"
          >
            {{ i }}
          </div>
        </div>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          <code>data-min-width="l" data-gap="3xl"</code> — the two attributes
          compose: the wider gap is subtracted from the available inline size,
          so this may resolve one fewer track than the row above at the same
          width
        </p>
        <div
          class="grid"
          data-min-width="l"
          data-gap="3xl"
          data-testid="grid-min-width-l-gap-3xl"
        >
          <div
            v-for="i in gridItems"
            :key="i"
            class="probe__item"
          >
            {{ i }}
          </div>
        </div>
      </div>
    </section>

    <section class="probe__section">
      <h2>[data-measure] — universal line-length cap (issue 05)</h2>
      <p class="probe__note">
        None of the four elements below carries the <code>center</code> class.
        Before this issue every one of them was inert. Expected computed
        <code>max-inline-size</code>: 60ch, 90ch, 75ch, and no cap on the
        control.
      </p>

      <div class="probe__case">
        <p class="probe__caption">
          bare <code>&lt;p data-measure="narrow"&gt;</code> — 60ch
        </p>
        <p
          data-measure="narrow"
          data-testid="measure-p-narrow"
        >
          {{ measureText }}
        </p>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          bare <code>&lt;div data-measure="wide"&gt;</code> — 90ch
        </p>
        <div
          data-measure="wide"
          data-testid="measure-div-wide"
        >
          {{ measureText }}
        </div>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          bare <code>&lt;li data-measure="normal"&gt;</code> in a plain
          <code>&lt;ul&gt;</code> — 75ch
        </p>
        <ul>
          <li
            data-measure="normal"
            data-testid="measure-li-normal"
          >
            {{ measureText }}
          </li>
        </ul>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          control — bare <code>&lt;p&gt;</code>, no attribute; must be wider
          than all three above
        </p>
        <p data-testid="measure-control">
          {{ measureText }}
        </p>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          non-regression — <code>.center[data-measure="narrow"]</code> must
          still resolve through <code>--_center-measure</code> (60ch), i.e. the
          universal rule must not take over <code>.center</code>
        </p>
        <div
          class="center"
          data-measure="narrow"
          data-testid="measure-center-narrow"
        >
          {{ measureText }}
        </div>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          non-regression — plain <code>.center</code>, no attribute; must keep
          its <code>1100px</code> default
        </p>
        <div
          class="center"
          data-testid="measure-center-default"
        >
          {{ measureText }}
        </div>
      </div>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-03-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-03-table">
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
  Presentation is intentionally colourless: outlines use `currentColor` so the
  probe introduces no colour literal and no new token (epic ground rule 2).
*/
/*
  The ground is the `bf-probe` layout's job now (gh#116): it paints `html` from
  `--color-surface-page` / `--color-text` and pins `color-scheme: light`, so the
  per-probe `:global(html)` block each of these pages used to carry — and the
  `--color-white` primitive some of them reached for — is gone.
*/

.probe {
  padding-block: var(--space-l);
  min-block-size: 100dvh;
}

.probe__lede,
.probe__note {
  max-width: 60ch;
}

.probe__section {
  margin-block-start: var(--space-xl);
  padding-block-start: var(--space-s);
  border-block-start: 1px solid currentColor;
}

.probe__case {
  margin-block-start: var(--space-m);
}

.probe__caption {
  margin-block: 0 var(--space-2xs);
}

.probe__item {
  outline: 1px solid currentColor;
  padding: var(--space-2xs);
  min-width: 4rem;
  text-align: center;
}

.probe__verdict {
  margin-block-start: var(--space-xl);
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
}

.probe__table th,
.probe__table td {
  border-block-end: 1px solid currentcolor;
  padding: 0.25rem 0.75rem 0.25rem 0;
  text-align: start;
}

.probe__table tr[data-state='fail'] {
  color: var(--color-error);
}
</style>
