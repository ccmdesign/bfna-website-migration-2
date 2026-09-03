<script setup lang="ts">
/**
 * Probe — issue 36 / gh#45: `bfFooter`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## What it proves
 *
 * 1. **It renders entirely from a fixture array.** `fixtureMenus` below is
 *    hand-written in this file — no composable, no collection, nothing from
 *    the data layer — and every entry in it reaches the DOM as the right
 *    element for its shape. That is the acceptance sentence of the issue, and
 *    the D8 violation it exists to fix is the reason it can be written at all:
 *    the wireframe footer sources its own content and cannot be probed this
 *    way. Zero data access is asserted **structurally** here — the component is
 *    handed `menus` and renders exactly what it was handed — rather than by
 *    grep, which the spec's own acceptance already does over the source.
 * 2. **The column count is derived, not authored.** The same component in a
 *    1200px container resolves **4** tracks and in a 400px one resolves fewer,
 *    with no media query, no second markup path and no inline `style`
 *    anywhere. The track counts are read from
 *    `getComputedStyle(...).gridTemplateColumns` and cross-checked against the
 *    arithmetic `auto-fill` performs on the measured container width, resolved
 *    floor and resolved gap — the viewport-agnostic pattern probe 03
 *    established, because the harness runs at one fixed 1280px viewport
 *    (`docs/decisions/probe-harness.md`). The two containers are real
 *    fixed-width boxes, so the "at 1200px / at 400px" claim is measured rather
 *    than read out of a rule.
 * 3. **The six social profiles survive verbatim**, URLs included — the
 *    placeholder Bluesky one among them, which is the entry most likely to be
 *    silently "fixed" by a later edit.
 * 4. **The legal row carries the current year**, computed at render rather than
 *    baked in at build time.
 * 5. **Menu items sit at line-height spacing** — measured margins, not a
 *    reading of the rule that sets them, because the rule this replaces was an
 *    unlayered workaround for a defect gh#116 has since fixed.
 * 6. `.bf-footer` rules live in `@layer components` in the live CSSOM, the
 *    named hooks resolve, `$attrs` reaches the `<footer>`, and the focus ring
 *    is the stack's own `:focus-visible` (#146) rather than a private copy.
 * 7. **Nothing out of scope came back**: no search `<form>` or `<input>` (search
 *    lives in `bfNav`), and no subscribe band (D2).
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 36`.
 * Recorded in the spec's Decisions section.
 */
import type { Menu } from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe36BfFooter' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 36 — bfFooter'
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
 * Four menus, because four columns is the layout claim under test. The heading
 * branches are deliberately spread across the three the component supports —
 * one external `href`, one internal `to`, two with no destination of their own
 * — and one item carries `strong`, because `MenuItem.strong` exists and a
 * fixture that never sets it would leave that branch of the reused `MenuLink`
 * unexercised.
 *
 * Nothing here is read from anywhere. That is what makes this a probe of
 * `bfFooter` rather than of the data layer.
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
    to: '/insights',
    items: [
      { label: 'All insights', to: '/insights' },
      { label: 'Archive', to: '/archive' }
    ]
  },
  {
    label: 'About',
    items: [
      { label: 'Who we are', to: '/about' },
      { label: 'People', to: '/people' },
      { label: 'Careers', to: '/careers' }
    ]
  },
  {
    label: 'Podcasts',
    href: 'https://www.bfna.org/podcasts/',
    external: true,
    items: [{ label: 'Barometer', href: 'https://www.bfna.org/barometer/' }]
  }
]

/** The six entries the component must reproduce, byte-for-byte, from the frozen source. */
const expectedSocials = [
  ['LinkedIn', 'https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc.'],
  ['Instagram', 'https://www.instagram.com/bertelsmannfoundation/'],
  ['Bluesky', '#bluesky-profile-url'],
  ['Facebook', 'https://www.facebook.com/BertelsmannFoundation/'],
  ['YouTube', 'https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg'],
  ['Vimeo', 'https://vimeo.com/bfna']
] as const

