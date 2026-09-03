<script setup lang="ts">
/**
 * Probe — issue 15 / gh#24: `bfButton`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against — 32 (`bfLoadMore`), 37 (`bfHero`), 40
 * (`bfCtaSection`) and 44 (`bfContactSection`) all consume this component.
 * Only the final cutover issue removes `bf-probe/`.
 *
 * Shape copied from probe 14 (`bfLogo`), which set the pattern: a live render
 * gallery on top, a machine-readable assertion table underneath with a
 * `data-testid="probe-15-verdict"` PASS/FAIL cell that
 * `scripts/verify-bf-button.ts` reads out of the prerendered HTML.
 *
 * What it proves:
 *
 *  1. The issue's own acceptance — **the full element × variant × size
 *     matrix renders**: 3 element types × 2 variants × 4 sizes = 24 live
 *     instances, plus one disabled instance per element type.
 *  2. Element resolution really happened: `to` produced an `<a>` from
 *     `NuxtLink`, `href` a plain `<a>` (with `[data-external]` where asked),
 *     neither a `<button>` — and `disabled` produced `<button disabled>` for
 *     **all three** prop shapes, not a disabled-looking link.
 *  3. **Keyboard reachability**, the acceptance's second half: every enabled
 *     instance takes focus, every disabled one refuses it.
 *  4. A visible focus state exists — the `:focus-visible` rule is read back
 *     out of the live CSSOM with a real outline and the existing
 *     `--outline-focus` halo.
 *  5. **The box metrics equal the wireframe's**, measured rather than
 *     asserted: `/css/wireframe.css` is loaded and a real hidden wireframe
 *     button is compared against a rendered `bf-button` for computed padding
 *     and border width. This is the "read the computed values, don't guess"
 *     check; it fails if either side drifts.
 *  6. Colour comes from the existing semantic tokens, the two variants
 *     differ, and the default variant paints no ground at all.
 *  7. `@layer components` survived into the live CSSOM (the gh#101 guard,
 *     reusing probe 14's `CSSLayerBlockRule` walk).
 *  8. `$attrs` reaches whichever element rendered, and a caller's own `style`
 *     outranks the component's `cssVars` — the documented escape hatch.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page plus `npx tsx scripts/verify-bf-button.ts`, per the
 * gh#20 / gh#21 / gh#22 / gh#23 precedent. Recorded in the spec's Decisions.
 */
defineOptions({ name: 'BfProbe15BfButton' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 15 — bfButton'
})

/*
 * The frozen wireframe reference this page measures against is rendered in an
 * isolated `srcdoc` iframe (see the template, and `wfMetrics` below) rather
 * than as an off-screen box in this document. gh#116: the `bf-probe` layout
 * loads the CUBE stack and only the CUBE stack, and `/css/wireframe.css` is
 * not part of it — it is the Front-2 skin, loaded nowhere but
 * `layouts/wireframe.vue`. Keeping the link here would have left the probe
 * asserting a CSS-loading rule it broke itself, and the leak is not
 * hypothetical: that file's `html:has(.wireframe), body:has(.wireframe)` rule
 * reaches *outside* `.wireframe` and repainted the ground the layout sets.
 * The file stays frozen and is still read at full fidelity — just in a
 * document of its own.
 */

/** The reference markup, painted by the frozen skin and nothing else. */
const WF_REFERENCE_DOC = [
  '<!doctype html><html lang="en"><head><meta charset="utf-8">',
  '<link rel="stylesheet" href="/css/styles.css">',
  '<link rel="stylesheet" href="/css/wireframe.css">',
  '</head><body class="wireframe">',
  '<span class="wf-button" data-testid="probe-15-wf-button">reference</span>',
  '</body></html>'
].join('')

const wfFrame = ref<HTMLIFrameElement | null>(null)

