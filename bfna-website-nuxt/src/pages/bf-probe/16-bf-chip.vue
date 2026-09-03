<script setup lang="ts">
/**
 * Probe — issue 16 / gh#25: `bfChip`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against — 30 (`bfFilterBar`), 21/22/26/27 (the card family)
 * and 54 (`page-search`) all consume this component. Only the final cutover
 * issue removes `bf-probe/`.
 *
 * Shape follows probe 15 (`bfButton`), which follows probe 14 (`bfLogo`): a
 * live render gallery on top, a machine-readable assertion table underneath
 * with a `data-testid="probe-16-verdict"` PASS/FAIL cell that
 * `scripts/verify-bf-chip.ts` reads out of the prerendered HTML.
 *
 * What it proves:
 *
 *  1. The issue's own acceptance — **all four modes render**, each resolving
 *     to the right element: `span`, `NuxtLink`, `<a>` (with `[data-external]`
 *     only where asked) and `<button type="button">`.
 *  2. **The toggle contract**: `aria-pressed` starts `"false"`, activation
 *     emits `update:modelValue` with the negated value, the parent's binding
 *     updates, and `aria-pressed` plus `[data-active]` both track it.
 *  3. **Keyboard**, twice over. Deterministically, a
 *     `MouseEvent('click', { detail: 0 })` — precisely what a user agent
 *     dispatches when a button is activated from the keyboard — flips the
 *     state; and structurally, the root really is a native
 *     `<button type="button">`, the element whose Space/Enter activation is a
 *     platform guarantee rather than something this component re-implements.
 *     Then, separately, a **live** panel that only reaches `pass` once a real
 *     Enter *and* a real Space have arrived (§ "keyboard lab" below).
 *  4. **The selected state is CSS, not an inline declaration** — the whole
 *     point of the issue. No chip on this page carries a `style` attribute
 *     except the one that deliberately demonstrates the consumer override.
 *  5. Keyboard reachability: every interactive chip takes focus, the
 *     non-interactive `span` does not.
 *  6. A visible focus state exists, read back out of the live CSSOM, and its
 *     ring contrasts with the ground it is painted on — in **both** states
 *     (the gh#24-P2-1 defect, checked before it can recur here).
 *  7. **The box metrics equal the wireframe chip's**, measured rather than
 *     asserted. The padding is compared **em-normalised**, because the frozen
 *     rule pins its own font size and this component takes a token step: the
 *     check is about the declaration, not about the inherited size.
 *  8. Colour comes from the existing semantic tokens, and the default chip
 *     paints no ground at all.
 *  9. `@layer components` survived into the live CSSOM (the gh#101 guard).
 * 10. `$attrs` reaches whichever element rendered, and a caller's own `style`
 *     outranks the component's hooks — the escape hatch that replaces the
 *     style binding this component deliberately does not have.
 *
 * ## The keyboard lab
 *
 * A synthetic `KeyboardEvent` does **not** produce a click in any browser —
 * activation behaviour runs only for trusted events — so a check that
 * dispatched one and waited for `aria-pressed` to move would fail on a
 * perfectly good component. It is not used. Instead the live panel listens for
 * clicks whose `detail` is `0`, which is what the user agent itself sets on a
 * keyboard-originated activation (a pointer click carries `detail >= 1`), and
 * pairs each with the key that was last pressed. It reports through its own
 * `data-testid="probe-16-keyboard"` cell, three-state like the main verdict,
 * so that opening this page without touching the keyboard reads `pending`
 * rather than a misleading `FAIL`. The browser-test step drives it for real.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page plus `npx tsx scripts/verify-bf-chip.ts`, per the
 * gh#20 – gh#24 precedent. Recorded in the spec's Decisions.
 */
