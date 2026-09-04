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
 * ## 2. `NuxtImg` for local assets, a plain `<img>` for absolute URLs
 *
 * **The rule: an `src` matching `/^https?:\/\//` renders a plain `<img>` with
 * that URL verbatim. Everything else renders through `<NuxtImg>`.**
 *
 * Why (gh#203, P1 — this component originally sent *everything* through
 * `NuxtImg` and every image on the deployed site was broken):
 *
 * `src/nuxt.config.ts` sets `image.provider` to
 * `process.env.NUXT_IMAGE_PROVIDER || undefined`, so an unconfigured build
 * falls back to the **`ipx`** provider, which rewrites the URL into a
 * server-side route:
 *
 *     <img src="/_ipx/q_90/https:/bfna.simplyas.com/assets/2e1d…">
 *
 * `ipx` is a runtime image *server*. This site deploys as `nuxt generate`
 * output served statically, so nothing answers `/_ipx/…`; the SPA fallback
 * returns `200 text/plain` and the browser paints a broken image. The
 * component that renders a photo cannot depend on infrastructure the deploy
 * does not have.
 *
 * `nuxt.config.ts` already documents the house rule two lines above that
 * provider setting — "For external images, components use regular img tags to
 * bypass optimization" — and `wfMedia.vue` plus nine legacy components already
 * follow it. This is `bfMedia` rejoining them, not a new policy.
 *
 * A plain `<img>` rather than `<NuxtImg provider="none">`: `none` still routes
 * through the module's runtime and still emits its `sizes`/`densities`
 * plumbing, for a URL nobody is allowed to transform anyway. And the external
 * hosts are not all declared in `image.domains` (one person photo lives on
 * `images.ctfassets.net`), so the module would refuse some of them outright.
 *
 * The cost is real and accepted: no `srcset` for external images. An
 * unoptimised image that loads beats an optimised one that 404s, and moving
 * the site onto the Netlify Image CDN (`/.netlify/images`, `netlify.toml`
 * `[images] remote_images`, a linked build) is a separate decision.
 *
 * Both image branches are otherwise identical — same `.bf-media` class, same
 * `--_bf-media-ratio` hook, same `loading="lazy"`, `decoding="async"`, `alt`
 * handling and `$attrs` fallthrough — so no consumer can tell which one it
 * got. `/bf-probe/17-bf-media` asserts exactly that, including that the
 * absolute URL survives verbatim with no `/_ipx/` prefix.
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
 * Is this `src` an absolute URL on a remote host? See header §2.
 *
 * Only `http:`/`https:`. Deliberately *not* matched:
 *
 * - a root-relative path (`/images/hero/democracy.jpg`) — that file is in
 *   `src/public/` and `NuxtImg` optimising it is the whole point of having the
 *   module;
 * - a protocol-relative URL (`//host/…`) — none appear in the Directus or
 *   Contentful payloads, and one arriving later should be noticed rather than
 *   silently handled;
 * - a `data:` URI — `NuxtImg` passes those straight through already.
 */
const isAbsolute = computed(() => /^https?:\/\//.test(props.src ?? ''))
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

    `src` present / absent decides image-vs-placeholder, exactly as
    `wfMedia.vue` decides it. The image side then splits again on the *shape*
    of the URL (header §2): an absolute one is handed to the browser
    untouched, a local one goes through `NuxtImg`. Every attribute is
    identical across the two, so a consumer cannot tell them apart.
  -->
  <img
    v-if="src && isAbsolute"
    class="bf-media"
    :src="src"
    :alt="alt"
    :style="cssVars"
    loading="lazy"
    decoding="async"
  >
  <NuxtImg
    v-else-if="src"
    class="bf-media"
    :src="src"
    :alt="alt"
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
    /*
     * Stated rather than inherited from the reset, because the placeholder
     * branch carries a 1px border and `aspect-ratio` applies to whichever box
     * `box-sizing` selects. Under `content-box` the placeholder would render
     * 2px taller and wider than its declared ratio while the image branch
     * rendered exactly on it — a silent 0.5% divergence between the two
     * branches, which is under the probe's measurement tolerance and would
     * therefore not be caught.
     */
    box-sizing: border-box;
    /*
     * Only meaningful on the image branch — a `<div>` has nothing to fit — but
     * declared on the shared class so both branches keep identical box
     * behaviour and a future branch inherits it. Replaces `wfMedia.vue:11`'s
     * inline `object-fit: cover`.
     */
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
