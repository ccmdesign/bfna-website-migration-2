<script setup lang="ts">
/**
 * Probe — issue 37 / gh#46: `bfHero`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## Why this probe mounts all three forms at once
 *
 * The opposite choice from probe 33, and for the same reason stated the other
 * way round. `bfEmptyState` had to be cycled one instance at a time because
 * its spec counts **one** `<h1>` in the prerendered HTML; `bfHero`'s spec
 * counts **three**:
 *
 * ```bash
 * [ "$(grep -c '<h1' .output/public/bf-probe/37-bf-hero/index.html)" = "3" ]
 * ```
 *
 * — one for each of the forms the acceptance line names: heading-only,
 * heading + description, and heading + description + actions. So all three are
 * mounted simultaneously and the count is a real statement about this page.
 *
 * That makes this page deliberately non-conforming to BRIEF §5 rule 9 (one
 * `h1` per page), and it is the only page in the epic that is. A probe is a
 * measuring instrument, not a page of the site; the rule it is testing is
 * *"`bfHero` contributes exactly one `h1`"*, which is asserted per component
 * root below, and the only honest way to test three configurations of it at
 * once is to render three. The probe's own title is therefore an `<h2>` and
 * the `bf-probe` layout contributes no heading at all (it is a bare
 * `<slot />`), so the three `<h1>`s on this page are all `bfHero`'s.
 *
 * ## What it proves
 *
 *  1. **All three forms render**, each as a `<section class="bf-hero">`
 *     containing exactly one `<h1>` — and the document holds exactly three
 *     `<h1>`s in total, all of them owned by a hero.
 *  2. **The `<h1>` is unconditional and carries `heading` verbatim.**
 *  3. **`description` renders only when given** — no empty `<p>` in the
 *     heading-only form — with `data-measure="normal"` and a resolved measure.
 *  4. **The `.cluster` actions wrapper is ABSENT in the first two forms** and
 *     present in the third. This is `wfHero`'s `v-if="$slots.default"` guard,
 *     and it is the row that would catch a wrapper rendered unconditionally —
 *     an empty flex box that still takes a `.stack` gap. It caught exactly
 *     that on the first run, from the *probe* side: see the template comment
 *     on why the three heroes are two branches rather than one `v-for` with a
 *     `v-if` inside the slot.
 *  5. **`min-height` resolves to at least 60svh**, measured against a live
 *     `60svh` reference element rather than string-compared against a unit the
 *     CSSOM never resolves.
 *  6. **`display: grid` and `align-content: center`** — the other two
 *     declarations ported from `.wireframe .wf-hero`.
 *  7. **`--_bf-hero-min-height` is declared in the rule as `60svh`** and really
 *     overrides the height from the call site.
 *  8. **Sizing is the Utopia scale's, not this component's.** The hero's `h1`
 *     computes the same `font-size` as a bare `<h1>` reference, and the
 *     component's own rule declares no `font-size` and no colour at all.
 *  9. **Layout is the composition layer's**: the inner box keeps the
 *     wireframe's `center | stack` class list with `data-gap="s"` and computes
 *     as a flex column with a measure; the actions row is a `.cluster`.
 * 10. `.bf-hero` rules are inside `@layer components` in the live CSSOM, the
 *     component emits no inline `style` of its own, `$attrs` reaches the root
 *     and merges with its class, and no `bf-*` rule on the page uses `:not()`
 *     with a complex selector (D-20.5).
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 37`,
 * per the gh#20–#45 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
defineOptions({ name: 'BfProbe37BfHero' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 37 — bfHero'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/** One of the three forms the acceptance line names. */
interface Form {
  key: string
  note: string
  heading: string
  description?: string
  /** Fill the default slot with action buttons. */
  actions?: boolean
}

/*
 * Real copy, not lorem (BRIEF §5 rule 10): the `home` row of
 * `src/assets/wireframe-data/pages.json` and the action label the wireframe
 * home page actually renders — a 158-character description, which is the
 * length this band has to tolerate.
 */
