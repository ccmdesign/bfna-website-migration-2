<script setup lang="ts">
/**
 * Probe — issue 33 / gh#42: `bfEmptyState` (and `bfNotFound`, its alias).
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## Why this probe mounts ONE instance at a time
 *
 * `bfEmptyState` renders an `<h1>`, and that is its defining property: it is
 * what a page shows *instead of* its content, so it is the page's heading.
 * A probe that rendered eight of them side by side would put eight `<h1>`s on
 * one page — breaking BRIEF §5 rule 9, the very rule this component exists to
 * satisfy by construction — and would make the spec's own static check
 *
 * ```bash
 * [ "$(grep -c '<h1' .output/public/bf-probe/33-bf-empty-state/index.html)" = "1" ]
 * ```
 *
 * false about a component that is correct.
 *
 * So the eight cases below are **states of one mount point**, cycled by
 * `finalise()` with the live DOM read at each step. The page therefore holds
 * exactly one `bfEmptyState`, and so exactly one `<h1>`, at every instant —
 * asserted after every switch, not assumed — and the prerendered HTML holds
 * the `heading` case alone, which is what makes the spec's check pass as
 * written. The probe's own title is an `<h2>` **below** the demo for the same
 * reason: the spec asks for the component "as the sole content on the page",
 * so the page's `h1` is the component's.
 *
 * Cycling is strictly stronger than the grep it satisfies. A static count says
 * nothing about *which* element the `h1` is, what it contains, or whether the
 * seventh configuration also renders exactly one.
 *
 * ## What it proves
 *
 *  1. **Exactly one `<h1>` in the document, in every configuration** — and it
 *     is the component's own, inside `.bf-empty-state`, carrying the `heading`
 *     prop verbatim.
 *  2. **`message` renders when given and is absent when not** — no empty `<p>`.
 *  3. **The back link renders only when BOTH `backTo` and `backLabel` are
 *     given.** The two half-supplied cases (`to-only`, `label-only`) are the
 *     load-bearing ones: each would otherwise produce an anchor with no
 *     accessible name or a label that goes nowhere (#130's failure, smaller).
 *  4. **The back link is a plain `<a href>`**, not a `.bf-button` — the wf
 *     source's own shape, recorded in the spec's Decisions.
 *  5. **The default slot renders, and renders last** — after the heading, the
 *     message and the way out, which is the order a reader needs them in.
 *  6. **Layout comes from the composition layer, not from this component.**
 *     The root's class list is the wireframe's own `center | stack`; the
 *     computed box is a column with a measure; and `.bf-empty-state`'s own
 *     rule declares nothing layout-shaped at all — no `display`, no `flex`,
 *     no `margin`, no `max-inline-size`, no `text-align`.
 *  7. **The padding is `--space-xl`**, measured against a reference element
 *     rather than string-compared against an unresolved `clamp()`, and the
 *     `--_bf-empty-state-padding-block` hook really overrides it.
 *  8. **`bfNotFound` IS `bfEmptyState`** — same root, same class, same
 *     resolved padding, one implementation under two auto-import names.
 *  9. `.bf-empty-state` rules are inside `@layer components` in the live
 *     CSSOM, the component emits no inline `style` of its own, `$attrs`
 *     reaches the root and merges with its class, and no `bf-*` rule on the
 *     page uses `:not()` with a complex selector (D-20.5).
 *
 * Opened by hand, the radio group switches the mount point between the same
 * eight cases the assertions walked.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 33`,
 * per the gh#20–#41 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
defineOptions({ name: 'BfProbe33BfEmptyState' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 33 — bfEmptyState / bfNotFound'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/** One configuration of the single mount point. */
interface Case {
  key: string
  /** Which auto-import name renders it — the alias case uses `bfNotFound`. */
  as: 'bfEmptyState' | 'bfNotFound'
  note: string
  heading: string
  message?: string
  backLabel?: string
  backTo?: string
  /** Fill the default slot. */
  slot?: boolean
  /** A caller-supplied inline style, for the padding-hook case only. */
  style?: Record<string, string>
}

