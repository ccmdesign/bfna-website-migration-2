<script setup lang="ts">
/**
 * `bfPageHeader` — the inner-page hero unit.
 *
 * Evolves `components/wireframe/wfPageHeader.vue` (frozen, D2 — read, never
 * edited), whose whole body is:
 *
 * ```vue
 * <wf-section :label="label" gap="s" padded>
 *   <wf-breadcrumb v-if="crumbs?.length" :items="crumbs" />
 *   <div v-if="chipList.length || $slots.chips" class="cluster" data-gap="xs">
 *     <wf-chip v-for="c in chipList" :key="c">{{ c }}</wf-chip>
 *     <slot name="chips" />
 *   </div>
 *   <h1>{{ heading }}</h1>
 *   <p v-for="p in taglines" :key="p.slice(0, 20)" data-measure="normal">{{ p }}</p>
 *   <slot />
 * </wf-section>
 * ```
 *
 * Eight call sites — `about`, `archive`, `search`, `[area]`, `insights/index`,
 * `insights/[slug]`, `projects/index`, `projects/[slug]` — which makes it the
 * most-reused `wf-*` component after `wfSection`, and the base of every Phase 6
 * template except home and 404. The structure is therefore kept element for
 * element and attribute for attribute; what changes is the chip guard (below)
 * and the skin.
 *
 * Presentational-only (D8): props in, two slots, nothing out. It knows nothing
 * about search inputs, filters or the route — a template puts those in the
 * default slot and passes its own `crumbs`.
 *
 * ## It composes `bfSection`; it does not extend it
 *
 * The band is `<bfSection :label gap="s" padded>` — the same base +
 * specialisation shape the as-built inventory records for
 * `wfPageHeader`/`wfCtaSection`/`wfContactSection`, and the same three
 * arguments the wf source passes. The prop names are `bfSection`'s as built in
 * gh#48, read rather than assumed: `label` lands as `data-label` on the root
 * `<section>`, `gap` as `data-gap` on the inner box, and `padded` as the
 * `.bf-section--padded` modifier class rather than the inline
 * `style="padding-block: …"` the wf source binds.
 *
 * `layout`, `measure` and `fullWidth` are deliberately not exposed. A caller
 * who wants a different band shape wants a `bfSection`, not a
 * differently-shaped page header.
 *
 * ## The one `<h1>`
 *
 * This component owns the page's top-level heading, rendered unconditionally
 * as the wf source does, so a page that mounts one header contributes exactly
 * one `h1`. There is no `headingLevel` prop — unlike the card wrappers (#128)
 * and for the same reason `bfSection` fixes its heading at rank 2: fixing the
 * rank here is what keeps BRIEF §5 rule 9's sequential heading levels true by
 * construction for the eight templates that compose this.
 *
 * ## Styling
 *
 * Almost none, and none at all until gh#253. Every value on the page still
 * comes from `bfSection`, `bfBreadcrumb` and `bfChip`'s own hooks, or from
 * `@layer composition` resolving `.cluster` + `data-gap="xs"` and
 * `data-measure="normal"`. The BEM class names below are selector hooks for a
 * template, a probe or a future skin — the pattern `bf-section__heading` and
 * `bf-hero__heading` already set — and they carry no declarations.
 *
 * What gh#253 adds is four rules and nothing more, every one of them
 * conditional on there being a photograph: the containing block and stacking
 * context `bfHeroMedia` needs, the inverted text colour that goes with a dark
 * band, the crumb links (which do **not** inherit it — see the rule), and an
 * inverted focus ring. A header with no `image` still resolves to the empty
 * stylesheet this component shipped with.
 *
 * That block is the first `<style>` this file has ever had, so its
 * `@layer components { }` wrapper is written **by hand**:
 * `src/nuxt.config.ts:200` disables `postcss-preset-env`'s cascade-layers
 * polyfill (which would flatten the wrapper into unlayered rules that outrank
 * every layer — residual #98 / gh#101) and `scripts/check-routes.ts` gates
 * every compiled `bf-*` stylesheet for it.
 */
