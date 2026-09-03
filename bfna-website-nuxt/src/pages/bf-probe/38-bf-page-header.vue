<script setup lang="ts">
/**
 * Probe 38 — `bfPageHeader` (issue 38, gh#47).
 *
 * Five permutations, one per prop the spec names, and therefore **five `<h1>`
 * on this page**. That is deliberate and it is what the spec's acceptance
 * counts, so this probe declares no `<h1>` of its own: its title is a styled
 * `<p>`, its sections are `<h2>`, and `layouts/bf-probe.vue` is a bare
 * `<slot />` that contributes no heading. Same reasoning as D-37.6 — a probe is
 * a measuring instrument rather than a page of the site, and the rule under
 * test is "*`bfPageHeader` contributes exactly one `h1`*", asserted per
 * component root as well as in the page total.
 *
 * The crumbs-only case doubles as the control for residual
 * [#162](https://github.com/ccmdesign/bfna-website-migration-2/issues/162): it
 * passes a `#chips` slot whose only child is `v-if="false"`. Under the wf
 * source's `$slots.chips` guard that renders an empty `.cluster` taking a
 * `.stack` gap; under this component's rendered-vnode guard it renders nothing,
 * which is what the row asserts.
 */
defineOptions({ name: 'BfProbe38BfPageHeader' })
definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 38 — bfPageHeader'
})

interface Check {
  label: string
  expected: string | number
  actual: string | number
}

interface ProbeCase {
  key: string
  label: string
  note: string
}

/** The five permutations, in the order the spec lists them. */
const CASES: ProbeCase[] = [
  {
    key: 'crumbs-only',
    label: 'Crumbs only',
    note: 'crumbs + heading, and a #chips slot whose content is v-if’d away (#162 control)'
  },
  {
    key: 'chips-strings',
    label: 'Chips as strings',
    note: 'three `chips` strings, one of them filtered out as an empty label'
  },
  {
    key: 'chips-slot',
    label: 'Chips via slot',
    note: 'one string chip plus two from the #chips slot — both render into one cluster'
  },
  {
    key: 'tagline-string',
    label: 'Tagline as a string',
    note: 'one paragraph'
  },
  {
    key: 'tagline-array',
    label: 'Tagline as an array',
    note: 'two paragraphs, plus default-slot content after them'
  }
]

const CRUMBS = [
  { label: 'Home', to: '/' },
  { label: 'Insights', to: '/insights' },
  { label: 'Democracy in the digital age' }
]

const HEADINGS: Record<string, string> = {
  'crumbs-only': 'Democracy in the digital age',
  'chips-strings': 'The transatlantic technology agenda',
  'chips-slot': 'Rebuilding trust in public institutions',
  'tagline-string': 'Our approach',
  'tagline-array': 'Sustainable futures'
}

/** Deliberately carries an empty string, which `chipList` must drop. */
const STRING_CHIPS = ['Report', 'Democracy', '', 'Archive']

const TAGLINE_ONE
  = 'Transatlantic cooperation is tested by the same forces on both sides of '
    + 'the ocean, and the answers travel in both directions.'

const TAGLINE_MANY = [
  'Climate policy, industrial strategy and social protection are one problem '
  + 'wearing three names.',
  'This programme follows the money, the law and the politics through all '
  + 'three, in Europe and in North America.'
]

/** Never true — the #162 control's `v-if`. */
const neverTrue = false

interface Snapshot {
  key: string
  found: boolean
  rootTag: string
  rootClasses: string
  dataLabel: string
  inlineStyle: boolean
  innerClasses: string
  innerGap: string
  innerRhythm: number
  h1Count: number
  h1Text: string
  h2Count: number
  crumbNav: boolean
  crumbItems: number
  crumbAriaLabel: string
  crumbCurrent: string
  cluster: boolean
  clusterGapAttr: string
  clusterGapPx: number
  chipCount: number
  chipText: string
  taglineCount: number
  taglineText: string
  taglineMeasure: string
  order: string
  leakedAttrs: string
}

const snaps = reactive<Snapshot[]>([])
const checks = ref<Check[]>([])

/**
 * Prop names that must never reach the DOM as attributes. `bfSection` filters
 * `$attrs` down to an allow-list, and `bfPageHeader` mounts it as its single
 * root, so a prop of either component appearing here would mean the filter
 * regressed.
 */
const PROP_ATTRIBUTE_SPELLINGS = [
  'label', 'crumbs', 'chips', 'heading', 'tagline',
  'gap', 'padded', 'layout', 'measure', 'fullwidth', 'full-width'
]

