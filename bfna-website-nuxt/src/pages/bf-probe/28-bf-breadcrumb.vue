<script setup lang="ts">
/**
 * Probe — issue 28 / gh#37: `bfBreadcrumb`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## What it proves
 *
 * 1. **The spec's two named trail lengths** (1 and 4) and **the issue's three**
 *    (2, 3, 4) — the union, so neither statement of the acceptance is taken on
 *    trust from the other.
 * 2. **The last crumb is never a link**, including the case that separates this
 *    component from `wfBreadcrumb`: a trail whose final node *does* carry a
 *    `to`. The wireframe renders that as a link and marks nothing as current.
 * 3. **`aria-current="page"` appears exactly once per trail, on the last
 *    `<li>`** — and a non-final crumb that merely lacks a `to` does *not* get
 *    it, which is the other half of the same distinction.
 * 4. **No separator is a DOM text node.** The whole reason this component
 *    exists: `nav.textContent` is exactly the labels, and contains no solidus.
 * 5. **The separator is nonetheless painted, and is out of the accessibility
 *    tree.** Read from the live CSSOM: `::before` resolves to `none` on the
 *    first `<li>` and to `"/" / ""` on every later one. The alt-text half is
 *    asserted by name — a build that dropped it would paint an identical page
 *    and put a slash back into every screen reader, which is precisely the
 *    defect being fixed and would otherwise be invisible here.
 * 6. **List semantics survive `list-style: none`** — `role="list"` is present
 *    on the `<ol>` (Safari/VoiceOver strips them otherwise).
 * 7. **An empty trail renders no element at all**, not an empty landmark.
 * 8. `.bf-breadcrumb` rules are inside `@layer components` in the live CSSOM,
 *    the component emits no inline `style`, and `$attrs` reaches the `<nav>`.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 28`,
 * per the gh#20–#27 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
import type { Crumb } from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe28BfBreadcrumb' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 28 — bfBreadcrumb'
})

/** One trail: what goes in, and what must come out. */
interface Trail {
  key: string
  /** Passed straight to `bfBreadcrumb`'s `items` prop. */
  items: Crumb[]
  /** Human description, for the gallery. */
  note: string
  /** Expected `<li>` count — 0 means "no element renders at all". */
  count: number
  /** Expected number of `<a href>` crumbs. */
  links: number
}

/*
 * Real BFNA shapes: the three program slugs are the final taxonomy
 * (`democracy`, `transatlantic-relations-global-challenges`,
 * `future-leadership`, BRIEF §8) and the routes are the ones §7 commits to.
 */
const trails: Trail[] = [
  {
    key: 'one',
    items: [{ label: 'Home' }],
    note: 'spec case — a 1-item trail; the only crumb is the current page',
    count: 1,
    links: 0
  },
  {
    key: 'two',
    items: [
      { label: 'Home', to: '/' },
      { label: 'Insights' }
    ],
    note: 'issue case — 2 crumbs',
    count: 2,
    links: 1
  },
  {
    key: 'three',
    items: [
      { label: 'Home', to: '/' },
      { label: 'Democracy', to: '/democracy' },
      { label: 'Rule of Law' }
    ],
    note: 'issue case — 3 crumbs',
    count: 3,
    links: 2
  },
  {
    key: 'four',
    items: [
      { label: 'Home', to: '/' },
      { label: 'Democracy', to: '/democracy' },
      { label: 'Insights', to: '/insights' },
      { label: 'Rule of Law' }
    ],
    note: 'spec + issue case — a 4-item trail',
    count: 4,
    links: 3
  },
  {
    key: 'last-linked',
    items: [
      { label: 'Home', to: '/' },
      { label: 'Insights', to: '/insights' },
      { label: 'Rule of Law', to: '/insights/rule-of-law' }
    ],
    note: 'the last crumb carries a `to` — it must still render as plain text',
    count: 3,
    links: 2
  },
  {
    key: 'middle-unlinked',
    items: [
      { label: 'Home', to: '/' },
      { label: 'Programs' },
      { label: 'Future Leadership' }
    ],
    note: 'a NON-final crumb with no `to` — plain, but NOT aria-current',
    count: 3,
    links: 1
  },
  {
    key: 'object-to',
    items: [
      { label: 'Home', to: { path: '/' } },
      { label: 'Search' }
    ],
    note: '`to` as a route-location object, which the `Crumb` type permits',
    count: 2,
    links: 1
  },
  {
    key: 'empty',
    items: [],
    note: 'no crumbs — renders NOTHING, not an empty landmark',
    count: 0,
    links: 0
  }
]