defineOptions({ name: 'BfProbe16BfChip' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 16 — bfChip'
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
  '<span class="wf-chip" data-testid="probe-16-wf-chip">reference</span>',
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

/* ---- gallery state ----------------------------------------------------- */

/** The two toggles in the mode gallery, one per resting state. */
const galleryOff = ref(false)
const galleryOn = ref(true)

/* ---- the emit-contract instances --------------------------------------- */

/**
 * Bound with an explicit `:model-value` + `@update:model-value` pair rather
 * than `v-model`, so the handler can count emissions and record the value the
 * component actually sent. `v-model` would prove the round trip but hide the
 * payload.
 */
const clickModel = ref(false)
const clickEmits = ref(0)
const clickPayloads = ref<boolean[]>([])
/**
 * A caller's own `click` listener on the same instance (review finding
 * gh#25-P3-10). `mergeProps` concatenates same-named handlers into an array, so
 * this must run *as well as* the component's internal one, not instead of it —
 * previously only the manual keyboard panel depended on that, and nothing
 * asserted it.
 */
const clickCallerHandlerRuns = ref(0)
const onClickCaller = () => { clickCallerHandlerRuns.value += 1 }
const onClickEmit = (value: boolean) => {
  clickEmits.value += 1
  clickPayloads.value.push(value)
  clickModel.value = value
}

const synthModel = ref(false)
const synthEmits = ref(0)
const onSynthEmit = (value: boolean) => {
  synthEmits.value += 1
  synthModel.value = value
}

/* ---- the live keyboard lab --------------------------------------------- */

const kbdModel = ref(false)
/** The last Enter/Space seen, so a keyboard-originated click can be attributed. */
const kbdLastKey = ref('')
const kbdEnterSeen = ref(false)
const kbdSpaceSeen = ref(false)
/** Every `aria-pressed` value observed straight after a keyboard activation. */
const kbdPressedSeen = ref<string[]>([])

const onKbdKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') kbdLastKey.value = event.key
}

/**
 * `detail === 0` is the discriminator: the user agent sets it to `0` for the
 * click it synthesises from a keyboard activation, and to `1` or more for a
 * pointer click. Pairing it with the last key pressed tells Enter from Space.
 */
const onKbdClick = async (event: MouseEvent) => {
  if (event.detail !== 0) return
  if (kbdLastKey.value === 'Enter') kbdEnterSeen.value = true
  if (kbdLastKey.value === ' ') kbdSpaceSeen.value = true
  kbdLastKey.value = ''
  await nextTick()
  const el = document.querySelector('[data-testid="probe-16-kbd-live"]')
  kbdPressedSeen.value.push(el?.getAttribute('aria-pressed') ?? '')
}

/** Both keys seen, and `aria-pressed` observed in both states across them. */
const keyboardState = computed<'pending' | 'pass'>(() =>
  kbdEnterSeen.value
  && kbdSpaceSeen.value
  && kbdPressedSeen.value.includes('true')
  && kbdPressedSeen.value.includes('false')
    ? 'pass'
    : 'pending'
)

const keyboardVerdict = computed(() =>
  keyboardState.value === 'pass'
    ? 'PASS — real Enter and Space both activated the toggle, and aria-pressed tracked both ways'
    : `PENDING — focus the toggle above and press Enter, then Space. `
      + `(Enter: ${kbdEnterSeen.value ? 'seen' : 'not yet'}, `
      + `Space: ${kbdSpaceSeen.value ? 'seen' : 'not yet'}, `
      + `aria-pressed observed: ${kbdPressedSeen.value.join('/') || 'none'})`
)

/* ---- the assertion table ------------------------------------------------ */

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

const checks = ref<Check[]>([])

onMounted(async () => {
  const all = Array.from(document.querySelectorAll<HTMLElement>('.bf-chip'))
  const modes = Array.from(
    document.querySelectorAll<HTMLElement>('.probe__modes .bf-chip')
  )

  const byElement = (list: HTMLElement[], kind: string) =>
    list.filter(el => el.dataset.element === kind)

  /**
   * `getPropertyValue('--color-text')` hands back the *unresolved* token text
   * (`hsl(var(--hsl-base))`), which never equals a computed `color`. Paint the
   * token onto a throwaway element and read what the browser resolved instead.
   * (Lifted from probes 14 and 15 — same trick, same reason.)
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
    // `preventScroll`: a run of focus calls would otherwise walk the page.
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
   * are skipped, not failed. (Probe 15's walk, unchanged.)
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
   * Matched loosely on purpose: Vue's scoped-style transform appends a
   * `[data-v-…]` attribute to the compound selector, and where it lands
   * relative to the pseudo-class is an implementation detail.
   */
  /**
   * Every `.bf-chip` style rule reachable from the document, paired with
   * whether it sits inside a `@layer components` block.
   *
   * Review finding gh#25-P2-5. `layeredRule()` only ever *returns* rules found
   * inside a components layer, so it can prove that at least one is layered and
   * nothing more — a `.bf-chip` rule that leaked out of the layer, which is
   * precisely the gh#101 regression, would sail past it. This collects all of
   * them so the check can be "none escaped" rather than "one was found".
   */
  const allChipRules = (() => {
    const LAYER_BLOCK = globalThis.CSSLayerBlockRule
    const found: { selector: string, layered: boolean }[] = []

    const walk = (rules: CSSRuleList, insideComponents: boolean) => {
      for (const rule of Array.from(rules)) {
        const nowInside =
          insideComponents
          || (!!LAYER_BLOCK && rule instanceof LAYER_BLOCK && (rule as CSSLayerBlockRule).name === 'components')

        if (rule instanceof CSSStyleRule) {
          if (/\.bf-chip(?![\w-])/.test(rule.selectorText)) {
            found.push({ selector: rule.selectorText, layered: nowInside })
          }
        }

        if (rule instanceof CSSImportRule) {
          try {
            const imported = rule.styleSheet?.cssRules
            if (imported) walk(imported, nowInside)
          } catch { /* cross-origin import target */ }
          continue
        }

        const nested = (rule as CSSGroupingRule).cssRules
        if (nested) walk(nested, nowInside)
      }
    }

    for (const sheet of Array.from(document.styleSheets)) {
      try { walk(sheet.cssRules, false) } catch { /* cross-origin sheet */ }
    }
    return found
  })()

  const focusRule = layeredRule(/\.bf-chip(?![\w-])[^,{]*:focus-visible/)
  const focusCss = focusRule?.cssText ?? ''

  /*
   * The rule that carries the whole issue: the selected state must exist as a
   * rule in `@layer components`, not as an inline declaration.
   */
  const activeRule = layeredRule(/\.bf-chip(?![\w-])[^,{]*\[data-active\]/)

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
   * The colour the focus ring is actually painted in, resolved in the
   * element's own context.
   *
   * Reading `outlineColor` after `el.focus()` does not work: `:focus-visible`
   * is a heuristic, and a programmatic focus with no preceding keyboard
   * interaction does not satisfy it. Instead the hook's computed value is
   * painted onto a throwaway **child**, so a value of `currentcolor` resolves
   * against the chip's own colour rather than the document's.
   */
  const focusRingColour = (el: HTMLElement) => {
    const raw = getComputedStyle(el).getPropertyValue('--_bf-chip-focus-color').trim()
    if (!raw) return ''
    const probeEl = document.createElement('span')
    probeEl.style.cssText = 'position:absolute;visibility:hidden'
    probeEl.style.color = raw
    el.appendChild(probeEl)
    const value = getComputedStyle(probeEl).color
    probeEl.remove()
    return value
  }

  /**
   * The ground the ring is painted on. `outline-offset` is positive, so the
   * ring sits outside the border box, clear of the chip's own fill — the page
   * ground is what it has to contrast with (WCAG 1.4.11).
   */
  const pageGround = getComputedStyle(document.documentElement).backgroundColor

  /**
   * The focus ring's offset, in resolved pixels.
   *
   * The rule declares it as a token, and `outline-offset` computes whether or
   * not an outline is currently painted — so a throwaway element carrying the
   * same declaration gives the used value without having to satisfy the
   * `:focus-visible` heuristic. A positive value is what makes the page ground,
   * and not the chip's own fill, the colour the ring is adjacent to.
   */
  const resolvedOffset = (() => {
    const el = document.createElement('span')
    el.style.cssText = 'position:absolute;visibility:hidden;outline-offset:var(--border-width-medium)'
    document.body.appendChild(el)
    const value = parseFloat(getComputedStyle(el).outlineOffset)
    el.remove()
    return Number.isNaN(value) ? 0 : value
  })()

  /**
   * Padding as a multiple of the element's own font size.
   *
   * The frozen rule pins its own font size and this component takes a token
   * step, so the two boxes are not comparable in pixels — but the declaration
   * is `em`-relative on both sides, and that is what this check is about.
   * Normalising isolates the declaration from the inherited size.
   */
  const emPadding = (el: HTMLElement | null | undefined, style?: CSSStyleDeclaration) => {
    if (!el) return ''
    const s = style ?? getComputedStyle(el)
    const fs = parseFloat(s.fontSize)
    if (!fs) return ''
    const r = (v: string) => (parseFloat(v) / fs).toFixed(2)
    return [r(s.paddingTop), r(s.paddingRight), r(s.paddingBottom), r(s.paddingLeft)].join(' ')
  }

  /*
   * Read out of the isolated reference frame (gh#116). Everything below that
   * used to call `getComputedStyle(wfProbe)` now uses `wfStyle`, which belongs
   * to the frame's own view.
   */
  const wfRef = await readWireframeReference('[data-testid="probe-16-wf-chip"]')
  const wfProbe = wfRef?.el ?? null
  const wfStyle = wfRef?.style ?? null
  const plainSpan = modes.find(el => el.dataset.element === 'span' && !el.hasAttribute('data-active'))
  const activeSpan = modes.find(el => el.dataset.element === 'span' && el.hasAttribute('data-active'))
  const attrsProbe = document.querySelector<HTMLElement>('[data-testid="probe-16-attrs"]')
  const overrideProbe = document.querySelector<HTMLElement>('[data-testid="probe-16-override"]')
  const ruleOverrideProbe = document.querySelector<HTMLElement>('[data-testid="probe-16-rule-override"]')
  const precedenceProbe = document.querySelector<HTMLElement>('[data-testid="probe-16-precedence"]')
  const toggleActiveProbe = document.querySelector<HTMLElement>('[data-testid="probe-16-toggle-active"]')

  /* --- the interactive sequence, run before the table is built ----------- */

  const clickChip = document.querySelector<HTMLElement>('[data-testid="probe-16-click"]')
  const pressedBefore = clickChip?.getAttribute('aria-pressed') ?? ''
  const activeBefore = clickChip?.hasAttribute('data-active') ?? false

  clickChip?.click()
  await nextTick()
  const pressedAfter = clickChip?.getAttribute('aria-pressed') ?? ''
  const activeAfter = clickChip?.hasAttribute('data-active') ?? false
  const emitsAfterOne = clickEmits.value
  const payloadAfterOne = clickPayloads.value[0]

  clickChip?.click()
  await nextTick()
  const pressedRestored = clickChip?.getAttribute('aria-pressed') ?? ''
  const payloadAfterTwo = clickPayloads.value[1]

  /*
   * Keyboard activation, deterministically. `detail: 0` is exactly what a user
   * agent sets on the click it synthesises from Space or Enter, so this is the
   * same event shape the component will see from the keyboard — reproducible
   * in a headless run, unlike a synthetic `KeyboardEvent`, which produces no
   * activation behaviour at all.
   */
  const synthChip = document.querySelector<HTMLElement>('[data-testid="probe-16-synth"]')
  const synthBefore = synthChip?.getAttribute('aria-pressed') ?? ''
  synthChip?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }))
  await nextTick()
  const synthAfter = synthChip?.getAttribute('aria-pressed') ?? ''

  const toggles = all.filter(el => el.dataset.element === 'toggle')

  /*
   * gh#116. Read from the live CSSOM rather than from the HTML source: the
   * statement can arrive inline from the layout or as the first line of
   * `/css/styles.css`, and what matters is that the browser accepted one.
   * `CSSLayerStatementRule` is the *statement* form (`@layer a, b, c;`), not
   * the block form the `layeredRule` walk above looks for.
   */
  const layerOrder = (() => {
    const STATEMENT = globalThis.CSSLayerStatementRule
    if (!STATEMENT) return null
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList
      try {
        rules = sheet.cssRules
      } catch {
        continue // cross-origin sheet; not ours to read
      }
      for (const rule of Array.from(rules)) {
        if (rule instanceof STATEMENT) return (rule as CSSLayerStatementRule).nameList.join(', ')
      }
    }
    return null
  })()

  const linkedSheets = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]')
  ).map(link => new URL(link.href, document.baseURI))

  const sameOrigin = linkedSheets.filter(url => url.origin === location.origin)

  /**
   * Every same-origin stylesheet the page links that is neither part of the
   * CUBE stack nor an SFC style chunk. The stack is `/css/styles.css` plus the
   * files it `@import`s, which all live under `/css/`; `/css/wireframe.css`
   * sits in that directory but is the Front-2 skin, not part of the stack, so
   * it is named explicitly. Expected to be empty — this is the row that fails
   * if `global.css`, a `css-legacy/*` file or the wireframe skin ever reaches a
   * probe again.
   */
  const foreignStylesheets = sameOrigin
    .filter(url => !url.pathname.startsWith('/_nuxt/'))
    .filter(url => !url.pathname.startsWith('/css/') || url.pathname === '/css/wireframe.css')
    .map(url => url.pathname)

  /**
   * The SFC style chunks Vite emits for the client build, by name. There are
   * exactly two on a probe route — this page's own `<style scoped>` and the
   * layout's — and naming them is what makes the row above meaningful: a
   * `/_nuxt/*.css` allowance that was not checked would quietly re-admit every
   * legacy component's stylesheet through the back door. The hash is dropped;
   * the name is not.
   */
  const sfcStyleChunks = [...new Set(
    sameOrigin
      .filter(url => url.pathname.startsWith('/_nuxt/'))
      .map(url => url.pathname.replace(/^\/_nuxt\//, '').replace(/\.[^.]+\.css$/, ''))
  )].sort()

  /**
   * Cross-origin sheets, by host. Exactly one is expected: the Material
   * Symbols icon font declared app-wide in `src/nuxt.config.ts`'s
   * `app.head.link`, which reaches every route in the app and is not a layout's
   * to remove. It is a webfont sheet — `@font-face` plus the
   * `.material-symbols-outlined` class — and being cross-origin its rules
   * cannot even be read into this document's cascade for the chip. Asserted by
   * name rather than waved past, so a CDN stylesheet that is *not* that one
   * fails this row.
   */
  const crossOriginSheets = [...new Set(
    linkedSheets.filter(url => url.origin !== location.origin).map(url => url.host)
  )].sort()

  const results: Check[] = [
    // --- 1. all four modes render, each as the right element --------------
    { label: 'mode gallery instances (4 modes, resting + selected, plus a non-external anchor)', expected: 10, actual: modes.length },
    { label: '  …2 resolved to <span> (no to/href/toggle)', expected: 2, actual: byElement(modes, 'span').length },
    { label: '  …2 resolved to NuxtLink (`to`)', expected: 2, actual: byElement(modes, 'link').length },
    { label: '  …4 resolved to <a> (`href`)', expected: 4, actual: byElement(modes, 'anchor').length },
    { label: '  …2 resolved to <button> (`toggle`)', expected: 2, actual: byElement(modes, 'toggle').length },
    {
      label: '`to` really rendered an <a> with an href',
      expected: 'true',
      actual: String(byElement(modes, 'link').every(el => el.tagName === 'A' && !!el.getAttribute('href')))
    },
    {
      label: '`href` really rendered an <a> pointing at the given URL',
      expected: 'true',
      actual: String(byElement(modes, 'anchor').every(el => el.tagName === 'A' && el.getAttribute('href') === 'https://example.org/'))
    },
    {
      label: 'the default really rendered a <span>',
      expected: 'true',
      actual: String(byElement(modes, 'span').every(el => el.tagName === 'SPAN'))
    },
    {
      label: 'every toggle on the page is a native <button type="button">',
      expected: 'true',
      actual: String(toggles.length === 7 && toggles.every(el => el.tagName === 'BUTTON' && el.getAttribute('type') === 'button'))
    },
    {
      label: '[data-external] marks the external anchors only',
      expected: '2,0',
      actual: [
        byElement(modes, 'anchor').filter(el => el.hasAttribute('data-external')).length,
        modes.filter(el => el.dataset.element !== 'anchor' && el.hasAttribute('data-external')).length
      ].join(',')
    },

    // --- 2. the toggle contract -------------------------------------------
    { label: 'an unpressed toggle renders aria-pressed="false" (present, not absent)', expected: 'false', actual: pressedBefore },
    { label: '  …and carries no [data-active]', expected: 'false', actual: String(activeBefore) },
    { label: 'activation flips aria-pressed to "true"', expected: 'true', actual: pressedAfter },
    { label: '  …and adds [data-active]', expected: 'true', actual: String(activeAfter) },
    { label: 'activation emitted update:modelValue exactly once', expected: 1, actual: emitsAfterOne },
    { label: '  …with the negated value', expected: 'true', actual: String(payloadAfterOne) },
    { label: '  …and the parent binding reached the component', expected: 'true', actual: String(clickModel.value === false && payloadAfterTwo === false) },
    { label: 'activating again returns aria-pressed to "false"', expected: 'false', actual: pressedRestored },
    {
      label: 'every toggle keeps aria-pressed in step with [data-active]',
      expected: 'true',
      actual: String(toggles.every(el => (el.getAttribute('aria-pressed') === 'true') === el.hasAttribute('data-active')))
    },

    // --- 3. keyboard activation, deterministically ------------------------
    { label: 'a keyboard-shaped click (detail: 0) starts from aria-pressed="false"', expected: 'false', actual: synthBefore },
    { label: '  …and flips it to "true"', expected: 'true', actual: synthAfter },
    { label: '  …emitting update:modelValue', expected: 1, actual: synthEmits.value },
    {
      label: 'no keydown handler is needed — the toggle is a real <button>',
      expected: 'true',
      actual: String(toggles.every(el => el instanceof HTMLButtonElement))
    },

    // --- 4. the selected state is CSS, never an inline declaration --------
    {
      label: 'a .bf-chip[data-active] rule exists in @layer components',
      expected: 'true',
      actual: String(!!activeRule)
    },
    {
      label: '  …and it re-points the hooks rather than declaring paint directly',
      expected: 'true',
      actual: String(/--_bf-chip-bg:/.test(activeRule?.cssText ?? '') && /--_bf-chip-color:/.test(activeRule?.cssText ?? ''))
    },
    {
      label: 'no chip carries a style attribute (except the override demo)',
      expected: 0,
      actual: all.filter(el => el !== overrideProbe && el.hasAttribute('style')).length
    },
    {
      label: 'the selected chips are painted all the same, whatever the element',
      expected: 'true',
      actual: (() => {
        const selected = modes.filter(el => el.hasAttribute('data-active'))
        if (selected.length !== 5) return 'false'
        const paints = new Set(selected.map(el => {
          const s = getComputedStyle(el)
          return `${s.backgroundColor}|${s.color}|${s.borderTopColor}`
        }))
        return String(paints.size === 1)
      })()
    },
    {
      /*
       * Review finding gh#25-P2-2. Comparing only the paint was not enough to
       * make the four modes interchangeable, and the gap let a real bug
       * through: a `<button>` carries UA `line-height` and `text-align`
       * declarations the other branches do not, so before gh#25-P2-1 the
       * toggle rendered 5px shorter and centre-aligned than every other mode.
       *
       * `bfFilterBar` (issue 30) lays toggle chips out in a row beside link
       * chips, so "the same height and the same type" is part of this atom's
       * contract, not a cosmetic detail. Height is measured rather than
       * inferred: it is the value that actually breaks a row.
       */
      label: 'every mode renders the same box and the same type, font-weight included',
      expected: 'true',
      actual: (() => {
        const resting = modes.filter(el => !el.hasAttribute('data-active'))
        if (resting.length !== 5) return 'false'
        const boxes = new Set(resting.map(el => {
          const s = getComputedStyle(el)
          /*
           * `fontWeight` is back in the comparison, and it is the row that
           * carries gh#116. It was excluded here as residual #113: the stack
           * shipped `p, li, input, button, a { font-weight: 100 }` **outside**
           * any `@layer` — `base/typography.css` closed its `@layer defaults`
           * block thirty lines early — and unlayered author rules outrank every
           * layer, so `.bf-chip { font: inherit }` in `@layer components` won
           * on the span branch (which that selector does not match) and lost on
           * the link, anchor and toggle branches: 400 against 100, measured
           * here. gh#116 moved that closing brace to the end of the file, so
           * the declared order now governs and all five modes are genuinely
           * interchangeable — which is what `bfFilterBar` (issue 30) needs when
           * it lays toggle chips out in a row beside link chips.
           */
          return [
            el.getBoundingClientRect().height.toFixed(2),
            s.fontFamily, s.fontSize, s.fontStyle, s.fontWeight,
            s.lineHeight, s.textAlign, s.letterSpacing, s.textTransform
          ].join('|')
        }))
        return String(boxes.size === 1)
      })()
    },
    {
      label: '  …and selecting one does not change its height either',
      expected: 'true',
      actual: (() => {
        const h = (el: HTMLElement | undefined) => el?.getBoundingClientRect().height.toFixed(2) ?? ''
        return String(!!plainSpan && !!activeSpan && h(plainSpan) === h(activeSpan))
      })()
    },

    // --- 5. keyboard reachability -----------------------------------------
    {
      label: 'every interactive chip takes focus (7 toggles, 2 links, 4 anchors)',
      expected: 13,
      actual: all.filter(el => el.dataset.element !== 'span').filter(takesFocus).length
    },
    {
      label: 'no span chip takes focus',
      expected: 0,
      actual: byElement(all, 'span').filter(takesFocus).length
    },

    // --- 6. focus ring: it exists, and it is visible ----------------------
    { label: 'a :focus-visible rule exists in @layer components', expected: 'true', actual: String(!!focusRule) },
    {
      label: '  …with a real outline and offset',
      expected: 'true',
      actual: String(/outline:\s*[^;]*solid/.test(focusCss) && /outline-offset:/.test(focusCss))
    },
    {
      label: '  …and the existing --outline-focus halo',
      expected: 'true',
      actual: String(/box-shadow:\s*var\(\s*--outline-focus\s*\)/.test(focusCss))
    },
    {
      label: 'resting ring contrasts with the page ground (WCAG 1.4.11, ≥3:1)',
      expected: 'true',
      actual: (() => {
        const el = toggles.find(t => !t.hasAttribute('data-active'))
        return String(!!el && contrast(focusRingColour(el), pageGround) >= 3)
      })()
    },
    {
      /*
       * The gh#24-P2-1 defect, checked before it can recur: on `currentcolor`
       * the selected chip's ring would inherit its light label colour and be
       * painted white on a white page — a focus indicator that is not there.
       */
      label: 'selected ring contrasts with the page ground too (≥3:1)',
      expected: 'true',
      actual: (() => {
        const el = modes.find(m => m.dataset.element === 'toggle' && m.hasAttribute('data-active'))
        return String(!!el && contrast(focusRingColour(el), pageGround) >= 3)
      })()
    },
    {
      /*
       * Probe 15 also compared the ring with the filled variant's own ground.
       * That check is **not** carried over, and deleting it is not a
       * relaxation — it is a correction. `bfButton`'s filled variant is
       * `--color-primary`, a different hue from its ring, so there the
       * comparison meant something. Here the selected fill is
       * `--color-surface-inverse` and the ring is `--color-text`, which
       * resolve to the same paint — and the ring is drawn with a **positive**
       * `outline-offset`, i.e. entirely outside the border box, so the fill is
       * never one of its adjacent colours. WCAG 1.4.11 asks for contrast
       * against what the indicator actually touches, which is the ground; that
       * is the check immediately above, and it passes at ≈21:1. Asserting
       * contrast against a colour the ring never meets would fail a component
       * that is correct.
       *
       * What does have to hold is the geometry that premise rests on: the
       * offset must really be positive, in resolved pixels and not just in the
       * rule text.
       */
      label: 'the ring is drawn clear of the fill — a positive, resolved outline-offset',
      expected: 'true',
      actual: String(/outline-offset:\s*var\(--border-width-medium\)/.test(focusCss) && resolvedOffset > 0)
    },

    // --- 7. box metrics equal the frozen wireframe chip's -----------------
    {
      label: 'the wireframe reference chip is present and measurable',
      expected: 'true',
      actual: String(!!wfProbe && !!plainSpan && emPadding(wfProbe, wfStyle ?? undefined).length > 0)
    },
    {
      label: 'em-normalised padding matches the wireframe chip',
      expected: emPadding(wfProbe, wfStyle ?? undefined),
      actual: emPadding(plainSpan)
    },
    {
      label: 'border width matches the wireframe chip',
      expected: wfStyle ? wfStyle.borderTopWidth : '',
      actual: plainSpan ? getComputedStyle(plainSpan).borderTopWidth : ''
    },
    {
      label: 'border radius matches the wireframe chip (--radius-pill)',
      expected: wfStyle ? wfStyle.borderTopLeftRadius : '',
      actual: plainSpan ? getComputedStyle(plainSpan).borderTopLeftRadius : ''
    },
    {
      label: 'selecting a chip changes no metric — the box does not move',
      expected: plainSpan ? `${emPadding(plainSpan)}|${getComputedStyle(plainSpan).borderTopWidth}` : '',
      actual: activeSpan ? `${emPadding(activeSpan)}|${getComputedStyle(activeSpan).borderTopWidth}` : ''
    },

    // --- 8. colour: existing semantic tokens, no ground on the default ----
    {
      label: 'a resting chip’s label resolves to --color-text',
      expected: resolveToken('--color-text'),
      actual: plainSpan ? getComputedStyle(plainSpan).color : ''
    },
    {
      label: 'a resting chip paints no ground (not a white one)',
      expected: unpaintedGround,
      actual: plainSpan ? getComputedStyle(plainSpan).backgroundColor : ''
    },
    {
      label: 'a selected chip is filled with --color-surface-inverse',
      expected: resolveToken('--color-surface-inverse'),
      actual: activeSpan ? getComputedStyle(activeSpan).backgroundColor : ''
    },
    {
      label: '  …with a --color-text-inverse label',
      expected: resolveToken('--color-text-inverse'),
      actual: activeSpan ? getComputedStyle(activeSpan).color : ''
    },
    {
      label: '  …and a border of the same paint, so the box is unchanged',
      expected: resolveToken('--color-surface-inverse'),
      actual: activeSpan ? getComputedStyle(activeSpan).borderTopColor : ''
    },

    // --- 9. @layer survived the build (gh#101 / residual #98) -------------
    {
      label: 'at least one .bf-chip rule reached the live CSSOM',
      expected: 'true',
      actual: String(allChipRules.length > 0)
    },
    {
      /*
       * The gh#101 guard proper: not "one of them is layered" but "none of them
       * escaped". A flattened rule outranks every layer, so a single leak is
       * the whole regression.
       */
      label: '  …and NO .bf-chip rule sits outside @layer components',
      expected: 0,
      actual: allChipRules.filter(r => !r.layered).length
    },

    // --- 10. $attrs fallthrough, and the consumer override ----------------
    {
      label: '$attrs `data-testid` + `aria-label` reached the rendered element',
      expected: 'SPAN|probe attrs',
      actual: attrsProbe ? `${attrsProbe.tagName}|${attrsProbe.getAttribute('aria-label') ?? ''}` : ''
    },
    {
      label: "a caller's own `style` outranks the [data-active] rule’s hooks",
      expected: resolveToken('--color-text'),
      actual: overrideProbe ? getComputedStyle(overrideProbe).color : ''
    },
    {
      /*
       * The route the docblock actually claims, which the inline style above
       * does not exercise (review finding gh#25-P2-4): a real rule, in a later
       * layer, re-pointing a hook on a selected chip.
       */
      label: "  …and so does a caller's rule in a later @layer",
      expected: resolveToken('--color-text'),
      actual: ruleOverrideProbe ? getComputedStyle(ruleOverrideProbe).color : ''
    },

    // --- 11. prop precedence: the headline rule, finally asserted ----------
    {
      /*
       * Review finding gh#25-P3-9: `toggle` outranking `to`/`href` is the
       * component's headline rule and had no instance at all until now.
       */
      label: '`toggle` beats `to` and `href`: a real <button>, never a link',
      expected: 'BUTTON|toggle|no-href',
      actual: precedenceProbe
        ? [
            precedenceProbe.tagName,
            precedenceProbe.dataset.element,
            precedenceProbe.hasAttribute('href') ? 'has-href' : 'no-href'
          ].join('|')
        : ''
    },
    {
      label: '  …and it is keyboard-operable, not a disguised link',
      expected: 'true',
      actual: String(!!precedenceProbe && precedenceProbe.getAttribute('type') === 'button' && takesFocus(precedenceProbe))
    },
    {
      label: '`active` is ignored in toggle mode — modelValue owns the state',
      expected: 'false|false',
      actual: toggleActiveProbe
        ? `${toggleActiveProbe.getAttribute('aria-pressed')}|${toggleActiveProbe.hasAttribute('data-active')}`
        : ''
    },
    {
      /*
       * Review finding gh#25-P3-10. The docblock promises a caller's own click
       * listener runs *as well as* the internal one. Two pointer activations
       * happened above, so the caller's handler must have run twice — and the
       * emit count proves the internal handler ran too.
       */
      label: "a caller's @click ran alongside the component's own, not instead of it",
      expected: '2|2',
      actual: `${clickCallerHandlerRuns.value}|${clickEmits.value}`
    },

    /* --- 12. the CSS-loading contract of the `bf-probe` layout (gh#116) ----
     *
     * These three rows are gh#116's own acceptance, asserted here because this
     * is the page the issue names. They are about the *page*, not the chip, and
     * they are what keeps every measurement above worth reading: the declared
     * cascade order actually governs, and nothing outside the CUBE stack is on
     * the page to outrank it. The real shell layout (#55) has to reproduce all
     * three. */
    {
      /*
       * #103: the order statement is absent on every route that does not load
       * `/css/styles.css`, and without it `@layer components` is just the first
       * layer the browser happens to meet.
       */
      label: 'the @layer order statement reached the page',
      expected: 'true',
      actual: String(!!layerOrder)
    },
    {
      /*
       * #108: membership was asserted, order never was. If a component's own
       * `@layer components { … }` were the first layer statement seen,
       * `components` would become the **weakest** layer — silently, with every
       * membership row above still green. Assert the sequence itself.
       */
      label: 'and it declares the full order, components after composition',
      expected: 'reset, defaults, tokens, themes, composition, components, utils, overrides',
      actual: layerOrder ?? ''
    },
    {
      /*
       * The `bf-probe` layout is the sole stylesheet injector for this route,
       * and it loads the CUBE stack and nothing else — no `global.css`, no
       * `css-legacy/*`, not the Front-2 wireframe skin (which this page reads
       * in an isolated frame instead). A stylesheet from outside it is exactly
       * how the unlayered `font-weight` rule above used to win.
       */
      label: 'every same-origin stylesheet on the page belongs to the CUBE stack',
      expected: '',
      actual: foreignStylesheets.join(', ')
    },
    {
      label: '  …and the only SFC style chunks are this page\u2019s and its layout\u2019s',
      expected: '16-bf-chip, bf-probe',
      actual: sfcStyleChunks.join(', ')
    },
    {
      label: '  …and the only cross-origin sheet is the app-wide icon font',
      expected: 'fonts.googleapis.com',
      actual: crossOriginSheets.join(', ')
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
    data-probe="16"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 16 — <code>bfChip</code></h1>
    <p class="probe__lede">
      One chip atom, four modes, resolved from the props rather than chosen by
      the caller: <code>toggle</code> renders
      <code>&lt;button aria-pressed&gt;</code> whatever else is set,
      <code>to</code> renders <code>NuxtLink</code>, <code>href</code> renders
      an <code>&lt;a&gt;</code> with the <code>[data-external]</code> marker,
      and neither renders a <code>&lt;span&gt;</code>. The selected state is a
      <code>[data-active]</code> rule in <code>@layer components</code> — never
      an inline declaration, which is the duplication this component exists to
      delete.
    </p>

    <section class="probe__modes" aria-labelledby="modes-heading">
      <h2 id="modes-heading">The four modes, resting and selected</h2>

      <div class="probe__row">
        <h3><code>span</code> — the default</h3>
        <div class="probe__chips">
          <bfChip>resting</bfChip>
          <bfChip active>selected</bfChip>
        </div>
      </div>

      <div class="probe__row">
        <h3><code>to</code> — <code>NuxtLink</code></h3>
        <div class="probe__chips">
          <bfChip to="/bf-probe/16-bf-chip">resting</bfChip>
          <bfChip to="/bf-probe/16-bf-chip" active>selected</bfChip>
        </div>
      </div>

      <div class="probe__row">
        <h3><code>href</code> — <code>&lt;a&gt;</code>, with and without <code>external</code></h3>
        <div class="probe__chips">
          <bfChip href="https://example.org/" external>resting · external</bfChip>
          <bfChip href="https://example.org/" external active>selected · external</bfChip>
          <bfChip href="https://example.org/">resting · plain</bfChip>
          <bfChip href="https://example.org/" active>selected · plain</bfChip>
        </div>
      </div>

      <div class="probe__row">
        <h3><code>toggle</code> — <code>&lt;button aria-pressed&gt;</code></h3>
        <div class="probe__chips">
          <bfChip v-model="galleryOff" toggle>unpressed</bfChip>
          <bfChip v-model="galleryOn" toggle>pressed</bfChip>
        </div>
      </div>
    </section>

    <section class="probe__interactive" aria-labelledby="interactive-heading">
      <h2 id="interactive-heading">
        The emit contract — <code>update:modelValue</code>
      </h2>
      <p>
        Bound as an explicit <code>:model-value</code> +
        <code>@update:model-value</code> pair, so the payload the component
        sends is recorded rather than merely round-tripped.
      </p>
      <div class="probe__chips">
        <bfChip
          toggle
          :model-value="clickModel"
          data-testid="probe-16-click"
          @click="onClickCaller"
          @update:model-value="onClickEmit"
        >
          pointer activation
        </bfChip>
        <bfChip
          toggle
          :model-value="synthModel"
          data-testid="probe-16-synth"
          @update:model-value="onSynthEmit"
        >
          keyboard-shaped activation
        </bfChip>
      </div>
      <p>
        emissions: <code>{{ clickEmits }}</code> · payloads:
        <code>{{ clickPayloads.join(', ') || 'none' }}</code>
      </p>
    </section>

    <section class="probe__keyboard" aria-labelledby="keyboard-heading">
      <h2 id="keyboard-heading">Keyboard lab — real Enter and Space</h2>
      <p>
        Tab to the chip below, then press <kbd>Enter</kbd> and
        <kbd>Space</kbd>. A synthetic <code>KeyboardEvent</code> produces no
        activation behaviour in any browser, so this panel watches for the
        click the user agent itself synthesises — the one whose
        <code>detail</code> is <code>0</code> — and pairs it with the key that
        was pressed.
      </p>
      <div class="probe__chips">
        <bfChip
          v-model="kbdModel"
          toggle
          data-testid="probe-16-kbd-live"
          @keydown="onKbdKeydown"
          @click="onKbdClick"
        >
          press me with the keyboard
        </bfChip>
      </div>
      <p
        class="probe__verdict"
        :data-state="keyboardState"
        data-testid="probe-16-keyboard"
      >
        {{ keyboardVerdict }}
      </p>
    </section>

    <section class="probe__precedence" aria-labelledby="precedence-heading">
      <h2 id="precedence-heading">
        Prop precedence — the rule with no test until now
      </h2>
      <p>
        <code>toggle</code> outranks <code>to</code> and <code>href</code>
        outright, and <code>active</code> is ignored in toggle mode. Both are
        stated in the component's contract; neither had an instance until
        review finding gh#25-P3-9.
      </p>
      <div class="probe__chips">
        <bfChip
          to="/bf-probe/16-bf-chip"
          href="https://example.org/"
          toggle
          data-testid="probe-16-precedence"
        >
          toggle beats to + href
        </bfChip>
        <bfChip toggle active data-testid="probe-16-toggle-active">
          active is ignored in toggle mode
        </bfChip>
      </div>
    </section>

    <section class="probe__attrs" aria-labelledby="attrs-heading">
      <h2 id="attrs-heading"><code>$attrs</code> fallthrough and consumer override</h2>
      <div class="probe__chips">
        <bfChip data-testid="probe-16-attrs" aria-label="probe attrs">
          $attrs reaches the root
        </bfChip>
        <!--
          The escape hatch that replaces the style binding this component does
          not have: `$attrs` is bound last, so a caller's own declaration
          outranks the hooks the `[data-active]` rule sets.
        -->
        <bfChip
          active
          data-testid="probe-16-override"
          :style="{ '--_bf-chip-color': 'var(--color-text)' }"
        >
          caller style wins
        </bfChip>
        <!--
          Review finding gh#25-P2-4. The inline style above proves the easy
          route. This one is overridden by a real **rule**, in `@layer
          overrides` — a later layer than the component's — which is the route
          the docblock actually claims. A rule in `@layer components` would
          lose, because the component's scoped selector is (0,3,0) and comes
          later; that is the claim being pinned down here.
        -->
        <bfChip active data-testid="probe-16-rule-override">
          caller rule wins
        </bfChip>
      </div>
    </section>

    <!--
      The measurement reference: a real wireframe chip, painted by the frozen
      `/css/wireframe.css` inside a document of its own. An iframe rather than
      an off-screen box in this page, because gh#116 makes the `bf-probe`
      layout the sole stylesheet injector and the wireframe skin is not part of
      the CUBE stack it loads. Off-screen rather than `hidden`, so the computed
      box is still a used value; `aria-hidden` + `tabindex="-1"` keep it out of
      the keyboard-reachability count above. `srcdoc` is rendered here rather
      than assigned at runtime so the reference still appears in the
      prerendered HTML that `scripts/verify-bf-chip.ts` greps.
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
      data-testid="probe-16-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-16-table">
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

/*
  The `@layer overrides` route from the docblock, exercised for real. This
  stylesheet is scoped too, so the selector picks up this page's `[data-v-...]`
  — which the chip's root element carries, because Vue puts the parent's scope
  id on a child component's root. Being in a later layer is what makes it win.
*/
@layer overrides {
  [data-testid='probe-16-rule-override'] {
    --_bf-chip-color: var(--color-text);
  }
}

.probe__row,
.probe__interactive,
.probe__keyboard,
.probe__precedence,
.probe__attrs {
  padding: var(--space-s, 1rem);
  margin-block-end: var(--space-s, 1rem);
  border: 1px solid currentcolor;
}

.probe__chips {
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
