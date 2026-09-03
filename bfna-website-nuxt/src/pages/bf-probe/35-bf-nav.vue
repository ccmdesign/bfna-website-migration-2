<script setup lang="ts">
/**
 * Probe — issue 35 / gh#44: `bfNav` and its two internal children.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## What it proves
 *
 *  1. **It renders entirely from a fixture array.** `fixtureMenus` below is
 *     hand-written in this file — no composable, no collection, nothing from
 *     the data layer — and every entry in it reaches the DOM as the right
 *     element for its shape. That is the acceptance sentence of the issue,
 *     and the D8 violation the whole issue exists to fix is the reason it can
 *     be written at all: `wfNav` cannot be probed this way, because it sources
 *     its own content.
 *  2. **The disclosure is native and un-re-implemented.** Real `<details>`,
 *     real `<summary>`, zero `aria-expanded` / `role="button"` /
 *     `aria-controls` on the page.
 *  3. **Only one menu is open at a time.** Opened by real clicks, read with
 *     `checkVisibility()` — never a bounding rect. Chrome hides closed
 *     `<details>` content with `content-visibility: hidden`, not
 *     `display: none`, so a rect-based assertion measures a box that is still
 *     laid out and passes a broken component (D-31.6).
 *  4. **Esc closes the open menu and returns focus to its `<summary>`** — from
 *     a **trusted** key event, and from focus that is *inside the panel* when
 *     the key is pressed, which is the case that would otherwise drop focus to
 *     `<body>`.
 *  5. **Enter and Space toggle a focused summary**, natively — the component
 *     adds no handler for either, and this is what would regress if someone
 *     replaced the element with a `<button>` + `v-show` pair.
 *  6. **The links inside a closed panel are out of the tab order**, for free,
 *     and back in it when the panel is open.
 *  7. **It reflows at narrow widths** without a second nav paradigm: a real
 *     `bfNav` inside a 375px container has statically-positioned panels and no
 *     horizontal overflow, while the full-width one above it has floating
 *     ones. The harness runs at one fixed 1280px viewport
 *     (`docs/decisions/probe-harness.md`), which is exactly why the rule is a
 *     `@container` rather than a `@media` — this row is a measurement, not a
 *     reading of the rule text.
 *  8. **Zero data access**, asserted structurally rather than by grep: the
 *     component is handed `menus` and renders exactly what it was handed, and
 *     an entry added to the fixture appears in the DOM.
 *  9. `.bf-nav*` rules are inside `@layer components` in the live CSSOM, the
 *     components emit no inline `style`, and `$attrs` reaches the `<header>`.
 * 10. **The focus ring comes from the stack**, not from a private copy — the
 *     `:focus-visible` rule that applies to a nav link is the bare one
 *     `base/focus.css` (#146) declares in `@layer defaults`.
 *
 * ## Key sequence
 *
 * The root publishes `data-probe-keys="Escape,Enter,Space"` once it has
 * mounted, wired its listeners and put focus on a link **inside an open
 * panel** (harness hook, `docs/decisions/probe-harness.md` Decision 4):
 *
 * | key | expected |
 * |---|---|
 * | <kbd>Esc</kbd> | closes the open dropdown, focus lands on its `<summary>` |
 * | <kbd>Enter</kbd> | that same now-focused summary re-opens it |
 * | <kbd>Space</kbd> | closes it again |
 *
 * Three keys, one sequence, and the middle one is only meaningful because the
 * first one moved focus to where it lands — which is the focus-return claim,
 * asserted by consequence rather than by reading `document.activeElement` and
 * trusting it.
 *
 * Per gh#39: everything that focuses or removes a focused element runs
 * **after** the key sequence, inside `finalise()`. The one exception is the
 * deliberate starting-point statement in `onMounted`.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 35`.
 * Recorded in the spec's Decisions section.
 */
