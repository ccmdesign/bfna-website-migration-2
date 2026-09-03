<script setup lang="ts">
/**
 * Probe — issue 39 / gh#48: `bfSection`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## What it proves
 *
 *  1. **Every `layout` value renders correctly** — `stack`, `switcher`,
 *     `cluster` and `plain` each produce the inner class list `wfSection`
 *     writes (`center` alone for `plain`, `center | <layout>` otherwise) and
 *     each computes the layout that class list promises.
 *  2. **`data-gap` is present for three layouts and absent for `plain`** — the
 *     wf source's own conditional, and the row that would catch a gap
 *     attribute naming a rhythm nothing reads.
 *  3. **`data-measure` is honoured universally** (issue 05), not only through
 *     `.center`: a `measure="narrow"` band caps at the same length a bare
 *     `[data-measure="narrow"]` reference does.
 *  4. **`fullWidth` visibly breaks out** — defect 1. The on-case's bounding box
 *     is measured against **its own parent's content width**, inside a frame
 *     deliberately narrower than the viewport, and must be wider than it and at
 *     least as wide as the viewport. The off-case must be neither.
 *  5. **`padded` is a rule, not an inline style** — defect 2's smaller half.
 *     The padded band's computed `padding-block` matches a live `--space-3xl`
 *     reference, the unpadded one is `0px`, and neither `<section>` carries an
 *     inline style **declaration** of any kind.
 *  6. **No prop leaks to the DOM** — defect 2. One band is given a real
 *     `data-testid` *and* a bogus, prop-shaped `image-left` attribute: the
 *     testid must be on the `<section>`, `image-left` must appear nowhere in
 *     the document, and no `<section class="bf-section">` on the page may carry
 *     an attribute named after any of the typed props (`fullWidth`, `padded`,
 *     `layout`, `measure`, `gap`, `heading`, `label`).
 *  7. **`$attrs` still composes from outside** — `id`, `class` and `data-*`
 *     reach the root and the caller's `class` *merges with* `bf-section`
 *     instead of replacing it (ADR-1).
 *  8. **`heading` renders as an `<h2>` when given and as nothing when not**,
 *     and `label` reaches `data-label`.
 *  9. **A `bfAccordion` nests inside a band without layout breakage** — the
 *     follow-up D-31.1 explicitly left to this issue, closed from the other
 *     side now that `bfSection` exists.
 * 10. The standing epic rows: `.bf-section` rules live inside
 *     `@layer components` in the live CSSOM, the component's own rule declares
 *     no colour, and no `bf-*` rule on the page uses `:not()` with a complex
 *     selector (D-20.5).
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 39`,
 * per the gh#20–#46 precedent and the #109 harness decision. The spec's two
 * static greps are additionally **defective** (`grep -Lq`, and a one-line
 * prerendered document) — verified equivalents are recorded in the spec's
 * Decisions, the way D-37.5 recorded it for issue 37.
 */
