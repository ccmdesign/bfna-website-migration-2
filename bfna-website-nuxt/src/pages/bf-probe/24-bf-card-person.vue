<script setup lang="ts">
/**
 * Probe — issue 24 / gh#33: `bfCardPerson`.
 *
 * Dev-only route, never linked from nav; only the final cutover issue (#68)
 * removes `bf-probe/`. Follows the #109 harness convention
 * (`docs/decisions/probe-harness.md`): `[data-probe-verdict]` on the root,
 * `[data-probe-row][data-ok]` on every row, run by
 * `npx tsx scripts/check-probes.ts --only 24`.
 *
 * ## Real `bfPeople` documents, queried here and only here
 *
 * `bfCardPerson` is presentational-only (BRIEF D8) — it fetches nothing. The
 * **page** queries `bfPeople` and splits it on `board`, which is what issue
 * 53's `/about` will do for its two grids. Thirteen real rows: four board
 * members and nine team members.
 *
 * The `—` fallback is exercised by **real data**: `ma-a-ocvirk` carries
 * `job_title: null` in the normalised collection. Every row carries an
 * `image`, so the placeholder branch is the one case that has to be derived
 * (`{ ...row, image: null }`) — the technique probe 23 uses for its
 * `heading: null` card.
 *
 * ## What it proves
 *
 * 1. board members and team members both render, from real rows, in a real
 *    three-column `.grid` whose track count is **derived from the measured
 *    container** and checked against the resolved `data-min-width="l"` floor
 *    rather than assumed;
 * 2. every portrait resolves `aspect-ratio: 1 / 1` and declares `alt=""`
 *    rather than omitting it;
 * 3. a row with no `image` falls through to `bfMedia`'s `aria-hidden`
 *    placeholder `<div>`, still square;
 * 4. `job_title` renders verbatim where present and as `—` where `null` — on
 *    the real null row, so the check is not vacuous;
 * 5. **D-24.1, the whole point of the issue: the card is non-interactive.**
 *    Zero anchors, zero focusable elements, no generated `::after` on any
 *    heading, no `:has(… a)` match, nothing at the card's corner but the card
 *    itself, and `.focus()` on a card leaves `document.activeElement` where it
 *    was;
 * 6. `headingLevel` (#128) renders h2/h3/h4, and a blank `name` renders no
 *    heading element at all rather than an empty one;
 * 7. the wrapper owns no DOM: its rendered root *is* `bfCard`'s
 *    `<li class="bf-card">`, it adds no class of its own, and `$attrs` — a
 *    caller `class`, a `data-*`, and the `span` **prop** — reach the base
 *    through it.
 *
 * No keys are dispatched (there is nothing to activate), so this page declares
 * no `data-probe-keys`. The absence of a tab stop is asserted by enumeration
 * plus a `.focus()` attempt, which is the right tool for "this element cannot
 * take focus" — the question a skip link raises (D-4 of the harness decision)
 * does not arise on a card with no interactive content.
 */
import type { Person } from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe24BfCardPerson' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 24 — bfCardPerson'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/**
 * The four board rows and the thirteen total, from the normalised collection
 * (`content/bf/people/*.json`). Named here so the probe asserts numbers it can
 * quote rather than whatever the query happened to return.
 */
const BOARD_COUNT = 4
const PEOPLE_COUNT = 13

/**
 * `data-min-width="l"` writes `--_grid-min-width: 300px`
 * (`composition/grid.css:74`). Under the 1200px `.container` (minus its
 * `--space-m` inline padding) and the harness's pinned 1280×1024 viewport that
 * is exactly three tracks: a fourth needs 1200px of track before a single gap
 * is added. The expected count is nevertheless **derived** from the measured
 * container below — the arithmetic `auto-fill` itself does — so a viewport
 * change fails with its cause named instead of as a mystery.
 */
const GRID_MIN_WIDTH = '300px'
const GRID_COLUMNS = 3

/** The person the wireframe data leaves untitled — the real `—` case. */
const UNTITLED_SLUG = 'ma-a-ocvirk'

const { data } = await useAsyncData('bf-probe-24', () =>
  queryCollection('bfPeople').all()
)

/*
 * An assignability check, not a cast. If `bfPersonSchema` ever drifts from the
 * `Person` type this line stops compiling — which is the point of the
 * component taking the entity rather than three loose fields.
 *
 * Sorted by slug so the card keys are stable across builds: the collection
 * carries no ordinal, and a probe whose `data-probe-card` values shuffle
 * between runs cannot assert anything per-card.
 */
