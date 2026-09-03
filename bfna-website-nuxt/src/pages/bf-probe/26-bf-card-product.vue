<script setup lang="ts">
/**
 * Probe — issue 26 / gh#35: `bfCardProduct`.
 *
 * Dev-only route, never linked from nav; only the final cutover issue (#68)
 * removes `bf-probe/`. Follows the #109 harness convention
 * (`docs/decisions/probe-harness.md`): `[data-probe-verdict]` on the root,
 * `[data-probe-row][data-ok]` on every row, run by
 * `npx tsx scripts/check-probes.ts --only 26`.
 *
 * ## The real band, rebuilt
 *
 * `bfCardProduct` is presentational-only (BRIEF D8) — it fetches nothing. The
 * **page** queries `bfProjects` for the rows carrying `external_only`, and
 * `bfInsights` for the four featured rows, which is what issue 47's home
 * "Insights" band will do. The band below is
 * `pages/wireframes/index.vue:39-42` — the Transponder card leading four
 * featured cards in a two-column grid — with the frozen source's hand-pinned
 * `style="grid-template-columns: repeat(2, 1fr)"` replaced by
 * `data-min-width="xl"`, because D9 forbids authoring a column count and the
 * composition layer resolves two tracks on its own in a 1200px container.
 *
 * ## What it proves
 *
 * 1. **the full-width span**: the product card resolves `grid-column: 1 / -1`,
 *    its measured width equals the grid's content box, and a featured card's
 *    does not — in a grid whose track count is *derived* from the measured
 *    container width (probe 03's viewport-agnostic arithmetic) and is ≥ 2, so
 *    "full width" is a claim about a genuinely multi-column grid;
 * 2. it is **one featured row tall**, not two — the 21/9 ratio's whole job,
 *    per the frozen source's comment, and the reason the card reads as the "1"
 *    in a 2×1 slot;
 * 3. `--_bf-media-ratio` resolves to `21/9` here and `16/9` on a featured card,
 *    so the ratio travels through `bfMedia`'s custom-property override path
 *    (#26) rather than as a hard `aspect-ratio`;
 * 4. **the pending branch, on real data**: the Transponder row carries
 *    `external_url: null`, so its heading renders as plain text with **no
 *    anchor anywhere in the card**, and the "External link pending Q6" chip
 *    carries that status;
 * 5. **the linked branch**: an off-site `external_url` renders an `<a>` whose
 *    `href` is that URL verbatim and which carries `[data-external]` — while an
 *    `external_url` on the site's own host renders the link **without** the
 *    marker (D-26.1), which is the whole reason the attribute is bound through
 *    `isExternal()` rather than asserted;
 * 6. what the marker actually paints on a card heading. This is the row that
 *    found [#138]: `bfCard`'s stretched overlay used to be
 *    `.bf-card :is(h2, h3, h4) a::after` at (0,1,2) against the marker's
 *    (0,1,1) in the same layer, so the arrow's `content` lost to the empty
 *    string that makes the card clickable — on *every* card heading link in
 *    the system, this one included. Measured rather than asserted, which is
 *    why the defect was visible at all. gh#36 moved the overlay to `::before`
 *    and freed `::after` for the marker, so the same two measurements now read
 *    the other way: the ↗ paints, and the overlay is on the other
 *    pseudo-element. The corner hit-test two rows up is what proves the move
 *    cost nothing;
 *
 * [#138]: https://github.com/ccmdesign/bfna-website-migration-2/issues/138
 * 7. the `Magazine` chip is unconditional and the pending chip is not;
 * 8. the excerpt is `excerpt ?? description` cut at `excerptLength` with an
 *    ellipsis — including the `??` half, where an **empty-string** excerpt does
 *    *not* fall back to the description;
 * 9. `headingLevel` (#128) renders h2/h3/h4; a blank `heading` renders no
 *    heading **and no anchor** (#130);
 * 10. the wrapper owns no DOM: its rendered root *is* `bfCard`'s
 *     `<li class="bf-card">`, it adds no class of its own, it emits no inline
 *     style and no `grid-template-columns`, and `$attrs` reach the base through
 *     it — including a caller `span` that **overrides** the wrapper's default.
 *
 * No keys are dispatched, so this page declares no `data-probe-keys`: the
 * anchor's focusability is asserted with `.focus()`, which is the right tool
 * for "can this element take focus" (D-4 of the harness decision).
 */
