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
  </main>
</template>

<style scoped>
/*
  Presentation is intentionally colourless: outlines use `currentColor` so the
  probe introduces no colour literal and no new token (epic ground rule 2).
*/
.probe {
  padding-block: var(--space-l);
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
