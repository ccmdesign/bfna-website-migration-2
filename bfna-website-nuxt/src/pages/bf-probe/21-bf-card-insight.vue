<script setup lang="ts">
/**
 * Probe — issue 21 / gh#30: `bfCardInsight`.
 *
 * Dev-only route, never linked from nav; only the final cutover issue (#68)
 * removes `bf-probe/`. Follows the #109 harness convention
 * (`docs/decisions/probe-harness.md`): `[data-probe-verdict]` on the root,
 * `[data-probe-row][data-ok]` on every row, run by
 * `npx tsx scripts/check-probes.ts --only 21`.
 *
 * ## Real documents, queried here and only here
 *
 * `bfCardInsight` is presentational-only (BRIEF D8) — it fetches nothing. The
 * **page** does the fetching, which is the division this probe exists to
 * demonstrate as much as to test: three real rows out of `bfInsights` come in
 * through `useAsyncData` + `queryCollection` and are handed to the component
 * as props.
 *
 * | key | slug | why this row |
 * |---|---|---|
 * | `article` | `dual-vocational-training` | the **longest real excerpt** in the collection (500 chars), `format: 'article|report'` — a pipe-delimited value, which is the case `formatLabel` exists for — and not archived |
 * | `archived` | `there-and-back-again` | `archived: true`, so the conditional `Archive` chip has something to fire on, and `extraChips` can be asserted for *position* between the format chip and it |
 * | `video` | `episode-6-…` | `format: 'video'`, so the format chip is asserted against a second mapping rather than one; not archived, so the Archive chip's **absence** is asserted on two documents rather than one |
 *
 * Eight cards, because those rows are rendered in more than one configuration:
 * default truncation, `excerpt: false`, the long-text case, the `$attrs` case,
 * and — added by gh#31 — the two extra heading levels and the blank-heading
 * guard.
 *
 * ## The gh#31 retrofit rows
 *
 * Two residuals against this component were settled once for the whole wrapper
 * family and are asserted here:
 *
 * - **#128 / `headingLevel`.** `bfCard` styles `:is(h2, h3, h4)` (D-20.4)
 *   because heading level belongs to the page outline, and the wrappers could
 *   reach only `h3`. The `level2` and `level4` cards assert the rendered tag
 *   *and* — the part a source grep cannot reach — that the base's stretched
 *   link, its `position: static` exemption and its focus/hover rules still
 *   bite at those levels. `elementFromPoint` on empty card space, the same
 *   proof probe 20 uses.
 * - **#130 / a blank heading.** `heading` is `z.string().nullable()`, and the
 *   heading is the entire text of an anchor whose `::after` is stretched over
 *   the card — so a null one used to render a card-sized link with no
 *   accessible name. The `noheading` card feeds a real row with `heading:
 *   null` and asserts the card renders no heading element and **no anchor at
 *   all**, while keeping its chips and its date.
 *
 * ## The 980-character case
 *
 * The issue's acceptance says *"renders a real 980-character insight without
 * overflow"*. **No such `excerpt` exists.** 980 is BRIEF §5 rule 10's upper
 * bound on the *pre-normalisation* range; after the issue-07 normaliser the
 * longest real `excerpt` in all 371 rows is 500 characters.
 *
 * Rather than quietly shrink the acceptance to 500 or invent lorem to reach
 * 980, the `long` card renders **980 characters of real prose taken from the
 * same document's own `content` field** — `dual-vocational-training`, whose
 * body opens with 980 characters of clean prose and no markdown — with
 * `excerptLength` raised past it so nothing truncates. It is real content from
 * the collection, at the length the acceptance names, and the substitution is
 * recorded in the spec's Decisions section rather than left for a reader to
 * infer.
 *
 * ## What it proves
 *
 * 1. the format chip is `formatLabel(insight.format)`, on both a
 *    pipe-delimited value and a plain one;
 * 2. the `Archive` chip appears on **exactly** the archived documents —
 *    asserted as a set equality, not a count, so adding a card cannot make a
 *    broken condition pass;
 * 3. chips render format → extras (in order) → Archive;
 * 4. the heading links to `/insights/<slug>` and **no** card links into
 *    `/wireframes/` — the one deliberate content delta from `wfCardInsight`;
 * 5. the date is a real `<time datetime>` (the wireframe source renders one
 *    with no attribute at all) and is a direct child of the `<li>`, which is
 *    what `.bf-card > time { margin-block-start: auto }` needs;
 * 6. the excerpt truncates at `excerptLength` with a single `…`, is absent
 *    when `excerpt` is `false`, and is untouched when it fits;
 * 7. **980 real characters render without overflow** — measured on the card
 *    and on the paragraph, and cross-checked against the grid's content box;
 * 8. the wrapper owns no DOM: its rendered root *is* `bfCard`'s `<li
 *    class="bf-card">`, it adds no class of its own, and `$attrs` — a caller
 *    `class`, a `data-*`, and the `span` **prop** — reach the base through it;
 * 9. heading-first DOM order survives the wrapper.
 *
 * No keyboard is needed (the stretched link and its focus ring belong to
 * `bfCard` and are asserted on probe 20), so this page declares no
 * `data-probe-keys`.
 */
