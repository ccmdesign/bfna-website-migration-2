<script setup lang="ts">
/**
 * `bfHeroMedia` — the photograph and the scrim, as one layer behind a band.
 *
 * gh#253. Consumed by **both** head components: `bfHero` (the homepage band)
 * and `bfPageHeader` (the other seven routes). It is the whole of the "shared
 * media/scrim layer" the wave-1 plan asks for; neither host repeats a single
 * declaration of it.
 *
 * ## What decides this component's design
 *
 * A uniform navy scrim over the worst case — a blown-out white photograph,
 * which is exactly BFNA's house style — needs **alpha >= 0.70** for white text
 * at 4.5:1. Measured by `scripts/check-contrast.ts`, whose `white-on-scrim`
 * pair exists for this component: 0.60 → 3.692 fail, 0.65 → 4.245 fail,
 * 0.70 → 4.840 **pass**.
 *
 * At that alpha nothing else in the palette survives. The ceiling over this
 * ground is 4.840 and pure white is what reaches it; the programme hues
 * measure 1.92 / 1.64 / 1.87. **So over media, type is white. Programme
 * colour appears only as an opaque fill — a chip, a rule, a panel — never as
 * text.** An opaque fill does not composite with the photograph, so it is
 * safe whatever the photograph is. That determinism is also what makes the
 * later video pass tractable: a fixed scrim over a moving image behaves
 * exactly as one over a still.
 *
 * This replaces production's failure mode, where a gradient hand-tuned to one
 * photo degraded from 10.55:1 to 2.21:1 across a single line of text.
 *
 * ## Why `z-index: -1` and not "raise the content"
 *
 * The layer is `position: absolute; inset: 0; z-index: -1`, and each host
 * declares `position: relative; isolation: isolate`. `isolation` makes the
 * host a stacking context, so a negative `z-index` paints **above the host's
 * own background and below every in-flow descendant**, and cannot escape the
 * band.
 *
 * The alternative — `z-index: 0` here and `position: relative; z-index: 1` on
 * the content column — is what most implementations reach for, and it does not
 * work for half of this component's job. `bfPageHeader` does not own its
 * content column: `.center` is rendered by `bfSection`, so it carries
 * `bfSection`'s scope id and **cannot be selected from `bfPageHeader`'s scoped
 * styles at all** without `:deep()`. Needing no rule on the content column is
 * precisely what lets one layer serve two hosts whose insides differ.
 *
 * ## Why it is never inside a `.stack`
 *
 * Both hosts place this as a direct child of the band root — a grid
 * (`bfHero`) or a plain `<section>` (`bfSection`) — never inside the inner
 * box. `composition/stack.css` spaces with `> * + *` **margin**, not `gap`, so
 * an absolutely positioned child of a stack still takes a
 * `margin-block-start`, and with `inset: 0` fully specified that margin
 * shrinks and offsets the layer. Three logged defects in this repository come
 * from exactly that (`layouts/bf-default.vue:77-103`, `Hero.vue:94-130`,
 * `PageHeader.vue:158-190`).
 *
 * And it must not sit inside `.center` either, for a second reason:
 * `center.css:50-58` makes that box `content-box` with `padding-inline`, so
 * its rendered width is `measure + 2 x padding` and a layer inside it is not
 * full-bleed.
 *
 * ## The two modes, and where the attribute lives
 *
 * `data-scrim` is set by the **host band**, not here, and this component's
 * scrim keys off it as an ancestor. One attribute, on the element a template,
 * a probe or a test would look at, describing the band's treatment rather than
 * an implementation detail one level down.
 *
 * - `full` (the default): a flat `--color-scrim` over the whole band.
 * - `panel`: `--color-scrim-panel` (0.94, white at 9.817) as a near-opaque
 *   column the width of the content box, photograph uncovered either side.
 *
 * ## Why `bfMedia` rather than a `background-image`
 *
 * Because a local path through `bfMedia` reaches `NuxtImg` and gets a real
 * srcset, and an absolute Directus URL deliberately does not
 * (`Media.vue:70-76`). The hero images this ships against are local files that
 * nothing read before now. A CSS `background-image` would get neither, and
 * `.cover` / `.frame` / `.imposter` are all declined on the wave-1 plan's own
 * grounds — `.cover` defaults to `100vh` and would regress the `svh` fix,
 * `.frame`'s universal child rule forces `100%/100%` onto a text panel, and
 * `.imposter` supplies no containing block.
 *
 * Presentational-only (BRIEF D8): two props in, no slot, nothing out.
 */
defineOptions({ name: 'BfHeroMedia' })