import type { Insight, Project } from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe26BfCardProduct' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 26 — bfCardProduct'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/**
 * The one real product today. Named rather than counted: a normaliser that
 * dropped `external_only` from this row would still pass a "≥ 1 row" check.
 */
const PRODUCT_SLUG = 'transponder-magazine'

/** The band's shape, straight from `pages/wireframes/index.vue:40-41`. */
const FEATURED_COUNT = 4

/** `data-min-width="xl"` — the 400px floor, per `composition/grid.css`. */
const GRID_MIN_WIDTH = 400

/** An off-site URL, and one on the site's own host. D-26.1's two branches. */
const EXTERNAL_URL = 'https://www.transponder-magazine.example/issue-7'
const INTERNAL_URL = 'https://www.bfna.org/transponder'

/*
 * `.all()` and a client-side filter, deliberately.
 *
 * HISTORY (D-26.4 → gh#140): this used to be the only form that worked.
 * `external_only` was `z.boolean().nullable()`, and the nullable column
 * round-tripped through the content SQLite store in a shape that
 * `.where('external_only', '=', true)` matched zero rows of, while the row was
 * plainly there. gh#140 made every `bf*` boolean non-nullable, and probe 09 now
 * asserts the `.where()` form directly.
 *
 * The `.all()`-and-filter is KEPT here regardless, because it is the stronger
 * assertion for THIS probe: it reads every project row and asserts that the
 * products are a real, non-vacuous subset of them, which a `.where()` that
 * returned the right count could not show.
 */
const { data: projectData } = await useAsyncData('bf-probe-26-products', () =>
  queryCollection('bfProjects').all()
)

const { data: insightData } = await useAsyncData('bf-probe-26-featured', () =>
  queryCollection('bfInsights').where('featured', '=', true).all()
)

/*
 * An assignability check, not a cast: if `bfProjectSchema` drifts from the
 * `Project` type these lines stop compiling, which is the point of the
 * component taking the entity.
 */
const allProjects = computed<Project[]>(() => projectData.value ?? [])

const products = computed<Project[]>(() =>
  allProjects.value
    .filter(p => p.external_only === true)
    .sort((a, b) => a.slug.localeCompare(b.slug))
)

const featured = computed<Insight[]>(() =>
  [...(insightData.value ?? [])]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .slice(0, FEATURED_COUNT)
)

/** The Transponder row itself — the band's leading card. */
const product = computed<Project | null>(
  () => products.value.find(p => p.slug === PRODUCT_SLUG) ?? products.value[0] ?? null
)

/** The linked branch: a real off-site URL on an otherwise real row. */
const productLinked = computed<Project | null>(() => {
  const row = product.value
  return row ? { ...row, external_url: EXTERNAL_URL } : null
})

/** D-26.1's other half: a URL on the site's own host takes no marker. */
const productInternal = computed<Project | null>(() => {
  const row = product.value
  return row ? { ...row, external_url: INTERNAL_URL } : null
})

/** #130: a blank heading renders no heading element and therefore no anchor. */
const productNoHeading = computed<Project | null>(() => {
  const row = productLinked.value
  return row ? { ...row, heading: '' } : null
})

/**
 * The `??` half of the excerpt fallback, and its trap: `excerpt: ''` is **not**
 * nullish, so it does not fall back to the description. Two cards, so both
 * halves of one expression are checked rather than one of them twice.
 */
const DESCRIPTION_SENTINEL = 'Probe sentinel description — reached through ??.'

const productFallback = computed<Project | null>(() => {
  const row = product.value
  return row
    ? { ...row, excerpt: null, description: DESCRIPTION_SENTINEL }
    : null
})

const productEmptyExcerpt = computed<Project | null>(() => {
  const row = product.value
  return row ? { ...row, excerpt: '', description: DESCRIPTION_SENTINEL } : null
})

/**
 * A whitespace-only `external_url` — permitted by `z.string().nullable()`. The
 * anchor is suppressed, so the card cannot become a card-sized link to nowhere.
 */
const productBlankUrl = computed<Project | null>(() => {
  const row = product.value
  return row ? { ...row, external_url: '   ' } : null
})

/** A row with no `pending`, to reach the frozen source's `'Q6'` fallback. */
const productNoPending = computed<Project | null>(() => {
  const row = product.value
  if (!row) return null
  const { pending: _pending, ...rest } = row
  return rest as Project
})