const people = computed<Person[]>(() =>
  [...(data.value ?? [])].sort((a, b) => a.slug.localeCompare(b.slug))
)

/** The `/about` split, done on the page exactly as issue 53 will do it. */
const board = computed<Person[]>(() => people.value.filter(p => p.board))
const team = computed<Person[]>(() => people.value.filter(p => !p.board))

/** The board four plus one team member — the grid the spec asks for. */
const grid = computed<Person[]>(() => {
  const first = team.value[0]
  return first ? [...board.value, first] : board.value
})

/** The real untitled row, for the `—` assertion. */
const untitled = computed<Person | null>(
  () => people.value.find(p => p.slug === UNTITLED_SLUG) ?? null
)

/** The contract cards are all built from one real row. */
const first = computed<Person | null>(() => board.value[0] ?? null)

/**
 * The placeholder branch. Every real row carries an `image`, so this is the one
 * case that has to be derived — `image` is `z.string().nullable()`, so `null`
 * is the *typed* form of a missing portrait, not a hack.
 */
const firstNoImage = computed<Person | null>(() => {
  const row = first.value
  return row ? { ...row, image: null } : null
})

/**
 * A blank `name`. `bfPersonSchema` types it non-nullable, so this is the empty
 * string rather than `null` — the only blank the type permits, and the one the
 * component's `hasName` guard exists for.
 */
const firstNoName = computed<Person | null>(() => {
  const row = first.value
  return row ? { ...row, name: '' } : null
})

const checks = ref<Check[]>([])

