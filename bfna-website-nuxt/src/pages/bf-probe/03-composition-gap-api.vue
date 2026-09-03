<script setup lang="ts">
/**
 * Probe — issue 03 / gh#12: `data-gap` honoured on every primitive.
 *
 * Dev-only route, never linked from nav. Renders `.stack`, `.cluster`,
 * `.switcher` and `.grid` at three `data-gap` values plus one `data-space`
 * alias row each, so the three gaps can be read as visibly distinct and
 * asserted numerically via `getComputedStyle`.
 *
 * The composition stylesheet ships from `src/public/css` and is pulled in the
 * same way `layouts/wireframe.vue` does it, so the probe stands alone with no
 * layout (the default layout would wrap it in legacy chrome).
 *
 * Extended for issue 04 / gh#13 with a `.grid[data-min-width]` section: the
 * responsive contract is viewport-dependent, so those grids are read back at
 * 1200 / 800 / 400px and must resolve 3 / 2 / 1 tracks with no inline `style`.
 *
 * Extended again for issue 05 / gh#14 with a `[data-measure]` section: the
 * attribute used to work only through `.center`, so a bare `<p>`, `<div>` or
 * `<li>` carrying it was inert. Those three elements are read back with
 * `getComputedStyle(el).maxInlineSize` and must resolve 60ch / 90ch / 75ch,
 * all narrower than the unset control. A `.center[data-measure="narrow"]`
 * row is included as the non-regression case: the universal rule must not
 * take over `.center`'s own `max-inline-size`.
 */
defineOptions({ name: 'BfProbe03CompositionGapApi' })

definePageMeta({ layout: false })

useHead({
  title: 'bf-probe 03 — composition gap API',
  // `layout: false` bypasses the only layout that sets these, so set them here:
  // `lang` for WCAG 3.1.1, `noindex` because probes are dev-only scaffolding.
  htmlAttrs: { lang: 'en' },
  meta: [{ name: 'robots', content: 'noindex' }],
  link: [{ rel: 'stylesheet', href: '/css/styles.css' }]
})

/** The three deliberately far-apart steps of the Utopia scale under test. */
const gaps = ['xs', 'l', '3xl'] as const

/** The four primitives this issue makes `data-gap`-aware. */
const primitives = [
  { key: 'stack', label: 'stack', note: 'gap = margin-block-start on `> * + *`' },
  { key: 'cluster', label: 'cluster', note: 'gap = flex `gap`' },
  { key: 'switcher', label: 'switcher', note: 'gap = flex `gap`' },
  { key: 'grid', label: 'grid', note: 'gap = grid `gap`' }
] as const

const items = ['A', 'B', 'C']

/**
 * Issue 04 — `.grid[data-min-width]`. Six items so a 300px floor can resolve
 * three, two or one track without the item count being the limiting factor.
 */
const gridItems = ['1', '2', '3', '4', '5', '6']

/**
 * Issue 05 — `[data-measure]`. Long enough to overflow a 90ch cap at any
 * realistic viewport, so the three caps read as visibly different line
 * lengths rather than as three copies of the same short line.
 */
const measureText =
  'Measure is the line length a reader can track without losing their place. '
  + 'This paragraph is deliberately long enough that every cap in the scale '
  + 'wraps well before the container edge, so the difference between 60ch, '
  + '75ch and 90ch is legible as a difference in line length and not merely '
  + 'as a number read back out of the computed style. If this text renders '
  + 'full-bleed across the container, the rule is inert and the issue has '
  + 'regressed.'
</script>

