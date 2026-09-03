<script setup lang="ts">
/**
 * Probe — issue 19 / gh#28: `bfSkipLink` and the `[data-external]` marker.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * The two halves are on one page because the brief bundles them (§5.5) and
 * because the acceptance asks for them together: the skip link first, an
 * external anchor carrying the marker, in the same render.
 *
 * ## Why this probe presses real keys
 *
 * Every earlier probe answers its focus questions with `el.focus()`. That is
 * the right tool for "can this element take focus", and the wrong tool for the
 * two questions this issue actually raises:
 *
 *   - **is the skip link the first focusable element?** — a question about the
 *     browser's sequential focus navigation, which `.focus()` bypasses
 *     entirely. Computing the tab order in JavaScript and calling it verified
 *     would be marking my own homework.
 *   - **does activating it move focus to the target?** — fragment navigation
 *     moves focus only when the target is focusable, and a scripted `.click()`
 *     is a different code path from a keyboard activation.
 *
 * So the probe declares `data-probe-keys="Tab,Enter"` on its root once it has
 * hydrated, and `scripts/check-probes.ts` dispatches those as **trusted** CDP
 * key events (harness hook added by this issue, documented in
 * `docs/decisions/probe-harness.md`). One Tab from a fresh document, then one
 * Enter on whatever it focused. Every keyboard row below is read from what the
 * browser actually did.
 *
 * Opened by hand, the page waits: press <kbd>Tab</kbd>, then <kbd>Enter</kbd>.
 * Until then the verdict is `PENDING`, which the harness already treats as a
 * failure rather than a skip.
 *
 * ## What it proves
 *
 *  1. The skip link is the **first** thing a real Tab reaches, and the key
 *     event that reached it was trusted.
 *  2. Unfocused it is off-screen and out of flow — focusable and announced, not
 *     `display: none`, and unable to move the first real element by a pixel.
 *  3. Focused it is genuinely visible: inside the viewport, painted, above the
 *     page (`z-index`), with an AA-contrasting label.
 *  4. Enter moves focus to `#main` and sets the hash — the whole point of the
 *     component, and the half that needs `tabindex="-1"` on the landmark.
 *  5. `target` defaults to `#main`, and a custom `target` is honoured.
 *  6. `isExternal()` over real hosts from the snapshots, including the three
 *     `bfna`-shaped ones that are *not* this site.
 *  7. The `↗` marker renders on external anchors — plain ones and the ones
 *     `bfButton`/`bfChip` emit — and on nothing else. Read from the resolved
 *     `::after` content, not from the stylesheet text.
 *  8. Both rules are inside `@layer components` in the live CSSOM.
 *  9. No new colour: the focused ground and label resolve to exactly the same
 *     values as `--color-primary` / `--color-text-inverse`, compared against
 *     reference elements rather than against a typed-out literal.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 19`,
 * per the gh#20–#27 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
import { isExternal, SITE_HOSTS } from '~/utils/link'

defineOptions({ name: 'BfProbe19BfSkipLink' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 19 — bfSkipLink + [data-external]'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/** One `isExternal` case. */
interface LinkCase {
  href: string
  expected: boolean
  note: string
}

/**
 * Real hosts, not invented ones. Every `https://` case below appears in
 * `src/assets/wireframe-data/*.json`; the counts are from that snapshot.
 */
const linkCases: LinkCase[] = [
  { href: 'https://www.bfna.org/insights', expected: false, note: "the site itself, written absolutely (23 links)" },
  { href: 'https://bfna.org/insights', expected: false, note: 'the apex form of the same site' },
  { href: 'https://WWW.BFNA.ORG/insights', expected: false, note: 'host comparison is case-insensitive' },
  { href: 'https://bfna.simplyas.com/media/x.jpg', expected: true, note: 'the legacy asset host (296 links) — a different property' },
  { href: 'https://www.bfnadocs.org/', expected: true, note: 'a microsite (7 links), bfna-shaped but not this site' },
  { href: 'https://www.greenideasbfna.org/', expected: true, note: 'another microsite (1 link)' },
  { href: 'https://podcasts.apple.com/x', expected: true, note: 'a podcast platform — the Front-2 case the marker exists for' },
  { href: '//example.com/x', expected: true, note: 'protocol-relative, still a different host' },
  { href: '/insights', expected: false, note: 'a root-relative path — same site by definition' },
  { href: 'insights/slug', expected: false, note: 'a document-relative path' },
  { href: '../archive', expected: false, note: 'a parent-relative path' },
  { href: '#main', expected: false, note: 'an in-page fragment — the skip link’s own href' },
  { href: '', expected: false, note: 'empty — read from untyped snapshot data' },
  { href: '   ', expected: false, note: 'whitespace only' },
  { href: 'mailto:hello@bfna.org', expected: false, note: 'another application, not another site (spec’s base rule, literally)' },
  { href: 'tel:+15551234', expected: false, note: 'likewise' },
  { href: 'http://', expected: false, note: 'malformed — no host to differ from ours' }
]