defineOptions({ name: 'BfProbe39BfSection' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 39 — bfSection'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/** One of the four `layout` values, mounted as its own band. */
interface LayoutCase {
  key: 'stack' | 'switcher' | 'cluster' | 'plain'
  note: string
}

const LAYOUTS: LayoutCase[] = [
  { key: 'stack', note: 'the default — a column with a rhythm' },
  { key: 'switcher', note: 'media beside text; also the "split section" variant' },
  { key: 'cluster', note: 'a row of small things that wraps' },
  { key: 'plain', note: 'no primitive, and therefore no data-gap' }
]

/*
 * Real content, not lorem (BRIEF §5 rule 10). The band labels and headings are
 * the ones the wireframe's own `wf-section` call sites pass, and the body copy
 * is the `democracy` program blurb from `programs.json`.
 */
const BAND_HEADING = 'Our Programs'
const BAND_LABEL = 'Programs'
const BODY
  = 'Democracy is under pressure on both sides of the Atlantic. Our work '
    + 'examines the institutions, technologies and narratives shaping how '
    + 'people govern themselves, and what transatlantic partners can learn '
    + 'from one another about defending them.'

/** What the DOM looked like for one band. */
interface Snapshot {
  key: string
  found: boolean
  /** The root `<section>`'s classes, sorted. */
  rootClasses: string
  dataLabel: string
  /** Does the root carry an inline style *declaration* (not just the attr)? */
  inlineStyle: boolean
  /** `<h2>`s this band contributes. */
  headingCount: number
  headingText: string
  /**
   * The band's accessible name, resolved through `aria-labelledby` — residual
   * #164, folded into gh#55.
   *
   * Three distinguishable values, because the failure modes differ: the target
   * heading's text when the idref resolves, `dangling idref` when the attribute
   * names an element that is not there (worse than no name — some screen
   * readers then fall back to the band's whole content), and `absent` when
   * there is no attribute at all, which is the correct state for a band with no
   * heading.
   */
  accessibleName: string
  /** The inner `center | <layout>` box. */
  innerClasses: string
  /** `null` when the attribute is absent, which is what `plain` must be. */
  innerGap: string
  innerMeasure: string
  innerDisplay: string
  innerFlexDirection: string
  innerFlexWrap: string
  /**
   * The rhythm the composition layer actually resolved, in px.
   *
   * Two mechanisms, because the primitives use two: `.switcher` and `.cluster`
   * space with `gap`, `.stack` with a margin on `* + *`. Reading the *used*
   * length of whichever applies is the only way to assert `data-gap` did
   * something — a resolved custom property comes back as an unparsed
   * `clamp(…)` token stream.
   */
  innerRhythm: number
  innerMaxInlineSize: string
  /** Box metrics, for the break-out rows. */
  width: number
  parentWidth: number
  paddingBlock: string
}

const snaps = reactive<Snapshot[]>([])
const checks = ref<Check[]>([])

/**
 * Walk every reachable stylesheet — `@import`ed ones included, since
 * `/css/styles.css` is nothing but a list of imports — for a style rule whose
 * selector matches and whose ancestry includes a `@layer components` block.
 * Cross-origin sheets throw on `cssRules`; they are skipped, not failed. Same
 * helper as probes 14–37.
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

const bandFor = (key: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`.bf-section[data-probe-case="${key}"]`)

const snapshot = (key: string): Snapshot => {
  const root = bandFor(key)
  const parent = root?.parentElement ?? null
  /* The inner box is the band's only element child. */
  const inner = root?.firstElementChild as HTMLElement | null
  const innerStyle = inner ? getComputedStyle(inner) : null
  const rootStyle = root ? getComputedStyle(root) : null
  const h2s = root?.querySelectorAll('h2') ?? ([] as unknown as NodeListOf<HTMLElement>)

  /*
   * The parent's *content* width — `50%` in the break-out rule resolves
   * against exactly this, so it is what the on-case must beat. `clientWidth`
   * includes padding, so the padding is subtracted rather than assumed absent.
   */
  const parentStyle = parent ? getComputedStyle(parent) : null
  const parentContentWidth = parent && parentStyle
    ? parent.clientWidth
      - Number.parseFloat(parentStyle.paddingLeft)
      - Number.parseFloat(parentStyle.paddingRight)
    : 0

  return {
    key,
    found: root !== null,
    rootClasses: root ? Array.from(root.classList).sort().join(' ') : 'no root',
    dataLabel: root?.getAttribute('data-label') ?? '',
    /*
     * Read as a *declaration*, not as the presence of the attribute — the
     * reasoning probe 33 records: an attribute that declares nothing is not an
     * inline style. Vue's scoped-style attribute is not a style either.
     */
    inlineStyle: root !== null && root.style.cssText.trim() !== '',
    headingCount: h2s.length,
    headingText: (root?.querySelector('h2')?.textContent ?? '').trim(),
    accessibleName: (() => {
      const ref = root?.getAttribute('aria-labelledby') ?? ''
      if (ref === '') return 'absent'
      const target = document.getElementById(ref)
      return target ? (target.textContent ?? '').trim() : 'dangling idref'
    })(),
    innerClasses: inner ? Array.from(inner.classList).sort().join(' ') : 'no inner box',
    /* `absent` is a value here, and for `plain` it is the required one. */
    innerGap: inner?.getAttribute('data-gap') ?? 'absent',
    innerMeasure: inner?.getAttribute('data-measure') ?? 'absent',
    innerDisplay: innerStyle?.display ?? '',
    innerFlexDirection: innerStyle?.flexDirection ?? '',
    innerFlexWrap: innerStyle?.flexWrap ?? '',
    innerRhythm: (() => {
      if (!inner || !innerStyle) return -1
      /* `.stack` spaces with a margin on every child after the first. */
      if (inner.classList.contains('stack')) {
        const second = inner.children[1] as HTMLElement | undefined
        return second ? Number.parseFloat(getComputedStyle(second).marginBlockStart) : -1
      }
      /* `.switcher` and `.cluster` space with `gap`; a `plain` box has none. */
      const rowGap = Number.parseFloat(innerStyle.rowGap)
      return Number.isNaN(rowGap) ? 0 : rowGap
    })(),
    innerMaxInlineSize: innerStyle?.maxInlineSize ?? '',
    width: root ? root.getBoundingClientRect().width : 0,
    parentWidth: parentContentWidth,
    paddingBlock: rootStyle ? rootStyle.paddingBlockStart : ''
  }
}

const snapFor = (key: string): Snapshot | undefined => snaps.find(s => s.key === key)

/** A row's value for every layout case, in `LAYOUTS` order — one string. */
const across = (read: (s: Snapshot) => string | number | boolean): string =>
  LAYOUTS.map((l) => {
    const s = snapFor(l.key)
    return s === undefined ? '?' : String(read(s))
  }).join(',')

/** Every case this probe mounts, layout cases included. */
const ALL_CASES = [
  ...LAYOUTS.map(l => l.key),
  'measure', 'padded', 'unpadded', 'full-on', 'full-off', 'attrs', 'nested'
] as const

/** The typed props, in the attribute spellings a leak would produce. */
const PROP_ATTRIBUTE_SPELLINGS = [
  'fullwidth', 'full-width', 'padded', 'layout', 'measure', 'gap',
  'heading', 'label'
]

let walking = false
let reported = false
const seen = reactive({ timedOut: false })

/** One tick — a re-render, and nothing else to wait for (probe 33's note). */
const settle = (): Promise<void> => nextTick()

const finalise = async () => {
  if (walking) return
  walking = true

  await settle()

  for (const key of ALL_CASES) snaps.push(snapshot(key))

  report()
}

const report = () => {
  if (reported) return
  reported = true

  // --- measured references --------------------------------------------------
  const padRef = document.querySelector<HTMLElement>('[data-probe-ref-pad]')
  const expectedPadding = padRef ? getComputedStyle(padRef).paddingBlockStart : 'no reference'
  const measureRef = document.querySelector<HTMLElement>('[data-probe-ref-measure]')
  const expectedMeasure = measureRef ? getComputedStyle(measureRef).maxInlineSize : 'no reference'

  // --- the component's own rule --------------------------------------------
  const rule = layeredRule(s => /\.bf-section(?![\w-])/.test(s))
  const ruleText = rule?.style.cssText ?? ''
  const paddingHook = rule?.style.getPropertyValue('--_bf-section-padding-block').trim() ?? ''

  /*
   * D5 / BRIEF §5 rule 2: the band paints nothing, so it declares no colour of
   * any kind. Read off the emitted rule's own `cssText`, not off the source.
   */
  const FORBIDDEN_PROPERTIES = [
    'color', 'background', 'background-image', 'background-color',
    'border', 'border-color', 'box-shadow'
  ]
  const declared = FORBIDDEN_PROPERTIES.filter(p =>
    new RegExp(`(^|[;\\s])${p}\\s*:`).test(ruleText)
  )

  const badNots = complexNotSelectors()

  // --- the prop-leak evidence ----------------------------------------------
  const bands = Array.from(document.querySelectorAll<HTMLElement>('.bf-section'))
  const leakedPropAttrs = bands.flatMap(b =>
    Array.from(b.attributes)
      .map(a => a.name.toLowerCase())
      .filter(n => PROP_ATTRIBUTE_SPELLINGS.includes(n))
  )
  /*
   * The whole document, not just the band: a leak that Vue had rewritten onto
   * a wrapper or turned into `data-image-left` would still be a leak.
   *
   * Attribute **names** only, deliberately — an `outerHTML` substring search
   * would match this page's own prose, which writes `<code>image-left</code>`
   * to explain the case, and would then fail for a component that is correct.
   * The same trap makes the spec's static grep need an `=` in the needle; see
   * the Decisions.
   */
  const bogusAttrNames = Array.from(document.querySelectorAll('*'))
    .flatMap(el => Array.from(el.attributes).map(a => a.name.toLowerCase()))
    .filter(name => name.includes('image-left'))

  const attrsBand = bandFor('attrs')

  // --- the break-out pair ---------------------------------------------------
  const fullOn = snapFor('full-on')
  const fullOff = snapFor('full-off')

  const padded = snapFor('padded')
  const unpadded = snapFor('unpadded')
  const measured = snapFor('measure')
  const nested = snapFor('nested')
  const plain = snapFor('plain')
  const stack = snapFor('stack')

  const accordion = document.querySelector<HTMLElement>('.bf-section[data-probe-case="nested"] .bf-accordion')
  const nestedInner = document.querySelector<HTMLElement>('.bf-section[data-probe-case="nested"] > .center')

  checks.value = [
    // --- 0. did the walk actually run? -------------------------------------
    {
      label: 'the walk completed, rather than being rescued by the timeout',
      expected: 'false',
      actual: String(seen.timedOut)
    },
    {
      label: '  …reading every case',
      expected: ALL_CASES.length,
      actual: snaps.length
    },
    {
      label: 'every case mounted a <section class="bf-section">',
      expected: ALL_CASES.map(() => true).join(','),
      actual: ALL_CASES.map(k => String(snapFor(k)?.found ?? false)).join(',')
    },

    // --- 1. every layout value ---------------------------------------------
    {
      label: 'inner box carries the wf class list (center alone for `plain`)',
      expected: LAYOUTS.map(l =>
        (l.key === 'plain' ? ['center'] : ['center', '|', l.key]).sort().join(' ')
      ).join(','),
      actual: across(s => s.innerClasses)
    },
    {
      label: 'each layout computes what its class list promises',
      /*
       * `.stack` is a flex column; `.switcher` and `.cluster` are wrapping flex
       * rows; `plain` is a bare `.center`, so a block. The three are told apart
       * by class list in the row above — this row is about the CSS having
       * actually loaded and applied.
       */
      expected: 'flex/column,flex/wrap,flex/wrap,block/—',
      actual: across(s =>
        s.innerDisplay === 'flex'
          ? `flex/${s.innerFlexWrap === 'wrap' ? 'wrap' : s.innerFlexDirection}`
          : `${s.innerDisplay}/—`
      )
    },
    {
      label: 'data-gap is written for stack/switcher/cluster and OMITTED for plain',
      expected: 'm,m,m,absent',
      actual: across(s => s.innerGap)
    },
    {
      /*
       * The attribute existing is not the claim; the rhythm resolving to a
       * real length is. `.stack`'s comes back as a child margin and the other
       * two as a `gap`, so `innerRhythm` reads whichever applies — and `plain`,
       * which declares no primitive, must resolve none at all.
       */
      label: '  …and the composition layer resolves it to a real length (0 for plain)',
      expected: 'true,true,true,0',
      actual: across(s => (s.key === 'plain' ? s.innerRhythm : s.innerRhythm > 0))
    },
    {
      label: 'the heading renders as an <h2> carrying `heading` verbatim',
      expected: `1|${BAND_HEADING}`,
      actual: stack ? `${stack.headingCount}|${stack.headingText}` : 'missing'
    },
    {
      label: '  …and no <h2> at all when `heading` is not given',
      expected: 0,
      actual: plain?.headingCount ?? 'missing'
    },
    {
      /*
       * Residual #164. A bare `<section>` is not a landmark: `region` is one of
       * the roles HTML-AAM gates on an accessible name, so a band that rendered
       * a visible heading and wired nothing to it was a generic container that
       * never appeared in the landmark list. Both halves in one row, because
       * the negative is the load-bearing half — a component that named every
       * band, heading or not, would ship a dangling idref.
       */
      label: '  …and a heading gives the band an accessible name (none without one)',
      expected: `${BAND_HEADING}|absent`,
      actual: `${stack?.accessibleName ?? 'missing'}|${plain?.accessibleName ?? 'missing'}`
    },
    {
      label: '`label` reaches the root as data-label',
      expected: BAND_LABEL,
      actual: stack?.dataLabel ?? 'missing'
    },

    // --- 2. data-measure, honoured universally (issue 05) -------------------
    {
      label: '`measure` reaches the inner box as data-measure',
      expected: 'narrow',
      actual: measured?.innerMeasure ?? 'missing'
    },
    {
      label: '  …and really caps the box, at the same length a bare reference gets',
      expected: expectedMeasure,
      actual: measured?.innerMaxInlineSize ?? 'missing'
    },

    // --- 3. fullWidth — DEFECT 1 -------------------------------------------
    {
      label: 'fullWidth=true breaks OUT of its parent’s content box',
      expected: 'true',
      actual: fullOn ? String(fullOn.width > fullOn.parentWidth + 1) : 'missing'
    },
    {
      label: `  …by a lot — the frame is deliberately narrow (band vs parent, px)`,
      expected: 'wider',
      actual: fullOn
        ? (fullOn.width >= fullOn.parentWidth * 1.5
            ? 'wider'
            : `${Math.round(fullOn.width)} vs ${Math.round(fullOn.parentWidth)}`)
        : 'missing'
    },
    {
      label: '  …reaching at least the viewport width',
      expected: 'true',
      actual: fullOn ? String(fullOn.width >= window.innerWidth - 1) : 'missing'
    },
    {
      label: 'fullWidth=false does NOT break out — it is its parent’s width',
      expected: 'true',
      actual: fullOff ? String(Math.abs(fullOff.width - fullOff.parentWidth) <= 1) : 'missing'
    },
    {
      label: '  …so the pair is visibly different (the defect was that it was not)',
      expected: 'true',
      actual: fullOn && fullOff ? String(fullOn.width > fullOff.width + 1) : 'missing'
    },
    {
      label: 'the break-out is a class, not an inline style',
      expected: 'bf-section bf-section--full-width|false',
      actual: fullOn ? `${fullOn.rootClasses}|${fullOn.inlineStyle}` : 'missing'
    },

    // --- 4. padded — a rule and a variable, never an inline style -----------
    {
      label: 'padded=true gives the band the wireframe’s own band padding (--space-3xl)',
      expected: expectedPadding,
      actual: padded?.paddingBlock ?? 'missing'
    },
    {
      label: '  …and padded=false gives it none',
      expected: '0px',
      actual: unpadded?.paddingBlock ?? 'missing'
    },
    {
      label: '  …applied by a modifier class, with no inline style on either band',
      expected: 'bf-section bf-section--padded|false|false',
      actual: padded && unpadded
        ? `${padded.rootClasses}|${padded.inlineStyle}|${unpadded.inlineStyle}`
        : 'missing'
    },
    {
      label: '--_bf-section-padding-block is declared in the rule, from a space token',
      expected: 'var(--space-3xl)',
      actual: paddingHook || 'not declared'
    },

    // --- 5. no prop leaks — DEFECT 2 ---------------------------------------
    {
      label: 'a bogus prop-shaped attribute (image-left) is DROPPED, not rendered',
      expected: 'null',
      actual: String(attrsBand?.getAttribute('image-left'))
    },
    {
      label: '  …and no element anywhere carries an image-left-shaped attribute',
      expected: 0,
      actual: bogusAttrNames.length === 0 ? 0 : bogusAttrNames.join(' ')
    },
    {
      label: 'no <section class="bf-section"> carries an attribute named after a prop',
      expected: 0,
      actual: leakedPropAttrs.length === 0 ? 0 : leakedPropAttrs.join(' ')
    },
    {
      label: '  …checked across every band on the page',
      expected: ALL_CASES.length,
      actual: bands.length
    },

    // --- 6. …while $attrs still composes from outside (ADR-1) ---------------
    {
      label: 'a real data-testid DOES reach the <section>',
      expected: 'probe-39-attrs',
      actual: String(attrsBand?.getAttribute('data-testid'))
    },
    {
      label: '  …as does `id` (about.vue passes one to every wf-section it anchors)',
      expected: 'attrs-band',
      actual: String(attrsBand?.getAttribute('id'))
    },
    {
      label: '  …and a caller’s class MERGES with bf-section rather than replacing it',
      expected: 'true',
      actual: String(
        (attrsBand?.classList.contains('bf-section') ?? false)
        && (attrsBand?.classList.contains('probe__marker') ?? false)
      )
    },
    {
      label: 'the root’s full attribute list is exactly what the component intends',
      /*
       * Spelled out rather than counted: this is the row a future regression
       * would trip. The scoped-style attribute is Vue's, not a leak.
       */
      expected: 'class,data-label,data-probe-case,data-testid,id',
      actual: attrsBand
        ? Array.from(attrsBand.attributes)
            .map(a => a.name)
            .filter(n => !n.startsWith('data-v-'))
            .sort()
            .join(',')
        : 'missing'
    },

    // --- 7. nested bfAccordion — the D-31.1 follow-up -----------------------
    {
      label: 'a bfAccordion mounts inside a band (D-31.1 follow-up, closed here)',
      expected: 'true',
      actual: String(accordion !== null)
    },
    {
      label: '  …and is no wider than the band’s own inner box',
      expected: 'true',
      actual: accordion && nestedInner
        ? String(
            accordion.getBoundingClientRect().width
            <= nestedInner.getBoundingClientRect().width + 1
          )
        : 'missing'
    },
    {
      label: '  …with no horizontal overflow in the band that holds it',
      expected: 'true',
      actual: nested && nestedInner
        ? String(nestedInner.scrollWidth <= nestedInner.clientWidth + 1)
        : 'missing'
    },

    // --- 8. layer, colour, D-20.5 ------------------------------------------
    {
      label: '.bf-section rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(rule !== null)
    },
    {
      label: 'the component’s own rule declares no colour of any kind',
      expected: 'none',
      actual: declared.length === 0 ? 'none' : declared.join(' ')
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
    data-probe="39"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 39 — <code>bfSection</code></h1>

    <p class="probe__lede">
      Every <code>layout</code> value, a <code>fullWidth</code> on/off pair
      measured against its own parent, a <code>padded</code> case, and one band
      handed a real <code>data-testid</code> alongside a bogus
      <code>image-left</code> to prove the prop-leak defect is closed.
    </p>

    <!--
      The measured references. `--space-3xl` and the `narrow` measure both
      resolve to lengths the CSSOM never reports back as written, so the rows
      compare two *computed* values rather than string-matching an expression.
    -->
    <div class="probe__ref-pad" data-probe-ref-pad aria-hidden="true" />
    <div data-measure="narrow" data-probe-ref-measure aria-hidden="true" />

    <section class="probe__gallery" aria-labelledby="layouts-heading">
      <h2 id="layouts-heading">Four layouts</h2>

      <bfSection
        v-for="l in LAYOUTS"
        :key="l.key"
        :layout="l.key"
        :label="l.key === 'stack' ? BAND_LABEL : l.note"
        :heading="l.key === 'plain' ? undefined : BAND_HEADING"
        :data-probe-case="l.key"
      >
        <p>{{ BODY }}</p>
        <p><code>layout="{{ l.key }}"</code> — {{ l.note }}</p>
      </bfSection>
    </section>

    <section class="probe__gallery" aria-labelledby="measure-heading">
      <h2 id="measure-heading">Measure, padding, and the nested accordion</h2>

      <bfSection label="Body" measure="narrow" data-probe-case="measure">
        <p>{{ BODY }}</p>
      </bfSection>

      <bfSection label="Padded" :padded="true" data-probe-case="padded">
        <p>{{ BODY }}</p>
      </bfSection>

      <bfSection label="Unpadded" data-probe-case="unpadded">
        <p>{{ BODY }}</p>
      </bfSection>

      <!--
        D-31.1's follow-up: probe 31 could not nest its accordion in a
        `bfSection` because this component did not exist yet, and its spec left
        the gap to be closed from this side. No change to `bfAccordion` was
        needed.
      -->
      <bfSection label="By year" heading="Archive" data-probe-case="nested">
        <bfAccordion label="2019">
          <p>{{ BODY }}</p>
        </bfAccordion>
      </bfSection>
    </section>

    <section class="probe__gallery" aria-labelledby="breakout-heading">
      <h2 id="breakout-heading">
        <code>fullWidth</code> — the defect, fixed
      </h2>
      <p class="probe__note">
        Both bands below sit in the same deliberately narrow frame. The first
        stays inside it; the second breaks out to the viewport edges. Upstream
        the prop had no CSS at all, so the two were identical.
      </p>

      <!--
        The frame is the containing block the break-out rule's `50%` resolves
        against, so it must be the band's *direct* parent — hence one frame per
        band rather than one around both.
      -->
      <div class="probe__frame">
        <bfSection label="fullWidth=false" data-probe-case="full-off">
          <p>Contained — this band is exactly as wide as its frame.</p>
        </bfSection>
      </div>

      <div class="probe__frame">
        <bfSection label="fullWidth=true" :full-width="true" data-probe-case="full-on">
          <p>Broken out — this band spans the viewport.</p>
        </bfSection>
      </div>
    </section>

    <section class="probe__gallery" aria-labelledby="attrs-heading">
      <h2 id="attrs-heading">Attributes in, junk out</h2>

      <!--
        `image-left` is the inventory's own example of the leak: a prop-shaped
        attribute rendered literally on the `<section>`. It is passed here
        exactly as a careless call site would pass it, and must not survive —
        while `id`, `class` and `data-*` beside it must.

        Written as a static attribute, not a binding, so it is the raw markup
        case rather than a value Vue could coerce away.
      -->
      <bfSection
        id="attrs-band"
        class="probe__marker"
        label="Attrs"
        image-left
        data-testid="probe-39-attrs"
        data-probe-case="attrs"
      >
        <p>
          This band was given <code>image-left</code>, <code>id</code>,
          <code>class</code>, <code>data-testid</code> and a
          <code>label</code> prop. Four of the five belong on the DOM.
        </p>
      </bfSection>
    </section>

    <section class="probe__report" aria-labelledby="report-heading">
      <h2 id="report-heading">Report</h2>

      <p
        class="probe__verdict"
        :data-state="state"
        data-testid="probe-39-verdict"
      >
        {{ verdict }}
      </p>

      <table class="probe__table" data-testid="probe-39-table">
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
        <li v-for="l in LAYOUTS" :key="l.key">
          <code>{{ l.key }}</code> — {{ l.note }}
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

  /*
    `100vw` includes the vertical scrollbar's gutter, so the broken-out band is
    a scrollbar's width wider than the layout viewport and would give this page
    a horizontal scrollbar. `clip` — not `hidden`, which would force a scroll
    container and is not allowed on one axis alone — hides that overflow
    without touching layout: `getBoundingClientRect()` still reports the band's
    full `100vw`, which is what the break-out rows read. The caveat itself is
    recorded in the spec's Decisions, hooked on `--_bf-section-full-width`.
  */
  overflow-x: clip;
}

.probe__gallery > .bf-section,
.probe__frame {
  outline: 1px dashed currentcolor;
  outline-offset: -1px;
}

.probe__lede,
.probe__note {
  max-inline-size: 75ch;
}

/*
  The narrow containing block the break-out pair is measured against. `50%` in
  the break-out rule resolves against this box's content width, so it must be
  the band's direct parent and it must be meaningfully narrower than the
  viewport for the comparison to mean anything.
*/
.probe__frame {
  max-inline-size: 32rem;
  margin-inline: auto;
  margin-block: var(--space-m, 1.5rem);
}

/*
  The measured reference for `--space-3xl`, the band padding `padded` applies.
  Zero inline size so it contributes no layout of its own.
*/
.probe__ref-pad {
  padding-block: var(--space-3xl);
  inline-size: 0;
  position: absolute;
  visibility: hidden;
}

[data-probe-ref-measure] {
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
