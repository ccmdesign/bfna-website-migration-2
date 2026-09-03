<script setup lang="ts">
/**
 * Probe — issue 18 / gh#27: `bfTime`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## What it proves
 *
 * 1. **The spec's three named cases** — a valid date, an empty string and
 *    `null` — plus seven the spec did not name: the oldest and newest real
 *    rows, a month-boundary real row, a full timestamp, a non-ISO but
 *    `Date`-parseable string, `undefined`, whitespace, and outright garbage.
 * 2. **The acceptance criterion, stated as a machine check**: every rendered
 *    `datetime` attribute is a valid ISO value. Two rows do this from opposite
 *    directions — each attribute survives `Date.parse` without `NaN`, and the
 *    non-ISO input is shown to have been *normalised* rather than echoed.
 * 3. **Invalid input renders no element at all.** Not an empty `<time>`, not a
 *    `datetime` reading of an unparsed value. The rows count elements inside a
 *    per-case slot, which a `v-if`'s comment-node placeholder cannot satisfy.
 * 4. **The label/attribute split, on a real month boundary.** `monthYear`
 *    parses a date-only string as UTC midnight and formats it in the local
 *    zone, so `2014-08-01` (the real `argentina` row) labels as the previous
 *    month west of Greenwich. The label is allowed to be either; the
 *    `datetime` attribute is asserted to be exactly `2014-08-01`. That is the
 *    whole reason the attribute is derived separately.
 * 5. `.bf-time` is inside `@layer components` in the live CSSOM, and its one
 *    declaration actually resolves on every rendered instance.
 *
 * ## Real dates, not invented ones
 *
 * Every valid case except the two format probes is a real `publish_date` from
 * `content/bf/insights/`, named with its slug in the gallery. The snapshot holds
 * 351 date-only rows spanning `2007-05-27`…`2026-07-21` and **20 `null` rows** —
 * which is why the null case is the common path here, not an edge case.
 *
 * ## Timezone discipline
 *
 * The harness runs in whatever zone the machine is set to, so **no label row
 * uses a date that can shift across a month boundary**. Every asserted label is
 * mid-month (or a timestamp far enough from midnight to survive ±14h). The one
 * boundary date is asserted on its `datetime` only.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 18`,
 * per the gh#20–#26 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
defineOptions({ name: 'BfProbe18BfTime' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 18 — bfTime'
})

/**
 * `undefined` is not assignable to `TimeProps['date']` (`string | null`), and
 * that is correct — the prop is required. But an untyped data path can still
 * hand one over at runtime, and the component's guard covers it, so the case is
 * exercised through one deliberate, single-site cast rather than left untested.
 */
const UNDEFINED_DATE = undefined as unknown as string | null

/** One case: what goes in, and what must come out. */
interface Case {
  key: string
  /** Passed straight to `bfTime`'s `date` prop. */
  input: string | null
  /** Human description of the input, for the gallery. */
  shown: string
  /** Where the value comes from. */
  note: string
  /** Does an element render at all? */
  renders: boolean
  /** Expected `datetime`, when it is timezone-invariant. `null` = asserted elsewhere. */
  datetime: string | null
  /** Expected label, when it is timezone-invariant. `null` = not asserted. */
  label: string | null
}