const HOME_HEADING = 'Strengthening the Transatlantic Relationship'
const HOME_DESCRIPTION
  = 'The Bertelsmann Foundation North America is an independent, nonpartisan '
    + 'think tank dedicated to strengthening the transatlantic partnership and '
    + 'advancing dialogue on the global challenges shaping our future.'

const FORMS: Form[] = [
  {
    key: 'heading',
    note: 'heading only — no description, no actions',
    heading: HOME_HEADING
  },
  {
    key: 'description',
    note: 'heading + description — still no actions wrapper',
    heading: 'Democracy',
    description: HOME_DESCRIPTION
  },
  {
    key: 'actions',
    note: 'heading + description + actions — the wireframe home hero, exactly',
    heading: HOME_HEADING,
    description: HOME_DESCRIPTION,
    actions: true
  }
]

/** What the DOM looked like for one form. */
interface Snapshot {
  key: string
  /** Is there a root at all? */
  found: boolean
  /** `<h1>`s inside THIS hero. Must be 1 for every form. */
  h1Count: number
  h1Text: string
  h1FontSize: string
  hasDescription: boolean
  descriptionText: string
  descriptionMeasure: string
  /** Did `.center` / `[data-measure]` give the standfirst a cap? */
  descriptionMeasured: boolean
  /** The `.cluster` actions wrapper — absent unless the slot is filled. */
  hasActions: boolean
  actionsClasses: string
  actionsGap: string
  actionsDisplay: string
  /** Did the slot content (a `bfButton`) actually land inside it? */
  actionButtons: number
  minHeight: string
  display: string
  alignContent: string
  /** The inner `center | stack` box. */
  innerClasses: string
  innerGap: string
  innerDisplay: string
  innerFlexDirection: string
  innerMeasured: boolean
  /** Element sequence of the inner box's children, in DOM order. */
  order: string
  rootClasses: string
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
 * helper as probes 14–36.
 */
const layeredRule = (match: (selector: string) => boolean): CSSStyleRule | null => {
  const LAYER_BLOCK = globalThis.CSSLayerBlockRule
  if (!LAYER_BLOCK) return null

  const walk = (rules: CSSRuleList, insideComponents: boolean): CSSStyleRule | null => {
    for (const rule of Array.from(rules)) {
      const nowInside
        = insideComponents
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
  const cls = Array.from(el.classList).find(c => c.startsWith('bf-hero__'))
  return cls ? `${tag}.${cls.replace('bf-hero__', '')}` : tag
}

const heroFor = (key: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`.bf-hero[data-probe-case="${key}"]`)

const snapshot = (f: Form): Snapshot => {
  const root = heroFor(f.key)
  const inner = root?.querySelector<HTMLElement>('.stack') ?? null
  const h1s = root?.querySelectorAll('h1') ?? ([] as unknown as NodeListOf<HTMLElement>)
  const h1 = root?.querySelector<HTMLElement>('h1') ?? null
  const description = root?.querySelector<HTMLElement>('.bf-hero__description') ?? null
  const actions = root?.querySelector<HTMLElement>('.bf-hero__actions') ?? null
  const style = root ? getComputedStyle(root) : null
  const innerStyle = inner ? getComputedStyle(inner) : null
  const descriptionStyle = description ? getComputedStyle(description) : null
  const actionsStyle = actions ? getComputedStyle(actions) : null

  return {
    key: f.key,
    found: root !== null,
    h1Count: h1s.length,
    h1Text: (h1?.textContent ?? '').trim(),
    h1FontSize: h1 ? getComputedStyle(h1).fontSize : '',
    hasDescription: description !== null,
    descriptionText: (description?.textContent ?? '').trim(),
    descriptionMeasure: description?.getAttribute('data-measure') ?? '',
    descriptionMeasured:
      descriptionStyle !== null && descriptionStyle.maxInlineSize !== 'none',
    hasActions: actions !== null,
    actionsClasses: actions ? Array.from(actions.classList).sort().join(' ') : '',
    actionsGap: actions?.getAttribute('data-gap') ?? '',
    actionsDisplay: actionsStyle?.display ?? '',
    actionButtons: actions?.querySelectorAll('.bf-button').length ?? 0,
    minHeight: style?.minHeight ?? '',
    display: style?.display ?? '',
    alignContent: style?.alignContent ?? '',
    innerClasses: inner ? Array.from(inner.classList).sort().join(' ') : 'no inner box',
    innerGap: inner?.getAttribute('data-gap') ?? '',
    innerDisplay: innerStyle?.display ?? '',
    innerFlexDirection: innerStyle?.flexDirection ?? '',
    /* `.center` writes a `max-inline-size`; a bare block box reports `none`. */
    innerMeasured: innerStyle !== null && innerStyle.maxInlineSize !== 'none',
    order: inner ? Array.from(inner.children).map(describe).join(' > ') : 'no inner box',
    rootClasses: root ? Array.from(root.classList).sort().join(' ') : 'no root',
    /*
     * Read as a *declaration*, not as the presence of the attribute — the
     * reasoning probe 33 records: an attribute that declares nothing is not an
     * inline style.
     */
    inlineStyle: root !== null && root.style.cssText.trim() !== '',
    attrsCase: root?.dataset.probeCase ?? '',
    attrsClassMerged:
      (root?.classList.contains('bf-hero') ?? false)
      && (root?.classList.contains('probe__marker') ?? false)
  }
}

const snapFor = (key: string): Snapshot | undefined => snaps.find(s => s.key === key)

/** A row's value for every form, in `FORMS` order — one string to compare. */
const across = (read: (s: Snapshot) => string | number | boolean): string =>
  FORMS.map((f) => {
    const s = snapFor(f.key)
    return s === undefined ? '?' : String(read(s))
  }).join(',')

/** The same shape, built from the expectations rather than from the DOM. */
const expectAcross = (read: (f: Form) => string | number | boolean): string =>
  FORMS.map(f => String(read(f))).join(',')

/** Has the walk been started? */
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

/**
 * What the height hook did when a call site overrode it. Measured by writing
 * the property onto a live root and reading the resolved `min-height` back,
 * then removing it — rather than by mounting a fourth hero, which would put a
 * fourth `<h1>` on a page whose whole static check is that there are three.
 */
const hook = reactive({ overridden: '', restored: '' })

/**
 * Residual #162's case, mounted for one tick and then withdrawn.
 *
 * The bug: `v-if="$slots.default"` is true whenever the parent *passed* a
 * slot, so a hero whose slot content is `v-if`'d away rendered an empty
 * `.cluster` — a zero-height flex box that still takes the `.stack`'s
 * `data-gap="s"` under the copy. gh#56 replaced the guard with a vnode-content
 * check (`showActions()`), the same shape `bfPageHeader` adopted in gh#47.
 *
 * Mounted **transiently**, for exactly the reason the height hook above is
 * measured by writing a property rather than by mounting a fourth hero: a
 * fourth `<h1>` would break both the "exactly three" row and issue 37's own
 * static `grep -c '<h1'` acceptance. `v-if` starts `false`, so the prerendered
 * HTML holds three heroes; the walk flips it on, reads the DOM, and flips it
 * back before `report()` counts anything.
 */
const emptySlot = ref(false)
const empty = reactive({ mounted: false, hasActions: 'not measured' })

/**
 * The `v-if` inside that hero's slot. A named binding rather than a literal
 * `v-if="false"`, so the condition is unmistakably the *caller's* — this is
 * modelling a real call site whose CTA happens to be absent, not a switched-off
 * bit of markup.
 */
const neverTrue = ref(false)

/**
 * One tick — a re-render, and nothing else to wait for. Deliberately **not**
 * `requestAnimationFrame`, which is throttled to a near stop in a backgrounded
 * or embedded browser view; see the note in probe 33.
 */
const settle = (): Promise<void> => nextTick()

const finalise = async () => {
  if (walking) return
  walking = true

  await settle()

  // --- read every form, live -----------------------------------------------
  for (const f of FORMS) snaps.push(snapshot(f))

  // --- the height hook, written and then withdrawn -------------------------
  const subject = heroFor('heading')
  if (subject) {
    const before = getComputedStyle(subject).minHeight
    subject.style.setProperty('--_bf-hero-min-height', '120px')
    hook.overridden = getComputedStyle(subject).minHeight
    subject.style.removeProperty('--_bf-hero-min-height')
    hook.restored = getComputedStyle(subject).minHeight === before ? 'restored' : 'stuck'
  }

  // --- residual #162: a passed-but-empty slot, mounted and withdrawn -------
  emptySlot.value = true
  await settle()
  const emptyRoot = heroFor('empty-slot')
  empty.mounted = emptyRoot !== null
  empty.hasActions = emptyRoot
    ? String(emptyRoot.querySelector('.bf-hero__actions') !== null)
    : 'not mounted'
  emptySlot.value = false
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
  const heightRef = document.querySelector<HTMLElement>('[data-probe-ref-height]')
  const expectedMinHeight = heightRef ? getComputedStyle(heightRef).height : 'no reference'
  const h1Ref = document.querySelector<HTMLElement>('[data-probe-ref-h1]')
  const expectedH1Size = h1Ref ? getComputedStyle(h1Ref).fontSize : 'no reference'

  // --- the component's own rule --------------------------------------------
  const rule = layeredRule(s => /\.bf-hero(?![\w-])/.test(s))
  const ruleText = rule?.style.cssText ?? ''
  const hookValue = rule?.style.getPropertyValue('--_bf-hero-min-height').trim() ?? ''

  /*
   * The properties this component must NOT declare. `font-size` because sizing
   * is the Utopia scale's job (the spec says so in as many words); `color`,
   * `background` and friends because D5 forbids art direction and BRIEF §5
   * rule 2 forbids a new colour — a band that paints nothing cannot introduce
   * one. Read off the rule's own `cssText`, so the check is on the emitted CSS
   * rather than on the source it was written in.
   */
  const FORBIDDEN_PROPERTIES = [
    'font-size', 'font', 'color', 'background', 'background-image',
    'background-color', 'border', 'box-shadow'
  ]
  const declared = FORBIDDEN_PROPERTIES.filter(p =>
    new RegExp(`(^|[;\\s])${p}\\s*:`).test(ruleText)
  )

  const badNots = complexNotSelectors()

  const allH1s = document.querySelectorAll('h1')
  const ownedH1s = Array.from(allH1s).filter(h => h.closest('.bf-hero') !== null)

  const heading = snapFor('heading')
  const actions = snapFor('actions')

  checks.value = [
    // --- 0. did the walk actually run? -------------------------------------
    {
      label: 'the walk completed, rather than being rescued by the timeout',
      expected: 'false',
      actual: String(seen.timedOut)
    },
    {
      label: '  …reading every form',
      expected: FORMS.length,
      actual: snaps.length
    },
    {
      label: 'all three forms mounted a <section class="bf-hero">',
      expected: FORMS.map(() => true).join(','),
      actual: across(s => s.found)
    },

    // --- 1. exactly one h1 per hero, three on the page ---------------------
    {
      label: 'each bfHero contributes EXACTLY ONE <h1>',
      expected: FORMS.map(() => 1).join(','),
      actual: across(s => s.h1Count)
    },
    {
      label: 'the document holds exactly three <h1>s — one per form (spec grep)',
      expected: 3,
      actual: allH1s.length
    },
    {
      label: '  …and every one of them belongs to a bfHero',
      expected: 3,
      actual: ownedH1s.length
    },
    {
      label: 'the <h1> carries the `heading` prop verbatim',
      expected: expectAcross(f => f.heading),
      actual: across(s => s.h1Text)
    },

    // --- 2. the description -------------------------------------------------
    {
      label: '`description` renders when given, and no empty <p> when not',
      expected: expectAcross(f => f.description !== undefined),
      actual: across(s => s.hasDescription)
    },
    {
      label: '  …with the text it was handed',
      expected: expectAcross(f => f.description ?? ''),
      actual: across(s => s.descriptionText)
    },
    {
      label: 'the description carries data-measure="normal"',
      expected: expectAcross(f => (f.description === undefined ? '' : 'normal')),
      actual: across(s => s.descriptionMeasure)
    },
    {
      label: '  …and the composition layer really caps it (max-inline-size ≠ none)',
      expected: expectAcross(f => f.description !== undefined),
      actual: across(s => s.descriptionMeasured)
    },

    // --- 3. the actions wrapper: only when the slot is filled ---------------
    {
      label: 'the .cluster actions wrapper renders ONLY when the default slot is filled',
      expected: expectAcross(f => f.actions === true),
      actual: across(s => s.hasActions)
    },
    {
      label: '  …so the heading-only form emits no empty flex box',
      expected: 'false',
      actual: String(heading?.hasActions ?? 'missing')
    },
    {
      label: '  …and neither does heading + description',
      expected: 'false',
      actual: String(snapFor('description')?.hasActions ?? 'missing')
    },
    {
      /*
       * Residual #162, closed by gh#56. The one row on this page whose subject
       * is mounted and then withdrawn — see `emptySlot` for why a fourth
       * permanent hero is not an option here.
       */
      label: '  …and neither does a hero PASSED a slot whose content is v-if\'d away (#162)',
      expected: 'mounted/false',
      actual: `${empty.mounted ? 'mounted' : 'not mounted'}/${empty.hasActions}`
    },
    {
      label: 'the wrapper is a .cluster with data-gap="s", and lays out as flex',
      expected: 'bf-hero__actions cluster|s|flex',
      actual: actions
        ? [actions.actionsClasses, actions.actionsGap, actions.actionsDisplay].join('|')
        : 'missing'
    },
    {
      label: 'the slot content lands inside it (two bfButtons)',
      expected: expectAcross(f => (f.actions === true ? 2 : 0)),
      actual: across(s => s.actionButtons)
    },
    {
      label: 'DOM order is heading -> description -> actions',
      expected: 'h1.heading > p.description > div.actions',
      actual: actions?.order ?? 'missing'
    },
    {
      label: 'the heading-only form renders the h1 and nothing else',
      expected: 'h1.heading',
      actual: heading?.order ?? 'missing'
    },

    // --- 4. the band: the three declarations ported from .wf-hero ----------
    {
      /*
       * Compared with ±1px of tolerance, the same allowance
       * `docs/decisions/probe-harness.md` records for probe 03's track count
       * and for the same reason: Chrome snaps a used `min-height` to its
       * 1/64px `LayoutUnit` grid while reporting a `height` unrounded, so the
       * hero reads `614.4px` against a reference's `614.391px` on a build
       * where both are the identical `60svh`. A sub-pixel difference must not
       * decide a verdict; a wrong unit or a missing declaration still does,
       * because either moves the value by hundreds of pixels.
       */
      label: 'min-height resolves to 60svh (measured against a live 60svh reference, ±1px)',
      expected: `${FORMS.map(() => true).join(',')} vs ${expectedMinHeight}`,
      actual: `${across(s =>
        Math.abs(Number.parseFloat(s.minHeight) - Number.parseFloat(expectedMinHeight)) <= 1
      )} vs ${expectedMinHeight}`
    },
    {
      label: '  …which is at least 60% of the viewport height',
      expected: 'true',
      actual: String(
        Number.parseFloat(heading?.minHeight ?? '0') >= window.innerHeight * 0.6 - 1
      )
    },
    {
      label: 'the band is a grid with its content centred (as .wf-hero is)',
      expected: FORMS.map(() => 'grid/center').join(','),
      actual: across(s => `${s.display}/${s.alignContent}`)
    },
    {
      label: '--_bf-hero-min-height is declared in the rule, as 60svh',
      expected: '60svh',
      actual: hookValue || 'not declared'
    },
    {
      label: '  …and a call site can override the height through it',
      expected: '120px',
      actual: hook.overridden || 'not measured'
    },
    {
      label: '  …with the default restored when the override is withdrawn',
      expected: 'restored',
      actual: hook.restored || 'not measured'
    },

    // --- 5. sizing is the Utopia scale's, not this component's --------------
    {
      label: 'the hero h1 computes the same font-size as a bare <h1> (--size-4)',
      expected: FORMS.map(() => expectedH1Size).join(','),
      actual: across(s => s.h1FontSize)
    },
    {
      label: 'the component’s own rule declares no font-size, colour or background',
      expected: 'none',
      actual: declared.length === 0 ? 'none' : declared.join(' ')
    },

    // --- 6. layout is the composition layer’s ------------------------------
    {
      label: 'the inner box keeps the wireframe’s own class list (center | stack)',
      /*
       * `|` is a real class token, not punctuation: the wireframe writes
       * `class="center | stack"`, so `classList` holds three entries and the
       * pipe is one of them. Sorted in code rather than typed out, because
       * `'|'` (U+007C) sorts after every lowercase letter.
       */
      expected: FORMS.map(() => ['center', 'stack', '|'].sort().join(' ')).join(','),
      actual: across(s => s.innerClasses)
    },
    {
      label: 'data-gap="s" is declared on the inner box',
      expected: FORMS.map(() => 's').join(','),
      actual: across(s => s.innerGap)
    },
    {
      label: '.stack lays it out — a flex column, in every form',
      expected: FORMS.map(() => 'flex/column').join(','),
      actual: across(s => `${s.innerDisplay}/${s.innerFlexDirection}`)
    },
    {
      label: '.center gives it a measure (max-inline-size is not `none`)',
      expected: FORMS.map(() => true).join(','),
      actual: across(s => s.innerMeasured)
    },

    // --- 7. layer, attrs, inline style, D-20.5 -----------------------------
    {
      label: '.bf-hero rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(rule !== null)
    },
    {
      label: 'the component contributes no inline style of its own',
      expected: FORMS.map(() => false).join(','),
      actual: across(s => s.inlineStyle)
    },
    {
      label: '$attrs fallthrough reaches the root (data-probe-case)',
      expected: expectAcross(f => f.key),
      actual: across(s => s.attrsCase)
    },
    {
      label: '  …and merges with, rather than replaces, the component’s class',
      expected: FORMS.map(() => true).join(','),
      actual: across(s => s.attrsClassMerged)
    },
    {
      label: 'no bf-* rule uses :not() with a complex selector (D-20.5)',
      expected: 0,
      actual: badNots.length === 0 ? 0 : badNots.join(' ; ')
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
    class="probe"
    data-probe="37"
    :data-probe-verdict="state.toUpperCase()"
  >
    <!--
      The three forms, mounted at once and in the acceptance line's own order.
      Three heroes means three `<h1>`s, which is what this probe's static check
      counts and why the report below is headed by an `<h2>`.
    -->
    <div data-probe-stage>
      <!--
        Two branches, not one `<bfHero>` with a `v-if` inside its slot — and
        the difference is load-bearing rather than stylistic.

        `$slots.default` is truthy whenever the *parent* passed slot content at
        all, however that content renders. A single mount point whose slot held
        `<template v-if="f.actions">` therefore hands every hero a slot
        function, `v-if="$slots.default"` is true for all three, and all three
        render an empty `.cluster` — which is a gap in the `.stack` under a
        hero with no actions. Caught by this probe on its first run; recorded
        in the spec's Decisions and as a residual finding, since the guard
        itself is `wfHero`'s and parity is what the spec asks for.

        Written this way the probe models what a real call site does: a hero
        with actions is passed buttons, a hero without is passed nothing.
      -->
      <template v-for="f in FORMS" :key="f.key">
        <!--
          `bfButton` in the slot, as the spec asks and as the wireframe home
          page does — `to` + the primary variant, carrying the same "Explore
          our work" label Irene approved. A second, default-variant button
          proves the wrapper is a cluster of buttons rather than a box around
          one.
        -->
        <bfHero
          v-if="f.actions"
          class="probe__marker"
          :heading="f.heading"
          :description="f.description"
          :data-probe-case="f.key"
        >
          <bfButton to="/wireframes/democracy" variant="primary">
            Explore our work
          </bfButton>
          <bfButton to="/wireframes/insights">
            Read our insights
          </bfButton>
        </bfHero>

        <bfHero
          v-else
          class="probe__marker"
          :heading="f.heading"
          :description="f.description"
          :data-probe-case="f.key"
        />
      </template>

      <!--
        Residual #162's case, and the only hero on this page that is mounted
        and then withdrawn inside one walk (`emptySlot`): a hero **passed** a
        default slot whose only child is `v-if="false"`.

        `v-if="false"` leaves a comment vnode behind, so `$slots.default` is a
        function and the old guard was true; the vnode-content guard gh#56
        installed reads the comment and renders nothing. It is not left mounted
        because a fourth `<h1>` would break the "exactly three" row above and
        issue 37's own static count.
      -->
      <bfHero
        v-if="emptySlot"
        class="probe__marker"
        heading="Passed a slot that renders nothing"
        data-probe-case="empty-slot"
      >
        <bfButton v-if="neverTrue" to="/wireframes/democracy" variant="primary">
          Never rendered
        </bfButton>
      </bfHero>
    </div>

    <section class="probe__report" aria-labelledby="probe-title">
      <h2 id="probe-title">Probe 37 — <code>bfHero</code></h2>

      <p class="probe__lede">
        Three forms, mounted together: heading-only, heading + description, and
        heading + description + actions. Unlike probe 33, this page carries
        <strong>three</strong> <code>&lt;h1&gt;</code>s on purpose — the
        component's own rule is that it contributes exactly
        <em>one</em>, which is asserted per hero below, and the only honest way
        to test three configurations of that at once is to render three.
      </p>

      <!--
        The measured references. `60svh` and `--size-4` both resolve to lengths
        the CSSOM never reports back as written, so the rows compare two
        *computed* values rather than string-matching an expression.

        The type reference is a `<p class="h1">`, **not** an `<h1>`:
        `base/typography.css` gives `h1` and `.h1` the same
        `font-size: var(--size-4)` in the same rule, so the class is the exact
        same measurement — and a fourth `<h1>` on this page would break both
        the "exactly three" row and the spec's own static count, which is the
        one thing this probe exists to make true.
      -->
      <div class="probe__ref-height" data-probe-ref-height aria-hidden="true" />
      <p class="h1 probe__ref-h1" data-probe-ref-h1 aria-hidden="true" />

      <p
        class="probe__verdict"
        :data-state="state"
        data-testid="probe-37-verdict"
      >
        {{ verdict }}
      </p>

      <table class="probe__table" data-testid="probe-37-table">
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

      <ul class="probe__legend">
        <li v-for="f in FORMS" :key="f.key">
          <code>{{ f.key }}</code> — {{ f.note }}
        </li>
      </ul>
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

[data-probe-stage] > * {
  outline: 1px dashed currentcolor;
  outline-offset: -1px;
}

.probe__report {
  margin-block-start: var(--space-l, 2rem);
  padding-inline: var(--space-s, 1rem);
}

.probe__lede {
  max-inline-size: 75ch;
}

/*
  The measured reference for `60svh`. Zero inline size so it contributes no
  layout of its own; only its resolved height is read.
*/
.probe__ref-height {
  block-size: 60svh;
  inline-size: 0;
  position: absolute;
  visibility: hidden;
}

/*
  The measured reference for the `h1` step of the Utopia scale — a `<p>`
  carrying the `.h1` utility class, which `base/typography.css` gives the same
  `font-size: var(--size-4)` as the `h1` element, in the same rule. So the row
  compares the hero's computed size against the stack's own value for that step
  rather than against a hard-coded length, and does it without putting a fourth
  `<h1>` on the page.
*/
.probe__ref-h1 {
  position: absolute;
  visibility: hidden;
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

.probe__legend {
  max-inline-size: 75ch;
  font-size: 0.875rem;
}
</style>