const expectedItems = fixtureMenus.reduce((n, m) => n + (m.items?.length ?? 0), 0)

const checks = ref<Check[]>([])

const px = (n: number) => `${Math.round(n * 10) / 10}px`

/**
 * Walk every reachable stylesheet — `@import`ed ones included, since
 * `/css/styles.css` is nothing but a list of imports — for a style rule whose
 * selector matches and whose ancestry includes a `@layer <name>` block.
 * Cross-origin sheets throw on `cssRules`; they are skipped, not failed, so the
 * Google Fonts link does not sink the check. (Same helper as probes 14–35,
 * generalised over the layer name for the `defaults` row.)
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

/**
 * The track count of a `.grid`, plus the count `auto-fill` implies for its
 * measured width — the probe-03 arithmetic, repeated here rather than pinned
 * to a number, so a sub-pixel container width or a different harness viewport
 * cannot decide a verdict on its own.
 */
const tracksOf = (grid: HTMLElement | null) => {
  if (!grid) return { tracks: 0, implied: 0, agrees: false, width: 0, floor: 0, gap: 0 }

  const cs = getComputedStyle(grid)
  const tracks = cs.gridTemplateColumns.split(' ').filter(Boolean).length
  const gap = Number.parseFloat(cs.columnGap) || 0
  const width =
    grid.getBoundingClientRect().width
    - Number.parseFloat(cs.paddingInlineStart) - Number.parseFloat(cs.paddingInlineEnd)
    - Number.parseFloat(cs.borderInlineStartWidth) - Number.parseFloat(cs.borderInlineEndWidth)
  /* `min(<floor>, 100%)` — the documented collapse when the floor exceeds the container. */
  const floor = Number.parseFloat(cs.getPropertyValue('--_grid-min-width')) || 240
  const track = Math.min(floor, width)
  const fits = (w: number) => Math.max(1, Math.floor((w + gap) / (track + gap)))
  /* ±1px of tolerance: sub-pixel container widths must not decide a verdict. */
  const agrees = [width - 1, width, width + 1].some(w => fits(w) === tracks)

  return { tracks, implied: fits(width), agrees, width, floor: track, gap }
}

