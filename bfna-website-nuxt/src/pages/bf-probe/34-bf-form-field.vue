<script setup lang="ts">
/**
 * Probe — issue 34 / gh#43: `bfFormField` + `bfFormGroup`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## Why one group, and why all seven fields are inside it
 *
 * The spec's demo requirement is literal — "text/email/textarea fields in
 * default, required, hint and error states, **all inside one `bfFormGroup`**"
 * — and it is the interdependent-components rule (BRIEF §5 rule 5) doing its
 * job: this pair was allowed to be one issue on the argument that neither half
 * can be demonstrated alone, so a demo that put the fields anywhere but inside
 * the group would have quietly given up the thing the bundle was granted for.
 *
 * One consequence worth stating: the page therefore contains exactly one
 * `<fieldset>` and one `<legend>`, which is what makes the spec's own static
 * checks against the prerendered HTML mean something rather than merely pass.
 * For the same reason this probe has no case switcher of its own: probe 33's
 * `<fieldset>` of radios would have put a second fieldset on the page and made
 * `grep -q "<fieldset"` a statement about the probe's chrome rather than about
 * the component. All seven fields are mounted at once instead, which they can
 * be — unlike `bfEmptyState`, nothing here renders an `<h1>`.
 *
 * ## What it proves
 *
 *  1. **The group is a real `<fieldset>` with a real `<legend>`** carrying the
 *     `legend` prop verbatim, and it lays out as a flex column.
 *  2. **Every control is associated with a label by `for`/`id`** — asserted
 *     through `HTMLLabelElement.control`, the browser's own resolution of the
 *     association, not a string comparison of two attributes that could both
 *     be wrong in the same way. Every id on the page is unique.
 *  3. **`aria-describedby` carries BOTH ids when both a hint and an error are
 *     present**, space-separated and hint-first, each resolving to an element
 *     that exists and holds the right text. The single-reference and
 *     no-reference cases are checked in the same row, so an implementation
 *     that treated the two as alternatives fails here rather than in review.
 *  4. **`aria-invalid="true"` appears only where `error` is set** — never
 *     `"false"`, never on a merely-`required` field.
 *  5. **A typing round-trip updates the model, and the model reaches the
 *     control** — `<input>` and `<textarea>` alike, which is the branch a
 *     dynamic `<component :is>` would have got wrong (a textarea's value is
 *     its content, not an attribute).
 *  6. **`type` maps to the right element**: `'textarea'` → `<textarea>`,
 *     everything else → `<input type="…">`.
 *  7. **The control shows a visible focus ring.** The global `:focus-visible`
 *     rule for form controls (#146) has not landed on `dev`, and
 *     `base/forms.css`'s `:focus` rule writes `outline: none`; the component
 *     declares its own. Checked three ways: the rule exists in
 *     `@layer components` in the live CSSOM, its *emitted* declarations carry
 *     a real outline, an offset, the halo and no `currentcolor`, and — when
 *     this browsing context has focus — the ring is **measured** on a focused
 *     control. The measurement is gated because no focus pseudo-class matches
 *     while `document.hasFocus()` is false; see `typed.focusChecked`.
 *  8. **The gap hook works from both directions**: `data-gap` flows through
 *     `@layer composition` into `--_bf-form-group-gap`, and a call-site
 *     `--_bf-form-group-gap` overrides it. Measured against reference
 *     elements, because the space tokens resolve to `clamp()`.
 *  9. **The error colour is `--color-error`**, resolved and compared against a
 *     reference rather than string-matched — no new colour (DoD-6).
 * 10. `.bf-form-field` / `.bf-form-group` rules are inside `@layer components`
 *     in the live CSSOM, neither component emits an inline `style` of its own,
 *     `$attrs` reaches the **control** (not the wrapper) while `class` reaches
 *     the wrapper, and no `bf-*` rule uses `:not()` with a complex selector
 *     (D-20.5).
 *
 * ## axe
 *
 * The spec asks for "axe reports no violations" and flags in the same breath
 * that no axe tooling is wired into this repo. It still is not, and this issue
 * does not add it (that would be a tooling change smuggled into a component
 * issue). What the rows below encode instead is the set of checks axe would
 * actually run against this page — label association, `aria-describedby`
 * targets resolving, `aria-invalid` values being valid, id uniqueness, and a
 * visible focus indicator. Recorded in the spec's Decisions section.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 34`,
 * per the gh#20–#42 precedent and the #109 harness decision.
 */
