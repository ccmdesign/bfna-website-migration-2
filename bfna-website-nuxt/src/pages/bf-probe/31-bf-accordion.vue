<script setup lang="ts">
/**
 * Probe — issue 31 / gh#40: `bfAccordion`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## Why this probe presses real keys
 *
 * The issue's acceptance is *"it opens and closes by mouse and keyboard"*, and
 * the only honest way to assert the keyboard half is to press the keys. A
 * scripted `summary.click()` exercises the activation path; it does not
 * exercise the **key handling**, which is the thing being claimed — and the
 * claim here is unusual in that it is a claim about code that *does not exist*.
 * `bfAccordion` writes no key handler at all; it asserts that the browser's own
 * one is intact because nothing was done to break it. That is exactly the sort
 * of claim a `.click()` would pass while a `<button>` + `v-show` rewrite
 * silently regressed Space.
 *
 * So the root declares `data-probe-keys="Enter,Space"` once it has hydrated and
 * focused the lab's `<summary>`, and `scripts/check-probes.ts` dispatches those
 * as **trusted** CDP key events (harness hook, `docs/decisions/probe-harness.md`
 * Decision 4). Enter must open it; Space must close it again.
 *
 * Opened by hand, the page waits: press <kbd>Enter</kbd>, then <kbd>Space</kbd>.
 *
 * ## What it proves
 *
 *  1. **The element is native.** Every accordion is a real `<details>` whose
 *     first child is a real `<summary>`, and the page contains **no**
 *     `aria-expanded`, no `role="button"`, no `aria-controls` — the
 *     re-implementation the spec forbids would show up as exactly those.
 *  2. **`open` is an initial state, not a binding.** The closed case is closed,
 *     the open-by-default case is open, and after the keyboard has toggled the
 *     lab accordion twice nothing has re-rendered it back.
 *  3. **Enter opens it and Space closes it**, both from trusted key events on
 *     the focused `<summary>`, with the `toggle` events to show for it.
 *  4. **Tab order tracks disclosure, for free.** A link inside a closed
 *     accordion cannot take focus and is not rendered; the identical link
 *     inside an open one can and is. This is the single hardest property of a
 *     hand-rolled disclosure and the reason for using the native element.
 *  5. **The marker announces nothing.** No `list-style`, no UA marker in either
 *     engine's pseudo-element, and the redrawn `::after` has `content: ""` —
 *     an empty string, so there is no glyph to reach the accessibility tree and
 *     no alternative-text half for a build step to drop. `summary.textContent`
 *     is exactly the `label`.
 *  6. **…and it is nonetheless drawn, and it rotates.** Read from the live
 *     CSSOM: real border widths, and a different `transform` matrix under
 *     `[open]` than closed.
 *  7. **A visible focus ring exists** — a `summary:focus-visible` rule in
 *     `@layer components` declaring both an outline and the `--outline-focus`
 *     halo, coloured through `--_bf-accordion-focus-color` rather than
 *     `currentcolor` (gh#24-P2-1), because the ring is painted on the page
 *     ground.
 *  8. **It nests in a section band without layout breakage** — no horizontal
 *     overflow, no accordion wider than its band, no overlap between stacked
 *     ones, with a 980-character body proving it against a real excerpt length
 *     (BRIEF §5 rule 10).
 *  9. **Archive parity**: one case reproduces the frozen
 *     `pages/wireframes/archive.vue` per-year block — a `2024 (17)`-shaped
 *     summary over a `.stack` of chip + link + time rows.
 * 10. `.bf-accordion` rules are inside `@layer components` in the live CSSOM,
 *     the component emits no inline `style`, and `$attrs` reaches the
 *     `<details>`.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 31`,
 * per the gh#20–#30 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 *
 * **`bfSection` does not exist yet.** The spec asks for the accordion nested
 * inside it "(issue 39)", but `issues.md` row 39 (`bf-section`) is gh#48, which
 * runs after this one — this issue's only `Blocked-by` is #11. The bands below
 * are plain `<section class="section stack">` elements built from the same CUBE
 * primitives `bfSection` will render, which is what the "no layout breakage"
 * claim is actually about. Also recorded in Decisions.
 */