/**
 * Every `:not()` in a `bf-*` rule whose argument is a complex selector — the
 * D-20.5 ban, read from the live CSSOM rather than from source, so a build step
 * that introduces one fails the run. Same walker probe 39 uses.
 */
const complexNotSelectors = (): string[] => {
  const found: string[] = []

  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes('.bf-')) {
        for (const m of rule.selectorText.matchAll(/:not\(([^()]*)\)/g)) {
          const inner = (m[1] ?? '').trim()
          if (/[\s>+~]/.test(inner)) found.push(rule.selectorText)
        }
      }
      if (rule instanceof CSSImportRule) {
        try {
          if (rule.styleSheet) walk(rule.styleSheet.cssRules)
        } catch {
          // Cross-origin import target — unreadable, not a failure.
        }
        continue
      }
      const nested = (rule as CSSGroupingRule).cssRules
      if (nested) walk(nested)
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules)
    } catch {
      // Cross-origin sheet.
    }
  }

  return found
}

/**
 * Every rule anywhere in the loaded CSS that selects on `bf-page-header`.
 *
 * Expected to be **none**: the component ships no `<style>` block at all, which
 * is the strongest available statement of "no new CSS variables beyond
 * `bfSection`'s, `bfBreadcrumb`'s and `bfChip`'s hooks". A rule appearing here
 * is not automatically wrong, but it is a change nobody signed off.
 */
const pageHeaderRules = (): string[] => {
  const found: string[] = []

  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes('bf-page-header')) {
        found.push(rule.selectorText)
      }
      if (rule instanceof CSSImportRule) {
        try {
          if (rule.styleSheet) walk(rule.styleSheet.cssRules)
        } catch {
          // Cross-origin import target.
        }
        continue
      }
      const nested = (rule as CSSGroupingRule).cssRules
      if (nested) walk(nested)
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules)
    } catch {
      // Cross-origin sheet.
    }
  }

  return found
}

const rootFor = (key: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`.bf-page-header[data-probe-case="${key}"]`)

/** What kind of child of the inner box is this, in the render order under test? */
const kindOf = (el: Element): string => {
  if (el.matches('nav.bf-breadcrumb')) return 'crumbs'
  if (el.matches('.bf-page-header__chips')) return 'chips'
  if (el.matches('h1')) return 'h1'
  if (el.matches('p.bf-page-header__tagline')) return 'tagline'
  return 'slot'
}

const snapshot = (key: string): Snapshot => {
  const root = rootFor(key)
  const inner = root?.firstElementChild as HTMLElement | null
  const innerStyle = inner ? getComputedStyle(inner) : null

  const h1s = Array.from(root?.querySelectorAll('h1') ?? [])
  const nav = root?.querySelector<HTMLElement>('nav.bf-breadcrumb') ?? null
  const cluster = root?.querySelector<HTMLElement>('.bf-page-header__chips') ?? null
  const chips = Array.from(cluster?.querySelectorAll('.bf-chip') ?? [])
  const taglines = Array.from(root?.querySelectorAll<HTMLElement>('p.bf-page-header__tagline') ?? [])
  const clusterStyle = cluster ? getComputedStyle(cluster) : null

  return {
    key,
    found: root !== null,
    rootTag: root?.tagName.toLowerCase() ?? 'missing',
    rootClasses: root ? Array.from(root.classList).sort().join(' ') : 'no root',
    dataLabel: root?.getAttribute('data-label') ?? 'absent',
    inlineStyle: root !== null && root.style.cssText.trim() !== '',
    innerClasses: inner ? Array.from(inner.classList).sort().join(' ') : 'no inner box',
    innerGap: inner?.getAttribute('data-gap') ?? 'absent',
    innerRhythm: (() => {
      const second = inner?.children[1] as HTMLElement | undefined
      return second ? Number.parseFloat(getComputedStyle(second).marginBlockStart) : -1
    })(),
    h1Count: h1s.length,
    h1Text: (h1s[0]?.textContent ?? '').trim(),
    h2Count: root?.querySelectorAll('h2').length ?? -1,
    crumbNav: nav !== null,
    crumbItems: nav?.querySelectorAll('li').length ?? 0,
    crumbAriaLabel: nav?.getAttribute('aria-label') ?? 'absent',
    crumbCurrent: (nav?.querySelector('[aria-current="page"]')?.textContent ?? 'absent').trim(),
    cluster: cluster !== null,
    clusterGapAttr: cluster?.getAttribute('data-gap') ?? 'absent',
    clusterGapPx: clusterStyle ? Number.parseFloat(clusterStyle.columnGap) : -1,
    chipCount: chips.length,
    chipText: chips.map(c => (c.textContent ?? '').trim()).join('|'),
    taglineCount: taglines.length,
    taglineText: taglines.map(p => (p.textContent ?? '').trim().slice(0, 24)).join('|'),
    taglineMeasure: taglines.map(p => p.getAttribute('data-measure') ?? 'absent').join('|'),
    order: inner ? Array.from(inner.children).map(kindOf).join(',') : 'no inner box',
    leakedAttrs: root
      ? Array.from(root.attributes)
          .map(a => a.name.toLowerCase())
          .filter(n => PROP_ATTRIBUTE_SPELLINGS.includes(n))
          .join(' ')
      : 'missing'
  }
}

