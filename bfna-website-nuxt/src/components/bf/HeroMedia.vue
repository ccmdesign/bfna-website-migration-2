<script setup lang="ts">
/**
 * `bfHeroMedia` — the photograph and the scrim, as one layer behind a band.
 *
 * gh#253. Consumed by **both** head components: `bfHero` (the homepage band)
 * and `bfPageHeader` (every other route that carries a header). It is the
 * whole of the "shared
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
 * from exactly that — the route announcer inside `bf-default`'s `<main>`,
 * and the two head components' own inner boxes.
 *
 * And it must not sit inside `.center` either, for a second reason:
 * `center.css`'s `.center` rule makes that box `content-box` with
 * `padding-inline`, so
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
 * - `gradient`: transparent to neutral black behind bottom-aligned copy.
 * - `panel`: `--color-scrim-panel` (0.94, white at 9.817) as a near-opaque
 *   column the width of the content box, photograph uncovered either side.
 * - `none` (`bfHero` only): no fill — the photograph as it is, under the
 *   page's own dark ink. See `HeroScrimMode` for when that is honest.
 *
 * The host also owns the crossfade's pause: `bfHero` renders the control and
 * sets `data-motion="paused"` on the band, which this layer reads as an
 * ancestor the same way (WCAG 2.2.2).
 *
 * ## Why `bfMedia` rather than a `background-image`
 *
 * Because a local path through `bfMedia` reaches `NuxtImg` and gets a real
 * srcset, and an absolute Directus URL deliberately does not — `bfMedia`'s
 * `isAbsolute` predicate, and the header section that explains it. The hero
 * images this ships against are local files that
 * nothing read before now. A CSS `background-image` would get neither, and
 * `.cover` / `.frame` / `.imposter` are all declined on the wave-1 plan's own
 * grounds — `.cover` defaults to `100vh` and would regress the `svh` fix,
 * `.frame`'s universal child rule forces `100%/100%` onto a text panel, and
 * `.imposter` supplies no containing block.
 *
 * Presentational-only (BRIEF D8): photos and playback props in, one slot
 * painted on the scrim, nothing out.
 */
import type { HeroImage } from '~/types/bf-contracts'

defineOptions({ name: 'BfHeroMedia' })

interface Props {
  /**
   * The photograph. **Prefer a root-relative local path** —
   * `/images/hero/democracy.jpg` — because `bfMedia` routes those through
   * `NuxtImg` and an absolute `https://` URL past it untouched, with no
   * srcset (`bfMedia`'s `isAbsolute` predicate).
   *
   * Absent or `null` renders no image at all and leaves the scrim painting on
   * its own, which is a legitimate band treatment rather than a broken one: a
   * flat navy header. It deliberately does **not** fall through to `bfMedia`'s
   * crosshatch placeholder, which is a design-system affordance for a missing
   * asset and has no business behind a page's `<h1>`.
   */
  src?: string | null
  /**
   * A second photograph, stacked over `src` and faded in and out on a loop.
   * Ignored without `src`. Always `alt=""`: it is the same scene's other half,
   * and announcing an image that comes and goes would be noise.
   */
  srcSecondary?: string | null
  /** Further photographs in the loop, with optional focal positions. */
  sequence?: HeroImage[]
  paused?: boolean
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
  /**
   * The photographs' `sizes`, screen by screen. Defaults to `100vw` on every
   * screen — this layer is full-bleed, and in a band wider than it is tall
   * `cover` draws the photograph at the band's width. A host whose band is
   * taller than it is wide on a phone passes the width the photograph is
   * really drawn at there (`HeroProps.imageSizes`). `px` or `vw` only, each
   * behind a `screen:` prefix — the template comment has why.
   */
  sizes?: string
  /**
   * The photographs' `@nuxt/image` quality, `0`–`100`. Omitted, the global
   * `image.quality` in `nuxt.config.ts` applies (90). `bfHero` passes its
   * own (`HeroProps.imageQuality`); the page headers keep the global value.
   */
  quality?: number
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  quality: undefined,
  sizes: 'xs:100vw sm:100vw md:100vw lg:100vw xl:100vw xxl:100vw'
})