import { Comment, Fragment, Text } from 'vue'
import type { VNode } from 'vue'
import type { Crumb, ScrimMode } from '~/types/bf-contracts'

defineOptions({ name: 'BfPageHeader' })

/**
 * A local, unexported prop bag — the `bfBreadcrumb` shape (D-28.3), not the
 * `XProps`-in-`bf-contracts.ts` shape of the atoms.
 *
 * BRIEF §5 rule 11 forbids a component declaring a **shared** type inline. The
 * shared type here is `Crumb`, and it is imported from contracts rather than
 * redeclared — which is precisely what `wfPageHeader` gets right by importing
 * `WfCrumb` from `wfBreadcrumb.vue` and what this component keeps. `Props` is
 * unexported and unimportable, so it is shared with nobody, and this issue's
 * spec both designs the props this way and greps this file for
 * `crumbs?: Crumb[]`.
 *
 * `src/types/bf-contracts.ts` is therefore not edited by this issue.
 */
interface Props {
  /**
   * The band's name, forwarded to `bfSection` and rendered there as
   * `data-label` on the root `<section>`.
   *
   * Kept from the wf source, default and all, but its meaning narrows: upstream
   * it drives the wireframe's dashed corner tag, which is `.wireframe .wf-slot`
   * skin rather than band geometry and does not exist in finished `bf-*`
   * chrome. Here it is a stable identifier a template, a probe or a test can
   * select a header by — invisible on the page, and invisible to the
   * accessibility tree (the accessible name of this unit is its `<h1>`).
   */
  label?: string
  /**
   * The trail, passed straight to `bfBreadcrumb`. Never derived from the route:
   * every wf call site passes its own, because the visible trail and the URL
   * shape disagree on several templates.
   */
  crumbs?: Crumb[]
  /**
   * Chip labels, one `bfChip` each. Plain strings only; rich or interactive
   * chips go through the `chips` slot, and both render into the same `.cluster`
   * when both are given.
   *
   * Narrower than the wf source's `(string | null)[]` — see `chipList` below
   * for what that costs a call site, which is nothing.
   */
  chips?: string[]
  /**
   * The page's `<h1>`. Rendered unconditionally, exactly as the wf source does.
   */
  heading?: string | null
  /**
   * The standfirst, as one paragraph or several. A `string` renders one
   * `<p data-measure="normal">`, a `string[]` one per entry, `null` none.
   */
  tagline?: string | string[] | null
  /**
   * A photograph behind the band. gh#253.
   *
   * **Prefer a root-relative local path** — `/images/hero/democracy.jpg`.
   * `bfMedia` routes those through `NuxtImg` and gets a real srcset, and
   * hands an absolute `https://` URL to the browser untouched with none
   * (`Media.vue:70-76`), so the `image` field on a `bfPrograms` document —
   * a Directus URL — is deliberately *not* what a hub passes here.
   *
   * Absent or `null` and the header paints nothing at all: no bleed layer, no
   * scrim, no `data-scrim`, no colour. That is what the four routes this item
   * does not art-direct keep doing, byte for byte.
   */
  image?: string | null
  /**
   * The photograph's alternative text, `''` by default because a header image
   * is normally decorative: the `<h1>` carries the meaning. Pass a real
   * string for one that genuinely carries information.
   */
  imageAlt?: string
  /** Which scrim treatment the band wears. Ignored without an `image`. */
  scrim?: ScrimMode
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Page header',
  imageAlt: '',
  scrim: 'full'
})

defineSlots<{
  /** By-lines, meta rows, header actions — and the `/search` template's input. */
  default?: () => VNode[]
  /** Rich or interactive chips, rendered into the same cluster as `chips`. */
  chips?: () => VNode[]
}>()

const slots = useSlots()

/**
 * The string chips, falsy entries dropped — the wf source's own `chipList`.
 *
 * `Props.chips` is typed `string[]`, narrower than the wf source's
 * `(string | null)[]`, but the filter stays: three wf call sites build their
 * array as `[…, cond ? 'Archive' : null]`, and a chip whose label is an empty
 * string is a chip nobody can read. Runtime behaviour is identical to the
 * source's for every existing call site.
 */
