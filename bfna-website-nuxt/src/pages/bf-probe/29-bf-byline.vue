<script setup lang="ts">
/**
 * Probe — issue 29 / gh#38: `bfByline`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## What it proves
 *
 * 1. **The spec's two named forms** — author-only and author+date — plus nine
 *    the spec did not name, every one of which the real snapshot can produce:
 *    a two-name joined string, a `null` date, an unparseable date, an empty
 *    author with and without a date, a whitespace-only author, and the empty
 *    string.
 * 2. **The empty-author decision, as a machine check.** 268 of the 371 rows in
 *    `content/bf/insights/` carry an empty `authors` array, so `''` is the
 *    ordinary input here. `By ` never renders with nothing after it, and the
 *    wireframe's literal `[author]` placeholder appears nowhere in the output.
 * 3. **No phantom paragraph.** A byline with neither a usable author nor a
 *    usable date renders **no element at all** — not an empty `<p>`, which
 *    would be a flex container contributing a `gap` to its parent on three
 *    insight pages out of four. Asserted per case by counting elements inside
 *    an always-present slot wrapper, which a `v-if`'s comment placeholder
 *    cannot satisfy.
 * 4. **The mirrored date guard agrees with `bfTime`.** `bfByline` duplicates
 *    `bfTime`'s trim-parse-`NaN` rule to decide whether it has anything to
 *    render. That duplication is checked rather than trusted: § 4 asserts the
 *    biconditional — a `<p>` exists **if and only if** something rendered
 *    inside it — from the DOM alone, so a future drift between the two guards
 *    fails this probe instead of shipping.
 * 5. **`data-gap` is not inert.** The component's own gap hook chains through
 *    the composition layer's `--_cluster-space` rather than overriding it, so
 *    the documented `data-gap` API still works on this component — and a
 *    consumer setting `--_bf-byline-gap` directly still wins over it. Both
 *    directions are measured against reference `.cluster` elements rather than
 *    against a hard-coded pixel value.
 * 6. **The naming collision does not exist.** § 6 renders the legacy
 *    footer-credit organism beside `bfByline` and asserts they resolved to two
 *    different components with two different tag names and two different
 *    contents. The legacy file is not imported, not renamed and not edited;
 *    it is referenced only through its own auto-import tag.
 *
 * ## Real data, not invented data
 *
 * Every author string below is a real `authors` array from
 * `content/bf/insights/`, joined the way the frozen
 * `insights/[slug].vue:8` joins it, and every date is that row's real
 * `publish_date`. The snapshot holds 103 rows with authors and 268 without;
 * the multi-author row is the only one in the snapshot with two names.
 *
 * ## Timezone discipline
 *
 * `monthYear` parses a date-only string as UTC midnight and formats it in the
 * runtime's local zone, so a first-of-month date can label as the previous
 * month west of Greenwich (see probe 18). No asserted label here is at a month
 * boundary — the three dates used are the 14th, the 18th and the 17th.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 29`,
 * per the gh#20–#37 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
defineOptions({ name: 'BfProbe29BfByline' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 29 — bfByline'
})

/**
 * `undefined` is assignable to `BylineProps['date']` — the prop is optional —
 * but not to `author`, which is required and is the point of the component.
 * The untyped-data-path case is exercised through one deliberate, single-site
 * cast rather than left untested.
 */
const UNDEFINED_AUTHOR = undefined as unknown as string

/** One case: what goes in, and what must come out. */
interface Case {
  key: string
  author: string
  date?: string | null
  /** Human description of the inputs, for the gallery. */
  shown: string
  /** Where the values come from. */
  note: string
  /** Does the `<p class="bf-byline">` render at all? */
  renders: boolean
  /** Does the `By …` span render? */
  showsAuthor: boolean
  /** Does a `<time>` render inside it? */
  showsDate: boolean
  /** Expected full text of the byline, when timezone-invariant. `null` = unasserted. */
  text: string | null
}