const media = ref<HTMLElement | null>(null)
const photographs = computed<HeroImage[]>(() => props.src
  ? [{ src: props.src }, ...(props.srcSecondary ? [{ src: props.srcSecondary }] : []), ...(props.sequence ?? [])]
  : [])
const hasSequence = computed(() => Boolean(props.sequence?.length))

/*
  A sequence is fetched just in time rather than all at mount (it was 22
  photographs, ~5.6 MB, before the page was interactive). Only the first is in
  the server HTML; the rest join the DOM as the loop nears them, `lookahead`
  ahead of the one on screen. A photograph is never shown before it has
  decoded: if the next one is late, the loop holds on the current one until
  it arrives, so a slow connection gets a longer hold, never a blank band.
  The two-photograph pair (`srcSecondary` alone) is a CSS loop and renders
  both up front, as before.
*/
const step = 8000
const transition = 1400
const lookahead = 2
const rendered = ref(1)
const shown = computed(() => hasSequence.value ? photographs.value.slice(0, rendered.value) : photographs.value)

/*
  `nuxt generate` with the static ipx provider writes only the image URLs the
  server rendered, so the photographs left out of the HTML are named to the
  prerenderer here. On Netlify the URLs are Image CDN ones and this is a no-op.
  The modifiers repeat `NuxtImg`'s own, key order included, because the order
  is part of the URL (`w_864&q_75`, not `q_75&w_864`).
*/
if (import.meta.server && import.meta.prerender && hasSequence.value) {
  const $img = useImage()
  const modifiers = { width: undefined, quality: props.quality || $img.options.quality }
  for (const photograph of photographs.value.slice(1)) {
    $img.getSizes(photograph.src, { sizes: props.sizes, densities: '1x', modifiers })
  }
}

let animations: Animation[] = []
let pending: Promise<boolean>[] = []
let started = false
let held = false
let timer: ReturnType<typeof setTimeout> | undefined
let motionPreference: MediaQueryList | undefined
let generation = 0
let mounted = false

const playing = () => !props.paused && !held && document.visibilityState !== 'hidden'

function syncPlayback() {
  for (const animation of animations) {
    if (!animation) continue
    if (playing()) animation.play()
    else animation.pause()
  }
  scheduleNext()
}

function imageAt(index: number) {
  return media.value?.querySelectorAll<HTMLImageElement>('img.bf-hero-media__image')[index]
}

/** Puts the photograph in the DOM and resolves once it can be painted. */
function prepare(index: number) {
  pending[index] ??= (async () => {
    rendered.value = Math.max(rendered.value, index + 1)
    await nextTick()
    const image = imageAt(index)
    if (!image) return false
    try {
      await image.decode()
      return true
    } catch {
      // `decode()` also rejects when the srcset candidate changes mid-decode;
      // an image that loaded anyway is still fit to show.
      if (!image.complete) {
        await new Promise(resolve => {
          image.addEventListener('load', resolve, { once: true })
          image.addEventListener('error', resolve, { once: true })
        })
      }
      return image.naturalWidth > 0
    }
  })()
  const currentGeneration = generation
  return pending[index].then((ok) => {
    if (ok && started && currentGeneration === generation) attach(index)
    return ok
  })
}

