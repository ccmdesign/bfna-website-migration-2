<script setup lang="ts">
/**
 * `bfFilterBar` — the facet chip row (issue 30 / gh#39).
 *
 * Four hand-rolled call sites collapse into this one component, and the point
 * of the exercise is **deletion**. The frozen `search.vue` writes the selected
 * state as an inline `:style` string — `background:#222;color:#fff` — once for
 * the programme facet and again, verbatim, for the format facet;
 * `insights/index.vue` writes a third, different mechanism (`wf-chip :to
 * :active`, selection via route query); `projects/[slug].vue` writes a fourth
 * shape that is not a filter at all. None of that is re-implemented here.
 * `bfChip[toggle]` (gh#25, hardened by gh#117) already owns the selected
 * paint, the non-colour cue and `aria-pressed`, so this file contains **no
 * chip styling and no `:style` binding of any kind** — the spec's acceptance
 * greps for exactly that.
 *
 * What is left is the two things a chip cannot know about, because both are
 * properties of the *set*:
 *
 * 1. **Group semantics** — `role="group"` with an accessible name, so the
 *    facets are announced as one named group rather than as a run of loose
 *    buttons. Not `role="radiogroup"`, and not `role="toolbar"`: this is
 *    multi-select (a radiogroup is single-select and would mis-announce every
 *    chip as a radio), and a toolbar implies a collection of *different*
 *    controls. `role="group"` + `aria-pressed` per chip is what a set of
 *    independent toggle buttons actually is.
 * 2. **Arrow-key movement** — Left/Up and Right/Down step between chips, Home
 *    and End jump to the ends. An *addition* to the tab order, not a
 *    replacement for it. See below for the pattern that was removed and why.
 *
 * Presentational-only (BRIEF D8): props in, one event out. No data access, no
 * store, no composable that reads content. Applying the filters to data is the
 * page's job (issues 49, 54, 55) — this component tracks selection and says so.
 *
 * The frozen files stay exactly as they are (BRIEF D2): nothing here edits
 * them, imports from them, or reuses their class.
 *
 * ## Every chip is a tab stop — the roving tabindex was removed (gh#228)
 *
 * This component used to write a roving tabindex: one `tabindex="0"` per group
 * and `-1` on every other chip, so seven chips across two facet rows cost a
 * keyboard user two tab stops instead of seven. The reasoning was sound about
 * tab stops and wrong about ARIA.
 *
 * A roving tabindex is a **composite-widget** pattern. ARIA APG scopes it to
 * the roles that declare one — `toolbar`, `radiogroup`, `listbox`, `grid`,
 * `menubar`, `tablist`, `tree` — because the role is the contract that tells
 * assistive technology "Tab enters this thing once; the arrows move inside
 * it". On a plain `role="group"` there is no such contract: six of the seven
 * chips were simply out of the tab order, and the arrow keys that were meant
 * to replace Tab were undiscoverable. Measured on `/insights` before the fix:
 * `tabindex` `0/-1/-1/-1` per group, container `role="group"`.
 *
 * gh#228 (a11y epic D30) offered two ways out — name the pattern
 * `role="toolbar"`, or drop the pattern. **Dropping it is the one taken**, for
 * three reasons:
 *
 * 1. This file had already rejected `toolbar`, with a reason, in the paragraph
 *    above about group semantics: a toolbar implies a collection of different
 *    controls, and this is a homogeneous multi-select set of toggle buttons.
 *    Overturning a written decision in order to keep a mechanism is a worse
 *    trade than dropping the mechanism and letting the correct role stand.
 * 2. `role="group"` + `aria-pressed` + a native `<button>` in the document tab
 *    order needs no ARIA composite contract at all — D30's "native first".
 * 3. Both mechanisms now reach every chip: Tab because nothing is `-1` any
 *    more, arrows because the handler below survived unchanged.
 *
 * The cost is the five extra tab stops the old comment worried about. That is
 * the right cost to pay for a facet row that is the primary interaction of the
 * page it sits on, and for a control set the previous pattern made unreachable
 * by the only key that discovers a control.
 *
 * ## The arrow keys, which stay
 *
 * Left/Up to the previous chip, Right/Down to the next, both wrapping, plus
 * Home and End. They are now an enhancement *over* the tab order rather than a
 * substitute *for* it.
 *
 * Home/End are not in the spec's text. They are in the pattern the spec names,
 * they cost two `case` labels, and a user who has learnt arrows on a group
 * expects them; recorded in the spec's Decisions rather than taken silently.
 *
 * `ArrowRight` = "next" is a **writing-mode assumption**, not a truth: in RTL
 * the visual next chip is to the left. Every route in this epic is LTR, so the
 * assumption is taken deliberately and left visible here rather than hidden
 * behind a `dir` read that nothing would exercise.
 *
 * `preventDefault()` fires only for keys this component actually consumed, so
 * page scrolling on Up/Down survives everywhere else — including on a chip,
 * for any key not in the switch.
 *
 * ## `focusedIndex`
 *
 * `focusedIndex` is set by the chips' own `focus` events (so pointer focus and
 * keyboard focus land in the same place) and read by nothing that renders —
 * with the roving tabindex gone it feeds only `focusChip`, which writes it
 * back. Nothing in the DOM derives from it, so a stale value from a `filters`
 * array that has since been replaced cannot reach the page; `chipElements()`
 * is read fresh on every keypress and `focusChip` bails on a missing index.
 *
 * ## The emitted array
 *
 * Toggling emits a **new** array — `filter` for removal, spread-and-append for
 * addition — so the prop array is never mutated in place. Two consequences the
 * probe checks by identity: a consumer holding the previous array still holds
 * the previous selection, and a `v-model` whose parent re-renders sees a
 * genuinely changed reference.
 *
 * Addition appends to the caller's order rather than re-deriving the array
 * from `filters`. Re-deriving would look tidier and would silently **drop**
 * any selected key that is not currently in `filters` — which is exactly what
 * happens on a page whose facet list narrows with the query. The vocabulary
 * belongs to the page; this component adds and removes one key at a time and
 * disturbs nothing else.
 *
 * The chip is driven **controlled** (`:model-value` is always bound), so its
 * own uncontrolled fallback (gh#117 / #111) is never engaged and the array is
 * the single source of truth. The boolean the chip emits is used as-is rather
 * than recomputed from the array, so the two can never disagree about which
 * direction one click went in.
 *
 * ## Styling
 *
 * One hook, `--_bf-filter-bar-gap`, chaining *through* the composition layer's
 * `--_cluster-space` rather than around it — the `bfByline` lesson (gh#38).
 * A flat `gap: var(--space-xs)` in `@layer components` would outrank
 * `.cluster[data-gap]` in `@layer composition` and quietly make the documented
 * `data-gap` API inert on this component. No colour, no chip metric, nothing
 * that belongs to `bfChip`.
 */
