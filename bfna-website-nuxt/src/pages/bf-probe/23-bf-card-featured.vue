<script setup lang="ts">
/**
 * Probe — issue 23 / gh#32: `bfCardFeatured`.
 *
 * Dev-only route, never linked from nav; only the final cutover issue (#68)
 * removes `bf-probe/`. Follows the #109 harness convention
 * (`docs/decisions/probe-harness.md`): `[data-probe-verdict]` on the root,
 * `[data-probe-row][data-ok]` on every row, run by
 * `npx tsx scripts/check-probes.ts --only 23`.
 *
 * ## The eight real curated documents, queried here and only here
 *
 * `bfCardFeatured` is presentational-only (BRIEF D8) — it fetches nothing. The
 * **page** queries the `featured` rows of `bfInsights` and hands each one over
 * as `item`, which is what the home page (issue 47) will do via
 * `useBfInsights().highlights()`.
 *
 * The query here is `.where('featured', '=', true)` rather than a call to that
 * composable, deliberately: `highlights()` **is** that filter
 * (`useBfInsights.ts:122` — `all.filter(i => i.featured)`), and routing the
 * probe through the composable would prove the composable works, which is
 * probe 11's job, while adding a second data path to keep in step. Recorded as
 * D-23.2. The probe asserts the count is 8 and that every row it got carries
 * `featured`, so the two derivations are still checked against each other.
 *
 * These are the eight Directus *highlight* records the normaliser flagged
 * (issue 07's Decisions): all eight carry a heading, an image and a
 * 132–386-character excerpt, and all eight carry `format: null` and
 * `publish_date: null` — which is why this card says the literal `Featured`
 * rather than `formatLabel(format)`, and renders no `<time>`.
 *
 * ## What it proves
 *
 * 1. all eight curated rows render, in a real two-column grid — the shape the
 *    homepage strip wants — with the resolved track count asserted rather than
 *    assumed;
 * 2. **every** card carries exactly one chip and it reads `Featured` — a
 *    `bfChip` `<span>`, not the frozen `wf-chip`;
 * 3. **every** card renders a `.bf-card__media` whose `bfMedia` resolves
 *    `aspect-ratio: 16 / 9`, declared `alt=""` rather than omitted;
 * 4. the heading links to `/insights/<slug>` for all eight, one anchor per
 *    card, heading-first in the DOM, and nothing links into `/wireframes/`;
 * 5. the excerpt is rendered **whole** — text-identical to the stored field,
 *    with no ellipsis anywhere — which is what makes "ported as-is, no
 *    truncation" a checkable claim rather than a comment;
 * 6. `headingLevel` (#128) renders h2/h3/h4 **and** the base's stretched link
 *    still covers the whole card at each — hit-tested;
 * 7. a blank heading renders no heading and no anchor (#130), and no anchor on
 *    the page has an empty accessible name;
 * 8. the wrapper owns no DOM: its rendered root *is* `bfCard`'s
 *    `<li class="bf-card">`, it adds no class of its own, and `$attrs` — a
 *    caller `class`, a `data-*`, and the `span` **prop** — reach the base
 *    through it.
 *
 * No keyboard is needed (the focus ring belongs to `bfCard` and is asserted on
 * probe 20), so this page declares no `data-probe-keys`.
 */
import type { Insight } from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe23BfCardFeatured' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 23 — bfCardFeatured'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/**
 * The curated set's size, from issue 07's Decisions and `useBfInsights`'s own
 * doc comment. Named here so the probe asserts a number it can quote rather
 * than whatever the query happened to return.
 */
const HIGHLIGHT_COUNT = 8

/**
 * `data-min-width="2xl"` writes `--_grid-min-width: 500px`
 * (`composition/grid.css:77`). Under the 1200px `.container` and the harness's
 * pinned 1280×1024 viewport that is exactly two tracks — 2 × 500 plus one gap
 * fits, 3 × 500 plus two gaps does not. Both halves are asserted below, so a
 * viewport change fails with its cause named rather than as a mystery.
 */
