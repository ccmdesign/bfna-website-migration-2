<script setup lang="ts">
/**
 * `bfFormField` — one labelled form control, with a hint, an error, and the
 * three id references that tie them together.
 *
 * Built and demoed together with `bfFormGroup` (BRIEF §5 rule 5 names this
 * pair, and only three others, as a permitted bundle): the field is what the
 * group groups, and a group with nothing in it demonstrates nothing.
 *
 * ## What it builds from
 *
 * The three hand-rolled idioms in `src/components/wireframe/wfContactSection.vue:8-10`
 * (frozen, D2 — read for parity, never edited):
 *
 * ```html
 * <label class="stack" data-gap="2xs">Name<input type="text"></label>
 * <label class="stack" data-gap="2xs">Email<input type="email"></label>
 * <label class="stack" data-gap="2xs">Message<textarea rows="4" /></label>
 * ```
 *
 * Three near-identical blocks. The wireframe is right about the *elements* and
 * right about the stacked label-over-control layout; this component keeps both
 * and changes exactly one thing about the structure, plus adds the two slots
 * the wireframe had no room for.
 *
 * ## The one structural change: explicit association
 *
 * The wireframe wraps the control **inside** the label, which is valid HTML and
 * is a real association — implicit labelling. It is replaced here by an
 * explicit `for`/`id` pair, for three reasons that are all about what comes
 * next rather than about what is there today:
 *
 * 1. **A hint and an error have nowhere to live inside a label.** Text inside
 *    `<label>` is part of the control's accessible *name*. A hint concatenated
 *    into the name reads as *"Email We never share this"*; an error
 *    concatenated into it reads as *"Email Enter a valid email address"* — and
 *    the name is announced on every focus, so the error is repeated for ever
 *    rather than described once. `aria-describedby` is the property for
 *    supporting text, and it needs ids, which needs the control out of the
 *    label.
 * 2. **Implicit association is the arrangement that silently breaks.** It holds
 *    only while the control is a descendant. The moment anything wraps the
 *    control — a prefix/suffix row, a character counter, a clear button — the
 *    label still *looks* right and no longer names anything. An explicit `for`
 *    survives any amount of markup between the two.
 * 3. **A `<legend>` plus an implicit label is ambiguous** about which text is
 *    the group's and which is the field's, in exactly the composition
 *    `bfFormGroup` exists to make.
 *
 * ## Ids
 *
 * One `useId()` call, three derived ids. Nuxt's `useId()` — not Vue's raw
 * counter — because it is stable across the server render and the client
 * hydration; an id that changes between the two would break the `for`/`id`
 * pair on exactly the pass where a screen reader is already reading the page.
 *
 * The hint and error ids are **derived from** the base rather than obtained
 * from two further `useId()` calls: they must be predictable from the control's
 * own id for `aria-describedby` to be composed in one expression, and three ids
 * from one source cannot drift apart.
 *
 * ## What is deliberately absent
 *
 * | Not here | Why |
 * |---|---|
 * | Validation | Spec § Out of scope. `error` is a caller-supplied string. Nothing here inspects `modelValue`, and nothing reads `:invalid` — so a field the caller has not judged never turns red on its own, which is the behaviour a required-but-untouched field needs. |
 * | `<form>`, `@submit`, a submit button | Spec § Out of scope — issue 44's organism owns the form element and what happens on submit. |
 * | Internal value state | Presentational-only (D8). `modelValue` in, `update:modelValue` out; the caller owns the string. |
 * | `checkbox` / `radio` | Their value is a `checked` boolean, not a string. They do not fit this contract, and the wireframe has neither. |
 * | A `rows` prop | The wireframe writes `rows="4"`; that arrives through `$attrs` and lands on the control, so it needs no prop of its own. |
 *
 * ## `$attrs` goes to the control, not to the root
 *
 * `inheritAttrs: false`, and `$attrs` minus `class`/`style` (`controlAttrs`) on
 * the `<input>`/`<textarea>`.
 * The root here is a layout wrapper the caller has no reason to address, and
 * every attribute a caller would actually pass to a form field —
 * `autocomplete`, `placeholder`, `rows`, `maxlength`, `inputmode`, `name`,
 * `disabled` — belongs on the control. `class` and `style` are the exception
 * and are bound to the root by hand, because that is where a caller's layout
 * class means something. This is the `bfButton`/`bfLoadMore` split, applied to
 * a component whose interesting element is not its root.
 */
