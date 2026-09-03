<script setup lang="ts">
/**
 * Probe — issue 20 / gh#29: `bfCard`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against — the six typed wrappers (#30–#35) and the row
 * variant (#36) all render this component as their root — and only the final
 * cutover issue removes `bf-probe/`.
 *
 * ## What it proves
 *
 * 1. **All three slots render**, in a real `<ul class="grid" data-min-width>`
 *    rather than a mock container: `bfCard`'s whole contract is about being an
 *    `<li>` in an auto-fitting grid, and `span="full"` is meaningless outside
 *    one.
 * 2. **Heading first in the DOM, chips and media first on the screen.** The
 *    DOM order is asserted (heading is child 0; the chips and media wrappers
 *    come after the body) *and* the visual order is asserted from the computed
 *    `order` values — the two must disagree, which is the point.
 * 3. **`span="full"` spans every column.** Three ways, because each alone can
 *    be true for the wrong reason: the computed `grid-column` is `1 / -1`; the
 *    measured width equals the grid's content width; and the grid genuinely
 *    has ≥ 2 columns, without which the first two are vacuous.
 * 4. **The modifier is CSS, not a pinned column count** (D9 / #13): no card
 *    carries an inline `style` at all, so nothing wrote `grid-column` or a
 *    column template onto the element.
 * 5. **Both ways of asking for it agree** — the typed `span="full"` prop and
 *    the raw `data-span="full"` attribute through `$attrs`, which is the call
 *    shape `wfCardProduct.vue` uses today and which the wrappers keep.
 * 6. **The stretched link works**, asserted the only way that means anything:
 *    `elementFromPoint` on empty card space returns the *heading anchor*, and
 *    a click dispatched at that point fires the anchor's handler. A source
 *    grep for `::after` would not have caught a card that lost its
 *    `position: relative`.
 * 7. **A non-heading link stays reachable** above that overlay — the failure
 *    mode where a card silently has one link.
 * 8. **The focus ring is on the card, not on the heading text**, measured
 *    after a *trusted* Tab (`data-probe-keys`, the gh#28 harness handshake).
 *    A programmatic `.focus()` would not answer the question: `:focus-visible`
 *    is exactly the thing that behaves differently for one.
 * 9. `.bf-card` rules are inside `@layer components` in the live CSSOM.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 20`,
 * per the gh#20–#28 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
defineOptions({ name: 'BfProbe20BfCard' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 20 — bfCard'
})

/**
 * Sample cards. Excerpt lengths are deliberately unequal (BRIEF §5 rule 10 —
 * real content, 100–980 chars), so the `> time { margin-block-start: auto }`
 * baseline is exercised rather than asserted against three identical boxes.
 */
const cards = [
  {
    key: 'stretch',
    heading: 'A transatlantic agenda for the next decade',
    chips: ['Report'],
    excerpt:
      'Three years of consultations across Berlin, Brussels and Washington, '
      + 'condensed into the six commitments that most reliably survived '
      + 'contact with an election cycle.',
    datetime: '2024-03-14'
  },
  {
    key: 'short',
    heading: 'Democracy after the platform era',
    chips: ['Podcast', 'Series'],
    excerpt: 'A short one.',
    datetime: '2024-01-22'
  },
  {
    key: 'raised',
    heading: 'Future leadership fellows, 2025 cohort',
    chips: ['Announcement'],
    excerpt:
      'Twenty-four fellows from eleven countries, convening quarterly through '
      + 'the year. Applications for the next cohort open in the autumn.',
    datetime: '2023-11-06'
  }
] as const

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

const checks = ref<Check[]>([])

/**
 * Bound to `data-probe-keys` in the template, so the attribute appears only
 * once every listener is attached — the harness polls for it and its
 * appearance is the handshake (gh#28). Publishing it unconditionally would
 * race the `focusin` listener below.
 */
const armed = ref(false)