import type { Filter, FilterBarProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfFilterBar' })

const props = withDefaults(defineProps<FilterBarProps>(), {
  label: 'Filters'
})

const emit = defineEmits<{
  /** The full new selection, as a new array. Never the mutated prop. */
  'update:modelValue': [value: Array<Filter['key']>]
}>()

/** The group's own element, and the only place chips are looked up from. */
const root = ref<HTMLElement | null>(null)

/**
 * The last chip to hold focus, or `null` before the group has been entered.
 *
 * Written from the chips' `focus` listener rather than only from the arrow
 * handler, so that pointer focus and keyboard focus agree about where the
 * group currently is. Nothing renders from it (gh#228 removed the roving
 * `tabindex` that did), so it cannot put a stale index into the DOM.
 */
const focusedIndex = ref<number | null>(null)

const isSelected = (key: Filter['key']): boolean => props.modelValue.includes(key)

/**
 * The chip elements, in DOM order.
 *
 * Read from the DOM through this component's **own** marker attribute rather
 * than through `bfChip`'s internals: `data-filter-key` is written by the
 * template below and falls through to whatever element the chip rendered, so
 * moving focus does not depend on the chip's class name, its tag, or which of
 * its four branches it took. A template-ref array would work equally well and
 * would need every entry typed as a component instance to reach `$el`.
 */
const chipElements = (): HTMLElement[] =>
  Array.from(root.value?.querySelectorAll<HTMLElement>('[data-filter-key]') ?? [])

const focusChip = (index: number): void => {
  const chip = chipElements()[index]
  if (!chip) return
  focusedIndex.value = index
  chip.focus()
}

const onToggle = (key: Filter['key'], next: boolean): void => {
  emit(
    'update:modelValue',
    next
      ? (isSelected(key) ? [...props.modelValue] : [...props.modelValue, key])
      : props.modelValue.filter(k => k !== key)
  )
}

const onKeydown = (event: KeyboardEvent, index: number): void => {
  const count = props.filters.length
  if (count === 0) return

  /*
   * A modified arrow is somebody else's shortcut, not ours (review finding
   * gh#39-P2-1). `Cmd`+`←` is Back on macOS, `Alt`+`←` is Back on Windows and
   * Linux, and `Ctrl`+`Home`/`End` jump to the ends of the document — all of
   * which this handler would otherwise intercept *and* `preventDefault`,
   * silently breaking a browser-level binding in exchange for moving focus one
   * chip. Bail before the switch, so the event reaches the page untouched.
   */
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return

  let target: number
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      target = (index + 1) % count
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      target = (index - 1 + count) % count
      break
    case 'Home':
      target = 0
      break
    case 'End':
      target = count - 1
      break
    default:
      /* Not ours — Space and Enter are the chip's own activation, and every
         other key belongs to the page. */
      return
  }

  event.preventDefault()
  focusChip(target)
}
</script>

