<script setup lang="ts">
/**
 * Probe — issue 46 / gh#55: the site shell layout `bf-default`.
 *
 * DELETE-LATER: this route exists only until the first real template lands.
 * Issue **#56** owns the route that supersedes it; the cutover issue (#68)
 * removes `src/pages/bf-probe/` wholesale. Until then it is the only page in the
 * repo that mounts `bf-default`, so it is the only place the shell is exercised
 * at all — leave it in place (BRIEF: "probe pages are kept").
 *
 * ## Why the probe uses the layout instead of describing it
 *
 * Everything worth asserting about a shell is a property of the **document**,
 * not of a component: which element the first Tab reaches, whether there is
 * exactly one `<main>`, whether `noindex` leaked in, what order the browser
 * resolved the cascade layers in. None of those can be measured by rendering the
 * pieces inside `bf-probe`; they need a page that actually mounts the shell. So
 * this probe declares `layout: 'bf-default'` and reads the world around itself.
 *
 * It therefore renders **no `<main>` of its own** and nothing focusable ahead of
 * the layout's skip link — both would falsify the rows below.
 *
 * ## The four residuals folded into gh#55
 *
 * - **#103** — the `@layer` order statement never reached a real route, so
 *   `bf-*` CSS would have lost to unlayered legacy CSS in production. The rows
 *   below read the statement out of the live CSSOM **and** corroborate it
 *   behaviourally.
 * - **#107** — no semantic token named the page ground. `--color-surface-page`
 *   (gh#116) is the counterpart of `--color-surface-inverse`; the shell paints
 *   `html`/`body` from it and the row compares `body`'s resolved background to
 *   the token resolved on a reference element, not to a literal.
 * - **#108** — every earlier probe asserted layer *membership* (`is this rule
 *   inside @layer components?`) and none asserted layer **order**, which is the
 *   property that actually decides who wins. Two rows here close that: the
 *   declared sequence read from `CSSLayerStatementRule.nameList`, and a rule in
 *   `@layer overrides` beating one in `@layer components` that is declared
 *   *later in source order* — which can only happen if the order statement was
 *   honoured.
 * - **#164** — `bfSection` rendered an `<h2>` but wired no accessible name onto
 *   the `<section>`, so its bands were generic containers rather than `region`
 *   landmarks. Two bands below, one named and one not.
 *
 * ## The keyboard rows are driven by real key events
 *
 * `data-probe-keys="Tab,Enter"` (gh#28 harness feature) — the harness dispatches
 * a **trusted** Tab and Enter through the DevTools protocol once the attribute
 * appears, which is after `onMounted` has attached the listeners. Whether the
 * first Tab lands on the skip link is a question about the browser's own
 * sequential navigation, and a programmatic `.focus()` answers an easier one.
 * Opened by hand, the page waits for you to press the two keys.
 */
import { useBfSite } from '~/composables/data/useBfSite'
import { menus as bfMenus } from '~/assets/bf-data/menus'

defineOptions({ name: 'BfProbe46LayoutBfShell' })

definePageMeta({ layout: 'bf-default' })

useHead({
  title: 'bf-probe 46 — bf-default site shell'
})

/**
 * The shell's own data source, read here **only** to derive expectations — the
 * probe asserts that what the layout rendered matches what the composable
 * returns, so it has to hold both. A probe page is not a `bf-*` component and
 * D8 does not reach it (probe 13 sets the precedent).
 */
const { announcement } = await useBfSite()
const banner = announcement()

/**
 * One asserted value: what it is, what it must be, what it actually is.
 *
 * `boolean` is in the union alongside `string | number` because several rows
 * here assert a predicate (`isTrusted`, `contains`) and the comparison is done
 * on `String(actual) === String(expected)` — so a row may honestly report
 * `true` rather than dressing it up as `'true'` at every call site.
 */
interface Check {
  label: string
  expected: string | number | boolean
  actual: string | number | boolean
}

/**
 * The declared cascade order — the same string `layouts/bf-default.vue` emits
 * and the first line of `src/public/css/styles.css`. Repeated here on purpose:
 * an assertion that read the value from the thing it is testing would pass on
 * any value at all.
 */
const LAYER_ORDER = 'reset, defaults, tokens, themes, composition, components, utils, overrides'

const checks = ref<Check[]>([])

/** Every element the browser would put in the sequential tab order, in DOM order. */
const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex^="-"])'

/** Real copy, not lorem (BRIEF §5 rule 10) — the heading of the site's own archive band. */
const BAND_HEADING = 'Explore the archive'

/** Set once the listeners are attached — the handshake the harness polls for. */
const armed = ref(false)

/** What the keyboard actually did. */
const seen = reactive({
  firstFocused: '',
  tabTrusted: false,
  enterTrusted: false,
  activeAfterEnter: '',
  hashAfterEnter: ''
})