/*
 * The three headings the wireframe block actually carries are used verbatim
 * (`[area].vue`, `insights/[slug].vue`, `projects/[slug].vue`) — BRIEF §5
 * rule 10, real content rather than lorem.
 */
const CASES: Case[] = [
  {
    key: 'heading',
    as: 'bfEmptyState',
    note: 'heading only — the minimum the component accepts',
    heading: 'Unknown program'
  },
  {
    key: 'message',
    as: 'bfEmptyState',
    note: 'heading + message, no way back',
    heading: 'Insight not found in content.json',
    message: 'It may have been archived, or the slug in the address may be wrong.'
  },
  {
    key: 'link',
    as: 'bfEmptyState',
    note: 'heading + back link — the wireframe block, exactly',
    heading: 'Unknown project',
    backLabel: 'All projects',
    backTo: '/wireframes/projects'
  },
  {
    key: 'to-only',
    as: 'bfEmptyState',
    note: 'backTo without backLabel — must render NO link (no accessible name)',
    heading: 'Unknown program',
    backTo: '/wireframes'
  },
  {
    key: 'label-only',
    as: 'bfEmptyState',
    note: 'backLabel without backTo — must render NO link (nowhere to go)',
    heading: 'Unknown program',
    backLabel: 'Back to wireframe home'
  },
  {
    key: 'slot',
    as: 'bfEmptyState',
    note: 'everything, plus default-slot content — which must come last',
    heading: 'Nothing published here yet',
    message: 'This program has no insights in the current release.',
    backLabel: 'Back to wireframe home',
    backTo: '/wireframes',
    slot: true
  },
  {
    key: 'alias',
    as: 'bfNotFound',
    note: 'the same component under its second name',
    heading: 'Page not found',
    message: 'The page you asked for does not exist.',
    backLabel: 'Back to wireframe home',
    backTo: '/wireframes'
  },
  {
    key: 'padded',
    as: 'bfEmptyState',
    note: 'the --_bf-empty-state-padding-block hook, overridden by the caller',
    heading: 'Padding hook',
    style: { '--_bf-empty-state-padding-block': '0px' }
  }
]

const byKey = (key: string): Case =>
  CASES.find(c => c.key === key) ?? (CASES[0] as Case)

/** Which case is mounted right now. The prerendered page holds this one. */
const form = ref<string>('heading')

const current = computed<Case>(() => byKey(form.value))

/** What the DOM looked like while one case was mounted. */
interface Snapshot {
  key: string
  /** `document.querySelectorAll('h1').length` — must be 1, always. */
  h1Count: number
  /** Is the one `h1` inside the component's root? */
  h1Owned: boolean
  h1Text: string
  hasMessage: boolean
  messageText: string
  hasLink: boolean
  linkTag: string
  linkText: string
  linkHref: string
  linkIsButton: boolean
  hasSlotContent: boolean
  /** Element tag/marker sequence of the root's children, in DOM order. */
  order: string
  rootClasses: string
  gap: string
  display: string
  flexDirection: string
  measured: boolean
  paddingBlockStart: string
  /** Does the ROOT carry an inline style **declaration** (not just the attribute)? */
  inlineStyle: boolean
  attrsCase: string
  attrsClassMerged: boolean
}

const snaps = reactive<Snapshot[]>([])

const checks = ref<Check[]>([])

/**
 * Walk every reachable stylesheet — `@import`ed ones included, since
 * `/css/styles.css` is nothing but a list of imports — for a style rule whose
 * selector matches and whose ancestry includes a `@layer components` block.
 * Cross-origin sheets throw on `cssRules`; they are skipped, not failed. Same
 * helper as probes 14–32.
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

/**
 * Every `.bf-*` selector on the page that uses `:not()` with anything but a
 * simple selector list (D-20.5). `postcss-preset-env` mis-lowers those and
 * silently breaks the rule, so the ban is checked against the **emitted** CSS
 * rather than against the source it was written in.
 */