<template>
  <!--
    `role="group"` — and, since gh#228, a role that matches the tab order it
    describes. There is no roving `tabindex` under it any more, so `group` is
    not standing in for a composite role it never had: it is a named set of
    independent toggle buttons, each one an ordinary tab stop, which is what
    `group` means.

    `role="group"` on a plain `div`, per the spec, rather than a `<fieldset>`:
    a fieldset's accessible name comes from a `<legend>` it must contain, which
    would put a visible caption inside the row that every call site then has to
    style away, and it carries form-control semantics this group does not want.
    A `div[role=group][aria-label]` is the same node in the accessibility tree
    with none of that.

    `$attrs` falls through here (single root, `inheritAttrs` left on), so a
    consumer's `class`, `data-gap`, `id` or `aria-labelledby` all land on the
    group. `aria-labelledby` from a consumer wins over this `aria-label` by the
    ARIA name-computation order, which is how a call site points at a visible
    heading instead of repeating it.
  -->
  <div
    ref="root"
    class="bf-filter-bar cluster"
    data-gap="xs"
    role="group"
    :aria-label="label"
  >
    <!--
      One chip per filter, driven controlled. `data-filter-key` is this
      component's own focus hook (see `chipElements`).

      **No `tabindex` binding** (gh#228). Every chip is a native `<button>` and
      therefore already a tab stop; writing `-1` on all but one made six of the
      seven chips on `/insights` unreachable by Tab under a `role="group"` that
      promises no such thing. Leaving the attribute off entirely is the fix —
      not `tabindex="0"`, which would be the same statement said twice and
      would start mattering the day a chip renders as something other than a
      button.

      No `:style`, no `:class`, no `active` prop: the selected state is
      `bfChip`'s `[data-active]` rule, reached through `model-value` alone.
    -->
    <bfChip
      v-for="(filter, index) in filters"
      :key="filter.key"
      toggle
      :model-value="isSelected(filter.key)"
      :data-filter-key="filter.key"
      @update:model-value="(next: boolean) => onToggle(filter.key, next)"
      @keydown="(event: KeyboardEvent) => onKeydown(event, index)"
      @focus="focusedIndex = index"
    >
      {{ filter.label }}
    </bfChip>
  </div>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet — see `Button.vue`
  for the history: `postcss-preset-env`'s cascade-layers polyfill used to
  flatten these blocks into unlayered rules that then outranked every layer.
  The feature is off in `nuxt.config.ts`; the probe reads the live CSSOM, so a
  regression fails loudly.

  No negation pseudo-class anywhere in this file (D-20.5 / gh#29):
  `postcss-preset-env` mis-lowers a `:not()` containing a complex selector and
  silently breaks the rule. Nothing here needs one.

  No colour and no chip metric. Every paint in this row belongs to `bfChip`,
  which is the entire reason this component exists.
*/
@layer components {
  .bf-filter-bar {
    /*
      The spec's hook, chaining *through* the composition layer rather than
      around it (the `bfByline` lesson, gh#38).

      A flat `--_bf-filter-bar-gap: var(--space-xs)` would work and would be a
      trap: `@layer components` outranks `@layer composition`, so this rule
      would beat `.cluster[data-gap="…"]` and quietly make `data-gap` inert on
      this component — including the `data-gap="xs"` in this file's own
      template. Reading `--_cluster-space` as the default keeps both routes
      open: `data-gap`/`data-space` from a consumer flows through the
      composition layer into this hook, and a consumer who sets
      `--_bf-filter-bar-gap` directly still overrides it. The `var(--space-xs)`
      fallback covers the case where no gap attribute is present at all — which
      is the spec's stated default.
    */
    --_bf-filter-bar-gap: var(--_cluster-space, var(--space-xs));

    gap: var(--_bf-filter-bar-gap);
  }
}
</style>
