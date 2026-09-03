<script setup lang="ts">
/**
 * Probe — issue 25 / gh#34: `bfCardProgram`.
 *
 * Dev-only route, never linked from nav; only the final cutover issue (#68)
 * removes `bf-probe/`. Follows the #109 harness convention
 * (`docs/decisions/probe-harness.md`): `[data-probe-verdict]` on the root,
 * `[data-probe-row][data-ok]` on every row, run by
 * `npx tsx scripts/check-probes.ts --only 25`.
 *
 * ## The three real `bfPrograms` documents, queried here and only here
 *
 * `bfCardProgram` is presentational-only (BRIEF D8) — it fetches nothing. The
 * **page** queries `bfPrograms`, which is what issue 47's home page will do for
 * its "Programs" band. There are exactly three documents and their slugs are
 * final (BRIEF §8), so this probe asserts them **by name** rather than by
 * count: a normaliser that renamed one would otherwise still pass a "3 rows"
 * check.
 *
 * The row container is `<ul class="switcher" data-gap="m">` — parity with
 * `pages/wireframes/index.vue:21-24`, the frozen slot this card ports.
 *
 * ## What it proves
 *
 * 1. all three real programmes render, with the heading text and the tagline
 *    **verbatim** from the row — and the tagline is the schema field, not the
 *    `intro` and not a first-sentence split done in the component (the whole
 *    point of the defect being fixed: the derivation lives in the normaliser);
 * 2. **the hub hrefs**: each card's anchor is `/<slug>` for the three final
 *    slugs, and no anchor anywhere on the page points into `/wireframes/…`;
 * 3. the card is a real link surface — `bfCard`'s stretched `::after` resolves
 *    on the heading anchor and the card's corner hit-tests to that anchor;
 * 4. the switcher lays all three out on one row and honours `data-gap` (D9),
 *    resolving the same gap as a `data-gap="m"` grid;
 * 5. **no media box** — `bfProgramSchema` carries an `image` and this card
 *    deliberately renders none;
 * 6. `headingLevel` (#128) renders h2/h3/h4; a blank `name` renders no heading
 *    **and no anchor** (#130), and an empty `tagline` renders no empty `<p>`;
 * 7. the wrapper owns no DOM: its rendered root *is* `bfCard`'s
 *    `<li class="bf-card">`, it adds no class of its own, and `$attrs` — a
 *    caller `class`, a `data-*`, and the `span` **prop** — reach the base
 *    through it.
 *
 * No keys are dispatched, so this page declares no `data-probe-keys`: the
 * anchor's focusability is asserted with `.focus()`, which is the right tool
 * for "can this element take focus" (D-4 of the harness decision).
 */
import type { Program } from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe25BfCardProgram' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 25 — bfCardProgram'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/**
 * The three final programme slugs, sorted — BRIEF §8, "resolved": `democracy`,
 * `transatlantic-relations-global-challenges`, `future-leadership`. Written out
 * so the assertion names them; a count would pass a rename.
 */
const PROGRAM_SLUGS = [
  'democracy',
  'future-leadership',
  'transatlantic-relations-global-challenges'
]

const { data } = await useAsyncData('bf-probe-25', () =>
  queryCollection('bfPrograms').all()
)

/*
 * An assignability check, not a cast. If `bfProgramSchema` ever drifts from the
 * `Program` type this line stops compiling — which is the point of the
 * component taking the entity rather than the inline `{slug,name,tagline?,
 * short?}` shape `wfCardProgram.vue` declared.
 *
 * Sorted by slug so the card keys and `data-probe-card` values are stable
 * across builds: the collection carries no ordinal.
 */
const programs = computed<Program[]>(() =>
  [...(data.value ?? [])].sort((a, b) => a.slug.localeCompare(b.slug))
)

/** The contract cards are all built from one real row. */
const first = computed<Program | null>(() => programs.value[0] ?? null)

/**
 * A blank `name`. `bfProgramSchema` types it non-nullable, so this is the empty
 * string rather than `null` — the only blank the type permits, and the one the
 * component's `hasName` guard exists for.
 */
const firstNoName = computed<Program | null>(() => {
  const row = first.value
  return row ? { ...row, name: '' } : null
})

/** Likewise for the tagline: the empty-string branch of the `v-if`. */
const firstNoTagline = computed<Program | null>(() => {
  const row = first.value
  return row ? { ...row, tagline: '' } : null
})

/**
 * A tagline the data does not carry, to prove the component **reads the field**
 * rather than re-deriving a first sentence from `intro` the way
 * `pages/wireframes/index.vue:65` does. The `intro` is left untouched, so a
 * component that derived would render something else entirely.
 */
