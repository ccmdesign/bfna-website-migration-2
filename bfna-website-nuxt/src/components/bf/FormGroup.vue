<script setup lang="ts">
/**
 * `bfFormGroup` — a named group of form controls: `<fieldset>` + `<legend>`,
 * stacked.
 *
 * Built and demoed together with `bfFormField` (BRIEF §5 rule 5's named
 * exception). This is the smaller half of the pair by a wide margin — one
 * prop, one slot, no state, no events — and that is the point: everything a
 * group of controls needs is already in the two elements, so the component's
 * job is to use them and get out of the way.
 *
 * ## Why the native elements, and not `role="group"`
 *
 * `<fieldset>`/`<legend>` is the only native construct that gives a set of
 * controls a group name in the accessibility tree. The usual replacement —
 * `<div role="group" aria-labelledby="…">` — needs an id, a reference, and a
 * heading element that is not a heading, and it reproduces at best what two
 * elements already do at no cost. `bfAccordion` made the same call about
 * `<details>`/`<summary>`, for the same reason.
 *
 * `legend` is required (see `FormGroupProps`): a `<fieldset>` with no
 * `<legend>` is a group boundary a screen reader announces and cannot name,
 * which is worse than no group at all.
 *
 * ## What is deliberately absent
 *
 * | Not here | Why |
 * |---|---|
 * | `<form>`, `@submit`, an action | Spec § Out of scope. A group is not a form; issue 44's organism owns the form element. |
 * | A `gap` prop | Spacing is `data-gap`, the composition layer's own documented API (D9). A prop would be a second way to say the same thing, and the two would disagree. |
 * | `disabled` | The `<fieldset disabled>` attribute is real and useful, and it arrives through `$attrs` already — a prop would only re-declare it. |
 * | A heading | The `<legend>` *is* the group's name. An `h2` alongside it would name the group twice. |
 *
 * Presentational-only (D8): one prop in, nothing out, no data access. One
 * root, so `inheritAttrs` is left at its default — a consumer's `class`,
 * `style`, `data-gap`, `disabled` or `aria-*` all land on the `<fieldset>`,
 * which is the element a consumer would want to reach.
 */
import type { FormGroupProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfFormGroup' })

defineProps<FormGroupProps>()
</script>

<template>
  <!--
    `.bf-form-group | stack` — the CUBE convention: block class, pipe,
    composition class.

    `data-gap="s"` is written explicitly. `s` is what `.stack`'s
    `--_stack-space` already defaults to, so the rendered gap is unchanged and
    the value is now *declared* rather than inherited by accident — the
    `bfEmptyState` reasoning (gh#42), and D9's point about `data-gap` being
    honoured on every primitive. `$attrs` is merged after the template's own
    attributes, so a consumer passing `data-gap="m"` overrides this default
    rather than being overridden by it.
  -->
  <fieldset class="bf-form-group | stack" data-gap="s">
    <legend class="bf-form-group__legend">{{ legend }}</legend>
    <slot />
  </fieldset>
</template>

<!--
  Deliberately **unscoped**, the `bfCard` precedent (gh#41) and for exactly its
  reason.

  Slot content is compiled in the *parent's* scope and carries the parent's
  `data-v-…` id, never this component's. The gap rule below targets the
  fieldset's children — which are, in every real use, the `bfFormField`s the
  caller passed in. A `scoped` block would emit
  `.bf-form-group > * + *[data-v-formgroup]`, a selector that cannot match any
  of them, and the component would ship with a gap hook that silently did
  nothing.

  (`:slotted()` reaches direct slot children and these *are* direct slot
  children, so it would work today. It is not used because it takes a compound
  selector, and the rule that needs scoping is an adjacent-sibling one —
  `:slotted(* + *)` is not a selector. Every rule here is already
  `.bf-form-group`-prefixed, so global costs nothing.)

  `@layer components` must survive into the built stylesheet — see the note in
  `Button.vue`. No `:not()` anywhere (D-20.5, gh#29). Probe 34 reads the live
  CSSOM for both.
-->
<style>
@layer components {
  .bf-form-group {
    /*
      The gap hook, and it chains **through** the composition layer rather than
      around it — the `bfByline` (gh#29) and `bfFilterBar` (gh#30) lesson,
      restated for `.stack`.

      A flat `--_bf-form-group-gap: var(--space-s)` consumed by the rule below
      would work and would be a trap: `@layer components` outranks
      `@layer composition` wholesale, so this rule would beat
      `.stack[data-gap="…"]` and quietly make `data-gap` inert on this
      component — including the `data-gap="s"` in this file's own template. The
      next caller who reached for the documented composition API would find it
      does nothing, with no error to explain why.

      Reading `--_stack-space` as the default keeps both routes open:
      `data-gap`/`data-space` from a consumer flows through the composition
      layer into this hook, and a consumer who sets `--_bf-form-group-gap`
      directly still overrides it. The `var(--space-s)` fallback covers the
      case where no gap attribute is present at all.

      Declared in the rule, not bound inline through a `cssVars` computed — the
      `bfMedia` lesson from gh#26. A component that writes its own custom
      properties inline on every instance is no more overridable than one that
      writes flat declarations inline, because an ordinary consumer rule cannot
      outrank an inline style. This component emits no inline `style` at all.
    */
    --_bf-form-group-gap: var(--_stack-space, var(--space-s));
  }

  /*
    The stack's own mechanism, restated so the hook governs it.

    `.stack` spaces its children with `margin-block-start` on `* + *`, not with
    `gap` — so a `gap` declaration here would ADD to the margin rather than
    replace it, and every group would space at twice its stated value. This
    rule targets the same adjacent-sibling combinator, in a later layer, so it
    replaces the composition layer's margin rather than compounding it.

    `> * + *` also means the `<legend>` — always the first child — never
    receives a top margin, which is correct in every engine: a rendered
    `<legend>` is drawn in the fieldset's border and is not a flex item, so a
    margin on it would be laid out in a box that is not part of the column.
  */
  .bf-form-group > * + * {
    margin-block-start: var(--_bf-form-group-gap);
  }

  /*
    `.bf-form-group__legend` deliberately has **no rule here**.

    `base/forms.css` already sets the legend's size, weight, colour and inline
    padding in `@layer defaults`, and every one of those is the value this
    component wants. Restating them would be a second declaration of the same
    intent, which drifts the first time either copy changes — the same argument
    the empty-rule temptation always loses to. The class is on the element so a
    consumer and the probe can address it, which is a job a class does without
    any declarations at all.
  */
}
</style>