defineOptions({ name: 'BfProbe34BfFormField' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 34 — bfFormField / bfFormGroup'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/** One field in the group. */
interface Case {
  key: string
  label: string
  type: string
  required: boolean
  hint?: string
  error?: string
  /** Initial value — real copy, not lorem (BRIEF §5 rule 10). */
  value: string
  /** Extra attributes, to prove `$attrs` lands on the control. */
  rows?: number
}

/**
 * The seven fields. The three the wireframe actually carries — Name (text),
 * Email (email), Message (textarea) — are present under their own labels
 * (`wfContactSection.vue:8-10`, frozen), and the remaining four are the
 * states the spec names: required, hint, error, and hint **and** error
 * together.
 */
const CASES: Case[] = [
  {
    key: 'text-default',
    label: 'Name',
    type: 'text',
    required: false,
    value: ''
  },
  {
    key: 'email-required',
    label: 'Email',
    type: 'email',
    required: true,
    value: ''
  },
  {
    key: 'text-hint',
    label: 'Organisation',
    type: 'text',
    required: false,
    hint: 'Optional — the institution you are writing on behalf of.',
    value: 'Bertelsmann Foundation North America'
  },
  {
    key: 'email-error',
    label: 'Work email',
    type: 'email',
    required: true,
    error: 'Enter an email address in the form name@example.org.',
    value: 'info@'
  },
  {
    key: 'text-hint-error',
    label: 'Postal code',
    type: 'text',
    required: true,
    hint: 'Five digits, or a six-character Canadian code.',
    error: 'That does not look like a postal code.',
    value: '200'
  },
  {
    key: 'textarea-default',
    label: 'Message',
    type: 'textarea',
    required: false,
    rows: 4,
    value: ''
  },
  {
    key: 'textarea-required-error',
    label: 'Why are you getting in touch?',
    type: 'textarea',
    required: true,
    hint: 'A sentence or two is plenty.',
    error: 'Tell us a little about your enquiry before sending.',
    rows: 4,
    value: ''
  }
]

/**
 * The live model, one string per case.
 *
 * Bound as an explicit `:model-value` + `@update:model-value` pair rather than
 * as `v-model="model[c.key]"`. The two are the same contract — `v-model` *is*
 * that pair — but this project compiles with `noUncheckedIndexedAccess`, under
 * which an index into a `Record` is `string | undefined` and so is not a legal
 * `v-model` target for a prop typed `string`. Writing the pair out keeps the
 * emit under test and the types honest at once.
 */
const model = reactive<Record<string, string>>(
  Object.fromEntries(CASES.map(c => [c.key, c.value]))
)

const modelOf = (key: string): string => model[key] ?? ''

const setModel = (key: string, value: string): void => {
  model[key] = value
}

/** The group's legend, read back from the DOM by an assertion below. */
const LEGEND = 'Contact the foundation'

/**
 * The group's `data-gap`, and a call-site override of the hook. Both are
 * driven by the walk and then left at their defaults for a human reader.
 */
const groupGap = ref<string>('s')
const groupStyle = ref<Record<string, string> | undefined>(undefined)

const checks = ref<Check[]>([])

/**
 * Walk every reachable stylesheet — `@import`ed ones included, since
 * `/css/styles.css` is nothing but a list of imports — for a style rule whose
 * selector matches and whose ancestry includes a `@layer components` block.
 * Cross-origin sheets throw on `cssRules`; they are skipped, not failed. Same
 * helper as probes 14–33.
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

/**
 * One tick — a re-render, and nothing else to wait for.
 *
 * Deliberately not `requestAnimationFrame`: rAF is throttled to a near stop in
 * a backgrounded or embedded browser view, and a walk that awaits a frame that
 * never arrives leaves the verdict `PENDING` for ever (probe 33's note, and
 * the zero-width-viewport case in `docs/decisions/probe-harness.md`).
 * `getComputedStyle` forces style recalculation on demand, so every
 * measurement below is correct as soon as Vue has patched the DOM.
 */
const settle = (): Promise<void> => nextTick()

/**
 * The control for one case — `<input>` or `<textarea>`, whichever rendered.
 *
 * Looked up by `data-probe-case`, which the probe passes as an ordinary
 * attribute and the component therefore routes to **the control**: `$attrs`
 * minus `class`/`style` lands on the `<input>`/`<textarea>`, not on the
 * wrapper. That routing is itself asserted below; here it is simply used, so
 * a regression in it fails several rows at once rather than none.
 */
const controlOf = (key: string): HTMLInputElement | HTMLTextAreaElement | null =>
  document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `.bf-form-field__control[data-probe-case="${key}"]`
  )

/** …and the wrapper it sits in, reached from the control rather than named directly. */
const rootOf = (key: string): HTMLElement | null =>
  controlOf(key)?.closest<HTMLElement>('.bf-form-field') ?? null

const labelOf = (key: string): HTMLLabelElement | null =>
  rootOf(key)?.querySelector<HTMLLabelElement>('label') ?? null

/** A row's value for every case, in `CASES` order — one string to compare. */
const across = (read: (c: Case) => string | number | boolean): string =>
  CASES.map(c => String(read(c))).join(',')

/** The same shape, read from the DOM instead of from the expectations. */
const observed = (
  read: (control: HTMLInputElement | HTMLTextAreaElement | null, c: Case) => string | number | boolean
): string => CASES.map(c => String(read(controlOf(c.key), c))).join(',')

/** Has the walk been started? Have the rows been published? */
let walking = false
let reported = false

/** Set when the safety net published the rows instead of the walk. */
const seen = reactive({ timedOut: false })

/** What the interaction walk found, filled in before `report()` reads it. */
const typed = reactive({
  /** `model` after typing into the text control, then into the textarea. */
  inputModel: '',
  textareaModel: '',
  /** The control's own value after Vue re-rendered from the model. */
  inputValue: '',
  textareaValue: '',
  /** `:focus-visible` and the resolved ring on a focused control. */
  focusVisible: false,
  outlineStyle: '',
  outlineWidth: '',
  /**
   * Did this browsing context have focus when the ring was measured?
   *
   * `:focus` — and therefore `:focus-visible` — does not match anything while
   * `document.hasFocus()` is false, however the element was focused: the
   * element stays `document.activeElement`, but no focus pseudo-class applies,
   * so `getComputedStyle` reports the resting `outline: none` that
   * `base/forms.css` declares. That is a true statement about an unfocused
   * window and a false one about the component.
   *
   * Found by opening this page in a background browser pane during gh#43 —
   * the same class of environment-dependence
   * `docs/decisions/probe-harness.md` records for rAF and for zero-width
   * viewports, and the reason the measured row below is gated on this flag
   * while the CSSOM rows next to it are not.
   */
  focusChecked: false,
  /** The measured gap between two fields, at each of the three settings. */
  gapDefault: '',
  gapLarge: '',
  gapOverridden: ''
})

const TYPED_INPUT = 'Irene Braam'
const TYPED_TEXTAREA = 'A question about the Transatlantic Periscope.'

const finalise = async () => {
  if (walking) return
  walking = true

  // --- 1. the typing round-trip -------------------------------------------
  const input = controlOf('text-default')
  if (input) {
    input.value = TYPED_INPUT
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    typed.inputModel = model['text-default'] ?? ''
    typed.inputValue = (controlOf('text-default')?.value) ?? ''
  }

  const area = controlOf('textarea-default')
  if (area) {
    area.value = TYPED_TEXTAREA
    area.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    typed.textareaModel = model['textarea-default'] ?? ''
    typed.textareaValue = (controlOf('textarea-default')?.value) ?? ''
  }

  // --- 2. the focus ring ---------------------------------------------------
  /*
   * A text control matches `:focus-visible` whenever it is focused, however it
   * was focused — the spec's own carve-out for elements that take keyboard
   * input — so a programmatic `.focus()` is a faithful test here and does not
   * need a synthesised Tab.
   */
  const focusTarget = controlOf('email-required')
  if (focusTarget) {
    focusTarget.focus()
    await settle()
    typed.focusChecked = document.hasFocus()
    typed.focusVisible = focusTarget.matches(':focus-visible')
    const style = getComputedStyle(focusTarget)
    typed.outlineStyle = style.outlineStyle
    typed.outlineWidth = style.outlineWidth
    focusTarget.blur()
    await settle()
  }

  // --- 3. the gap, from both directions ------------------------------------
  /*
   * Measured on the SECOND field's `margin-block-start`, which is what
   * `.stack`'s `> * + *` mechanism (and this component's replacement of it)
   * actually writes. The legend is the first child and never receives one.
   */
  const gapOf = (): string => {
    const second = rootOf(CASES[1]?.key ?? '')
    return second ? getComputedStyle(second).marginBlockStart : 'no field'
  }

  await settle()
  typed.gapDefault = gapOf()

  groupGap.value = 'l'
  await settle()
  typed.gapLarge = gapOf()

  groupStyle.value = { '--_bf-form-group-gap': '0px' }
  await settle()
  typed.gapOverridden = gapOf()

  // Back to the declared defaults for whoever opens the page.
  groupStyle.value = undefined
  groupGap.value = 's'
  await settle()

  report()
}

const report = () => {
  if (reported) return
  reported = true

  const group = document.querySelector<HTMLElement>('.bf-form-group')
  const legend = group?.querySelector('legend') ?? null
  const groupStyleNow = group ? getComputedStyle(group) : null

  // --- reference lengths and colours ---------------------------------------
  const spaceS = document.querySelector<HTMLElement>('[data-probe-ref="space-s"]')
  const spaceL = document.querySelector<HTMLElement>('[data-probe-ref="space-l"]')
  const errorRef = document.querySelector<HTMLElement>('[data-probe-ref="color-error"]')
  const expectedS = spaceS ? getComputedStyle(spaceS).marginBlockStart : 'no reference'
  const expectedL = spaceL ? getComputedStyle(spaceL).marginBlockStart : 'no reference'
  const expectedError = errorRef ? getComputedStyle(errorRef).color : 'no reference'

  // --- ids -----------------------------------------------------------------
  const ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id)
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i)

  // --- the two component rules ---------------------------------------------
  const fieldRule = layeredRule(s => /\.bf-form-field(?![\w-])/.test(s))
  const groupRule = layeredRule(s => /\.bf-form-group(?![\w-])/.test(s))
  /*
   * `[^,{]*` between the class and the pseudo-class, not a bare concatenation:
   * `FormField.vue`'s block is `scoped`, and Vue's scoped-CSS transform writes
   * the scope attribute BEFORE any pseudo-class — `.bf-form-field__control`
   * `[data-v-…]:focus-visible`, never `…:focus-visible[data-v-…]`. A selector
   * regex that assumed the two were adjacent found nothing and reported a
   * missing focus rule for a component that had one.
   */
  const focusRule = layeredRule(s => /\.bf-form-field__control[^,{]*:focus-visible/.test(s))
  const focusText = focusRule?.style.cssText ?? ''
  const badNots = complexNotSelectors()

  const hintError = controlOf('text-hint-error')
  const describedByTokens = (hintError?.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean)
  const describedByResolves = describedByTokens.every(id => document.getElementById(id) !== null)
  const describedByText = describedByTokens
    .map(id => (document.getElementById(id)?.textContent ?? '').trim())
    .join(' | ')

  const errorCase = CASES.find(c => c.key === 'text-hint-error') as Case
  const errorEl = rootOf('text-hint-error')?.querySelector<HTMLElement>('.bf-form-field__error') ?? null

  checks.value = [
    // --- 0. did the walk run? ----------------------------------------------
    {
      label: 'the interaction walk completed, rather than being rescued by the timeout',
      expected: 'false',
      actual: String(seen.timedOut)
    },

    // --- 1. the group -------------------------------------------------------
    {
      label: 'the group is a real <fieldset>',
      expected: 'FIELDSET',
      actual: group?.tagName ?? 'missing'
    },
    {
      label: '  …with a <legend> carrying the `legend` prop verbatim',
      expected: `LEGEND|${LEGEND}`,
      actual: legend ? `${legend.tagName}|${(legend.textContent ?? '').trim()}` : 'missing'
    },
    {
      label: 'exactly one <fieldset> and one <legend> on the page — every field is inside the group',
      expected: '1,1',
      actual: [
        document.querySelectorAll('fieldset').length,
        document.querySelectorAll('legend').length
      ].join(',')
    },
    {
      label: 'the group holds every one of the demo fields',
      expected: CASES.length,
      actual: group?.querySelectorAll('.bf-form-field').length ?? 'missing'
    },
    {
      label: '.stack lays the group out — a flex column',
      expected: 'flex/column',
      actual: groupStyleNow ? `${groupStyleNow.display}/${groupStyleNow.flexDirection}` : 'missing'
    },

    // --- 2. label association ----------------------------------------------
    {
      label: 'every control resolves to its label through for/id (HTMLLabelElement.control)',
      expected: CASES.map(() => true).join(','),
      actual: CASES.map(c => {
        const label = labelOf(c.key)
        const control = controlOf(c.key)
        return String(label !== null && control !== null && label.control === control)
      }).join(',')
    },
    {
      label: '  …and the label’s `for` is the control’s non-empty id',
      expected: CASES.map(() => true).join(','),
      actual: CASES.map(c => {
        const label = labelOf(c.key)
        const control = controlOf(c.key)
        const id = control?.id ?? ''
        return String(id !== '' && label?.htmlFor === id)
      }).join(',')
    },
    {
      label: 'the label text is the `label` prop (the required marker is not part of it)',
      expected: across(c => c.label),
      actual: CASES.map(c => {
        const label = labelOf(c.key)
        const marker = label?.querySelector('.bf-form-field__required')
        const text = (label?.textContent ?? '').trim()
        return marker ? text.replace(/\*$/, '') : text
      }).join(',')
    },
    {
      label: 'the required marker renders only on required fields, and is aria-hidden',
      expected: across(c => (c.required ? 'true' : 'absent')),
      actual: CASES.map(c => {
        const marker = labelOf(c.key)?.querySelector('.bf-form-field__required')
        return marker === null || marker === undefined
          ? 'absent'
          : String(marker.getAttribute('aria-hidden'))
      }).join(',')
    },
    {
      label: 'the `required` attribute is on the control itself',
      expected: across(c => c.required),
      actual: observed(control => control?.required ?? 'missing')
    },
    {
      label: 'every id on the page is unique',
      expected: 0,
      actual: duplicateIds.length === 0 ? 0 : duplicateIds.join(' ')
    },

    // --- 3. aria-describedby ------------------------------------------------
    {
      label: 'aria-describedby is absent when there is neither hint nor error',
      expected: across(c => (c.hint === undefined && c.error === undefined ? 'absent' : 'present')),
      actual: observed(control =>
        control?.getAttribute('aria-describedby') === null ? 'absent' : 'present'
      )
    },
    {
      label: '  …and carries exactly one id per present hint/error, hint FIRST',
      expected: across(c =>
        [c.hint ? 'hint' : '', c.error ? 'error' : ''].filter(Boolean).join('+') || 'none'
      ),
      actual: observed((control, c) => {
        const value = control?.getAttribute('aria-describedby')
        if (!value) return 'none'
        const base = control?.id ?? ''
        return value
          .split(' ')
          .map(id => (id === `${base}-hint` ? 'hint' : id === `${base}-error` ? 'error' : id))
          .join('+')
      })
    },
    {
      label: 'the hint+error case yields a TWO-id aria-describedby',
      expected: 2,
      actual: describedByTokens.length
    },
    {
      label: '  …both ids resolving to elements that exist',
      expected: 'true',
      actual: String(describedByResolves)
    },
    {
      label: '  …whose text is the hint then the error, in that order',
      expected: `${errorCase.hint} | ${errorCase.error}`,
      actual: describedByText
    },

    // --- 4. aria-invalid ----------------------------------------------------
    {
      label: 'aria-invalid="true" only where `error` is set — never "false", never on merely-required',
      expected: across(c => (c.error ? 'true' : 'absent')),
      actual: observed(control => control?.getAttribute('aria-invalid') ?? 'absent')
    },
    {
      label: 'the error message renders, and carries the `error` string',
      expected: errorCase.error ?? '',
      actual: (errorEl?.textContent ?? '').trim()
    },

    // --- 5. the element the `type` prop chooses -----------------------------
    {
      label: 'type="textarea" renders <textarea>; every other type renders <input type="…">',
      expected: across(c => (c.type === 'textarea' ? 'TEXTAREA' : `INPUT:${c.type}`)),
      actual: observed(control =>
        control === null
          ? 'missing'
          : control.tagName === 'TEXTAREA'
            ? 'TEXTAREA'
            : `INPUT:${(control as HTMLInputElement).type}`
      )
    },
    {
      label: '$attrs reaches the CONTROL (rows="4" on the two textareas), not the wrapper',
      expected: across(c => c.rows ?? 'absent'),
      actual: observed(control => control?.getAttribute('rows') ?? 'absent')
    },
    {
      label: '  …data-probe-case likewise lands on the control, and on nothing else',
      expected: CASES.map(() => true).join(','),
      actual: CASES.map(c =>
        String(document.querySelectorAll(`[data-probe-case="${c.key}"]`).length === 1
          && controlOf(c.key) !== null)
      ).join(',')
    },
    {
      label: '  …while `class` reaches the WRAPPER (and is not copied onto the control)',
      expected: CASES.map(() => 'true/false').join(','),
      actual: CASES.map(c => [
        rootOf(c.key)?.classList.contains('probe__marker') ?? false,
        controlOf(c.key)?.classList.contains('probe__marker') ?? false
      ].join('/')).join(',')
    },

    // --- 6. the typing round-trip ------------------------------------------
    {
      label: 'typing into the <input> updates the bound model',
      expected: TYPED_INPUT,
      actual: typed.inputModel
    },
    {
      label: '  …and the model reaches the control',
      expected: TYPED_INPUT,
      actual: typed.inputValue
    },
    {
      label: 'typing into the <textarea> updates the bound model',
      expected: TYPED_TEXTAREA,
      actual: typed.textareaModel
    },
    {
      label: '  …and the model reaches the textarea (whose value is content, not an attribute)',
      expected: TYPED_TEXTAREA,
      actual: typed.textareaValue
    },

    // --- 7. the focus ring --------------------------------------------------
    /*
     * Two CSSOM rows and one measured row, in that order and deliberately.
     *
     * The measured row is the stronger evidence and it is the one that cannot
     * run everywhere: no focus pseudo-class matches while
     * `document.hasFocus()` is false, so a page opened in a background pane
     * would report the resting `outline: none` and fail a component that is
     * correct. It is therefore gated, and the two rows above it — read off the
     * *emitted* CSS, not the source — carry the check in the contexts where
     * the measurement cannot. The harness runs the page focused, so the
     * measurement is what gates the PR.
     */
    {
      label: 'a :focus-visible rule for the control exists in @layer components',
      expected: 'true',
      actual: String(focusRule !== null)
    },
    {
      label: '  …declaring a real outline + offset + halo, and NOT currentcolor (gh#24-P2-1)',
      expected: 'outline/offset/shadow/not-currentcolor',
      actual: [
        /(^|;|\s)outline\s*:/.test(focusText) && !/outline\s*:\s*none/.test(focusText) ? 'outline' : 'no-outline',
        /outline-offset/.test(focusText) ? 'offset' : 'no-offset',
        /box-shadow/.test(focusText) ? 'shadow' : 'no-shadow',
        /currentcolor/i.test(focusText) ? 'currentcolor' : 'not-currentcolor'
      ].join('/')
    },
    {
      label: 'a focused control matches :focus-visible and paints a solid 2px ring (measured)',
      expected: typed.focusChecked
        ? 'true/solid/2px'
        : 'skipped — document.hasFocus() was false, no focus pseudo-class can match',
      actual: typed.focusChecked
        ? `${typed.focusVisible}/${typed.outlineStyle}/${typed.outlineWidth}`
        : 'skipped — document.hasFocus() was false, no focus pseudo-class can match'
    },

    // --- 8. the gap hook, from both directions ------------------------------
    {
      label: 'data-gap="s" spaces the fields at --space-s (measured)',
      expected: expectedS,
      actual: typed.gapDefault
    },
    {
      label: '  …and data-gap="l" flows through @layer composition into the hook',
      expected: expectedL,
      actual: typed.gapLarge
    },
    {
      label: '  …while --_bf-form-group-gap overrides it from the call site',
      expected: '0px',
      actual: typed.gapOverridden
    },

    // --- 9. colour ----------------------------------------------------------
    {
      label: 'the error text resolves to --color-error (measured — no new colour)',
      expected: expectedError,
      actual: errorEl ? getComputedStyle(errorEl).color : 'missing'
    },

    // --- 10. layer, inline style, D-20.5 ------------------------------------
    {
      label: '.bf-form-field rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(fieldRule !== null)
    },
    {
      label: '.bf-form-group rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(groupRule !== null)
    },
    {
      label: 'neither component contributes an inline style of its own',
      expected: 'false,false',
      actual: [
        CASES.some(c => (rootOf(c.key)?.style.cssText.trim() ?? '') !== ''),
        (group?.style.cssText.trim() ?? '') !== ''
      ].join(',')
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
    `data-probe-row` + `data-ok`.
  -->
  <main
    class="probe container"
    data-probe="34"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 34 — <code>bfFormField</code> + <code>bfFormGroup</code></h1>

    <p class="probe__lede">
      The two form molecules, demoed together as BRIEF §5 rule 5 requires —
      seven fields covering text, email and textarea in default, required,
      hint, error and hint-<em>and</em>-error states, <strong>all inside one
        <code>bfFormGroup</code></strong>. There is no
      <code>&lt;form&gt;</code> and no submit button: both belong to issue 44's
      organism, not to these two.
    </p>

    <!--
      The demo. One group; nothing else on this page is a fieldset, which is
      what makes the spec's `grep -q "<fieldset"` check a statement about the
      component rather than about the probe's own chrome.
    -->
    <div data-probe-stage>
      <bfFormGroup
        :legend="LEGEND"
        :data-gap="groupGap"
        :style="groupStyle"
      >
        <bfFormField
          v-for="c in CASES"
          :key="c.key"
          class="probe__marker"
          :model-value="modelOf(c.key)"
          :label="c.label"
          :type="c.type"
          :required="c.required"
          :hint="c.hint"
          :error="c.error"
          :rows="c.rows"
          :data-probe-case="c.key"
          @update:model-value="(v: string) => setModel(c.key, v)"
        />
      </bfFormGroup>
    </div>

    <!--
      Reference elements. The space tokens resolve to `clamp()` and the colour
      token to a `hsl()` chain, so the gap and colour rows compare two
      *computed* values rather than string-matching an expression that never
      resolves in the CSSOM.
    -->
    <div aria-hidden="true" class="probe__refs">
      <div class="probe__ref" data-probe-ref="space-s" />
      <div class="probe__ref" data-probe-ref="space-l" />
      <div class="probe__ref" data-probe-ref="color-error" />
    </div>

    <section class="probe__report" aria-labelledby="probe-title">
      <h2 id="probe-title">Assertions</h2>

      <p
        class="probe__verdict"
        :data-state="state"
        data-testid="probe-34-verdict"
      >
        {{ verdict }}
      </p>

      <table class="probe__table" data-testid="probe-34-table">
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
  margin-block: var(--space-m, 1.5rem);
}

.probe__lede {
  max-inline-size: 75ch;
}

/*
  Zero-height reference boxes. The two space refs contribute nothing but the
  margin the gap rows compare against; the colour ref contributes nothing but a
  resolved `color`.
*/
.probe__refs {
  block-size: 0;
  overflow: hidden;
}

.probe__ref {
  block-size: 0;
}

.probe__ref[data-probe-ref='space-s'] {
  margin-block-start: var(--space-s);
}

.probe__ref[data-probe-ref='space-l'] {
  margin-block-start: var(--space-l);
}

.probe__ref[data-probe-ref='color-error'] {
  color: var(--color-error);
}

.probe__report {
  margin-block-start: var(--space-l, 2rem);
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