const SENTINEL_TAGLINE = 'Probe sentinel tagline — read from the field.'

const firstSentinel = computed<Program | null>(() => {
  const row = first.value
  return row ? { ...row, tagline: SENTINEL_TAGLINE } : null
})

const checks = ref<Check[]>([])

onMounted(() => {
  const rowEls = Array.from(
    document.querySelectorAll<HTMLElement>('.probe__row > .bf-card')
  )
  const allEls = Array.from(
    document.querySelectorAll<HTMLElement>('.probe__cards > .bf-card')
  )

  const card = (key: string) =>
    document.querySelector<HTMLElement>(`.probe__cards > [data-probe-card="${key}"]`)

  /* `:is(h2, h3, h4)` — the three levels `bfCard` styles (D-20.4). */
  const headingEl = (el: HTMLElement | null) =>
    el?.querySelector<HTMLElement>(':scope > :is(h2, h3, h4)') ?? null

  const linkEl = (el: HTMLElement | null) =>
    el?.querySelector<HTMLAnchorElement>(':scope > :is(h2, h3, h4) a') ?? null

  const bodyOf = (el: HTMLElement | null) =>
    (el?.querySelector<HTMLElement>(':scope > p')?.textContent ?? '').trim()

  const headingIsFirst = (el: HTMLElement) => {
    const firstChild = el.children[0]
    return !!firstChild && firstChild === headingEl(el)
  }

  /**
   * The stretched overlay, hit-tested. Six pixels in from the card's
   * bottom-right corner is inside the border and clear of the text; on a linked
   * card that point must resolve to the heading anchor (through its `::after`,
   * which hit-tests as the anchor itself).
   */
  const hitTestCorner = (el: HTMLElement | null) => {
    if (!el) return 'missing card'
    el.scrollIntoView({ block: 'end' })
    const rect = el.getBoundingClientRect()
    const x = Math.min(Math.max(rect.right - 6, 1), window.innerWidth - 1)
    const y = Math.min(Math.max(rect.bottom - 6, 1), window.innerHeight - 1)
    const hit = document.elementFromPoint(x, y)
    if (!hit) return 'null'
    const anchor = hit.closest('a')
    if (!anchor) return `not a link (${hit.tagName})`
    return anchor === linkEl(el) ? 'the heading link' : 'a different link'
  }

  const rowEl = document.querySelector<HTMLElement>('.probe__row')
  const gridEl = document.querySelector<HTMLElement>('.probe__variants')
  const level2 = card('level2')
  const level4 = card('level4')
  const noname = card('noname')
  const notagline = card('notagline')
  const sentinel = card('sentinel')
  const spanned = card('spanned')

  const rows = programs.value
  const rowCard = (i: number): HTMLElement | null => rowEls[i] ?? null

  const nameMismatches = rows
    .filter((row, i) => (headingEl(rowCard(i))?.textContent ?? '').trim() !== row.name)
    .map(row => row.slug)

  const taglineMismatches = rows
    .filter((row, i) => bodyOf(rowCard(i)) !== row.tagline)
    .map(row => row.slug)

  /** The href contract, per card: what the anchor must say, and what it says. */
  const hrefMismatches = rows
    .filter((row, i) => linkEl(rowCard(i))?.getAttribute('href') !== `/${row.slug}`)
    .map(row => row.slug)

  /* One flex row: every card's top edge within a pixel of every other's. */
  const rowTops = rowEls.map(el => Math.round(el.getBoundingClientRect().top))
  const oneRow = rowTops.length > 0
    && Math.max(...rowTops) - Math.min(...rowTops) <= 1

  const rowStyle = rowEl ? getComputedStyle(rowEl) : null
  const gridStyle = gridEl ? getComputedStyle(gridEl) : null
  const rowGap = parseFloat(rowStyle?.columnGap ?? '0') || 0
  const gridGap = parseFloat(gridStyle?.columnGap ?? '0') || 0

  /** `.focus()` on the heading anchor, then whether focus actually moved. */
  const focusAttempt = (el: HTMLElement | null) => {
    const a = linkEl(el)
    if (!a) return 'missing link'
    a.focus()
    return document.activeElement === a ? 'the link is focused' : 'focus did not land'
  }

  checks.value = [
    // --- 0. the real collection -------------------------------------------
    {
      label: 'the page queried all 3 bfPrograms rows',
      expected: 3,
      actual: programs.value.length
    },
    {
      label: '  …and they are the three final slugs (BRIEF §8), by name',
      expected: PROGRAM_SLUGS.join(','),
      actual: programs.value.map(p => p.slug).join(',')
    },
    {
      label: '  …each carrying a non-empty tagline as a real schema field',
      expected: 3,
      actual: programs.value.filter(p => typeof p.tagline === 'string' && p.tagline.trim() !== '').length
    },
    {
      label: 'the switcher renders one card per programme',
      expected: 3,
      actual: rowEls.length
    },

    // --- 1. the wrapper owns no DOM ---------------------------------------
    {
      label: 'the card group is a <ul>',
      expected: 'UL',
      actual: rowEl?.tagName ?? 'missing'
    },
    {
      label: 'the wrapper\'s root IS bfCard\'s <li class="bf-card">',
      expected: allEls.length,
      actual: allEls.filter(el => el.tagName === 'LI').length
    },
    {
      label: 'the wrapper adds no element and no class of its own',
      expected: 0,
      actual: document.querySelectorAll('[class*="card-program" i], [class*="cardProgram"]').length
    },
    {
      label: 'heading-first DOM order, on every card that has a heading',
      expected: allEls.filter(el => headingEl(el)).length,
      actual: allEls.filter(el => headingIsFirst(el)).length
    },
    {
      label: 'no card carries an inline style attribute',
      expected: 0,
      actual: allEls.filter(el => el.getAttribute('style') !== null).length
    },
    {
      label: 'no card renders a frozen wireframe class',
      expected: 0,
      actual: document.querySelectorAll('.probe__cards .wf-card, .probe__cards .wf-media, .probe__cards .wf-chip').length
    },
    {
      label: 'the card renders no chips element',
      expected: 0,
      actual: document.querySelectorAll('.probe__cards .bf-card__chips').length
    },
    {
      label: 'and no media box, though every programme row carries an image',
      expected: 0,
      actual: document.querySelectorAll('.probe__cards .bf-card__media').length
    },
    {
      label: '  …the check is not vacuous: the rows really do carry images',
      expected: 3,
      actual: programs.value.filter(p => !!p.image).length
    },

    // --- 2. the switcher row ------------------------------------------------
    {
      label: 'the row is a .switcher',
      expected: 'true',
      actual: String(!!rowEl?.classList.contains('switcher'))
    },
    {
      label: '  …laid out as flex',
      expected: 'flex',
      actual: rowStyle?.display ?? 'missing'
    },
    {
      label: '  …with all three cards on one line',
      expected: 'true',
      actual: String(oneRow)
    },
    {
      label: '  …honouring data-gap="m" (D9): a non-zero gap',
      expected: 'true',
      actual: String(rowGap > 0)
    },
    {
      label: '  …the same gap a data-gap="m" grid resolves',
      expected: gridGap,
      actual: rowGap
    },
    {
      label: '  …and no hand-pinned grid-template-columns anywhere (D9)',
      expected: 0,
      actual: rowEl?.style.gridTemplateColumns ? 1 : 0
    },

    // --- 3. name and tagline, verbatim from the row -------------------------
    {
      label: 'every card\'s heading is its row\'s name, verbatim',
      expected: '(none wrong)',
      actual: nameMismatches.join(',') || '(none wrong)'
    },
    {
      label: 'every card\'s <p> is its row\'s tagline, verbatim',
      expected: '(none wrong)',
      actual: taglineMismatches.join(',') || '(none wrong)'
    },
    {
      label: '  …and never the intro (no first-sentence split in the component)',
      expected: 0,
      actual: rows.filter((row, i) => bodyOf(rowCard(i)) === (row.intro ?? '')).length
    },
    {
      label: '  …the check is not vacuous: every intro is longer than its tagline',
      expected: 3,
      actual: rows.filter(row => (row.intro ?? '').length > row.tagline.length).length
    },
    {
      label: 'a sentinel tagline is read from the field, not re-derived from intro',
      expected: SENTINEL_TAGLINE,
      actual: bodyOf(sentinel)
    },
    {
      label: 'every card in the row renders exactly one <p>',
      expected: rowEls.length,
      actual: rowEls.filter(el => el.querySelectorAll(':scope > p').length === 1).length
    },
    {
      label: 'an empty tagline renders no empty <p> at all',
      expected: 0,
      actual: notagline ? notagline.querySelectorAll(':scope > p').length : -1
    },
    {
      label: '  …while that card still renders its heading and link',
      expected: 'true,true',
      actual: notagline
        ? `${!!headingEl(notagline)},${!!linkEl(notagline)}`
        : 'missing'
    },

    // --- 4. the hub hrefs ---------------------------------------------------
    {
      label: 'every card\'s heading is a link',
      expected: rowEls.length,
      actual: rowEls.filter(el => linkEl(el)).length
    },
    {
      label: '  …whose href is the programme hub route /<slug>',
      expected: '(none wrong)',
      actual: hrefMismatches.join(',') || '(none wrong)'
    },
    {
      label: '  …spelled out: the three final hub hrefs',
      expected: PROGRAM_SLUGS.map(s => `/${s}`).join(','),
      actual: rowEls.map(el => linkEl(el)?.getAttribute('href') ?? 'missing').join(',')
    },
    {
      label: 'no anchor on the page points into /wireframes/ (D2 — this is the bf layer)',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLAnchorElement>('.probe__cards a'))
        .filter(a => (a.getAttribute('href') ?? '').startsWith('/wireframes')).length
    },
    {
      label: 'the link\'s accessible name is the programme name, nothing appended',
      expected: rows[0]?.name ?? 'missing row',
      actual: (linkEl(rowCard(0))?.textContent ?? '').trim()
    },
    {
      label: 'exactly one link per card — no repeated CTA',
      expected: rowEls.length,
      actual: rowEls.filter(el => el.querySelectorAll('a').length === 1).length
    },

    // --- 5. the card is a link surface -------------------------------------
    {
      /*
       * `::before`, not `::after`, since gh#36 / #138: `external-link.css`
       * paints its `↗` on `a[data-external]::after` at a lower specificity in
       * the same layer, so an overlay on `::after` erased the marker on every
       * card heading link in the system. Moving the overlay freed `::after`
       * for the marker; this row follows it. `bfCard`'s own probe 20 asserts
       * the move in full — both pseudo-elements and the hit test.
       */
      label: 'the heading link generates bfCard\'s stretched ::before',
      expected: rowEls.length,
      actual: rowEls.filter((el) => {
        const a = linkEl(el)
        if (!a) return false
        const content = getComputedStyle(a, '::before').content
        return content !== 'none' && content !== ''
      }).length
    },
    {
      label: '  …so bfCard\'s :has(:is(h2,h3,h4) a) rules match every card',
      expected: rowEls.length,
      actual: rowEls.filter(el => el.matches(':has(:is(h2, h3, h4) a)')).length
    },
    {
      label: '  …and the card corner hit-tests to the heading link',
      expected: 'the heading link',
      actual: hitTestCorner(rowEls[0] ?? null)
    },
    {
      label: 'the heading link takes focus',
      expected: 'the link is focused',
      actual: focusAttempt(rowEls[0] ?? null)
    },

    // --- 6. headingLevel (#128) and the blank name (#130) -------------------
    {
      label: 'the default headingLevel renders an <h3>',
      expected: 'H3',
      actual: headingEl(rowEls[0] ?? null)?.tagName ?? 'missing'
    },
    {
      label: 'headingLevel=2 renders an <h2>',
      expected: 'H2',
      actual: headingEl(level2)?.tagName ?? 'missing'
    },
    {
      label: 'headingLevel=4 renders an <h4>',
      expected: 'H4',
      actual: headingEl(level4)?.tagName ?? 'missing'
    },
    {
      label: '  …and the link is inside the heading at every level',
      expected: 'true,true,true',
      actual: `${!!linkEl(rowEls[0] ?? null)},${!!linkEl(level2)},${!!linkEl(level4)}`
    },
    {
      label: '#130: a blank name renders no heading element',
      expected: 0,
      actual: noname ? (headingEl(noname) ? 1 : 0) : -1
    },
    {
      label: '  …and therefore no stretched link with no accessible name',
      expected: 0,
      actual: noname ? noname.querySelectorAll('a').length : -1
    },
    {
      label: '  …no heading anywhere on the page is empty',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLElement>('.probe__cards :is(h2, h3, h4)'))
        .filter(h => (h.textContent ?? '').trim() === '').length
    },
    {
      label: '  …and no anchor anywhere on the page has an empty accessible name',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLAnchorElement>('.probe__cards a'))
        .filter(a => (a.textContent ?? '').trim() === '' && !a.getAttribute('aria-label')).length
    },

    // --- 7. $attrs reach the base through the wrapper ----------------------
    {
      label: '$attrs: data-probe-card reached every base <li>',
      expected: allEls.length,
      actual: allEls.filter(el => el.dataset.probeCard).length
    },
    {
      label: '$attrs: a caller class merges with .bf-card rather than replacing it',
      expected: 'true',
      actual: String(
        !!spanned
        && spanned.classList.contains('bf-card')
        && spanned.classList.contains('probe__tinted')
      )
    },
    {
      label: 'span="full" is matched as bfCard\'s PROP through $attrs, not left as an attribute',
      expected: 'full',
      actual: spanned?.getAttribute('data-span') ?? 'missing'
    },
    {
      label: '  …and no stray span="" attribute landed on the <li>',
      expected: 'false',
      actual: String(!!spanned?.hasAttribute('span'))
    },
    {
      label: '  …so it takes the whole row (grid-column 1 / -1)',
      expected: '1/-1',
      actual: spanned
        ? `${getComputedStyle(spanned).gridColumnStart}/${getComputedStyle(spanned).gridColumnEnd}`
        : 'missing'
    },
    {
      label: 'an ordinary programme card carries no data-span',
      expected: 0,
      actual: allEls.filter(el => el.dataset.probeCard !== 'spanned' && el.hasAttribute('data-span')).length
    }
  ]
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states, not two — the #109 convention. The assertions need a laid-out
 * document, so the prerendered HTML has run none of them and `pending` is the
 * honest answer there; the harness treats a probe still PENDING at timeout as
 * a failure, never a skip.
 */
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
    class="probe container"
    data-probe="25"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 25 — <code>bfCardProgram</code></h1>
    <p class="probe__lede">
      The fifth typed wrapper over <code>bfCard</code>, and the one whose reason
      for existing is a <strong>fix</strong>: <code>wfCardProgram.vue</code>
      declares its prop as an inline
      <code>{ slug, name, tagline?, short? }</code> shape and its caller
      hand-builds an object to match, deriving the tagline in the page. This
      component's prop is the zod-inferred <code>Program</code> and it reads
      <code>program.tagline</code> as the plain field the normaliser writes.
      Every card below is fed a real <code>bfPrograms</code> row
      <strong>queried by this page</strong> — the component fetches nothing.
    </p>

    <!--
      The row proper: `<ul class="switcher" data-gap="m">`, parity with
      `pages/wireframes/index.vue:21-24`. A card is an `<li>` and `bfCard` warns
      outside a list.
    -->
    <section aria-labelledby="row-heading">
      <h2 id="row-heading">The three programmes</h2>

      <ul class="probe__cards probe__row | switcher" data-gap="m">
        <bfCardProgram
          v-for="program in programs"
          :key="program.slug"
          :program="program"
          :data-probe-card="program.slug"
        />
      </ul>
    </section>

    <!--
      The contract cards — heading levels, the blank name, the empty tagline,
      the sentinel and `$attrs` — kept out of the row above so its "exactly
      three" and one-line assertions stay exact. A `.grid`, because `data-span`
      is a grid-slot modifier and means nothing in a flex row.
    -->
    <section aria-labelledby="contract-heading">
      <h2 id="contract-heading">Wrapper contract</h2>

      <ul class="probe__cards probe__variants | grid" data-min-width="l" data-gap="m">
        <!--
          #128: the two heading levels the base styles but no wrapper could
          reach. The level is a page-outline decision, so it is passed from here
          and never derived inside the component.
        -->
        <bfCardProgram
          v-if="first"
          :program="first"
          :heading-level="2"
          data-probe-card="level2"
        />

        <bfCardProgram
          v-if="first"
          :program="first"
          :heading-level="4"
          data-probe-card="level4"
        />

        <!-- #130: a blank name renders no heading and therefore no link. -->
        <bfCardProgram
          v-if="firstNoName"
          :program="firstNoName"
          data-probe-card="noname"
        />

        <!-- An empty tagline renders no empty <p> contributing a gap. -->
        <bfCardProgram
          v-if="firstNoTagline"
          :program="firstNoTagline"
          data-probe-card="notagline"
        />

        <!--
          A tagline the data does not carry, with `intro` left untouched: a
          component that re-derived the first sentence would render the intro's
          instead of this.
        -->
        <bfCardProgram
          v-if="firstSentinel"
          :program="firstSentinel"
          data-probe-card="sentinel"
        />

        <!--
          `$attrs` through the wrapper: a caller class, a `data-*`, and the
          `span` **prop** — undeclared here, so it falls into `$attrs` and is
          matched against `bfCard`'s own props by the `v-bind`.
        -->
        <bfCardProgram
          v-if="first"
          :program="first"
          span="full"
          class="probe__tinted"
          data-probe-card="spanned"
        />
      </ul>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-25-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-25-table">
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

.probe__cards {
  margin-block-end: var(--space-l, 2rem);
}

/*
  A caller class on a `bfCardProgram`, present only to prove `$attrs` reaches
  the base `<li>` and merges with `.bf-card` rather than replacing it. It paints
  nothing — a background here would be a new colour decision this issue has no
  business making.
*/
.probe__tinted {
  scroll-margin-block: var(--space-m, 1.5rem);
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
