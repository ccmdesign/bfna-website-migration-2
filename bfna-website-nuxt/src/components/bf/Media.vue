<script setup lang="ts">
/**
 * `bfMedia` — an image slot with a placeholder box, one ratio hook for both.
 *
 * Evolves `components/wireframe/wfMedia.vue` (issue 17 / gh#26). That file is
 * nine lines and does the right thing structurally: `src` set renders an
 * `<img>`, `src` absent renders a crosshatch placeholder `<div>`, and the
 * `ratio` drives both. Three things change here.
 *
 * ## 1. The ratio is a custom property read by a stylesheet rule
 *
 * `wfMedia.vue:11` wrote `style="aspect-ratio: ${ratio}; …"` onto the `<img>`.
 * An inline declaration outranks every author rule at every specificity, so a
 * consumer holding a `bfMedia` in a slot could not re-proportion it — the
 * full-width Transponder card needed a different ratio for its wide slot and
 * had no way to ask for one. Here both branches carry `.bf-media`, and the
 * ratio is applied by exactly one rule, in `@layer components`:
 *
 *     aspect-ratio: var(--_bf-media-ratio);
 *
 * **The default lives in that rule, not in `withDefaults`.** That is the half
 * of the fix that is easy to miss: a component that always writes
 * `--_bf-media-ratio` inline is no more overridable than one that always
 * writes `aspect-ratio` inline — the cascade cannot see either. So the
 * property is emitted *only when the caller passed a `ratio`*:
 *
 * | `ratio` | emitted | a consumer overrides with |
 * |---|---|---|
 * | omitted | nothing — `16 / 9` comes from the `.bf-media` rule | its own CSS (class, ancestor, `:has()`) **or** inline `style` |
 * | passed  | `style="--_bf-media-ratio: …"` from `cssVars` | inline `style` through `$attrs`, which merges last and wins |
 *
 * The observable default is `16/9` either way, matching `wfMedia.vue`; what
 * moved is where it is declared. Both rows are asserted on
 * `/bf-probe/17-bf-media`.
 *
 * ## 2. `NuxtImg`, not a raw `<img>`
 *
 * `@nuxt/image` is already in `src/nuxt.config.ts` `modules:` and nine legacy
 * components use it. `loading="lazy"` and `decoding="async"` are set here
 * rather than left to each call site.
 *
 * No `width`/`height` are synthesised from the `ratio`. On `NuxtImg` those are
 * **resize modifiers**, not layout hints: passing them would make every
 * consumer silently request one fixed pixel size from the provider. The box is
 * reserved by `aspect-ratio` + `inline-size: 100%` instead, which the spec
 * allows explicitly and which is what actually prevents cumulative layout
 * shift — the reserved box is correct before the bitmap arrives, while it is
 * decoding, and if it never arrives at all.
 *
 * ## 3. The placeholder is painted from tokens
 *
 * `.wf-media` in the frozen `public/css/wireframe.css` is drawn with three
 * colour literals (`#ccc` twice, `#f4f4f4`). BRIEF §5 rule 2 forbids a new
 * literal and forbids reaching for a primitive, so the same treatment — a
 * bordered light box with two crossed diagonals — is rebuilt from the semantic
 * pair `--color-light` and `--color-base-super-light`. No new colour value and
 * no new token: both already exist in `tokens/semantic-colors.css`.
 *
 * Presentational-only (BRIEF D8): props in, nothing else. No data access.
 */
