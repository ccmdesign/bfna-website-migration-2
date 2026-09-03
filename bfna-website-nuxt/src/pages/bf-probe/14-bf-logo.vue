<script setup lang="ts">
/**
 * Probe — issue 14 / gh#23: `bfLogo`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against (only the final cutover issue removes `bf-probe/`).
 *
 * This is the **first `bf-*` component probe** of the epic, so it doubles as
 * the shape later component probes copy: a live render gallery on top, a
 * machine-readable assertion table underneath with a
 * `data-testid="probe-14-verdict"` PASS/FAIL cell that
 * `scripts/verify-bf-logo.ts` reads out of the prerendered HTML.
 *
 * What it proves:
 *
 *  1. The issue's own acceptance — **both variants render at three sizes**
 *     (six live marks below), sized only by `--_bf-logo-size` passed through
 *     `$attrs`, never by a prop.
 *  2. `$attrs` fallthrough reaches the root `<svg>`: the `style` carrying
 *     `--_bf-logo-size` and the `data-probe-size` marker below are both
 *     caller-supplied and land on the component's own root element.
 *  3. The accessible name is exposed — `role="img"` + `aria-labelledby` →
 *     `<title>`, checked in the DOM rather than in the source.
 *  4. The artwork was **transplanted, not redrawn**: every `d` / `points`
 *     string in the rendered mark is byte-identical to the legacy
 *     `Logo.vue`, and the two variants render the *same* geometry (one copy
 *     of the artwork, colour switched by a custom property).
 *  5. No colour literal reaches the DOM — the paint is `currentColor` all the
 *     way down.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page plus `npx tsx scripts/verify-bf-logo.ts`, per the
 * gh#20 / gh#21 / gh#22 precedent. Recorded in the spec's Decisions.
 */
defineOptions({ name: 'BfProbe14BfLogo' })

definePageMeta({ layout: false })

useHead({
  title: 'bf-probe 14 — bfLogo',
  // `layout: false` bypasses the only layout that sets these, so set them here:
  // `lang` for WCAG 3.1.1, `noindex` because probes are dev-only scaffolding.
  htmlAttrs: { lang: 'en' },
  meta: [{ name: 'robots', content: 'noindex' }],
  link: [{ rel: 'stylesheet', href: '/css/styles.css' }]
})

/**
 * The three sizes the acceptance criterion asks for.
 *
 * `s` deliberately passes **no** `--_bf-logo-size`: it renders on the
 * component's own CSS default, so the default is exercised at runtime rather
 * than only asserted as a string in the source. `m` and `l` override the hook
 * through `$attrs`, which is the whole point of the hook.
 */
const sizes = [
  { key: 's', value: '', note: 'no override — the component default, 1.25rem' },
  { key: 'm', value: '2.5rem', note: '' },
  { key: 'l', value: '5rem', note: '' }
] as const

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

const checks = ref<Check[]>([])

/**
 * Runtime assertions read out of the live DOM. Client-side, because the point
 * is what the browser actually built — `nuxt generate` still prerenders the
 * six marks above, and `scripts/verify-bf-logo.ts` asserts the static half
 * against that HTML.
 */
