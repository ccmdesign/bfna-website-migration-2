<script setup lang="ts">
/**
 * Probe — issue 41 / gh#50: `bfNotice`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## Why every instance mounts at once
 *
 * `bfNotice` renders no heading and claims no landmark, so — unlike probe 33,
 * which cycles a single mount point because its component owns the page's
 * `<h1>` — all seven instances here can stand side by side. That matters for
 * the spec's own static check,
 *
 * ```bash
 * grep -q 'data-variant="warning"' .output/public/bf-probe/41-bf-notice/index.html
 * ```
 *
 * which is true of the prerendered HTML only because the warning variant is
 * mounted unconditionally, and it is what lets the three variants be compared
 * *against each other* in one pass rather than against remembered values.
 *
 * ## What it proves
 *
 *  1. **Three variants render, each carrying its own `data-variant`**, and the
 *     default — `<bfNotice>` with no `variant` — is `note`.
 *  2. **`role="status"` appears on the announced instance and nowhere else.**
 *     The three unannounced ones carry no `role` attribute at all (not
 *     `role=""`), and `announced` changes nothing else about the render.
 *  3. **The three variants are visibly distinct**: their resolved background,
 *     border and text colours differ pairwise. A variant that quietly fell back
 *     to the `note` colourway fails a row here rather than passing the eye.
 *  4. **Contrast, measured**: text-on-background ≥ 4.5:1 (WCAG 1.4.3 AA) and
 *     border-on-background ≥ 3:1 (1.4.11) for each variant, computed from the
 *     resolved `rgb()` triples by a relative-luminance function written below.
 *     The ratios are reported as numbers, so a reviewer reads the margin rather
 *     than a bare pass.
 *  5. **…in both colour schemes.** The stack ships one colourway — there is no
 *     `prefers-color-scheme` block anywhere under `public/css/`, and the theme
 *     layer is entirely commented out — so the honest form of "passes AA in
 *     dark mode" is that the resolved pairs are *identical* under a forced
 *     `color-scheme: dark`. A second, `aria-hidden` group measures exactly
 *     that. Recorded in the spec's Decisions section.
 *  6. **The default slot renders**, and the component adds no wrapper around
 *     it — the notice's only child is the caller's own element.
 *  7. **The monospace "reviewer note" look is gone** (see Decisions): the
 *     resolved `font-family` is the body's, and contains no monospace family.
 *     The box it inherits from `.wf-note` — the 4px inline-start rule — is not.
 *  8. `.bf-notice` rules are inside `@layer components` in the live CSSOM, the
 *     component emits no inline `style` of its own, `$attrs` reaches the root
 *     and merges with its class, and no `bf-*` rule on the page uses `:not()`
 *     with a complex selector (D-20.5).
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 41`,
 * per the gh#20–#41 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
import type { NoticeVariant } from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe41BfNotice' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 41 — bfNotice'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

const VARIANTS: NoticeVariant[] = ['note', 'info', 'warning']

/**
 * The real strings the three wireframe call sites carry (BRIEF §5 rule 10 —
 * real content, not lorem). The archive banner keeps its inline link, which is
 * the reason the content is a slot rather than a prop.
 */
const SAMPLE: Record<NoticeVariant, string> = {
  note: '[semantic ranking simulated — real vector search is Front 4]',
  info: 'This insight is part of the archive. See recent work on Democracy.',
  warning: 'No records matched — try fewer or different words.'
}

// --- colour maths ----------------------------------------------------------

/**
 * Parse whatever `getComputedStyle` hands back for a colour into 0–255 sRGB.
 *
 * Two forms, because the variant grounds come from `color-mix()` in the token
 * layer and browsers do not agree on how a mixed colour serialises: Chrome has
 * shipped both `rgb(227, 234, 237)` and `color(srgb 0.8902 0.9176 0.9294)` for
 * the same declaration across versions. Anything else returns `null` and the
 * row that used it reports the raw string, so an unrecognised serialisation
 * fails **loudly** instead of being coerced into a plausible number.
 */