import type { MediaProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfMedia' })

/**
 * No `withDefaults`. `ratio`'s default is a CSS declaration, for the cascade
 * reason above; giving it a runtime default here would make `props.ratio`
 * always truthy and pin the property inline on every instance, which is the
 * defect this component was opened to remove.
 */
const props = defineProps<MediaProps>()

/**
 * The style binding — empty unless the caller asked for a ratio, so the
 * component contributes no inline declaration in the common case.
 *
 * `undefined` rather than `{}`: Vue renders no `style` attribute at all for
 * `undefined`, and the probe asserts the absence.
 */
const cssVars = computed(() =>
  props.ratio ? { '--_bf-media-ratio': props.ratio } : undefined
)

/**
 * `alt` is required whenever `src` is set (BRIEF §5 rule 9 — `alt` required on
 * content images). A missing one is a dev-time warning, never a silent
 * `alt=""`, because a silently-empty `alt` tells a screen-reader user the
 * image carries no information when nobody ever decided that.
 *
 * The check is on `alt == null` — *unspecified* — not on falsiness. An
 * explicit `alt=""` is the standard way to declare an image decorative and is
 * a legitimate answer, so warning on it would train call sites to ignore the
 * warning. `import.meta.dev` keeps the whole thing out of the production
 * bundle.
 */
if (import.meta.dev) {
  watchEffect(() => {
    if (props.src && props.alt == null) {
      console.warn(
        '[bfMedia] `alt` is required when `src` is set. '
        + `Pass alt="" only if the image is decorative. src: ${props.src}`
      )
    }
  })
}
</script>

<template>
  <!--
    `$attrs` falls through to whichever branch renders (no `inheritAttrs: false`
    — this is a base component, not a wrapper), so a consumer passes `class`,
    `style` (including an override of `--_bf-media-ratio`), `data-*` and
    `sizes` straight through to the element. Vue merges fallthrough `style`
    *after* the component's own binding, so a consumer's inline override wins
    over `cssVars` — which is the escape hatch for an instance that does pass
    a `ratio` prop.

    The two branches are `v-if` / `v-else` on `src` alone, exactly as
    `wfMedia.vue` decides them.
  -->
  <NuxtImg
    v-if="src"
    class="bf-media"
    :src="src"
    :alt="alt ?? ''"
    :style="cssVars"
    loading="lazy"
    decoding="async"
  />
  <!--
    The placeholder carries no information a screen reader can use — it is the
    absence of an image, not an image of an absence — so it is hidden from the
    a11y tree rather than announced as an unlabelled box. `wfMedia.vue`'s
    `<div>` had no role either; this states it.
  -->
  <div
    v-else
    class="bf-media bf-media--placeholder"
    :style="cssVars"
    aria-hidden="true"
  />
</template>

<style scoped>
@layer components {
  .bf-media {
    /*
     * The default ratio, declared here rather than in `withDefaults` so that a
     * consumer stylesheet can outrank it. `16 / 9` is `wfMedia.vue`'s default
     * and `.wf-media`'s `--wf-ratio` default, unchanged.
     */
    --_bf-media-ratio: 16 / 9;

    display: block;
    inline-size: 100%;
    /*
     * The whole point of the component: one rule, reading one property, on
     * both branches. No inline `aspect-ratio` anywhere in this file.
     */
    aspect-ratio: var(--_bf-media-ratio);
  }

  /*
   * Only meaningful on the image branch — a `<div>` has nothing to fit — but
   * declared on the shared class so the two branches keep identical box
   * behaviour and a future branch inherits it. Replaces `wfMedia.vue:11`'s
   * inline `object-fit: cover`.
   */
  .bf-media {
    object-fit: cover;
  }

  /*
   * The crosshatch box, rebuilt from semantic tokens. Same construction as
   * `.wf-media` in the frozen wireframe skin — a 1px border plus two
   * full-diagonal hairlines over a light ground — with the three colour
   * literals replaced by the two semantic names that already stand for them.
   * No new colour value, no primitive (BRIEF §5 rule 2).
   */
  .bf-media--placeholder {
    border: 1px solid var(--color-base-super-light);
    background:
      linear-gradient(
        to top right,
        transparent calc(50% - 1px),
        var(--color-base-super-light),
        transparent calc(50% + 1px)
      ),
      linear-gradient(
        to bottom right,
        transparent calc(50% - 1px),
        var(--color-base-super-light),
        transparent calc(50% + 1px)
      ),
      var(--color-light);
  }
}
</style>