/** A long excerpt, to exercise the cut rather than the pass-through. */
const LONG_EXCERPT = 'A'.repeat(400)

const productLongExcerpt = computed<Project | null>(() => {
  const row = product.value
  return row ? { ...row, excerpt: LONG_EXCERPT } : null
})

const checks = ref<Check[]>([])

onMounted(() => {
  const bandEl = document.querySelector<HTMLElement>('.probe__band')
  const bandCards = Array.from(
    document.querySelectorAll<HTMLElement>('.probe__band > .bf-card')
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

  const chipTexts = (el: HTMLElement | null) =>
    Array.from(el?.querySelectorAll<HTMLElement>('.bf-card__chips .bf-chip') ?? [])
      .map(c => (c.textContent ?? '').trim())

  const mediaEl = (el: HTMLElement | null) =>
    el?.querySelector<HTMLElement>('.bf-card__media .bf-media') ?? null

  const ratioOf = (el: HTMLElement | null) => {
    const m = mediaEl(el)
    return m
      ? getComputedStyle(m).getPropertyValue('--_bf-media-ratio').trim()
      : 'missing'
  }

  const headingIsFirst = (el: HTMLElement) => {
    const firstChild = el.children[0]
    return !!firstChild && firstChild === headingEl(el)
  }

  const productCard = bandCards[0] ?? null
  const featuredCards = bandCards.slice(1)

  /*
   * The track count, derived rather than pinned — probe 03's arithmetic, which
   * is what `auto-fill` does: as many `--_grid-min-width` tracks as fit the
   * container once the gaps are taken out. Written this way so the row states a
   * property of the composition layer and not of one viewport.
   */
  const bandStyle = bandEl ? getComputedStyle(bandEl) : null
  const bandWidth = bandEl
    ? bandEl.getBoundingClientRect().width
      - parseFloat(bandStyle?.paddingLeft ?? '0')
      - parseFloat(bandStyle?.paddingRight ?? '0')
    : 0
  const bandGap = parseFloat(bandStyle?.columnGap ?? '0') || 0
  const expectedCols = Math.max(
    1,
    Math.floor((bandWidth + bandGap + 0.5) / (GRID_MIN_WIDTH + bandGap))
  )
  const actualCols = (bandStyle?.gridTemplateColumns ?? '').trim().split(/\s+/)
    .filter(Boolean).length

  const productRect = productCard?.getBoundingClientRect() ?? null
  const featuredRects = featuredCards.map(el => el.getBoundingClientRect())
  const tallestFeatured = featuredRects.length
    ? Math.max(...featuredRects.map(r => r.height))
    : 0
  const widestFeatured = featuredRects.length
    ? Math.max(...featuredRects.map(r => r.width))
    : 0

  /*
   * "About one featured row tall". The contract is *not two rows*: the card is
   * twice as wide and must still occupy a single row of the grid. Anything
   * under 1.5× the tallest featured card is one row by construction (two rows
   * plus a gap cannot be less than 2×), and the lower bound catches a card
   * whose media collapsed.
   */
  const heightRatio = tallestFeatured > 0 && productRect
    ? productRect.height / tallestFeatured
    : 0

  const gridColumnOf = (el: HTMLElement | null) => {
    if (!el) return 'missing'
    const s = getComputedStyle(el)
    return `${s.gridColumnStart}/${s.gridColumnEnd}`
  }

  /**
   * The stretched overlay, hit-tested. Six pixels in from the card's
   * bottom-right corner is inside the border and clear of the text; on a linked
   * card that point must resolve to the heading anchor.
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

  const linked = card('linked')
  const internal = card('internal')
  const level2 = card('level2')
  const level4 = card('level4')
  const noheading = card('noheading')
  const fallback = card('fallback')
  const emptyExcerpt = card('empty-excerpt')
  const nopending = card('nopending')
  const blankurl = card('blankurl')
  const longExcerpt = card('long-excerpt')
  const spanned = card('spanned')
  const overridden = card('overridden')

  const row = product.value
  const rawExcerpt = row?.excerpt ?? row?.description ?? ''
  const expectedBlurb = rawExcerpt.length > 220
    ? `${rawExcerpt.slice(0, 220).trimEnd()}…`
    : rawExcerpt

  const linkedAnchor = linkEl(linked)
  const afterContent = linkedAnchor
    ? getComputedStyle(linkedAnchor, '::after').content
    : 'missing'

  checks.value = [
    // --- 0. the real rows ---------------------------------------------------
    {
      label: 'the page queried bfProjects and found the external_only rows',
      expected: 'true',
      actual: String(allProjects.value.length > 1 && products.value.length >= 1)
    },
    {
      label: '  …a real subset: products are fewer than all projects',
      expected: 'true',
      actual: String(products.value.length < allProjects.value.length)
    },
    {
      label: `  …including ${PRODUCT_SLUG}, by name`,
      expected: PRODUCT_SLUG,
      actual: product.value?.slug ?? 'missing'
    },
    {
      label: '  …and every row it got really carries external_only',
      expected: products.value.length,
      actual: products.value.filter(p => p.external_only === true).length
    },
    {
      label: '  …the real row has NO external_url — the pending branch is live data',
      expected: 'null',
      actual: String(product.value?.external_url ?? 'null')
    },
    {
      label: `the band renders 1 product + ${FEATURED_COUNT} featured cards`,
      expected: 1 + FEATURED_COUNT,
      actual: bandCards.length
    },

    // --- 1. the full-width span (#29's mechanism, consumed) ------------------
    {
      label: 'the band grid resolves more than one column (a real multi-column grid)',
      expected: 'true',
      actual: String(actualCols >= 2)
    },
    {
      label: '  …and that count is the one auto-fill derives from the measured width',
      expected: expectedCols,
      actual: actualCols
    },
    {
      label: '  …with no hand-pinned grid-template-columns (D9)',
      expected: 0,
      actual: bandEl?.style.gridTemplateColumns ? 1 : 0
    },
    {
      label: 'the product card gets data-span="full" without the caller asking',
      expected: 'full',
      actual: productCard?.getAttribute('data-span') ?? 'missing'
    },
    {
      label: '  …resolved by bfCard\'s own stylesheet to grid-column 1 / -1',
      expected: '1/-1',
      actual: gridColumnOf(productCard)
    },
    {
      label: '  …so it measures the full content width of the grid',
      expected: 'true',
      actual: String(
        !!productRect && Math.abs(productRect.width - bandWidth) <= 1
      )
    },
    {
      label: '  …while a featured card measures one track, not the row',
      expected: 'true',
      actual: String(widestFeatured > 0 && widestFeatured < bandWidth - 1)
    },
    {
      label: '  …no featured card carries data-span',
      expected: 0,
      actual: featuredCards.filter(el => el.hasAttribute('data-span')).length
    },
    {
      label: 'the wrapper emits no inline style — the span is the only layout signal',
      expected: 0,
      actual: allEls.filter(el => el.getAttribute('style') !== null).length
    },

    // --- 2. one featured row tall, via the 21/9 ratio ------------------------
    {
      label: 'the product card is a single grid row, not two (height < 1.5x a featured card)',
      expected: 'true',
      actual: String(heightRatio > 0 && heightRatio < 1.5)
    },
    {
      label: '  …and not collapsed either (height > 0.6x a featured card)',
      expected: 'true',
      actual: String(heightRatio > 0.6)
    },
    {
      label: 'its media resolves --_bf-media-ratio: 21/9 (bfMedia\'s override path)',
      expected: '21/9',
      actual: ratioOf(productCard)
    },
    {
      label: '  …which the browser applies as the box\'s aspect-ratio',
      expected: '21 / 9',
      actual: mediaEl(productCard)
        ? getComputedStyle(mediaEl(productCard)!).aspectRatio
        : 'missing'
    },
    {
      label: '  …and a featured card in the same band still resolves 16/9',
      expected: '16/9',
      actual: ratioOf(featuredCards[0] ?? null)
    },
    {
      label: 'every product card renders exactly one media box',
      expected: allEls.length,
      actual: allEls.filter(el => el.querySelectorAll('.bf-card__media').length === 1).length
    },

    // --- 3. the pending branch, on real data --------------------------------
    {
      label: '#4: with no external_url the heading renders as plain text',
      expected: `${product.value?.heading ?? 'missing'}`,
      actual: (headingEl(productCard)?.textContent ?? '').trim()
    },
    {
      label: '  …and the card contains NO anchor at all',
      expected: 0,
      actual: productCard ? productCard.querySelectorAll('a').length : -1
    },
    {
      label: '  …so bfCard\'s :has(:is(h2,h3,h4) a) hover/focus rules do not match it',
      expected: 'false',
      actual: String(!!productCard?.matches(':has(:is(h2, h3, h4) a)'))
    },
    {
      label: '  …the pending chip carries the status instead',
      expected: 'Magazine|External link pending Q6',
      actual: chipTexts(productCard).join('|') || 'missing'
    },
    {
      label: 'a row with no `pending` field falls back to the frozen source\'s Q6',
      expected: 'Magazine|External link pending Q6',
      actual: chipTexts(nopending).join('|') || 'missing'
    },
    {
      label: 'a whitespace-only external_url renders NO anchor…',
      expected: 0,
      actual: blankurl ? blankurl.querySelectorAll('a').length : -1
    },
    {
      label: '  …and falls to the pending branch, chip and all',
      expected: 'Magazine|External link pending Q6',
      actual: chipTexts(blankurl).join('|') || 'missing'
    },
    {
      label: 'the Magazine chip is unconditional — present on the linked card too',
      expected: 'Magazine',
      actual: chipTexts(linked)[0] ?? 'missing'
    },
    {
      label: '  …and the pending chip is NOT, so the linked card shows one chip',
      expected: 1,
      actual: chipTexts(linked).length
    },

    // --- 4. the linked branch, and D-26.1 ------------------------------------
    {
      label: 'an external_url renders an <a> inside the heading',
      expected: 'true',
      actual: String(!!linkedAnchor)
    },
    {
      label: '  …whose href is the external URL, verbatim',
      expected: EXTERNAL_URL,
      actual: linkedAnchor?.getAttribute('href') ?? 'missing'
    },
    {
      label: '  …carrying the [data-external] marker (issue 19\'s convention)',
      expected: 'true',
      actual: String(!!linkedAnchor?.hasAttribute('data-external'))
    },
    {
      label: '  …and never rendered as data-external="false"',
      expected: 0,
      actual: document.querySelectorAll('.probe__cards [data-external="false"]').length
    },
    {
      label: 'D-26.1: an external_url on the site\'s own host takes NO marker',
      expected: 'true,false',
      actual: internal
        ? `${!!linkEl(internal)},${!!linkEl(internal)?.hasAttribute('data-external')}`
        : 'missing'
    },
    {
      label: '  …but is still a link, to that URL verbatim',
      expected: INTERNAL_URL,
      actual: linkEl(internal)?.getAttribute('href') ?? 'missing'
    },
    {
      label: 'no anchor on the page points into /wireframes/ or /projects/ (D2)',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLAnchorElement>('.probe__cards a'))
        .filter((a) => {
          const h = a.getAttribute('href') ?? ''
          return h.startsWith('/wireframes') || h.startsWith('/projects')
        }).length
    },
    {
      label: 'the linked card IS a link surface: stretched ::before, corner hit-test',
      expected: 'the heading link',
      actual: hitTestCorner(linked)
    },
    {
      label: '  …and the heading link takes focus',
      expected: 'the link is focused',
      actual: (() => {
        if (!linkedAnchor) return 'missing link'
        linkedAnchor.focus()
        return document.activeElement === linkedAnchor
          ? 'the link is focused'
          : 'focus did not land'
      })()
    },
    {
      label: '  …with the product title as its whole accessible name',
      expected: product.value?.heading ?? 'missing',
      actual: (linkedAnchor?.textContent ?? '').trim()
    },
    {
      label: 'exactly one link per linked card — no repeated CTA',
      expected: 1,
      actual: linked ? linked.querySelectorAll('a').length : -1
    },
    {
      /* #138, fixed in gh#36. This row read `""` before that. */
      label: 'the marker\'s ↗ survives on ::after — the overlay moved to ::before (#138)',
      expected: '" ↗"',
      actual: afterContent
    },
    {
      label: '  …and ::before is what makes the whole card clickable',
      expected: 'absolute',
      actual: linkedAnchor
        ? getComputedStyle(linkedAnchor, '::before').position
        : 'missing'
    },
    {
      label: '  …with ::after carrying no overlay of its own any more',
      expected: 'static',
      actual: linkedAnchor
        ? getComputedStyle(linkedAnchor, '::after').position
        : 'missing'
    },

    // --- 5. the excerpt ------------------------------------------------------
    {
      label: 'the real card\'s blurb is excerpt cut at excerptLength with an ellipsis',
      expected: expectedBlurb,
      actual: bodyOf(productCard)
    },
    {
      label: '  …the check is not vacuous: the real excerpt is longer than 220',
      expected: 'true',
      actual: String(rawExcerpt.length > 220)
    },
    {
      label: 'a 400-char excerpt is cut to 220 chars plus one ellipsis',
      expected: 221,
      actual: bodyOf(longExcerpt).length
    },
    {
      label: '  …and ends with the ellipsis character, not three dots',
      expected: 'true',
      actual: String(bodyOf(longExcerpt).endsWith('…'))
    },
    {
      label: 'a null excerpt falls back to description (?? — the frozen expression)',
      expected: DESCRIPTION_SENTINEL,
      actual: bodyOf(fallback)
    },
    {
      label: '  …but an EMPTY-STRING excerpt does not: `\'\'` is not nullish',
      expected: 0,
      actual: emptyExcerpt ? emptyExcerpt.querySelectorAll(':scope > p').length : -1
    },
    {
      label: '  …while that card still renders its heading and chips',
      expected: 'true,true',
      actual: emptyExcerpt
        ? `${!!headingEl(emptyExcerpt)},${chipTexts(emptyExcerpt).length > 0}`
        : 'missing'
    },

    // --- 6. headingLevel (#128) and the blank heading (#130) -----------------
    {
      label: 'the default headingLevel renders an <h3>',
      expected: 'H3',
      actual: headingEl(productCard)?.tagName ?? 'missing'
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
      label: '#130: a blank heading renders no heading element…',
      expected: 0,
      actual: noheading ? (headingEl(noheading) ? 1 : 0) : -1
    },
    {
      label: '  …and no anchor, though that row DOES carry an external_url',
      expected: 0,
      actual: noheading ? noheading.querySelectorAll('a').length : -1
    },
    {
      label: '  …no heading anywhere on the page is empty',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLElement>('.probe__cards :is(h2, h3, h4)'))
        .filter(h => (h.textContent ?? '').trim() === '').length
    },
    {
      label: '  …and no anchor anywhere has an empty accessible name',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLAnchorElement>('.probe__cards a'))
        .filter(a => (a.textContent ?? '').trim() === '' && !a.getAttribute('aria-label')).length
    },

    // --- 7. the wrapper owns no DOM ------------------------------------------
    {
      label: 'the card group is a <ul>',
      expected: 'UL',
      actual: bandEl?.tagName ?? 'missing'
    },
    {
      label: 'the wrapper\'s root IS bfCard\'s <li class="bf-card">',
      expected: allEls.length,
      actual: allEls.filter(el => el.tagName === 'LI').length
    },
    {
      label: 'the wrapper adds no element and no class of its own',
      expected: 0,
      actual: document.querySelectorAll('[class*="card-product" i], [class*="cardProduct"]').length
    },
    {
      label: 'heading-first DOM order, on every card that has a heading',
      expected: allEls.filter(el => headingEl(el)).length,
      actual: allEls.filter(el => headingIsFirst(el)).length
    },
    {
      label: 'no card renders a frozen wireframe class',
      expected: 0,
      actual: document.querySelectorAll('.probe__cards .wf-card, .probe__cards .wf-media, .probe__cards .wf-chip').length
    },

    // --- 8. $attrs through the wrapper ---------------------------------------
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
      label: '  …and no stray span="" attribute landed on the <li>',
      expected: 0,
      actual: allEls.filter(el => el.hasAttribute('span')).length
    },
    {
      label: '$attrs is merged AFTER the prop: a caller data-span overrides "full"',
      expected: 'row',
      actual: overridden?.getAttribute('data-span') ?? 'missing'
    },
    {
      label: '  …so that card is NOT stretched across the row',
      expected: 'true',
      actual: String(gridColumnOf(overridden) !== '1/-1')
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
    data-probe="26"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 26 — <code>bfCardProduct</code></h1>
    <p class="probe__lede">
      The sixth typed wrapper over <code>bfCard</code>, and the only
      <strong>external-only</strong> one: a product has no page on this site, so
      its heading is either an off-site <code>&lt;a&gt;</code> or plain text with
      no link at all. It defaults itself to <code>span="full"</code>, which
      <code>bfCard</code>'s own stylesheet (#29) resolves to
      <code>grid-column: 1 / -1</code>, and it asks <code>bfMedia</code> for a
      <code>21/9</code> box so that at double width it stays about one featured
      row tall. Every card below is fed a real
      <code>bfProjects</code> row <strong>queried by this page</strong> — the
      component fetches nothing.
    </p>

    <!--
      The real band: `pages/wireframes/index.vue:39-42`, with the frozen
      source's `style="grid-template-columns: repeat(2, 1fr)"` replaced by
      `data-min-width="xl"` — D9 forbids authoring a column count, and the
      composition layer resolves two 400px tracks in the 1200px container on its
      own. The Transponder leads; four real featured cards follow.
    -->
    <section aria-labelledby="band-heading">
      <h2 id="band-heading">Insights band</h2>

      <ul
        class="probe__cards probe__band | grid"
        data-min-width="xl"
        data-gap="m"
      >
        <bfCardProduct
          v-if="product"
          :product="product"
          :data-probe-card="product.slug"
        />
        <bfCardFeatured
          v-for="item in featured"
          :key="item.slug"
          :item="item"
          :data-probe-card="`featured-${item.slug}`"
        />
      </ul>
    </section>

    <!--
      The contract cards — both link branches, both excerpt branches, the
      heading levels, the blank heading and `$attrs` — kept out of the band
      above so its "1 + 4" and full-width assertions stay exact. Also a `.grid`,
      because `data-span` is a grid-slot modifier and means nothing elsewhere.
    -->
    <section aria-labelledby="contract-heading">
      <h2 id="contract-heading">Wrapper contract</h2>

      <ul
        class="probe__cards probe__variants | grid"
        data-min-width="xl"
        data-gap="m"
      >
        <!-- The linked branch: an off-site URL, marked. -->
        <bfCardProduct
          v-if="productLinked"
          :product="productLinked"
          data-probe-card="linked"
        />

        <!-- D-26.1: the site's own host — a link, deliberately unmarked. -->
        <bfCardProduct
          v-if="productInternal"
          :product="productInternal"
          data-probe-card="internal"
        />

        <!-- #128: the two levels the base styles but no wrapper could reach. -->
        <bfCardProduct
          v-if="product"
          :product="product"
          :heading-level="2"
          data-probe-card="level2"
        />

        <bfCardProduct
          v-if="product"
          :product="product"
          :heading-level="4"
          data-probe-card="level4"
        />

        <!--
          #130: a blank heading renders no heading and therefore no link — even
          though this row carries a perfectly good `external_url`.
        -->
        <bfCardProduct
          v-if="productNoHeading"
          :product="productNoHeading"
          data-probe-card="noheading"
        />

        <!-- `??`: a null excerpt reaches the description… -->
        <bfCardProduct
          v-if="productFallback"
          :product="productFallback"
          data-probe-card="fallback"
        />

        <!-- …and an empty-string one does not, so no empty <p> is rendered. -->
        <bfCardProduct
          v-if="productEmptyExcerpt"
          :product="productEmptyExcerpt"
          data-probe-card="empty-excerpt"
        />

        <!--
          A whitespace-only `external_url`: no anchor, so the card cannot become
          a card-sized link to nowhere. The frozen source tests the field raw
          and would render one.
        -->
        <bfCardProduct
          v-if="productBlankUrl"
          :product="productBlankUrl"
          data-probe-card="blankurl"
        />

        <!-- No `pending` field: the frozen source's Q6 fallback. -->
        <bfCardProduct
          v-if="productNoPending"
          :product="productNoPending"
          data-probe-card="nopending"
        />

        <!-- 400 characters in, 220 + an ellipsis out. -->
        <bfCardProduct
          v-if="productLongExcerpt"
          :product="productLongExcerpt"
          data-probe-card="long-excerpt"
        />

        <!-- `$attrs` through the wrapper: a caller class and a `data-*`. -->
        <bfCardProduct
          v-if="product"
          :product="product"
          class="probe__tinted"
          data-probe-card="spanned"
        />

        <!--
          `$attrs` is merged after the `span="full"` prop, so a caller who
          really wants a normal slot can still say so. `data-span` rather than
          the `span` prop, because a fallthrough attribute of the same name
          would be matched against `bfCard`'s prop and the two would agree by
          construction — this asserts the merge ORDER, which the prop form
          cannot.
        -->
        <bfCardProduct
          v-if="product"
          :product="product"
          data-span="row"
          data-probe-card="overridden"
        />
      </ul>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-26-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-26-table">
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
  A caller class on a `bfCardProduct`, present only to prove `$attrs` reaches
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