import type { Menu } from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe35BfNav' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 35 — bfNav'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/**
 * The fixture. Hand-written, in this file, and the point of the issue.
 *
 * Shaped after the real `MENUS` structure the wireframe hardcodes — two
 * dropdowns of the size the site actually has, one plain internal link, one
 * external one — plus a `strong` item, because `MenuItem.strong` exists and a
 * fixture that never sets it would leave that branch of `MenuLink`
 * unexercised.
 *
 * Nothing here is read from anywhere — no content composable, no collection
 * query, no site composable. That is what makes this a probe of `bfNav` rather
 * than of the data layer.
 */
const fixtureMenus: Menu[] = [
  {
    label: 'Programs',
    items: [
      { label: 'Democracy', to: '/democracy', strong: true },
      { label: 'Transatlantic Relations', to: '/transatlantic-relations-global-challenges' },
      { label: 'Future of Leadership', to: '/future-leadership' }
    ]
  },
  {
    label: 'Insights',
    items: [
      { label: 'All insights', to: '/insights' },
      { label: 'Archive', to: '/archive' },
      { label: 'Barometer', href: 'https://www.bfna.org/barometer/' }
    ]
  },
  { label: 'About', to: '/about' },
  { label: 'Podcasts', href: 'https://www.bfna.org/podcasts/', external: true }
]

/** How many of the fixture entries are dropdowns, links, external links. */
const expectedDropdowns = fixtureMenus.filter(m => !m.href && !m.to).length
const expectedRouteLinks = fixtureMenus.filter(m => !m.href && m.to).length
const expectedHrefLinks = fixtureMenus.filter(m => m.href).length
const expectedPanelItems = fixtureMenus.reduce((n, m) => n + (m.items?.length ?? 0), 0)

const checks = ref<Check[]>([])

/** Bound to `data-probe-keys`, so the attribute appears only after `onMounted`. */
const armed = ref(false)

/** What the keyboard actually did, filled in by the listeners below. */
const seen = reactive({
  escTrusted: false,
  enterTrusted: false,
  spaceTrusted: false,
  /** Where focus was when Esc was pressed — must be inside the open panel. */
  focusedAtEsc: '',
  /** Where focus went after Esc — the focus-return claim. */
  focusedAfterEsc: '',
  /** `details.open` after each toggle on the lab dropdown. Expected `[false, true, false]`. */
  toggles: [] as boolean[],
  timedOut: false
})

/** A short, stable description of an element, for the "what got focused" rows. */
const describe = (el: Element | null): string => {
  if (!el || el === document.body) return 'body'
  const cls = el.classList.length > 0 ? `.${el.classList[0]}` : ''
  return `${el.tagName.toLowerCase()}${cls}`
}

/**
 * Walk every reachable stylesheet — `@import`ed ones included, since
 * `/css/styles.css` is nothing but a list of imports — for a style rule whose
 * selector matches and whose ancestry includes a `@layer <name>` block.
 * Cross-origin sheets throw on `cssRules`; they are skipped, not failed, so the
 * Google Fonts link does not sink the check. Returns the rule rather than a
 * boolean, so a caller can read what it declares. (Same helper as probes
 * 14–34, generalised over the layer name for the `defaults` row.)
 */