const cases: Case[] = [
  {
    key: 'real-mid-month',
    input: '2014-12-17',
    shown: "'2014-12-17'",
    note: 'real — 12-days-of-christmas-in-europe',
    renders: true,
    datetime: '2014-12-17',
    label: 'Dec 2014'
  },
  {
    key: 'real-oldest',
    input: '2007-05-27',
    shown: "'2007-05-27'",
    note: 'real — the-crossroads, the oldest row in the snapshot',
    renders: true,
    datetime: '2007-05-27',
    label: 'May 2007'
  },
  {
    key: 'real-newest',
    input: '2026-07-21',
    shown: "'2026-07-21'",
    note: 'real — the-nuclear-option, the newest row in the snapshot',
    renders: true,
    datetime: '2026-07-21',
    label: 'Jul 2026'
  },
  {
    key: 'real-boundary',
    input: '2014-08-01',
    shown: "'2014-08-01'",
    note: 'real — argentina; the first of a month, so the label is zone-dependent',
    renders: true,
    datetime: '2014-08-01',
    // Deliberately unasserted: 'Jul 2014' west of Greenwich, 'Aug 2014' east.
    label: null
  },
  {
    key: 'timestamp',
    input: '2023-11-07T09:30:00.000Z',
    shown: "'2023-11-07T09:30:00.000Z'",
    note: 'a full timestamp — kept whole, not truncated to a day',
    renders: true,
    datetime: '2023-11-07T09:30:00.000Z',
    label: 'Nov 2023'
  },
  {
    key: 'non-iso',
    input: 'March 5, 2022',
    shown: "'March 5, 2022'",
    note: 'parseable by Date, not accepted by HTML — must be normalised',
    renders: true,
    // Local-midnight parse, so the exact instant is zone-dependent. Asserted by
    // shape and by inequality with the input, below.
    datetime: null,
    label: 'Mar 2022'
  },
  {
    key: 'empty',
    input: '',
    shown: "'' (empty string)",
    note: 'spec case 2',
    renders: false,
    datetime: null,
    label: null
  },
  {
    key: 'null',
    input: null,
    shown: 'null',
    note: 'spec case 3 — 20 of the 371 real insight rows',
    renders: false,
    datetime: null,
    label: null
  },
  {
    key: 'undefined',
    input: UNDEFINED_DATE,
    shown: 'undefined',
    note: 'not typeable, but reachable from an untyped data path',
    renders: false,
    datetime: null,
    label: null
  },
  {
    key: 'whitespace',
    input: '   ',
    shown: "'   ' (spaces)",
    note: 'trimmed to nothing before Date ever sees it',
    renders: false,
    datetime: null,
    label: null
  },
  {
    key: 'garbage',
    input: 'not-a-date',
    shown: "'not-a-date'",
    note: 'unparseable — the case the whole guard exists for',
    renders: false,
    datetime: null,
    label: null
  }
]

const renderingCases = cases.filter(c => c.renders)
const blankCases = cases.filter(c => !c.renders)

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

const checks = ref<Check[]>([])