const parseColor = (value: string): [number, number, number] | null => {
  const rgb = value.match(/^rgba?\(([^)]+)\)$/i)
  if (rgb) {
    const parts = (rgb[1] ?? '').split(/[\s,/]+/).filter(Boolean).slice(0, 3)
    if (parts.length !== 3) return null
    const nums = parts.map(p => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p)))
    return nums.some(Number.isNaN) ? null : [nums[0] as number, nums[1] as number, nums[2] as number]
  }

  const srgb = value.match(/^color\(\s*srgb\s+([^)]+)\)$/i)
  if (srgb) {
    const parts = (srgb[1] ?? '').split(/[\s/]+/).filter(Boolean).slice(0, 3)
    if (parts.length !== 3) return null
    const nums = parts.map(p => (p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p)) * 255)
    return nums.some(Number.isNaN) ? null : [nums[0] as number, nums[1] as number, nums[2] as number]
  }

  return null
}

/** WCAG 2.1 relative luminance of an sRGB triple. */
const luminance = ([r, g, b]: [number, number, number]): number => {
  const channel = (v: number): number => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * WCAG 2.1 contrast ratio, or `null` when either colour could not be parsed.
 * Rounded to two decimals so the reported number is stable across sub-pixel
 * differences in how a mix serialises.
 */
const contrast = (a: string, b: string): number | null => {
  const ca = parseColor(a)
  const cb = parseColor(b)
  if (!ca || !cb) return null
  const la = luminance(ca)
  const lb = luminance(cb)
  const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
  return Math.round(ratio * 100) / 100
}

// --- CSSOM helpers (same as probes 14–33) ----------------------------------

/**
 * Walk every reachable stylesheet — `@import`ed ones included, since
 * `/css/styles.css` is nothing but a list of imports — for a style rule whose
 * selector matches and whose ancestry includes a `@layer components` block.
 * Cross-origin sheets throw on `cssRules`; they are skipped, not failed.
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

// --- what a mounted notice looked like -------------------------------------

interface Snapshot {
  key: string
  found: boolean
  variantAttr: string
  /** `null` when the attribute is absent — which is not the same as `''`. */
  roleAttr: string | null
  bg: string
  border: string
  color: string
  fontFamily: string
  borderInlineStartWidth: string
  paddingBlockStart: string
  /** Does the ROOT carry an inline style **declaration** (not just the attribute)? */
  inlineStyle: boolean
  attrsCase: string
  attrsClassMerged: boolean
  /** Tag names of the root's element children, in DOM order. */
  children: string
  slotText: string
}

const snap = (key: string): Snapshot => {
  const root = document.querySelector<HTMLElement>(`[data-probe-case="${key}"]`)
  if (!root) {
    return {
      key,
      found: false,
      variantAttr: '',
      roleAttr: null,
      bg: '',
      border: '',
      color: '',
      fontFamily: '',
      borderInlineStartWidth: '',
      paddingBlockStart: '',
      inlineStyle: false,
      attrsCase: '',
      attrsClassMerged: false,
      children: 'no root',
      slotText: ''
    }
  }

  const style = getComputedStyle(root)

  return {
    key,
    found: true,
    variantAttr: root.getAttribute('data-variant') ?? '',
    roleAttr: root.getAttribute('role'),
    bg: style.backgroundColor,
    border: style.borderInlineStartColor,
    color: style.color,
    fontFamily: style.fontFamily,
    borderInlineStartWidth: style.borderInlineStartWidth,
    paddingBlockStart: style.paddingBlockStart,
    /*
     * Read as a *declaration*, not as the presence of the attribute — Vue's SSR
     * serializer emits a bare `style=""` for a `:style` binding whose value is
     * `undefined`, and an attribute that declares nothing is not an inline
     * style (probe 33's note).
     */
    inlineStyle: root.style.cssText.trim() !== '',
    attrsCase: root.dataset.probeCase ?? '',
    attrsClassMerged:
      root.classList.contains('bf-notice') && root.classList.contains('probe__marker'),
    children: Array.from(root.children).map(el => el.tagName.toLowerCase()).join(' > '),
    slotText: (root.textContent ?? '').trim()
  }
}