import type { FormFieldProps } from '~/types/bf-contracts'

defineOptions({
  name: 'BfFormField',
  /*
   * Bound by hand below — `$attrs` to the control, `class`/`style` to the root.
   * See the block comment above for why the split falls that way.
   */
  inheritAttrs: false
})

const props = withDefaults(defineProps<FormFieldProps>(), {
  type: 'text',
  required: false,
  hint: undefined,
  error: undefined
})

defineEmits<{
  /**
   * The user typed. Fired on every `input` event, carrying the control's whole
   * value — so `v-model` works, and so a caller that wants debouncing does the
   * debouncing, which is a decision this component has no basis to make.
   */
  (e: 'update:modelValue', value: string): void
}>()

/**
 * The control's id, and the root of the other two.
 *
 * Nuxt's SSR-stable `useId()`. Auto-imported; not `crypto.randomUUID()` and not
 * a module-level counter, both of which produce a different value on the client
 * than the server wrote and so break hydration and the `for`/`id` pair at once.
 */
const id = useId()

/** `undefined` when there is no hint — so nothing renders, and nothing is referenced. */
const hintId = computed(() => (props.hint ? `${id}-hint` : undefined))

/** Likewise for the error. Its presence is also what sets `aria-invalid`. */
const errorId = computed(() => (props.error ? `${id}-error` : undefined))

/**
 * The `aria-describedby` value: the hint id, the error id, both, or nothing.
 *
 * Both when both are present — space-separated, per the ARIA spec, and **hint
 * first**, because that is reading order on the page and `aria-describedby` is
 * announced in the order it is written. This is the half of the attribute that
 * is most often shipped wrong: an implementation that treats hint and error as
 * alternatives (`error ? errorId : hintId`) silently drops the hint from the
 * accessible description at precisely the moment a user is failing to fill the
 * field in and needs it most.
 *
 * `undefined` rather than `''` when neither exists. An empty
 * `aria-describedby=""` is not the same as no attribute: it is a reference to
 * nothing, which some assistive technology reports as a broken relationship
 * rather than as an absent one.
 */
const describedBy = computed(() => {
  const ids = [hintId.value, errorId.value].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
})

/**
 * `'true'` or nothing. Never `'false'`: the spec asks for the attribute only
 * when there is an error, and `aria-invalid="false"` on every valid field is
 * noise that also makes the attribute's absence stop meaning anything.
 */
const invalid = computed(() => (props.error ? 'true' : undefined))

/** One branch, read once in the template and once by the probe. */
const isTextarea = computed(() => props.type === 'textarea')

const attrs = useAttrs()

/**
 * Everything a caller passed **except** `class` and `style`, for the control.
 *
 * The split has to be made explicitly. `$attrs` includes `class` and `style`,
 * so spreading it on the control *and* binding `$attrs.class` on the root
 * would put the caller's class on both elements — the layout class would then
 * also be applied to the `<input>`, where a `.stack` or a margin utility does
 * something visibly wrong. Removed here, once, rather than guarded at each of
 * the two call sites.
 */
const controlAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

/**
 * Widen the event's target to the two elements that can fire it here. Both
 * carry `value: string`, so one handler serves both branches without a cast
 * per call site.
 */
const valueOf = (event: Event): string =>
  (event.target as HTMLInputElement | HTMLTextAreaElement).value
</script>