/** A short, stable description of an element. */
const describe = (el: Element | null): string => {
  if (!el || el === document.body) return 'body'
  const id = el.id ? `#${el.id}` : ''
  const cls = el.classList.length > 0 ? `.${el.classList[0]}` : ''
  return `${el.tagName.toLowerCase()}${id}${cls}`
}

/**
 * The `@layer` order the document actually declared, as the browser parsed it
 * — residual #108.
 *
 * `CSSLayerStatementRule` is the DOM's own representation of `@layer a, b, c;`,
 * and `nameList` is the ordered sequence. Reading it is a stronger claim than
 * grepping the CSS text: a statement that arrived *after* a layer was already
 * created by a block has no effect on the order, and a statement inside a sheet
 * the browser failed to parse is not here at all.
 *
 * The **first** statement found in document order is the one that establishes
 * the order; later restatements of the same names are idempotent. Sheets are
 * walked in document order and `@import`s depth-first, which is that order.
 */
const declaredLayerOrder = (): string => {
  const STATEMENT = globalThis.CSSLayerStatementRule
  if (!STATEMENT) return 'CSSLayerStatementRule unsupported'

  const walk = (rules: CSSRuleList): string | null => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof STATEMENT) {
        return Array.from((rule as CSSLayerStatementRule).nameList).join(', ')
      }

      if (rule instanceof CSSImportRule) {
        try {
          const imported = rule.styleSheet?.cssRules
          const found = imported ? walk(imported) : null
          if (found) return found
        } catch {
          /* Cross-origin import target — unreadable, not a failure. */
        }
        continue
      }

      const nested = (rule as CSSGroupingRule).cssRules
      const found = nested ? walk(nested) : null
      if (found) return found
    }
    return null
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const found = walk(sheet.cssRules)
      if (found) return found
    } catch {
      /* Cross-origin sheet (Google Fonts) — skipped, not failed. */
    }
  }

  return 'no @layer statement found'
}

let finalised = false

