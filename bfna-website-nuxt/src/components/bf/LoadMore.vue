<script setup lang="ts">
/**
 * `bfLoadMore` — the feed pagination control.
 *
 * Componentises the inline button in `src/pages/wireframes/insights/index.vue:30-32`
 * (frozen, D2 — read, never edited):
 *
 * ```vue
 * <p v-if="filtered.length > visible">
 *   <button class="wf-button" @click="visible += 24">
 *     Load more ({{ filtered.length - visible }} remaining)
 *   </button>
 * </p>
 * ```
 *
 * Presentational-only (BRIEF D8): props in, one event out. No `queryCollection`,
 * no store, no data composable — and, specifically, **no pagination state**.
 * The caller keeps its own `visible` ref exactly as the wireframe does and
 * increments it in the `@load` handler. This component never learns what a page
 * is, never slices an array and never holds a cursor.
 *
 * ## What the wireframe got right, and the one thing it could not
 *
 * The element, the removal and the label shape are all the wireframe's, kept:
 * a real `<button>`, gone entirely once everything is loaded, labelled with the
 * caller's own remainder arithmetic.
 *
 * What a raw inline button cannot do is tell anyone what happened. Activating
 * it appends items *above* itself — the control stays put, focus stays on it,
 * nothing near the user changes, and a screen reader announces nothing at all.
 * The whole interaction is silent. So this component adds one thing the
 * wireframe has no way to express: a visually-hidden `aria-live="polite"`
 * region reading *"Showing 48 of 354 items"*, driven by counts the caller
 * passes down.
 *
 * ## Why the live region outlives the button
 *
 * The spec says the component renders **nothing — not even an empty wrapper —**
 * when `hasMore` is false. It also asks for that live region. Taken together at
 * face value, the region would be inserted and removed along with the button,
 * and would therefore announce nothing on the load that matters most: the last
 * one, where the count reaches its total *and the control disappears from under
 * the user's finger*. An `aria-live` region only announces a mutation observed
 * inside a region that was already in the accessibility tree; removing it in
 * the same tick as its final update is exactly the documented way to announce
 * nothing.
 *
 * So the two readings are split along the seam the spec itself draws — it
 * already says the announcement defaults to *off* when either count is omitted:
 *
 * | caller passes | at `hasMore=false` |
 * |---|---|
 * | **neither** count | renders **literally nothing** — no element at all. The spec's letter, exactly. |
 * | **both** counts | the button is removed; the region persists with the final count. |
 *
 * The persisting region is `position: absolute` and clipped to a 1px box, so it
 * occupies no space, paints no pixel and moves no layout — "renders nothing"
 * holds visually and in layout in both rows. Probe 32 measures the wrapper's
 * footprint at `hasMore=false` rather than taking that on trust.
 *
 * ## `disabled`, not `aria-disabled`
 *
 * `loading` renders the button `disabled`, which is the spec's own contract and
 * `bfButton`'s only genuinely non-interactive branch. It has a known cost — a
 * focused button that becomes `disabled` drops focus to `<body>` — which is not
 * papered over here because the alternative is worse: `aria-disabled` leaves an
 * element that is still activated by Enter, i.e. a control that lies about
 * being unavailable. The one consumer this component was written for (issue 49)
 * slices a build-time-static array synchronously and never sets `loading` at
 * all, so the cost is not paid on any path the epic ships. A caller that does
 * fetch should move focus itself once the load resolves.
 *
 * ## Styling
 *
 * No new CSS variables (spec § Styling) and no new colour (BRIEF §5 rule 2):
 * the button is `bfButton`, which owns every hook, and the wrapper paints
 * nothing. No `:not()` appears below at all, complex-selector or otherwise
 * (D-20.5).
 */
import type { LoadMoreProps } from '~/types/bf-contracts'