const complexNotSelectors = (): string[] => {
  const found: string[] = []

  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes('.bf-')) {
        for (const m of rule.selectorText.matchAll(/:not\(([^()]*)\)/g)) {
          const inner = (m[1] ?? '').trim()
          if (/[\s>+~]/.test(inner)) found.push(rule.selectorText)
        }
      }

      if (rule instanceof CSSImportRule) {
        try {
          if (rule.styleSheet) walk(rule.styleSheet.cssRules)
        } catch {
          // Cross-origin import target.
        }
        continue
      }

      const nested = (rule as CSSGroupingRule).cssRules
      if (nested) walk(nested)
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules)
    } catch {
      // Cross-origin sheet.
    }
  }
  return found
}

/** A short, stable description of an element, for the DOM-order row. */
const describe = (el: Element): string => {
  const tag = el.tagName.toLowerCase()
  if (el.hasAttribute('data-probe-slot-content')) return `${tag}[slot]`
  const cls = Array.from(el.classList).find(c => c.startsWith('bf-empty-state__'))
  return cls ? `${tag}.${cls.replace('bf-empty-state__', '')}` : tag
}

/**
 * One tick — a re-render, and nothing else to wait for.
 *
 * Deliberately **not** `requestAnimationFrame`. rAF is throttled — sometimes
 * to a near stop — in a backgrounded or embedded browser view, and a walk that
 * awaits a frame which never arrives leaves the verdict `PENDING` for ever;
 * the harness then reports a timeout, which is a true statement about the page
 * and a false one about the component. (Found by driving this page in an
 * embedded pane during gh#42 — the same class of defect
 * `docs/decisions/probe-harness.md` records for zero-width viewports.)
 *
 * No frame is needed anyway: `getComputedStyle` forces style recalculation on
 * demand, so every measurement below is correct as soon as Vue has patched the
 * DOM. The whole walk therefore completes within microtasks, in any context.
 */
const settle = (): Promise<void> => nextTick()

const snapshot = (c: Case): Snapshot => {
  const root = document.querySelector<HTMLElement>('.bf-empty-state')
  const h1s = document.querySelectorAll('h1')
  const h1 = h1s[0] ?? null
  const message = root?.querySelector<HTMLElement>('.bf-empty-state__message') ?? null
  const back = root?.querySelector<HTMLAnchorElement>('.bf-empty-state__back a') ?? null
  const slotContent = root?.querySelector('[data-probe-slot-content]') ?? null
  const style = root ? getComputedStyle(root) : null

  return {
    key: c.key,
    h1Count: h1s.length,
    h1Owned: h1 !== null && root !== null && root.contains(h1),
    h1Text: (h1?.textContent ?? '').trim(),
    hasMessage: message !== null,
    messageText: (message?.textContent ?? '').trim(),
    hasLink: back !== null,
    linkTag: back?.tagName ?? '',
    linkText: (back?.textContent ?? '').trim(),
    /*
     * `getAttribute`, not `.href`: the property resolves to an absolute URL
     * against the probe's own origin, and the assertion is about the value
     * `NuxtLink` wrote from `backTo`.
     */
    linkHref: back?.getAttribute('href') ?? '',
    linkIsButton: back?.classList.contains('bf-button') ?? false,
    hasSlotContent: slotContent !== null,
    order: root ? Array.from(root.children).map(describe).join(' > ') : 'no root',
    rootClasses: root ? Array.from(root.classList).sort().join(' ') : 'no root',
    gap: root?.getAttribute('data-gap') ?? '',
    display: style?.display ?? '',
    flexDirection: style?.flexDirection ?? '',
    /* `.center` writes a `max-inline-size`; a bare block box reports `none`. */
    measured: style !== null && style.maxInlineSize !== 'none',
    paddingBlockStart: style?.paddingBlockStart ?? '',
    /*
     * Read as a *declaration*, not as the presence of the attribute. Vue's SSR
     * serializer emits a bare `style=""` for a `:style` binding whose value is
     * `undefined` — which this probe supplies on seven of its eight cases — and
     * hydration keeps the empty attribute. An attribute that declares nothing
     * is not an inline style, and asserting on `getAttribute('style') !== null`
     * would fail a component that wrote none because the *probe* bound one.
     */
    inlineStyle: root !== null && root.style.cssText.trim() !== '',
    attrsCase: root?.dataset.probeCase ?? '',
    attrsClassMerged:
      (root?.classList.contains('bf-empty-state') ?? false)
      && (root?.classList.contains('probe__marker') ?? false)
  }
}