function keyframes(index: number, duration: number): Keyframe[] {
  // A shared bell-shaped blur peaks during the fastest part of the dissolve.
  // Sampling both curves together keeps their timing identical on both layers.
  const dissolve = Array.from({ length: 25 }, (_, frame) => {
    const progress = frame / 24
    const exchange = Math.max(0, Math.min(1, (progress - 0.15) / 0.7))
    return {
      time: progress * transition,
      opacity: exchange * exchange * (3 - 2 * exchange),
      filter: `blur(${(18 * Math.sin(Math.PI * progress) ** 2).toFixed(3)}px)`
    }
  })
  const sharp = { filter: 'blur(0px)' }
  // Drift steadily across the full visible interval, including both fades.
  // Alternate direction and keep scale fixed so the movement feels like a pan.
  const direction = index % 2 === 0 ? 1 : -1
  const pan = (time: number) => {
    const progress = time / (step + transition) - 0.5
    const x = progress * 3 * direction
    const y = progress * 1.2 * (index % 3 === 0 ? -1 : 1)
    // Overscan leaves room to pan without exposing the photograph's edges.
    return `translate3d(${x}%, ${y}%, 0) scale(1.08)`
  }
  const incoming = dissolve.map(frame => ({
    offset: frame.time / duration,
    opacity: frame.opacity,
    filter: frame.filter,
    transform: pan(frame.time),
    zIndex: 2
  }))
  // Keep the outgoing photograph opaque underneath the incoming layer so
  // the crossfade never exposes the background, including at the loop seam.
  const outgoing = dissolve.map(frame => ({
    offset: (step + frame.time) / duration,
    opacity: 1,
    filter: frame.filter,
    transform: pan(step + frame.time),
    zIndex: 1
  }))
  return [
    ...incoming,
    { offset: (transition + 1) / duration, opacity: 1, zIndex: 1, transform: pan(transition + 1), ...sharp },
    ...outgoing,
    { offset: (step + transition + 1) / duration, opacity: 0, zIndex: 0, transform: pan(step + transition), ...sharp },
    { offset: 1, opacity: 0, zIndex: 0, transform: pan(step + transition), ...sharp }
  ]
}

/**
 * Gives a decoded photograph its place on the loop's one clock. Every
 * animation shares the first one's time, so a photograph that arrives late
 * joins exactly where the loop already is.
 */
function attach(index: number) {
  const image = imageAt(index)
  if (!image || animations[index]) return
  const duration = photographs.value.length * step
  const animation = image.animate(keyframes(index, duration), {
    duration, delay: index * step - transition, iterations: Infinity, fill: 'both'
  })
  const clock = animations.find(Boolean)
  if (!clock) animation.startTime = document.timeline.currentTime
  else if (clock.startTime !== null) animation.startTime = clock.startTime
  // Paused, or resuming and not yet re-anchored: match its time instead.
  else animation.currentTime = clock.currentTime
  if (!playing()) animation.pause()
  animations[index] = animation
}

/**
 * Fetches ahead and guards the next crossfade. Photograph `k` fades in at
 * `k * step - transition` on the clock; just before that moment it must be
 * attached, or every animation is held until it is.
 */
function scheduleNext() {
  clearTimeout(timer)
  const clock = animations[0]
  if (!started || !clock || !playing()) return
  const count = photographs.value.length
  const time = Number(clock.currentTime ?? 0)
  const upcoming = Math.floor((time + transition) / step) + 1
  const next = upcoming % count
  for (let ahead = 0; ahead < lookahead; ahead++) prepare((upcoming + ahead) % count)
  const until = upcoming * step - transition - time
  if (animations[next]) {
    timer = setTimeout(scheduleNext, until + 50)
    return
  }
  timer = setTimeout(() => {
    if (animations[next]) return scheduleNext()
    held = true
    syncPlayback()
    const currentGeneration = generation
    prepare(next).then((ok) => {
      // A photograph that never loads leaves the loop holding on the one
      // before it, which is a still hero rather than a broken one.
      if (!ok || currentGeneration !== generation) return
      held = false
      syncPlayback()
    })
  }, Math.max(0, until - 250))
}

const pageLoaded = () => document.readyState === 'complete'
  ? Promise.resolve()
  : new Promise(resolve => window.addEventListener('load', resolve, { once: true }))

async function startSequence() {
  const currentGeneration = ++generation
  clearTimeout(timer)
  animations.forEach(animation => animation?.cancel())
  animations = []
  pending = []
  started = false
  held = false
  if (!mounted || !hasSequence.value || motionPreference?.matches) return

  // The first photograph is the page's LCP and is in the HTML; nothing else
  // is fetched until it has decoded and the page has loaded. Then the second
  // is fetched, and the loop starts once it can be shown, so a slow
  // connection keeps the first photograph visible.
  if (!(await prepare(0))) return
  await pageLoaded()
  if (currentGeneration !== generation || !(await prepare(1))) return
  if (currentGeneration !== generation) return
  started = true
  attach(0)
  attach(1)
  syncPlayback()
}