const chipList = computed(() =>
  (props.chips ?? []).filter((c): c is string => typeof c === 'string' && c !== '')
)

/**
 * `string | string[] | null` normalised to an array — the wf source's
 * `taglines`, unchanged.
 */
const taglines = computed(() =>
  Array.isArray(props.tagline) ? props.tagline : props.tagline ? [props.tagline] : []
)

/**
 * Does a slot function actually render something?
 *
 * **This is the one behavioural change from the frozen source**, and residual
 * [#162](https://github.com/ccmdesign/bfna-website-migration-2/issues/162) asks
 * for the decision to be taken here, at the first real consumer.
 *
 * The source guards the chip cluster with `$slots.chips`, which is truthy
 * whenever the parent *passed* a slot — including one whose content is
 * `v-if`'d away. A call site written
 *
 * ```vue
 * <bfPageHeader …>
 *   <template #chips><bfChip v-if="isArchived">Archive</bfChip></template>
 * </bfPageHeader>
 * ```
 *
 * would then render an empty `.cluster` on every non-archived page: a
 * zero-height flex box that is still a `.stack` child and still takes a
 * `data-gap="s"` gap under the breadcrumb. Probe 37 caught the identical bug in
 * `bfHero` from its own template.
 *
 * So the guard resolves the slot and asks whether the vnodes it produced hold
 * anything renderable. A comment is what `v-if="false"` leaves behind; a
 * fragment is what a `<template>` wrapper produces and is recursed into; a
 * whitespace-only text node is the newline between two tags. Anything else —
 * an element, a component, real text — counts.
 *
 * Every honest call site behaves exactly as it did on the wireframe, because
 * a slot that renders content still renders content. This does **not** close
 * #162, which is about `Hero.vue`'s default slot; it is deliberately local
 * rather than a shared helper, so the shape can be judged on one component
 * before it is generalised.
 */
const hasRenderedContent = (nodes: VNode[] | undefined): boolean => {
  if (!nodes) return false

  return nodes.some((node) => {
    if (node.type === Comment) return false
    if (node.type === Text) return String(node.children ?? '').trim() !== ''
    /*
      A fragment is what a `<template>` wrapper produces. Its children are an
      array in every case Vue's compiler emits, but the vnode type also admits a
      string and a slots object, and `.some` on either would throw inside a
      render — so the array check is the guard, not the cast.
    */
    if (node.type === Fragment) {
      return Array.isArray(node.children)
        ? hasRenderedContent(node.children as VNode[])
        : false
    }
    return true
  })
}

/**
 * Called from the template rather than wrapped in a `computed`, on purpose: a
 * slot's rendered content is not a reactive dependency, so a cached computed
 * could hold a stale answer across a parent re-render that changed it. A
 * template expression is re-evaluated on every render, which is exactly the
 * cadence the slot itself is re-created on.
 */
const showChips = (): boolean => chipList.value.length > 0 || hasRenderedContent(slots.chips?.())
</script>