<template>
  <!--
    `.bf-form-field | stack` with `data-gap="2xs"` — the wireframe's own
    composition and its own value, kept verbatim: `wfContactSection.vue` writes
    `class="stack" data-gap="2xs"` on each of its three labels, so label,
    control, hint and error stack at the same rhythm the prototype validated.

    `class`/`style` fall here, everything else falls on the control. `$attrs`
    is NOT spread on this element: `v-bind="$attrs"` here plus `inheritAttrs:
    false` would put `placeholder` and `autocomplete` on a `<div>`, where they
    are inert and invisible rather than obviously wrong.
  -->
  <div
    class="bf-form-field | stack"
    data-gap="2xs"
    :class="$attrs.class"
    :style="($attrs.style as string | undefined)"
  >
    <label class="bf-form-field__label" :for="id">
      {{ label }}<!--
        No whitespace before the marker: a text node between the label and the
        `*` would be part of the accessible name, and the marker itself is
        hidden from it. The gap is drawn with `margin-inline-start` instead.

        `aria-hidden`, because `required` on the control is what actually
        reaches the accessibility tree — a screen reader already announces the
        field as required, and an asterisk read out as "star" or "asterisk" on
        top of that is a second, worse statement of the same fact.
      --><span
        v-if="required"
        class="bf-form-field__required"
        aria-hidden="true"
      >*</span>
    </label>

    <!--
      Two branches, not `<component :is>`. A `<textarea>`'s value is its text
      content, not a `value` attribute, and its SSR serialization differs
      accordingly; a dynamic tag would paper over that difference and get it
      wrong on the server. The ARIA wiring is identical on both, and that is
      the part that must not diverge — so it is written out twice rather than
      computed once and applied to a tag name that might be either.
    -->
    <textarea
      v-if="isTextarea"
      :id="id"
      v-bind="controlAttrs"
      class="bf-form-field__control"
      :value="modelValue"
      :required="required"
      :aria-describedby="describedBy"
      :aria-invalid="invalid"
      @input="$emit('update:modelValue', valueOf($event))"
    />
    <input
      v-else
      :id="id"
      v-bind="controlAttrs"
      class="bf-form-field__control"
      :type="type"
      :value="modelValue"
      :required="required"
      :aria-describedby="describedBy"
      :aria-invalid="invalid"
      @input="$emit('update:modelValue', valueOf($event))"
    >

    <!--
      Hint before error, in the DOM — which is also the order `describedBy`
      writes them in, so what a screen reader hears matches what a sighted
      reader sees. Neither renders when its string is absent: no empty `<p>`,
      and therefore no id pointing at an empty box.
    -->
    <p v-if="hint" :id="hintId" class="bf-form-field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="bf-form-field__error">{{ error }}</p>
  </div>
</template>