const cases: Case[] = [
  {
    key: 'author-and-date',
    author: 'Anthony T. Silberfeld',
    date: '2018-02-14',
    shown: "'Anthony T. Silberfeld' + '2018-02-14'",
    note: 'real — a-new-constellation; the spec’s author+date form',
    renders: true,
    showsAuthor: true,
    showsDate: true,
    text: 'By Anthony T. Silberfeld Feb 2018'
  },
  {
    key: 'multi-author',
    author: 'Courtney Flynn Martino, Brandon Bohrn',
    date: '2023-01-18',
    shown: "'Courtney Flynn Martino, Brandon Bohrn' + '2023-01-18'",
    note: 'real — the-ukraine-crisis…; the only two-name row, joined by the caller',
    renders: true,
    showsAuthor: true,
    showsDate: true,
    text: 'By Courtney Flynn Martino, Brandon Bohrn Jan 2023'
  },
  {
    key: 'author-only',
    author: 'Anthony T. Silberfeld',
    shown: "'Anthony T. Silberfeld', date omitted",
    note: 'the spec’s author-only form',
    renders: true,
    showsAuthor: true,
    showsDate: false,
    text: 'By Anthony T. Silberfeld'
  },
  {
    key: 'author-null-date',
    author: 'Anthony T. Silberfeld',
    date: null,
    shown: "'Anthony T. Silberfeld' + null",
    note: 'publish_date is nullable — 20 of the 371 rows',
    renders: true,
    showsAuthor: true,
    showsDate: false,
    text: 'By Anthony T. Silberfeld'
  },
  {
    key: 'author-unparseable-date',
    author: 'Anthony T. Silberfeld',
    date: 'not-a-date',
    shown: "'Anthony T. Silberfeld' + 'not-a-date'",
    note: 'the mirrored guard and bfTime must agree that this date is absent',
    renders: true,
    showsAuthor: true,
    showsDate: false,
    text: 'By Anthony T. Silberfeld'
  },
  {
    key: 'empty-author-with-date',
    author: '',
    date: '2014-12-17',
    shown: "'' + '2014-12-17'",
    note: 'real — 12-days-of-christmas-in-europe; a dateline, not a broken byline',
    renders: true,
    showsAuthor: false,
    showsDate: true,
    text: 'Dec 2014'
  },
  {
    key: 'whitespace-author-with-date',
    author: '   ',
    date: '2014-12-17',
    shown: "'   ' + '2014-12-17'",
    note: "what ['', ''].join(', ') and a stray space both reach",
    renders: true,
    showsAuthor: false,
    showsDate: true,
    text: 'Dec 2014'
  },
  {
    key: 'empty-author-no-date',
    author: '',
    shown: "'' , date omitted",
    note: 'the common path — 268 of 371 rows carry no author',
    renders: false,
    showsAuthor: false,
    showsDate: false,
    text: null
  },
  {
    key: 'whitespace-author-null-date',
    author: '   ',
    date: null,
    shown: "'   ' + null",
    note: 'trimmed to nothing before anything else runs',
    renders: false,
    showsAuthor: false,
    showsDate: false,
    text: null
  },
  {
    key: 'empty-author-empty-date',
    author: '',
    date: '',
    shown: "'' + ''",
    note: 'both halves empty strings, not nullish',
    renders: false,
    showsAuthor: false,
    showsDate: false,
    text: null
  },
  {
    key: 'empty-author-unparseable-date',
    author: '',
    date: 'not-a-date',
    shown: "'' + 'not-a-date'",
    note: 'neither half usable — the phantom-paragraph case',
    renders: false,
    showsAuthor: false,
    showsDate: false,
    text: null
  },
  {
    key: 'undefined-author',
    author: UNDEFINED_AUTHOR,
    date: '2014-12-17',
    shown: 'undefined + \'2014-12-17\'',
    note: 'not typeable, but reachable from an untyped data path',
    renders: true,
    showsAuthor: false,
    showsDate: true,
    text: 'Dec 2014'
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

  /** The rendered byline for a case, or `null` when it correctly rendered nothing. */
  const el = (key: string) =>
    slot(key)?.querySelector<HTMLElement>('.bf-byline') ?? null

  const rendered = renderingCases
    .map(c => el(c.key))
    .filter((e): e is HTMLElement => e !== null)

  /**
   * Walk every reachable stylesheet — `@import`ed ones included, since
   * `/css/styles.css` is nothing but a list of imports — for a `.bf-byline`
   * style rule whose ancestry includes a `@layer components` block.
   * Cross-origin sheets throw on `cssRules`; they are skipped, not failed, so
   * the Google Fonts link does not sink the check. Matched as a whole class
   * token, so `.bf-byline__author` cannot keep this green after the real rule
   * was renamed away. (Same helper as probes 14–18 and 28.)
   */
  const layeredBfBylineRuleFound = (): boolean => {
    const LAYER_BLOCK = globalThis.CSSLayerBlockRule
    if (!LAYER_BLOCK) return false

    const selector = /\.bf-byline(?![\w-])/

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

  const gap = (e: Element | null) => (e ? getComputedStyle(e).columnGap : 'missing')

  const refXs = document.querySelector('[data-probe-ref="cluster-xs"]')
  const refL = document.querySelector('[data-probe-ref="cluster-l"]')

  const gapDefault = document.querySelector('[data-probe-gap="default"] .bf-byline')
  const gapAttr = document.querySelector('[data-probe-gap="attr"] .bf-byline')
  const gapVar = document.querySelector('[data-probe-gap="var"] .bf-byline')

  /* --- § 6, the collision section ---------------------------------------- */
  const collision = document.querySelector<HTMLElement>('.probe__collision')
  const bfInCollision = collision?.querySelector<HTMLElement>('.bf-byline') ?? null
  const ccmInCollision = collision?.querySelector<HTMLElement>('.by-line') ?? null

  /**
   * The gallery's own markup, used for the "`[author]` never leaked into the
   * output" row. Scoped to the gallery on purpose: the prose elsewhere on this
   * page discusses that placeholder by name, and a page-wide scan would fail
   * on the documentation rather than on the component.
   */
  const galleryMarkup = gallery?.innerHTML ?? ''

  const results: Check[] = [
    // --- 1. the right number of elements exist, and only those --------------
    {
      label: `${renderingCases.length} inputs render a byline`,
      expected: renderingCases.length,
      actual: rendered.length
    },
    {
      label: `${blankCases.length} inputs render none — gallery-wide element count matches`,
      expected: renderingCases.length,
      actual: gallery?.querySelectorAll('.bf-byline').length ?? -1
    },
    {
      label: 'every rendered byline is a <p>, not a div or a span',
      expected: renderingCases.length,
      actual: rendered.filter(e => e.tagName === 'P').length
    },
    {
      label: 'every rendered byline carries the cluster composition class',
      expected: renderingCases.length,
      actual: rendered.filter(e => e.classList.contains('cluster')).length
    },

    // --- 2. per-case: does the wrapper render at all? -----------------------
    ...cases.map(c => ({
      label: `case ${c.key} (${c.shown}) → ${c.renders ? 'renders' : 'renders NOTHING'}`,
      expected: c.renders ? 1 : 0,
      actual: slot(c.key)?.querySelectorAll('.bf-byline').length ?? -1
    })),

    // --- 3. per-case: which halves are inside it ---------------------------
    ...cases.map(c => ({
      label: `  …case ${c.key} author span`,
      expected: c.showsAuthor ? 1 : 0,
      actual: slot(c.key)?.querySelectorAll('.bf-byline__author').length ?? -1
    })),
    ...cases.map(c => ({
      label: `  …case ${c.key} <time>`,
      expected: c.showsDate ? 1 : 0,
      // Selected on BOTH classes: `bf-time` is the atom's own, `bf-byline__date`
      // is this component's fallthrough hook. Requiring the pair asserts that
      // Vue merged the two rather than one replacing the other — which is what
      // makes `.bf-byline__date` a real seam a consumer can style, rather than
      // a class that happens to be typed in a template.
      actual: slot(c.key)?.querySelectorAll('.bf-byline time.bf-time.bf-byline__date').length ?? -1
    })),
    ...cases
      .filter(c => c.text !== null)
      .map(c => ({
        label: `  …case ${c.key} text`,
        expected: c.text as string,
        actual: (el(c.key)?.textContent ?? 'missing').replace(/\s+/g, ' ').trim()
      })),

    // --- 4. the invariant: the wrapper exists iff something is in it -------
    //
    // This is the row that keeps the duplicated date guard honest. It is read
    // from the DOM, not from the case table, so it holds for inputs nobody
    // thought to enumerate: a `<p>` with no element children is a phantom, and
    // a case that rendered a half without a wrapper is impossible markup.
    {
      label: 'no rendered byline is empty (wrapper ⇒ at least one child element)',
      expected: 0,
      actual: rendered.filter(e => e.childElementCount === 0).length
    },
    {
      label: '  …and every rendered half is inside a byline (child ⇒ wrapper)',
      expected: 0,
      actual: Array.from(
        gallery?.querySelectorAll('.bf-byline__author, .bf-time') ?? []
      ).filter(e => e.closest('.bf-byline') === null).length
    },
    {
      label: 'the mirrored date guard agrees with bfTime, per case',
      expected: cases.map(c => (c.showsDate ? '1' : '0')).join(''),
      actual: cases
        .map(c => String(slot(c.key)?.querySelectorAll('.bf-time').length ?? -1))
        .join('')
    },

    // --- 5. the empty-author decision --------------------------------------
    {
      label: 'no author span reads "By" with nothing after it',
      expected: 0,
      actual: Array.from(gallery?.querySelectorAll('.bf-byline__author') ?? [])
        .filter(e => (e.textContent ?? '').trim().replace(/\s+/g, ' ') === 'By')
        .length
    },
    {
      label: 'the wireframe placeholder [author] appears nowhere in the gallery',
      expected: 'true',
      actual: String(!galleryMarkup.includes('[author]'))
    },
    {
      label: 'every author span starts with "By "',
      expected: cases.filter(c => c.showsAuthor).length,
      actual: Array.from(gallery?.querySelectorAll('.bf-byline__author') ?? [])
        .filter(e => (e.textContent ?? '').startsWith('By '))
        .length
    },

    // --- 6. the naming collision, resolved ---------------------------------
    {
      label: 'bfByline resolved and rendered in the collision section',
      expected: 1,
      actual: bfInCollision ? 1 : 0
    },
    {
      label: 'the legacy footer credit resolved and rendered beside it',
      expected: 1,
      actual: ccmInCollision ? 1 : 0
    },
    {
      label: '  …they are two different elements',
      expected: 'true',
      actual: String(
        bfInCollision !== null && ccmInCollision !== null && bfInCollision !== ccmInCollision
      )
    },
    {
      label: '  …with different tag names (P vs DIV)',
      expected: 'P|DIV',
      actual: `${bfInCollision?.tagName ?? 'missing'}|${ccmInCollision?.tagName ?? 'missing'}`
    },
    {
      label: '  …and neither one rendered the other’s content',
      expected: 'true',
      actual: String(
        (bfInCollision?.textContent ?? '').includes('By ')
        && !(bfInCollision?.textContent ?? '').includes('©')
        && (ccmInCollision?.textContent ?? '').includes('©')
        && !(ccmInCollision?.textContent ?? '').includes('By ')
      )
    },

    // --- 7. the gap hook chains through the composition layer ---------------
    {
      label: 'default gap resolves to the same value as .cluster[data-gap="xs"]',
      expected: gap(refXs),
      actual: gap(gapDefault)
    },
    {
      label: 'data-gap="l" from a consumer is NOT inert — it reaches the gap',
      expected: gap(refL),
      actual: gap(gapAttr)
    },
    {
      label: '  …and it actually changed something (xs ≠ l)',
      expected: 'true',
      actual: String(gap(refXs) !== gap(refL) && gap(gapDefault) !== gap(gapAttr))
    },
    {
      label: 'a consumer rule setting --_bf-byline-gap overrides data-gap="l"',
      expected: gap(refXs),
      actual: gap(gapVar)
    },

    // --- 8. styling discipline ---------------------------------------------
    {
      label: '.bf-byline rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(layeredBfBylineRuleFound())
    },
    {
      label: 'every instance resolves align-items: baseline from that rule',
      expected: renderingCases.length,
      actual: rendered.filter(e => getComputedStyle(e).alignItems === 'baseline').length
    },
    {
      label: 'the component contributes no inline style of its own',
      expected: 0,
      actual: rendered.filter(e => e.getAttribute('style') !== null).length
    },
    {
      label: 'no rendered byline declares a colour of its own (inherits)',
      expected: 1,
      actual: new Set(rendered.map(e => getComputedStyle(e).color)).size
    },

    // --- 9. $attrs fallthrough ---------------------------------------------
    {
      label: '$attrs fallthrough reaches the rendered <p> (data-probe-case)',
      expected: renderingCases.map(c => c.key).join(','),
      actual: rendered.map(e => e.dataset.probeCase ?? '').join(',')
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
    data-probe="29"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 29 — <code>bfByline</code></h1>
    <p class="probe__lede">
      The article byline: an author line, and optionally a date rendered through
      <code>bfTime</code>. Author-only and author+date are the two forms the
      spec names; the nine cases after them are the ones the real snapshot
      produces.
    </p>
    <p class="probe__lede">
      <strong>268 of the 371 rows</strong> in <code>content/bf/insights/</code>
      carry an empty <code>authors</code> array. The frozen wireframe fills that
      gap with the literal string <code>By [author]</code>, which is the right
      answer on a wireframe and a bug on a website. Here an empty author renders
      no <code>By</code> text at all — and a byline with neither a usable author
      nor a usable date renders <strong>no element</strong>, rather than an
      empty flex container that would contribute a phantom
      <code>gap</code> to the page header around it.
    </p>

    <section class="probe__gallery" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading">Twelve inputs</h2>

      <table class="probe__table">
        <thead>
          <tr>
            <th scope="col">Props</th>
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
              <bfByline
                :author="c.author"
                :date="c.date"
                :data-probe-case="c.key"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!--
      Everything below is outside `.probe__gallery` on purpose: the element
      counts above enumerate exactly the twelve cases, so no extra instance may
      be swept into that set. (Same arrangement as probes 17, 18 and 28.)
    -->

    <section class="probe__collision" aria-labelledby="collision-heading">
      <h2 id="collision-heading">The naming collision that is not one</h2>
      <p class="probe__lede">
        Nuxt builds a component's registered name by walking the configured
        prefix against the file name and stopping as soon as the two agree. The
        legacy footer-credit organism's file name already begins with its
        directory's <code>ccm</code> prefix, so the prefix is dropped and it
        registers under its own name; <code>components/bf/Byline.vue</code>
        takes the <code>bf</code> prefix and registers as
        <code>BfByline</code>. Two identifiers, two kebab tags, one registry —
        which is why the resolution to the collision is to change
        <em>nothing</em> about the legacy file.
      </p>
      <p class="probe__lede">
        Both are rendered here, side by side, and asserted to be two different
        elements with two different contents. That is the check; the file itself
        is untouched, and this page is the only thing in the epic that names
        them together.
      </p>
      <div class="probe__slot">
        <bfByline author="Anthony T. Silberfeld" date="2018-02-14" />
      </div>
      <div class="probe__slot">
        <ccm-by-line />
      </div>
    </section>

    <section class="probe__gaps" aria-labelledby="gaps-heading">
      <h2 id="gaps-heading">The gap hook, and why it chains</h2>
      <p class="probe__lede">
        <code>--_bf-byline-gap</code> reads <code>--_cluster-space</code> as its
        default instead of replacing it. A flat declaration would have worked
        and would have been a trap: <code>@layer components</code> outranks
        <code>@layer composition</code>, so the component's own rule would beat
        <code>.cluster[data-gap]</code> and silently make the documented
        composition API inert on this component. The three instances below are
        measured against the two reference clusters, not against pixel values.
      </p>

      <div class="probe__slot" data-probe-gap="default">
        <bfByline author="Anthony T. Silberfeld" date="2018-02-14" />
      </div>
      <div class="probe__slot" data-probe-gap="attr">
        <bfByline author="Anthony T. Silberfeld" date="2018-02-14" data-gap="l" />
      </div>
      <div class="probe__slot probe__gap-var" data-probe-gap="var">
        <bfByline author="Anthony T. Silberfeld" date="2018-02-14" data-gap="l" />
      </div>

      <!--
        The references. Plain composition-layer clusters, so the expected gap
        is whatever the design system actually resolves `xs` and `l` to on this
        page — never a number typed into this file.
      -->
      <p class="cluster" data-gap="xs" data-probe-ref="cluster-xs"><span>xs</span><span>reference</span></p>
      <p class="cluster" data-gap="l" data-probe-ref="cluster-l"><span>l</span><span>reference</span></p>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-29-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-29-table">
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
  margin-block-end: var(--space-2xs, 0.5rem);
}

/*
  The consumer override, written the way a real consumer would write it: inside
  `@layer components`, where it beats the component's own default on
  specificity rather than by escaping the layer system. It is applied to an
  instance that ALSO carries `data-gap="l"`, so the row it feeds proves the
  precedence between the two routes rather than merely that one of them works.

  No `:not()` here or anywhere in this file — D-20.5 (gh#29).
*/
@layer components {
  .probe__gap-var .bf-byline {
    --_bf-byline-gap: var(--space-xs);
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