const checks = ref<Check[]>([])

/** Set when the safety net published the rows instead of the walk. */
const seen = reactive({ timedOut: false })

let reported = false

const report = () => {
  if (reported) return
  reported = true

  // Light group: the three variants, plus the default-prop and announced cases.
  const light = VARIANTS.map(v => snap(`light-${v}`))
  const dark = VARIANTS.map(v => snap(`dark-${v}`))
  const fallback = snap('default-prop')
  const announced = snap('announced')

  const at = (key: string): Snapshot => light.find(s => s.key === `light-${key}`) as Snapshot
  const note = at('note')
  const info = at('info')
  const warning = at('warning')

  /** `a|b|c` for a triple of variant readings — one string to compare. */
  const triple = (snaps: Snapshot[], read: (s: Snapshot) => string | number | boolean): string =>
    snaps.map(s => String(read(s))).join('|')

  /** How many of the three pairs among the variants share a value. */
  const collisions = (read: (s: Snapshot) => string): string => {
    const pairs: string[] = []
    for (let i = 0; i < light.length; i += 1) {
      for (let j = i + 1; j < light.length; j += 1) {
        const a = light[i] as Snapshot
        const b = light[j] as Snapshot
        if (read(a) === read(b)) pairs.push(`${a.key}=${b.key}`)
      }
    }
    return pairs.length === 0 ? 'none' : pairs.join(' ')
  }

  /** `ok` when every ratio clears the floor; otherwise the offending readings. */
  const meets = (snaps: Snapshot[], read: (s: Snapshot) => string, floor: number): string => {
    const bad = snaps
      .map(s => {
        const ratio = contrast(read(s), s.bg)
        return ratio === null
          ? `${s.key}:unparseable(${read(s)} on ${s.bg})`
          : ratio < floor ? `${s.key}:${ratio}` : ''
      })
      .filter(Boolean)
    return bad.length === 0 ? 'ok' : bad.join(' ')
  }

  /** The measured ratios, for a reader — never asserted on directly. */
  const ratios = (snaps: Snapshot[], read: (s: Snapshot) => string): string =>
    snaps.map(s => `${s.key.replace(/^(light|dark)-/, '')}:${contrast(read(s), s.bg) ?? '?'}`).join(' ')

  const rule = layeredRule(s => /\.bf-notice(?![\w-])/.test(s))
  const badNots = complexNotSelectors()
  const bodyFont = getComputedStyle(document.body).fontFamily

  checks.value = [
    // --- 0. did the walk actually run? --------------------------------------
    {
      label: 'the assertions ran, rather than being rescued by the timeout',
      expected: 'false',
      actual: String(seen.timedOut)
    },
    {
      label: 'every expected instance mounted (3 light + 3 dark + default + announced)',
      expected: 8,
      actual: [...light, ...dark, fallback, announced].filter(s => s.found).length
    },

    // --- 1. the variants ----------------------------------------------------
    {
      label: 'each variant renders with its own data-variant attribute',
      expected: VARIANTS.join('|'),
      actual: triple(light, s => s.variantAttr)
    },
    {
      label: 'the warning variant is present (the spec’s prerendered-HTML grep)',
      expected: 'warning',
      actual: warning.variantAttr || 'missing'
    },
    {
      label: '<bfNotice> with no `variant` prop defaults to note',
      expected: 'note',
      actual: fallback.variantAttr || 'missing'
    },
    {
      label: '  …and paints identically to an explicit variant="note"',
      expected: `${note.bg}|${note.border}|${note.color}`,
      actual: `${fallback.bg}|${fallback.border}|${fallback.color}`
    },

    // --- 2. role="status", and only where asked ------------------------------
    {
      label: 'role="status" renders on the announced instance',
      expected: 'status',
      actual: announced.roleAttr ?? 'no role attribute'
    },
    {
      label: '  …and on NO unannounced instance — the attribute is absent, not empty',
      expected: 'null|null|null',
      actual: triple(light, s => String(s.roleAttr))
    },
    {
      label: '`announced` changes nothing but the role (same paint as its variant)',
      expected: `${note.bg}|${note.border}|${note.color}`,
      actual: `${announced.bg}|${announced.border}|${announced.color}`
    },

    // --- 3. the three variants are visibly distinct --------------------------
    {
      label: 'no two variants share a background colour',
      expected: 'none',
      actual: collisions(s => s.bg)
    },
    {
      label: 'no two variants share a border colour',
      expected: 'none',
      actual: collisions(s => s.border)
    },
    {
      label: 'no two variants share a text colour',
      expected: 'none',
      actual: collisions(s => s.color)
    },

    // --- 4. contrast, measured ----------------------------------------------
    {
      label: 'text on background clears WCAG 1.4.3 AA (4.5:1) for every variant',
      expected: 'ok',
      actual: meets(light, s => s.color, 4.5)
    },
    {
      label: '  …measured ratios (reference row, never fails)',
      expected: ratios(light, s => s.color),
      actual: ratios(light, s => s.color)
    },
    {
      label: 'border on background clears WCAG 1.4.11 (3:1) for every variant',
      expected: 'ok',
      actual: meets(light, s => s.border, 3)
    },
    {
      label: '  …measured ratios (reference row, never fails)',
      expected: ratios(light, s => s.border),
      actual: ratios(light, s => s.border)
    },

    // --- 5. …and under a forced color-scheme: dark ---------------------------
    {
      label: 'under color-scheme: dark the resolved paint is IDENTICAL (one colourway)',
      expected: triple(light, s => `${s.bg}/${s.border}/${s.color}`),
      actual: triple(dark, s => `${s.bg}/${s.border}/${s.color}`)
    },
    {
      label: '  …so text contrast still clears 4.5:1 in dark',
      expected: 'ok',
      actual: meets(dark, s => s.color, 4.5)
    },
    {
      label: '  …and border contrast still clears 3:1 in dark',
      expected: 'ok',
      actual: meets(dark, s => s.border, 3)
    },

    // --- 6. the slot ---------------------------------------------------------
    {
      label: 'the default slot renders the caller’s own element, with no added wrapper',
      expected: 'p|p|p',
      actual: triple(light, s => s.children)
    },
    {
      label: '  …carrying the text it was handed',
      expected: VARIANTS.map(v => SAMPLE[v]).join('|'),
      actual: triple(light, s => s.slotText)
    },

    // --- 7. the box is kept, the reviewer look is not ------------------------
    {
      label: 'the 4px inline-start rule survives from .wf-note',
      expected: '4px|4px|4px',
      actual: triple(light, s => s.borderInlineStartWidth)
    },
    {
      label: 'the monospace “reviewer note” look is DROPPED — font is the body’s',
      expected: [bodyFont, bodyFont, bodyFont].join('|'),
      actual: triple(light, s => s.fontFamily)
    },
    {
      label: '  …and names no monospace family',
      expected: 'false',
      actual: String(light.some(s => /\bmonospace\b/i.test(s.fontFamily)))
    },

    // --- 8. layer, attrs, inline style, D-20.5 -------------------------------
    {
      label: '.bf-notice rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(rule !== null)
    },
    {
      label: 'the three hooks are declared on the base rule',
      expected: 'var(--color-base-super-light)|var(--color-base-light)|var(--color-text)',
      actual: rule
        ? [
            rule.style.getPropertyValue('--_bf-notice-bg').trim(),
            rule.style.getPropertyValue('--_bf-notice-border').trim(),
            rule.style.getPropertyValue('--_bf-notice-color').trim()
          ].join('|')
        : 'no rule'
    },
    {
      label: 'the component contributes no inline style of its own',
      expected: 'false|false|false',
      actual: triple(light, s => s.inlineStyle)
    },
    {
      label: '$attrs fallthrough reaches the root (data-probe-case)',
      expected: VARIANTS.map(v => `light-${v}`).join('|'),
      actual: triple(light, s => s.attrsCase)
    },
    {
      label: '  …and merges with, rather than replaces, the component’s class',
      expected: 'true|true|true',
      actual: triple(light, s => s.attrsClassMerged)
    },
    {
      label: 'no bf-* rule uses :not() with a complex selector (D-20.5)',
      expected: 0,
      actual: badNots.length === 0 ? 0 : badNots.join(' ; ')
    }
  ]
}