const renderingTrails = trails.filter(t => t.count > 0)

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

const checks = ref<Check[]>([])

onMounted(() => {
  const gallery = document.querySelector<HTMLElement>('.probe__gallery')

  /** The slot wrapper for a trail — always present, whether or not it rendered. */
  const slot = (key: string) =>
    gallery?.querySelector<HTMLElement>(`[data-probe-slot="${key}"]`) ?? null

  /** The rendered `<nav>` for a trail, or `null` when it correctly rendered nothing. */
  const nav = (key: string) =>
    slot(key)?.querySelector<HTMLElement>('nav.bf-breadcrumb') ?? null

  const items = (key: string) =>
    Array.from(nav(key)?.querySelectorAll<HTMLLIElement>('li.bf-breadcrumb__item') ?? [])

  const navs = renderingTrails
    .map(t => nav(t.key))
    .filter((n): n is HTMLElement => n !== null)

  /**
   * Whitespace-normalised text of a trail. The template indents its `<li>`s, so
   * the raw `textContent` carries the source's newlines; what matters is the
   * sequence of non-space tokens, and above all that no separator glyph is
   * among them.
   */
  const text = (key: string) => (nav(key)?.textContent ?? '').replace(/\s+/g, ' ').trim()

  /**
   * The resolved `content` of a `::before`, whitespace-stripped so the
   * comparison does not depend on how the engine chose to serialise the
   * alt-text separator. `"/" / ""` → `"/"/""`.
   */
  const before = (el: Element | undefined) =>
    el ? getComputedStyle(el, '::before').content.replace(/\s+/g, '') : 'missing'

  /**
   * Walk every reachable stylesheet — `@import`ed ones included, since
   * `/css/styles.css` is nothing but a list of imports — for a `.bf-breadcrumb`
   * style rule whose ancestry includes a `@layer components` block.
   * Cross-origin sheets throw on `cssRules`; they are skipped, not failed, so
   * the Google Fonts link does not sink the check. Matched as a whole class
   * token, so a future `.bf-breadcrumb-x` cannot keep this green after the real
   * rule was renamed away. (Same helper as probes 14–27.)
   */
  const layeredBfBreadcrumbRuleFound = (): boolean => {
    const LAYER_BLOCK = globalThis.CSSLayerBlockRule
    if (!LAYER_BLOCK) return false

    const selector = /\.bf-breadcrumb(?![\w-])/

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

  /** Every `<li>` that is not the first of its trail — the separator's set. */
  const laterItems = renderingTrails.flatMap(t => items(t.key).slice(1))
  const firstItems = renderingTrails
    .map(t => items(t.key)[0])
    .filter((el): el is HTMLLIElement => el !== undefined)

  /** Every linked crumb on the page — the focus rows' subject. */
  const allLinks = Array.from(
    gallery?.querySelectorAll<HTMLAnchorElement>('a.bf-breadcrumb__link') ?? []
  )

  /**
   * The `.bf-breadcrumb__link:focus-visible` rule as declared, found inside a
   * `@layer components` block. Same stylesheet walk as
   * `layeredBfBreadcrumbRuleFound`, returning the rule rather than a boolean so
   * the rows below can read what it actually declares.
   */
  const focusRule = (): CSSStyleRule | null => {
    const LAYER_BLOCK = globalThis.CSSLayerBlockRule
    if (!LAYER_BLOCK) return null

    const walk = (rules: CSSRuleList, insideComponents: boolean): CSSStyleRule | null => {
      for (const rule of Array.from(rules)) {
        const nowInside =
          insideComponents
          || (rule instanceof LAYER_BLOCK && (rule as CSSLayerBlockRule).name === 'components')

        if (
          nowInside
          && rule instanceof CSSStyleRule
          && rule.selectorText.includes('.bf-breadcrumb__link')
          && rule.selectorText.includes(':focus-visible')
        ) {
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

  const results: Check[] = [
    // --- 1. the landmark ----------------------------------------------------
    {
      label: `${renderingTrails.length} non-empty trails render a <nav>`,
      expected: renderingTrails.length,
      actual: navs.length
    },
    {
      label: 'every rendered root is a <nav>, and names itself "Breadcrumb"',
      expected: renderingTrails.length,
      actual: navs.filter(n => n.tagName === 'NAV' && n.getAttribute('aria-label') === 'Breadcrumb').length
    },
    {
      label: 'each <nav> wraps exactly one <ol>',
      expected: renderingTrails.length,
      actual: navs.filter(n => n.querySelectorAll('ol').length === 1).length
    },
    {
      label: 'each <ol> carries role="list" (Safari drops list semantics without it)',
      expected: renderingTrails.length,
      actual: navs.filter(n => n.querySelector('ol')?.getAttribute('role') === 'list').length
    },
    {
      label: 'the gallery renders no <nav> beyond the trails enumerated here',
      expected: renderingTrails.length,
      actual: gallery?.querySelectorAll('nav.bf-breadcrumb').length ?? -1
    },

    // --- 2. per-trail: crumb count, spec + issue cases ----------------------
    ...trails.map(t => ({
      label: `trail ${t.key} (${t.items.length} crumbs) → ${t.count} <li>`,
      expected: t.count,
      actual: slot(t.key)?.querySelectorAll('li.bf-breadcrumb__item').length ?? -1
    })),

    // --- 3. the empty trail renders nothing at all -------------------------
    {
      label: 'an empty trail renders no element whatsoever (not an empty <nav>)',
      expected: 0,
      actual: slot('empty')?.querySelectorAll('*').length ?? -1
    },

    // --- 4. per-trail: how many crumbs are links ---------------------------
    ...trails.map(t => ({
      label: `  …trail ${t.key} link count`,
      expected: t.links,
      actual: slot(t.key)?.querySelectorAll('li.bf-breadcrumb__item a[href]').length ?? -1
    })),

    // --- 5. the last crumb is never a link ---------------------------------
    ...renderingTrails.map(t => ({
      label: `  …trail ${t.key}: last crumb is a <span>, not a link`,
      expected: 'SPAN',
      actual: items(t.key).at(-1)?.firstElementChild?.tagName ?? 'missing'
    })),
    {
      label: 'the last-linked trail: a final crumb WITH a `to` still renders no <a>',
      expected: 0,
      actual: items('last-linked').at(-1)?.querySelectorAll('a').length ?? -1
    },
    {
      label: '  …and its earlier crumbs are still links',
      expected: 2,
      actual: slot('last-linked')?.querySelectorAll('a[href]').length ?? -1
    },

    // --- 6. aria-current: exactly one per trail, on the last item ----------
    ...renderingTrails.map(t => ({
      label: `  …trail ${t.key}: exactly one aria-current="page"`,
      expected: 1,
      actual: slot(t.key)?.querySelectorAll('[aria-current="page"]').length ?? -1
    })),
    ...renderingTrails.map(t => ({
      label: `  …trail ${t.key}: it is inside the LAST <li>`,
      expected: 'true',
      actual: String(
        items(t.key).at(-1)?.querySelector('[aria-current="page"]') !== null
        && items(t.key).at(-1)?.querySelector('[aria-current="page"]') !== undefined
      )
    })),
    {
      label: 'a non-final crumb without a `to` is plain — and NOT aria-current',
      expected: 'SPAN|null',
      actual: (() => {
        const middle = items('middle-unlinked')[1]?.firstElementChild
        return `${middle?.tagName ?? 'missing'}|${middle?.getAttribute('aria-current') ?? 'null'}`
      })()
    },
    {
      label: 'no aria-current="false" is rendered anywhere (the attribute is omitted)',
      expected: 0,
      actual: gallery?.querySelectorAll('[aria-current="false"]').length ?? -1
    },

    // --- 7. `to` as a route-location object --------------------------------
    {
      label: 'an object `to` still resolves to a real href',
      expected: '/',
      actual: items('object-to')[0]?.querySelector('a')?.getAttribute('href') ?? 'missing'
    },

    // --- 8. THE POINT: no separator is a DOM text node ---------------------
    /*
     * Compared per crumb rather than as one concatenated string: Vue's default
     * whitespace handling is `condense`, which drops the whitespace-only text
     * nodes between sibling `<li>`s, so the raw `textContent` of a correct
     * trail has no spaces between labels and an expectation built by joining on
     * a space would fail on a component that is fine.
     */
    ...renderingTrails.map(t => ({
      label: `  …trail ${t.key}: the crumbs are exactly the labels, nothing between`,
      expected: t.items.map(c => c.label).join('|'),
      actual: items(t.key)
        .map(li => (li.textContent ?? '').trim())
        .join('|')
    })),
    {
      label: 'no rendered trail contains a solidus in its text (wfBreadcrumb’s defect)',
      expected: 0,
      actual: renderingTrails.filter(t => text(t.key).includes('/')).length
    },
    {
      label: 'every crumb is exactly one element — an <a> or a <span>, nothing else',
      expected: renderingTrails.reduce((n, t) => n + t.items.length, 0),
      actual: renderingTrails.reduce(
        (n, t) =>
          n
          + items(t.key).filter(
            li => li.children.length === 1 && ['A', 'SPAN'].includes(li.children[0]!.tagName)
          ).length,
        0
      )
    },

    // --- 9. …and yet the separator IS painted, from CSS --------------------
    {
      label: 'the first <li> of every trail paints no ::before',
      expected: firstItems.length,
      actual: firstItems.filter(el => before(el) === 'none').length
    },
    {
      label: `every later <li> (${laterItems.length}) paints one`,
      expected: laterItems.length,
      actual: laterItems.filter(el => before(el) !== 'none' && before(el) !== 'normal').length
    },
    {
      label: '  …and it carries EMPTY alt text, so it is out of the accessible name',
      expected: laterItems.length,
      actual: laterItems.filter(el => before(el) === '"/"/""').length
    },
    {
      label: '  …resolved value of the second crumb’s separator',
      expected: '"/"/""',
      actual: before(items('four')[1])
    },
    {
      label: 'the separator colour resolves from the token, not from nothing',
      expected: 'true',
      actual: String(
        (() => {
          const c = items('four')[1]
          if (!c) return false
          const v = getComputedStyle(c, '::before').color
          return v !== '' && v !== 'rgba(0, 0, 0, 0)'
        })()
      )
    },

    // --- 10. cascade layer, inline style, $attrs ---------------------------
    {
      label: '.bf-breadcrumb rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(layeredBfBreadcrumbRuleFound())
    },
    {
      label: 'the component contributes no inline style of its own',
      expected: 0,
      actual: navs.filter(n => n.getAttribute('style') !== null).length
    },
    {
      label: '$attrs fallthrough reaches the <nav> (data-probe-trail)',
      expected: renderingTrails.map(t => t.key).join(','),
      actual: navs.map(n => n.dataset.probeTrail ?? '').join(',')
    },
    {
      label: 'the list is laid out as a wrapping row, not a bulleted column',
      expected: 'flex|none',
      actual: (() => {
        const ol = navs[0]?.querySelector('ol')
        if (!ol) return 'missing'
        const s = getComputedStyle(ol)
        return `${s.display}|${s.listStyleType}`
      })()
    },

    // --- 11. focus (review finding P2-1) -----------------------------------
    /*
     * Added by the gh#37 review. The CUBE stack declares no `a:focus-visible`
     * rule anywhere — `base/forms.css` covers inputs, textareas and selects and
     * nothing else styles a focused link — so before the fix the only ring on a
     * crumb was the UA default. These rows are what stops that regressing.
     */
    {
      label: 'every crumb link is keyboard-focusable',
      expected: allLinks.length,
      actual: allLinks.filter(a => {
        a.focus()
        return document.activeElement === a
      }).length
    },
    /*
     * The ring is asserted from the **declared rule**, not by focusing a link
     * and reading its computed style. That was the first attempt and it is not
     * a sound check: `:focus-visible` is a heuristic about the *last input
     * modality*, so a programmatic `.focus()` matches it in a document that has
     * seen no pointer interaction and does not match it in one that has. It
     * therefore passed under the headless harness and failed in a browser pane
     * on identical, correct code — the worst kind of check, since it teaches
     * the next reader to distrust a green run.
     *
     * Forcing a trusted Tab is the sound alternative and the harness supports
     * it (`data-probe-keys`, probe-harness.md Decision 4), but it makes the
     * whole page's verdict wait on a keypress, and probe 28's other 69 rows are
     * static-DOM questions that have no business being gated on one. Probe 19
     * remains the epic's keyboard probe; this one asserts that the rule the
     * review added exists, is in the right layer, and declares both rings.
     */
    {
      label: 'a .bf-breadcrumb__link:focus-visible rule exists in @layer components',
      expected: 'true',
      actual: String(focusRule() !== null)
    },
    {
      label: '  …and it declares BOTH an outline and the --outline-focus halo',
      expected: 'outline+halo',
      actual: (() => {
        const r = focusRule()
        if (!r) return 'no rule'
        const hasOutline = r.style.outline !== '' || r.style.outlineWidth !== ''
        const hasHalo = r.style.boxShadow !== ''
        return `${hasOutline ? 'outline' : '-'}+${hasHalo ? 'halo' : '-'}`
      })()
    },
    {
      /*
       * `--color-text`, not `currentcolor` — the gh#24-P2-1 finding. The ring is
       * drawn outside the link on the page ground, so a ring in the link's own
       * colour can paint light-on-light (WCAG 1.4.11).
       */
      label: '  …in --_bf-breadcrumb-focus-color, never currentcolor (gh#24-P2-1)',
      expected: 'true',
      actual: (() => {
        const r = focusRule()
        if (!r) return 'no rule'
        const decl = `${r.style.outline} ${r.style.outlineColor}`
        return String(
          decl.includes('--_bf-breadcrumb-focus-color') && !decl.includes('currentcolor')
        )
      })()
    },
    {
      label: '  …and that hook resolves to the root colour (--color-text)',
      expected: getComputedStyle(document.documentElement).color,
      actual: (() => {
        const a = allLinks[0]
        if (!a) return 'missing'
        /*
         * Resolved through a throwaway element that *does* paint the hook, so
         * the value is read as a real colour rather than as the unresolved
         * `var()` chain `getPropertyValue` would hand back.
         */
        const probe = document.createElement('span')
        probe.style.color = 'var(--_bf-breadcrumb-focus-color)'
        a.append(probe)
        const resolved = getComputedStyle(probe).color
        probe.remove()
        return resolved
      })()
    },
    {
      label: 'the current (last) crumb is NOT focusable — it is not a control',
      expected: 0,
      actual: renderingTrails.filter(t => {
        const last = items(t.key).at(-1)?.firstElementChild as HTMLElement | undefined
        if (!last) return false
        last.focus?.()
        return document.activeElement === last
      }).length
    },

    // --- 12. presentational-only -------------------------------------------
    {
      label: 'no crumb label was invented by the component (labels round-trip)',
      expected: renderingTrails.reduce((n, t) => n + t.items.length, 0),
      actual: renderingTrails.reduce(
        (n, t) =>
          n
          + items(t.key).filter(
            (li, i) => (li.textContent ?? '').trim() === t.items[i]?.label
          ).length,
        0
      )
    }
  ]

  checks.value = results
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states, not two. The assertions run in `onMounted`, so during prerender
 * `checks` is empty — and a two-state verdict would bake `data-state="fail"`
 * into the static HTML for a component that is fine. `pending` says what is
 * actually true of the prerendered page: nothing has run yet. The harness
 * treats a probe still PENDING at timeout as a failure, never a skip.
 */
const state = computed<'pending' | 'pass' | 'fail'>(() => {
  if (checks.value.length === 0) return 'pending'
  return passed.value === checks.value.length ? 'pass' : 'fail'
})

const verdict = computed(() =>
  state.value === 'pending'
    ? 'PENDING — assertions run on mount; open this page in a browser'
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
    class="probe container"
    data-probe="28"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 28 — <code>bfBreadcrumb</code></h1>
    <p class="probe__lede">
      A breadcrumb trail as a real landmark wrapping a real list. The separator
      is drawn by CSS with <strong>empty alternative text</strong>, so it is
      painted for the eye and absent from the accessibility tree — where
      <code>wfBreadcrumb</code> puts a literal <code>&lt;span&gt; / &lt;/span&gt;</code>
      between every pair of crumbs and a screen reader reads it aloud.
    </p>
    <p class="probe__lede">
      The last crumb is <em>never</em> a link — it is the page you are already
      on — and it carries <code>aria-current="page"</code> whether or not the
      caller gave it a <code>to</code>. A non-final crumb that merely lacks a
      <code>to</code> is plain text with no <code>aria-current</code>: a trail
      has one current page, not several.
    </p>

    <section class="probe__gallery" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading">Eight trails</h2>

      <table class="probe__table">
        <thead>
          <tr>
            <th scope="col">Trail</th>
            <th scope="col">Case</th>
            <th scope="col">Rendered</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in trails" :key="t.key">
            <td><code>{{ t.key }}</code></td>
            <td class="probe__note">{{ t.note }}</td>
            <!--
              The slot wrapper is always in the DOM, whether or not the
              component rendered anything into it. That is what lets the
              "renders NOTHING" row count elements rather than infer an
              absence — a `v-if`'s comment-node placeholder satisfies no
              selector, so a missing wrapper and an empty one would otherwise
              be indistinguishable.
            -->
            <td class="probe__slot" :data-probe-slot="t.key">
              <bfBreadcrumb :items="t.items" :data-probe-trail="t.key" />
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-28-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-28-table">
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
  max-inline-size: 44ch;
}

/*
  A visible frame around the render slot, so the empty one reads as
  *deliberately empty* to a human scanning the page rather than as a broken row.
*/
.probe__slot {
  outline: 1px dashed currentcolor;
  outline-offset: 2px;
  min-inline-size: 12ch;
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