const snapFor = (key: string): Snapshot | undefined => snaps.find(s => s.key === key)

/** A row's value for every case, in `CASES` order — one string to compare. */
const across = (read: (s: Snapshot) => string | number | boolean): string =>
  CASES.map(c => {
    const s = snapFor(c.key)
    return s === undefined ? '?' : String(read(s))
  }).join(',')

/** The same shape, built from the expectations rather than from the DOM. */
const expectAcross = (read: (c: Case) => string | number | boolean): string =>
  CASES.map(c => String(read(c))).join(',')

/** Has the case walk been started? */
let walking = false
/** Have the rows been published? Either path may do it, whichever gets there. */
let reported = false

/**
 * Set when the safety net published the rows instead of the walk — a real
 * failure, and one that must be *visible*. A probe that simply stayed
 * `PENDING` would be reported by the harness as a timeout with no rows at all,
 * which says nothing about which step wedged.
 */
const seen = reactive({ timedOut: false })

const finalise = async () => {
  if (walking) return
  walking = true

  // --- walk every case, reading the live DOM at each ------------------------
  for (const c of CASES) {
    form.value = c.key
    await settle()
    snaps.push(snapshot(c))
  }

  /*
   * Leave the page on the richest case for a human reader. The radio group
   * below moves it anywhere; every assertion has already been captured.
   */
  form.value = 'slot'
  await settle()

  report()
}

/**
 * Turn the snapshots into rows. Called by the walk when it finishes, and by
 * the safety net if the walk has not — so a wedged walk fails loudly, naming
 * the step it reached, rather than timing out silently.
 */