const finalise = () => {
  const slot = (name: string) =>
    document.querySelector<HTMLElement>(`[data-probe-slot="${name}"] footer.bf-footer`)

  const wideWrap = document.querySelector<HTMLElement>('[data-probe-slot="wide"]')
  const narrowWrap = document.querySelector<HTMLElement>('[data-probe-slot="narrow"]')
  const wide = slot('wide')
  const narrow = slot('narrow')

  const gridIn = (root: HTMLElement | null) =>
    root?.querySelector<HTMLElement>('ul.bf-footer__menus') ?? null

  const wideGrid = gridIn(wide)
  const narrowGrid = gridIn(narrow)
  const wideTracks = tracksOf(wideGrid)
  const narrowTracks = tracksOf(narrowGrid)

  const columns = Array.from(wideGrid?.children ?? [])
  const headings = columns.map(li => (li.querySelector('.bf-footer__heading')?.textContent ?? '').trim())
  const items = Array.from(wide?.querySelectorAll<HTMLElement>('.bf-footer__items .bf-nav__item') ?? [])

  const socialLinks = Array.from(
    wide?.querySelectorAll<HTMLAnchorElement>('.bf-footer__social a') ?? []
  )

  const legal = wide?.querySelector<HTMLElement>('.bf-footer__legal') ?? null
  const legalText = (legal?.textContent ?? '').replace(/\s+/g, ' ').trim()

  /** Every element the component renders, for the inline-style row. */
  const ownElements = Array.from(wide?.querySelectorAll('*') ?? [])
  if (wide) ownElements.push(wide)

  const firstItemLi = wide?.querySelector<HTMLElement>('.bf-footer__items > li') ?? null
  const itemMargins = firstItemLi
    ? (() => {
        const cs = getComputedStyle(firstItemLi)
        return `${Number.parseFloat(cs.marginBlockStart)}/${Number.parseFloat(cs.marginBlockEnd)}`
      })()
    : 'missing'

  const focusDefaultRule = layeredRule(s => s.trim() === ':focus-visible', 'defaults')

  const results: Check[] = [
    // --- 1. it renders, entirely from the fixture --------------------------
    {
      label: 'the component renders a <footer class="bf-footer">',
      expected: 'FOOTER',
      actual: wide?.tagName ?? 'missing'
    },
    {
      label: `all ${fixtureMenus.length} fixture menus reach the grid as columns, in order`,
      expected: fixtureMenus.map(m => m.label).join(','),
      actual: headings.join(',')
    },
    {
      label: 'each column is a <li> wrapping a labelled <nav>',
      expected: fixtureMenus.map(m => `Footer — ${m.label}`).join(','),
      actual: columns
        .map(li => li.querySelector('nav')?.getAttribute('aria-label') ?? 'missing')
        .join(',')
    },
    {
      label: 'every fixture menu item is rendered through the reused MenuLink',
      expected: expectedItems,
      actual: items.length
    },
    {
      label: '  …and it is bfNav’s child, not a copy (.bf-nav__item class)',
      expected: 'true',
      actual: String(items.length > 0 && items.every(el => el.classList.contains('bf-nav__item')))
    },
    {
      label: 'a `strong` item renders its label in <strong>',
      expected: 'Democracy',
      actual: (wide?.querySelector('.bf-footer__items strong')?.textContent ?? 'missing').trim()
    },
    {
      label: 'a menu with `href` renders its heading as <a> and marks it external',
      expected: 'https://www.bfna.org/podcasts/|true',
      actual: (() => {
        const a = columns[3]?.querySelector<HTMLAnchorElement>('.bf-footer__heading a')
        return a ? `${a.getAttribute('href')}|${a.hasAttribute('data-external')}` : 'missing'
      })()
    },
    {
      label: '  …and never as the string "false" (the `|| undefined` guard)',
      expected: 0,
      actual: Array.from(document.querySelectorAll('[data-external]')).filter(
        el => el.getAttribute('data-external') === 'false'
      ).length
    },
    {
      label: 'a menu with `to` renders its heading as a route link',
      expected: '/insights',
      actual:
        columns[1]?.querySelector<HTMLAnchorElement>('.bf-footer__heading a')?.getAttribute('href')
        ?? 'missing'
    },
    {
      label: 'a menu with neither renders plain <strong> text, no anchor',
      expected: 'Programs|0',
      actual: (() => {
        const h = columns[0]?.querySelector('.bf-footer__heading')
        return h ? `${(h.textContent ?? '').trim()}|${h.querySelectorAll('a').length}` : 'missing'
      })()
    },

    // --- 2. the column count is derived, not authored ----------------------
    {
      label: 'the menu row is a .grid carrying data-min-width (issue 04)',
      expected: 's',
      actual: wideGrid?.getAttribute('data-min-width') ?? 'missing'
    },
    {
      label: '  …and data-gap="l"',
      expected: 'l',
      actual: wideGrid?.getAttribute('data-gap') ?? 'missing'
    },
    {
      label: 'the wide container really is 1200px (the claim under test)',
      expected: 1200,
      actual: Math.round(wideWrap?.getBoundingClientRect().width ?? 0)
    },
    {
      label: `4 columns at 1200px — ${wideTracks.tracks} track(s) across ${px(wideTracks.width)} with a ${px(wideTracks.floor)} floor and a ${px(wideTracks.gap)} gap`,
      expected: 4,
      actual: wideTracks.tracks
    },
    {
      label: '  …and the wide count is what auto-fill implies for the measured width',
      expected: 'true',
      actual: String(wideTracks.agrees)
    },
    {
      label: 'the narrow container really is 400px',
      expected: 400,
      actual: Math.round(narrowWrap?.getBoundingClientRect().width ?? 0)
    },
    {
      label: `fewer columns at 400px — ${narrowTracks.tracks} track(s) across ${px(narrowTracks.width)}`,
      expected: 'true',
      actual: String(narrowTracks.tracks > 0 && narrowTracks.tracks < wideTracks.tracks)
    },
    {
      label: '  …and the narrow count is what auto-fill implies for the measured width',
      expected: 'true',
      actual: String(narrowTracks.agrees)
    },
    {
      label: 'the reflow needs no second markup path — both slots render identically',
      expected: 'true',
      actual: String(
        wide !== null
        && narrow !== null
        && wide.querySelectorAll('*').length === narrow.querySelectorAll('*').length
      )
    },
    {
      label: 'no element in the component carries an inline style attribute',
      expected: 0,
      actual: ownElements.filter(el => el.getAttribute('style') !== null).length
    },

    // --- 3. the social strip, verbatim -------------------------------------
    {
      label: 'the social strip lists exactly six profiles',
      expected: expectedSocials.length,
      actual: socialLinks.length
    },
    {
      label: '  …in the frozen order, with the frozen URLs',
      expected: expectedSocials.map(([n, u]) => `${n}=${u}`).join(' '),
      actual: socialLinks
        .map(a => `${(a.textContent ?? '').trim()}=${a.getAttribute('href')}`)
        .join(' ')
    },
    {
      label: '  …every one marked external, and the list labelled for AT',
      expected: '6|Social media',
      actual: `${socialLinks.filter(a => a.hasAttribute('data-external')).length}|${
        wide?.querySelector('.bf-footer__social')?.getAttribute('aria-label') ?? 'missing'
      }`
    },

    // --- 4. the legal row --------------------------------------------------
    {
      label: 'the legal row carries the current year, computed at render',
      expected: 'true',
      actual: String(legalText.includes(`© ${new Date().getFullYear()} `))
    },
    {
      label: '  …plus the privacy link and the ccm.design credit',
      expected: 'true|https://ccm.design',
      actual: `${legalText.includes('Privacy Policy')}|${
        legal?.querySelector<HTMLAnchorElement>('a[href^="https"]')?.getAttribute('href') ?? 'missing'
      }`
    },
    {
      label: 'the Search entry point is a link to /search, not a form',
      expected: '/search',
      actual:
        wide?.querySelector<HTMLAnchorElement>('.bf-footer__brand a')?.getAttribute('href')
        ?? 'missing'
    },

    // --- 5. spacing --------------------------------------------------------
    {
      label: 'menu items sit at line-height spacing (block margins zeroed, layered)',
      expected: '0/0',
      actual: itemMargins
    },
    {
      label: '  …and the rule doing it is inside @layer components, not unlayered',
      expected: 'true',
      actual: String(layeredRule(s => s.includes('.bf-footer__items')) !== null)
    },

    // --- 6. out of scope stayed out ---------------------------------------
    {
      label: 'no search form or input in the footer (search lives in bfNav)',
      expected: 0,
      actual: (wide?.querySelectorAll('form, input').length ?? -1)
    },
    {
      label: 'no subscribe band survived D2',
      expected: 0,
      actual: Array.from(wide?.querySelectorAll('a, button, input, form') ?? []).filter(el =>
        /subscribe|newsletter/i.test(el.textContent ?? '')
      ).length
    },

    // --- 7. the stylesheet contract ---------------------------------------
    {
      label: '.bf-footer rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(layeredRule(s => /\.bf-footer(?![\w-])/.test(s)) !== null)
    },
    {
      label: 'the two named hooks resolve to a real value',
      expected: 'true,true',
      actual: wide
        ? (['--_bf-footer-bg', '--_bf-footer-border'] as const)
            .map(v => String(getComputedStyle(wide).getPropertyValue(v).trim().length > 0))
            .join(',')
        : 'missing'
    },
    {
      label: 'the focus ring is the stack’s bare :focus-visible (@layer defaults, #146)',
      expected: 'true',
      actual: String(focusDefaultRule !== null)
    },
    {
      label: '  …and this file declares no :focus-visible of its own',
      expected: 'true',
      actual: String(
        layeredRule(s => s.includes('.bf-footer') && s.includes(':focus-visible')) === null
      )
    },
    {
      label: '$attrs fallthrough reaches the <footer> (data-probe-case)',
      expected: 'wide',
      actual: wide?.dataset.probeCase ?? 'missing'
    }
  ]

  checks.value = results
}

