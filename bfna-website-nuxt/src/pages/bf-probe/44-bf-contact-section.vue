<script setup lang="ts">
/**
 * Probe — issue 44 / gh#53: `bfContactSection`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## What it proves, from props alone
 *
 *  1. **The band is `bfSection`** — one `<section>` carrying both class names,
 *     `data-label="Contact"`, an inner `center | switcher` box at
 *     `data-gap="l"`, and no inline `style`.
 *  2. **A real `<fieldset>` renders** — one per band, with a `<legend>` whose
 *     text is the `heading` prop, in the live DOM *and* in the serialised HTML
 *     the spec greps out of `.output/public`.
 *  3. **Every control is label-associated** — resolved through
 *     `HTMLLabelElement.control`, the browser's own resolution of the `for`/`id`
 *     pair, not a string comparison of two attributes that could both be wrong
 *     in the same way. Transitive: the association is `bfFormField`'s, and this
 *     asserts that composing it did not break it. Every id on the page is
 *     unique across all five bands.
 *  4. **The three controls are the wireframe's three** — `input[type=text]`,
 *     `input[type=email]`, `textarea[rows=4]`, in that order, named
 *     `name`/`email`/`message`.
 *  5. **Typing into a field updates its value** — a real `input` event on each
 *     control, read back after the model round trip settles. See the note on
 *     what this can and cannot distinguish, below.
 *  6. **Submit does not navigate** — a real click on the submit button; the
 *     document's URL is unchanged and the `submit` event reached `document`
 *     already `defaultPrevented`. The form declares no `action` and no
 *     `method`.
 *  7. **Two columns at 1200px, one at 400px** — measured, not pinned to a
 *     breakpoint: the two `.switcher` children of a band inside a 1200px box
 *     share a row, and those of a band inside a 400px box do not.
 *  8. **Copy is prop-driven** — a band with all four props overridden renders
 *     every override and no wireframe literal, the `mailto:` href tracks
 *     `email`, and an empty `address` renders no paragraph at all. The mailto
 *     anchor also carries **no class**, compared by resolved colour against a
 *     bare classless reference link: `a:not([class])` is how both
 *     `base/reset.css` and `base/typography.css` style links, so a BEM class on
 *     it would drop the anchor to the user agent's own blue.
 *  9. **Residual #155 is neutralised locally** — the band's `<fieldset>`
 *     computes `margin-bottom: 0px` while a bare reference `<fieldset>` on the
 *     same page still carries the `@layer defaults` margin, so the row proves
 *     the local rule is doing work rather than that the defaults rule is gone.
 * 10. **Cascade hygiene** — every rule anywhere in the loaded CSS that selects
 *     `bf-contact-section` is inside `@layer components`, and no `bf-*` rule
 *     uses `:not()` with a complex selector (D-20.5).
 *
 * ## What row 5 can and cannot distinguish — stated rather than implied
 *
 * `bfFormField` is controlled and `bfContactSection` holds the three strings in
 * refs of its own, so the model is **not** reachable from this page. A DOM-only
 * assertion therefore cannot separate a correctly wired `v-model` from a field
 * bound to a constant whose emit is dropped: neither re-renders after the
 * silent case, so the typed text survives either way. Two things are asserted
 * instead, and together they cover the defect shapes that actually occur:
 *
 * - the typed value survives the tick on all three controls (a field re-bound
 *   to a *different* value would be patched back — Vue's `patchDOMProp`
 *   compares against the live `el.value`, not the previous vnode);
 * - typing into one control leaves the other two empty, which is what a single
 *   shared ref behind all three fields — the copy-paste bug this shape invites
 *   — would fail.
 *
 * The decisive model round trip is already proven one level down, at the
 * `bfFormField` boundary, by probe 34, whose model lives in the page.
 *
 * ## axe
 *
 * Still no axe tooling in this repo (issue 34's own note, unchanged — wiring it
 * in would be a tooling change smuggled into a component issue). Rows 2–4
 * encode the checks axe would actually run against this page: label
 * association, group naming, id uniqueness. Recorded in the spec's Decisions.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 44`,
 * per the gh#20–#52 precedent and the #109 harness decision.
 */