const GRID_MIN_WIDTH = '500px'
const GRID_COLUMNS = 2

const { data } = await useAsyncData('bf-probe-23', () =>
  queryCollection('bfInsights').where('featured', '=', true).all()
)

/*
 * An assignability check, not a cast. If `bfInsightSchema` ever drifts from the
 * `Insight` type this line stops compiling — which is the point of the
 * component taking the entity rather than five loose fields.
 *
 * Sorted by slug so the card keys below are stable across builds: the
 * collection carries no ordinal for these records, and a probe whose
 * `data-probe-card` values shuffle between runs cannot assert anything
 * per-card.
 */
const highlights = computed<Insight[]>(() =>
  [...(data.value ?? [])].sort((a, b) => a.slug.localeCompare(b.slug))
)

/** The row the contract cards below are all built from. */
const first = computed<Insight | null>(() => highlights.value[0] ?? null)

/**
 * The same row with a blank heading — the #130 case on this wrapper.
 * `bfInsightSchema` types `heading` as `z.string().nullable()`, so `null` is
 * the *typed* form of the defect; `''` is asserted by `bfCardProject`'s probe
 * and the component treats them identically (`(heading ?? '').trim()`).
 */
const firstNoHeading = computed<Insight | null>(() => {
  const row = first.value
  return row ? { ...row, heading: null } : null
})

const checks = ref<Check[]>([])