watch(photographs, startSequence, { flush: 'post' })
watch(() => props.paused, syncPlayback)
onMounted(() => {
  mounted = true
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', startSequence)
  // A hidden tab holds the loop, so throttled timers cannot let a crossfade
  // run ahead of the photograph it needs.
  document.addEventListener('visibilitychange', syncPlayback)
  startSequence()
})
onBeforeUnmount(() => {
  mounted = false
  generation++
  clearTimeout(timer)
  animations.forEach(animation => animation?.cancel())
  motionPreference?.removeEventListener('change', startSequence)
  document.removeEventListener('visibilitychange', syncPlayback)
})
</script>

<template>
  <!--
    One root, so `$attrs` has exactly one destination and a host's `class`
    merges with `bf-hero-media` rather than replacing it.

    **No `aria-hidden` here.** It was on this wrapper, and review found that
    it made the `alt` prop unreachable: `aria-hidden` on an ancestor removes
    the whole subtree from the accessibility tree, so a caller that passed a
    real string for a photograph that carries information would have had it
    silently dropped — a prop documented in three files with no effect any
    assistive technology could observe.

    `alt` is the mechanism instead, which is what it is for. `alt=""` — the
    default, and the decorative case — already makes the `<img>` ignored, and
    the scrim is an empty unlabelled `<div>` that is ignored anyway. Nothing
    in here is focusable, so nothing is trapped either way.
  -->
  <div ref="media" class="bf-hero-media">
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
      so these win — verified in the generated markup, not assumed. The rest
      of a sequence is `eager` too but at `low` priority: `shown` adds each one
      only when the loop wants it (see the script), and `lazy` would not
      defer them anyway, since every layer sits inside the viewport.

      `sizes` is what makes the srcset real, and review is the reason it is
      here. Without it `NuxtImg` emits a **density** srcset with nothing to
      vary — `"…/homepage.jpg 1x, …/homepage.jpg 2x"`, the same URL twice —
      the `screens:` ladder in `nuxt.config.ts` never engages, and a 375px
      phone downloads the full desktop bitmap as its largest contentful paint.
      That was the whole stated reason for preferring a local path over the
      Directus URL, and it was not true until this attribute existed.

      **It must be written screen by screen.** `@nuxt/image`'s `parseSizes`
      files any entry without a `screen:` prefix under the literal key `1px`,
      and `getSizesVariant` then resolves that key to a screen width of **1**
      — so a plain `sizes="100vw"` silently emits `w_1 1w, w_2 2w` and ships a
      one-pixel hero. Verified in the generated output before this form
      replaced it; it is a footgun with no error message, so it is written
      down here rather than left for the next component to rediscover.

      Every step defaults to `100vw` because this layer is always full-bleed:
      `inset: 0` on a band that spans the viewport. That is the photograph's
      drawn width only while the band is wider than it is tall. In a portrait
      band — every phone, on `/` — `cover` scales the photograph to the
      band's **height**, so it is drawn wider than the viewport and a `100vw`
      candidate is stretched: 1.8x at 320px on the home page's square pair.
      So `sizes` is a prop, and a host that knows its band's shape passes the
      real width. Only `px` and `vw` values count: `@nuxt/image` drops an entry
      in any other unit without a word, so `xs:36rem` would simply vanish.

      The ladder stops at `xxl` (1536) because the source files are 1600px
      wide; `3xl`/`4xl` would ask ipx to enlarge a bitmap, which costs bytes
      and buys nothing. `densities="1x"` for the same reason: with **width**
      descriptors the browser already accounts for device pixel ratio when it
      picks a candidate, so a second density would double the derivative count
      to produce files no display needs.
    -->
    <bfMedia
      v-for="(photograph, index) in shown"
      :key="photograph.src"
      class="bf-hero-media__image"
      :class="{ 'bf-hero-media__image--secondary': !hasSequence && index === 1 }"
      :style="{
        '--_bf-hero-media-image-position': photograph.position,
        ...(hasSequence ? { opacity: index === 0 ? 1 : 0 } : {})
      }"
      :src="photograph.src"
      :alt="index === 0 ? alt : ''"
      ratio="auto"
      :sizes="sizes"
      :quality="quality"
      densities="1x"
      loading="eager"
      :fetchpriority="index === 0 ? 'high' : 'low'"
    />

    <!--
      The scrim is its own element rather than a pseudo-element on the
      wrapper, because `panel` mode resizes it and a pseudo-element would make
      that a second, invisible box to reason about. It is painted whether or
      not there is an image: a band with `data-scrim` and no photograph is a
      flat navy header, which is a coherent thing to be.
    -->
    <!--
      Slot content is a child of the scrim, so it paints above the scrim
      fill and the photograph. `z-index` on the child cannot escape this
      layer's own `-1` — the host's in-flow copy stays above it.
    -->
    <div class="bf-hero-media__scrim">
      <slot />
    </div>
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
    /*
      Which part of the photograph survives the crop, behind a hook.

      This matters more here than anywhere else in the system and review is
      the reason it is stated: two of the three programme sources
      (`democracy.jpg`, `politics-society.jpg`) are **square** 1600x1600, and
      `cover` into a 60svh band roughly a third as tall discards the top and
      bottom of each. `center` is the platform default and what shipped
      unstated before; naming it as `--_bf-hero-media-image-position` means a
      band whose subject sits high or low in frame can be re-cropped from a
      stylesheet or a call site's `style`, without an art director having to
      re-cut the asset.
    */
    object-position: var(--_bf-hero-media-image-position, center);
  }

  /*
    The crossfade. One image fades over the other; the first never moves, so
    the band is never empty mid-fade and the LCP image is never transparent.

    The cycle is a hook, `--_bf-hero-media-crossfade-duration`, and the
    keyframes split it into four: hold the first, fade, hold the second, fade
    back. 20s gives 7s holds and 3s fades — slow enough to read as weather
    rather than as a slideshow. There is no motion token to reach for yet
    (`tokens/` has no duration scale), so the default is a literal.

    `prefers-reduced-motion` stops it outright and leaves the first image.
    The pause control WCAG 2.2.2 asks of anything that auto-updates for more
    than five seconds beside other content is the host's (`bfHero`), because
    this layer paints behind the band's content and a control inside it
    would sit under that content's boxes: it sets `data-motion="paused"` on
    the band, and the rule after the keyframes freezes the fade wherever it
    has got to.
  */
  .bf-hero-media > .bf-hero-media__image--secondary {
    opacity: 0;
    animation: bf-hero-media-crossfade
      var(--_bf-hero-media-crossfade-duration, 20s) ease-in-out infinite;
  }

  @keyframes bf-hero-media-crossfade {
    0%,
    35% {
      opacity: 0;
    }

    50%,
    85% {
      opacity: 1;
    }

    100% {
      opacity: 0;
    }
  }

  [data-motion="paused"] .bf-hero-media > .bf-hero-media__image--secondary {
    animation-play-state: paused;
  }

  @media (prefers-reduced-motion: reduce) {
    .bf-hero-media > .bf-hero-media__image--secondary {
      animation: none;
    }
  }

  .bf-hero-media__scrim {
    position: absolute;
    z-index: 3;
    inset: 0;
    background-color: var(--color-scrim);
  }

  /*
    Whatever a host drops on the scrim sits in the band, above the fill —
    nothing, today: the site announcement moved to the shell in Wave 1.
    `position` + `z-index` is what puts it over the scrim's own background;
    it still cannot climb out of this layer. The block-start margin is the inset under the nav.
  */
  .bf-hero-media__scrim > :slotted(*) {
    position: relative;
    z-index: 1;
    margin-block-start: var(--space-m);
  }

  /*
    `panel` mode. The attribute is on the host band, so this reads it as an
    ancestor — see the block comment for why it lives there.

    The width is the content column's own border box: `.center` is
    `content-box` with `padding-inline` (`center.css`, the `.center` rule), so
    its rendered width is `measure + 2 x padding`.

    ## What this does and does not track, stated exactly

    Review corrected an earlier claim here that any retune of the band's
    measure retunes the panel with it. It does not, and the reason is that
    this layer is a **sibling** of `.center` rather than an ancestor or a
    descendant of it:

    - `--theme-center-measure` / `--theme-center-padding` set **at or above
      the band root** inherit into both, and are tracked.
    - `bfSection`'s own `--_bf-section-measure` hook is written onto
      `.bf-section > .center`, so it never reaches here.
    - `data-measure` on the inner box writes `--_center-measure`, a different
      property, which this does not read at all.

    Rather than reach across for either, the width is a hook of this
    component's own — `--_bf-hero-media-panel-inline-size`, BRIEF §5 rule 4's
    shape — defaulting to the composition layer's inputs and their published
    defaults. A band that narrows its column narrows the panel by setting one
    property on the band root, in the same place it sets the rest of its
    geometry.

    `margin-inline: auto` is what centres it: for an absolutely positioned box
    with `inset-inline: 0` and a definite width, `auto` margins resolve to
    equal values, exactly as they do for a static block.

    `min()` rather than a media query — below the measure the panel is simply
    the band, which is the right answer on a phone.
  */
  [data-scrim="gradient"] .bf-hero-media__scrim {
    --_bf-hero-media-scrim-clear: 20%;
    --_bf-hero-media-scrim-dark: 48%;

    background: linear-gradient(
      to bottom,
      transparent var(--_bf-hero-media-scrim-clear),
      color-mix(in srgb, var(--color-surface-inverse) 60%, transparent) var(--_bf-hero-media-scrim-dark),
      color-mix(in srgb, var(--color-surface-inverse) 72%, transparent) 72%,
      color-mix(in srgb, var(--color-surface-inverse) 82%, transparent) 100%
    );
  }

  @media (width < 40rem) {
    [data-scrim="gradient"] .bf-hero-media__scrim {
      --_bf-hero-media-scrim-clear: 10%;
      --_bf-hero-media-scrim-dark: 36%;
    }
  }

  /*
    `none` — the ink mode (`HeroScrimMode`). No fill at all: the photograph
    as it is, and the host band keeps the page's dark ink. The element stays,
    so a slotted child still has its box.
  */
  [data-scrim="none"] .bf-hero-media__scrim {
    background-color: transparent;
  }

  [data-scrim="panel"] .bf-hero-media__scrim {
    /* One line: stylelint's `scss/operator-no-newline-*` pair rejects a break
       on either side of the `+`. */
    --_bf-hero-media-panel-inline-size: calc(var(--theme-center-measure, 1100px) + 2 * var(--theme-center-padding, var(--space-s)));

    background-color: var(--color-scrim-panel);
    inline-size: min(100%, var(--_bf-hero-media-panel-inline-size));
    margin-inline: auto;
  }

  /*
    Print. The scrim is a `background-color`, which user agents drop by
    default when printing, while the host bands set
    `color: var(--color-text-inverse)` — so without this the `<h1>` and, on a
    programme hub, two full paragraphs of intro come out white on white
    paper. Newly load-bearing on four routes, which is why it is stated here
    rather than left to the sitewide print gap.

    The photograph goes too: it is decorative, it is the largest thing on the
    page, and it is not what someone printing a programme hub wants.
  */
  @media print {
    .bf-hero-media {
      display: none;
    }

    /*
      A scrim child (none today; the announcement lived here before Wave 1)
      must still print. The photograph
      stays hidden; the scrim fill is a background and drops anyway.
    */
    .bf-hero-media:has(> .bf-hero-media__scrim > *) {
      display: block;
      position: static;
      z-index: auto;
      overflow: visible;
    }

    .bf-hero-media:has(> .bf-hero-media__scrim > *) .bf-hero-media__image {
      display: none;
    }

    .bf-hero-media:has(> .bf-hero-media__scrim > *) .bf-hero-media__scrim {
      position: static;
      background-color: transparent;
    }
  }
}
</style>
