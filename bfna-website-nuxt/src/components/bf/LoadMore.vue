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
 * The element and the label shape are both the wireframe's, kept: a real
 * `<button>`, labelled with the caller's own remainder arithmetic. The
 * *removal* was kept too, until gh#225 measured what it costs a keyboard user
 * and replaced it with an inert-but-focusable control — see the `aria-disabled`
 * section below.
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
 * | **both** counts | the button is present but inert; the region persists with the final count. |
 *
 * The persisting region is `position: absolute` and clipped to a 1px box, so it
 * occupies no space, paints no pixel and moves no layout — "renders nothing"
 * holds visually and in layout in the first row. Probe 32 measures the
 * wrapper's footprint at `hasMore=false` rather than taking that on trust.
 *
 * ## `aria-disabled`, not `disabled` — gh#225
 *
 * This section previously argued the opposite, and the reversal is the whole of
 * gh#225, so the original reasoning is kept rather than overwritten.
 *
 * It said: `loading` renders the button `disabled`, `bfButton`'s only genuinely
 * non-interactive branch; the known cost is that a focused button which becomes
 * `disabled` drops focus to `<body>`; that cost is accepted because
 * `aria-disabled` leaves an element still activated by Enter — a control that
 * lies about being unavailable — and because the one shipping consumer
 * (issue 49) slices a static array synchronously and never sets `loading`.
 *
 * Two of those three premises did not survive the accessibility audit:
 *
 * 1. **The cost was being paid anyway, by the other branch.** `v-if="hasMore"`
 *    is the same mechanism as `disabled` — it removes the focused element from
 *    play — and it fires on a path the epic very much ships. Measured on
 *    `/insights`: four "Load more" clicks, and on the fourth `hasMore` goes
 *    false, the button unmounts under the user's finger and
 *    `document.activeElement === document.body`. WCAG 2.4.3. A keyboard user's
 *    next Tab restarts at the top of the document.
 * 2. **"Still activated by Enter" is a property of a bare `aria-disabled`, not
 *    of the attribute.** It describes an element whose handler was left live.
 *    Guard the handler and the control is genuinely inert: `onActivate` below
 *    returns without emitting on every input path — pointer, Enter and Space
 *    alike, because all three arrive as one `click`.
 *
 * So the inert state is now spelled `aria-disabled="true"` with a guarded
 * handler, and the button is no longer removed when `hasMore` goes false: it is
 * mounted for exactly as long as this component renders anything at all, and
 * focus resting on it survives both transitions. That is the ARIA APG's own
 * rule for a control whose removal would strand focus, and it fixes `loading`
 * and exhaustion with one mechanism instead of leaving the first for later.
 *
 * What did **not** change: the "renders literally nothing" row of the table
 * above. The button's presence is tied to the wrapper's `v-if`, not given one
 * of its own, so a caller that supplies neither count still gets no element
 * whatsoever once `hasMore` is false.
 *
 * A caller that genuinely fetches may still want to move focus once the load
 * resolves — to the first appended row, say. Nothing here prevents that; what
 * is guaranteed is that this component will not drop focus on the floor first.
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

const emit = defineEmits<{
  /**
   * The user asked for more. Fired once per activation — the caller increments
   * its own `visible` ref in response. Carries no payload: how much "more" is
   * is the caller's decision, not this component's.
   */
  (e: 'load'): void
}>()

/**
 * Is the control unavailable right now?
 *
 * Two reasons, one state: there is nothing left to load, or a load is already
 * in flight. Both used to remove the button from play — one by unmounting it,
 * one by setting `disabled` — and both therefore dropped focus to `<body>`
 * (gh#225). They now render the same unavailable-but-focusable control.
 *
 * Named for `aria-disabled`, not `inert`. HTML's `inert` attribute is the one
 * thing this state must **not** do — it removes the subtree from the tab order,
 * which is the defect, not the fix — so borrowing its name for the flag that
 * keeps the button focusable would be actively misleading.
 */
const unavailable = computed<boolean>(() => !props.hasMore || props.loading)

/**
 * The guard that makes `aria-disabled` honest.
 *
 * `aria-disabled` is an announcement, not a behaviour: the element stays
 * clickable and stays activated by Enter and Space. Swallowing the activation
 * here is what turns it into a real unavailability, and it covers every input
 * path at once because a keyboard activation of a `<button>` arrives as a
 * `click` too.
 */
const onActivate = (): void => {
  if (unavailable.value) return
  emit('load')
}

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

/**
 * The status region's id, so the button can point `aria-describedby` at it.
 *
 * Without this, a screen reader landing on the now-persistent control at
 * `hasMore=false` hears *"Load more (0 remaining), unavailable"* and is told
 * nothing about why — the sentence that explains it is a sibling node it has to
 * find on its own. Describing the button by the region reads the count out with
 * it. No new copy is invented: the string already exists and is already correct.
 *
 * Nuxt's SSR-stable `useId()`, the idiom at `FormField.vue:119` and
 * `Section.vue:167` (D27) — not a counter and not `crypto.randomUUID()`, both
 * of which produce a different id on the server and the client and break the
 * reference on hydration.
 */
const statusId = useId()
</script>

<template>
  <!--
    Present when there is a button to draw — live or inert — or a count to keep
    announcing. Absent, no element whatsoever, when neither is true, which is
    the spec's "not even an empty wrapper" case. Since gh#225 this condition is
    the button's too: it has no `v-if` of its own.
  -->
  <div
    v-if="hasMore || announcement"
    class="bf-load-more"
    :data-has-more="hasMore || undefined"
    v-bind="$attrs"
  >
    <!--
      No `v-if` of its own (gh#225). The button is mounted for exactly as long
      as this component renders anything at all, so the transition that used to
      unmount it under a user's finger — `hasMore` going false on the last load
      — no longer removes the focused element. The spec's "not even an empty
      wrapper" case is still honoured, because the wrapper above still carries
      the condition and this button lives inside it.

      `aria-disabled` rather than `:disabled`: a native `disabled` on the
      element that currently has focus blurs it to `<body>`, which is the same
      defect this row exists to remove, one step later. `aria-disabled` leaves
      the control focusable and in the tab order; `onActivate` is what makes it
      genuinely do nothing. `|| undefined` so the attribute is absent rather
      than `"false"` while the control is live — the `[data-external]` idiom
      `bfButton` itself uses.

      `aria-describedby` names the status region below, so the count is read
      with the control instead of the reader being left to wonder why a "Load
      more" button is unavailable. Dropped along with the region when there is
      no announcement: a dangling IDREF describes nothing and some readers
      announce the failure.
    -->
    <bfButton
      class="bf-load-more__button"
      :aria-disabled="unavailable || undefined"
      :aria-describedby="announcement ? statusId : undefined"
      @click="onActivate"
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
      :id="statusId"
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