defineOptions({ name: 'BfProbe44BfContactSection' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 44 — bfContactSection'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/** The five bands, and why each is on the page. */
const CASES = [
  {
    key: 'default',
    note: 'no props at all — every default is the wireframe literal'
  },
  {
    key: 'custom',
    note: 'all four props overridden; also the field-isolation experiment'
  },
  {
    key: 'no-address',
    note: 'address is an empty string — no third paragraph renders'
  },
  {
    key: 'wide',
    note: 'inside a 1200px box — the two columns must share a row'
  },
  {
    key: 'narrow',
    note: 'inside a 400px box — the two columns must stack'
  }
] as const

/** The overrides the `custom` band renders. Real copy, not lorem (BRIEF §5 rule 10). */
const CUSTOM = {
  email: 'press@bfna.org',
  heading: 'Talk to the press office',
  visitHeading: 'Find us in Washington',
  address: '1101 New York Avenue NW, Suite 901, Washington, DC 20005'
} as const

/** The wireframe's own literals — the defaults the `default` band must render. */
const WF = {
  email: 'info@bfna.org',
  heading: 'Contact',
  visitHeading: 'Visit us',
  address: '[street address — Directus contact singleton]'
} as const

/**
 * The rules anywhere in the loaded CSS that select `bf-contact-section`, each
 * with the cascade layer it was found in.
 *
 * Cross-origin sheets throw on `cssRules`; they are skipped, not failed — the
 * same walker probes 14–43 use, extended to report the layer rather than to
 * return the first hit.
 */
const contactSectionRules = (): { selector: string, layer: string }[] => {
  const LAYER_BLOCK = globalThis.CSSLayerBlockRule
  const found: { selector: string, layer: string }[] = []

  const walk = (rules: CSSRuleList, layer: string) => {
    for (const rule of Array.from(rules)) {
      const nowLayer
        = LAYER_BLOCK && rule instanceof LAYER_BLOCK
          ? ((rule as CSSLayerBlockRule).name || '(anonymous)')
          : layer

      if (rule instanceof CSSStyleRule && rule.selectorText.includes('bf-contact-section')) {
        found.push({ selector: rule.selectorText, layer: nowLayer })
      }

      if (rule instanceof CSSImportRule) {
        try {
          if (rule.styleSheet) walk(rule.styleSheet.cssRules, nowLayer)
        } catch {
          // Cross-origin import target — unreadable, not a failure.
        }
        continue
      }

      const nested = (rule as CSSGroupingRule).cssRules
      if (nested) walk(nested, nowLayer)
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules, 'unlayered')
    } catch {
      // Cross-origin sheet.
    }
  }
  return found
}

/**
 * Every `.bf-*` selector on the page that uses `:not()` with anything but a
 * simple selector list (D-20.5). Checked against the **emitted** CSS rather
 * than the source it was written in, because the defect is in the emitting.
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
 * never arrives leaves the verdict `PENDING` for ever (probe 33's note, and the
 * zero-width-viewport case in `docs/decisions/probe-harness.md`).
 */
const settle = (): Promise<void> => nextTick()

const bandOf = (key: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`.bf-contact-section[data-probe-case="${key}"]`)

const controlsOf = (key: string): (HTMLInputElement | HTMLTextAreaElement)[] =>
  Array.from(
    bandOf(key)?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      '.bf-form-field__control'
    ) ?? []
  )

/** `<input type="…">` or `textarea`, whichever the field rendered. */
const kindOf = (el: HTMLInputElement | HTMLTextAreaElement): string =>
  el.tagName.toLowerCase() === 'textarea' ? 'textarea' : `input:${(el as HTMLInputElement).type}`

interface Snapshot {
  key: string
  found: boolean
  rootTag: string
  rootClasses: string
  dataLabel: string
  inlineStyle: boolean
  innerClasses: string
  innerGap: string
  columnCount: number
  sameRow: boolean
  formCount: number
  formAction: string
  formMethod: string
  fieldsetCount: number
  legendText: string
  headingText: string
  visitHeadingText: string
  emailText: string
  emailHref: string
  emailClass: string
  emailColor: string
  visitParagraphs: string
  controlKinds: string
  controlNames: string
  textareaRows: string
  labelled: string
  submitTag: string
  submitType: string
  submitText: string
  fieldsetMarginBottom: string
}