<style scoped>
/*
  `@layer components`, and it must survive into the built stylesheet — the note
  in `Button.vue` has the history (`postcss-preset-env`'s cascade-layers
  polyfill used to flatten these blocks into unlayered rules, which then
  outranked every layer). Probe 34 reads the live CSSOM, so a regression fails
  the run rather than shipping quietly.

  No `:not()` anywhere in this file. D-20.5 (gh#29): `postcss-preset-env`
  mis-lowers a `:not()` containing a complex selector and silently breaks the
  rule. `base/forms.css` uses `input:not([type="radio"], [type="checkbox"])`,
  which is a *simple* selector list and therefore fine — but this file has no
  need to negate anything at all, because every rule here is anchored on a
  block class.
*/
@layer components {
  .bf-form-field {
    /*
      The control's resting border. An existing semantic shade token, derived
      from `--color-base` — no new colour, no literal, and not a primitive
      (BRIEF §5 rule 2). It matches what `base/forms.css` already draws in
      `@layer defaults`, restated here as a *hook* so a caller can change it
      without reaching into the defaults layer.
    */
    --_bf-form-field-border-color: var(--color-base-tint-20);

    /*
      The error colour. `semantic-colors.css` declares
      `--color-fail: var(--color-red)` and then `--color-error: var(--color-fail)`
      — issue 06's ordering fix put the referent ahead of the alias, and both
      names survived it. `--color-error` is the semantic name for *this*
      intent and resolves to the same paint, so nothing new enters the colour
      graph (DoD-6).
    */
    --_bf-form-field-error-color: var(--color-error);

    /*
      The focus ring's colour.

      The global `:focus-visible` rule for form controls (#146) has not landed
      on `dev`, and what `base/forms.css` declares today is a `:focus` rule
      that writes `outline: none` and draws the ring with `box-shadow` alone —
      which forced-colors mode drops, leaving no focus indicator at all
      (WCAG 2.4.7). So the ring is declared here, locally, through this hook:
      the gh#24 pattern.

      `--color-text`, not `currentcolor` — the gh#24-P2-1 finding. The ring is
      painted outside the control, on the page ground; a control whose own
      colour is the light one would otherwise paint a light ring on a light
      page (WCAG 1.4.11).
    */
    --_bf-form-field-focus-color: var(--color-text);
  }

  /*
    Two selectors rather than one `.bf-form-field__control`, so the rule reads
    as what it is: the label is set down from the control's own scale, and the
    hint and error are set down again. `--size--1` and `--size--2` are the
    existing Utopia steps.
  */
  .bf-form-field__label {
    /*
      `base/forms.css` already sets `display: inline-block` on every `label` in
      `@layer defaults`. Inside a `.stack` — a flex column — an inline-block
      child is a flex item and the value is inert, but it is inert by accident.
      `display: block` states the intent instead, and keeps the label a full
      row if a caller ever takes the `.stack` off.
    */
    display: block;
    font-size: var(--size--1);
  }

  .bf-form-field__required {
    /*
      Nudged off the label text, since the two are adjacent with no whitespace
      between them (see the template comment — the whitespace would join the
      accessible name).
    */
    margin-inline-start: var(--space-3xs);
    color: var(--_bf-form-field-error-color);
  }

  .bf-form-field__control {
    /*
      The resting border, through the hook. `base/forms.css` draws the same
      thing in `@layer defaults`; restating it here is what makes
      `--_bf-form-field-border-color` a real hook rather than a variable
      nothing reads.
    */
    border-color: var(--_bf-form-field-border-color);
  }

  /*
    The invalid state, keyed on `aria-invalid` — the attribute the component
    actually sets — rather than on a `.is-error` class or on the `:invalid`
    pseudo-class.

    `:invalid` is deliberately not used: it matches a `required` field the user
    has not reached yet, so styling it would paint a form red before anyone has
    typed a character. `aria-invalid` is set only when the *caller* has
    supplied an error string, which is the same condition the message renders
    under — one source of truth for "this field is wrong", used by the styling
    and by assistive technology alike.
  */
  .bf-form-field__control[aria-invalid='true'] {
    border-color: var(--_bf-form-field-error-color);
  }

  /*
    The focus ring `base/forms.css` does not draw.

    `:focus-visible`, and the same two-ring treatment as `bfButton` (:259),
    `bfSkipLink`, `bfBreadcrumb` and `bfAccordion`: `--outline-focus` supplies
    the halo, and the real `outline` is what survives forced-colors mode, where
    `box-shadow` is dropped.

    `@layer components` outranks the `@layer defaults` rule that writes
    `outline: none`, so this genuinely replaces it rather than fighting it on
    specificity.
  */
  .bf-form-field__control:focus-visible {
    outline: var(--border-width-medium) solid var(--_bf-form-field-focus-color);
    outline-offset: var(--border-width-medium);
    box-shadow: var(--outline-focus);
  }

  .bf-form-field__hint {
    font-size: var(--size--2);
  }

  .bf-form-field__error {
    font-size: var(--size--2);
    color: var(--_bf-form-field-error-color);
  }
}
</style>