onMounted(() => {
  const marks = Array.from(
    document.querySelectorAll<SVGSVGElement>('.probe__gallery .bf-logo')
  )
  const first = marks[0]
  const geometry = (svg: SVGSVGElement | undefined) =>
    svg
      ? Array.from(svg.querySelectorAll('path, polygon, rect'))
          .map(el => el.getAttribute('d') ?? el.getAttribute('points') ?? '')
          .join('|')
      : ''

  const paintedColour = (svg: SVGSVGElement | undefined) =>
    svg ? getComputedStyle(svg).color : ''

  const heightOf = (svg: SVGSVGElement | undefined) =>
    svg ? Math.round(svg.getBoundingClientRect().height) : 0

  /**
   * `getPropertyValue('--color-text')` hands back the *unresolved* token text
   * (`hsl(var(--hsl-base))`), which never equals a computed `color`. Paint the
   * token onto a throwaway element and read what the browser resolved instead.
   */
  const resolveToken = (token: string) => {
    const el = document.createElement('span')
    el.style.cssText = `position:absolute;visibility:hidden;color:var(${token})`
    document.body.appendChild(el)
    const value = getComputedStyle(el).color
    el.remove()
    return value
  }

  /** Root font size, so the rem→px expectations hold under a fluid type scale. */
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

  const defaults = marks.filter(m => m.dataset.variant === 'default')
  const whites = marks.filter(m => m.dataset.variant === 'white')

  const results: Check[] = [
    // --- 1. both variants × three sizes actually rendered ------------------
    { label: 'marks rendered (2 variants × 3 sizes)', expected: 6, actual: marks.length },
    { label: '  …3 are variant="default"', expected: 3, actual: defaults.length },
    { label: '  …3 are variant="white"', expected: 3, actual: whites.length },

    // --- 2. $attrs fallthrough lands on the component root -----------------
    {
      label: '$attrs `style` reached the <svg> root (--_bf-logo-size set)',
      expected: ',2.5rem,5rem',
      actual: defaults.map(m => m.style.getPropertyValue('--_bf-logo-size').trim()).join(',')
    },
    {
      label: '  …the first mark passes no override, so the CSS default applies',
      expected: '1.25rem',
      actual: defaults[0] ? getComputedStyle(defaults[0]).getPropertyValue('--_bf-logo-size').trim() : ''
    },
    {
      label: '$attrs `data-probe-size` reached the <svg> root',
      expected: 's,m,l',
      actual: defaults.map(m => m.dataset.probeSize ?? '').join(',')
    },
    {
      label: 'rendered heights follow --_bf-logo-size (1.25 / 2.5 / 5 rem)',
      expected: [1.25, 2.5, 5].map(n => Math.round(n * rem)).join(','),
      actual: defaults.map(heightOf).join(',')
    },
    {
      label: '  …aspect ratio preserved (width ≈ height × 695.1/266.6)',
      expected: 'true',
      actual: String(
        defaults.every(m => {
          const r = m.getBoundingClientRect()
          return r.height > 0 && Math.abs(r.width / r.height - 695.1 / 266.6) < 0.02
        })
      )
    },

    // --- 3. accessible name -----------------------------------------------
    { label: 'every mark has role="img"', expected: 6, actual: marks.filter(m => m.getAttribute('role') === 'img').length },
    {
      label: 'every mark is labelled by its own <title>',
      expected: 6,
      actual: marks.filter(m => {
        const id = m.getAttribute('aria-labelledby')
        const title = id ? m.querySelector(`title[id="${id}"]`) : null
        return title?.textContent === 'Bertelsmann Foundation North America'
      }).length
    },
    {
      label: '  …title ids are unique across the page',
      expected: 6,
      actual: new Set(marks.map(m => m.getAttribute('aria-labelledby'))).size
    },

    // --- 4. one copy of the artwork, transplanted not redrawn --------------
    { label: 'drawable elements per mark (13 path + 2 polygon + 1 rect)', expected: 16, actual: first?.querySelectorAll('path, polygon, rect').length ?? 0 },
    { label: 'viewBox matches legacy Logo.vue', expected: '0 0 695.1 266.6', actual: first?.getAttribute('viewBox') ?? '' },
    {
      label: 'white variant has identical geometry to default (one artwork)',
      expected: 'true',
      actual: String(geometry(defaults[0]) !== '' && geometry(defaults[0]) === geometry(whites[0]))
    },

    // --- 5. colour: currentColor, tokens, no literal -----------------------
    {
      label: 'artwork paints currentColor (no per-path fill)',
      expected: 'true',
      actual: String(
        marks.every(m =>
          Array.from(m.querySelectorAll('path, polygon, rect')).every(el => !el.hasAttribute('fill'))
        ) && marks.every(m => m.querySelector('g')?.getAttribute('fill') === 'currentColor')
      )
    },
    {
      label: 'default variant resolves to --color-text',
      expected: resolveToken('--color-text'),
      actual: paintedColour(defaults[0])
    },
    {
      label: 'white variant resolves to --color-white',
      expected: resolveToken('--color-white'),
      actual: paintedColour(whites[0])
    },
    {
      label: '  …and the two variants differ',
      expected: 'true',
      actual: String(paintedColour(defaults[0]) !== paintedColour(whites[0]))
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
 * `data-state="fail"` into the static HTML for a component that is fine. A
 * later issue grepping this probe would read that as a regression. `pending`
 * says what is actually true of the prerendered page: nothing has run yet.
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
  <main class="probe container">
    <h1>Probe 14 — <code>bfLogo</code></h1>
    <p class="probe__lede">
      The BFNA wordmark, one component for both colourways. Both variants are
      rendered at three sizes below; the size comes only from
      <code>--_bf-logo-size</code> handed in through <code>$attrs</code>, never
      from a prop. The white variant sits on a dark panel because the lower
      band of the mark is an inverted shape — a filled block with the letters
      knocked out — exactly as <code>LogoWhite.vue</code> behaved.
    </p>

    <section class="probe__gallery" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading">Both variants, three sizes</h2>

      <div class="probe__row">
        <h3>
          <code>variant="default"</code> — on the page ground
        </h3>
        <div class="probe__marks">
          <figure v-for="s in sizes" :key="`default-${s.value}`" class="probe__mark">
            <bfLogo
              variant="default"
              :style="s.value ? { '--_bf-logo-size': s.value } : undefined"
              :data-probe-size="s.key"
            />
            <figcaption>
              <code>{{ s.value || 'default' }}</code>{{ s.note ? ` — ${s.note}` : '' }}
            </figcaption>
          </figure>
        </div>
      </div>

      <div class="probe__row probe__row--inverted">
        <h3>
          <code>variant="white"</code> — on a dark panel
        </h3>
        <div class="probe__marks">
          <figure v-for="s in sizes" :key="`white-${s.value}`" class="probe__mark">
            <bfLogo
              variant="white"
              :style="s.value ? { '--_bf-logo-size': s.value } : undefined"
              :data-probe-size="s.key"
            />
            <figcaption>
              <code>{{ s.value || 'default' }}</code>{{ s.note ? ` — ${s.note}` : '' }}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-14-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-14-table">
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
  `layout: false` means nothing paints a ground, so the probe would inherit the
  host's colour scheme and render the near-black `variant="default"` marks
  dark-on-dark. Pin it to the existing `--color-white` / `--color-text` tokens,
  as probe 03 does — no new colour, no new token.
*/
:global(html) {
  color-scheme: light;
  background-color: var(--color-white);
  color: var(--color-text);
}

.probe {
  padding-block: var(--space-l, 2rem);
  min-block-size: 100dvh;
}

.probe__lede {
  max-inline-size: 75ch;
}

.probe__row {
  padding: var(--space-s, 1rem);
  margin-block-end: var(--space-s, 1rem);
  border: 1px solid currentcolor;
}

.probe__row--inverted {
  background-color: var(--color-text);
  color: var(--color-white);
}

.probe__marks {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-m, 1.5rem);
}

.probe__mark {
  margin: 0;
}

.probe__mark figcaption {
  margin-block-start: var(--space-2xs, 0.25rem);
  font-size: 0.875rem;
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