const finalise = () => {
  if (finalised) return
  finalised = true

  const skip = document.querySelector<HTMLAnchorElement>('.bf-skip-link')
  const mains = document.querySelectorAll('main')
  const main = document.querySelector<HTMLElement>('main#main')
  const navBar = document.querySelector<HTMLElement>('.bf-nav__bar')
  const footerMenus = document.querySelectorAll('.bf-footer__menus > li')
  const notices = document.querySelectorAll<HTMLElement>('.bf-notice[data-variant="info"]')
  const noticeLink = notices[0]?.querySelector<HTMLAnchorElement>('a')
  const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')

  /* Reference element painted from the token, so the row compares two resolved
     colours instead of a resolved colour against a literal typed into a file. */
  const groundRef = document.querySelector<HTMLElement>('.probe__ref-ground')

  /* The two cascade probes: same element, two rules, `components` declared
     later in source than `overrides`. See the style block. */
  const cascade = document.querySelector<HTMLElement>('.probe__cascade')

  const named = document.querySelector<HTMLElement>('[data-probe-case="named-band"]')
  const unnamed = document.querySelector<HTMLElement>('[data-probe-case="unnamed-band"]')
  const namedRef = named?.getAttribute('aria-labelledby') ?? ''
  const namedTarget = namedRef ? document.getElementById(namedRef) : null

  checks.value = [
    // --- 1. The skip link, from a real keyboard (spec's headline criterion) ---
    {
      label: 'the first Tab from a fresh document lands on the skip link',
      expected: 'a.bf-skip-link',
      actual: seen.firstFocused || 'nothing focused'
    },
    {
      label: '  …and that Tab was a real, trusted key event',
      expected: true,
      actual: seen.tabTrusted
    },
    {
      label: 'the skip link is the first focusable element in DOM order',
      expected: 'a.bf-skip-link',
      actual: describe(document.querySelector(TABBABLE))
    },
    {
      label: 'Enter on the skip link moves focus to the <main> landmark',
      expected: 'main#main.stack',
      actual: seen.activeAfterEnter || 'nothing focused'
    },
    {
      label: '  …and that Enter was a real, trusted key event',
      expected: true,
      actual: seen.enterTrusted
    },
    {
      label: '  …which is only possible because <main> carries tabindex="-1"',
      expected: '-1',
      actual: main?.getAttribute('tabindex') ?? 'absent'
    },
    {
      label: 'the skip link points at the id the landmark actually has',
      expected: '#main',
      actual: skip?.getAttribute('href') ?? 'missing'
    },

    // --- 2. The landmark itself --------------------------------------------
    {
      label: 'exactly one <main> in the document, and it is #main',
      expected: '1|1',
      actual: `${mains.length}|${document.querySelectorAll('main#main').length}`
    },
    {
      label: 'the landmark carries the shell rhythm (.stack, data-gap="xl")',
      expected: 'true|xl',
      actual: `${main?.classList.contains('stack') ?? false}|${main?.getAttribute('data-gap') ?? 'absent'}`
    },
    {
      label: 'the page content is inside the landmark, not beside it',
      expected: true,
      actual: main?.contains(document.querySelector('[data-probe-verdict]')) ?? false
    },

    // --- 3. Nav and footer, rendered from the real menus module (D8) --------
    {
      label: 'the nav bar renders every top-level menu (+ logo + search)',
      expected: bfMenus.length + 2,
      actual: navBar ? navBar.children.length : 'no nav'
    },
    {
      label: 'the footer renders one column per top-level menu',
      expected: bfMenus.length,
      actual: footerMenus.length
    },
    {
      label: 'both got their menus as props — exactly one nav and one footer',
      expected: '1|1',
      actual: `${document.querySelectorAll('.bf-nav').length}|${document.querySelectorAll('.bf-footer').length}`
    },

    // --- 4. The announcement band, present iff published --------------------
    {
      label: 'the announcement band is present iff useBfSite() returns one',
      expected: banner ? 'present' : 'absent',
      actual: notices.length > 0 ? 'present' : 'absent'
    },
    {
      label: '  …and never more than one of them',
      expected: banner ? 1 : 0,
      actual: notices.length
    },
    {
      label: '  …carrying the announcement message verbatim',
      expected: banner?.message ?? 'no banner',
      actual: banner ? (notices[0]?.textContent ?? '').trim() : 'no banner'
    },
    {
      label: '  …linked to the announcement url',
      expected: banner?.url ?? 'no banner',
      actual: banner ? (noticeLink?.getAttribute('href') ?? 'no link') : 'no banner'
    },
    {
      label: '  …and it sits outside <main>: chrome, not page content',
      expected: banner ? false : 'no banner',
      actual: banner ? (main?.contains(notices[0]!) ?? false) : 'no banner'
    },

    // --- 5. Head: lang yes, noindex no --------------------------------------
    {
      label: 'the document declares a language (WCAG 3.1.1)',
      expected: 'en',
      actual: document.documentElement.lang || 'absent'
    },
    {
      label: 'the production shell does NOT carry the wireframe’s noindex',
      expected: 'absent',
      actual: robots?.content ?? 'absent'
    },
    {
      label: 'the title template names the site once',
      expected: true,
      actual: document.title.endsWith('| Bertelsmann Foundation North America')
    },

    // --- 6. Cascade layers: ORDER, not membership (#103, #108) --------------
    {
      label: 'the @layer order statement reached this route (residual #103)',
      expected: LAYER_ORDER,
      actual: declaredLayerOrder()
    },
    {
      label: 'the CUBE composer is linked exactly once by the shell',
      expected: 1,
      actual: document.querySelectorAll('link[rel="stylesheet"][href="/css/styles.css"]').length
    },
    {
      label: '@layer overrides beats @layer components declared later in source (#108)',
      expected: '3px',
      actual: cascade ? getComputedStyle(cascade).borderBlockStartWidth : 'no element'
    },

    // --- 7. The page ground, from a semantic token (#107) -------------------
    {
      label: 'body is painted from --color-surface-page, not the UA default',
      expected: groundRef ? getComputedStyle(groundRef).backgroundColor : 'no reference',
      actual: getComputedStyle(document.body).backgroundColor
    },
    {
      label: '  …and the shell pins color-scheme so it is light in either host scheme',
      expected: 'light',
      actual: getComputedStyle(document.documentElement).colorScheme
    },

    // --- 8. bfSection exposes an accessible name (#164) ---------------------
    {
      label: 'a bf-section with a heading is a named region; one without is not',
      expected: `${BAND_HEADING}|absent`,
      actual: `${namedTarget?.textContent?.trim() ?? (namedRef ? 'dangling idref' : 'no name')}|${unnamed?.getAttribute('aria-labelledby') ?? 'absent'}`
    }
  ]
}