const snaps = reactive<Snapshot[]>([])
const checks = ref<Check[]>([])

const snapshot = (key: string): Snapshot => {
  const band = bandOf(key)
  const inner = band?.firstElementChild as HTMLElement | null
  const columns = Array.from(inner?.children ?? []) as HTMLElement[]
  const form = band?.querySelector('form') ?? null
  const fieldsets = Array.from(band?.querySelectorAll('fieldset') ?? [])
  const fieldset = fieldsets[0] ?? null
  const controls = controlsOf(key)
  const visit = band?.querySelector<HTMLElement>('.bf-contact-section__visit') ?? null
  /*
    Selected by its `href`, not by a class — the anchor deliberately carries no
    class (see the component), because `a:not([class])` is how both
    `base/reset.css` and `base/typography.css` style links.
  */
  const emailLink = band?.querySelector<HTMLAnchorElement>(
    '.bf-contact-section__form a[href^="mailto:"]'
  ) ?? null
  const submit = band?.querySelector<HTMLElement>('.bf-button') ?? null
  const textarea = controls.find(c => c.tagName.toLowerCase() === 'textarea') ?? null

  /*
    Label association, read the browser's way. `HTMLLabelElement.control` is the
    engine's own resolution of `for`/`id`; comparing the two attribute strings
    by hand would agree with itself even when both are wrong.
  */
  const labels = Array.from(band?.querySelectorAll('label') ?? [])
  const labelled = labels
    .map(l => (l.control && controls.includes(l.control as HTMLInputElement) ? 'ok' : 'BROKEN'))
    .join(',')

  const tops = columns.map(c => Math.round(c.getBoundingClientRect().top))

  return {
    key,
    found: band !== null,
    rootTag: band?.tagName.toLowerCase() ?? 'missing',
    rootClasses: band ? Array.from(band.classList).sort().join(' ') : 'no root',
    dataLabel: band?.getAttribute('data-label') ?? 'absent',
    inlineStyle: band !== null && band.style.cssText.trim() !== '',
    innerClasses: inner ? Array.from(inner.classList).sort().join(' ') : 'no inner box',
    innerGap: inner?.getAttribute('data-gap') ?? 'absent',
    columnCount: columns.length,
    sameRow: tops.length === 2 && tops[0] === tops[1],
    formCount: band?.querySelectorAll('form').length ?? -1,
    formAction: form?.getAttribute('action') ?? 'none',
    formMethod: form?.getAttribute('method') ?? 'none',
    fieldsetCount: fieldsets.length,
    legendText: (fieldset?.querySelector('legend')?.textContent ?? 'missing').trim(),
    headingText: (band?.querySelector('.bf-contact-section__heading')?.textContent ?? 'missing').trim(),
    visitHeadingText: (visit?.querySelector('h2')?.textContent ?? 'missing').trim(),
    emailText: (emailLink?.textContent ?? 'missing').trim(),
    emailHref: emailLink?.getAttribute('href') ?? 'missing',
    emailClass: emailLink === null ? 'no link' : (emailLink.getAttribute('class') ?? 'none'),
    emailColor: emailLink ? getComputedStyle(emailLink).color : 'no link',
    visitParagraphs: Array.from(visit?.querySelectorAll('p') ?? [])
      .map(p => (p.textContent ?? '').trim())
      .join(' / '),
    controlKinds: controls.map(kindOf).join(','),
    controlNames: controls.map(c => c.getAttribute('name') ?? 'absent').join(','),
    textareaRows: textarea?.getAttribute('rows') ?? 'absent',
    labelled: labels.length === 0 ? 'no labels' : labelled,
    submitTag: submit?.tagName.toLowerCase() ?? 'missing',
    submitType: submit?.getAttribute('type') ?? 'absent',
    submitText: (submit?.textContent ?? 'missing').trim(),
    fieldsetMarginBottom: fieldset ? getComputedStyle(fieldset).marginBottom : 'no fieldset'
  }
}

const snapFor = (key: string): Snapshot | undefined => snaps.find(s => s.key === key)