const report = () => {
  if (reported) return
  reported = true

  // --- the reference lengths ------------------------------------------------
  const ref = document.querySelector<HTMLElement>('[data-probe-ref]')
  const expectedPadding = ref ? getComputedStyle(ref).paddingBlockStart : 'no reference'

  // --- the component's own rule --------------------------------------------
  const rule = layeredRule(s => /\.bf-empty-state(?![\w-])/.test(s))
  const ruleText = rule?.style.cssText ?? ''
  const hookValue = rule?.style.getPropertyValue('--_bf-empty-state-padding-block').trim() ?? ''
  /*
   * The properties a component that re-implemented the composition layer would
   * have had to declare. Read off the rule's own `cssText`, so the check is on
   * the emitted CSS rather than on the source it was written in.
   */
  const LAYOUT_PROPERTIES = [
    'display', 'flex', 'grid', 'margin', 'max-inline-size', 'max-width',
    'inline-size', 'width', 'text-align', 'align-items', 'justify-content', 'gap'
  ]
  const bespoke = LAYOUT_PROPERTIES.filter(p => new RegExp(`(^|[;\\s])${p}`).test(ruleText))

  const badNots = complexNotSelectors()

    /*
   * The heading element of one mounted instance, by selector — `'none'` rather
   * than `''` when the instance or its heading is missing, so a broken row
   * reads as a fact rather than as an empty cell.
   */
  const headingTagOf = (selector: string): string =>
    document.querySelector(selector)?.querySelector('.bf-empty-state__heading')?.tagName ?? 'none'

  const link = snapFor('link')
  const slot = snapFor('slot')
  const alias = snapFor('alias')
  const padded = snapFor('padded')

  checks.value = [
    // --- 0. did the walk actually run? -------------------------------------
    {
      label: 'the case walk completed, rather than being rescued by the timeout',
      expected: 'false',
      actual: String(seen.timedOut)
    },
    {
      label: '  …visiting every case',
      expected: CASES.length,
      actual: snaps.length
    },

    // --- 1. exactly one h1, always -----------------------------------------
    {
      label: 'exactly one <h1> in the document, in EVERY configuration',
      expected: CASES.map(() => 1).join(','),
      actual: across(s => s.h1Count)
    },
    {
      label: '  …and it is the component’s own, inside .bf-empty-state',
      expected: CASES.map(() => true).join(','),
      actual: across(s => s.h1Owned)
    },
    {
      label: 'the <h1> carries the `heading` prop verbatim',
      expected: expectAcross(c => c.heading),
      actual: across(s => s.h1Text)
    },

    // --- 2. the message ----------------------------------------------------
    {
      label: '`message` renders when given, and no empty <p> when not',
      expected: expectAcross(c => c.message !== undefined),
      actual: across(s => s.hasMessage)
    },
    {
      label: '  …with the text it was handed',
      expected: expectAcross(c => c.message ?? ''),
      actual: across(s => s.messageText)
    },

    // --- 3. the back link: both props, or nothing --------------------------
    {
      label: 'the back link renders ONLY when both backTo and backLabel are given',
      expected: expectAcross(c => c.backTo !== undefined && c.backLabel !== undefined),
      actual: across(s => s.hasLink)
    },
    {
      label: '  …so backTo alone renders no anchor (it would have no accessible name)',
      expected: 'false',
      actual: String(snapFor('to-only')?.hasLink ?? 'missing')
    },
    {
      label: '  …and backLabel alone renders no anchor (it would go nowhere)',
      expected: 'false',
      actual: String(snapFor('label-only')?.hasLink ?? 'missing')
    },
    {
      label: 'the link is a plain <a href="…"> carrying backTo and backLabel',
      expected: 'A|/wireframes/projects|All projects',
      actual: link ? [link.linkTag, link.linkHref, link.linkText].join('|') : 'missing'
    },
    {
      label: '  …and NOT a .bf-button — wf-source parity (see Decisions)',
      expected: 'false',
      actual: String(link?.linkIsButton ?? 'missing')
    },

    // --- 4. the slot, and where it lands -----------------------------------
    {
      label: 'the default slot renders its content',
      expected: expectAcross(c => c.slot === true),
      actual: across(s => s.hasSlotContent)
    },
    {
      label: 'DOM order is heading -> message -> back link -> slot',
      expected: 'h1.heading > p.message > p.back > p[slot]',
      actual: slot?.order ?? 'missing'
    },
    {
      label: 'the heading-only case renders the h1 and nothing else',
      expected: 'h1.heading',
      actual: snapFor('heading')?.order ?? 'missing'
    },

    // --- 5. layout is the composition layer’s ------------------------------
    {
      label: 'the root keeps the wireframe’s own class list (center | stack)',
      /*
       * `|` is a real class token, not punctuation: the wireframe writes
       * `class="center | stack"`, so `classList` holds three entries and the
       * pipe is one of them. Sorted in code rather than typed out, because
       * `'|'` (U+007C) sorts *after* every lowercase letter and a hand-written
       * expectation would get that wrong.
       */
      expected: ['bf-empty-state', 'center', 'probe__marker', 'stack', '|'].sort().join(' '),
      actual: snapFor('heading')?.rootClasses ?? 'missing'
    },
    {
      label: 'data-gap is declared on the root',
      expected: 's',
      actual: snapFor('heading')?.gap ?? 'missing'
    },
    {
      label: '.stack lays it out — a flex column, in every configuration',
      expected: CASES.map(() => 'flex/column').join(','),
      actual: across(s => `${s.display}/${s.flexDirection}`)
    },
    {
      label: '.center gives it a measure (max-inline-size is not `none`)',
      expected: CASES.map(() => true).join(','),
      actual: across(s => s.measured)
    },
    {
      label: 'the component’s own rule declares NO layout property',
      expected: 'none',
      actual: bespoke.length === 0 ? 'none' : bespoke.join(' ')
    },

    // --- 6. the padding hook -----------------------------------------------
    {
      label: 'padding-block resolves to --space-xl (measured, not string-compared)',
      expected: expectedPadding,
      actual: snapFor('heading')?.paddingBlockStart ?? 'missing'
    },
    {
      label: 'the hook defaults to var(--space-xl) in the rule itself',
      expected: 'var(--space-xl)',
      actual: hookValue || 'not declared'
    },
    {
      label: '--_bf-empty-state-padding-block overrides it from the call site',
      expected: '0px',
      actual: padded?.paddingBlockStart ?? 'missing'
    },

    // --- 7. bfNotFound IS bfEmptyState -------------------------------------
    {
      label: '<bfNotFound> renders the same .bf-empty-state root',
      expected: 'true',
      actual: String(alias?.rootClasses.includes('bf-empty-state') ?? 'missing')
    },
    {
      label: '  …with the same structure and the same resolved padding',
      expected: `h1.heading > p.message > p.back|${expectedPadding}`,
      actual: alias ? `${alias.order}|${alias.paddingBlockStart}` : 'missing'
    },

    // --- 8. layer, attrs, inline style, D-20.5 ------------------------------
    {
      label: '.bf-empty-state rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(rule !== null)
    },
    {
      label: 'the component contributes no inline style of its own',
      expected: expectAcross(c => c.style !== undefined),
      actual: across(s => s.inlineStyle)
    },
    {
      label: '$attrs fallthrough reaches the root (data-probe-case)',
      expected: expectAcross(c => c.key),
      actual: across(s => s.attrsCase)
    },
    {
      label: '  …and merges with, rather than replaces, the component’s class',
      expected: CASES.map(() => true).join(','),
      actual: across(s => s.attrsClassMerged)
    },
    {
      label: 'no bf-* rule uses :not() with a complex selector (D-20.5)',
      expected: 0,
      actual: badNots.length === 0 ? 0 : badNots.join(' ; ')
    },
    /*
     * Residual #173. The staged instance takes the default and must still be
     * the page's `h1`; the second instance below it asks for `2` and must be an
     * `h2` — which is also why every `h1Count` row above still reads `1` with
     * two components mounted at once. Both halves in one row: the default and
     * the override are the same claim, and splitting them would let a component
     * that ignored the prop pass half of it.
     */
    {
      label: 'headingLevel sets the rank — default h1, h2 when asked (#173)',
      expected: 'H1/H2',
      actual: `${headingTagOf('[data-probe-stage] .bf-empty-state')}/${headingTagOf('[data-probe-heading-level]')}`
    }
  ]
}