onMounted(() => {
  const gridEls = Array.from(
    document.querySelectorAll<HTMLElement>('.probe__grid > .bf-card')
  )
  const allEls = Array.from(
    document.querySelectorAll<HTMLElement>('.probe__cards > .bf-card')
  )

  const card = (key: string) =>
    document.querySelector<HTMLElement>(`.probe__cards > [data-probe-card="${key}"]`)

  /* `:is(h2, h3, h4)` — the three levels `bfCard` styles (D-20.4). */
  const headingEl = (el: HTMLElement | null) =>
    el?.querySelector<HTMLElement>(':scope > :is(h2, h3, h4)') ?? null

  const titleOf = (el: HTMLElement | null) =>
    (el?.querySelector<HTMLElement>(':scope > p')?.textContent ?? '').trim()

  const mediaBox = (el: HTMLElement | null) =>
    el?.querySelector<HTMLElement>(':scope > .bf-card__media') ?? null

  const mediaEl = (el: HTMLElement | null) =>
    el?.querySelector<HTMLElement>(':scope > .bf-card__media .bf-media') ?? null

  const headingIsFirst = (el: HTMLElement) => {
    const firstChild = el.children[0]
    return !!firstChild && firstChild === headingEl(el)
  }

  /**
   * Every element inside a card that a browser would put in the sequential
   * focus order. Enumerated by the standard tabbable-candidate selector rather
   * than by `a` alone, so a `<button>`, a `tabindex` or a control smuggled in
   * by a future edit is caught by the same row.
   */
  const FOCUSABLE = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    'summary',
    'iframe',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]',
    '[tabindex]'
  ].join(',')

  const focusablesIn = (root: ParentNode) =>
    Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))

  /**
   * The absence of the stretched overlay, hit-tested. Six pixels in from the
   * card's bottom-right corner is inside the border and clear of the text — on
   * a linked card (probe 20 / 23) that point resolves to the heading anchor's
   * `::after`. Here it must resolve to something *inside the card itself*, and
   * never to an anchor.
   */
  const hitTestCorner = (el: HTMLElement | null) => {
    if (!el) return 'missing card'
    el.scrollIntoView({ block: 'end' })
    const rect = el.getBoundingClientRect()
    const x = Math.min(Math.max(rect.right - 6, 1), window.innerWidth - 1)
    const y = Math.min(Math.max(rect.bottom - 6, 1), window.innerHeight - 1)
    const hit = document.elementFromPoint(x, y)
    if (!hit) return 'null'
    if (hit.closest('a')) return 'an anchor'
    return el.contains(hit) || hit === el ? 'the card itself' : hit.tagName
  }

  /**
   * `.focus()` on the card, then whether focus actually moved. An `<li>` with
   * no `tabindex` is not a focus target, so `document.activeElement` must be
   * exactly what it was — `<body>` on a freshly loaded page.
   */
  const focusAttempt = (el: HTMLElement | null) => {
    if (!el) return 'missing card'
    const before = document.activeElement
    el.focus()
    const after = document.activeElement
    return after === before ? 'focus did not move' : `moved to ${after?.tagName}`
  }

  const gridEl = document.querySelector<HTMLElement>('.probe__grid')
  const level2 = card('level2')
  const level4 = card('level4')
  const noimage = card('noimage')
  const noname = card('noname')
  const spanned = card('spanned')

  /** The five rows the grid was fed, paired with the cards rendered from them. */
  const rows = grid.value
  const gridCard = (i: number): HTMLElement | null => gridEls[i] ?? null

  const nameMismatches = rows
    .filter((row, i) => (headingEl(gridCard(i))?.textContent ?? '').trim() !== row.name)
    .map(row => row.slug)

  const titleMismatches = rows
    .filter((row, i) => titleOf(gridCard(i)) !== (row.job_title ?? '—'))
    .map(row => row.slug)

  /**
   * The expected column count, derived the way `auto-fill` derives it: how many
   * 300px tracks plus gaps fit the measured content box. Viewport-agnostic by
   * construction (the harness pins 1280×1024, but the arithmetic does not
   * depend on that), with the pinned `GRID_COLUMNS` asserted separately so a
   * viewport change is reported as a viewport change.
   */
  const gridStyle = gridEl ? getComputedStyle(gridEl) : null
  const gridWidth = gridEl
    ? gridEl.getBoundingClientRect().width
      - parseFloat(gridStyle?.paddingLeft ?? '0')
      - parseFloat(gridStyle?.paddingRight ?? '0')
    : 0
  const gridGap = parseFloat(gridStyle?.columnGap ?? '0') || 0
  const gridFloor = parseFloat(
    gridStyle?.getPropertyValue('--_grid-min-width') ?? '0'
  ) || 0
  const derivedColumns = gridFloor > 0
    ? Math.max(1, Math.floor((gridWidth + gridGap + 1) / (gridFloor + gridGap)))
    : -1
  const measuredColumns = gridStyle
    ? gridStyle.gridTemplateColumns.split(/\s+/).filter(Boolean).length
    : -1

  checks.value = [
    // --- 0. the real collection, split the way /about will split it -------
    {
      label: `the page queried all ${PEOPLE_COUNT} bfPeople rows`,
      expected: PEOPLE_COUNT,
      actual: people.value.length
    },
    {
      label: `  …of which exactly ${BOARD_COUNT} carry board: true`,
      expected: BOARD_COUNT,
      actual: board.value.length
    },
    {
      label: '  …and the rest are team members',
      expected: PEOPLE_COUNT - BOARD_COUNT,
      actual: team.value.length
    },
    {
      label: 'the grid renders the board four plus one team member',
      expected: BOARD_COUNT + 1,
      actual: gridEls.length
    },
    {
      label: '  …board members and team members alike (both branches present)',
      expected: `${BOARD_COUNT},1`,
      actual: `${rows.filter(r => r.board).length},${rows.filter(r => !r.board).length}`
    },

    // --- 1. the wrapper owns no DOM ---------------------------------------
    {
      label: 'the card group is a <ul>',
      expected: 'UL',
      actual: gridEl?.tagName ?? 'missing'
    },
    {
      label: 'the wrapper\'s root IS bfCard\'s <li class="bf-card">',
      expected: allEls.length,
      actual: allEls.filter(el => el.tagName === 'LI').length
    },
    {
      label: 'the wrapper adds no element and no class of its own',
      expected: 0,
      actual: document.querySelectorAll('[class*="card-person" i], [class*="cardPerson"]').length
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
      label: 'the card renders no chips element (the person card has no chips)',
      expected: 0,
      actual: document.querySelectorAll('.probe__cards .bf-card__chips').length
    },

    // --- 2. the three-column grid -----------------------------------------
    {
      label: 'the grid resolves --_grid-min-width from data-min-width="l"',
      expected: GRID_MIN_WIDTH,
      actual: gridStyle?.getPropertyValue('--_grid-min-width').trim() ?? 'missing'
    },
    {
      label: '  …and the rendered track count matches what auto-fill derives from the measured box',
      expected: derivedColumns,
      actual: measuredColumns
    },
    {
      label: `  …which is ${GRID_COLUMNS} columns at the harness viewport (1280 wide)`,
      expected: GRID_COLUMNS,
      actual: measuredColumns
    },
    {
      label: '  …with no hand-pinned grid-template-columns anywhere (D9)',
      expected: 0,
      actual: gridEl?.style.gridTemplateColumns ? 1 : 0
    },

    // --- 3. name and the job_title fallback --------------------------------
    {
      label: 'every card\'s heading is its row\'s name, verbatim',
      expected: '(none wrong)',
      actual: nameMismatches.join(',') || '(none wrong)'
    },
    {
      label: 'every card\'s <p> is its row\'s job_title, or the em dash',
      expected: '(none wrong)',
      actual: titleMismatches.join(',') || '(none wrong)'
    },
    {
      label: `  …and the fallback is exercised by real data (${UNTITLED_SLUG} has job_title: null)`,
      expected: 'true',
      actual: String(untitled.value !== null && untitled.value.job_title === null)
    },
    {
      label: '  …rendering the em dash on that card',
      expected: '—',
      actual: titleOf(card('untitled'))
    },
    {
      label: '  …while a titled card renders its title untouched',
      expected: first.value?.job_title ?? 'missing row',
      actual: titleOf(gridCard(0))
    },
    {
      label: 'every card renders exactly one <p>',
      expected: allEls.length,
      actual: allEls.filter(el => el.querySelectorAll(':scope > p').length === 1).length
    },

    // --- 4. the 1/1 portrait ------------------------------------------------
    {
      label: 'every card renders a media box',
      expected: allEls.length,
      actual: allEls.filter(el => mediaBox(el)).length
    },
    {
      label: '  …whose bfMedia resolves aspect-ratio 1 / 1',
      expected: allEls.length,
      actual: allEls.filter((el) => {
        const media = mediaEl(el)
        return !!media && getComputedStyle(media).aspectRatio === '1 / 1'
      }).length
    },
    {
      label: '  …on the real-image branch for every row that carries an image',
      expected: gridEls.length,
      actual: gridEls.filter(el => mediaEl(el)?.tagName === 'IMG').length
    },
    {
      label: '  …declaring alt="" rather than omitting it',
      expected: gridEls.length,
      actual: gridEls.filter(el => mediaEl(el)?.getAttribute('alt') === '').length
    },
    {
      label: 'a row with no image falls through to the placeholder <div>',
      expected: 'DIV',
      actual: mediaEl(noimage)?.tagName ?? 'missing'
    },
    {
      label: '  …hidden from the a11y tree rather than announced as an empty box',
      expected: 'true',
      actual: String(mediaEl(noimage)?.getAttribute('aria-hidden') === 'true')
    },
    {
      label: '  …and still square, so the grid keeps its rhythm',
      expected: '1 / 1',
      actual: mediaEl(noimage) ? getComputedStyle(mediaEl(noimage)!).aspectRatio : 'missing'
    },
    {
      label: 'the media box sits above the heading visually (order: -2)',
      expected: '-2',
      actual: mediaBox(gridEls[0] ?? null)
        ? getComputedStyle(mediaBox(gridEls[0]!)!).order
        : 'missing'
    },
    {
      label: '  …while staying AFTER it in the DOM',
      expected: 'true',
      actual: String(!!gridEls[0] && headingIsFirst(gridEls[0]))
    },

    // --- 5. D-24.1 — the card is NON-INTERACTIVE ---------------------------
    {
      label: 'D-24.1: no card contains an anchor of any kind',
      expected: 0,
      actual: document.querySelectorAll('.probe__cards a').length
    },
    {
      label: '  …nor any other focusable element',
      expected: 0,
      actual: allEls.reduce((n, el) => n + focusablesIn(el).length, 0)
    },
    {
      label: '  …and the check is not vacuous: there are cards to have checked',
      expected: 'true',
      actual: String(allEls.length >= BOARD_COUNT + 1)
    },
    {
      label: 'no heading generates bfCard\'s stretched ::after (no anchor to select)',
      expected: 0,
      actual: allEls.filter((el) => {
        const h = headingEl(el)
        if (!h) return false
        const content = getComputedStyle(h, '::after').content
        return content !== 'none' && content !== ''
      }).length
    },
    {
      label: '  …so bfCard\'s :has(:is(h2,h3,h4) a) hover/focus rules match no card',
      expected: 0,
      actual: allEls.filter(el => el.matches(':has(:is(h2, h3, h4) a)')).length
    },
    {
      label: '  …and the card corner hit-tests to the card, never to a link',
      expected: 'the card itself',
      actual: hitTestCorner(gridEls[0] ?? null)
    },
    {
      label: 'the card is not focusable: .focus() leaves activeElement where it was',
      expected: 'focus did not move',
      actual: focusAttempt(gridEls[0] ?? null)
    },
    {
      label: '  …and nothing in the card region is in the tab order at all',
      expected: 0,
      actual: focusablesIn(document.querySelector('.probe__cards') ?? document.body).length
    },

    // --- 6. headingLevel (#128) and the blank name -------------------------
    {
      label: 'the default headingLevel renders an <h3>',
      expected: 'H3',
      actual: headingEl(gridEls[0] ?? null)?.tagName ?? 'missing'
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
      label: 'a blank name renders no heading element rather than an empty one',
      expected: 0,
      actual: noname ? (headingEl(noname) ? 1 : 0) : -1
    },
    {
      label: '  …while the card still renders its job title and portrait',
      expected: 'true,true',
      actual: noname
        ? `${titleOf(noname).length > 0},${!!mediaBox(noname)}`
        : 'missing'
    },
    {
      label: '  …and no heading anywhere on the page is empty',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLElement>('.probe__cards :is(h2, h3, h4)'))
        .filter(h => (h.textContent ?? '').trim() === '').length
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
      label: 'an ordinary person card carries no data-span',
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
    data-probe="24"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 24 — <code>bfCardPerson</code></h1>
    <p class="probe__lede">
      The fourth typed wrapper over <code>bfCard</code>, and the first that is
      deliberately <strong>not a link</strong> (D-24.1 — BF-174 resolved as
      "ship unlinked"). One entity prop (<code>person</code>, the zod-inferred
      <code>Person</code>) plus the shared <code>headingLevel</code>;
      <code>inheritAttrs: false</code> and a root of
      <code>&lt;bfCard v-bind="$attrs"&gt;</code>, so the wrapper owns no DOM of
      its own. Every card below is fed a real <code>bfPeople</code> row
      <strong>queried by this page</strong> — the component fetches nothing.
    </p>

    <!--
      The grid proper: a real `<ul class="grid">` with `data-min-width="l"`, not
      a mock container. A card is an `<li>`, `bfCard` warns outside a list, and
      the three-column shape is `/about`'s — asserted from the resolved tracks
      rather than pinned with a hand-written `grid-template-columns`, which D9
      forbids in any `bf-*` file.
    -->
    <section aria-labelledby="grid-heading">
      <h2 id="grid-heading">The board four, plus a team member</h2>

      <ul class="probe__cards probe__grid | grid" data-min-width="l" data-gap="m">
        <bfCardPerson
          v-for="person in grid"
          :key="person.slug"
          :person="person"
          :data-probe-card="person.slug"
        />
      </ul>
    </section>

    <!--
      The contract cards — the real untitled row, the placeholder branch,
      heading levels, the blank name and `$attrs` — kept out of the grid above
      so its "exactly five" and three-column assertions stay exact.
    -->
    <section aria-labelledby="contract-heading">
      <h2 id="contract-heading">Wrapper contract</h2>

      <ul class="probe__cards probe__variants | grid" data-min-width="l" data-gap="m">
        <!-- The real `job_title: null` row — the `—` fallback, from data. -->
        <bfCardPerson
          v-if="untitled"
          :person="untitled"
          data-probe-card="untitled"
        />

        <!-- No `image`: `bfMedia`'s aria-hidden placeholder, still 1/1. -->
        <bfCardPerson
          v-if="firstNoImage"
          :person="firstNoImage"
          data-probe-card="noimage"
        />

        <!--
          #128: the two heading levels the base styles but no wrapper could
          reach. The level is a page-outline decision, so it is passed from
          here and never derived inside the component.
        -->
        <bfCardPerson
          v-if="first"
          :person="first"
          :heading-level="2"
          data-probe-card="level2"
        />

        <bfCardPerson
          v-if="first"
          :person="first"
          :heading-level="4"
          data-probe-card="level4"
        />

        <!-- A blank name renders no heading, rather than an empty one. -->
        <bfCardPerson
          v-if="firstNoName"
          :person="firstNoName"
          data-probe-card="noname"
        />

        <!--
          `$attrs` through the wrapper: a caller class, a `data-*`, and the
          `span` **prop** — undeclared here, so it falls into `$attrs` and is
          matched against `bfCard`'s own props by the `v-bind`.
        -->
        <bfCardPerson
          v-if="first"
          :person="first"
          span="full"
          class="probe__tinted"
          data-probe-card="spanned"
        />
      </ul>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-24-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-24-table">
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
  A caller class on a `bfCardPerson`, present only to prove `$attrs` reaches the
  base `<li>` and merges with `.bf-card` rather than replacing it. It paints
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