onMounted(() => {
  /*
   * One tick is enough: nothing here is cycled, so every instance is in the DOM
   * as soon as Vue has patched it, and `getComputedStyle` forces style
   * recalculation on demand. Deliberately not `requestAnimationFrame`, which is
   * throttled to a near stop in a backgrounded or embedded view and would leave
   * the verdict PENDING for ever (probe 33's note).
   */
  void nextTick().then(report)

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
    data-probe="41"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 41 — <code>bfNotice</code></h1>

    <p class="probe__lede">
      The three variants side by side, plus one <code>announced</code> instance
      and one mounted with no <code>variant</code> prop at all. Every colour
      below comes from a semantic token that already existed; the contrast rows
      re-derive their ratios from the resolved <code>rgb()</code> at runtime
      rather than from a comment.
    </p>

    <section class="probe__stage stack" data-gap="s" aria-labelledby="probe-stage-title">
      <h2 id="probe-stage-title">Light — the page’s own colour scheme</h2>

      <bfNotice
        v-for="v in VARIANTS"
        :key="v"
        class="probe__marker"
        :variant="v"
        :data-probe-case="`light-${v}`"
      >
        <p>{{ SAMPLE[v] }}</p>
      </bfNotice>

      <h2>No <code>variant</code> prop — must be <code>note</code></h2>

      <bfNotice class="probe__marker" data-probe-case="default-prop">
        <p>{{ SAMPLE.note }}</p>
      </bfNotice>

      <h2><code>announced</code> — the search “no records matched” case</h2>

      <bfNotice class="probe__marker" announced data-probe-case="announced">
        <p>{{ SAMPLE.warning }}</p>
      </bfNotice>
    </section>

    <!--
      The dark-scheme group. `color-scheme: dark` is forced on the wrapper (the
      `bf-probe` layout pins `light` on `html`), and the assertion is that the
      resolved triplets are unchanged — this stack ships one colourway. Hidden
      from the accessibility tree because it is a duplicate of the group above,
      not additional content for a reader.
    -->
    <section class="probe__stage probe__stage--dark stack" data-gap="s" aria-hidden="true">
      <p class="probe__note">
        The same three, under a forced <code>color-scheme: dark</code>.
      </p>

      <bfNotice
        v-for="v in VARIANTS"
        :key="`dark-${v}`"
        class="probe__marker"
        :variant="v"
        :data-probe-case="`dark-${v}`"
      >
        <p>{{ SAMPLE[v] }}</p>
      </bfNotice>
    </section>

    <section class="probe__report" aria-labelledby="probe-title">
      <h2 id="probe-title">Assertions</h2>

      <p
        class="probe__verdict"
        :data-state="state"
        data-testid="probe-41-verdict"
      >
        {{ verdict }}
      </p>

      <table class="probe__table" data-testid="probe-41-table">
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

.probe__lede {
  max-inline-size: 75ch;
}

.probe__stage {
  margin-block-start: var(--space-m, 1.5rem);
  outline: 1px dashed currentcolor;
  outline-offset: 4px;
}

/*
  The whole point of the second group. No colour is declared here — only the
  scheme — so a difference in the measured triplets would be the token layer's,
  which is exactly what the row asks about.
*/
.probe__stage--dark {
  color-scheme: dark;
}

.probe__note {
  font-size: 0.875rem;
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