/** The anchors whose `::after` is read: does the marker appear, or not? */
interface MarkerCase {
  key: string
  marked: boolean
  note: string
}

const markerCases: MarkerCase[] = [
  { key: 'plain-external', marked: true, note: 'a hand-written <a data-external>' },
  { key: 'plain-internal', marked: false, note: 'the same anchor without the attribute' },
  { key: 'button-external', marked: true, note: 'bfButton href + external' },
  { key: 'button-internal', marked: false, note: 'bfButton href, no external' },
  { key: 'chip-external', marked: true, note: 'bfChip href + external' },
  { key: 'chip-internal', marked: false, note: 'bfChip href, no external' }
]

const checks = ref<Check[]>([])

/**
 * Whether the keyboard sequence has been requested. Bound to
 * `data-probe-keys` on the root, so the attribute exists only after this
 * component has mounted and its listeners are attached — which is what makes
 * it a handshake rather than a race.
 */
const armed = ref(false)

/** What the keyboard actually did, filled in by the listeners below. */
const seen = reactive({
  firstFocused: '' as string,
  tabTrusted: false,
  enterTrusted: false,
  focusedLeft: '',
  focusedRect: null as DOMRect | null,
  focusedBg: '',
  focusedColor: '',
  focusedZ: '',
  focusedVisibility: '',
  activeAfterEnter: '',
  hashAfterEnter: ''
})

/** Metrics taken before anything is focused. */
const resting = reactive({
  left: '',
  position: '',
  display: '',
  visibility: '',
  right: 0,
  width: 0
})

/** `rgb(r, g, b)` / `rgba(...)` as three channels. Computed styles are always in that form. */
const channels = (css: string): [number, number, number] | null => {
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(css)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

/** WCAG relative luminance. */
const luminance = (rgb: [number, number, number]): number => {
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2])
}

/** WCAG contrast ratio between two computed colour strings. `0` if either is unreadable. */
const contrast = (a: string, b: string): number => {
  const x = channels(a)
  const y = channels(b)
  if (!x || !y) return 0
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Walk every reachable stylesheet — `@import`ed ones included, since
 * `/css/styles.css` is nothing but a list of imports — for a style rule
 * matching `selector` whose ancestry includes a `@layer components` block.
 * Cross-origin sheets throw on `cssRules`; they are skipped, not failed, so the
 * Google Fonts link does not sink the check. (Same helper as probes 14–18.)
 */
const layeredRuleFound = (selector: RegExp): boolean => {
  const LAYER_BLOCK = globalThis.CSSLayerBlockRule
  if (!LAYER_BLOCK) return false

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

/** A short, stable description of an element, for the "what got focused" rows. */
const describe = (el: Element | null): string => {
  if (!el || el === document.body) return 'body'
  const id = el.id ? `#${el.id}` : ''
  const cls = el.classList.length > 0 ? `.${el.classList[0]}` : ''
  return `${el.tagName.toLowerCase()}${id}${cls}`
}

/**
 * Every element the browser would put in the sequential tab order, in DOM
 * order. Corroborates the Tab result — it is not a substitute for it, and the
 * rows say which is which.
 */
const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex^="-"])'

let finalised = false