defineOptions({ name: 'BfProbe31BfAccordion' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 31 — bfAccordion'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/*
 * Real archive rows, lifted from the shape `useWfContent` hands
 * `pages/wireframes/archive.vue` — a format chip, a heading that links to the
 * insight, and a publish date rendered as month + year.
 */
const archiveRows = [
  { slug: 'transatlantic-trends-2024', format: 'Report', heading: 'Transatlantic Trends 2024', date: 'September 2024' },
  { slug: 'digital-sovereignty-brief', format: 'Brief', heading: 'Digital Sovereignty in Practice', date: 'June 2024' },
  { slug: 'rule-of-law-roundtable', format: 'Event', heading: 'Rule of Law Roundtable', date: 'March 2024' }
]

/**
 * 980 characters — the top of the real excerpt range the brief names (§5
 * rule 10). A disclosure that only ever holds three list items is not evidence
 * that it holds a paragraph.
 */
const longBody =
  'The Bertelsmann Foundation North America works at the intersection of transatlantic policy and '
  + 'practice, and the material this component discloses is not uniform in length: an archive year '
  + 'holds a handful of linked headings, while an insight body holds paragraphs whose measured '
  + 'length across the six wireframe snapshots runs from roughly one hundred characters to a little '
  + 'under a thousand. A disclosure widget that has only ever been shown a three-item list has not '
  + 'been shown the case that breaks it, which is why this row exists: the body below is at the top '
  + 'of that observed range, it wraps across many lines at every viewport the harness runs, and the '
  + 'assertions further down check that neither it nor the band containing it has acquired a '
  + 'horizontal scrollbar, that the accordion is no wider than the band it sits in, and that the '
  + 'accordion stacked beneath it begins below where this one ends rather than on top of it.'

/** The display cases, each rendered into a slot the assertions look up by key. */
interface Case {
  key: string
  label: string
  open: boolean
  note: string
}

const cases: Case[] = [
  {
    key: 'closed',
    label: 'Closed by default',
    open: false,
    note: 'no `open` prop — the spec’s closed case'
  },
  {
    key: 'open',
    label: 'Open by default',
    open: true,
    note: '`:open="true"` — the archive page’s first year'
  },
  {
    key: 'parity',
    label: '2024 (3)',
    open: true,
    note: 'archive.vue parity — a “Year (count)” summary over chip + link + time rows'
  },
  {
    key: 'long',
    label: 'A 980-character body',
    open: true,
    note: 'real excerpt length (BRIEF §5 rule 10)'
  },
  {
    key: 'long-closed',
    label: 'The same body, closed',
    open: false,
    note: 'stacked under the one above — proves no overlap and no tab-order leak'
  }
]

const checks = ref<Check[]>([])

/**
 * Whether the keyboard sequence has been requested. Bound to
 * `data-probe-keys` on the root, so the attribute exists only after this
 * component has mounted, attached its listeners and focused the lab summary —
 * which is what makes it a handshake rather than a race.
 */
const armed = ref(false)

/** What the keyboard actually did, filled in by the listeners below. */
const seen = reactive({
  /** `details.open` after each `toggle` event, in order. Expected `[true, false]`. */
  toggles: [] as boolean[],
  enterTrusted: false,
  spaceTrusted: false,
  /** What the harness's keys were actually delivered to. */
  focusedAtEnter: '',
  /** Set when the safety net fired instead of the Space keyup — a real failure, reported as one. */
  timedOut: false
})

/** A short, stable description of an element, for the "what got focused" rows. */
const describe = (el: Element | null): string => {
  if (!el || el === document.body) return 'body'
  const id = el.id ? `#${el.id}` : ''
  const cls = el.classList.length > 0 ? `.${el.classList[0]}` : ''
  return `${el.tagName.toLowerCase()}${id}${cls}`
}

/**
 * Walk every reachable stylesheet — `@import`ed ones included, since
 * `/css/styles.css` is nothing but a list of imports — for a style rule whose
 * selector matches and whose ancestry includes a `@layer components` block.
 * Cross-origin sheets throw on `cssRules`; they are skipped, not failed, so the
 * Google Fonts link does not sink the check. Returns the rule rather than a
 * boolean, so the focus rows can read what it declares. (Same helper as probes
 * 14–30.)
 */
const layeredRule = (match: (selector: string) => boolean): CSSStyleRule | null => {
  const LAYER_BLOCK = globalThis.CSSLayerBlockRule
  if (!LAYER_BLOCK) return null

  const walk = (rules: CSSRuleList, insideComponents: boolean): CSSStyleRule | null => {
    for (const rule of Array.from(rules)) {
      const nowInside =
        insideComponents
        || (rule instanceof LAYER_BLOCK && (rule as CSSLayerBlockRule).name === 'components')

      if (nowInside && rule instanceof CSSStyleRule && match(rule.selectorText)) {
        return rule
      }

      if (rule instanceof CSSImportRule) {
        try {
          const imported = rule.styleSheet?.cssRules
          const hit = imported ? walk(imported, nowInside) : null
          if (hit) return hit
        } catch {
          // Cross-origin import target — unreadable, not a failure.
        }
        continue
      }

      const nested = (rule as CSSGroupingRule).cssRules
      const hit = nested ? walk(nested, nowInside) : null
      if (hit) return hit
    }
    return null
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const hit = walk(sheet.cssRules, false)
      if (hit) return hit
    } catch {
      // Cross-origin sheet.
    }
  }
  return null
}

let finalised = false

/**
 * Everything that focuses an element runs **here**, after the key sequence —
 * gh#39's rule about the sequential-focus starting point. A `.focus()` before
 * the harness's keys land would move where those keys are delivered, and the
 * probe would then report a keyboard failure about a component that is fine.
 */
const finalise = () => {
  if (finalised) return
  finalised = true

  const gallery = document.querySelector<HTMLElement>('.probe__gallery')

  const slot = (key: string) =>
    document.querySelector<HTMLElement>(`[data-probe-slot="${key}"]`) ?? null

  const details = (key: string) =>
    slot(key)?.querySelector<HTMLDetailsElement>('details.bf-accordion') ?? null

  const summary = (key: string) =>
    details(key)?.querySelector<HTMLElement>('summary.bf-accordion__summary') ?? null

  /** The probe link planted inside every case's body — the tab-order subject. */
  const innerLink = (key: string) =>
    slot(key)?.querySelector<HTMLAnchorElement>('a[data-probe-inner]') ?? null

  const allDetails = Array.from(
    document.querySelectorAll<HTMLDetailsElement>('details.bf-accordion')
  )

  /** Can this element actually take focus right now? Asked of the browser, not inferred. */
  const focusable = (el: HTMLElement | null): boolean => {
    if (!el) return false
    el.focus()
    return document.activeElement === el
  }

  const after = (el: Element | null, pseudo: string) =>
    el ? getComputedStyle(el, pseudo).content : 'missing'

  const focusRule = layeredRule(
    s => s.includes('.bf-accordion__summary') && s.includes(':focus-visible')
  )

  const band = (key: string) => slot(key)?.closest<HTMLElement>('.probe__band') ?? null

  const lab = document.querySelector<HTMLDetailsElement>('[data-probe-lab] details.bf-accordion')
  const labLink = document.querySelector<HTMLAnchorElement>('[data-probe-lab] a[data-probe-inner]')

  const results: Check[] = [
    // --- 1. the element is native ------------------------------------------
    {
      label: `${cases.length} cases + the keyboard lab render ${cases.length + 1} <details>`,
      expected: cases.length + 1,
      actual: allDetails.length
    },
    {
      label: 'every root is a real <details>, not a div wearing the class',
      expected: cases.length + 1,
      actual: allDetails.filter(d => d.tagName === 'DETAILS').length
    },
    {
      label: 'the FIRST child of each is a real <summary>',
      expected: cases.length + 1,
      actual: allDetails.filter(d => d.firstElementChild?.tagName === 'SUMMARY').length
    },
    {
      label: 'each has exactly one <summary> and one .bf-accordion__body',
      expected: cases.length + 1,
      actual: allDetails.filter(
        d =>
          d.querySelectorAll(':scope > summary').length === 1
          && d.querySelectorAll(':scope > .bf-accordion__body').length === 1
      ).length
    },

    // --- 2. NO re-implemented ARIA (the whole point of the spec) ------------
    {
      label: 'no aria-expanded anywhere on the page — the browser owns it',
      expected: 0,
      actual: document.querySelectorAll('[aria-expanded]').length
    },
    {
      label: 'no role="button" and no aria-controls on any summary',
      expected: 0,
      actual: allDetails.filter(
        d =>
          d.querySelector('summary')?.hasAttribute('role') === true
          || d.querySelector('summary')?.hasAttribute('aria-controls') === true
      ).length
    },
    {
      label: 'no summary was replaced by a <button> + v-show pair',
      expected: 0,
      actual: gallery?.querySelectorAll('.bf-accordion button').length ?? -1
    },

    // --- 3. `open` is the INITIAL state ------------------------------------
    ...cases.map(c => ({
      label: `case ${c.key}: initial open state`,
      expected: String(c.open),
      actual: String(details(c.key)?.open ?? 'missing')
    })),
    {
      label: 'the `open` attribute is present on exactly the cases that asked for it',
      expected: cases.filter(c => c.open).map(c => c.key).join(','),
      actual: cases
        .filter(c => details(c.key)?.hasAttribute('open') === true)
        .map(c => c.key)
        .join(',')
    },

    // --- 4. the keyboard, pressed for real ---------------------------------
    {
      label: 'the keys were delivered to the lab’s <summary>',
      expected: 'summary.bf-accordion__summary',
      actual: seen.focusedAtEnter || 'nothing was focused'
    },
    {
      label: 'the key sequence completed (Enter then Space), not timed out',
      expected: 'false',
      actual: String(seen.timedOut)
    },
    {
      label: 'Enter on the focused summary OPENED it',
      expected: 'true',
      actual: String(seen.toggles[0] ?? 'no toggle fired')
    },
    {
      label: '  …and the Enter that did it was trusted, not synthesised',
      expected: 'true',
      actual: String(seen.enterTrusted)
    },
    {
      label: 'Space on the focused summary CLOSED it again',
      expected: 'false',
      actual: String(seen.toggles[1] ?? 'no second toggle fired')
    },
    {
      label: '  …and the Space that did it was trusted',
      expected: 'true',
      actual: String(seen.spaceTrusted)
    },
    {
      label: 'exactly two toggles — no handler fired a third',
      expected: 2,
      actual: seen.toggles.length
    },
    {
      label: 'the lab ended closed, and nothing re-rendered it back open',
      expected: 'false',
      actual: String(lab?.open ?? 'missing')
    },

    // --- 5. tab order tracks disclosure, natively --------------------------
    /*
     * Runs here, after the keys, per gh#39: focusing an element moves the
     * sequential-focus starting point, and doing it earlier would redirect the
     * harness's keys.
     */
    {
      label: 'a link inside a CLOSED accordion cannot take focus',
      expected: 'false',
      actual: String(focusable(innerLink('closed')))
    },
    {
      /*
       * `checkVisibility()`, not `getClientRects().length`. The first attempt
       * used the rect count and failed on a correct component: Chrome no longer
       * hides a closed `<details>`'s content with `display: none` but with
       * `content-visibility: hidden`, so the subtree is skipped for rendering
       * while its elements still report a locked box. `checkVisibility()` is
       * the API that answers the question actually being asked — *is this
       * painted?* — across both mechanisms.
       */
      label: '  …and it is not rendered at all (checkVisibility)',
      expected: 'false',
      actual: String(innerLink('closed')?.checkVisibility() ?? 'missing')
    },
    {
      label: 'the identical link inside an OPEN accordion CAN take focus',
      expected: 'true',
      actual: String(focusable(innerLink('open')))
    },
    {
      label: '  …and it is genuinely painted, with a real box',
      expected: 'true|true',
      actual: (() => {
        const a = innerLink('open')
        if (!a) return 'missing'
        return `${a.checkVisibility()}|${a.getBoundingClientRect().width > 0}`
      })()
    },
    {
      label: 'the lab’s link, after Space closed it, is unreachable again',
      expected: 'false',
      actual: String(focusable(labLink))
    },
    {
      label: 'opening the lab by script makes the same link reachable',
      expected: 'true',
      actual: String(
        (() => {
          if (!lab) return false
          lab.open = true
          const ok = focusable(labLink)
          lab.open = false
          return ok
        })()
      )
    },

    // --- 6. the marker announces nothing -----------------------------------
    {
      label: 'every summary’s list-style-type is none (no UA disclosure marker)',
      expected: cases.length + 1,
      actual: allDetails.filter(
        d => getComputedStyle(d.querySelector('summary')!).listStyleType === 'none'
      ).length
    },
    {
      label: '  …and ::marker paints no content either',
      expected: cases.length + 1,
      /*
       * `display: flex` on the summary already removes the `list-item` box the
       * marker hangs off, so an engine may report the pseudo-element's content
       * as `normal` (there is no marker to have content) or as the `""` the
       * stylesheet sets. Both are the same fact — nothing is painted — and the
       * row accepts either rather than pinning one engine's serialisation. What
       * it will not accept is a non-empty string, which is the defect.
       */
      actual: allDetails.filter(d => {
        const c = after(d.querySelector('summary'), '::marker')
        return c === '""' || c === 'none' || c === 'normal' || c === ''
      }).length
    },
    {
      label: 'the redrawn ::after marker has EMPTY content — no glyph, no alt text needed',
      expected: cases.length + 1,
      actual: allDetails.filter(d => after(d.querySelector('summary'), '::after') === '""').length
    },
    {
      label: 'summary text is exactly the `label` — the marker adds nothing to it',
      expected: cases.map(c => c.label).join('|'),
      actual: cases.map(c => (summary(c.key)?.textContent ?? 'missing').trim()).join('|')
    },

    // --- 7. …and yet the marker IS drawn, and it rotates --------------------
    {
      label: 'the ::after marker is drawn with real borders, not a font glyph',
      expected: 'true',
      actual: (() => {
        const s = summary('closed')
        if (!s) return 'missing'
        const cs = getComputedStyle(s, '::after')
        return String(
          Number.parseFloat(cs.borderInlineEndWidth) > 0
          && Number.parseFloat(cs.borderBlockEndWidth) > 0
        )
      })()
    },
    {
      label: '  …in --_bf-accordion-marker-color, which resolves to a real colour',
      expected: 'true',
      actual: (() => {
        const s = summary('closed')
        if (!s) return 'missing'
        const v = getComputedStyle(s, '::after').borderBlockEndColor
        return String(v !== '' && v !== 'rgba(0, 0, 0, 0)')
      })()
    },
    {
      label: 'the open marker’s transform differs from the closed one (it turns)',
      expected: 'true',
      actual: (() => {
        const shut = summary('closed')
        const open = summary('open')
        if (!shut || !open) return 'missing'
        return String(
          getComputedStyle(shut, '::after').transform
          !== getComputedStyle(open, '::after').transform
        )
      })()
    },
    {
      label: '  …and the closed one is a rotation, not `none`',
      expected: 'true',
      actual: (() => {
        const t = summary('closed') ? getComputedStyle(summary('closed')!, '::after').transform : ''
        return String(t !== '' && t !== 'none')
      })()
    },
    {
      label: 'the summary is a pointer target (cursor), not a text selection',
      expected: 'pointer',
      actual: summary('closed') ? getComputedStyle(summary('closed')!).cursor : 'missing'
    },

    // --- 8. the focus ring the CUBE stack does not otherwise declare --------
    {
      label: 'a .bf-accordion__summary:focus-visible rule exists in @layer components',
      expected: 'true',
      actual: String(focusRule !== null)
    },
    {
      label: '  …and it declares BOTH an outline and the --outline-focus halo',
      expected: 'outline+halo',
      actual: (() => {
        if (!focusRule) return 'no rule'
        const hasOutline = focusRule.style.outline !== '' || focusRule.style.outlineWidth !== ''
        const hasHalo = focusRule.style.boxShadow !== ''
        return `${hasOutline ? 'outline' : '-'}+${hasHalo ? 'halo' : '-'}`
      })()
    },
    {
      /*
       * `--color-text`, not `currentcolor` — the gh#24-P2-1 finding. The ring is
       * drawn outside the summary on the page ground, so a ring in the control's
       * own colour can paint light-on-light (WCAG 1.4.11).
       */
      label: '  …in --_bf-accordion-focus-color, never currentcolor (gh#24-P2-1)',
      expected: 'true',
      actual: (() => {
        if (!focusRule) return 'no rule'
        const decl = `${focusRule.style.outline} ${focusRule.style.outlineColor}`
        return String(
          decl.includes('--_bf-accordion-focus-color') && !decl.includes('currentcolor')
        )
      })()
    },
    {
      label: '  …and that hook resolves to the root colour (--color-text)',
      expected: getComputedStyle(document.documentElement).color,
      actual: (() => {
        const s = summary('closed')
        if (!s) return 'missing'
        /*
         * Resolved through a throwaway element that *does* paint the hook, so
         * the value is read as a real colour rather than as the unresolved
         * `var()` chain `getPropertyValue` would hand back.
         */
        const el = document.createElement('span')
        el.style.color = 'var(--_bf-accordion-focus-color)'
        s.append(el)
        const resolved = getComputedStyle(el).color
        el.remove()
        return resolved
      })()
    },
    {
      label: 'every summary is keyboard-focusable in the first place',
      expected: cases.length + 1,
      actual: allDetails.filter(d => focusable(d.querySelector('summary'))).length
    },

    // --- 9. it nests in a band without layout breakage ----------------------
    {
      label: 'no accordion is wider than the band it sits in',
      expected: 0,
      actual: cases.filter(c => {
        const d = details(c.key)
        const b = band(c.key)
        if (!d || !b) return false
        return d.getBoundingClientRect().width > b.getBoundingClientRect().width + 1
      }).length
    },
    {
      label: 'no band scrolls horizontally (the 980-char body included)',
      expected: 0,
      actual: Array.from(document.querySelectorAll<HTMLElement>('.probe__band')).filter(
        b => b.scrollWidth > b.clientWidth + 1
      ).length
    },
    {
      label: 'the document itself acquired no horizontal scrollbar',
      expected: 'true',
      actual: String(
        document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      )
    },
    {
      label: 'stacked accordions do not overlap (long, then long-closed)',
      expected: 'true',
      actual: (() => {
        const a = details('long')?.getBoundingClientRect()
        const b = details('long-closed')?.getBoundingClientRect()
        if (!a || !b) return 'missing'
        return String(b.top >= a.bottom - 1)
      })()
    },
    {
      label: 'the closed accordion is shorter than the open one holding the same body',
      expected: 'true',
      actual: (() => {
        const open = details('long')?.getBoundingClientRect().height ?? 0
        const shut = details('long-closed')?.getBoundingClientRect().height ?? 0
        return String(shut > 0 && shut < open)
      })()
    },

    // --- 10. archive.vue parity --------------------------------------------
    {
      label: 'the parity summary is the wireframe’s "Year (count)" shape',
      expected: 'true',
      actual: String(/^\d{4} \(\d+\)$/.test((summary('parity')?.textContent ?? '').trim()))
    },
    {
      label: `  …over ${archiveRows.length} chip + link + time rows, as archive.vue renders them`,
      expected: `${archiveRows.length}|${archiveRows.length}|${archiveRows.length}`,
      actual: (() => {
        const body = details('parity')?.querySelector('.bf-accordion__body')
        if (!body) return 'missing'
        return [
          body.querySelectorAll('li').length,
          body.querySelectorAll('li a[href]').length,
          body.querySelectorAll('li time').length
        ].join('|')
      })()
    },

    // --- 11. cascade layer, inline style, $attrs ---------------------------
    {
      label: '.bf-accordion rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(layeredRule(s => /\.bf-accordion(?![\w-])/.test(s)) !== null)
    },
    {
      label: 'the component contributes no inline style of its own',
      expected: 0,
      actual: allDetails.filter(d => d.getAttribute('style') !== null).length
    },
    {
      label: '$attrs fallthrough reaches the <details> (data-probe-case)',
      expected: cases.map(c => c.key).join(','),
      actual: cases.map(c => details(c.key)?.dataset.probeCase ?? '').join(',')
    }
  ]

  checks.value = results
}

onMounted(() => {
  const lab = document.querySelector<HTMLDetailsElement>('[data-probe-lab] details.bf-accordion')
  const labSummary = lab?.querySelector<HTMLElement>('summary.bf-accordion__summary') ?? null

  lab?.addEventListener('toggle', () => {
    seen.toggles.push(lab.open)
  })

  document.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      seen.enterTrusted ||= event.isTrusted
      if (seen.focusedAtEnter === '') seen.focusedAtEnter = describe(document.activeElement)
    }
    if (event.key === ' ') seen.spaceTrusted ||= event.isTrusted
  })

  document.addEventListener('keyup', event => {
    if (event.key !== ' ') return
    /*
     * A beat for the toggle to land: `toggle` is fired asynchronously after the
     * open state changes, so reading it synchronously here would read the state
     * before the event that reports it.
     */
    setTimeout(finalise, 150)
  })

  /*
   * The keys go to whatever has focus, and this probe is asking a question
   * about one specific `<summary>` — so it says which, rather than relying on
   * where a Tab would have landed. This is the only `.focus()` that runs before
   * the key sequence; every other one is inside `finalise()`, per gh#39.
   */
  labSummary?.focus()

  /*
   * Safety net. A probe that stays PENDING reports a timeout and nothing else;
   * a probe that finalises reports *which* key failed. Generous enough that it
   * cannot pre-empt a sequence that is merely slow (the harness spaces keys 60ms
   * apart), and it flags itself in a row of its own so a timeout can never be
   * mistaken for a pass.
   */
  setTimeout(() => {
    if (finalised) return
    seen.timedOut = true
    finalise()
  }, 6000)

  /*
   * Only now — listeners attached, lab focused — ask for the keys. The harness
   * polls for this attribute, so its appearance is the handshake; publishing it
   * in the template unconditionally would race everything above.
   */
  armed.value = true
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states, not two. The assertions need a keyboard, so before one arrives
 * the honest answer is `pending` — the prerendered HTML has run nothing, and
 * baking `FAIL` into it would read as a regression to the next issue that greps
 * the file. The harness treats a probe still PENDING at timeout as a failure,
 * never a skip.
 */
