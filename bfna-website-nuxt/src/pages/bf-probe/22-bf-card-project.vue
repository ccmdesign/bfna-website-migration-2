<script setup lang="ts">
/**
 * Probe — issue 22 / gh#31: `bfCardProject`.
 *
 * Dev-only route, never linked from nav; only the final cutover issue (#68)
 * removes `bf-probe/`. Follows the #109 harness convention
 * (`docs/decisions/probe-harness.md`): `[data-probe-verdict]` on the root,
 * `[data-probe-row][data-ok]` on every row, run by
 * `npx tsx scripts/check-probes.ts --only 22`.
 *
 * ## Real documents, queried here and only here
 *
 * `bfCardProject` is presentational-only (BRIEF D8) — it fetches nothing. The
 * **page** queries five real `bfProjects` rows and hands them over as props:
 *
 * | key | slug | why this row |
 * |---|---|---|
 * | `city` | `city-solutions-series` | a mapped `kind`, a real image, a **1550-character** excerpt (so truncation is real) and a `description` that starts with completely different words — which is what makes the `?? description` fallback testable rather than indistinguishable |
 * | `periscope` | `transatlantic-periscope` | `external_url` set, mapped `kind`, real image → the ↗ marker and both chips |
 * | `transponder` | `transponder-magazine` | `pending: 'Q6'` and **no** `external_url` → the pending chip on a card that is still linked and carries no arrow |
 * | `docs` | `bfna-documentaries` | `external_url` **and** `pending: 'Q7'`, `kind: null`, `image: null` → the chip set without a kind chip, and `bfMedia`'s placeholder branch |
 * | `cepi` | `cepi-2010` | no kind, no external, no pending → `hasChips` is false and the card must render **no chips element at all** |
 *
 * ## What it proves
 *
 * 1. the **media × chips matrix** — all four combinations, asserted as the
 *    presence/absence of `bfCard`'s own `.bf-card__media` / `.bf-card__chips`
 *    wrappers, because a slot provided-but-empty would still emit the element
 *    and contribute a `gap`;
 * 2. `mediaRatio` reaches `bfMedia` — the `3/2` default and a caller override,
 *    read from the **resolved** `aspect-ratio` rather than from the attribute;
 * 3. the chips are `kindLabel(kind)` → `External platform` → `Copy pending N`,
 *    in that order, and appear on exactly the documents that earn them —
 *    asserted as set equalities (#115's hardening), so adding a card cannot
 *    make a broken condition pass;
 * 4. **the heading always links** to `/projects/<slug>` — external and pending
 *    alike — and no card links into `/wireframes/`;
 * 5. the **↗ marker** appears on exactly the external documents, is
 *    `aria-hidden`, and therefore leaves the link's accessible name as the
 *    plain project title;
 * 6. **no anchor carries `[data-external]`** — the deliberate divergence from
 *    the spec's Scope paragraph, recorded as D-22.3 and asserted here so it
 *    cannot be reintroduced by accident;
 * 7. the excerpt truncates at `excerptLength` with a single `…`, and falls
 *    back to `description` when `excerpt` is nullish — proved by *which text*
 *    is rendered, not by its length;
 * 8. `headingLevel` (#128) renders h2/h3/h4 **and** the base's stretched link
 *    still covers the whole card at each — hit-tested, the only proof that
 *    means anything;
 * 9. a blank heading renders no heading and no anchor (#130);
 * 10. the wrapper owns no DOM: its rendered root *is* `bfCard`'s
 *     `<li class="bf-card">`, it adds no class of its own, and `$attrs` — a
 *     caller `class`, a `data-*`, and the `span` **prop** — reach the base
 *     through it.
 *
 * No keyboard is needed (the focus ring belongs to `bfCard` and is asserted on
 * probe 20), so this page declares no `data-probe-keys`.
 */
import type { Project } from '~/types/bf-contracts'
import { kindLabel } from '~/utils/format'

