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
 * element and attribute for attribute; what changes is the chip guard (below),
 * the skin, and one optional `<p class="kicker">` before the `<h1>` (`kicker`).
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
 * ## Three grounds (refined pass, Sep 2026)
 *
 * Every page that composes this header opens on it — the indexes (`/projects`,
 * `/search`, `/archive`), `/about`, the project and insight detail pages and
 * the program hubs — so for those pages the band is the masthead, and it
 * comes in exactly three grounds. There is no fourth, and in particular no
 * placeholder: a header with no photograph is a typographic header, never the
 * wireframe's crosshatch box.
 *
 * | ground | when | what paints |
 * |---|---|---|
 * | photo  | `image` is set | the photograph under a navy scrim, white type (gh#253) |
 * | paper  | no `image`, `surface` omitted or `'paper'` | the paper texture under a light wash, dark type |
 * | plain  | no `image`, `surface="plain"` | nothing; the band is type on the page ground |
 *
 * **Paper is the default** because it is what the insight article header —
 * the page this system was refined against — already wears. Giving every
 * index, hub-less and detail header the same ground makes "the top band of an
 * inner page" one recognisable thing across these templates: the reader
 * always knows where the masthead ends and the page begins, without a rule or
 * a box. The ground is `bfSection`'s own `data-surface="paper"` (see that
 * component): the article's texture drawn through `bfHeroMedia` under the
 * article's 28% wash, so a header and the article it links to share one
 * masthead pixel for pixel.
 *
 * This header does not cover every inner page. `/insights` builds its
 * masthead on `bfSection` directly, and the home page and the 404 have heads
 * of their own; none of them is bound by this table. The `/insights`
 * masthead reaches the same paper by setting `data-surface="paper"` on its
 * band, which is why the ground lives on `bfSection` and not here.
 *
 * `plain` is for the band that must not have a ground — a header that sits
 * directly on another coloured surface, or a template that designs its own.
 * With nothing to mark the band's edge it would float in its own padding, so
 * it gives most of its bottom padding back and lets the next band's step do
 * the separating.
 *
 * `image` always wins: a photograph is a stronger statement than a surface
 * choice, and `surface` is ignored when one is passed.
 *
 * ## Styling
 *
 * Every value on the page still comes from `bfSection`, `bfBreadcrumb` and
 * `bfChip`'s own hooks, or from `@layer composition` resolving `.cluster` +
 * `data-gap="xs"` and `data-measure="normal"`, except for the ground rules
 * above and one rhythm rule: the title stands a full `--space-m` off the
 * trail or the chips, because wayfinding and the page's name are different
 * things and the stack's default `--space-s` set them as one run, and 85% of
 * that off a kicker, which labels the title itself (the user's call,
 * 2026-09-28). It is written at `:where()` weight so a template's own
 * header rhythm — `article.css` sets the same steps for the insight page —
 * always wins over it.
 *
 * The photo rules are gh#253's, every one conditional on there being a
 * photograph: the containing block and stacking context `bfHeroMedia` needs,
 * the inverted text colour that goes with a dark band, and the two inversions
 * a dark ground forces on the controls: a visible focus ring and a visible
 * control boundary.
 *
 * That block is the first `<style>` this file has ever had, so its
 * `@layer components { }` wrapper is written **by hand**:
 * `src/nuxt.config.ts`'s `postcss` block disables `postcss-preset-env`'s
 * cascade-layers
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
   * A short label above the `<h1>` — a format or series name split off the
   * heading (`splitHeadingKicker`), e.g. "Infographic" or "Hidden Layers".
   *
   * Rendered as a `<p class="kicker">` immediately **before** the `<h1>`, not
   * inside it: reading order then matches the picture, the `<h1>` is exactly
   * the title, and heading navigation does not open every infographic's name
   * with the word "Infographic". The full string stays in the document
   * `<title>`, which the caller sets. Absent, `null` or `''` renders nothing.
   *
   * Its one caller is the insight page (`pages/insights/[slug].vue`). The
   * refined pass (Sep 2026) had moved that page's kicker into the meta row
   * under the `<h1>` and left this prop unused; the user chose the kicker
   * above the title on 2026-09-28, so the page passes it again. The step
   * from the kicker to the `<h1>` is 85% of the title's `--space-m`.
   */
  kicker?: string | null
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
   * (`bfMedia`'s `isAbsolute` predicate), so the `image` field on a
   * `bfPrograms` document —
   * a Directus URL — is deliberately *not* what a hub passes here.
   *
   * Absent or `null` and no photograph paints: no `data-scrim`, no inverted
   * colour, and the photo rules below are inert. The band then wears the
   * `surface` ground instead — the paper texture unless the caller asks for
   * `plain` (see "Three grounds" in the header).
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
  /**
   * The band's ground when there is no `image`: `'paper'` (the default) or
   * `'plain'`. See "Three grounds" in the header. Ignored with an `image`.
   *
   * A local literal union rather than a contracts type, for the reason `Props`
   * itself is local: nothing outside this component names it.
   */
  surface?: 'paper' | 'plain'
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Page header',
  imageAlt: '',
  scrim: 'full',
  surface: 'paper'
})

/**
 * Which of the three grounds this band wears. `image` wins; otherwise the
 * `surface` prop decides.
 *
 * Only the photo fills `#bleed` from here. The paper is `bfSection`'s own
 * fallback for that slot, switched on by `data-surface="paper"` in the
 * template, so the texture path and its wash are written once, on the base
 * band, for this header and for `/insights` alike. `plain` renders no bleed
 * layer at all, so its box model is the text-only band this component
 * shipped with.
 */