<template>
  <main class="probe container">
    <h1>Probe 03 — composition gap API</h1>
    <p class="probe__lede">
      Each primitive is rendered at <code>data-gap="xs"</code>,
      <code>data-gap="l"</code> and <code>data-gap="3xl"</code>. The three gaps
      must be visibly distinct and strictly increasing. A fourth row uses the
      <code>data-space</code> alias at <code>l</code> and must equal the
      <code>data-gap="l"</code> row.
    </p>

    <section
      v-for="p in primitives"
      :key="p.key"
      class="probe__section"
    >
      <h2>.{{ p.label }}</h2>
      <p class="probe__note">{{ p.note }}</p>

      <div
        v-for="g in gaps"
        :key="g"
        class="probe__case"
      >
        <p class="probe__caption">
          <code>data-gap="{{ g }}"</code>
        </p>
        <div
          :class="p.key"
          :data-gap="g"
          :data-testid="`${p.key}-gap-${g}`"
        >
          <div
            v-for="i in items"
            :key="i"
            class="probe__item"
          >
            {{ i }}
          </div>
        </div>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          <code>data-space="l"</code> (alias — must equal the <code>data-gap="l"</code> row)
        </p>
        <div
          :class="p.key"
          data-space="l"
          :data-testid="`${p.key}-space-l`"
        >
          <div
            v-for="i in items"
            :key="i"
            class="probe__item"
          >
            {{ i }}
          </div>
        </div>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          <code>data-gap="3xl" data-space="xs"</code> (precedence — must equal
          the <code>data-gap="3xl"</code> row)
        </p>
        <div
          :class="p.key"
          data-gap="3xl"
          data-space="xs"
          :data-testid="`${p.key}-both`"
        >
          <div
            v-for="i in items"
            :key="i"
            class="probe__item"
          >
            {{ i }}
          </div>
        </div>
      </div>
    </section>

    <section class="probe__section">
      <h2>.grid[data-min-width] — responsive contract (issue 04)</h2>
      <p class="probe__note">
        Column count is never authored. None of the three grids below carries
        an inline <code>style</code>; each track list is resolved from the
        available inline size against the <code>data-min-width</code> floor.
      </p>

      <div class="probe__case">
        <p class="probe__caption">
          <code>data-min-width="l"</code> (300px floor) — must resolve 3 tracks
          at 1200px, 2 at 800px, 1 at 400px
        </p>
        <div
          class="grid"
          data-min-width="l"
          data-testid="grid-min-width-l"
        >
          <div
            v-for="i in gridItems"
            :key="i"
            class="probe__item"
          >
            {{ i }}
          </div>
        </div>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          <code>data-min-width="2xl"</code> (500px floor) — the
          <code>min(…, 100%)</code> case: at 400px the floor exceeds the
          container, so the track must collapse to one full-width column
          instead of overflowing the page
        </p>
        <div
          class="grid"
          data-min-width="2xl"
          data-testid="grid-min-width-2xl"
        >
          <div
            v-for="i in gridItems"
            :key="i"
            class="probe__item"
          >
            {{ i }}
          </div>
        </div>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          <code>data-min-width="l" data-gap="3xl"</code> — the two attributes
          compose: the wider gap is subtracted from the available inline size,
          so this may resolve one fewer track than the row above at the same
          width
        </p>
        <div
          class="grid"
          data-min-width="l"
          data-gap="3xl"
          data-testid="grid-min-width-l-gap-3xl"
        >
          <div
            v-for="i in gridItems"
            :key="i"
            class="probe__item"
          >
            {{ i }}
          </div>
        </div>
      </div>
    </section>

    <section class="probe__section">
      <h2>[data-measure] — universal line-length cap (issue 05)</h2>
      <p class="probe__note">
        None of the four elements below carries the <code>center</code> class.
        Before this issue every one of them was inert. Expected computed
        <code>max-inline-size</code>: 60ch, 90ch, 75ch, and no cap on the
        control.
      </p>

      <div class="probe__case">
        <p class="probe__caption">
          bare <code>&lt;p data-measure="narrow"&gt;</code> — 60ch
        </p>
        <p
          data-measure="narrow"
          data-testid="measure-p-narrow"
        >
          {{ measureText }}
        </p>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          bare <code>&lt;div data-measure="wide"&gt;</code> — 90ch
        </p>
        <div
          data-measure="wide"
          data-testid="measure-div-wide"
        >
          {{ measureText }}
        </div>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          bare <code>&lt;li data-measure="normal"&gt;</code> in a plain
          <code>&lt;ul&gt;</code> — 75ch
        </p>
        <ul>
          <li
            data-measure="normal"
            data-testid="measure-li-normal"
          >
            {{ measureText }}
          </li>
        </ul>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          control — bare <code>&lt;p&gt;</code>, no attribute; must be wider
          than all three above
        </p>
        <p data-testid="measure-control">
          {{ measureText }}
        </p>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          non-regression — <code>.center[data-measure="narrow"]</code> must
          still resolve through <code>--_center-measure</code> (60ch), i.e. the
          universal rule must not take over <code>.center</code>
        </p>
        <div
          class="center"
          data-measure="narrow"
          data-testid="measure-center-narrow"
        >
          {{ measureText }}
        </div>
      </div>

      <div class="probe__case">
        <p class="probe__caption">
          non-regression — plain <code>.center</code>, no attribute; must keep
          its <code>1100px</code> default
        </p>
        <div
          class="center"
          data-testid="measure-center-default"
        >
          {{ measureText }}
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
/*
  Presentation is intentionally colourless: outlines use `currentColor` so the
  probe introduces no colour literal and no new token (epic ground rule 2).
*/
/*
  `layout: false` means nothing paints a ground, so the probe would inherit the
  host's colour scheme and render dark-on-dark. Pin it to the existing
  `--color-white` / `--color-text` tokens — no new colour, no new token.
*/
:global(html) {
  color-scheme: light;
  background-color: var(--color-white);
  color: var(--color-text);
}

.probe {
  padding-block: var(--space-l);
  min-block-size: 100dvh;
}

.probe__lede,
.probe__note {
  max-width: 60ch;
}

.probe__section {
  margin-block-start: var(--space-xl);
  padding-block-start: var(--space-s);
  border-block-start: 1px solid currentColor;
}

.probe__case {
  margin-block-start: var(--space-m);
}

.probe__caption {
  margin-block: 0 var(--space-2xs);
}

.probe__item {
  outline: 1px solid currentColor;
  padding: var(--space-2xs);
  min-width: 4rem;
  text-align: center;
}
</style>