const layeredRule = (
  match: (selector: string) => boolean,
  layer = 'components'
): CSSStyleRule | null => {
  const LAYER_BLOCK = globalThis.CSSLayerBlockRule
  if (!LAYER_BLOCK) return null

  const walk = (rules: CSSRuleList, inside: boolean): CSSStyleRule | null => {
    for (const rule of Array.from(rules)) {
      const nowInside =
        inside || (rule instanceof LAYER_BLOCK && (rule as CSSLayerBlockRule).name === layer)

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
 * One task boundary.
 *
 * `toggle` is fired from a **queued task**, not synchronously from the `open`
 * change — so `closeSiblings` has not run yet at the moment `.click()` returns,
 * and a synchronous read after two clicks sees both menus open on a component
 * that is behaving perfectly. Every step of the experiment below is separated
 * by one of these, which is the difference between asserting the sibling-closing
 * contract and asserting that two clicks change two attributes.
 */
const settle = () => new Promise<void>(ok => setTimeout(ok, 0))

const finalise = async () => {
  if (finalised) return
  finalised = true

  /** The full-width gallery nav — the subject of most rows. */
  const gallery = document.querySelector<HTMLElement>('[data-probe-slot="wide"] header.bf-nav')
  /** The same component inside a 375px container — the reflow subject. */
  const narrowWrap = document.querySelector<HTMLElement>('[data-probe-slot="narrow"]')
  const narrow = narrowWrap?.querySelector<HTMLElement>('header.bf-nav') ?? null
  /** The keyboard lab's nav. */
  const lab = document.querySelector<HTMLElement>('[data-probe-lab] header.bf-nav')

  const groupsIn = (root: Element | null) =>
    Array.from(root?.querySelectorAll<HTMLDetailsElement>('details.bf-nav__group') ?? [])

  const groups = groupsIn(gallery)

  /** Can this element actually take focus right now? Asked of the browser, not inferred. */
  const focusable = (el: HTMLElement | null): boolean => {
    if (!el) return false
    el.focus()
    return document.activeElement === el
  }

  /*
   * ---- The sibling-closing experiment ------------------------------------
   * Real clicks on real summaries, in order, reading `checkVisibility()` after
   * each. Run here rather than on mount because it moves focus (gh#39), and
   * `.click()` on a `<summary>` focuses it in Chromium.
   */
  const openState = () => groups.map(g => g.open)
  const panelShown = () =>
    groups.map(g => g.querySelector<HTMLElement>('.bf-nav__panel')?.checkVisibility() === true)

  const beforeAny = { open: openState(), shown: panelShown() }

  groups[0]?.querySelector<HTMLElement>('summary')?.click()
  await settle()
  const afterFirst = { open: openState(), shown: panelShown() }

  groups[1]?.querySelector<HTMLElement>('summary')?.click()
  await settle()
  const afterSecond = { open: openState(), shown: panelShown() }

  /** Links inside panel 1 while it is closed (panel 2 is the open one now). */
  const closedPanelLink = groups[0]?.querySelector<HTMLAnchorElement>('.bf-nav__panel a') ?? null
  const openPanelLink = groups[1]?.querySelector<HTMLAnchorElement>('.bf-nav__panel a') ?? null
  const closedLinkFocusable = focusable(closedPanelLink)
  const openLinkFocusable = focusable(openPanelLink)

  // Leave the gallery tidy for a human reader.
  if (groups[1]) groups[1].open = false
  await settle()

  /*
   * ---- Reflow -------------------------------------------------------------
   * Both navs are open so the panels are laid out and their `position` is
   * meaningful. The wide one floats (`absolute`); the narrow one flows
   * (`static`). Same component, same CSS, different container width.
   */
  const wideGroup = groups[0] ?? null
  const narrowGroup = groupsIn(narrow)[0] ?? null
  if (wideGroup) wideGroup.open = true
  if (narrowGroup) narrowGroup.open = true
  await settle()

  const positionOf = (g: HTMLDetailsElement | null) => {
    const panel = g?.querySelector<HTMLElement>('.bf-nav__panel')
    return panel ? getComputedStyle(panel).position : 'missing'
  }

  const widePanelPosition = positionOf(wideGroup)
  const narrowPanelPosition = positionOf(narrowGroup)

  /** The open panel escapes the header box — proof that nothing is clipped by containment. */
  const widePanel = wideGroup?.querySelector<HTMLElement>('.bf-nav__panel') ?? null
  const panelOverflowsHeader =
    widePanel && gallery
      ? widePanel.getBoundingClientRect().bottom > gallery.getBoundingClientRect().bottom + 1
      : false

  const narrowOverflows = narrowWrap
    ? narrowWrap.scrollWidth > narrowWrap.clientWidth + 1
    : true

  if (wideGroup) wideGroup.open = false
  if (narrowGroup) narrowGroup.open = false
  await settle()

  /*
   * ---- Static structure ---------------------------------------------------
   */
  const bar = gallery?.querySelector<HTMLElement>('nav.bf-nav__bar') ?? null
  const logoLink = gallery?.querySelector<HTMLAnchorElement>('a.bf-nav__logo') ?? null
  const searchLink = gallery?.querySelector<HTMLAnchorElement>('a.bf-nav__search') ?? null
  const topLinks = Array.from(gallery?.querySelectorAll<HTMLAnchorElement>('a.bf-nav__link') ?? [])
  const panelItems = Array.from(
    gallery?.querySelectorAll<HTMLElement>('.bf-nav__panel .bf-nav__item') ?? []
  )

  const labelsInOrder = Array.from(bar?.children ?? [])
    .filter(el => el !== logoLink && el !== searchLink)
    .map(el =>
      el.tagName === 'DETAILS'
        ? (el.querySelector('summary')?.textContent ?? '').trim()
        : (el.textContent ?? '').trim()
    )

  const focusDefaultRule = layeredRule(s => s.trim() === ':focus-visible', 'defaults')

  const results: Check[] = [
    // --- 1. it renders entirely from the fixture ---------------------------
    {
      label: `all ${fixtureMenus.length} fixture entries reach the bar, in order`,
      expected: fixtureMenus.map(m => m.label).join(','),
      actual: labelsInOrder.join(',')
    },
    {
      label: `entries with \`items\` render as <details> (${expectedDropdowns})`,
      expected: expectedDropdowns,
      actual: groups.length
    },
    {
      label: `entries with \`to\` render as a route link (${expectedRouteLinks})`,
      expected: expectedRouteLinks,
      actual: topLinks.filter(a => a.getAttribute('href')?.startsWith('/') === true).length
    },
    {
      label: `entries with \`href\` render as a plain <a> (${expectedHrefLinks})`,
      expected: expectedHrefLinks,
      actual: topLinks.filter(a => a.getAttribute('href')?.startsWith('http') === true).length
    },
    {
      label: 'every panel item in the fixture is rendered',
      expected: expectedPanelItems,
      actual: panelItems.length
    },
    {
      label: '[data-external] marks exactly the entries that declared it',
      expected: fixtureMenus.filter(m => m.external).map(m => m.label).join(','),
      actual: topLinks
        .filter(a => a.hasAttribute('data-external'))
        .map(a => (a.textContent ?? '').trim())
        .join(','),
    },
    {
      label: '  …and never as the string "false" (the `|| undefined` guard)',
      expected: 0,
      actual: Array.from(document.querySelectorAll('[data-external]')).filter(
        el => el.getAttribute('data-external') === 'false'
      ).length
    },
    {
      label: 'a `strong` panel item renders its label in <strong>',
      expected: 'Democracy',
      actual: (
        gallery?.querySelector('.bf-nav__panel strong')?.textContent ?? 'missing'
      ).trim()
    },
    {
      label: 'the logo links home',
      expected: '/',
      actual: logoLink?.getAttribute('href') ?? 'missing'
    },
    {
      label: '  …and carries the bfLogo mark, which supplies the link’s name',
      expected: 'Bertelsmann Foundation North America',
      actual: (logoLink?.querySelector('svg.bf-logo title')?.textContent ?? 'missing').trim()
    },
    {
      label: 'the search entry point links to /search',
      expected: '/search',
      actual: searchLink?.getAttribute('href') ?? 'missing'
    },
    {
      label: 'no Subscribe button survived from the pre-D2 nav',
      expected: 0,
      actual: Array.from(gallery?.querySelectorAll('a, button') ?? []).filter(el =>
        /subscribe/i.test(el.textContent ?? '')
      ).length
    },

    // --- 2. the disclosure is native ---------------------------------------
    {
      label: 'every dropdown root is a real <details> whose first child is a <summary>',
      expected: expectedDropdowns,
      actual: groups.filter(
        g => g.tagName === 'DETAILS' && g.firstElementChild?.tagName === 'SUMMARY'
      ).length
    },
    {
      label: 'no aria-expanded anywhere on the page — the browser owns it',
      expected: 0,
      actual: document.querySelectorAll('[aria-expanded]').length
    },
    {
      label: 'no role="button" and no aria-controls on any summary',
      expected: 0,
      actual: Array.from(document.querySelectorAll('summary')).filter(
        s => s.hasAttribute('role') || s.hasAttribute('aria-controls')
      ).length
    },
    {
      label: 'no <button> replaced a summary anywhere in a nav',
      expected: 0,
      actual: document.querySelectorAll('header.bf-nav button').length
    },
    {
      /*
       * Review finding gh#44 P2-1. `list-style: none` makes WebKit drop the
       * list semantics — VoiceOver stops saying "list, 3 items" — so the
       * implicit role is restated. Asserted as a pair, because a `role="list"`
       * on something the CSS never unstyled would be the redundant version of
       * this fix rather than the necessary one.
       */
      label: 'every panel restates role="list" against its own list-style: none',
      expected: `${expectedDropdowns}|none`,
      actual: (() => {
        const panels = Array.from(
          gallery?.querySelectorAll<HTMLElement>('.bf-nav__panel') ?? []
        )
        const withRole = panels.filter(p => p.getAttribute('role') === 'list').length
        const style = panels[0] ? getComputedStyle(panels[0]).listStyleType : 'missing'
        return `${withRole}|${style}`
      })()
    },
    {
      label: 'the bar is a <nav> with an accessible name',
      expected: 'nav|Main',
      actual: `${bar?.tagName.toLowerCase() ?? 'missing'}|${bar?.getAttribute('aria-label') ?? 'missing'}`
    },

    // --- 3. only one open at a time ----------------------------------------
    {
      label: 'all dropdowns start closed',
      expected: new Array(groups.length).fill('false').join(','),
      actual: beforeAny.open.map(String).join(',')
    },
    {
      label: '  …and no panel is visible (checkVisibility, not a rect — D-31.6)',
      expected: new Array(groups.length).fill('false').join(','),
      actual: beforeAny.shown.map(String).join(',')
    },
    {
      label: 'clicking summary 1 opens exactly panel 1',
      expected: 'true,false',
      actual: afterFirst.shown.map(String).join(',')
    },
    {
      label: 'clicking summary 2 opens panel 2 AND closes panel 1',
      expected: 'false,true',
      actual: afterSecond.shown.map(String).join(',')
    },
    {
      label: '  …the `open` attribute agrees with what is painted',
      expected: 'false,true',
      actual: afterSecond.open.map(String).join(',')
    },

    // --- 4. tab order tracks disclosure, natively --------------------------
    {
      label: 'a link inside a CLOSED panel cannot take focus',
      expected: 'false',
      actual: String(closedLinkFocusable)
    },
    {
      label: 'the identical link inside the OPEN panel can',
      expected: 'true',
      actual: String(openLinkFocusable)
    },

    // --- 5. the keyboard, pressed for real ---------------------------------
    {
      label: 'the key sequence completed (Esc, Enter, Space), not timed out',
      expected: 'false',
      actual: String(seen.timedOut)
    },
    {
      label: 'Esc was pressed from INSIDE the open panel',
      expected: 'a.bf-nav__item',
      actual: seen.focusedAtEsc || 'nothing was focused'
    },
    {
      label: '  …and it was trusted, not synthesised',
      expected: 'true',
      actual: String(seen.escTrusted)
    },
    {
      label: 'Esc CLOSED the dropdown',
      expected: 'false',
      actual: String(seen.toggles[0] ?? 'no toggle fired')
    },
    {
      label: '  …and returned focus to the trigger <summary>',
      expected: 'summary.bf-nav__summary',
      actual: seen.focusedAfterEsc || 'focus was lost to the document'
    },
    {
      label: 'Enter on that now-focused summary re-opened it',
      expected: 'true',
      actual: String(seen.toggles[1] ?? 'no second toggle fired')
    },
    {
      label: '  …and the Enter that did it was trusted',
      expected: 'true',
      actual: String(seen.enterTrusted)
    },
    {
      label: 'Space closed it again',
      expected: 'false',
      actual: String(seen.toggles[2] ?? 'no third toggle fired')
    },
    {
      label: '  …and the Space that did it was trusted',
      expected: 'true',
      actual: String(seen.spaceTrusted)
    },
    {
      label: 'exactly three toggles — no handler fired a fourth',
      expected: 3,
      actual: seen.toggles.length
    },
    {
      label: 'the lab ended closed, and nothing re-rendered it back open',
      expected: 'false',
      actual: String(
        lab?.querySelector<HTMLDetailsElement>('details.bf-nav__group')?.open ?? 'missing'
      )
    },

    // --- 6. reflow, measured ------------------------------------------------
    {
      label: 'at full width the open panel floats (position: absolute)',
      expected: 'absolute',
      actual: widePanelPosition
    },
    {
      label: 'the same component in a 375px container flows in the document',
      expected: 'static',
      actual: narrowPanelPosition
    },
    {
      label: 'the narrow container acquires no horizontal scrollbar',
      expected: 'false',
      actual: String(narrowOverflows)
    },
    {
      label: 'the document itself acquired no horizontal scrollbar',
      expected: 'true',
      actual: String(
        document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      )
    },
    {
      label: 'the open panel escapes the header box — size containment does not clip',
      expected: 'true',
      actual: String(panelOverflowsHeader)
    },
    {
      label: 'the header is sticky, with the container declared on the same element',
      expected: 'sticky|inline-size|bf-nav',
      actual: gallery
        ? [
            getComputedStyle(gallery).position,
            getComputedStyle(gallery).containerType,
            getComputedStyle(gallery).containerName
          ].join('|')
        : 'missing'
    },

    // --- 7. tokens, layers, inline style, attrs ----------------------------
    {
      label: '.bf-nav rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(layeredRule(s => /\.bf-nav(?![\w-])/.test(s)) !== null)
    },
    {
      label: '.bf-nav__group (the child component) too',
      expected: 'true',
      actual: String(layeredRule(s => s.includes('.bf-nav__group')) !== null)
    },
    {
      label: '.bf-nav__item (the other child) too',
      expected: 'true',
      actual: String(layeredRule(s => s.includes('.bf-nav__item')) !== null)
    },
    {
      label: 'the focus ring is the stack’s bare :focus-visible (@layer defaults, #146)',
      expected: 'true',
      actual: String(focusDefaultRule !== null)
    },
    {
      label: '  …and no bf-nav file declares a :focus-visible of its own',
      expected: 'true',
      actual: String(layeredRule(s => s.includes('.bf-nav') && s.includes(':focus-visible')) === null)
    },
    {
      label: 'the three named hooks resolve to a real value',
      expected: 'true,true,true',
      actual: gallery
        ? (['--_bf-nav-height', '--_bf-nav-bg', '--_bf-nav-link-color'] as const)
            .map(v => String(getComputedStyle(gallery).getPropertyValue(v).trim().length > 0))
            .join(',')
        : 'missing'
    },
    {
      label: 'the dropdown marker is drawn and announces nothing extra',
      expected: 'true|Programs',
      actual: (() => {
        const s = groups[0]?.querySelector<HTMLElement>('summary')
        if (!s) return 'missing'
        const content = getComputedStyle(s, '::after').content
        return `${content.includes('▾')}|${(s.textContent ?? '').trim()}`
      })()
    },
    {
      label: 'no component in the trio contributes an inline style',
      expected: 0,
      actual: Array.from(
        document.querySelectorAll(
          'header.bf-nav, header.bf-nav .bf-nav__group, header.bf-nav .bf-nav__item'
        )
      ).filter(el => el.getAttribute('style') !== null).length
    },
    {
      label: '$attrs fallthrough reaches the <header> (data-probe-case)',
      expected: 'wide',
      actual: gallery?.dataset.probeCase ?? 'missing'
    }
  ]

  checks.value = results
}

onMounted(() => {
  const lab = document.querySelector<HTMLElement>('[data-probe-lab] header.bf-nav')
  const labGroup = lab?.querySelector<HTMLDetailsElement>('details.bf-nav__group') ?? null
  const labSummary = labGroup?.querySelector<HTMLElement>('summary') ?? null

  /*
   * **Capture phase.** A bubbling listener on `document` runs *after* the
   * `<details>`'s own `@keydown.esc` handler, which by then has already closed
   * the menu and moved focus to the `<summary>` — so a bubbling read of
   * `document.activeElement` reports where focus *ended up*, never where the
   * key was pressed, and the "Esc was pressed from inside the panel" row would
   * be unfalsifiable. Capture runs on the way down, before the component sees
   * the event.
   */
  document.addEventListener(
    'keydown',
    event => {
      if (event.key === 'Escape') {
        seen.escTrusted ||= event.isTrusted
        if (seen.focusedAtEsc === '') seen.focusedAtEsc = describe(document.activeElement)
      }
      if (event.key === 'Enter') seen.enterTrusted ||= event.isTrusted
      if (event.key === ' ') seen.spaceTrusted ||= event.isTrusted
    },
    { capture: true }
  )

  document.addEventListener('keyup', event => {
    if (event.key === 'Escape' && seen.focusedAfterEsc === '') {
      seen.focusedAfterEsc = describe(document.activeElement)
    }
    if (event.key !== ' ') return
    /*
     * A beat for the toggle to land: `toggle` is fired asynchronously after the
     * open state changes, so reading it synchronously here would read the state
     * before the event that reports it.
     */
    setTimeout(() => void finalise(), 150)
  })

  /*
   * The starting point, stated rather than relied upon (gh#39). The lab
   * dropdown is opened and focus is put on the **first link inside its panel**
   * — which is the case the Esc handler exists for and the one that would
   * otherwise drop focus to `<body>`. This is the only `.focus()` that runs
   * before the key sequence; every other one is inside `finalise()`.
   *
   * Ordering is load-bearing. `toggle` is fired from a queued task, not
   * synchronously, so a listener attached immediately after `open = true` would
   * still receive that opening toggle and `seen.toggles` would carry four
   * entries instead of the three the keyboard causes. The listener is therefore
   * attached from a later task, after the opening toggle has already been
   * dispatched — and `armed` is published from the same callback, so the keys
   * cannot arrive before the listener that counts them.
   */
  if (labGroup) labGroup.open = true

  setTimeout(() => {
    if (labGroup) {
      labGroup.addEventListener('toggle', () => {
        seen.toggles.push(labGroup.open)
      })
      labGroup.querySelector<HTMLAnchorElement>('.bf-nav__panel a')?.focus()
    }
    armed.value = true
  }, 50)

  /*
   * Safety net. A probe that stays PENDING reports a timeout and nothing else;
   * a probe that finalises reports *which* key failed. Generous enough that it
   * cannot pre-empt a sequence that is merely slow (the harness spaces keys
   * 60ms apart), and it flags itself in a row of its own so a timeout can never
   * be mistaken for a pass.
   */
  setTimeout(() => {
    if (finalised) return
    seen.timedOut = true
    void finalise()
  }, 6000)
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
    ? 'PENDING — press Esc, then Enter, then Space (assertions run after the key sequence)'
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
    `onMounted` has opened the lab panel and focused a link inside it — the
    handshake described in the script block.
  -->
  <main
    class="probe"
    data-probe="35"
    :data-probe-verdict="state.toUpperCase()"
    :data-probe-keys="armed ? 'Escape,Enter,Space' : undefined"
  >
    <div class="probe__body | center">
      <h1>Probe 35 — <code>bfNav</code></h1>
      <p class="probe__lede">
        The top bar, rendered <strong>entirely</strong> from the
        <code>fixtureMenus</code> array written in this page's own script block.
        That is the issue: the wireframe's <code>wfNav</code> calls
        the wireframe content composable inside itself and cannot be handed
        content;
        <code>bfNav</code> takes <code>menus</code> as a prop and has no other
        source of anything (D8).
      </p>
      <p class="probe__lede">
        The keyboard rows are read from <strong>real key events</strong>. With
        focus on a link <em>inside</em> an open panel, the harness presses
        <kbd>Esc</kbd> (which must close it and put focus back on the
        <code>&lt;summary&gt;</code>), then <kbd>Enter</kbd> (which must re-open
        it from there), then <kbd>Space</kbd> (which must close it). The middle
        key only works if the first one returned focus — the focus-return claim,
        asserted by consequence.
      </p>
    </div>

    <section aria-labelledby="wide-heading">
      <div class="probe__body | center">
        <h2 id="wide-heading">Full width</h2>
        <p class="probe__note">
          Sticky, panels floating over the page. Click a summary, then another:
          the first closes.
        </p>
      </div>
      <div data-probe-slot="wide">
        <bfNav :menus="fixtureMenus" data-probe-case="wide" />
      </div>
    </section>

    <section aria-labelledby="narrow-heading">
      <div class="probe__body | center">
        <h2 id="narrow-heading">The same component, 375px container</h2>
        <p class="probe__note">
          No second nav paradigm and no drawer — the identical markup, reflowed
          by a <code>@container</code> query at 768px. The panels stop floating
          and flow in the document, so the bar wraps into a stack of
          disclosures.
        </p>
      </div>
      <!--
        A real container, not an emulated viewport: the harness runs at one
        fixed 1280px viewport, so a `@media`-based version of this rule could
        only be checked by reading its text back out of the CSSOM. This one is
        measured.
      -->
      <div class="probe__narrow" data-probe-slot="narrow">
        <bfNav :menus="fixtureMenus" />
      </div>
    </section>

    <section aria-labelledby="lab-heading" data-probe-lab>
      <div class="probe__body | center">
        <h2 id="lab-heading">Keyboard lab</h2>
        <p class="probe__note">
          Its first dropdown is opened on mount and focus is placed on the first
          link inside the panel. <kbd>Esc</kbd>, then <kbd>Enter</kbd>, then
          <kbd>Space</kbd>.
        </p>
      </div>
      <div data-probe-slot="lab">
        <bfNav :menus="fixtureMenus" />
      </div>
    </section>

    <div class="probe__body | center">
      <p
        class="probe__verdict"
        :data-state="state"
        data-testid="probe-35-verdict"
      >
        {{ verdict }}
      </p>

      <table class="probe__table" data-testid="probe-35-table">
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
    </div>
  </main>
</template>

<style scoped>
/*
  The ground is the `bf-probe` layout's job (gh#116): it paints `html` from
  `--color-surface-page` / `--color-text` and pins `color-scheme: light`.

  Three navs are sticky on one page, which is not a configuration a real site
  produces; nothing here suppresses that, because the sticky behaviour is one of
  the things being looked at.
*/

.probe {
  padding-block-end: var(--space-l, 2rem);
  min-block-size: 100dvh;
}

/* The prose column. The navs are full-bleed, so they get no `center`. */
.probe__body {
  padding-block: var(--space-s, 1rem);
}

.probe__lede,
.probe__note {
  max-inline-size: 75ch;
}

.probe__note {
  font-size: 0.875rem;
}

/*
  The reflow subject. A real 375px containing block — the narrowest common
  phone width — so the `@container` query inside `nav/Dropdown.vue` resolves
  the way it would on that device, at whatever viewport the harness runs.
*/
.probe__narrow {
  inline-size: 375px;
  max-inline-size: 100%;
  outline: 1px dashed currentcolor;
  outline-offset: 4px;
  margin-inline: var(--space-s, 1rem);
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