const finalise = () => {
  if (finalised) return
  finalised = true

  const link = document.querySelector<HTMLAnchorElement>('.bf-skip-link')
  const main = document.querySelector<HTMLElement>('#main')
  const custom = document.querySelector<HTMLAnchorElement>('[data-probe-slot="custom-target"] .bf-skip-link')

  const anchor = (key: string) =>
    document.querySelector<HTMLElement>(`[data-probe-marker="${key}"]`)

  /** The resolved `::after` content of a marker case's anchor. */
  const markerOf = (key: string): string => {
    const el = anchor(key)
    if (!el) return 'missing element'
    const a = el.tagName === 'A' ? el : el.querySelector('a')
    if (!a) return 'no anchor'
    return getComputedStyle(a, '::after').content
  }

  const refBg = document.querySelector<HTMLElement>('.probe__ref-bg')
  const refFg = document.querySelector<HTMLElement>('.probe__ref-fg')
  const ground = getComputedStyle(document.documentElement).backgroundColor

  const tabbable = Array.from(document.querySelectorAll<HTMLElement>(TABBABLE))
  const positiveTabindex = Array.from(document.querySelectorAll<HTMLElement>('[tabindex]'))
    .filter(el => Number(el.getAttribute('tabindex')) > 0)

  const results: Check[] = [
    // --- 1. the real keyboard: Tab lands here, and it was a real Tab -------
    {
      label: 'a real Tab from a fresh document focuses the skip link first',
      expected: 'a#skip.bf-skip-link',
      actual: seen.firstFocused || 'nothing was focused'
    },
    {
      label: '  …and the key event that did it was trusted, not synthesised',
      expected: 'true',
      actual: String(seen.tabTrusted)
    },
    {
      label: '  …corroborated: the link is index 0 of the DOM tab order',
      expected: 'a#skip.bf-skip-link',
      actual: describe(tabbable[0] ?? null)
    },
    {
      label: 'no positive tabindex on the page could jump ahead of it',
      expected: 0,
      actual: positiveTabindex.length
    },

    // --- 2. hidden, but reachable ------------------------------------------
    {
      label: 'at rest the link is off-screen (left)',
      expected: '-999px',
      actual: resting.left || 'unmeasured'
    },
    {
      label: '  …entirely outside the viewport, not merely clipped',
      expected: 'true',
      actual: String(resting.right <= 0)
    },
    {
      label: '  …out of flow, so it moves nothing (position: absolute)',
      expected: 'absolute',
      actual: resting.position || 'unmeasured'
    },
    {
      label: '  …and NOT display:none or visibility:hidden — it must stay focusable',
      expected: 'block/visible',
      actual: `${resting.display === 'none' ? 'none' : 'block'}/${resting.visibility}`
    },
    {
      label: '  …it still has a real box (a zero-size link is unreachable)',
      expected: 'true',
      actual: String(resting.width > 0)
    },

    // --- 3. focused, it is genuinely visible -------------------------------
    {
      label: 'on focus the offset resolves to 0',
      expected: '0px',
      actual: seen.focusedLeft || 'never focused'
    },
    {
      label: '  …and the box is inside the viewport',
      expected: 'true',
      actual: String(
        !!seen.focusedRect
        && seen.focusedRect.left >= 0
        && seen.focusedRect.top >= 0
        && seen.focusedRect.right <= window.innerWidth
        && seen.focusedRect.width > 0
        && seen.focusedRect.height > 0
      )
    },
    {
      label: '  …it paints a ground rather than sitting transparent over the page',
      expected: 'true',
      actual: String(
        seen.focusedBg !== ''
        && seen.focusedBg !== 'transparent'
        && !/rgba\([^)]*,\s*0\)/.test(seen.focusedBg)
        && seen.focusedBg !== ground
      )
    },
    {
      label: '  …above the page, so a sticky masthead cannot cover it',
      expected: 'true',
      actual: String(Number(seen.focusedZ) >= 1)
    },
    {
      label: `  …and its label clears WCAG AA against that ground (${contrast(seen.focusedColor, seen.focusedBg).toFixed(2)}:1)`,
      expected: 'true',
      actual: String(contrast(seen.focusedColor, seen.focusedBg) >= 4.5)
    },

    // --- 4. no new colour ---------------------------------------------------
    {
      label: 'the focused ground IS --color-primary (compared, not typed out)',
      expected: refBg ? getComputedStyle(refBg).backgroundColor : 'missing reference',
      actual: seen.focusedBg || 'never focused'
    },
    {
      label: '  …and the label IS --color-text-inverse',
      expected: refFg ? getComputedStyle(refFg).color : 'missing reference',
      actual: seen.focusedColor || 'never focused'
    },

    // --- 5. Enter moves focus to the target --------------------------------
    {
      label: 'a real Enter on the focused link moves focus to the target',
      expected: 'main#main.probe',
      actual: seen.activeAfterEnter || 'focus did not move'
    },
    {
      label: '  …and the Enter that did it was trusted',
      expected: 'true',
      actual: String(seen.enterTrusted)
    },
    {
      label: '  …and the location hash is now the target',
      expected: '#main',
      actual: seen.hashAfterEnter || '(none)'
    },
    {
      label: 'the target is focusable at all (tabindex="-1" — the layout’s half)',
      expected: '-1',
      actual: main?.getAttribute('tabindex') ?? 'missing'
    },
    {
      label: '  …without entering the tab order (it must not become tabbable)',
      expected: 0,
      actual: tabbable.filter(el => el === main).length
    },

    // --- 6. the contract: one anchor, default target, honoured override ----
    {
      label: 'the component renders exactly one element, an <a>',
      expected: 'A',
      actual: link?.tagName ?? 'missing'
    },
    {
      label: '  …whose href is the default target',
      expected: '#main',
      actual: link?.getAttribute('href') ?? 'missing'
    },
    {
      label: '  …and a custom target is honoured verbatim',
      expected: '#custom-landmark',
      actual: custom?.getAttribute('href') ?? 'missing'
    },
    {
      label: '  …the label comes from the default slot',
      expected: 'Skip to content',
      actual: link?.textContent?.trim() ?? 'missing'
    },
    {
      label: '$attrs fallthrough reaches the anchor (id="skip")',
      expected: 'skip',
      actual: link?.id ?? 'missing'
    },
    {
      label: 'the component contributes no inline style of its own',
      expected: '2 instances, 0 styled',
      actual: (() => {
        const instances = Array.from(document.querySelectorAll<HTMLElement>('.bf-skip-link'))
        const styled = instances.filter(el => el.getAttribute('style') !== null)
        return `${instances.length} instances, ${styled.length} styled`
      })()
    },

    // --- 7. isExternal ------------------------------------------------------
    ...linkCases.map(c => ({
      label: `isExternal(${JSON.stringify(c.href)}) — ${c.note}`,
      expected: String(c.expected),
      actual: String(isExternal(c.href))
    })),
    {
      label: 'a caller-supplied host list overrides SITE_HOSTS',
      expected: 'false',
      actual: String(isExternal('https://example.com/x', ['example.com']))
    },
    {
      label: 'SITE_HOSTS names this site and nothing else',
      expected: 'bfna.org,www.bfna.org',
      actual: SITE_HOSTS.join(',')
    },

    // --- 8. the marker actually renders ------------------------------------
    ...markerCases.map(c => ({
      label: `[data-external] marker on ${c.key} (${c.note})`,
      expected: c.marked ? 'shows ↗' : 'shows nothing',
      actual: (() => {
        const content = markerOf(c.key)
        if (content.startsWith('missing') || content === 'no anchor') return content
        return /↗/.test(content) ? 'shows ↗' : 'shows nothing'
      })()
    })),
    {
      label: 'the attribute really is present on the external ones',
      expected: 3,
      actual: document.querySelectorAll('.probe__markers a[data-external]').length
    },
    {
      label: '  …and absent, not "false", on the internal ones',
      expected: 0,
      actual: document.querySelectorAll('.probe__markers a[data-external="false"]').length
    },
    {
      label: 'the marker is scoped to anchors — a <button data-external> gets none',
      expected: 'none',
      actual: (() => {
        const btn = document.querySelector<HTMLElement>('[data-probe-marker="button-element"]')
        return btn ? getComputedStyle(btn, '::after').content : 'missing'
      })()
    },

    // --- 9. cascade layers --------------------------------------------------
    {
      label: '.bf-skip-link rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(layeredRuleFound(/\.bf-skip-link(?![\w-])/))
    },
    {
      label: 'the [data-external] marker rule is too',
      expected: 'true',
      actual: String(layeredRuleFound(/a\[data-external\]::after/))
    }
  ]

  checks.value = results
}