const state = computed<'pending' | 'pass' | 'fail'>(() => {
  if (checks.value.length === 0) return 'pending'
  return passed.value === checks.value.length ? 'pass' : 'fail'
})

const verdict = computed(() =>
  state.value === 'pending'
    ? 'PENDING — press Enter, then Space (assertions run after the key sequence)'
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
    data-probe="31"
    :data-probe-verdict="state.toUpperCase()"
    :data-probe-keys="armed ? 'Enter,Space' : undefined"
  >
    <h1>Probe 31 — <code>bfAccordion</code></h1>
    <p class="probe__lede">
      A styled skin over a native <code>&lt;details&gt;</code>/<code>&lt;summary&gt;</code>.
      The component writes <strong>no</strong> <code>aria-expanded</code>, no
      <code>role="button"</code> and no key handler — the browser already owns
      all three, and duplicating them by hand adds a copy that can drift rather
      than adding semantics.
    </p>
    <p class="probe__lede">
      The keyboard rows below are read from <strong>real key events</strong>: the
      harness presses <kbd>Enter</kbd> (which must open the lab accordion) and
      then <kbd>Space</kbd> (which must close it) on the focused
      <code>&lt;summary&gt;</code>. A scripted <code>.click()</code> would pass
      on a <code>&lt;button&gt;</code> + <code>v-show</code> rewrite that had
      silently lost Space.
    </p>

    <section class="probe__gallery" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading">Five cases, in section bands</h2>
      <p class="probe__note">
        <code>bfSection</code> is issue 39 → gh#48 and does not exist yet, so
        each band below is a plain <code>&lt;section class="section stack"&gt;</code>
        built from the same CUBE primitives it will render.
      </p>

      <!--
        One band per case, so the "no accordion is wider than its band" and
        "no band scrolls horizontally" rows have a real containing block to
        measure against rather than the page.
      -->
      <section
        v-for="c in cases"
        :key="c.key"
        class="probe__band"
      >
        <!--
          `wfSection`'s own inner element, which `bfSection` (gh#48) evolves: a
          `center | stack` with a `data-gap`. Reproduced rather than imported,
          because the component that will own it does not exist yet.
        -->
        <div class="center | stack" data-gap="s">
        <h3 class="probe__band-heading">
          <code>{{ c.key }}</code> — {{ c.note }}
        </h3>

        <div :data-probe-slot="c.key">
          <bfAccordion
            :label="c.label"
            :open="c.open"
            :data-probe-case="c.key"
          >
            <!--
              The parity case reproduces `pages/wireframes/archive.vue:16-22`
              exactly in shape: a `.stack` of `.cluster` rows, each a format
              chip, a link to the insight and a `<time>`. That file is frozen
              (D2) and was read, not edited.
            -->
            <ul
              v-if="c.key === 'parity'"
              class="stack"
              data-gap="xs"
            >
              <li
                v-for="row in archiveRows"
                :key="row.slug"
                class="cluster"
                data-gap="xs"
              >
                <bfChip>{{ row.format }}</bfChip>
                <a :href="`/insights/${row.slug}`" data-probe-inner>{{ row.heading }}</a>
                <time>{{ row.date }}</time>
              </li>
            </ul>

            <template v-else>
              <p>{{ c.key.startsWith('long') ? longBody : 'Disclosed content.' }}</p>
              <!--
                The tab-order subject. Identical markup in every case, so the
                only thing that differs between the reachable and unreachable
                rows is whether the `<details>` around it is open.
              -->
              <p><a href="#gallery-heading" data-probe-inner>A link inside the body</a></p>
            </template>
          </bfAccordion>
        </div>
        </div>
      </section>
    </section>

    <section class="probe__band" data-probe-lab>
      <div class="center | stack" data-gap="s">
        <h2>Keyboard lab</h2>
        <p class="probe__note">
          Focused on mount. <kbd>Enter</kbd> must open it; <kbd>Space</kbd> must
          close it. Both are the browser's own behaviour — this component adds no
          key handler.
        </p>
        <bfAccordion label="Press Enter, then Space">
          <p>Disclosed by the keyboard alone.</p>
          <p><a href="#gallery-heading" data-probe-inner>A link inside the lab body</a></p>
        </bfAccordion>
      </div>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-31-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-31-table">
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
  max-inline-size: 75ch;
}

/*
  A visible frame around each band, so a human scanning the page can see where
  one section ends and the next begins — which is what the overlap and
  overflow rows are asserting numerically.
*/
.probe__band {
  outline: 1px dashed currentcolor;
  outline-offset: 4px;
  margin-block: var(--space-m, 1.5rem);
  max-inline-size: 60ch;
}

.probe__band-heading {
  font-size: 0.875rem;
  font-weight: 400;
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