defineOptions({
  name: 'BfLoadMore',
  /*
   * The root is conditional (`v-if`), so `$attrs` is bound by hand: an
   * automatic fallthrough onto a root that may not exist warns in dev, and
   * binding it explicitly is also what makes a caller's `class` and `style`
   * merge with — rather than replace — the ones written here, via the
   * `mergeProps` the compiler emits. The `bfButton` precedent.
   */
  inheritAttrs: false
})

const props = withDefaults(defineProps<LoadMoreProps>(), {
  loading: false,
  label: 'Load more',
  visibleCount: undefined,
  totalCount: undefined
})

defineEmits<{
  /**
   * The user asked for more. Fired once per activation — the caller increments
   * its own `visible` ref in response. Carries no payload: how much "more" is
   * is the caller's decision, not this component's.
   */
  (e: 'load'): void
}>()

/**
 * The announcement, or `''` for "announce nothing".
 *
 * Both counts or neither — a half-supplied pair would have to render *"Showing
 * 48 of undefined items"* or silently invent the missing half, and both are
 * worse than the spec's stated default of saying nothing. `Number.isFinite`
 * rather than a truthiness test, so a legitimate `visibleCount` of `0` (an
 * empty first page) still announces.
 */
const announcement = computed<string>(() => {
  const shown = props.visibleCount
  const total = props.totalCount
  if (!Number.isFinite(shown) || !Number.isFinite(total)) return ''
  return `Showing ${shown} of ${total} items`
})
</script>

<template>
  <!--
    Present when there is a button to draw, or a count to keep announcing after
    the button has gone. Absent — no element whatsoever — when neither is true,
    which is the spec's "not even an empty wrapper" case.
  -->
  <div
    v-if="hasMore || announcement"
    class="bf-load-more"
    :data-has-more="hasMore || undefined"
    v-bind="$attrs"
  >
    <bfButton
      v-if="hasMore"
      class="bf-load-more__button"
      :disabled="loading"
      @click="$emit('load')"
    >
      {{ label }}
    </bfButton>

    <!--
      `role="status"` and the two explicit ARIA attributes say the same thing
      three ways on purpose. `role="status"` implies `aria-live="polite"` and
      `aria-atomic="true"`, but the implication is resolved by the AT's own role
      mapping, and enough shipping combinations mis-handle a role-implied live
      region that the redundant attributes are the standard belt-and-braces
      here. `aria-atomic` is the load-bearing one: the whole sentence must be
      re-read on every change, not just the digits that differ.

      Rendered independently of `hasMore` (see the block comment above), so the
      final "Showing 354 of 354 items" is announced rather than removed.

      `visually-hidden` is the shared utility in `public/css/utils/utils.css`
      (gh#219), not a scoped rule: this component hand-rolled the clip until the
      accessibility epic needed the same twelve lines in four more live regions.
      It is a global class, so `scoped` does not rewrite it and the SFC's own
      `<style>` no longer says anything about how this span is hidden. The BEM
      class stays as the hook a harness or a later rule addresses.
    -->
    <span
      v-if="announcement"
      class="bf-load-more__status visually-hidden"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >{{ announcement }}</span>
  </div>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet — see the note in
  `Button.vue`; `postcss-preset-env`'s cascade-layer polyfill would otherwise
  flatten this into unlayered rules that outrank every layer (gh#101). Probe 32
  reads the live CSSOM for this rule's layer membership.
*/
@layer components {
  /*
    The wrapper is a layout box and nothing else: no ground, no border, no
    colour, no spacing of its own. Spacing between this and the grid above it
    belongs to the caller's `.stack`, not to a control that would then carry its
    margin into every context it is dropped into.
  */
  .bf-load-more {
    display: block;
  }

  /*
    `.bf-load-more__status` is deliberately not styled here. The clip that hides
    it moved to the shared `.visually-hidden` utility in
    `public/css/utils/utils.css` (gh#219), which the template now applies
    alongside the BEM class. That utility sits in `@layer utils`, after this
    layer in the order `styles.css` declares, so it also outranks anything a
    later rule in here might lay on the same element.
  */
}
</style>
