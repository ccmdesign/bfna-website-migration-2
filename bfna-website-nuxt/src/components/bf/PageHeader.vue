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
 * None. This file declares no stylesheet at all — no custom property, no
 * colour, no rule. Every value on the page comes from `bfSection`,
 * `bfBreadcrumb` and `bfChip`'s own hooks, or from `@layer composition`
 * resolving `.cluster` + `data-gap="xs"` and `data-measure="normal"`. The BEM
 * class names below are selector hooks for a template, a probe or a future
 * skin — the pattern `bf-section__heading` and `bf-hero__heading` already set —
 * and they carry no declarations here. Nothing to say about `@layer components`
 * or D-20.5 that an empty stylesheet does not already say.
 */
import { Comment, Fragment, Text } from 'vue'
import type { VNode } from 'vue'
import type { Crumb } from '~/types/bf-contracts'

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
}

const props = withDefaults(defineProps<Props>(), { label: 'Page header' })

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
    :label="label"
    gap="s"
    padded
  >
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