/**
 * The reference element and its computed style, read from inside the frame.
 *
 * `getComputedStyle` is taken from the frame's **own** `defaultView`: called on
 * the parent window it is not guaranteed to resolve another document's cascade,
 * and a silently-empty declaration here would turn every metric row below into
 * a comparison of two empty strings — a pass, for a check that never ran.
 *
 * Resolves to `null` rather than throwing if the frame never loads, so the
 * "present and measurable" row fails loudly instead of the page dying on mount.
 */
const readWireframeReference = async (selector: string): Promise<{ el: HTMLElement, style: CSSStyleDeclaration } | null> => {
  const frame = wfFrame.value
  if (!frame) return null

  if (frame.contentDocument?.readyState !== 'complete') {
    await new Promise<void>(ok => {
      const done = () => ok()
      frame.addEventListener('load', done, { once: true })
      // The frame may have finished between the check and this listener.
      if (frame.contentDocument?.readyState === 'complete') {
        frame.removeEventListener('load', done)
        ok()
      }
    })
  }

  const view = frame.contentWindow
  const doc = frame.contentDocument
  if (!view || !doc) return null

  // Metrics are em-relative on both sides of every comparison below, so the
  // frame must have its final fonts before anything is measured.
  await doc.fonts?.ready

  const el = doc.querySelector<HTMLElement>(selector)
  return el ? { el, style: view.getComputedStyle(el) } : null
}

/** The four size settings under test. `''` means "pass no `size` at all". */
const sizes = ['', 's', 'm', 'l'] as const

/** The two variants under test. */
const variants = ['default', 'primary'] as const

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

const checks = ref<Check[]>([])