/** What the keyboard pass observed. Filled by the listeners, read by `finalise`. */
const seen = reactive({
  tabTrusted: false,
  focusedName: '',
  cardOutlineStyle: '',
  cardOutlineWidth: '',
  cardShadow: '',
  linkOutlineStyle: ''
})

onMounted(() => {
  /* ---------------------------------------------------------------- *
   * Helpers
   * ---------------------------------------------------------------- */
  const grid = document.querySelector<HTMLElement>('.probe__cards')!
  const cardEls = Array.from(document.querySelectorAll<HTMLElement>('.probe__cards > .bf-card'))
  const card = (key: string) =>
    document.querySelector<HTMLElement>(`.probe__cards > [data-probe-card="${key}"]`)
  const headingLink = (el: HTMLElement | null) =>
    el?.querySelector<HTMLAnchorElement>(':scope > :is(h2, h3, h4) > a') ?? null

  const px = (n: number) => `${Math.round(n)}px`

  /**
   * Resolve a spacing token to the pixel value the browser computed. Reading
   * `getPropertyValue('--space-xs')` off `:root` hands back the *unresolved*
   * `clamp()` text, which never equals a computed `gap`. (Same shape as the
   * colour helper probes 14–17 use, applied to a length.)
   */
  const resolveSpace = (token: string) => {
    const el = document.createElement('div')
    el.style.cssText = `position:absolute;visibility:hidden;inline-size:var(${token})`
    document.body.appendChild(el)
    const value = getComputedStyle(el).inlineSize
    el.remove()
    return value
  }

  /**
   * Walk every reachable stylesheet — `@import`ed ones included, since
   * `/css/styles.css` is nothing but a list of imports — for a `.bf-card`
   * style rule whose ancestry includes a `@layer components` block.
   * Cross-origin sheets throw on `cssRules`; they are skipped, not failed.
   *
   * `test` takes the whole rule so the focus-ring query can ask for a
   * selector that mentions `:focus-visible` as well as the class. Matched as a
   * whole class token, so a future `.bf-card-box` cannot keep this green after
   * the real rule was renamed away.
   */
  const layeredRuleFound = (test: (selector: string) => boolean): boolean => {
    const LAYER_BLOCK = globalThis.CSSLayerBlockRule
    if (!LAYER_BLOCK) return false

    const walk = (rules: CSSRuleList, insideComponents: boolean): boolean => {
      for (const rule of Array.from(rules)) {
        const nowInside =
          insideComponents
          || (rule instanceof LAYER_BLOCK && (rule as CSSLayerBlockRule).name === 'components')

        if (nowInside && rule instanceof CSSStyleRule && test(rule.selectorText)) {
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

  /* ---------------------------------------------------------------- *
   * The grid, and the two full-span cards
   * ---------------------------------------------------------------- */
  const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length
  const gridContentWidth = grid.clientWidth

  const spanProp = card('span-prop')
  const spanAttr = card('span-attrs')
  const plain = card('stretch')

  /* ---------------------------------------------------------------- *
   * Slots, DOM order, visual order
   * ---------------------------------------------------------------- */
  const full = card('span-prop')!
  const fullChildren = Array.from(full.children) as HTMLElement[]
  const indexOfChips = fullChildren.findIndex(el => el.classList.contains('bf-card__chips'))
  const indexOfMedia = fullChildren.findIndex(el => el.classList.contains('bf-card__media'))

  const chipsWrapper = full.querySelector<HTMLElement>(':scope > .bf-card__chips')
  const mediaWrapper = full.querySelector<HTMLElement>(':scope > .bf-card__media')

  /* ---------------------------------------------------------------- *
   * The stretched link, hit-tested
   * ---------------------------------------------------------------- */
  const stretched = plain!
  const stretchedLink = headingLink(stretched)!
  const rect = stretched.getBoundingClientRect()

  /*
   * Six pixels in from the card's bottom-right corner: inside the 1px border,
   * clear of the heading text at the top, and over nothing but the card's own
   * padding. The heading link's `::after` covers the padding box, so the
   * element at that point must be the anchor — that *is* the stretched link.
   */
  const hit = document.elementFromPoint(rect.right - 6, rect.bottom - 6)

  /*
   * …and the click actually reaches the anchor's handler. `preventDefault`
   * because the href is a real fragment and a navigation mid-probe would
   * scroll the page out from under the remaining measurements.
   */
  let clickedName = 'none'
  const onClick = (event: Event) => {
    clickedName = (event.currentTarget as HTMLElement).dataset.probeLink ?? 'unnamed'
    event.preventDefault()
  }
  stretchedLink.addEventListener('click', onClick)
  ;(hit as HTMLElement | null)?.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true })
  )
  stretchedLink.removeEventListener('click', onClick)

  /*
   * The other half: a link that is *not* the heading has to be clickable
   * through the overlay, or a card that offers two destinations silently
   * offers one.
   */
  const secondary = document.querySelector<HTMLAnchorElement>('[data-probe-secondary]')!
  const sRect = secondary.getBoundingClientRect()
  const secondaryHit = document.elementFromPoint(
    sRect.left + sRect.width / 2,
    sRect.top + sRect.height / 2
  )

  /** Everything that does not need a keyboard. Ordered as the doc comment lists it. */
  const staticChecks: Check[] = [
    // --- 1. the grid is real, and the three slots rendered -----------------
    { label: 'the card group is a <ul>', expected: 'UL', actual: grid.tagName },
    { label: 'every card is an <li>', expected: cardEls.length, actual: cardEls.filter(el => el.tagName === 'LI').length },
    { label: 'five cards rendered', expected: 5, actual: cardEls.length },
    {
      label: 'the grid resolves to ≥2 columns (or the span check is vacuous)',
      expected: 'true',
      actual: String(columns >= 2)
    },
    {
      label: 'default slot: every card leads with its heading',
      expected: 5,
      actual: cardEls.filter(el => el.children[0]?.tagName === 'H3').length
    },
    {
      label: 'chips slot: every card renders a .bf-card__chips wrapper',
      expected: 5,
      actual: cardEls.filter(el => el.querySelector(':scope > .bf-card__chips')).length
    },
    {
      label: 'media slot: every card renders a .bf-card__media wrapper',
      expected: 5,
      actual: cardEls.filter(el => el.querySelector(':scope > .bf-card__media')).length
    },
    {
      label: 'the chips wrapper is a .cluster with data-gap="xs"',
      expected: 'true',
      actual: String(
        !!chipsWrapper
        && chipsWrapper.classList.contains('cluster')
        && chipsWrapper.dataset.gap === 'xs'
      )
    },
    {
      label: '  …and that gap really resolves to --space-xs',
      expected: px(parseFloat(resolveSpace('--space-xs'))),
      actual: chipsWrapper ? px(parseFloat(getComputedStyle(chipsWrapper).columnGap)) : 'missing'
    },

    // --- 2. DOM order vs visual order -------------------------------------
    {
      label: 'DOM order: chips come AFTER the body (heading navigation lands first)',
      expected: 'true',
      actual: String(indexOfChips > 0)
    },
    {
      label: 'DOM order: media comes after the chips wrapper',
      expected: 'true',
      actual: String(indexOfMedia > indexOfChips)
    },
    {
      label: 'visual order: media is pulled to order -2',
      expected: '-2',
      actual: mediaWrapper ? getComputedStyle(mediaWrapper).order : 'missing'
    },
    {
      label: 'visual order: chips are pulled to order -1',
      expected: '-1',
      actual: chipsWrapper ? getComputedStyle(chipsWrapper).order : 'missing'
    },
    {
      label: '  …so media paints above the heading it follows in the DOM',
      expected: 'true',
      actual: String(
        !!mediaWrapper
        && mediaWrapper.getBoundingClientRect().top
          < full.querySelector('h3')!.getBoundingClientRect().top
      )
    },

    // --- 3. span="full" spans every column ---------------------------------
    {
      label: 'span="full" renders data-span="full"',
      expected: 'full',
      actual: spanProp?.getAttribute('data-span') ?? 'missing'
    },
    {
      label: '  …and computes grid-column-start 1',
      expected: '1',
      actual: spanProp ? getComputedStyle(spanProp).gridColumnStart : 'missing'
    },
    {
      label: '  …and grid-column-end -1',
      expected: '-1',
      actual: spanProp ? getComputedStyle(spanProp).gridColumnEnd : 'missing'
    },
    {
      label: '  …and measures the full content width of the grid',
      expected: px(gridContentWidth),
      actual: spanProp ? px(spanProp.getBoundingClientRect().width) : 'missing'
    },
    {
      label: '  …which is wider than an ordinary card in the same grid',
      expected: 'true',
      actual: String(
        !!spanProp && !!plain
        && spanProp.getBoundingClientRect().width > plain.getBoundingClientRect().width + 1
      )
    },
    {
      label: '  …and takes the heavier border (--border-width-medium)',
      expected: '2px',
      actual: spanProp ? getComputedStyle(spanProp).borderTopWidth : 'missing'
    },
    {
      label: 'an ordinary card keeps the thin border',
      expected: '1px',
      actual: plain ? getComputedStyle(plain).borderTopWidth : 'missing'
    },
    {
      label: 'a card with no span prop carries no data-span attribute',
      expected: 0,
      actual: cardEls.filter(el => el.dataset.probeCard?.startsWith('span') === false
        && el.hasAttribute('data-span')).length
    },

    // --- 4. the modifier is CSS, never an inline style ---------------------
    {
      label: 'no card carries an inline style attribute at all',
      expected: 0,
      actual: cardEls.filter(el => el.getAttribute('style') !== null).length
    },

    // --- 5. the raw data-span="full" path through $attrs -------------------
    {
      label: 'raw data-span="full" through $attrs reaches the <li>',
      expected: 'full',
      actual: spanAttr?.getAttribute('data-span') ?? 'missing'
    },
    {
      label: '  …and lays out identically to the prop',
      expected: spanProp ? px(spanProp.getBoundingClientRect().width) : 'missing',
      actual: spanAttr ? px(spanAttr.getBoundingClientRect().width) : 'missing'
    },
    {
      label: '$attrs fallthrough: data-probe-card reached every <li>',
      expected: 5,
      actual: cardEls.filter(el => el.dataset.probeCard).length
    },
    {
      label: '$attrs fallthrough: a caller class merges with .bf-card',
      expected: 'true',
      actual: String(
        !!plain && plain.classList.contains('bf-card') && plain.classList.contains('probe__tinted')
      )
    },

    // --- 6. the stretched link --------------------------------------------
    {
      label: 'empty card space hit-tests to the heading link (stretched ::after)',
      expected: 'stretch',
      actual: (hit as HTMLElement | null)?.dataset.probeLink ?? `${hit?.tagName ?? 'null'}`
    },
    {
      label: '  …and a click there fires the heading link\'s handler',
      expected: 'stretch',
      actual: clickedName
    },
    {
      label: '  …because the card is a containing block',
      expected: 'relative',
      actual: plain ? getComputedStyle(plain).position : 'missing'
    },
    {
      /*
       * The regression that `a:not(:is(h2, h3, h4) a)` shipped: lowered to
       * `a:not(h2):not(h3):not(h4)`, it positioned the heading anchor, which
       * then became the containing block for its own `::after` and shrank the
       * card-sized hit area to the width of the heading text. Asserted
       * directly, so the next person who reaches for `:not()` here finds out
       * from the harness rather than from a user.
       */
      label: '  …and the heading link itself is NOT positioned',
      expected: 'static',
      actual: getComputedStyle(stretchedLink).position
    },

    // --- 7. non-heading links stay above the overlay -----------------------
    {
      label: 'a non-heading link hit-tests to itself, not to the overlay',
      expected: 'true',
      actual: String(secondaryHit === secondary)
    },
    {
      label: '  …because it is raised out of the overlay',
      expected: 'relative/1',
      actual: `${getComputedStyle(secondary).position}/${getComputedStyle(secondary).zIndex}`
    },

    // --- 9. cascade layer --------------------------------------------------
    {
      label: '.bf-card rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(layeredRuleFound(s => /\.bf-card(?![\w-])/.test(s)))
    },
    {
      label: '  …including the card-level :focus-visible rule',
      expected: 'true',
      actual: String(
        layeredRuleFound(s => /\.bf-card(?![\w-])/.test(s) && s.includes(':focus-visible'))
      )
    }
  ]

  /**
   * Publish the results, static rows plus whatever the keyboard pass saw.
   * Called from the `focusin` listener, and from the safety timeout so a
   * harness that never delivers a key reports a red row rather than hanging
   * on `PENDING` forever.
   */
  const finalise = () => {
    if (checks.value.length > 0) return
    checks.value = [
      ...staticChecks,
      // --- 8. the focus ring is on the card, not on the heading text ------
      {
        label: 'the first Tab was a trusted key event',
        expected: 'true',
        actual: String(seen.tabTrusted)
      },
      {
        label: '  …and landed on the first card\'s heading link',
        expected: 'stretch',
        actual: seen.focusedName || 'nothing focused'
      },
      {
        label: '  …which rings the CARD (outline style)',
        expected: 'solid',
        actual: seen.cardOutlineStyle || 'no outline'
      },
      {
        label: '  …at --border-width-medium',
        expected: '2px',
        actual: seen.cardOutlineWidth || 'no outline'
      },
      {
        label: '  …with the --outline-focus halo alongside it',
        expected: 'true',
        actual: String(seen.cardShadow !== '' && seen.cardShadow !== 'none')
      },
      {
        label: '  …and not the heading text (the anchor\'s own ring is dropped)',
        expected: 'none',
        actual: seen.linkOutlineStyle || 'not measured'
      }
    ]
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') seen.tabTrusted ||= event.isTrusted
  })

  /*
   * `focusin` rather than `focus`: it bubbles, so one listener sees whatever
   * sequential navigation reached — including the case where it reached
   * something other than a card heading, which this probe should report rather
   * than silently wait out.
   */
  document.addEventListener('focusin', event => {
    const target = event.target as HTMLElement | null
    if (!target || seen.focusedName !== '') return

    seen.focusedName = target.dataset.probeLink ?? target.tagName
    seen.linkOutlineStyle = getComputedStyle(target).outlineStyle

    const owner = target.closest<HTMLElement>('.bf-card')
    if (owner) {
      const cs = getComputedStyle(owner)
      seen.cardOutlineStyle = cs.outlineStyle
      seen.cardOutlineWidth = cs.outlineWidth
      seen.cardShadow = cs.boxShadow
    }

    finalise()
  })

  /* A key that never arrives is a red row, not an eternal PENDING. */
  setTimeout(finalise, 5000)

  /*
   * Only now — with every listener attached — ask for the key. The harness
   * polls for this attribute, so its appearance is the handshake.
   */
  armed.value = true
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states, not two. The assertions need a keyboard, so before one arrives
 * the honest answer is `pending`: the prerendered HTML has run nothing, and
 * baking `FAIL` into it would read as a regression to the next issue that
 * greps the file. The harness treats a probe still PENDING at timeout as a
 * failure, never a skip.
 */
const state = computed<'pending' | 'pass' | 'fail'>(() => {
  if (checks.value.length === 0) return 'pending'
  return passed.value === checks.value.length ? 'pass' : 'fail'
})

const verdict = computed(() =>
  state.value === 'pending'
    ? 'PENDING — press Tab (the harness does this for you)'
    : `${state.value === 'pass' ? 'PASS' : 'FAIL'} — ${passed.value}/${checks.value.length} checks`
)
</script>

<template>
  <!--
    Harness contract (docs/decisions/probe-harness.md): the root carries
    `data-probe` + `data-probe-verdict`, and every check row carries
    `data-probe-row` + `data-ok`, so `scripts/check-probes.ts` fails the build
    on a red probe instead of relying on someone opening the page.

    `data-probe-keys` is bound rather than written, so it appears only after
    `onMounted` — the handshake described in the script block.
  -->
  <main
    class="probe container"
    data-probe="20"
    :data-probe-verdict="state.toUpperCase()"
    :data-probe-keys="armed ? 'Tab' : undefined"
  >
    <h1>Probe 20 — <code>bfCard</code></h1>
    <p class="probe__lede">
      The slot-based card shell: an <code>&lt;li&gt;</code> with a
      <code>default</code>, a <code>chips</code> and a <code>media</code> slot,
      and one prop. The heading comes <em>first in the DOM</em> so heading
      navigation lands at the start of the card; chips and media follow it in
      the markup and are pulled above it visually with CSS <code>order</code>.
      The two cards at the end take the whole row — one through the
      <code>span="full"</code> prop, one through a raw
      <code>data-span="full"</code> attribute on <code>$attrs</code>, which is
      the call shape the typed wrappers inherit.
    </p>

    <!--
      The group is a real `<ul class="grid">` with a `data-min-width`, not a
      mock container: `grid-column: 1 / -1` only means anything inside a grid
      whose column count it does not control.
    -->
    <section aria-labelledby="grid-heading">
      <h2 id="grid-heading">A real card grid</h2>

      <ul class="probe__cards | grid" data-min-width="s" data-gap="m">
        <bfCard
          v-for="c in cards"
          :key="c.key"
          :data-probe-card="c.key"
          :class="c.key === 'stretch' ? 'probe__tinted' : undefined"
        >
          <h3>
            <a :href="`#card-${c.key}`" :data-probe-link="c.key">{{ c.heading }}</a>
          </h3>
          <p>{{ c.excerpt }}</p>
          <!--
            The one non-heading link in the set. It has to stay clickable
            through the stretched overlay, which is what the `z-index` rule in
            `Card.vue` is for and what the hit test below asserts.
          -->
          <p v-if="c.key === 'raised'">
            <a href="#secondary-target" data-probe-secondary>Meet the fellows</a>
          </p>
          <bfTime :date="c.datetime" />
          <template #chips>
            <bfChip v-for="chip in c.chips" :key="chip">{{ chip }}</bfChip>
          </template>
          <template #media>
            <bfMedia />
          </template>
        </bfCard>

        <!-- The prop path. -->
        <bfCard span="full" data-probe-card="span-prop">
          <h3>
            <a href="#card-span-prop" data-probe-link="span-prop">
              Transponder — the magazine, issue 14
            </a>
          </h3>
          <p>
            The special card inside a card grid: full-bleed across whatever
            column count the grid resolved to, with the heavier border that
            makes it read as special rather than merely wide.
          </p>
          <bfTime date="2024-06-03" />
          <template #chips>
            <bfChip>Magazine</bfChip>
          </template>
          <template #media>
            <bfMedia ratio="21/9" />
          </template>
        </bfCard>

        <!-- The `$attrs` path — `wfCardProduct.vue`'s call shape, unchanged. -->
        <bfCard data-span="full" data-probe-card="span-attrs">
          <h3>
            <a href="#card-span-attrs" data-probe-link="span-attrs">
              The same modifier, written by hand
            </a>
          </h3>
          <p>
            No <code>span</code> prop here: the raw attribute falls through
            <code>$attrs</code> to the same <code>&lt;li&gt;</code> and hits the
            same rule, so a wrapper written before the prop existed keeps
            working.
          </p>
          <bfTime date="2023-09-18" />
          <template #chips>
            <bfChip>Magazine</bfChip>
          </template>
          <template #media>
            <bfMedia ratio="21/9" />
          </template>
        </bfCard>
      </ul>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-20-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-20-table">
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

    <p id="secondary-target">Fragment target for the secondary link.</p>
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
  A caller class on a `bfCard`, present only to prove that `$attrs` merges it
  with the component's own `.bf-card` rather than replacing it. It paints
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