const ground = computed<'photo' | 'paper' | 'plain'>(() =>
  props.image ? 'photo' : props.surface
)

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
    :class="{
      'bf-page-header--media': ground === 'photo',
      'bf-page-header--paper': ground === 'paper',
      'bf-page-header--plain': ground === 'plain'
    }"
    :data-scrim="image ? scrim : undefined"
    :data-surface="ground === 'paper' ? 'paper' : undefined"
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
      that — the route announcer inside `bf-default`'s `<main>`, `bfHero`'s
      inner box, and this file's own.

      `class`, `data-scrim` and `data-surface` all survive `bfSection`'s
      attribute allow-list — `class` by name, the other two by the `data-`
      prefix.

      Only the photograph is passed here. The paper ground is `bfSection`'s
      fallback for this same slot, drawn when the slot is absent and the band
      carries `data-surface="paper"` (bound above for the paper ground only):
      the texture with an empty `alt`, because it is a surface and not a
      picture of anything, under `bfSection`'s own wash. Conditional on
      `image` so the paper and plain grounds pass no slot at all.
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
    <p v-if="kicker" class="bf-page-header__kicker kicker">{{ kicker }}</p>

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
  colour literal — every value is a semantic token that already existed.
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

    Scoped to the photo modifier rather than declared unconditionally: the
    paper ground gets the same pair from `bfSection`'s `data-surface` rule,
    which draws its layer, and a `plain` header — which paints nothing —
    keeps precisely the box model this component shipped with.
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
    The crumb links need no rule here any more. gh#253 wrote one because a
    linked crumb fell through to the user agent's `#0000EE` (1.83:1 on this
    scrim — a WCAG 1.4.3 failure); `bfBreadcrumb` now sets its links to
    `inherit` on every ground, so they pick up this band's white the same way
    the `<h1>` does.
  */

  /*
    The focus ring, inverted. `base/focus.css:76-82` outlines with
    `--color-text` — near-black — and the stack has no inverse variant, so on
    a navy scrim the indicator all but disappears (WCAG 2.4.7). That file sits
    in `@layer defaults` precisely so a component layer can win, which this
    does.

    `:deep()` because a header's controls are slot content and
    child-component roots, and neither carries this component's scope id.

    **Two rules, and the second is not redundant** — see the identical pair in
    `Hero.vue` for the full argument. In short: the bare pseudo-class compiles
    to (0,3,0) and `bfButton`'s own `.bf-button[data-v-…]:focus-visible` is
    (0,3,0) too, so source order in the built stylesheet decides and
    `bfButton` won there. Naming the control makes it (0,4,0) and removes the
    tie. `bfBreadcrumb` was only incidentally safe, through the
    `--_bf-breadcrumb-focus-color` hook written above.
  */
  .bf-page-header--media :deep(:focus-visible) {
    outline-color: var(--color-text-inverse);
  }

  .bf-page-header--media :deep(.bf-button:focus-visible) {
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

  /*
    The paper ground — the default for a header with no photograph — has no
    rule here. It is `bfSection`'s `data-surface="paper"`: the containing
    block, the 28% wash over the texture and the page's own dark ink are
    declared once on the base band, so this header and `/insights`'
    hand-built masthead cannot drift apart. `.bf-page-header--paper` stays on
    the root as the ground's name, beside `--media` and `--plain`, for a
    template or a probe to select on.
  */

  /*
    The plain ground. With no surface to mark where the band stops, the full
    `--space-3xl` under the standfirst reads as empty page rather than as the
    end of a masthead, and the header drifts away from the content it
    introduces. So the band keeps its top padding and gives most of the bottom
    back; the next band's own step does the separating.

    Two classes, (0,3,0) once scoped, because `bfSection`'s
    `.bf-section--padded` compiles to (0,2,0) in this same layer and a tie
    would be decided by chunk order — the `article.css` lesson.
  */
  .bf-page-header.bf-page-header--plain {
    padding-block-end: var(--space-l);
  }

  /*
    The title's step. Whatever precedes the `<h1>` — the trail, the chips —
    is about the page; the `<h1>` is the page. The stack's default
    `--space-s` set the two as one run of type, so the title stands a full
    `--space-m` off it instead.

    The kicker is the exception: it labels the title rather than the page,
    so it sits closer — 85% of that step. The user chose the kicker above
    the title on 2026-09-28, with the gap 15% tighter than 1899ef6's.

    The things that can precede it, named, so a header with no trail
    (`/search`) does not open with a margin on its first child. Not `* +`:
    Vue's scoped compiler hangs the scope attribute on the `*` and then drops
    it, leaving `+:where(…)` — an empty selector that dev never minifies and
    `lightningcss` rejects in `nuxt generate`. `:where()` so the rule carries
    no weight of its own: a template that tunes its header's rhythm
    (`article.css` writes these same steps for the insight page) always wins
    over it, and the insight header is untouched by construction.
  */
  :where(.bf-page-header__crumbs, .bf-page-header__chips) + :where(.bf-page-header__heading) {
    margin-block-start: var(--space-m);
  }

  :where(.bf-page-header__kicker) + :where(.bf-page-header__heading) {
    margin-block-start: calc(var(--space-m) * 0.85);
  }

  /*
    No placeholder in a masthead, ever. A template that hands the header's
    default slot a `bfMedia` for a record that turns out to have no image gets
    `bfMedia`'s crosshatch box — the wireframe's "image goes here" — which on
    a finished page reads as a broken image. The header drops it and stays
    typographic. The box is `aria-hidden` already, so removing it changes
    nothing in the accessibility tree; a real image is untouched.

    `:deep()` because the box is a child component's root in slot content,
    which carries neither this component's scope id nor `bfSection`'s.
  */
  .bf-page-header :deep(.bf-media--placeholder) {
    display: none;
  }
}
</style>