interface Props {
  /**
   * The photograph. **Prefer a root-relative local path** —
   * `/images/hero/democracy.jpg` — because `bfMedia` routes those through
   * `NuxtImg` and an absolute `https://` URL past it untouched, with no
   * srcset (`Media.vue:70-76`).
   *
   * Absent or `null` renders no image at all and leaves the scrim painting on
   * its own, which is a legitimate band treatment rather than a broken one: a
   * flat navy header. It deliberately does **not** fall through to `bfMedia`'s
   * crosshatch placeholder, which is a design-system affordance for a missing
   * asset and has no business behind a page's `<h1>`.
   */
  src?: string | null
  /**
   * The photograph's alternative text.
   *
   * `bfMedia` requires `alt` and takes `''` as a deliberate declaration that
   * an image is decorative (`MediaProps.alt`). A hero photograph normally is:
   * the `<h1>` above it carries the meaning, and describing the picture would
   * announce scenery before the page's own name. So `''` is the default, and
   * a host that has a photograph which genuinely carries information can pass
   * a real string.
   */
  alt?: string
}

withDefaults(defineProps<Props>(), { alt: '' })
</script>

<template>
  <!--
    One root, so `$attrs` has exactly one destination and a host's `class`
    merges with `bf-hero-media` rather than replacing it.

    `aria-hidden` on the wrapper rather than relying on `alt=""` alone: the
    scrim is a second, unlabelled element in here, and the layer as a whole is
    presentation. It holds nothing focusable, so hiding it costs no keyboard
    user anything.
  -->
  <div class="bf-hero-media" aria-hidden="true">
    <!--
      `ratio="auto"` rather than a stylesheet override of `--_bf-media-ratio`.
      `bfMedia` declares its `16 / 9` default *in a rule* so a consumer can
      outrank it (gh#26), and emits the property inline only when a `ratio` is
      passed — so passing one is the supported way to say "no intrinsic ratio,
      fill the band", and it wins without a specificity argument.

      `loading="eager"` and `fetchpriority="high"` through `$attrs`: this is
      the largest contentful paint on every route that renders it, and
      `bfMedia` hard-codes `loading="lazy"` for the card grids it was built
      for. Fallthrough attributes are merged after the child's own bindings,
      so these win.
    -->
    <bfMedia
      v-if="src"
      class="bf-hero-media__image"
      :src="src"
      :alt="alt"
      ratio="auto"
      loading="eager"
      fetchpriority="high"
    />

    <!--
      The scrim is its own element rather than a pseudo-element on the
      wrapper, because `panel` mode resizes it and a pseudo-element would make
      that a second, invisible box to reason about. It is painted whether or
      not there is an image: a band with `data-scrim` and no photograph is a
      flat navy header, which is a coherent thing to be.
    -->
    <div class="bf-hero-media__scrim" />
  </div>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet — see the note in
  `Button.vue`; `postcss-preset-env`'s cascade-layer polyfill would otherwise
  flatten this into unlayered rules that outrank every layer (gh#101).
  `nuxt.config.ts:200` disables that polyfill and `scripts/check-routes.ts`
  gates the result, so the wrapper is written by hand.
*/
@layer components {
  .bf-hero-media {
    /*
      Negative, and safe because the host isolates. See the block comment: it
      is what lets this same layer sit behind a content column this component
      cannot select.
    */
    position: absolute;
    inset: 0;
    z-index: -1;

    /*
      The photograph is sized to cover, so it is routinely larger than the
      band on one axis. Clipping here rather than on the host keeps the host's
      own overflow behaviour its own business — and keeps a full-bleed
      photograph from contributing to `documentElement.scrollWidth`.
    */
    overflow: hidden;
  }

  /*
    Two compound selectors, so this beats `bfMedia`'s own `.bf-media` rule
    (0,1,0) in the same layer by specificity (0,2,0) rather than by source
    order, which is not something an SFC can rely on.
  */
  .bf-hero-media > .bf-hero-media__image {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    /*
      `object-fit: cover` is already `.bf-media`'s, and it is what makes a
      photograph of any proportion fill a band of any proportion without
      distorting. Restated here because this is the one consumer for which it
      is load-bearing rather than incidental.
    */
    object-fit: cover;
  }

  .bf-hero-media__scrim {
    position: absolute;
    inset: 0;
    background-color: var(--color-scrim);
  }

  /*
    `panel` mode. The attribute is on the host band, so this reads it as an
    ancestor — see the block comment for why it lives there.

    `inline-size` is the content column's own border box: `.center` is
    `content-box` with `padding-inline` (`center.css:50-58`), so its rendered
    width is `measure + 2 x padding`. Both halves are read through the
    composition layer's documented `--theme-*` inputs and its own defaults, so
    a band that retunes its measure retunes the panel with it and the number
    is not copied anywhere.

    `margin-inline: auto` is what centres it: for an absolutely positioned box
    with `inset-inline: 0` and a definite width, `auto` margins resolve to
    equal values, exactly as they do for a static block.

    `min()` rather than a media query — below the measure the panel is simply
    the band, which is the right answer on a phone.
  */
  [data-scrim="panel"] .bf-hero-media__scrim {
    background-color: var(--color-scrim-panel);
    /* One line: stylelint's `scss/operator-no-newline-*` pair rejects a break
       on either side of the `+`. */
    inline-size: min(100%, calc(var(--theme-center-measure, 1100px) + 2 * var(--theme-center-padding, var(--space-s))));
    margin-inline: auto;
  }
}
</style>