const snapFor = (key: string): Snapshot | undefined => snaps.find(s => s.key === key)

/** One reading across all five cases, comma-joined — the shape probe 39 uses. */
const across = (read: (s: Snapshot) => string | number | boolean): string =>
  CASES.map((c) => {
    const s = snapFor(c.key)
    return s === undefined ? '?' : String(read(s))
  }).join(',')

let walking = false
let reported = false
const seen = reactive({ timedOut: false })

const settle = (): Promise<void> => nextTick()

const finalise = async () => {
  if (walking) return
  walking = true
  await settle()
  for (const c of CASES) snaps.push(snapshot(c.key))
  report()
}

const report = () => {
  if (reported) return
  reported = true

  const measureRef = document.querySelector<HTMLElement>('[data-probe-ref-measure]')
  const expectedMeasure = measureRef ? getComputedStyle(measureRef).maxInlineSize : 'no reference'
  const taglineEl = document.querySelector<HTMLElement>(
    '.bf-page-header[data-probe-case="tagline-string"] p.bf-page-header__tagline'
  )

  const crumbs = snapFor('crumbs-only')
  const strings = snapFor('chips-strings')
  const slotted = snapFor('chips-slot')
  const one = snapFor('tagline-string')
  const many = snapFor('tagline-array')

  const badNots = complexNotSelectors()
  const ownRules = pageHeaderRules()
  const pageH1s = Array.from(document.querySelectorAll('h1'))

  checks.value = [
    // --- 0. did the walk actually run? -------------------------------------
    {
      label: 'the walk completed, rather than being rescued by the timeout',
      expected: 'false',
      actual: String(seen.timedOut)
    },
    {
      label: '  …reading every one of the five permutations',
      expected: CASES.length,
      actual: snaps.length
    },
    {
      label: 'every permutation mounted a header',
      expected: CASES.map(() => true).join(','),
      actual: across(s => s.found)
    },

    // --- 1. the single <h1> — the spec’s headline acceptance ----------------
    {
      label: 'each header contributes EXACTLY ONE <h1>',
      expected: '1,1,1,1,1',
      actual: across(s => s.h1Count)
    },
    {
      label: '  …so the page carries exactly five, one per permutation',
      expected: 5,
      actual: pageH1s.length
    },
    {
      label: '  …and every <h1> on the page belongs to a bfPageHeader',
      expected: 5,
      actual: pageH1s.filter(h => h.closest('.bf-page-header') !== null).length
    },
    {
      label: 'the <h1> carries `heading` verbatim',
      expected: CASES.map(c => HEADINGS[c.key]).join(','),
      actual: across(s => s.h1Text)
    },
    {
      label: 'no header renders an <h2> — bfSection’s heading is not used here',
      expected: '0,0,0,0,0',
      actual: across(s => s.h2Count)
    },

    // --- 2. the bfSection composition --------------------------------------
    {
      label: 'the root is bfSection’s <section>, carrying both class names',
      expected: CASES.map(() => 'section|bf-page-header bf-section bf-section--padded').join(','),
      actual: across(s => `${s.rootTag}|${s.rootClasses}`)
    },
    {
      label: '  …`padded` as a modifier class, never an inline style (gh#48)',
      expected: 'false,false,false,false,false',
      actual: across(s => s.inlineStyle)
    },
    {
      label: '`label` reaches the root as data-label, default included',
      expected: [
        'Page header', 'Chips as strings', 'Chips via slot',
        'Tagline as a string', 'Tagline as an array'
      ].join(','),
      actual: across(s => s.dataLabel)
    },
    {
      /*
        Sorted, so the row does not depend on class order. `'|'` is U+007C and
        therefore sorts AFTER the letters — `center stack |`, not
        `| center stack`.
      */
      label: 'the inner box is bfSection’s `center | stack`',
      expected: CASES.map(() => ['center', '|', 'stack'].sort().join(' ')).join(','),
      actual: across(s => s.innerClasses)
    },
    {
      label: '  …with gap="s" passed through as data-gap',
      expected: 's,s,s,s,s',
      actual: across(s => s.innerGap)
    },
    {
      label: '  …which @layer composition resolves to a real rhythm',
      expected: 'true,true,true,true,true',
      actual: across(s => s.innerRhythm > 0)
    },
    {
      label: 'no prop reaches the DOM as an attribute',
      expected: ',,,,',
      actual: across(s => s.leakedAttrs)
    },

    // --- 3. crumbs ----------------------------------------------------------
    {
      label: 'the breadcrumb renders ONLY where crumbs were given',
      expected: 'true,false,false,false,false',
      actual: across(s => s.crumbNav)
    },
    {
      label: '  …with one <li> per crumb',
      expected: CRUMBS.length,
      actual: crumbs?.crumbItems ?? 'missing'
    },
    {
      label: '  …as a named landmark (bfBreadcrumb’s own aria-label)',
      expected: 'Breadcrumb',
      actual: crumbs?.crumbAriaLabel ?? 'missing'
    },
    {
      label: '  …with the last crumb marked aria-current="page"',
      expected: CRUMBS[CRUMBS.length - 1]?.label ?? '',
      actual: crumbs?.crumbCurrent ?? 'missing'
    },

    // --- 4. chips: strings, slot, and the union -----------------------------
    {
      label: 'the chip cluster renders in the two chip cases and NOWHERE else',
      expected: 'false,true,true,false,false',
      actual: across(s => s.cluster)
    },
    {
      label: '#162 — a #chips slot whose content is v-if’d away renders NO cluster',
      expected: 'false',
      actual: String(crumbs?.cluster ?? 'missing')
    },
    {
      label: 'chips-as-strings: one bfChip per non-empty string (the "" is dropped)',
      expected: 'Report|Democracy|Archive',
      actual: strings?.chipText ?? 'missing'
    },
    {
      label: '  …which is three chips, not four',
      expected: 3,
      actual: strings?.chipCount ?? 'missing'
    },
    {
      label: 'chips-via-slot: the string chip and the slot chips share ONE cluster',
      expected: 'Program|Podcast|Interactive',
      actual: slotted?.chipText ?? 'missing'
    },
    {
      label: '  …strings first, slot content after — the wf source’s order',
      expected: 3,
      actual: slotted?.chipCount ?? 'missing'
    },
    {
      label: 'the cluster is `.cluster` with data-gap="xs"',
      expected: 'xs,xs',
      actual: [strings?.clusterGapAttr, slotted?.clusterGapAttr].join(',')
    },
    {
      label: '  …resolved by @layer composition to a real gap',
      expected: 'true,true',
      actual: [
        (strings?.clusterGapPx ?? 0) > 0,
        (slotted?.clusterGapPx ?? 0) > 0
      ].join(',')
    },

    // --- 5. taglines --------------------------------------------------------
    {
      label: 'one <p> per tagline paragraph — none, one, or one per array entry',
      expected: '0,0,0,1,2',
      actual: across(s => s.taglineCount)
    },
    {
      label: '  …a string renders the string',
      expected: TAGLINE_ONE.slice(0, 24),
      actual: one?.taglineText ?? 'missing'
    },
    {
      label: '  …an array renders both entries, in order',
      expected: TAGLINE_MANY.map(t => t.slice(0, 24)).join('|'),
      actual: many?.taglineText ?? 'missing'
    },
    {
      label: 'every tagline carries data-measure="normal"',
      expected: 'normal,normal|normal',
      actual: [one?.taglineMeasure, many?.taglineMeasure].join(',')
    },
    {
      label: '  …and that really caps the line length, at a bare reference’s value',
      expected: expectedMeasure,
      actual: taglineEl ? getComputedStyle(taglineEl).maxInlineSize : 'missing'
    },

    // --- 6. render order ----------------------------------------------------
    {
      label: 'render order is crumbs → chips → h1 → taglines → default slot',
      expected: [
        'crumbs,h1',
        'chips,h1',
        'chips,h1',
        'h1,tagline',
        'h1,tagline,tagline,slot'
      ].join(' / '),
      actual: CASES.map(c => snapFor(c.key)?.order ?? 'missing').join(' / ')
    },

    // --- 7. styling: none of its own ---------------------------------------
    {
      label: 'the component ships no stylesheet — no rule anywhere selects bf-page-header',
      expected: 0,
      actual: ownRules.length === 0 ? 0 : ownRules.join(' ; ')
    },
    {
      label: 'no bf-* rule uses :not() with a complex selector (D-20.5)',
      expected: 0,
      actual: badNots.length === 0 ? 0 : badNots.join(' ; ')
    }
  ]
}