defineOptions({ name: 'BfProbe22BfCardProject' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 22 — bfCardProject'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/** The five slugs, named once so the assertions below can quote them. */
const SLUGS = {
  city: 'city-solutions-series',
  periscope: 'transatlantic-periscope',
  transponder: 'transponder-magazine',
  docs: 'bfna-documentaries',
  cepi: 'cepi-2010'
} as const

/** The component's own default, restated so the probe asserts a number it names. */
const DEFAULT_EXCERPT_LENGTH = 140

const { data } = await useAsyncData('bf-probe-22', async () => {
  const bySlug = (slug: string) =>
    queryCollection('bfProjects').where('slug', '=', slug).first()

  const [city, periscope, transponder, docs, cepi] = await Promise.all([
    bySlug(SLUGS.city),
    bySlug(SLUGS.periscope),
    bySlug(SLUGS.transponder),
    bySlug(SLUGS.docs),
    bySlug(SLUGS.cepi)
  ])

  return { city, periscope, transponder, docs, cepi }
})

/*
 * Assignability checks, not casts. If `bfProjectSchema` ever drifts from the
 * `Project` type these lines stop compiling — which is the point of the
 * component taking the entity rather than six loose fields.
 */
const city = computed<Project | null>(() => data.value?.city ?? null)
const periscope = computed<Project | null>(() => data.value?.periscope ?? null)
const transponder = computed<Project | null>(() => data.value?.transponder ?? null)
const docs = computed<Project | null>(() => data.value?.docs ?? null)
const cepi = computed<Project | null>(() => data.value?.cepi ?? null)

/**
 * `city-solutions-series` with its `excerpt` removed, so the `?? description`
 * fallback has something to fire on. No real row carries a nullish `excerpt`
 * beside a non-empty `description`, and the two fields on this row open with
 * completely different sentences — which is what makes the assertion a test of
 * *which* field was used rather than of a string length.
 */
const cityNoExcerpt = computed<Project | null>(() => {
  const row = city.value
  return row ? { ...row, excerpt: null } : null
})

/**
 * A real row with a blank heading — the #130 case on this wrapper.
 * `bfProjectSchema` types `heading` as non-nullable, so `''` is the reachable
 * form of the defect here.
 */
const cepiNoHeading = computed<Project | null>(() => {
  const row = cepi.value
  return row ? { ...row, heading: '' } : null
})

const checks = ref<Check[]>([])

onMounted(() => {
  const cardEls = Array.from(document.querySelectorAll<HTMLElement>('.probe__cards > .bf-card'))
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
    const first = el.children[0]
    return !!first && first === headingEl(el)
  }

  /**
   * The heading link's accessible name, as a screen reader computes it here:
   * the text of the anchor minus anything `aria-hidden`. That is the whole
   * point of the ↗ being hidden — "north east arrow" read after every external
   * project title would be noise.
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

  /** The card keys carrying a given condition, sorted — for set equalities. */
  const keysWhere = (predicate: (el: HTMLElement) => boolean) =>
    cardEls
      .filter(predicate)
      .map(el => el.dataset.probeCard ?? '?')
      .sort()
      .join(',')

  const m0c0 = card('m0c0')
  const m0c1 = card('m0c1')
  const m1c0 = card('m1c0')
  const m1c1 = card('m1c1')
  const ratio = card('ratio')
  const external = card('external')
  const pending = card('pending')
  const both = card('both')
  const nochips = card('nochips')
  const fallback = card('fallback')
  const level2 = card('level2')
  const level4 = card('level4')
  const noheading = card('noheading')
  const spanned = card('spanned')

  const cityExcerpt = city.value?.excerpt ?? ''
  const cityDescription = city.value?.description ?? ''
  const matrixText = excerptOf(m0c1)
  const fallbackText = excerptOf(fallback)

  /* The documents that carry each condition, named from the data rather than
     from the markup, so the set equalities below compare two independent
     derivations of the same fact. */
  const externalDocs = keysWhere(el => el.dataset.probeExternal === 'true')
  const pendingDocs = keysWhere(el => el.dataset.probePending === 'true')

  checks.value = [
    // --- 0. the group is real, and the wrapper owns no DOM -----------------
    {
      label: 'the card group is a <ul>',
      expected: 'UL',
      actual: document.querySelector<HTMLElement>('.probe__cards')?.tagName ?? 'missing'
    },
    { label: 'fourteen project cards rendered', expected: 14, actual: cardEls.length },
    {
      label: 'the wrapper\'s root IS bfCard\'s <li class="bf-card">',
      expected: 14,
      actual: cardEls.filter(el => el.tagName === 'LI').length
    },
    {
      label: 'the wrapper adds no element and no class of its own',
      expected: 0,
      actual: document.querySelectorAll('[class*="card-project" i], [class*="cardProject"]').length
    },
    {
      label: 'heading-first DOM order, on every card that has a heading',
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
    {
      label: 'no card renders the frozen wireframe chip class',
      expected: 0,
      actual: document.querySelectorAll('.probe__cards .wf-chip').length
    },

    // --- 1. the media × chips matrix (the issue's named acceptance) --------
    {
      label: 'matrix media=false chips=false → neither slot element',
      expected: 'no media/no chips',
      actual: `${mediaBox(m0c0) ? 'media' : 'no media'}/${chipsBox(m0c0) ? 'chips' : 'no chips'}`
    },
    {
      label: 'matrix media=false chips=true  → chips only',
      expected: 'no media/chips',
      actual: `${mediaBox(m0c1) ? 'media' : 'no media'}/${chipsBox(m0c1) ? 'chips' : 'no chips'}`
    },
    {
      label: 'matrix media=true  chips=false → media only',
      expected: 'media/no chips',
      actual: `${mediaBox(m1c0) ? 'media' : 'no media'}/${chipsBox(m1c0) ? 'chips' : 'no chips'}`
    },
    {
      label: 'matrix media=true  chips=true  → both',
      expected: 'media/chips',
      actual: `${mediaBox(m1c1) ? 'media' : 'no media'}/${chipsBox(m1c1) ? 'chips' : 'no chips'}`
    },
    {
      /*
       * `media` is off by default — the opposite of `bfCardInsight`'s
       * `excerpt`, and the reason the prop exists to turn one *on*.
       */
      label: 'media is off by default (the card passes no `media` prop)',
      expected: 0,
      actual: mediaBox(card('external')) ? 1 : 0
    },
    {
      label: 'the media box sits above the heading visually (order: -2)',
      expected: '-2',
      actual: mediaBox(m1c1) ? getComputedStyle(mediaBox(m1c1)!).order : 'missing'
    },
    {
      label: '  …while staying AFTER it in the DOM',
      expected: 'true',
      actual: String(!!m1c1 && headingIsFirst(m1c1))
    },

    // --- 2. mediaRatio reaches bfMedia ------------------------------------
    {
      label: 'the default mediaRatio resolves to 3/2 on the media element',
      expected: '3 / 2',
      actual: mediaEl(m1c1) ? getComputedStyle(mediaEl(m1c1)!).aspectRatio : 'missing'
    },
    {
      label: '  …and a caller override reaches it too',
      expected: '1 / 1',
      actual: mediaEl(ratio) ? getComputedStyle(mediaEl(ratio)!).aspectRatio : 'missing'
    },
    {
      label: '  …on the placeholder branch as well (a row with image: null)',
      expected: '3 / 2',
      actual: mediaEl(both) ? getComputedStyle(mediaEl(both)!).aspectRatio : 'missing'
    },
    {
      label: 'the decorative image declares alt="" rather than omitting it',
      expected: '""',
      actual: (() => {
        const img = mediaEl(m1c1)
        if (!img) return 'missing'
        return img.tagName === 'IMG' ? `"${img.getAttribute('alt') ?? 'ABSENT'}"` : 'not an <img>'
      })()
    },

    // --- 3. the chips: content, order, and exactly which documents --------
    {
      label: 'chips render kind → External platform → Copy pending',
      expected: [kindLabel('interactive-multimedia-platform'), 'External platform'].join(','),
      actual: chipsOf(external).join(',')
    },
    {
      label: '  …and a kind-less external+pending row drops only the kind chip',
      expected: 'External platform,Copy pending Q7',
      actual: chipsOf(both).join(',')
    },
    {
      label: '  …and a pending row with no external URL reads kind + pending',
      expected: `${kindLabel('podcast')},Copy pending Q6`,
      actual: chipsOf(pending).join(',')
    },
    {
      label: 'the kind chip is kindLabel(project.kind), not the raw slug',
      expected: 'Research & Documentary Project',
      actual: chipsOf(m0c1)[0] ?? 'missing'
    },
    {
      label: '  …and it agrees with kindLabel on the real row',
      expected: kindLabel(city.value?.kind ?? null) ?? 'missing row',
      actual: chipsOf(m0c1)[0] ?? 'missing'
    },
    {
      label: 'the External platform chip is on exactly the external documents',
      expected: externalDocs || '(none external — the check would be vacuous)',
      actual: keysWhere(el => chipsOf(el).includes('External platform')) || '(none)'
    },
    {
      label: '  …which is a non-empty set',
      expected: 'true',
      actual: String(externalDocs.length > 0)
    },
    {
      label: 'the Copy pending chip is on exactly the pending documents',
      expected: pendingDocs || '(none pending — the check would be vacuous)',
      actual: keysWhere(el => chipsOf(el).some(c => c.startsWith('Copy pending'))) || '(none)'
    },
    {
      label: '  …which is a non-empty set',
      expected: 'true',
      actual: String(pendingDocs.length > 0)
    },
    {
      /*
       * `hasChips` decided before the slot, not inside it: `bfCard` renders its
       * wrapper on `v-if="$slots.chips"`, so a slot provided-but-empty would
       * still emit a `.bf-card__chips` element and contribute a `gap`.
       */
      label: 'a row with no kind, no external URL and no pending renders NO chips element',
      expected: 'no chips',
      actual: chipsBox(nochips) ? 'chips' : 'no chips'
    },
    {
      label: 'the chips are bfChip <span>s, not bare wf-chips',
      expected: 'SPAN/span',
      actual: (() => {
        const chip = external?.querySelector<HTMLElement>(':scope > .bf-card__chips > .bf-chip')
        return chip ? `${chip.tagName}/${chip.dataset.element}` : 'missing'
      })()
    },

    // --- 4. the heading ALWAYS links --------------------------------------
    {
      label: 'the heading links to the bf-* project route',
      expected: `/projects/${SLUGS.city}`,
      actual: headingLink(m0c1)?.getAttribute('href') ?? 'missing'
    },
    {
      label: '  …an EXTERNAL project links to its internal overview page, not off-site',
      expected: `/projects/${SLUGS.periscope}`,
      actual: headingLink(external)?.getAttribute('href') ?? 'missing'
    },
    {
      label: '  …and a PENDING project is linked too — pending is a chip, not a branch',
      expected: `/projects/${SLUGS.transponder}`,
      actual: headingLink(pending)?.getAttribute('href') ?? 'missing'
    },
    {
      label: '  …so every card with a heading has exactly one link',
      expected: cardEls.filter(el => headingEl(el)).length,
      actual: cardEls.filter(el => el.querySelectorAll('a').length === 1).length
    },
    {
      label: '  …and no card links into /wireframes/ (the wf-* route is gone)',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLAnchorElement>('.probe__cards a'))
        .filter(a => (a.getAttribute('href') ?? '').includes('/wireframes')).length
    },
    {
      label: '  …and none links straight to the external URL',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLAnchorElement>('.probe__cards a'))
        .filter(a => (a.getAttribute('href') ?? '').startsWith('http')).length
    },

    // --- 5. the ↗ marker ---------------------------------------------------
    {
      label: 'the ↗ marker is on exactly the external documents',
      expected: externalDocs,
      actual: keysWhere(el => (headingLink(el)?.textContent ?? '').includes('↗'))
    },
    {
      label: '  …appended after the title, with its separating space intact',
      expected: `${periscope.value?.heading ?? 'missing row'} ↗`,
      actual: (headingLink(external)?.textContent ?? '').trim()
    },
    {
      label: '  …inside an aria-hidden span, so it is not read aloud',
      expected: 'true',
      actual: String(
        headingLink(external)?.querySelector('span')?.getAttribute('aria-hidden') === 'true'
      )
    },
    {
      label: '  …leaving the link\'s accessible name as the plain project title',
      expected: periscope.value?.heading ?? 'missing row',
      actual: accessibleName(headingLink(external))
    },
    {
      label: '  …and a non-external card\'s name is its title, unmarked',
      expected: city.value?.heading ?? 'missing row',
      actual: accessibleName(headingLink(m0c1))
    },
    {
      /*
       * D-22.3, asserted rather than only written down. The spec's Scope asks
       * for `[data-external]` on the heading anchor in the same breath as
       * asking the heading to always link internally; the marker means "this
       * href goes off-site" (`utils/link.ts`, `components/external-link.css`)
       * and would be a lie on a `/projects/…` link. It must stay absent.
       */
      label: 'no anchor carries [data-external] — the link never leaves the site (D-22.3)',
      expected: 0,
      actual: document.querySelectorAll('.probe__cards a[data-external]').length
    },

    // --- 6. the excerpt: truncation and the ?? description fallback --------
    {
      label: `the default excerptLength (${DEFAULT_EXCERPT_LENGTH}) truncates the 1550-char excerpt`,
      expected: DEFAULT_EXCERPT_LENGTH + 1,
      actual: matrixText.length
    },
    {
      label: '  …with a single ellipsis character appended',
      expected: 'true',
      actual: String(matrixText.endsWith('…') && !matrixText.endsWith('...'))
    },
    {
      label: '  …and the kept text is a real prefix of the row\'s excerpt',
      expected: 'true',
      actual: String(
        cityExcerpt.length > DEFAULT_EXCERPT_LENGTH
        && cityExcerpt.startsWith(matrixText.slice(0, -1).trimEnd())
      )
    },
    {
      label: 'a nullish excerpt falls back to description',
      expected: 'true',
      actual: String(
        fallbackText.length > 0
        && cityDescription.startsWith(fallbackText.slice(0, -1).trimEnd())
      )
    },
    {
      label: '  …and it is genuinely the OTHER field (the two rows differ)',
      expected: 'true',
      actual: String(fallbackText !== matrixText && !cityExcerpt.startsWith(fallbackText.slice(0, 40)))
    },
    {
      label: 'a short excerpt is not truncated',
      expected: 'true',
      actual: String(excerptOf(nochips).length > 0 && !excerptOf(nochips).endsWith('…'))
    },

    // --- 7. headingLevel — the shared wrapper contract (#128) --------------
    {
      label: 'the default headingLevel renders an <h3>',
      expected: 'H3',
      actual: headingEl(external)?.tagName ?? 'missing'
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
      actual: [external, level2, level4].map(hitTestHeadingLink).join(',')
    },
    {
      label: '  …with the heading anchor itself left unpositioned at each level',
      expected: 'static,static,static',
      actual: [external, level2, level4]
        .map(el => {
          const link = headingLink(el)
          return link ? getComputedStyle(link).position : 'missing'
        })
        .join(',')
    },
    {
      label: '  …and the ↗ survives the level change',
      expected: 'true,true',
      actual: [level2, level4]
        .map(el => String((headingLink(el)?.textContent ?? '').includes('↗')))
        .join(',')
    },

    // --- 8. a blank heading renders no unnamed link (#130) -----------------
    {
      label: 'a blank heading renders no heading element at all',
      expected: 0,
      actual: noheading ? (headingEl(noheading) ? 1 : 0) : -1
    },
    {
      label: '  …and therefore no anchor, rather than a card-sized unnamed link',
      expected: 0,
      actual: noheading ? noheading.querySelectorAll('a').length : -1
    },
    {
      label: '  …while the rest of the card still renders its excerpt',
      expected: 'true',
      actual: String(!!noheading && excerptOf(noheading).length > 0)
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
      expected: 13,
      actual: document.querySelectorAll('.probe__cards a').length
    },

    // --- 9. $attrs reach the base through the wrapper ---------------------
    {
      label: '$attrs: data-probe-card reached every base <li>',
      expected: 14,
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
      label: 'an ordinary project card carries no data-span',
      expected: 0,
      actual: cardEls.filter(el => el.dataset.probeCard !== 'spanned' && el.hasAttribute('data-span')).length
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
    data-probe="22"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 22 — <code>bfCardProject</code></h1>
    <p class="probe__lede">
      The second typed wrapper over <code>bfCard</code>: one entity prop
      (<code>project</code>, the zod-inferred type) plus four presentation
      switches and the shared <code>headingLevel</code>,
      <code>inheritAttrs: false</code>, and a root of
      <code>&lt;bfCard v-bind="$attrs"&gt;</code> so the wrapper owns no DOM of
      its own. Every card below is fed a <code>bfProjects</code> row
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
      <h2 id="grid-heading">Fourteen real projects</h2>

      <ul class="probe__cards | grid" data-min-width="s" data-gap="m">
        <!-- The media × chips matrix, all four cells on one real row. -->
        <bfCardProject
          v-if="city"
          :project="city"
          :media="false"
          :chips="false"
          data-probe-card="m0c0"
          :data-probe-external="String(!!city.external_url)"
          :data-probe-pending="String(!!city.pending)"
        />

        <bfCardProject
          v-if="city"
          :project="city"
          :media="false"
          data-probe-card="m0c1"
          :data-probe-external="String(!!city.external_url)"
          :data-probe-pending="String(!!city.pending)"
        />

        <bfCardProject
          v-if="city"
          :project="city"
          media
          :chips="false"
          data-probe-card="m1c0"
          :data-probe-external="String(!!city.external_url)"
          :data-probe-pending="String(!!city.pending)"
        />

        <bfCardProject
          v-if="city"
          :project="city"
          media
          data-probe-card="m1c1"
          :data-probe-external="String(!!city.external_url)"
          :data-probe-pending="String(!!city.pending)"
        />

        <!-- A caller-supplied ratio, to prove the prop reaches bfMedia. -->
        <bfCardProject
          v-if="city"
          :project="city"
          media
          media-ratio="1/1"
          data-probe-card="ratio"
          :data-probe-external="String(!!city.external_url)"
          :data-probe-pending="String(!!city.pending)"
        />

        <!--
          External: the ↗ after the title, the "External platform" chip, and a
          heading link that still points at the internal overview page.
          Deliberately passes no `media`, so the default (off) is exercised.
        -->
        <bfCardProject
          v-if="periscope"
          :project="periscope"
          data-probe-card="external"
          :data-probe-external="String(!!periscope.external_url)"
          :data-probe-pending="String(!!periscope.pending)"
        />

        <!-- Pending, and still linked: `pending` adds a chip, not a branch. -->
        <bfCardProject
          v-if="transponder"
          :project="transponder"
          data-probe-card="pending"
          :data-probe-external="String(!!transponder.external_url)"
          :data-probe-pending="String(!!transponder.pending)"
        />

        <!--
          External AND pending, with `kind: null` and `image: null` — the chip
          set without a kind chip, on bfMedia's placeholder branch.
        -->
        <bfCardProject
          v-if="docs"
          :project="docs"
          media
          data-probe-card="both"
          :data-probe-external="String(!!docs.external_url)"
          :data-probe-pending="String(!!docs.pending)"
        />

        <!-- No kind, no external URL, no pending → no chips element at all. -->
        <bfCardProject
          v-if="cepi"
          :project="cepi"
          data-probe-card="nochips"
          :data-probe-external="String(!!cepi.external_url)"
          :data-probe-pending="String(!!cepi.pending)"
        />

        <!-- `excerpt` nulled, so `?? description` has something to fire on. -->
        <bfCardProject
          v-if="cityNoExcerpt"
          :project="cityNoExcerpt"
          data-probe-card="fallback"
          :data-probe-external="String(!!cityNoExcerpt.external_url)"
          :data-probe-pending="String(!!cityNoExcerpt.pending)"
        />

        <!--
          #128: the two heading levels the base styles but no wrapper could
          reach. The level is a page-outline decision, so it is passed from
          here and never derived inside the component.
        -->
        <bfCardProject
          v-if="periscope"
          :project="periscope"
          :heading-level="2"
          data-probe-card="level2"
          :data-probe-external="String(!!periscope.external_url)"
          :data-probe-pending="String(!!periscope.pending)"
        />

        <bfCardProject
          v-if="periscope"
          :project="periscope"
          :heading-level="4"
          data-probe-card="level4"
          :data-probe-external="String(!!periscope.external_url)"
          :data-probe-pending="String(!!periscope.pending)"
        />

        <!-- #130: a blank heading must not become a card-sized unnamed link. -->
        <bfCardProject
          v-if="cepiNoHeading"
          :project="cepiNoHeading"
          data-probe-card="noheading"
          :data-probe-external="String(!!cepiNoHeading.external_url)"
          :data-probe-pending="String(!!cepiNoHeading.pending)"
        />

        <!--
          `$attrs` through the wrapper: a caller class, a `data-*`, and the
          `span` **prop** — undeclared here, so it falls into `$attrs` and is
          matched against `bfCard`'s own props by the `v-bind`.
        -->
        <bfCardProject
          v-if="periscope"
          :project="periscope"
          span="full"
          class="probe__tinted"
          data-probe-card="spanned"
          :data-probe-external="String(!!periscope.external_url)"
          :data-probe-pending="String(!!periscope.pending)"
        />
      </ul>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-22-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-22-table">
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
  A caller class on a `bfCardProject`, present only to prove `$attrs` reaches
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