onMounted(() => {
  void finalise()

  /*
   * Safety net. A probe that stays PENDING reports a timeout and nothing else;
   * a probe that finalises reports *which* row failed.
   */
  setTimeout(() => {
    if (reported) return
    seen.timedOut = true
    report()
  }, 6000)
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

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
    `data-probe-row` + `data-ok`. No `data-probe-keys` — nothing here is a
    keyboard question.
  -->
  <main
    class="probe container"
    data-probe="33"
    :data-probe-verdict="state.toUpperCase()"
  >
    <!--
      The demo comes FIRST and owns the page's only `<h1>` — the component is
      "the sole content on the page", which is what the spec asks for and what
      keeps `grep -c '<h1' … = 1` true of the prerendered HTML. One mount
      point, keyed on the case so switching remounts rather than patches.
    -->
    <div data-probe-stage>
      <bfEmptyState
        v-if="current.as === 'bfEmptyState'"
        :key="current.key"
        class="probe__marker"
        :heading="current.heading"
        :message="current.message"
        :back-label="current.backLabel"
        :back-to="current.backTo"
        :style="current.style"
        :data-probe-case="current.key"
      >
        <p v-if="current.slot" data-probe-slot-content>
          Slot content — a caller’s own block, which must read after the
          heading, the message and the way back.
        </p>
      </bfEmptyState>

      <bfNotFound
        v-else
        :key="current.key"
        class="probe__marker"
        :heading="current.heading"
        :message="current.message"
        :back-label="current.backLabel"
        :back-to="current.backTo"
        :style="current.style"
        :data-probe-case="current.key"
      >
        <p v-if="current.slot" data-probe-slot-content>
          Slot content — a caller’s own block.
        </p>
      </bfNotFound>

      <!--
        Residual #173 — the `headingLevel` override, mounted permanently and
        AFTER the staged instance so that `document.querySelector('.bf-empty-state')`
        still resolves to the case under test. It renders an `<h2>`, so the
        "exactly one `<h1>`" rows above stay true with two instances on the page
        — which is the property the prop exists to give the insights and search
        templates.
      -->
      <bfEmptyState
        data-probe-heading-level
        heading="No insights match those filters"
        message="Clearing one of them will widen the results."
        :heading-level="2"
      />
    </div>

    <section class="probe__report" aria-labelledby="probe-title">
      <h2 id="probe-title">Probe 33 — <code>bfEmptyState</code> / <code>bfNotFound</code></h2>

      <p class="probe__lede">
        One component, two auto-import names, and exactly one
        <code>&lt;h1&gt;</code> — which is why this probe mounts
        <strong>one instance at a time</strong> rather than eight side by side:
        eight would put eight <code>&lt;h1&gt;</code>s on a page, breaking the
        rule the component exists to keep. The assertions below cycled the
        mount point through all eight cases and read the live DOM at each.
      </p>

      <p class="probe__lede">
        A ninth instance is mounted permanently under the stage with
        <code>:heading-level="2"</code> (residual #173). It is the proof that
        the prop changes the rank and nothing else — and, because it renders an
        <code>&lt;h2&gt;</code>, that two of these can share a page without
        breaking the one-<code>&lt;h1&gt;</code> rule.
      </p>

      <fieldset class="probe__cases">
        <legend>Mounted case</legend>
        <label v-for="c in CASES" :key="c.key" class="probe__case">
          <input
            v-model="form"
            type="radio"
            name="probe-33-case"
            :value="c.key"
          >
          <code>{{ c.key }}</code> — {{ c.note }}
        </label>
      </fieldset>

      <!--
        The `--space-xl` reference. The token resolves to a `clamp()`, so the
        padding row compares two *computed* lengths rather than string-matching
        an expression that never resolves in the CSSOM.
      -->
      <div class="probe__ref" data-probe-ref aria-hidden="true" />

      <p
        class="probe__verdict"
        :data-state="state"
        data-testid="probe-33-verdict"
      >
        {{ verdict }}
      </p>

      <table class="probe__table" data-testid="probe-33-table">
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
    </section>
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

[data-probe-stage] {
  outline: 1px dashed currentcolor;
  outline-offset: 4px;
}

.probe__report {
  margin-block-start: var(--space-l, 2rem);
}

.probe__lede {
  max-inline-size: 75ch;
}

.probe__cases {
  max-inline-size: 75ch;
  font-size: 0.875rem;
}

.probe__case {
  display: block;
}

/*
  The measured reference for `--space-xl`. Zero-height content, so the only
  thing it contributes is the padding the row compares against.
*/
.probe__ref {
  padding-block: var(--space-xl);
  block-size: 0;
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