onMounted(() => {
  void finalise()
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
  <main
    class="probe"
    data-probe="38"
    :data-probe-verdict="state.toUpperCase()"
  >
    <!--
      A <p>, not an <h1>. This page's five <h1>s all belong to the component
      under test, and the spec's acceptance counts them — see the file header.
    -->
    <p class="probe__title">
      Probe 38 — <code>bfPageHeader</code>
    </p>
    <p class="probe__lede">
      Five permutations, one per prop: crumbs only, chips as strings, chips via
      the slot, a string tagline and an array of them. Each renders exactly one
      <code>&lt;h1&gt;</code>, so the page carries five. The first case also
      passes a <code>#chips</code> slot whose only child is
      <code>v-if="false"</code> — the control for residual #162.
    </p>

    <!--
      The measure reference is a `<p>`, not a `<div>`: `data-measure` resolves to
      `75ch`, and `ch` is a font-relative unit, so the reference has to share the
      taglines' font. `base/typography.css` gives `p` its own `font-size:
      var(--size-0)` and `font-weight: 100`, which a bare `<div>` does not
      inherit — measured at 750.81px against the `<div>`'s 667.38px, a real
      1.125x difference in the reference rather than a wrong cap on the tagline.
    -->
    <p data-measure="normal" data-probe-ref-measure aria-hidden="true" />

    <section class="probe__gallery" aria-labelledby="cases-heading">
      <h2 id="cases-heading">The five permutations</h2>

      <!-- 1 — crumbs only, plus the #162 control -->
      <bfPageHeader
        :crumbs="CRUMBS"
        :heading="HEADINGS['crumbs-only']"
        data-probe-case="crumbs-only"
      >
        <template #chips>
          <bfChip v-if="neverTrue">Never rendered</bfChip>
        </template>
      </bfPageHeader>

      <!-- 2 — chips as strings -->
      <bfPageHeader
        label="Chips as strings"
        :chips="STRING_CHIPS"
        :heading="HEADINGS['chips-strings']"
        data-probe-case="chips-strings"
      />

      <!-- 3 — chips via the slot, alongside one string: one cluster, not two -->
      <bfPageHeader
        label="Chips via slot"
        :chips="['Program']"
        :heading="HEADINGS['chips-slot']"
        data-probe-case="chips-slot"
      >
        <template #chips>
          <bfChip to="/insights?format=podcast">Podcast</bfChip>
          <bfChip toggle>Interactive</bfChip>
        </template>
      </bfPageHeader>

      <!-- 4 — tagline as a string -->
      <bfPageHeader
        label="Tagline as a string"
        :heading="HEADINGS['tagline-string']"
        :tagline="TAGLINE_ONE"
        data-probe-case="tagline-string"
      />

      <!-- 5 — tagline as an array, with default-slot content after it -->
      <bfPageHeader
        label="Tagline as an array"
        :heading="HEADINGS['tagline-array']"
        :tagline="TAGLINE_MANY"
        data-probe-case="tagline-array"
      >
        <p class="probe__byline">
          The default slot lands last — by-lines, meta rows, header actions, and
          the <code>/search</code> template’s input.
        </p>
      </bfPageHeader>
    </section>

    <section class="probe__report" aria-labelledby="report-heading">
      <h2 id="report-heading">Report</h2>
      <p
        class="probe__verdict"
        :data-state="state"
        data-testid="probe-38-verdict"
      >
        {{ verdict }}
      </p>

      <table class="probe__table" data-testid="probe-38-table">
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

      <ul class="probe__legend">
        <li v-for="c in CASES" :key="c.key">
          <code>{{ c.key }}</code> — {{ c.note }}
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.probe {
  padding-block: var(--space-l, 2rem);
  min-block-size: 100dvh;
  overflow-x: clip;
}

.probe__title {
  font-size: var(--size-3, 1.75rem);
  font-weight: 700;
}

/*
  Selected as `.bf-section` rather than `.bf-page-header` on purpose: the report
  asserts that **no rule anywhere** selects `bf-page-header`, and a scoped rule
  in this file would be found by that walker and read as the component having
  grown a stylesheet. The roots carry both class names, so this frames the same
  five elements without touching the name under test.
*/
.probe__gallery > .bf-section {
  outline: 1px dashed currentcolor;
  outline-offset: -1px;
}

.probe__lede,
.probe__byline {
  max-inline-size: 75ch;
}
</style>