/** One reading across all five bands, comma-joined. */
const across = (read: (s: Snapshot) => string | number | boolean): string =>
  CASES.map((c) => {
    const s = snapFor(c.key)
    return s === undefined ? '?' : String(read(s))
  }).join(',')

/** What the typing and submit experiments observed. */
const seen = reactive({
  timedOut: false,
  typed: 'not run',
  isolation: 'not run',
  hrefBefore: '',
  hrefAfter: '',
  submitFired: false,
  submitPrevented: false,
  uniqueIds: 'not run'
})

const TYPED = {
  name: 'Ada Lovelace',
  email: 'ada@example.org',
  message: 'A note long enough to reach the second line of the textarea.'
} as const

let walking = false
let reported = false

const finalise = async () => {
  if (walking) return
  walking = true
  await settle()

  /*
    Ids first, before anything is typed: `useId()` values are assigned at
    render, and reading them up front means the set under test is the one the
    page mounted with rather than one an experiment could have re-keyed.
  */
  const ids = Array.from(document.querySelectorAll<HTMLElement>('[id]')).map(el => el.id)
  seen.uniqueIds = `${ids.length}|${new Set(ids).size}`

  /*
    Row 5 — the typing round trip, on the `default` band. A real `input` event,
    bubbling, which is the event `bfFormField` listens for.
  */
  const controls = controlsOf('default')
  const values = [TYPED.name, TYPED.email, TYPED.message]
  controls.forEach((el, i) => {
    el.value = values[i] ?? ''
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await settle()
  seen.typed = controls.map(el => el.value).join(' | ')

  /*
    …and the isolation half, on the `custom` band: type into the FIRST control
    only, and the other two must still be empty. One shared ref behind all three
    fields — the copy-paste bug this shape invites — fails here and nowhere
    else.
  */
  const custom = controlsOf('custom')
  const first = custom[0]
  if (first) {
    first.value = TYPED.name
    first.dispatchEvent(new Event('input', { bubbles: true }))
  }
  await settle()
  seen.isolation = custom.map(el => (el.value === '' ? 'empty' : el.value)).join(',')

  /*
    Row 6 — submit does not navigate.

    The listener is on `document`, in the bubble phase, so it runs AFTER the
    form's own `@submit.prevent` and can therefore read `defaultPrevented` as
    the form left it. A capture-phase listener would run first and always read
    `false`.
  */
  const listener = (event: Event) => {
    seen.submitFired = true
    seen.submitPrevented = event.defaultPrevented
  }
  document.addEventListener('submit', listener)
  seen.hrefBefore = location.href
  bandOf('default')?.querySelector<HTMLElement>('.bf-button')?.click()
  await settle()
  seen.hrefAfter = location.href
  document.removeEventListener('submit', listener)

  for (const c of CASES) snaps.push(snapshot(c.key))
  report()
}

const report = () => {
  if (reported) return
  reported = true

  const def = snapFor('default')
  const custom = snapFor('custom')
  const noAddress = snapFor('no-address')
  const wide = snapFor('wide')
  const narrow = snapFor('narrow')

  /*
    The serialised-HTML half of row 2 — the same string the spec greps out of
    `.output/public/bf-probe/44-bf-contact-section/index.html`. The literal is
    assembled from two pieces so that writing this row does not plant the very
    token the row hunts for into the page it reads (probe 40's note).
  */
  const html = document.documentElement.outerHTML
  const FIELDSET_OPEN = `${'<'}fieldset`

  /*
    The reference fieldset — outside every band, so it still carries
    `base/forms.css`'s `@layer defaults` margin. Its presence is what makes the
    band's `0px` mean "neutralised here" rather than "the defaults rule is gone".
  */
  const referenceFieldset = document.querySelector<HTMLElement>('[data-probe-ref-fieldset]')
  const referenceMargin = referenceFieldset
    ? getComputedStyle(referenceFieldset).marginBottom
    : 'no reference'

  /*
    A bare, classless anchor outside every band — the reference the mailto
    link's colour is compared against.
  */
  const referenceLink = document.querySelector<HTMLElement>('#probe-ref-link')
  const referenceLinkColor = referenceLink ? getComputedStyle(referenceLink).color : 'no reference'

  const rules = contactSectionRules()
  const strayLayers = rules.filter(r => r.layer !== 'components')
  const badNots = complexNotSelectors()

  checks.value = [
    // --- 0. did the walk actually run? -------------------------------------
    {
      label: 'the walk completed, rather than being rescued by the timeout',
      expected: 'false',
      actual: String(seen.timedOut)
    },
    {
      label: '  …reading every one of the five bands',
      expected: CASES.length,
      actual: snaps.length
    },
    {
      label: 'every band mounted',
      expected: CASES.map(() => true).join(','),
      actual: across(s => s.found)
    },

    // --- 1. the bfSection composition --------------------------------------
    {
      label: 'the root is bfSection’s <section>, carrying both class names',
      expected: CASES.map(() =>
        `section|${['bf-contact-section', 'bf-section'].sort().join(' ')}`
      ).join(','),
      actual: across(s => `${s.rootTag}|${s.rootClasses}`)
    },
    {
      label: '  …with data-label="Contact" and no inline style',
      expected: CASES.map(() => 'Contact|false').join(','),
      actual: across(s => `${s.dataLabel}|${s.inlineStyle}`)
    },
    {
      label: 'the inner box is `center | switcher` at gap="l" — wfContactSection’s own',
      expected: CASES.map(() => `${['center', '|', 'switcher'].sort().join(' ')}|l`).join(','),
      actual: across(s => `${s.innerClasses}|${s.innerGap}`)
    },
    {
      label: 'exactly two columns per band: the form and the visit-us block',
      expected: '2,2,2,2,2',
      actual: across(s => s.columnCount)
    },

    // --- 2. the fieldset ----------------------------------------------------
    {
      label: 'one <fieldset> per band, in the live DOM',
      expected: '1,1,1,1,1',
      actual: across(s => s.fieldsetCount)
    },
    {
      label: '  …and in the serialised HTML the spec greps',
      expected: 'present',
      actual: html.includes(FIELDSET_OPEN) ? 'present' : 'ABSENT'
    },
    {
      label: '  …each with a <legend> carrying the `heading` prop',
      expected: [WF.heading, CUSTOM.heading, WF.heading, WF.heading, WF.heading].join(','),
      actual: across(s => s.legendText)
    },

    // --- 3. label association and id uniqueness (the axe checks) -----------
    {
      label: 'every <label> resolves to one of its band’s own controls (for/id, via bfFormField)',
      expected: CASES.map(() => 'ok,ok,ok').join(' / '),
      actual: CASES.map(c => snapFor(c.key)?.labelled ?? 'missing').join(' / ')
    },
    {
      label: 'every id on the page is unique across all five bands',
      expected: (() => {
        const [total] = seen.uniqueIds.split('|')
        return `${total}|${total}`
      })(),
      actual: seen.uniqueIds
    },

    // --- 4. the three controls ---------------------------------------------
    {
      label: 'the controls are text / email / textarea, in the wireframe’s order',
      expected: CASES.map(() => 'input:text,input:email,textarea').join(' / '),
      actual: CASES.map(c => snapFor(c.key)?.controlKinds ?? 'missing').join(' / ')
    },
    {
      label: '  …named name / email / message',
      expected: 'name,email,message',
      actual: def?.controlNames ?? 'missing'
    },
    {
      label: '  …and rows="4" reaches the <textarea> through $attrs',
      expected: '4',
      actual: def?.textareaRows ?? 'missing'
    },

    // --- 5. typing ----------------------------------------------------------
    {
      label: 'typing into each control updates its value (input event → model → value)',
      expected: [TYPED.name, TYPED.email, TYPED.message].join(' | '),
      actual: seen.typed
    },
    {
      label: '  …and each field holds its OWN value — typing in one leaves the others empty',
      expected: `${TYPED.name},empty,empty`,
      actual: seen.isolation
    },

    // --- 6. submit ----------------------------------------------------------
    {
      label: 'the submit control is a <button type="submit"> reading “Send message”',
      expected: 'button|submit|Send message',
      actual: def ? `${def.submitTag}|${def.submitType}|${def.submitText}` : 'missing'
    },
    {
      label: 'clicking it fires submit, and @submit.prevent had already prevented it',
      expected: 'true|true',
      actual: `${seen.submitFired}|${seen.submitPrevented}`
    },
    {
      label: '  …so the page did not navigate',
      expected: seen.hrefBefore,
      actual: seen.hrefAfter
    },
    {
      label: 'the form declares no action and no method — there is no endpoint',
      expected: 'none|none',
      actual: def ? `${def.formAction}|${def.formMethod}` : 'missing'
    },
    {
      label: 'one <form> per band, and no nested form anywhere',
      expected: '1,1,1,1,1',
      actual: across(s => s.formCount)
    },

    // --- 7. the switcher, measured ------------------------------------------
    {
      label: 'inside a 1200px box the two columns share a row',
      expected: 'true',
      actual: String(wide?.sameRow ?? 'missing')
    },
    {
      label: 'inside a 400px box they stack instead',
      expected: 'false',
      actual: String(narrow?.sameRow ?? 'missing')
    },

    // --- 8. the copy is prop-driven -----------------------------------------
    {
      label: 'with no props at all, every default is the wireframe literal',
      expected: [WF.heading, WF.visitHeading, WF.email, `mailto:${WF.email}`].join('|'),
      actual: def
        ? [def.headingText, def.visitHeadingText, def.emailText, def.emailHref].join('|')
        : 'missing'
    },
    {
      /*
        The regression this row exists for: a BEM class on the anchor takes it
        out of `a:not([class])` in BOTH `reset.css` and `typography.css`, and
        the link silently falls back to the user agent's own blue — a colour in
        no token. Compared against a bare classless reference anchor rather
        than string-matched, so the row states the requirement (it looks like
        every other link) instead of a hex value.
      */
      label: 'the mailto anchor carries no class, so it paints like every other link',
      expected: `none|${referenceLinkColor}`,
      actual: def ? `${def.emailClass}|${def.emailColor}` : 'missing'
    },
    {
      label: '  …and the address paragraph is the wireframe’s placeholder',
      expected: `Bertelsmann Foundation North America / ${WF.address}`,
      actual: def?.visitParagraphs ?? 'missing'
    },
    {
      label: 'every one of the four props overrides its default',
      expected: [
        CUSTOM.heading, CUSTOM.visitHeading, CUSTOM.email, `mailto:${CUSTOM.email}`
      ].join('|'),
      actual: custom
        ? [custom.headingText, custom.visitHeadingText, custom.emailText, custom.emailHref].join('|')
        : 'missing'
    },
    {
      label: '  …the address included, and no wireframe literal survives',
      expected: `Bertelsmann Foundation North America / ${CUSTOM.address}`,
      actual: custom?.visitParagraphs ?? 'missing'
    },
    {
      label: 'an empty `address` renders no paragraph at all, not an empty one',
      expected: 'Bertelsmann Foundation North America',
      actual: noAddress?.visitParagraphs ?? 'missing'
    },

    // --- 9. residual #155, neutralised locally ------------------------------
    {
      label: 'the band’s <fieldset> carries no bottom margin (residual #155, neutralised here)',
      expected: '0px,0px,0px,0px,0px',
      actual: across(s => s.fieldsetMarginBottom)
    },
    {
      label: '  …while a bare reference <fieldset> still carries the @layer defaults margin',
      expected: 'true',
      actual: String(
        referenceMargin !== 'no reference'
        && Number.parseFloat(referenceMargin) > 0
      )
    },

    // --- 10. cascade hygiene ------------------------------------------------
    {
      label: 'every rule selecting bf-contact-section is inside @layer components',
      expected: '1+ rules, 0 stray',
      actual: rules.length === 0
        ? 'NO RULE FOUND'
        : strayLayers.length === 0
          ? '1+ rules, 0 stray'
          : strayLayers.map(r => `${r.selector} @${r.layer}`).join(' ; ')
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
  <main
    class="probe"
    data-probe="44"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1 class="probe__title">
      Probe 44 — <code>bfContactSection</code>
    </h1>
    <p class="probe__lede">
      Five bands, all from props alone. The first takes no props and must render
      the wireframe's own literals; the second overrides all four; the third
      passes an empty <code>address</code>. The last two are the same band inside
      a 1200px and a 400px box, so the <code>switcher</code>'s two columns can be
      <em>measured</em> sharing a row and then stacking, rather than pinned to a
      breakpoint. The load-bearing rows are the accessible ones: one real
      <code>&lt;fieldset&gt;</code> per band, every control resolved to its label
      by the browser itself, and a submit that fires without navigating.
    </p>

    <section class="probe__gallery" aria-labelledby="cases-heading">
      <h2 id="cases-heading">The five bands</h2>

      <!-- 1 — no props: every default is the wireframe literal -->
      <bfContactSection data-probe-case="default" />

      <!-- 2 — all four props overridden -->
      <bfContactSection
        :email="CUSTOM.email"
        :heading="CUSTOM.heading"
        :visit-heading="CUSTOM.visitHeading"
        :address="CUSTOM.address"
        data-probe-case="custom"
      />

      <!-- 3 — an empty address renders no paragraph -->
      <bfContactSection address="" data-probe-case="no-address" />

      <!--
        4 and 5 — the same band at two container widths.

        A box, not a viewport: the harness runs one viewport per page
        (`docs/decisions/probe-harness.md`), and `.switcher`'s threshold is
        resolved against its own flex container's inline size, so constraining
        the container asks the primitive exactly the question the spec asks.

        The widths are inline and absolute, with **no** `max-inline-size: 100%`
        anywhere to clamp them. A clamp would make the measurement a function of
        the window: in a narrow one — or in an embedded browser pane reporting a
        zero-width viewport, the case the harness decision records probe 16
        hitting — the 1200px box would collapse and the "two columns share a
        row" row would report FAIL on a build that is fine. The box is a real
        1200px whatever the window is, and `.probe`'s `overflow-x: clip` takes
        the overflow rather than a horizontal scrollbar.
      -->
      <div class="probe__box" style="inline-size: 1200px;">
        <bfContactSection data-probe-case="wide" />
      </div>

      <div class="probe__box" style="inline-size: 400px;">
        <bfContactSection data-probe-case="narrow" />
      </div>
    </section>

    <section class="probe__report" aria-labelledby="report-heading">
      <h2 id="report-heading">Report</h2>

      <!--
        The reference fieldset: outside every band, so `base/forms.css`'s
        `@layer defaults` margin still applies to it. `aria-hidden` and empty —
        it is a measuring stick, not a control group, and a `<legend>` naming it
        would put a group with no controls into the accessibility tree.
      -->
      <fieldset data-probe-ref-fieldset aria-hidden="true" class="probe__ref" />

      <!--
        The classless reference anchor. `id`, not a class — a class is the very
        thing under test, and `a:not([class])` would stop matching it. `href`
        is this page's own route, so the reference is a real link the styling
        applies to and not a dead one.
      -->
      <p class="probe__ref-line">
        <a id="probe-ref-link" href="/bf-probe/44-bf-contact-section">reference link</a>
      </p>

      <p
        class="probe__verdict"
        :data-state="state"
        data-testid="probe-44-verdict"
      >
        {{ verdict }}
      </p>

      <table class="probe__table" data-testid="probe-44-table">
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
        <li v-for="c in CASES" :key="c.key">
          <code>{{ c.key }}</code> — {{ c.note }}
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.probe {
  padding-block: var(--space-l, 2rem);
  min-block-size: 100dvh;
  overflow-x: clip;
}

.probe__title {
  font-size: var(--size-3, 1.75rem);
  font-weight: 700;
}

.probe__lede {
  max-inline-size: 75ch;
}

/*
  Selected as `.bf-section` rather than `.bf-contact-section`: the report walks
  the live CSSOM for every rule that selects the component's own block class and
  reports any it finds outside `@layer components`. A scoped rule here — which
  is unlayered by construction — would be found by that walk and read as the
  component having grown a stray stylesheet. The bands carry both class names,
  so this frames the same five elements without naming the one under test.
*/
.probe__gallery > .bf-section,
.probe__box > .bf-section {
  outline: 1px dashed currentcolor;
  outline-offset: -1px;
}

.probe__ref {
  padding: 0;
  border: 0;
}
</style>