onMounted(() => {
  /*
   * One frame, so the two fixed-width containers have been laid out before any
   * track count is read. Nothing here focuses or removes an element (gh#39) —
   * this probe declares no key sequence.
   */
  requestAnimationFrame(() => requestAnimationFrame(() => finalise()))
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states, not two. The prerendered HTML has run no assertions, so before
 * the page mounts the honest answer is `pending`; baking `FAIL` into static
 * output for a page that is fine would read as a regression to the next issue
 * that greps the file. The harness treats a probe still PENDING at timeout as a
 * failure, never a skip.
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
  <!--
    Harness contract (docs/decisions/probe-harness.md): the root carries
    `data-probe` + `data-probe-verdict`, and every check row carries
    `data-probe-row` + `data-ok`, so `scripts/check-probes.ts` fails the build
    on a red probe instead of relying on someone opening the page.
  -->
  <main
    class="probe"
    data-probe="36"
    :data-probe-verdict="state.toUpperCase()"
  >
    <div class="probe__body | center">
      <h1>Probe 36 — <code>bfFooter</code></h1>
      <p class="probe__lede">
        The site footer, rendered <strong>entirely</strong> from the
        <code>fixtureMenus</code> array written in this page's own script block.
        That is the issue: the wireframe's <code>wfFooter</code> reaches into
        the wireframe content composable inside itself and cannot be handed
        content; <code>bfFooter</code> takes <code>menus</code> as a prop and
        has no other source of anything (D8).
      </p>
      <p class="probe__lede">
        The second claim is the layout one. The <em>same</em> component appears
        below in a 1200px box and a 400px box — no media query, no second
        markup path, no inline <code>style</code>. The four columns come from
        <code>.grid[data-min-width="s"]</code> (issue 04), so the count is
        derived from the available width rather than authored, and the two rows
        that read it cross-check the measured track count against the
        arithmetic <code>auto-fill</code> performs.
      </p>
    </div>

    <section aria-labelledby="wide-heading">
      <div class="probe__body | center">
        <h2 id="wide-heading">1200px container — four columns</h2>
      </div>
      <!--
        A real fixed-width box, not an emulated viewport: the harness runs at one
        fixed 1280px viewport, so a viewport-based version of this claim could
        only be checked by reading a rule back out of the CSSOM. This one is
        measured.
      -->
      <div class="probe__box probe__box--wide" data-probe-slot="wide">
        <bfFooter :menus="fixtureMenus" data-probe-case="wide" />
      </div>
    </section>

    <section aria-labelledby="narrow-heading">
      <div class="probe__body | center">
        <h2 id="narrow-heading">The same component, 400px container — fewer columns</h2>
      </div>
      <div class="probe__box probe__box--narrow" data-probe-slot="narrow">
        <bfFooter :menus="fixtureMenus" />
      </div>
    </section>

    <div class="probe__body | center">
      <p
        class="probe__verdict"
        :data-state="state"
        data-testid="probe-36-verdict"
      >
        {{ verdict }}
      </p>

      <table class="probe__table" data-testid="probe-36-table">
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
*/

.probe {
  padding-block-end: var(--space-l, 2rem);
  min-block-size: 100dvh;
}

/* The prose column. The footers get their own boxes, so no `center` on them. */
.probe__body {
  padding-block: var(--space-s, 1rem);
}

.probe__lede {
  max-inline-size: 75ch;
}

/*
  The two measurement boxes. Fixed inline sizes, because the width is the input
  to the assertion — `max-inline-size` would let a narrow harness window decide
  the verdict instead of the component.
*/
.probe__box {
  outline: 1px dashed currentcolor;
  outline-offset: 4px;
  margin-inline: var(--space-s, 1rem);
  overflow-x: auto;
}

.probe__box--wide {
  inline-size: 1200px;
}

.probe__box--narrow {
  inline-size: 400px;
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