onMounted(() => {
  const stripEls = Array.from(
    document.querySelectorAll<HTMLElement>('.probe__strip > .bf-card')
  )
  const allEls = Array.from(
    document.querySelectorAll<HTMLElement>('.probe__cards > .bf-card')
  )

  const card = (key: string) =>
    document.querySelector<HTMLElement>(`.probe__cards > [data-probe-card="${key}"]`)

  /** Chip labels of one card, in DOM order. */
  const chipsOf = (el: HTMLElement | null) =>
    Array.from(el?.querySelectorAll<HTMLElement>(':scope > .bf-card__chips > .bf-chip') ?? [])
      .map(c => (c.textContent ?? '').trim())

  /** `bfCard`'s chip wrapper — the element, not its contents. */
  const chipsBox = (el: HTMLElement | null) =>
    el?.querySelector<HTMLElement>(':scope > .bf-card__chips') ?? null

  const mediaBox = (el: HTMLElement | null) =>
    el?.querySelector<HTMLElement>(':scope > .bf-card__media') ?? null

  const mediaEl = (el: HTMLElement | null) =>
    el?.querySelector<HTMLElement>(':scope > .bf-card__media .bf-media') ?? null

  const excerptOf = (el: HTMLElement | null) =>
    (el?.querySelector<HTMLElement>(':scope > p')?.textContent ?? '')

  /* `:is(h2, h3, h4)` — the three levels `bfCard` styles (D-20.4). */
  const headingEl = (el: HTMLElement | null) =>
    el?.querySelector<HTMLElement>(':scope > :is(h2, h3, h4)') ?? null

  const headingLink = (el: HTMLElement | null) =>
    el?.querySelector<HTMLAnchorElement>(':scope > :is(h2, h3, h4) > a') ?? null

  const headingIsFirst = (el: HTMLElement) => {
    const firstChild = el.children[0]
    return !!firstChild && firstChild === headingEl(el)
  }

  /**
   * The heading link's accessible name, as a screen reader computes it here:
   * the text of the anchor minus anything `aria-hidden`. This card appends no
   * marker to its title, so the name is the title — and the row that matters
   * is the one asserting no anchor computes to the empty string (#130).
   */
  const accessibleName = (link: HTMLAnchorElement | null) => {
    if (!link) return 'missing'
    return Array.from(link.childNodes)
      .filter(node =>
        node.nodeType === Node.TEXT_NODE
        || !(node as HTMLElement).getAttribute?.('aria-hidden'))
      .map(node => node.textContent ?? '')
      .join('')
      .trim()
  }

  /**
   * The stretched link, hit-tested. Six pixels in from the card's bottom-right
   * corner is inside the border, clear of the heading text, and over nothing
   * but the card's own padding — so the element at that point must be the
   * heading anchor. Probe 20's technique, applied across heading levels.
   */
  const hitTestHeadingLink = (el: HTMLElement | null) => {
    if (!el) return 'missing card'
    const link = headingLink(el)
    if (!link) return 'no heading link'
    /*
     * `elementFromPoint` takes **viewport** coordinates and returns `null` for
     * a point outside the viewport, so the card is brought into view first —
     * every contract card on this page starts below the fold, and a `null`
     * there would read as "the stretched link is broken" when the truth is
     * "the harness was looking at the wrong part of the document".
     *
     * `block: 'end'` with clamped coordinates, because a featured card is tall
     * (a 16/9 image plus an untruncated excerpt) and can exceed the viewport;
     * centring such a card puts both of its edges off-screen.
     */
    el.scrollIntoView({ block: 'end' })
    const rect = el.getBoundingClientRect()
    const x = Math.min(Math.max(rect.right - 6, 1), window.innerWidth - 1)
    const y = Math.min(Math.max(rect.bottom - 6, 1), window.innerHeight - 1)
    const hit = document.elementFromPoint(x, y)
    return hit === link ? 'the heading link' : `${hit?.tagName ?? 'null'}`
  }

  const strip = document.querySelector<HTMLElement>('.probe__strip')
  const level2 = card('level2')
  const level4 = card('level4')
  const noheading = card('noheading')
  const spanned = card('spanned')

  /** The eight rows as the page received them, for text-identity assertions. */
  const rows = highlights.value

  /**
   * The strip card at one index, or `null`. `stripEls[i]` is
   * `HTMLElement | undefined` under `noUncheckedIndexedAccess`, and the three
   * comparisons below pair each row with the card rendered from it — so a
   * short list must read as "no card", never as an index error.
   */
  const stripCard = (i: number): HTMLElement | null => stripEls[i] ?? null

  /**
   * Rendered excerpt vs stored field, per card, as a single comparable string.
   * Compared as *text*, not as a length: a truncation that happened to land on
   * the same character count would pass a length check.
   */
  const excerptMismatches = rows
    .filter((row, i) => excerptOf(stripCard(i)) !== (row.excerpt ?? ''))
    .map(row => row.slug)

  const hrefMismatches = rows
    .filter((row, i) => headingLink(stripCard(i))?.getAttribute('href') !== `/insights/${row.slug}`)
    .map(row => row.slug)

  const headingMismatches = rows
    .filter((row, i) => accessibleName(headingLink(stripCard(i))) !== (row.heading ?? '').trim())
    .map(row => row.slug)

  checks.value = [
    // --- 0. the curated set is the one the home page will feed in ----------
    {
      label: `the page queried the ${HIGHLIGHT_COUNT} curated featured rows`,
      expected: HIGHLIGHT_COUNT,
      actual: rows.length
    },
    {
      label: '  …and every row it got really carries `featured`',
      expected: HIGHLIGHT_COUNT,
      actual: rows.filter(r => r.featured).length
    },
    {
      label: '  …none of which is a retired_news record',
      expected: 0,
      actual: rows.filter(r => r.retired_news).length
    },
    {
      label: `${HIGHLIGHT_COUNT} featured cards rendered in the strip`,
      expected: HIGHLIGHT_COUNT,
      actual: stripEls.length
    },

    // --- 1. the wrapper owns no DOM ----------------------------------------
    {
      label: 'the card group is a <ul>',
      expected: 'UL',
      actual: strip?.tagName ?? 'missing'
    },
    {
      label: 'the wrapper\'s root IS bfCard\'s <li class="bf-card">',
      expected: allEls.length,
      actual: allEls.filter(el => el.tagName === 'LI').length
    },
    {
      label: 'the wrapper adds no element and no class of its own',
      expected: 0,
      actual: document.querySelectorAll('[class*="card-featured" i], [class*="cardFeatured"]').length
    },
    {
      label: 'heading-first DOM order, on every card that has a heading',
      expected: allEls.filter(el => headingEl(el)).length,
      actual: allEls.filter(el => headingIsFirst(el)).length
    },
    {
      label: '  …and exactly one card has no heading (so the row is not vacuous)',
      expected: 1,
      actual: allEls.filter(el => !headingEl(el)).length
    },
    {
      label: 'no card carries an inline style attribute',
      expected: 0,
      actual: allEls.filter(el => el.getAttribute('style') !== null).length
    },
    {
      label: 'no card renders the frozen wireframe chip class',
      expected: 0,
      actual: document.querySelectorAll('.probe__cards .wf-chip').length
    },

    // --- 2. the two-column strip -------------------------------------------
    {
      label: 'the strip resolves --_grid-min-width from data-min-width="2xl"',
      expected: GRID_MIN_WIDTH,
      actual: strip
        ? getComputedStyle(strip).getPropertyValue('--_grid-min-width').trim()
        : 'missing'
    },
    {
      label: `  …giving exactly ${GRID_COLUMNS} columns at the harness viewport (1280 wide)`,
      expected: GRID_COLUMNS,
      actual: strip
        ? getComputedStyle(strip).gridTemplateColumns.split(/\s+/).filter(Boolean).length
        : -1
    },
    {
      label: '  …with no hand-pinned grid-template-columns on any bf-* file (D9)',
      expected: 0,
      actual: strip?.style.gridTemplateColumns ? 1 : 0
    },

    // --- 3. the Featured chip — on every card, exactly once ----------------
    {
      label: 'every card renders exactly one chip',
      expected: HIGHLIGHT_COUNT,
      actual: stripEls.filter(el => chipsOf(el).length === 1).length
    },
    {
      label: '  …and it reads "Featured" on all of them',
      expected: HIGHLIGHT_COUNT,
      actual: stripEls.filter(el => chipsOf(el).join(',') === 'Featured').length
    },
    {
      label: '  …so every card has a chips element (the slot is never empty)',
      expected: HIGHLIGHT_COUNT,
      actual: stripEls.filter(el => chipsBox(el)).length
    },
    {
      label: 'the chip is a bfChip <span>, not a bare wf-chip',
      expected: 'SPAN/span',
      actual: (() => {
        const chip = stripEls[0]?.querySelector<HTMLElement>(':scope > .bf-card__chips > .bf-chip')
        return chip ? `${chip.tagName}/${chip.dataset.element}` : 'missing'
      })()
    },
    {
      /*
       * The literal, not `formatLabel(item.format)`: all eight rows carry
       * `format: null`, so a format chip would render nothing at all.
       */
      label: 'the chip is a literal — no row carries a `format` to have derived it from',
      expected: 0,
      actual: rows.filter(r => r.format).length
    },
    {
      label: 'the card renders no <time> (no row carries a publish_date)',
      expected: 0,
      actual: document.querySelectorAll('.probe__cards time').length
    },

    // --- 4. the 16/9 media, on every card ----------------------------------
    {
      label: 'every card renders a media box',
      expected: HIGHLIGHT_COUNT,
      actual: stripEls.filter(el => mediaBox(el)).length
    },
    {
      label: '  …whose bfMedia resolves aspect-ratio 16 / 9',
      expected: HIGHLIGHT_COUNT,
      actual: stripEls.filter((el) => {
        const media = mediaEl(el)
        return !!media && getComputedStyle(media).aspectRatio === '16 / 9'
      }).length
    },
    {
      label: '  …on the real-image branch (every curated row carries an image)',
      expected: HIGHLIGHT_COUNT,
      actual: stripEls.filter(el => mediaEl(el)?.tagName === 'IMG').length
    },
    {
      label: '  …declaring alt="" rather than omitting it',
      expected: HIGHLIGHT_COUNT,
      actual: stripEls.filter(el => mediaEl(el)?.getAttribute('alt') === '').length
    },
    {
      label: 'the media box sits above the heading visually (order: -2)',
      expected: '-2',
      actual: mediaBox(stripEls[0] ?? null)
        ? getComputedStyle(mediaBox(stripEls[0]!)!).order
        : 'missing'
    },
    {
      label: '  …while staying AFTER it in the DOM',
      expected: 'true',
      actual: String(!!stripEls[0] && headingIsFirst(stripEls[0]))
    },

    // --- 5. the heading links to the bf-* insight route --------------------
    {
      label: 'every heading links to /insights/<slug>',
      expected: '(none wrong)',
      actual: hrefMismatches.join(',') || '(none wrong)'
    },
    {
      label: '  …e.g. the first curated row',
      expected: `/insights/${rows[0]?.slug ?? 'missing row'}`,
      actual: headingLink(stripEls[0] ?? null)?.getAttribute('href') ?? 'missing'
    },
    {
      label: '  …and no card links into /wireframes/ (the wf-* route is gone)',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLAnchorElement>('.probe__cards a'))
        .filter(a => (a.getAttribute('href') ?? '').includes('/wireframes')).length
    },
    {
      label: '  …nor straight to an external URL',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLAnchorElement>('.probe__cards a'))
        .filter(a => (a.getAttribute('href') ?? '').startsWith('http')).length
    },
    {
      label: 'every card with a heading has exactly one link — no repeated "View" CTA',
      expected: allEls.filter(el => headingEl(el)).length,
      actual: allEls.filter(el => el.querySelectorAll('a').length === 1).length
    },
    {
      label: 'the link\'s accessible name is the row\'s heading, unmarked',
      expected: '(none wrong)',
      actual: headingMismatches.join(',') || '(none wrong)'
    },

    // --- 6. the excerpt is rendered WHOLE ----------------------------------
    {
      label: 'each rendered excerpt is text-identical to the stored field',
      expected: '(none wrong)',
      actual: excerptMismatches.join(',') || '(none wrong)'
    },
    {
      label: '  …so no excerpt anywhere carries a truncation ellipsis',
      expected: 0,
      actual: stripEls.filter(el => excerptOf(el).endsWith('…')).length
    },
    {
      label: '  …and the check is not vacuous: rows are longer than the 140 the other wrappers cut at',
      expected: 'true',
      actual: String(rows.filter(r => (r.excerpt ?? '').length > 140).length >= 6)
    },
    {
      label: '  …every row rendering a non-empty paragraph',
      expected: HIGHLIGHT_COUNT,
      actual: stripEls.filter(el => excerptOf(el).length > 0).length
    },

    // --- 7. headingLevel — the shared wrapper contract (#128) --------------
    {
      label: 'the default headingLevel renders an <h3>',
      expected: 'H3',
      actual: headingEl(stripEls[0] ?? null)?.tagName ?? 'missing'
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
      label: '  …and the stretched link still covers the card at all three levels',
      expected: 'the heading link,the heading link,the heading link',
      actual: [stripEls[0] ?? null, level2, level4].map(hitTestHeadingLink).join(',')
    },
    {
      label: '  …with the heading anchor itself left unpositioned at each level',
      expected: 'static,static,static',
      actual: [stripEls[0] ?? null, level2, level4]
        .map((el) => {
          const link = headingLink(el)
          return link ? getComputedStyle(link).position : 'missing'
        })
        .join(',')
    },

    // --- 8. a blank heading renders no unnamed link (#130) -----------------
    {
      label: 'a null heading renders no heading element at all',
      expected: 0,
      actual: noheading ? (headingEl(noheading) ? 1 : 0) : -1
    },
    {
      label: '  …and therefore no anchor, rather than a card-sized unnamed link',
      expected: 0,
      actual: noheading ? noheading.querySelectorAll('a').length : -1
    },
    {
      label: '  …while the rest of the card still renders its excerpt, chip and media',
      expected: 'true,Featured,true',
      actual: noheading
        ? `${excerptOf(noheading).length > 0},${chipsOf(noheading).join(',')},${!!mediaBox(noheading)}`
        : 'missing'
    },
    {
      label: 'no card anywhere renders an anchor with an empty accessible name',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLAnchorElement>('.probe__cards a'))
        .filter(a => accessibleName(a) === '' && !a.getAttribute('aria-label'))
        .length
    },
    {
      label: '  …and there really are anchors on the page to have checked',
      expected: HIGHLIGHT_COUNT + 3,
      actual: document.querySelectorAll('.probe__cards a').length
    },

    // --- 9. $attrs reach the base through the wrapper ---------------------
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
      label: 'an ordinary featured card carries no data-span',
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
    data-probe="23"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 23 — <code>bfCardFeatured</code></h1>
    <p class="probe__lede">
      The third typed wrapper over <code>bfCard</code>, and the thinnest: one
      entity prop (<code>item</code>, the zod-inferred <code>Insight</code>)
      plus the shared <code>headingLevel</code> — no presentation switches, per
      BRIEF §5's rule of three. <code>inheritAttrs: false</code> and a root of
      <code>&lt;bfCard v-bind="$attrs"&gt;</code>, so the wrapper owns no DOM of
      its own. Every card below is fed a real <code>bfInsights</code> row
      <strong>queried by this page</strong> — the component fetches nothing.
    </p>

    <!--
      The strip proper: a real `<ul class="grid">` with `data-min-width="2xl"`,
      not a mock container. A card is an `<li>`, `bfCard` warns outside a list,
      and the two-column shape is the homepage band's — asserted from the
      resolved tracks rather than pinned with a hand-written
      `grid-template-columns`, which D9 forbids in any `bf-*` file.
    -->
    <section aria-labelledby="strip-heading">
      <h2 id="strip-heading">The eight curated highlights</h2>

      <ul class="probe__cards probe__strip | grid" data-min-width="2xl" data-gap="m">
        <bfCardFeatured
          v-for="item in highlights"
          :key="item.slug"
          :item="item"
          :data-probe-card="item.slug"
        />
      </ul>
    </section>

    <!--
      The contract cards — heading levels, the #130 blank heading, and `$attrs`
      — kept out of the strip above so its "exactly eight" and two-column
      assertions stay exact.
    -->
    <section aria-labelledby="contract-heading">
      <h2 id="contract-heading">Wrapper contract</h2>

      <ul class="probe__cards probe__variants | grid" data-min-width="2xl" data-gap="m">
        <!--
          #128: the two heading levels the base styles but no wrapper could
          reach. The level is a page-outline decision, so it is passed from
          here and never derived inside the component.
        -->
        <bfCardFeatured
          v-if="first"
          :item="first"
          :heading-level="2"
          data-probe-card="level2"
        />

        <bfCardFeatured
          v-if="first"
          :item="first"
          :heading-level="4"
          data-probe-card="level4"
        />

        <!-- #130: a blank heading must not become a card-sized unnamed link. -->
        <bfCardFeatured
          v-if="firstNoHeading"
          :item="firstNoHeading"
          data-probe-card="noheading"
        />

        <!--
          `$attrs` through the wrapper: a caller class, a `data-*`, and the
          `span` **prop** — undeclared here, so it falls into `$attrs` and is
          matched against `bfCard`'s own props by the `v-bind`.
        -->
        <bfCardFeatured
          v-if="first"
          :item="first"
          span="full"
          class="probe__tinted"
          data-probe-card="spanned"
        />
      </ul>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-23-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-23-table">
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
  A caller class on a `bfCardFeatured`, present only to prove `$attrs` reaches
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