<template>
  <!--
    One root — `bfSection` — so this component's own `$attrs` has exactly one
    destination, and `bfSection`'s allow-list decides what of it reaches the
    DOM. A caller's `class` merges with `bf-page-header` and `bf-section` rather
    than replacing either.

    The children are in the wf source's order, which is also the reading order:
    where you are, what this is, what it is called, what it is about, and then
    whatever the template adds.
  -->
  <bfSection
    class="bf-page-header"
    :class="{ 'bf-page-header--media': Boolean(image) }"
    :data-scrim="image ? scrim : undefined"
    :label="label"
    gap="s"
    padded
  >
    <!--
      The photograph and its scrim, gh#253, into `bfSection`'s `#bleed` slot —
      a direct child of the band's `<section>`, *outside* `.center`.

      Outside for two reasons, both of which have bitten this repository
      already. `.center` is `content-box` with `padding-inline`
      (`center.css:50-58`), so a layer inside it is not full-bleed. And it is
      a `.stack`, which spaces with `> * + *` **margin** rather than `gap`, so
      an absolutely positioned child of it still takes a `margin-block-start`
      that shrinks and offsets it — three logged defects come from exactly
      that (`layouts/bf-default.vue:77-103`, `Hero.vue:94-130`, and this
      file's own history at `:158-190`).

      `class` and `data-scrim` both survive `bfSection`'s attribute
      allow-list — `class` by name, `data-scrim` by the `data-` prefix.
    -->
    <template v-if="image" #bleed>
      <bfHeroMedia :src="image" :alt="imageAlt" />
    </template>

    <!--
      `crumbs?.length`, not `crumbs`: an empty array passed by a template whose
      trail is still loading must render no `<nav>`. `bfBreadcrumb` guards
      again internally, so an empty trail contributes no landmark either way.
    -->
    <bfBreadcrumb
      v-if="crumbs?.length"
      class="bf-page-header__crumbs"
      :items="crumbs"
    />

    <!--
      Strings and slot content share one cluster, in that order — the wf
      source's arrangement, so a template can pass a few plain labels and one
      interactive chip and get a single wrapping row rather than two.
    -->
    <div
      v-if="showChips()"
      class="cluster bf-page-header__chips"
      data-gap="xs"
    >
      <bfChip
        v-for="c in chipList"
        :key="c"
      >{{ c }}</bfChip>
      <slot name="chips" />
    </div>

    <!--
      Unconditional, as upstream. A header with no `heading` is a call-site
      bug, and rendering an empty `<h1>` is how it stays visible instead of
      silently costing the page its top-level heading.
    -->
    <h1 class="bf-page-header__heading">{{ heading }}</h1>

    <!--
      `data-measure="normal"` per paragraph, resolved by `@layer composition` —
      the standfirst is prose and wants a line-length cap even inside a band
      that does not set one.
    -->
    <p
      v-for="p in taglines"
      :key="p.slice(0, 20)"
      class="bf-page-header__tagline"
      data-measure="normal"
    >{{ p }}</p>

    <slot />
  </bfSection>
</template>

<style scoped>
/*
  Written by hand, for the reason in the header: `nuxt.config.ts:200` turns
  `postcss-preset-env`'s cascade-layers polyfill off, and `check-routes.ts`
  fails the build if any compiled `bf-*` stylesheet lost its wrapper.

  No `:not()` appears below, complex-selector or otherwise (D-20.5), and no
  colour literal — both values are semantic tokens that already existed.
*/
@layer components {
  /*
    `.bf-page-header` is `bfSection`'s root `<section>` wearing this
    component's class, so this rule reaches it: a child component's root
    element carries its parent's scope id. Its *insides* do not — `.center` is
    `bfSection`'s own element — which is exactly why `bfHeroMedia` is built to
    need no rule on the content column.

    `isolation: isolate` is the load-bearing half. It makes this band a
    stacking context, so `bfHeroMedia`'s `z-index: -1` paints above the band's
    background and below every in-flow descendant, and cannot escape upward.

    Scoped to the `--media` modifier rather than declared unconditionally,
    because this band is composed by eight templates and seven of them pass no
    image: a header with no photograph keeps precisely the box model it had
    before gh#253.
  */
  .bf-page-header--media {
    position: relative;
    isolation: isolate;

    /*
      With a photograph the band is dark and its type is white — the rule
      `--color-scrim`'s 0.70 alpha was chosen to make true (white at 4.840
      over the worst case, a blown-out white photograph). Set on the band so
      the breadcrumb, the `<h1>`, the taglines and anything in the default
      slot inherit it; `bfBreadcrumb`'s links carry a class, so they inherit
      rather than picking up `a:not([class])`'s link colour.

      No programme colour in this rule, deliberately. At this alpha the
      programme hues measure 1.92 / 1.64 / 1.87 as text over the scrim, so
      they appear here only as an opaque fill — a `bfChip` — which does not
      composite with the photograph. Nothing this component declares is
      scoped by `[data-program]`, so nothing it adds recolours per route.
    */
    color: var(--color-text-inverse);
  }

  /*
    The separator and the crumb focus ring are `--_bf-breadcrumb-*` hooks
    declared inside `.bf-breadcrumb`'s own rule, so an inherited value cannot
    reach them — the element's own declaration wins over inheritance. This
    rule outranks that one on specificity (0,3,0 against 0,1,0) in the same
    layer, which is the supported way to retune another component's hooks from
    a band.

    `--color-neutral-tint-60` on navy is a near-black separator on a dark
    ground; the inverted pair is what the rest of this band already uses.
  */
  .bf-page-header--media :deep(.bf-breadcrumb) {
    --_bf-breadcrumb-separator-color: var(--color-text-inverse);
    --_bf-breadcrumb-focus-color: var(--color-text-inverse);
  }

  /*
    The crumb links, explicitly — inheritance does **not** reach them, and
    assuming it did was the one defect the browser pass caught in this item.

    A linked crumb carries `class="bf-breadcrumb__link"`, so
    `base/typography.css:75`'s `a:not([class])` does not match it and no
    author rule colours it at all. It therefore falls all the way through to
    the user agent's own `#0000EE`, which is not inherited and which measured
    **1.83:1** on this band's scrim over the real photograph — a WCAG 1.4.3
    failure, and invisible from the markup, because the element looks like it
    is inheriting the white the rest of the header inherits.

    `:visited` is stated with it: the UA colours a visited link `#551A8B`,
    which is worse. `inherit` rather than repeating the token, so the crumbs
    can never drift from the band's own colour — including on a band that
    later chooses a different one.

    That the link is unstyled on a *light* page too is a pre-existing gap in
    `bfBreadcrumb` rather than something this band introduced; it is raised
    separately.
  */
  .bf-page-header--media :deep(.bf-breadcrumb__link),
  .bf-page-header--media :deep(.bf-breadcrumb__link:visited) {
    color: inherit;
  }

  /*
    The focus ring, inverted. `base/focus.css:76-82` outlines with
    `--color-text` — near-black — and the stack has no inverse variant, so on
    a navy scrim the indicator all but disappears (WCAG 2.4.7). That file sits
    in `@layer defaults` precisely so a component layer can win, which this
    does.

    `:deep()` because a header's controls are slot content and
    child-component roots, and neither carries this component's scope id.
    `outline-color` as a longhand at (0,3,0) also outranks `bfButton`'s and
    `bfBreadcrumb`'s own `outline:` shorthands at (0,2,0) in this same layer,
    so one rule covers every control the band can hold.
  */
  .bf-page-header--media :deep(:focus-visible) {
    outline-color: var(--color-text-inverse);
  }

  /*
    The controls' visible boundary, gh#253 — WCAG 1.4.11, and a regression
    this band would otherwise introduce rather than an adjacent issue.

    `bfButton`'s `primary` variant fills and outlines itself with
    `--color-primary`. Against a white page that reads at 6.3:1; against this
    band's scrim over the real photograph it measured **1.22:1**, so the
    control had no discernible edge at all. The `default` variant is worse
    still on a dark ground: `--color-text` label on `--_bf-button-bg: none`.

    `border-color` as a longhand rather than through `--_bf-button-border`,
    because `primary` writes that hook **inline** (`Button.vue:135-139`) and
    an inline declaration cannot be outranked by any rule. The longhand at
    (0,3,0) beats the component's own `border:` shorthand at (0,1,0) in the
    same layer, so it lands on both variants. White on this scrim is 4.84:1,
    comfortably past the 3:1 floor.

    `--_bf-button-color` *is* written through the hook, because it is only the
    `default` variant that needs it — `primary` already writes
    `--color-text-inverse` inline, and an inline value winning there is the
    right outcome.

    The focus ring stays distinguishable from this keyline: it is an `outline`
    with `outline-offset`, so it draws a second ring outside the border with
    the band's ground showing between them.
  */
  .bf-page-header--media :deep(.bf-button) {
    --_bf-button-color: var(--color-text-inverse);

    border-color: var(--color-text-inverse);
  }
}
</style>