onMounted(() => {
  const gallery = document.querySelector<HTMLElement>('.probe__gallery')

  /** The slot wrapper for a case — always present, whether or not it rendered. */
  const slot = (key: string) =>
    gallery?.querySelector<HTMLElement>(`[data-probe-slot="${key}"]`) ?? null

  /** The rendered `bfTime` for a case, or `null` when it correctly rendered nothing. */
  const el = (key: string) =>
    slot(key)?.querySelector<HTMLElement>('.bf-time') ?? null

  const rendered = renderingCases
    .map(c => el(c.key))
    .filter((e): e is HTMLElement => e !== null)

  /**
   * Walk every reachable stylesheet — `@import`ed ones included, since
   * `/css/styles.css` is nothing but a list of imports — for a `.bf-time` style
   * rule whose ancestry includes a `@layer components` block. Cross-origin
   * sheets throw on `cssRules`; they are skipped, not failed, so the Google
   * Fonts link does not sink the check. Matched as a whole class token, so a
   * future `.bf-time-label` cannot keep this green after the real rule was
   * renamed away. (Same helper as probes 14–17.)
   */
  const layeredBfTimeRuleFound = (): boolean => {
    const LAYER_BLOCK = globalThis.CSSLayerBlockRule
    if (!LAYER_BLOCK) return false

    const selector = /\.bf-time(?![\w-])/

    const walk = (rules: CSSRuleList, insideComponents: boolean): boolean => {
      for (const rule of Array.from(rules)) {
        const nowInside =
          insideComponents
          || (rule instanceof LAYER_BLOCK && (rule as CSSLayerBlockRule).name === 'components')

        if (nowInside && rule instanceof CSSStyleRule && selector.test(rule.selectorText)) {
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

  /** A full ISO 8601 instant as `Date.prototype.toISOString` emits it. */
  const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

  const nonIsoEl = el('non-iso')
  const nonIsoAttr = nonIsoEl?.getAttribute('datetime') ?? ''

  /**
   * The gallery's own markup, used for the "no unparsed date text leaked into
   * the output" row. Scoped to the gallery on purpose: the prose elsewhere on
   * this page discusses that failure mode by name, and a page-wide scan would
   * fail on the documentation rather than on the component.
   */
  const galleryMarkup = gallery?.innerHTML ?? ''

  /**
   * The override instance, deliberately **outside** `.probe__gallery` so the
   * element counts above still see exactly the eleven cases they enumerate.
   * Same construction as probe 17's override section.
   */
  const overrideEl = document.querySelector<HTMLElement>('.probe__override .bf-time')

  const results: Check[] = [
    // --- 1. the right number of elements exist, and only those --------------
    {
      label: `${renderingCases.length} valid inputs render an element`,
      expected: renderingCases.length,
      actual: rendered.length
    },
    {
      label: `${blankCases.length} invalid inputs render none — page-wide element count matches`,
      expected: renderingCases.length,
      actual: gallery?.querySelectorAll('.bf-time').length ?? -1
    },
    {
      label: 'every rendered element is a <time>, not a span or a div',
      expected: renderingCases.length,
      actual: rendered.filter(e => e.tagName === 'TIME').length
    },

    // --- 2. per-case: does it render at all? -------------------------------
    ...cases.map(c => ({
      label: `case ${c.key} (${c.shown}) → ${c.renders ? 'renders' : 'renders NOTHING'}`,
      expected: c.renders ? 1 : 0,
      actual: slot(c.key)?.querySelectorAll('time').length ?? -1
    })),

    // --- 3. per-case: the machine-readable attribute -----------------------
    ...renderingCases
      .filter(c => c.datetime !== null)
      .map(c => ({
        label: `  …case ${c.key} datetime`,
        expected: c.datetime as string,
        actual: el(c.key)?.getAttribute('datetime') ?? 'missing'
      })),

    // --- 4. per-case: the human label --------------------------------------
    ...renderingCases
      .filter(c => c.label !== null)
      .map(c => ({
        label: `  …case ${c.key} label (monthYear)`,
        expected: c.label as string,
        actual: el(c.key)?.textContent?.trim() ?? 'missing'
      })),

    // --- 5. the acceptance criterion: datetime is ALWAYS valid ISO ---------
    {
      label: 'every rendered datetime survives Date.parse without NaN',
      expected: renderingCases.length,
      actual: rendered.filter(e => {
        const v = e.getAttribute('datetime')
        return v !== null && v !== '' && !Number.isNaN(Date.parse(v))
      }).length
    },
    {
      label: '  …and every one matches a valid HTML datetime shape',
      expected: renderingCases.length,
      actual: rendered.filter(e => {
        const v = e.getAttribute('datetime') ?? ''
        return ISO_DATE_ONLY.test(v) || ISO_INSTANT.test(v)
      }).length
    },
    {
      label: 'no rendered element is missing its datetime attribute',
      expected: 0,
      actual: rendered.filter(e => !e.hasAttribute('datetime')).length
    },

    // --- 6. the attribute is derived, not echoed ---------------------------
    {
      label: 'a non-ISO input is normalised to a full ISO instant, not echoed',
      expected: 'true',
      actual: String(ISO_INSTANT.test(nonIsoAttr))
    },
    {
      label: '  …and the attribute is therefore not the raw prop value',
      expected: 'true',
      actual: String(nonIsoAttr !== 'March 5, 2022' && nonIsoAttr !== '')
    },
    {
      label: '  …while it still denotes the same day the label names',
      expected: '2022-03-05',
      actual: nonIsoAttr
        ? new Date(nonIsoAttr).toLocaleDateString('en-CA', {
            year: 'numeric', month: '2-digit', day: '2-digit'
          })
        : 'missing'
    },

    // --- 7. date-only granularity is preserved -----------------------------
    {
      label: 'a date-only input keeps date-only precision (no invented midnight)',
      expected: 4,
      actual: renderingCases.filter(c => {
        const v = el(c.key)?.getAttribute('datetime') ?? ''
        return ISO_DATE_ONLY.test(v)
      }).length
    },
    {
      label: '  …and a timestamp input keeps its time',
      expected: '2023-11-07T09:30:00.000Z',
      actual: el('timestamp')?.getAttribute('datetime') ?? 'missing'
    },

    // --- 8. the month-boundary case: the label may drift, the value may not -
    {
      label: 'month-boundary datetime is the true date, whatever zone the label used',
      expected: '2014-08-01',
      actual: el('real-boundary')?.getAttribute('datetime') ?? 'missing'
    },
    {
      label: '  …and its label is one of the two months that date can format to',
      expected: 'true',
      actual: String(
        ['Jul 2014', 'Aug 2014'].includes(el('real-boundary')?.textContent?.trim() ?? '')
      )
    },

    // --- 9. nothing unparsed leaked into the output ------------------------
    {
      label: 'no rendered element is empty (a label always accompanies the value)',
      expected: 0,
      actual: rendered.filter(e => (e.textContent ?? '').trim() === '').length
    },
    {
      label: 'the gallery markup contains no unparsed-date text',
      expected: 'true',
      actual: String(!/Invalid\s+Date/i.test(galleryMarkup))
    },

    // --- 10. $attrs fallthrough --------------------------------------------
    {
      label: '$attrs fallthrough reaches the rendered <time> (data-probe-case)',
      expected: renderingCases.map(c => c.key).join(','),
      actual: rendered.map(e => e.dataset.probeCase ?? '').join(',')
    },

    // --- 11. the one style declaration -------------------------------------
    {
      label: '.bf-time rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(layeredBfTimeRuleFound())
    },
    {
      label: '  …and every instance resolves white-space: nowrap from it',
      expected: renderingCases.length,
      actual: rendered.filter(e => getComputedStyle(e).whiteSpace === 'nowrap').length
    },
    {
      label: 'the component contributes no inline style of its own',
      expected: 0,
      actual: rendered.filter(e => e.getAttribute('style') !== null).length
    },
    {
      label: '  …so a consumer rule re-declares --_bf-time-white-space (nowrap → normal)',
      expected: 'normal',
      actual: overrideEl ? getComputedStyle(overrideEl).whiteSpace : 'missing'
    },
    {
      label: '  …without the override leaking back onto the gallery instances',
      expected: 'nowrap',
      actual: rendered[0] ? getComputedStyle(rendered[0]).whiteSpace : 'missing'
    }
  ]

  checks.value = results
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states, not two. The assertions run in `onMounted`, so during prerender
 * `checks` is empty — and a two-state verdict would bake `data-state="fail"`
 * into the static HTML for a component that is fine. `pending` says what is
 * actually true of the prerendered page: nothing has run yet. The harness
 * treats a probe still PENDING at timeout as a failure, never a skip.
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
    `data-probe-row` + `data-ok`, so `scripts/check-probes.ts` fails the build
    on a red probe instead of relying on someone opening the page.
  -->
  <main
    class="probe container"
    data-probe="18"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 18 — <code>bfTime</code></h1>
    <p class="probe__lede">
      A real <code>&lt;time datetime&gt;</code> element with a human label. The
      text node is for a human, the attribute is for a machine, and the machine
      one is never allowed to be wrong — so it is rebuilt from the parsed date
      rather than echoed from the prop, and an input that cannot be parsed
      renders <strong>no element at all</strong>.
    </p>
    <p class="probe__lede">
      Every valid case below except the last two is a real
      <code>publish_date</code> from <code>content/bf/insights/</code>. The
      snapshot holds 351 date-only rows spanning
      <code>2007-05-27</code>…<code>2026-07-21</code> and 20 rows whose date is
      <code>null</code>, which is why the null case is the ordinary path here
      rather than an edge case.
    </p>

    <section class="probe__gallery" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading">Eleven inputs</h2>

      <table class="probe__table">
        <thead>
          <tr>
            <th scope="col"><code>date</code> prop</th>
            <th scope="col">Source</th>
            <th scope="col">Rendered</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in cases" :key="c.key">
            <td><code>{{ c.shown }}</code></td>
            <td class="probe__note">{{ c.note }}</td>
            <!--
              The slot wrapper is always in the DOM, whether or not the
              component rendered anything into it. That is what lets the
              "renders NOTHING" rows count elements rather than infer an
              absence — a `v-if`'s comment-node placeholder satisfies no
              selector, so a missing wrapper and an empty one would otherwise
              be indistinguishable.
            -->
            <td class="probe__slot" :data-probe-slot="c.key">
              <bfTime :date="c.input" :data-probe-case="c.key" />
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!--
      Outside `.probe__gallery` on purpose: the element counts above enumerate
      exactly the eleven cases, so an extra instance must not be swept into that
      set. (Same arrangement as probe 17's override section.)
    -->
    <section class="probe__override" aria-labelledby="override-heading">
      <h2 id="override-heading">Overriding the one declaration</h2>
      <p class="probe__lede">
        The single style this atom ships is exposed as
        <code>--_bf-time-white-space</code>, per the spec's naming convention,
        and its default is declared in the <code>.bf-time</code> rule rather
        than bound inline — the <code>bfMedia</code> lesson from gh#26. A
        component that writes its own custom property inline on every instance
        is no more overridable than one that writes the plain declaration
        inline. <code>bfTime</code> emits no inline <code>style</code> at all,
        so the consumer rule below wins on ordinary specificity.
      </p>
      <p class="probe__slot">
        <bfTime date="2014-12-17" />
      </p>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-18-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-18-table">
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
  max-inline-size: 40ch;
}

/*
  A visible frame around the render slot, so an empty one reads as *deliberately
  empty* to a human scanning the page rather than as a broken row.
*/
.probe__slot {
  outline: 1px dashed currentcolor;
  outline-offset: 2px;
  min-inline-size: 8ch;
}

/*
  The consumer override, written the way a real consumer would write it: inside
  `@layer components`, where it beats the component's own `.bf-time` default on
  specificity rather than by escaping the layer system. An unlayered rule would
  win too, but it would prove the wrong thing — that unlayered CSS outranks
  layers, not that the component is overridable.
*/
@layer components {
  .probe__override .bf-time {
    --_bf-time-white-space: normal;
  }
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