onMounted(async () => {
  const matrix = Array.from(
    document.querySelectorAll<HTMLElement>('.probe__matrix .bf-button')
  )
  const disabled = Array.from(
    document.querySelectorAll<HTMLElement>('.probe__disabled .bf-button')
  )

  const byElement = (list: HTMLElement[], kind: string) =>
    list.filter(el => el.dataset.element === kind)

  /**
   * `getPropertyValue('--color-text')` hands back the *unresolved* token text
   * (`hsl(var(--hsl-base))`), which never equals a computed `color`. Paint the
   * token onto a throwaway element and read what the browser resolved instead.
   * (Lifted verbatim from probe 14 — same trick, same reason.)
   */
  const resolveToken = (token: string) => {
    const el = document.createElement('span')
    el.style.cssText = `position:absolute;visibility:hidden;color:var(${token})`
    document.body.appendChild(el)
    const value = getComputedStyle(el).color
    el.remove()
    return value
  }

  /** What an element with no background of its own computes to. */
  const unpaintedGround = (() => {
    const el = document.createElement('span')
    el.style.cssText = 'position:absolute;visibility:hidden'
    document.body.appendChild(el)
    const value = getComputedStyle(el).backgroundColor
    el.remove()
    return value
  })()

  /** Does this element actually take focus when asked? */
  const takesFocus = (el: HTMLElement) => {
    // `preventScroll`: 27 focus calls in a row would otherwise walk the page.
    el.focus({ preventScroll: true })
    const got = document.activeElement === el
    el.blur()
    return got
  }

  /**
   * Walk every reachable stylesheet — `@import`ed ones included, since
   * `/css/styles.css` is nothing but a list of imports — looking for a style
   * rule whose selector matches `test` and whose ancestry includes a
   * `@layer components` block. Cross-origin sheets throw on `cssRules`; they
   * are skipped, not failed. Generalised from probe 14's version so the same
   * walk can find the base rule and the `:focus-visible` rule.
   */
  const layeredRule = (test: RegExp): CSSStyleRule | null => {
    const LAYER_BLOCK = globalThis.CSSLayerBlockRule
    if (!LAYER_BLOCK) return null

    const walk = (rules: CSSRuleList, insideComponents: boolean): CSSStyleRule | null => {
      for (const rule of Array.from(rules)) {
        const nowInside =
          insideComponents
          || (rule instanceof LAYER_BLOCK && (rule as CSSLayerBlockRule).name === 'components')

        if (nowInside && rule instanceof CSSStyleRule && test.test(rule.selectorText)) {
          return rule
        }

        // `@import` nests its rules under `.styleSheet`, not `.cssRules`.
        if (rule instanceof CSSImportRule) {
          try {
            const imported = rule.styleSheet?.cssRules
            if (imported) {
              const hit = walk(imported, nowInside)
              if (hit) return hit
            }
          } catch {
            // Cross-origin import target — unreadable, not a failure.
          }
          continue
        }

        const nested = (rule as CSSGroupingRule).cssRules
        if (nested) {
          const hit = walk(nested, nowInside)
          if (hit) return hit
        }
      }
      return null
    }

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const hit = walk(sheet.cssRules, false)
        if (hit) return hit
      } catch {
        // Cross-origin sheet — unreadable, not a failure.
      }
    }
    return null
  }

  /*
   * The selector is matched loosely on purpose. Vue's scoped-style transform
   * appends a `[data-v-…]` attribute to the compound selector, and where it
   * lands relative to `:focus-visible` is an implementation detail; requiring
   * the pseudo-class to sit immediately after the class would make this check
   * fail on a transform change rather than on a real regression.
   */
  const focusRule = layeredRule(/\.bf-button(?![\w-])[^,{]*:focus-visible/)

  /*
   * Read through `cssText`, not the typed `style` accessors: a declaration
   * whose value is still a `var()` reference is pending-substitution, and
   * shorthand accessors such as `style.outline` are free to serialise it as
   * the empty string. The raw rule text is the reliable source.
   */
  const focusCss = focusRule?.cssText ?? ''

  // --- the metrics comparison, against the real wireframe class -----------
  /*
   * Read out of the isolated reference frame (gh#116) rather than from an
   * off-screen box in this document — `wfStyle` belongs to the frame's own
   * view, so it resolves the frame's cascade rather than this page's.
   */
  const wfRef = await readWireframeReference('[data-testid="probe-15-wf-button"]')
  const wfProbe = wfRef?.el ?? null
  const wfStyle = wfRef?.style ?? null
  const bfBase = matrix.find(el => !el.dataset.size && el.dataset.variant === 'default')
  const box = (el: HTMLElement | null | undefined, style?: CSSStyleDeclaration) => {
    if (!el) return ''
    const s = style ?? getComputedStyle(el)
    return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft, s.borderTopWidth].join(' ')
  }

  /**
   * Both boxes are measured at the same font size before comparing. The
   * padding is `0.4em 1.2em` on each side, so a difference in inherited
   * `font-size` — the wireframe layer sets its own `font-family`, and a
   * different family can change nothing here but the metrics box is still
   * `em`-relative — would show up as a padding difference that is not a drift
   * in the rule. Reading both at the same computed `font-size` isolates the
   * declaration, which is what this check is about.
   */
  const sameFontSize =
    wfStyle && bfBase
      ? wfStyle.fontSize === getComputedStyle(bfBase).fontSize
      : false

  const fontSizeOf = (el: HTMLElement | undefined) =>
    el ? parseFloat(getComputedStyle(el).fontSize) : 0

  const sized = (size: string) =>
    matrix.find(el => (el.dataset.size ?? '') === size && el.dataset.variant === 'default')

  /**
   * The colour the focus ring is actually painted in, resolved in the
   * element's own context.
   *
   * Reading `getComputedStyle(el).outlineColor` after `el.focus()` does not
   * work: `:focus-visible` is a heuristic, and a programmatic focus with no
   * preceding keyboard interaction does not satisfy it, so the computed
   * outline stays `none`. Instead the hook's own computed value is painted
   * onto a throwaway child — a child, so that a value of `currentcolor`
   * resolves against the button's colour rather than the document's.
   */
  const focusRingColour = (el: HTMLElement) => {
    const raw = getComputedStyle(el).getPropertyValue('--_bf-button-focus-color').trim()
    if (!raw) return ''
    const probeEl = document.createElement('span')
    probeEl.style.cssText = 'position:absolute;visibility:hidden'
    probeEl.style.color = raw
    el.appendChild(probeEl)
    const value = getComputedStyle(probeEl).color
    probeEl.remove()
    return value
  }

  /** WCAG 2.1 relative luminance of an `rgb()` / `rgba()` string. */
  const luminance = (colour: string) => {
    const parts = colour.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? []
    if (parts.length < 3) return Number.NaN
    const channel = (v: number) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * channel(parts[0]!) + 0.7152 * channel(parts[1]!) + 0.0722 * channel(parts[2]!)
  }

  /** WCAG contrast ratio between two opaque colours. */
  const contrast = (a: string, b: string) => {
    const [x, y] = [luminance(a), luminance(b)]
    if (Number.isNaN(x) || Number.isNaN(y)) return 0
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
  }

  /**
   * The ground the ring is painted on. `outline-offset` is positive, so the
   * ring sits outside the border box, clear of the button's own fill — the
   * page ground is what it has to contrast with (WCAG 1.4.11), which is
   * exactly what the first cut of this component got wrong for the filled
   * variant.
   */
  const pageGround = getComputedStyle(document.documentElement).backgroundColor

  const attrsProbe = document.querySelector<HTMLElement>('[data-testid="probe-15-attrs"]')
  const overrideProbe = document.querySelector<HTMLElement>('[data-testid="probe-15-override"]')

  const results: Check[] = [
    // --- 1. the full matrix rendered --------------------------------------
    { label: 'matrix instances (3 elements × 2 variants × 4 sizes)', expected: 24, actual: matrix.length },
    { label: '  …8 resolved to NuxtLink (`to`)', expected: 8, actual: byElement(matrix, 'link').length },
    { label: '  …8 resolved to <a> (`href`)', expected: 8, actual: byElement(matrix, 'anchor').length },
    { label: '  …8 resolved to <button> (neither)', expected: 8, actual: byElement(matrix, 'button').length },
    { label: '  …12 are variant="primary"', expected: 12, actual: matrix.filter(el => el.dataset.variant === 'primary').length },
    { label: '  …12 are variant="default"', expected: 12, actual: matrix.filter(el => el.dataset.variant === 'default').length },
    {
      label: '  …6 per size (none, s, m, l)',
      expected: '6,6,6,6',
      actual: sizes.map(s => matrix.filter(el => (el.dataset.size ?? '') === s).length).join(',')
    },

    // --- 2. element resolution is real, not just an attribute -------------
    {
      label: '`to` really rendered an <a> with an href',
      expected: 'true',
      actual: String(byElement(matrix, 'link').every(el => el.tagName === 'A' && !!el.getAttribute('href')))
    },
    {
      label: '`href` really rendered an <a> pointing at the given URL',
      expected: 'true',
      actual: String(byElement(matrix, 'anchor').every(el => el.tagName === 'A' && el.getAttribute('href') === 'https://example.org/'))
    },
    {
      label: 'neither really rendered <button type="button">',
      expected: 'true',
      actual: String(byElement(matrix, 'button').every(el => el.tagName === 'BUTTON' && el.getAttribute('type') === 'button'))
    },
    {
      label: '[data-external] marks the external anchors only',
      expected: '8,0',
      actual: [
        byElement(matrix, 'anchor').filter(el => el.hasAttribute('data-external')).length,
        matrix.filter(el => el.dataset.element !== 'anchor' && el.hasAttribute('data-external')).length
      ].join(',')
    },

    // --- 3. disabled: a real button, for all three prop shapes ------------
    { label: 'disabled instances (to / href / neither)', expected: 3, actual: disabled.length },
    {
      label: '  …all three are <button disabled>, never a link',
      expected: 'true',
      actual: String(disabled.length === 3 && disabled.every(el => el.tagName === 'BUTTON' && el.hasAttribute('disabled')))
    },
    {
      label: '  …none carries an href',
      expected: 0,
      actual: disabled.filter(el => el.hasAttribute('href')).length
    },
    {
      label: '  …none can take focus',
      expected: 0,
      actual: disabled.filter(takesFocus).length
    },

    // --- 4. every enabled instance is keyboard-reachable ------------------
    { label: 'every matrix instance takes focus', expected: 24, actual: matrix.filter(takesFocus).length },
    {
      label: 'a :focus-visible rule exists in @layer components',
      expected: 'true',
      actual: String(!!focusRule)
    },
    {
      label: '  …with a real outline (width, style, colour)',
      expected: 'true',
      actual: String(/outline:\s*[^;]*solid/.test(focusCss) && /outline-offset:/.test(focusCss))
    },
    {
      label: '  …and the existing --outline-focus halo',
      expected: 'true',
      actual: String(/box-shadow:\s*var\(\s*--outline-focus\s*\)/.test(focusCss))
    },
    /*
     * The rule existing is not the same as the ring being visible. These two
     * measure the colour the ring is actually painted in and check it against
     * the ground it is painted on — the check that would have caught the
     * white-on-white filled variant the first cut shipped.
     */
    {
      label: 'default ring contrasts with the page ground (WCAG 1.4.11, ≥3:1)',
      expected: 'true',
      actual: String(contrast(focusRingColour(bfBase as HTMLElement), pageGround) >= 3)
    },
    {
      label: 'primary ring contrasts with the page ground (≥3:1)',
      expected: 'true',
      actual: (() => {
        const el = matrix.find(m => m.dataset.variant === 'primary')
        return String(!!el && contrast(focusRingColour(el), pageGround) >= 3)
      })()
    },
    {
      label: '  …and with the filled variant’s own ground too',
      expected: 'true',
      actual: (() => {
        const el = matrix.find(m => m.dataset.variant === 'primary')
        if (!el) return 'false'
        return String(contrast(focusRingColour(el), getComputedStyle(el).backgroundColor) >= 3)
      })()
    },

    // --- 5. box metrics equal the wireframe class's -----------------------
    {
      label: 'the wireframe reference button is present and measurable',
      expected: 'true',
      actual: String(!!wfProbe && !!bfBase && box(wfProbe, wfStyle ?? undefined).length > 0)
    },
    {
      label: '  …measured at the same font size, so the em box is comparable',
      expected: 'true',
      actual: String(sameFontSize)
    },
    {
      label: 'computed padding + border width match the wireframe class',
      expected: box(wfProbe, wfStyle ?? undefined),
      actual: box(bfBase)
    },

    // --- 6. size scales the box through the font size ---------------------
    {
      label: 'sizes s < (unsized) and s < m < l',
      expected: 'true',
      actual: String(
        fontSizeOf(sized('s')) < fontSizeOf(sized('m'))
        && fontSizeOf(sized('m')) < fontSizeOf(sized('l'))
        && fontSizeOf(sized('s')) < fontSizeOf(sized(''))
      )
    },
    {
      label: '  …an unsized button inherits its context font size',
      expected: String(parseFloat(getComputedStyle(document.querySelector('.probe__matrix') as HTMLElement).fontSize)),
      actual: String(fontSizeOf(sized('')))
    },
    {
      label: '  …and the padding scales with it (em box, no per-size table)',
      expected: 'true',
      actual: String(
        parseFloat(getComputedStyle(sized('s') as HTMLElement).paddingLeft)
        < parseFloat(getComputedStyle(sized('l') as HTMLElement).paddingLeft)
      )
    },

    // --- 7. colour: existing semantic tokens, no ground on the default ----
    {
      label: 'default variant text resolves to --color-text',
      expected: resolveToken('--color-text'),
      actual: bfBase ? getComputedStyle(bfBase).color : ''
    },
    {
      label: 'primary variant text resolves to --color-text-inverse',
      expected: resolveToken('--color-text-inverse'),
      actual: (() => {
        const el = matrix.find(m => m.dataset.variant === 'primary')
        return el ? getComputedStyle(el).color : ''
      })()
    },
    {
      label: 'primary variant is filled with --color-primary',
      expected: resolveToken('--color-primary'),
      actual: (() => {
        const el = matrix.find(m => m.dataset.variant === 'primary')
        return el ? getComputedStyle(el).backgroundColor : ''
      })()
    },
    {
      label: '  …and its border is the same token, so the box is unchanged',
      expected: resolveToken('--color-primary'),
      actual: (() => {
        const el = matrix.find(m => m.dataset.variant === 'primary')
        return el ? getComputedStyle(el).borderTopColor : ''
      })()
    },
    {
      /*
       * "Unpainted" is read off a throwaway element rather than written as a
       * literal — partly because the serialisation of an unset background is
       * the browser's business, and partly because a hard-coded colour string
       * here would (rightly) trip the epic's no-colour-literal scan.
       */
      label: 'default variant paints no ground (not a white one)',
      expected: unpaintedGround,
      actual: bfBase ? getComputedStyle(bfBase).backgroundColor : ''
    },
    {
      label: '  …and the two variants differ',
      expected: 'true',
      actual: (() => {
        const p = matrix.find(m => m.dataset.variant === 'primary')
        return String(!!p && !!bfBase && getComputedStyle(p).color !== getComputedStyle(bfBase).color)
      })()
    },

    // --- 8. @layer survived the build (gh#101 / residual #98) -------------
    {
      label: '.bf-button rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(!!layeredRule(/\.bf-button(?![\w-])/))
    },

    // --- 9. $attrs reaches the resolved root, and the caller wins ---------
    {
      label: '$attrs `data-testid` + `aria-label` reached the rendered element',
      expected: 'BUTTON|probe attrs',
      actual: attrsProbe ? `${attrsProbe.tagName}|${attrsProbe.getAttribute('aria-label') ?? ''}` : ''
    },
    {
      label: "a caller's own `style` outranks the component's cssVars",
      expected: resolveToken('--color-text'),
      actual: overrideProbe ? getComputedStyle(overrideProbe).color : ''
    }
  ]

  checks.value = results
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states, not two. The assertions run in `onMounted`, so during
 * prerender `checks` is empty — and a two-state verdict would bake
 * `data-state="fail"` into the static HTML for a component that is fine.
 * (Probe 14's reasoning, unchanged.)
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
    `data-probe-row` + `data-ok`, so `scripts/check-probes.ts` can fail the
    build on a red probe instead of relying on someone opening the page.
  -->
  <main
    class="probe container"
    data-probe="15"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 15 — <code>bfButton</code></h1>
    <p class="probe__lede">
      One button/link atom. The element comes from the props, not the caller:
      <code>to</code> renders <code>NuxtLink</code>, <code>href</code> renders
      an <code>&lt;a&gt;</code> with the <code>[data-external]</code> marker,
      neither renders a <code>&lt;button&gt;</code> — and
      <code>disabled</code> renders <code>&lt;button disabled&gt;</code>
      whatever else was passed, because a disabled-looking but still focusable
      link is the failure this component exists to prevent.
    </p>

    <section class="probe__matrix" aria-labelledby="matrix-heading">
      <h2 id="matrix-heading">The full element × variant × size matrix</h2>

      <div v-for="v in variants" :key="v" class="probe__row">
        <h3><code>variant="{{ v }}"</code></h3>
        <div class="probe__buttons">
          <bfButton v-for="s in sizes" :key="`to-${v}-${s}`" to="/bf-probe/15-bf-button" :variant="v" :size="s || undefined">
            to · {{ s || 'unsized' }}
          </bfButton>
          <bfButton v-for="s in sizes" :key="`href-${v}-${s}`" href="https://example.org/" external :variant="v" :size="s || undefined">
            href · {{ s || 'unsized' }}
          </bfButton>
          <bfButton v-for="s in sizes" :key="`btn-${v}-${s}`" :variant="v" :size="s || undefined">
            button · {{ s || 'unsized' }}
          </bfButton>
        </div>
      </div>
    </section>

    <section class="probe__disabled" aria-labelledby="disabled-heading">
      <h2 id="disabled-heading">
        <code>disabled</code> — all three prop shapes collapse to
        <code>&lt;button disabled&gt;</code>
      </h2>
      <div class="probe__buttons">
        <bfButton to="/bf-probe/15-bf-button" disabled>disabled + to</bfButton>
        <bfButton href="https://example.org/" external disabled>disabled + href</bfButton>
        <bfButton variant="primary" disabled>disabled + primary</bfButton>
      </div>
    </section>

    <section class="probe__attrs" aria-labelledby="attrs-heading">
      <h2 id="attrs-heading"><code>$attrs</code> fallthrough and consumer override</h2>
      <div class="probe__buttons">
        <bfButton data-testid="probe-15-attrs" aria-label="probe attrs">
          $attrs reaches the root
        </bfButton>
        <!--
          A primary button whose label colour the caller overrides. `$attrs` is
          bound after `:style="cssVars"`, so this `style` wins the merge — the
          escape hatch that keeps the inline variables overridable.
        -->
        <bfButton
          variant="primary"
          data-testid="probe-15-override"
          :style="{ '--_bf-button-color': 'var(--color-text)' }"
        >
          caller style wins
        </bfButton>
      </div>
    </section>

    <!--
      The measurement reference: a real wireframe button, painted by the frozen
      `/css/wireframe.css` inside a document of its own. An iframe rather than
      an off-screen box in this page, because gh#116 makes the `bf-probe`
      layout the sole stylesheet injector and the wireframe skin is not part of
      the CUBE stack it loads. Off-screen rather than `hidden`, so the computed
      box is still a used value; `aria-hidden` + `tabindex="-1"` keep it out of
      the keyboard-reachability count above. `srcdoc` is rendered here rather
      than assigned at runtime so the reference still appears in the
      prerendered HTML that `scripts/verify-bf-button.ts` greps.
    -->
    <iframe
      ref="wfFrame"
      class="probe__reference-frame"
      title="wireframe measurement reference"
      aria-hidden="true"
      tabindex="-1"
      :srcdoc="WF_REFERENCE_DOC"
    />

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-15-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-15-table">
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
  The ground is the `bf-probe` layout's job now (gh#116): it paints `html` from
  `--color-surface-page` / `--color-text` and pins `color-scheme: light`, so the
  per-probe `:global(html)` block each of these pages used to carry — and the
  `--color-white` primitive some of them reached for — is gone.
*/

.probe {
  padding-block: var(--space-l, 2rem);
  min-block-size: 100dvh;
}

.probe__lede {
  max-inline-size: 75ch;
}

.probe__row,
.probe__disabled,
.probe__attrs {
  padding: var(--space-s, 1rem);
  margin-block-end: var(--space-s, 1rem);
  border: 1px solid currentcolor;
}

.probe__buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-s, 1rem);
}

/*
  Off-screen, not `display: none`: a `display: none` element has no used
  padding to compare against.
*/
/*
  The reference frame needs a real viewport — a 1px-wide one would wrap the
  reference and every measured box with it — so it is moved off-screen at full
  size rather than collapsed. `border: 0` keeps the UA's default frame border
  out of the layout.
*/
.probe__reference-frame {
  position: absolute;
  inset-inline-start: -9999px;
  inset-block-start: 0;
  inline-size: 640px;
  block-size: 200px;
  border: 0;
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
}

.probe__table th,
.probe__table td {
  border-block-end: 1px solid currentcolor;
  padding: 0.25rem 0.75rem 0.25rem 0;
  text-align: start;
}

.probe__table tr[data-state='fail'] {
  color: var(--color-error);
}
</style>