onMounted(() => {
  /*
   * `focusin` rather than `focus`: it bubbles, so one listener sees whatever the
   * browser's sequential navigation reaches — including the case this probe
   * exists to catch, where it reaches something other than the skip link.
   */
  document.addEventListener('focusin', event => {
    if (seen.firstFocused === '') seen.firstFocused = describe(event.target as Element | null)
  })

  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') seen.tabTrusted ||= event.isTrusted
    if (event.key === 'Enter') seen.enterTrusted ||= event.isTrusted
  })

  document.addEventListener('keyup', event => {
    if (event.key !== 'Enter') return
    /*
     * A beat for the activation to complete: the fragment navigation, the focus
     * move and the hash update all land after the key event returns.
     */
    setTimeout(() => {
      seen.activeAfterEnter = describe(document.activeElement)
      seen.hashAfterEnter = window.location.hash
      finalise()
    }, 120)
  })

  /*
   * Only now — with every listener attached — ask for the keys. Publishing the
   * attribute in the template unconditionally would race them.
   */
  armed.value = true
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states. Before a keyboard arrives the honest answer is `pending`: the
 * prerendered HTML has run nothing, and baking `FAIL` into it would read as a
 * regression to the next issue that greps the file. The harness treats a probe
 * still PENDING at timeout as a failure, never a skip.
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
    Harness contract (docs/decisions/probe-harness.md): this root carries
    `data-probe` + `data-probe-verdict`, and every check row carries
    `data-probe-row` + `data-ok`. It is a `<div>`, not a `<main>` — the shell
    already provides the one landmark this document is allowed.

    Nothing focusable may precede the shell's skip link, so this page adds no
    header, no toolbar and no autofocus.
  -->
  <div
    class="probe"
    data-probe="46"
    :data-probe-verdict="state.toUpperCase()"
    :data-probe-keys="armed ? 'Tab,Enter' : undefined"
  >
    <h1>Probe 46 — <code>bf-default</code> site shell</h1>

    <p class="probe__lede">
      This page mounts the real shell layout. Everything above and below the
      report — the skip link, the nav, the announcement band, the
      <code>&lt;main&gt;</code> this text sits in, the footer — comes from
      <code>src/layouts/bf-default.vue</code>, which is the only data reader in
      the view tree: <code>bfNav</code> and <code>bfFooter</code> receive
      <code>menus</code> as a prop and neither touches a composable.
    </p>
    <p class="probe__lede">
      The keyboard rows are driven by <strong>real key events</strong>. Opened by
      hand this page waits for you to press <kbd>Tab</kbd> and then
      <kbd>Enter</kbd>; under <code>scripts/check-probes.ts</code> the harness
      dispatches both through the DevTools protocol.
    </p>

    <section aria-labelledby="bands-heading">
      <h2 id="bands-heading">Two bands, for the landmark-name rows</h2>
      <p class="probe__lede">
        Residual #164: a <code>&lt;section&gt;</code> is only a
        <code>region</code> landmark once it has an accessible name, so a band
        with a heading now points an <code>aria-labelledby</code> at it and a
        band without one stays deliberately unnamed.
      </p>

      <bfSection
        :heading="BAND_HEADING"
        data-probe-case="named-band"
      >
        <p>
          Everything the foundation has published since 2008, by year — the band
          that carries a heading, and so a name.
        </p>
      </bfSection>

      <bfSection data-probe-case="unnamed-band">
        <p>
          The same band with no <code>heading</code>: no <code>&lt;h2&gt;</code>,
          no idref, and no name — which is correct, not a gap.
        </p>
      </bfSection>
    </section>

    <!--
      Reference elements. Rendered so the browser resolves the tokens and the
      layer rules, but not shown: `getComputedStyle` does not need a visible box.
    -->
    <div class="probe__refs" aria-hidden="true">
      <span class="probe__ref-ground" />
      <span class="probe__cascade" />
    </div>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-46-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-46-table">
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
</template>

<style scoped>
/*
  The ground is the shell's job (residual #107): `bf-default` paints
  `html` / `body` from `--color-surface-page` and `--color-text`. Nothing here
  repaints it — the row that reads `body` would otherwise be testing this file.
*/

.probe {
  padding-block: var(--space-l);
}

.probe__lede {
  max-inline-size: 75ch;
}

/*
  Reference swatches: rendered, not shown.
*/
.probe__refs {
  block-size: 0;
  overflow: hidden;
}

/*
  The #107 reference: the token resolved by the browser, so the body row
  compares two computed colours rather than a computed colour against a literal.
*/
.probe__ref-ground {
  background-color: var(--color-surface-page);
}

/*
  The #108 behavioural corroboration, and the reason the two blocks below are in
  this order.

  `overrides` is declared FIRST in this file and `components` SECOND. Source
  order therefore favours `components`. The only thing that can make the
  `overrides` value win is the declared layer order having been honoured —
  `overrides` is last in `@layer reset, …, overrides;` and so the strongest.

  If the order statement never reached this route (residual #103), the browser
  would instead order the layers by first appearance: `overrides`, then
  `components` — and the 1px value would win. The row reads 3px or it fails.

  A width, not a colour: nothing about this check needs a paint, and BRIEF §5
  rule 2 has one fewer thing to be asked about.
*/
@layer overrides {
  .probe__cascade {
    border-block-start: 3px solid transparent;
  }
}

@layer components {
  .probe__cascade {
    border-block-start: 1px solid transparent;
  }
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
  margin-block-end: var(--space-m);
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