onMounted(() => {
  const link = document.querySelector<HTMLAnchorElement>('.bf-skip-link')

  if (link) {
    const cs = getComputedStyle(link)
    const rect = link.getBoundingClientRect()
    resting.left = cs.left
    resting.position = cs.position
    resting.display = cs.display
    resting.visibility = cs.visibility
    resting.right = rect.right
    resting.width = rect.width
  }

  /*
   * `focusin` rather than `focus`: it bubbles, so one listener sees whatever
   * the browser's sequential navigation reaches — including the case this
   * probe exists to catch, where it reaches something *other* than the skip
   * link.
   */
  document.addEventListener('focusin', event => {
    const target = event.target as Element | null

    if (seen.firstFocused === '') seen.firstFocused = describe(target)

    if (link !== null && target === link && seen.focusedLeft === '') {
      const cs = getComputedStyle(link)
      seen.focusedLeft = cs.left
      seen.focusedBg = cs.backgroundColor
      seen.focusedColor = cs.color
      seen.focusedZ = cs.zIndex
      seen.focusedVisibility = cs.visibility
      seen.focusedRect = link.getBoundingClientRect()
    }
  })

  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') seen.tabTrusted ||= event.isTrusted
    if (event.key === 'Enter') seen.enterTrusted ||= event.isTrusted
  })

  document.addEventListener('keyup', event => {
    if (event.key !== 'Enter') return
    /*
     * A beat for the activation to complete: the fragment navigation, the
     * focus move and the hash update all land after the key event returns.
     */
    setTimeout(() => {
      seen.activeAfterEnter = describe(document.activeElement)
      seen.hashAfterEnter = window.location.hash
      finalise()
    }, 120)
  })

  /*
   * Only now — with every listener attached — ask for the keys. The harness
   * polls for this attribute, so its appearance is the handshake; publishing it
   * in the template unconditionally would race the listeners above.
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
    ? 'PENDING — press Tab, then Enter (the harness does this for you)'
    : `${state.value === 'pass' ? 'PASS' : 'FAIL'} — ${passed.value}/${checks.value.length} checks`
)
</script>

<template>
  <!--
    Harness contract (docs/decisions/probe-harness.md): the root carries
    `data-probe` + `data-probe-verdict`, and every check row carries
    `data-probe-row` + `data-ok`.

    `id="main"` and `tabindex="-1"` are this page standing in for the site shell
    (#55): the skip link's default target, made focusable, because fragment
    navigation moves focus only to a focusable element. `data-probe-keys` is
    bound rather than written, so it appears only after `onMounted` — the
    handshake described in the script block.
  -->
  <main
    id="main"
    class="probe container"
    tabindex="-1"
    data-probe="19"
    :data-probe-verdict="state.toUpperCase()"
    :data-probe-keys="armed ? 'Tab,Enter' : undefined"
  >
    <!--
      FIRST. Not first-ish. Everything this probe asserts about tab order is
      about this line being the first focusable thing in the document, so
      nothing focusable may be added above it.
    -->
    <bfSkipLink id="skip" />

    <h1>Probe 19 — <code>bfSkipLink</code> + <code>[data-external]</code></h1>

    <p class="probe__lede">
      Two atoms in one probe, because the brief bundles them and the acceptance
      asks to see them together: a skip link that is the first focusable element
      and becomes visible on focus, and an external anchor carrying the
      <code>↗</code> marker.
    </p>
    <p class="probe__lede">
      The keyboard rows are driven by <strong>real key events</strong>. Opened by
      hand this page waits for you to press <kbd>Tab</kbd> and then
      <kbd>Enter</kbd>; under <code>scripts/check-probes.ts</code> the harness
      dispatches both through the DevTools protocol, because whether the first
      Tab lands here is a question about the browser's own focus navigation and
      a programmatic <code>.focus()</code> answers an easier one.
    </p>

    <section aria-labelledby="skip-heading">
      <h2 id="skip-heading">The skip link</h2>
      <p class="probe__lede">
        It is the first child of this <code>&lt;main&gt;</code>, which also
        stands in for the site shell's landmark — <code>id="main"</code>, the
        component's default <code>target</code>, and
        <code>tabindex="-1"</code> so that focus can actually land on it.
      </p>
      <p class="probe__slot" data-probe-slot="custom-target">
        A second instance with an explicit target, to show the prop is honoured:
        <bfSkipLink target="#custom-landmark">Skip to the marker gallery</bfSkipLink>
      </p>
    </section>

    <section class="probe__markers" aria-labelledby="marker-heading">
      <h2 id="custom-landmark" tabindex="-1">
        <span id="marker-heading">The <code>[data-external]</code> marker</span>
      </h2>
      <table class="probe__table">
        <thead>
          <tr>
            <th scope="col">Case</th>
            <th scope="col">Source</th>
            <th scope="col">Rendered</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>plain-external</code></td>
            <td class="probe__note">a hand-written anchor</td>
            <td>
              <a
                href="https://www.bfnadocs.org/"
                data-external
                data-probe-marker="plain-external"
              >BFNA Docs</a>
            </td>
          </tr>
          <tr>
            <td><code>plain-internal</code></td>
            <td class="probe__note">the same anchor, no attribute</td>
            <td>
              <a href="/insights" data-probe-marker="plain-internal">Insights</a>
            </td>
          </tr>
          <tr>
            <td><code>button-external</code></td>
            <td class="probe__note"><code>bfButton</code> emits the attribute itself</td>
            <td>
              <bfButton
                href="https://podcasts.apple.com/"
                external
                data-probe-marker="button-external"
              >Listen</bfButton>
            </td>
          </tr>
          <tr>
            <td><code>button-internal</code></td>
            <td class="probe__note">same component, internal href</td>
            <td>
              <bfButton
                href="/archive"
                data-probe-marker="button-internal"
              >Archive</bfButton>
            </td>
          </tr>
          <tr>
            <td><code>chip-external</code></td>
            <td class="probe__note"><code>bfChip</code>, likewise</td>
            <td>
              <bfChip
                href="https://bfna.simplyas.com/"
                external
                data-probe-marker="chip-external"
              >Legacy</bfChip>
            </td>
          </tr>
          <tr>
            <td><code>chip-internal</code></td>
            <td class="probe__note">same component, internal href</td>
            <td>
              <bfChip href="/projects" data-probe-marker="chip-internal">Projects</bfChip>
            </td>
          </tr>
          <tr>
            <td><code>button-element</code></td>
            <td class="probe__note">the attribute on a <code>&lt;button&gt;</code> — out of scope by design</td>
            <td>
              <button type="button" data-external data-probe-marker="button-element">
                Not a link
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section aria-labelledby="isexternal-heading">
      <h2 id="isexternal-heading"><code>isExternal()</code></h2>
      <p class="probe__lede">
        Every <code>https://</code> case is a real host from
        <code>src/assets/wireframe-data/</code>. Three of the four
        <code>bfna</code>-shaped hosts there are separate properties — a
        microsite, a second microsite and the legacy asset origin — so they read
        as external, which is what a reader following one experiences.
      </p>
      <p class="probe__lede">
        The verdicts are in the table below; this section is the prose that goes
        with them.
      </p>
    </section>

    <!--
      Reference elements for the "no new colour" rows: the same tokens, resolved
      by the browser, so the assertion compares two computed values instead of a
      computed value against a literal typed into this file.
    -->
    <div class="probe__refs" aria-hidden="true">
      <span class="probe__ref-bg" />
      <span class="probe__ref-fg" />
    </div>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-19-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-19-table">
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

/*
  The landmark takes focus programmatically (that is the whole point) but must
  never grow a focus ring for a mouse user who happened to click it.
*/
.probe:focus {
  outline: none;
}

.probe__lede {
  max-inline-size: 75ch;
}

.probe__note {
  font-size: 0.875rem;
  max-inline-size: 40ch;
}

.probe__slot {
  outline: 1px dashed currentcolor;
  outline-offset: 2px;
}

/*
  Reference swatches: rendered, so the browser resolves the tokens, but not
  shown — the rows read `getComputedStyle`, which does not need a visible box.
*/
.probe__refs {
  block-size: 0;
  overflow: hidden;
}

.probe__ref-bg {
  background-color: var(--color-primary);
}

.probe__ref-fg {
  color: var(--color-text-inverse);
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