import type { Insight } from '~/types/bf-contracts'
import { formatLabel } from '~/utils/format'

defineOptions({ name: 'BfProbe21BfCardInsight' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 21 — bfCardInsight'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/** The three slugs, named once so the assertions below can quote them. */
const SLUGS = {
  article: 'dual-vocational-training',
  archived: 'there-and-back-again',
  video: 'episode-6-the-near-future-of-transatlantic-relations'
} as const

/** The length the issue's acceptance names. See the doc comment. */
const LONG_LENGTH = 980

const { data } = await useAsyncData('bf-probe-21', async () => {
  /* One `.first()` per slug — the same shape probe 09 uses, and three known
     rows is not a case for a filter expression. */
  const bySlug = (slug: string) =>
    queryCollection('bfInsights').where('slug', '=', slug).first()

  const [article, archived, video] = await Promise.all([
    bySlug(SLUGS.article),
    bySlug(SLUGS.archived),
    bySlug(SLUGS.video)
  ])

  return { article, archived, video }
})

/*
 * Assignability checks, not casts. If `bfInsightSchema` ever drifts from the
 * `Insight` type these lines stop compiling — which is the whole point of the
 * component taking the entity rather than six loose fields.
 */
const article = computed<Insight | null>(() => data.value?.article ?? null)
const archived = computed<Insight | null>(() => data.value?.archived ?? null)
const video = computed<Insight | null>(() => data.value?.video ?? null)

/**
 * The same real document with 980 characters of its own real body prose in the
 * `excerpt` field. Not lorem, not a padded string, not another row: the
 * substitution the doc comment explains.
 */
const longArticle = computed<Insight | null>(() => {
  const row = article.value
  if (!row) return null
  return { ...row, excerpt: (row.content ?? '').slice(0, LONG_LENGTH) }
})

/**
 * The same real document with its `heading` removed — the #130 case. The type
 * permits it (`z.string().nullable()`) and 0 of the 371 real rows carry it, so
 * the only honest way to render the case is to null the field on a real row,
 * the substitution D-21.3 already established for the 980-character card.
 */
const noHeadingArticle = computed<Insight | null>(() => {
  const row = article.value
  return row ? { ...row, heading: null } : null
})

/** Extras on the archived card, so their *position* among the chips is testable. */
const EXTRA_CHIPS = ['Fellowship', 'Europe']

const checks = ref<Check[]>([])

onMounted(() => {
  const grid = document.querySelector<HTMLElement>('.probe__cards')!
  const cardEls = Array.from(document.querySelectorAll<HTMLElement>('.probe__cards > .bf-card'))
  const card = (key: string) =>
    document.querySelector<HTMLElement>(`.probe__cards > [data-probe-card="${key}"]`)

  /** Chip labels of one card, in DOM order. */
  const chipsOf = (el: HTMLElement | null) =>
    Array.from(el?.querySelectorAll<HTMLElement>(':scope > .bf-card__chips > .bf-chip') ?? [])
      .map(c => (c.textContent ?? '').trim())

  const excerptOf = (el: HTMLElement | null) =>
    el?.querySelector<HTMLElement>(':scope > p')?.textContent ?? ''

  const timeOf = (el: HTMLElement | null) =>
    el?.querySelector<HTMLTimeElement>(':scope > time') ?? null

  /*
   * `:is(h2, h3, h4)` rather than a bare `h3` since gh#31: the wrapper renders
   * whichever level `headingLevel` names, and these are the three the base
   * styles. Never `:not()` — D-20.5's ban is about CSS, but keeping the probe's
   * selectors to the same vocabulary is what makes them readable next to the
   * stylesheet they are checking.
   */
  const headingEl = (el: HTMLElement | null) =>
    el?.querySelector<HTMLElement>(':scope > :is(h2, h3, h4)') ?? null

  const headingLink = (el: HTMLElement | null) =>
    el?.querySelector<HTMLAnchorElement>(':scope > :is(h2, h3, h4) > a') ?? null

  /** Is this element's first child the card's heading? */
  const headingIsFirst = (el: HTMLElement) => {
    const first = el.children[0]
    return !!first && first === headingEl(el)
  }

  /** Rounded, so a sub-pixel layout width cannot decide a verdict. */
  const fits = (el: HTMLElement) =>
    el.scrollWidth <= Math.ceil(el.clientWidth) && el.scrollHeight <= Math.ceil(el.clientHeight)

  const first = card('article')
  const arch = card('archived')
  const vid = card('video')
  const long = card('long')
  const spanned = card('spanned')
  const level2 = card('level2')
  const level4 = card('level4')
  const noheading = card('noheading')

  /*
   * The stretched link, hit-tested at each of the three heading levels — the
   * gh#128 question a source grep cannot answer. Six pixels in from the card's
   * bottom-right corner is inside the border, clear of the heading text and
   * over nothing but the card's own padding, so the element at that point must
   * be the heading anchor: that *is* the stretched `::after`. (Probe 20's
   * technique, applied across levels rather than to one card.)
   */
  const hitTestHeadingLink = (el: HTMLElement | null) => {
    if (!el) return 'missing card'
    const link = headingLink(el)
    if (!link) return 'no heading link'
    /*
     * `elementFromPoint` takes **viewport** coordinates and returns `null` for
     * a point outside the viewport, so the card is brought into view first —
     * most of the cards on this page start below the fold, and a `null` there
     * would read as "the stretched link is broken" when the truth is "the
     * harness was looking at the wrong part of the document".
     *
     * `block: 'end'` rather than `'center'`, and the coordinates are clamped
     * afterwards, because a card can be **taller than the viewport** (the
     * 980-character card stretches its whole grid row), and centring such a
     * card puts both of its edges off-screen. Clamped, the probe point stays
     * in the card's right-hand padding strip either way — which is what the
     * stretched `::after` covers and the excerpt text does not.
     */
    el.scrollIntoView({ block: 'end' })
    const rect = el.getBoundingClientRect()
    const x = Math.min(Math.max(rect.right - 6, 1), window.innerWidth - 1)
    const y = Math.min(Math.max(rect.bottom - 6, 1), window.innerHeight - 1)
    const hit = document.elementFromPoint(x, y)
    return hit === link ? 'the heading link' : `${hit?.tagName ?? 'null'}`
  }

  /*
   * The set equality behind check 2. The archived *documents* are `archived`
   * and `spanned` (both render `there-and-back-again`); every other card must
   * carry no Archive chip. Comparing the two sorted key lists — rather than
   * counting chips — means a card added later is classified rather than
   * ignored, the #115 hardening applied to this probe.
   */
  const withArchiveChip = cardEls
    .filter(el => chipsOf(el).includes('Archive'))
    .map(el => el.dataset.probeCard ?? '?')
    .sort()
    .join(',')
  const archivedDocs = cardEls
    .filter(el => el.dataset.probeArchived === 'true')
    .map(el => el.dataset.probeCard ?? '?')
    .sort()
    .join(',')

  const longText = excerptOf(long)
  const longP = long?.querySelector<HTMLElement>(':scope > p') ?? null
  const firstText = excerptOf(first)
  const sourceExcerpt = article.value?.excerpt ?? ''

  const gridBox = grid.getBoundingClientRect()
  const longBox = long?.getBoundingClientRect()

  checks.value = [
    // --- 0. the group is real, and the wrapper owns no DOM -----------------
    { label: 'the card group is a <ul>', expected: 'UL', actual: grid.tagName },
    { label: 'eight insight cards rendered', expected: 8, actual: cardEls.length },
    {
      label: 'the wrapper\'s root IS bfCard\'s <li class="bf-card">',
      expected: 8,
      actual: cardEls.filter(el => el.tagName === 'LI').length
    },
    {
      label: 'the wrapper adds no element and no class of its own',
      expected: 0,
      actual: document.querySelectorAll('[class*="card-insight" i], [class*="cardInsight"]').length
    },
    {
      /*
       * Seven, not eight: the `noheading` card deliberately renders no heading
       * at all (#130). Asserted as "every card that has one puts it first"
       * rather than as a pinned total, so the row keeps its meaning if a later
       * issue adds a card.
       */
      label: 'heading-first DOM order survives the wrapper, on every card that has one',
      expected: cardEls.filter(el => headingEl(el)).length,
      actual: cardEls.filter(el => headingIsFirst(el)).length
    },
    {
      label: '  …and exactly one card has no heading (so the row is not vacuous)',
      expected: 1,
      actual: cardEls.filter(el => !headingEl(el)).length
    },
    {
      label: 'no card carries an inline style attribute',
      expected: 0,
      actual: cardEls.filter(el => el.getAttribute('style') !== null).length
    },

    // --- 1. the format chip is formatLabel(insight.format) ----------------
    {
      label: 'format chip: a pipe-delimited "article|report" reads Article',
      expected: `${formatLabel('article|report')}`,
      actual: chipsOf(first)[0] ?? 'missing'
    },
    {
      label: '  …and it agrees with formatLabel on the real row',
      expected: formatLabel(article.value?.format ?? null),
      actual: chipsOf(first)[0] ?? 'missing'
    },
    {
      label: 'format chip: "video" reads Video (a second mapping, not one)',
      expected: 'Video',
      actual: chipsOf(vid)[0] ?? 'missing'
    },
    {
      label: 'the format chip is a bfChip <span>, not a bare wf-chip',
      expected: 'SPAN/span',
      actual: (() => {
        const chip = first?.querySelector<HTMLElement>(':scope > .bf-card__chips > .bf-chip')
        return chip ? `${chip.tagName}/${chip.dataset.element}` : 'missing'
      })()
    },
    {
      label: 'no card renders the frozen wireframe chip class',
      expected: 0,
      actual: document.querySelectorAll('.probe__cards .wf-chip').length
    },

    // --- 2. the Archive chip is conditional (the issue's named acceptance) -
    {
      label: 'the Archive chip appears on exactly the archived documents',
      expected: archivedDocs || '(none archived — the check would be vacuous)',
      actual: withArchiveChip || '(none)'
    },
    {
      label: '  …which is a non-empty set, so the check is not vacuous',
      expected: 'true',
      actual: String(archivedDocs.length > 0)
    },
    {
      label: '  …and both non-archived documents render no Archive chip',
      expected: 'true',
      actual: String(!chipsOf(first).includes('Archive') && !chipsOf(vid).includes('Archive'))
    },

    // --- 3. chip order: format → extras (in order) → Archive --------------
    {
      label: 'chips render format, then extraChips in order, then Archive',
      expected: ['Article', ...EXTRA_CHIPS, 'Archive'].join(','),
      actual: chipsOf(arch).join(',')
    },
    {
      label: 'a card with no extraChips renders the format chip alone',
      expected: 'Video',
      actual: chipsOf(vid).join(',')
    },

    // --- 4. the route delta: /insights/, never /wireframes/ ---------------
    {
      label: 'the heading links to the bf-* insight route',
      expected: `/insights/${SLUGS.article}`,
      actual: headingLink(first)?.getAttribute('href') ?? 'missing'
    },
    {
      label: '  …and no card links into /wireframes/ (the wf-* route is gone)',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLAnchorElement>('.probe__cards a'))
        .filter(a => (a.getAttribute('href') ?? '').includes('/wireframes')).length
    },
    {
      label: '  …and the link text is the row\'s real heading',
      expected: article.value?.heading ?? 'missing row',
      actual: (headingLink(first)?.textContent ?? '').trim()
    },

    // --- 5. bfTime replaces the wireframe's attribute-less <time> ---------
    {
      label: 'the date is a <time> carrying a real datetime attribute',
      expected: article.value?.publish_date ?? 'missing row',
      actual: timeOf(first)?.getAttribute('datetime') ?? 'no datetime'
    },
    {
      label: '  …with the monthYear label beside it',
      expected: 'Mar 2024',
      actual: (timeOf(first)?.textContent ?? '').trim()
    },
    {
      label: '  …and it is a DIRECT child of .bf-card (so > time { margin: auto } bites)',
      expected: 'true',
      actual: String(!!timeOf(first)?.matches('.bf-card > time'))
    },
    {
      label: 'every card with a publish_date rendered a bfTime',
      expected: 8,
      actual: cardEls.filter(el => timeOf(el)).length
    },

    // --- 6. the excerpt: truncation, the switch, and the untouched case ---
    {
      label: 'the default excerptLength (140) truncates the 500-char excerpt',
      expected: 'true',
      actual: String(firstText.length <= 141 && firstText.length > 100)
    },
    {
      label: '  …with a single ellipsis character appended',
      expected: 'true',
      actual: String(firstText.endsWith('…') && !firstText.endsWith('...'))
    },
    {
      label: '  …and the kept text is a real prefix of the source excerpt',
      expected: 'true',
      actual: String(
        sourceExcerpt.length > 140
        && sourceExcerpt.startsWith(firstText.slice(0, -1).trimEnd())
      )
    },
    {
      label: 'excerpt={false} renders no paragraph at all',
      expected: 0,
      actual: vid ? vid.querySelectorAll(':scope > p').length : -1
    },
    {
      label: '  …while the same card still renders its chips and its date',
      expected: 'true',
      actual: String(chipsOf(vid).length === 1 && !!timeOf(vid))
    },
    {
      label: 'text shorter than excerptLength is not truncated',
      expected: 'true',
      actual: String(longText.length === LONG_LENGTH && !longText.endsWith('…'))
    },

    // --- 7. 980 real characters, without overflow (the acceptance) --------
    {
      label: `the long card renders ${LONG_LENGTH} characters of real prose`,
      expected: LONG_LENGTH,
      actual: longText.length
    },
    {
      label: '  …and that prose really came from the collection',
      expected: 'true',
      actual: String(
        longText.length > 0 && (article.value?.content ?? '').startsWith(longText)
      )
    },
    {
      label: '  …the card does not overflow itself (scroll size ≤ client size)',
      expected: 'true',
      actual: long ? String(fits(long)) : 'missing'
    },
    {
      label: '  …the paragraph does not overflow the card',
      expected: 'true',
      actual: longP ? String(fits(longP)) : 'missing'
    },
    {
      label: '  …and the card stays inside the grid\'s content box',
      expected: 'true',
      actual: longBox
        ? String(longBox.left >= gridBox.left - 1 && longBox.right <= gridBox.right + 1)
        : 'missing'
    },
    {
      /*
       * Measured on the *paragraphs*, not on the cards: grid items stretch to
       * their row height, so two cards in the same row have identical heights
       * however much text one of them holds. The paragraph is the box that
       * actually grew.
       */
      label: '  …and its paragraph is genuinely taller than the truncated one',
      expected: 'true',
      actual: (() => {
        const firstP = first?.querySelector<HTMLElement>(':scope > p')
        return String(
          !!longP && !!firstP
          && longP.getBoundingClientRect().height > firstP.getBoundingClientRect().height
        )
      })()
    },

    // --- 8. $attrs reach the base through the wrapper ---------------------
    {
      label: '$attrs: data-probe-card reached every base <li>',
      expected: 8,
      actual: cardEls.filter(el => el.dataset.probeCard).length
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
      label: '  …and the heavier border that goes with it',
      expected: '2px',
      actual: spanned ? getComputedStyle(spanned).borderTopWidth : 'missing'
    },
    {
      label: 'an ordinary insight card carries no data-span',
      expected: 0,
      actual: cardEls.filter(el => el.dataset.probeCard !== 'spanned' && el.hasAttribute('data-span')).length
    },

    // --- 9. headingLevel — the shared wrapper contract (gh#31 / #128) ------
    {
      label: 'the default headingLevel renders an <h3>',
      expected: 'H3',
      actual: headingEl(first)?.tagName ?? 'missing'
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
      /*
       * The half that matters. `bfCard`'s selectors are `:is(h2, h3, h4)`
       * (D-20.4); a wrapper that emitted an `h5` — or a base that lost one of
       * the three — would still render a heading and silently lose the
       * card-sized hit area. Hit-tested, not grepped.
       */
      label: '  …and the stretched link still covers the card at all three levels',
      expected: 'the heading link,the heading link,the heading link',
      actual: [first, level2, level4].map(hitTestHeadingLink).join(',')
    },
    {
      label: '  …with the heading anchor itself left unpositioned at each level',
      expected: 'static,static,static',
      actual: [first, level2, level4]
        .map(el => {
          const link = headingLink(el)
          return link ? getComputedStyle(link).position : 'missing'
        })
        .join(',')
    },
    {
      label: '  …and the heading text is unchanged by the level',
      expected: `${article.value?.heading ?? 'missing row'}|${article.value?.heading ?? 'missing row'}`,
      actual: `${(headingLink(level2)?.textContent ?? '').trim()}|${(headingLink(first)?.textContent ?? '').trim()}`
    },

    // --- 10. a blank heading renders no unnamed link (gh#31 / #130) --------
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
      label: '  …while the rest of the card still renders (chips and date)',
      expected: 'true',
      actual: String(!!noheading && chipsOf(noheading).length > 0 && !!timeOf(noheading))
    },
    {
      /*
       * The general form of the same rule, over every card on the page: no
       * anchor may be left without an accessible name. Text content is the
       * name here — none of these links carries an `aria-label` or an image.
       */
      label: 'no card anywhere renders an anchor with an empty accessible name',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLAnchorElement>('.probe__cards a'))
        .filter(a => (a.textContent ?? '').trim() === '' && !a.getAttribute('aria-label'))
        .length
    },
    {
      label: '  …and there really are anchors on the page to have checked',
      expected: 7,
      actual: document.querySelectorAll('.probe__cards a').length
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
    data-probe="21"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 21 — <code>bfCardInsight</code></h1>
    <p class="probe__lede">
      The first typed wrapper over <code>bfCard</code>: one entity prop
      (<code>insight</code>, the zod-inferred type) plus three presentation
      switches, <code>inheritAttrs: false</code>, and a root of
      <code>&lt;bfCard v-bind="$attrs"&gt;</code> so the wrapper owns no DOM of
      its own. Every card below is fed a <code>bfInsights</code> row
      <strong>queried by this page</strong> from the real collection — the
      component fetches nothing.
    </p>

    <!--
      A real `<ul class="grid">` with a `data-min-width`, not a mock container:
      a card is an `<li>`, `bfCard` warns outside a list, and the `span="full"`
      row only means something inside a grid whose column count it does not
      control.
    -->
    <section aria-labelledby="grid-heading">
      <h2 id="grid-heading">Five real insights</h2>

      <ul class="probe__cards | grid" data-min-width="s" data-gap="m">
        <!-- Default everything: truncation at 140, format chip, no Archive. -->
        <bfCardInsight
          v-if="article"
          :insight="article"
          data-probe-card="article"
          :data-probe-archived="String(!!article.archived)"
        />

        <!-- Archived, with extras — chip order is format → extras → Archive. -->
        <bfCardInsight
          v-if="archived"
          :insight="archived"
          :extra-chips="EXTRA_CHIPS"
          data-probe-card="archived"
          :data-probe-archived="String(!!archived.archived)"
        />

        <!-- The switch off, and a second format mapping. -->
        <bfCardInsight
          v-if="video"
          :insight="video"
          :excerpt="false"
          data-probe-card="video"
          :data-probe-archived="String(!!video.archived)"
        />

        <!--
          The acceptance case: 980 characters of the same document's own real
          body prose, with `excerptLength` raised past it so nothing truncates.
          See the script comment for why the collection has no 980-char
          `excerpt` to use instead.
        -->
        <bfCardInsight
          v-if="longArticle"
          :insight="longArticle"
          :excerpt-length="LONG_LENGTH + 20"
          data-probe-card="long"
          :data-probe-archived="String(!!longArticle.archived)"
        />

        <!--
          `$attrs` through the wrapper: a caller class, a `data-*`, and the
          `span` **prop** — undeclared here, so it falls into `$attrs` and is
          matched against `bfCard`'s own props by the `v-bind`.
        -->
        <bfCardInsight
          v-if="archived"
          :insight="archived"
          span="full"
          class="probe__tinted"
          data-probe-card="spanned"
          :data-probe-archived="String(!!archived.archived)"
        />

        <!--
          gh#31 / #128: the two heading levels the base styles but no wrapper
          could reach. The level is a *page-outline* decision, so it is passed
          from here — the page — and not derived inside the component.
        -->
        <bfCardInsight
          v-if="article"
          :insight="article"
          :heading-level="2"
          data-probe-card="level2"
          :data-probe-archived="String(!!article.archived)"
        />

        <bfCardInsight
          v-if="article"
          :insight="article"
          :heading-level="4"
          data-probe-card="level4"
          :data-probe-archived="String(!!article.archived)"
        />

        <!--
          gh#31 / #130: a real row with its `heading` nulled — which the schema
          permits and no real row exercises. The card must render no heading
          and no link at all, rather than an anchor stretched over the whole
          card with nothing to announce.
        -->
        <bfCardInsight
          v-if="noHeadingArticle"
          :insight="noHeadingArticle"
          data-probe-card="noheading"
          :data-probe-archived="String(!!noHeadingArticle.archived)"
        />
      </ul>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-21-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-21-table">
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
  A caller class on a `bfCardInsight`, present only to prove `$attrs` reaches
  the base `<li>` and merges with `.bf-card` rather than replacing it. It
  paints nothing — a background here would be a new colour decision this issue
  has no business making.
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
