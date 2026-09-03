<script setup lang="ts">
/**
 * `bfChip` — the one chip atom for the whole `bf-*` system.
 *
 * Evolves the wireframe chip (issue 16 / gh#25) and adds the mode it never
 * had: **toggle**. The wireframe component offers three passive branches and
 * signals "selected" with an inline style attribute on the link branch alone;
 * because there is no interactive branch to reuse, the search page hand-rolls
 * a `<button>` with the very same selected-state logic **twice in one file**,
 * once for the program facet and once for the format facet. This component
 * makes both decisions once, so `bfFilterBar` (issue 30 / gh#39) composes it
 * and re-decides nothing.
 *
 * Both frozen files stay exactly as they are (BRIEF D2): nothing here edits
 * them, imports from them, or reuses their class.
 *
 * Presentational-only (BRIEF D8): props in, one event out. No data access, no
 * store, no composable that reads content.
 *
 * ## Which element renders
 *
 * | props | element |
 * |---|---|
 * | `toggle` | `<button type="button" aria-pressed>` — **whatever else is set** |
 * | `to` | `<NuxtLink :to>` |
 * | `href` (no `to`) | `<a :href>`, plus `[data-external]` when `external` |
 * | neither | `<span>` |
 *
 * `toggle` outranking `to`/`href` is the counterpart of `bfButton`'s
 * `disabled` rule, and rests on the same reasoning. Only a real `<button>`
 * can carry the toggle contract: `NuxtLink` navigates when activated, and a
 * `<span>` is not focusable at all, so an `aria-pressed` state on either
 * would be a control that screen-reader and keyboard users are told about but
 * cannot operate. Passing `toggle` together with `to`/`href` is a caller
 * mistake rather than a case to render; it is ignored rather than warned
 * about — a presentational atom has nowhere useful to warn.
 *
 * `external` applies to the `href` branch only, matching `bfButton`:
 * `to` is an internal route by definition. The marker is emitted as
 * `[data-external]` with `|| undefined` so the attribute is absent rather
 * than `"false"` on internal links; issue 19 formalises it as a style hook.
 *
 * ## Space and Enter need no handler
 *
 * The toggle branch is a native `<button>`, and HTML's activation behaviour
 * fires a `click` event on both Space and Enter for it. One `@click` handler
 * is therefore the entire keyboard story — no `keydown` listener, no
 * `role="button"`, no `tabindex`. Re-implementing platform behaviour is
 * precisely the class of hand-rolling this component exists to delete, and
 * every such re-implementation is a chance to get the key list, the repeat
 * behaviour or the focus order wrong.
 *
 * A caller's own `click` listener is merged with the internal one rather than
 * replacing it, so both run. That holds whichever order the two appear in:
 * `mergeProps` concatenates same-named handlers into an array. (Review finding
 * gh#25-P3-10 — the conclusion was right, the mechanism as first written was
 * not; the probe now asserts both handlers fire on one activation.)
 *
 * ## Why there is no style binding here
 *
 * Unlike `bfButton`, this component sets **no** inline custom properties and
 * has no `cssVars` computed. The `--_bf-chip-*` hooks are declared with their
 * defaults in `@layer components` and re-pointed by one `.bf-chip[data-active]`
 * rule in the same layer.
 *
 * That is deliberate, and it is what the spec's acceptance asks for. BRIEF §5
 * rule 4's style-binding pattern governs **prop-derived overrides** — the
 * `variant`/`size` axes `bfButton` has. A chip has none: its only variable
 * input is a *state*, which CSS expresses natively and an inline declaration
 * expresses strictly worse, since an inline declaration cannot be outranked
 * by a consumer's rule. Expressing the selected state as a rule is the whole
 * point of the issue — it is what replaces the wireframe's inline-attribute
 * branch and the search page's two duplicates of it.
 *
 * The escape hatch survives regardless: `$attrs` falls through to whichever
 * element rendered, so a consumer can still set any hook per instance.
 *
 * Be precise about what "overridable" means here (review finding gh#25-P2-4).
 * This stylesheet is `scoped`, so the emitted selector carries a `[data-v-...]`
 * attribute and the selected rule lands at specificity (0,3,0) inside
 * `@layer components`. A consumer rule written in that same layer therefore
 * loses on both specificity and source order. What does win: a **later layer**
 * (`utils`, `overrides`), an unlayered rule, or a `style` attribute through
 * `$attrs`. The probe exercises two of those routes -- an inline style and a
 * real `@layer overrides` rule -- rather than only the easy one.
 *
 * ## Colour
 *
 * No new colour (BRIEF §5 rule 2 / DoD-6) and no primitive — every paint is a
 * semantic token that already exists. The frozen rule's literals map like
 * this:
 *
 * | | wireframe | here |
 * |---|---|---|
 * | default ground | *none* | *none* — the chip paints no ground |
 * | default label | inherited | `--color-text` |
 * | default border | 1px mid-grey | `--border-width-thin` + `--color-text` |
 * | selected ground | near-black | `--color-surface-inverse` |
 * | selected label | white | `--color-text-inverse` |
 *
 * The lo-fi mid-grey has no semantic name and no counterpart in the token
 * layer; `bfButton` mapped its own border the same way, and one consistent
 * border colour across the two atoms is worth more than matching a
 * placeholder. `--color-surface-inverse` rather than `--color-text` for the
 * selected ground is the semantic layer's own instruction — it names "the
 * ground an inverted block sits on", which is exactly what a selected chip
 * is. `--color-text-inverse` on it is ≈21:1.
 *
 * ## What the passive `active` state does not do
 *
 * On the span, link and anchor branches `active` is **presentational only**:
 * it changes the paint and emits no accessible state, so on those branches the
 * selection is conveyed by colour alone (WCAG 1.4.1 / 1.3.1). The frozen
 * component has the same gap, and this atom does not close it, because the
 * right announcement depends on what the chip means in its container --
 * `aria-current` reads as navigation, `aria-pressed` needs a button, and a
 * filter facet is neither until `bfFilterBar` (issue 30) gives it a role. The
 * **toggle** branch, which is the one this epic actually uses for filters, is
 * fully announced through `aria-pressed`. Filed as a residual against issue 30
 * rather than guessed at here (review finding gh#25-P2-3).
 *
 * ## Box metrics
 *
 * Taken from the frozen rule rather than reinvented: the same `em`-relative
 * padding, a 1px border through `--border-width-thin`, and a fully rounded
 * end through `--radius-pill`, whose value is already the frozen rule's.
 * `scripts/verify-bf-chip.ts` parses those values back out of the frozen
 * stylesheet and the probe measures a real hidden wireframe chip against a
 * rendered `bf-chip`, so no number is typed twice and drift on either side
 * fails.
 *
 * Type is the existing Utopia step nearest the frozen size. The face is
 * **inherited**, not monospace: the mono face is the wireframe's lo-fi tell,
 * the token layer has no mono family, and BRIEF D5 puts `bf-*` on the real
 * type scale.
 */
import type { ChipProps } from '~/types/bf-contracts'

defineOptions({
  name: 'BfChip',
  /*
   * A wrapper, not a base: `$attrs` is bound by hand below so it lands on
   * whichever of the four elements actually rendered, and it is bound last so
   * a caller's own attributes — including a `style` that re-points any hook —
   * win the merge.
   */
  inheritAttrs: false
})

const props = withDefaults(defineProps<ChipProps>(), {
  to: undefined,
  href: undefined,
  external: undefined,
  active: false,
  toggle: false,
  modelValue: false
})

const emit = defineEmits<{
  /** Toggle mode only: the negated `modelValue`, on click / Space / Enter. */
  'update:modelValue': [value: boolean]
}>()

/**
 * Which element this render resolves to. Exposed as `data-element` so the
 * probe can assert the branch that was taken, not just the tag that appeared.
 */
const element = computed<'toggle' | 'link' | 'anchor' | 'span'>(() => {
  if (props.toggle) return 'toggle'
  if (props.to !== undefined && props.to !== null && props.to !== '') return 'link'
  if (props.href) return 'anchor'
  return 'span'
})

/**
 * The selected state, from whichever prop owns it in this mode.
 *
 * Toggle mode reads `modelValue` (and ignores `active`); the three passive
 * modes read `active` (and ignore `modelValue`). One boolean drives both
 * `aria-pressed` and the `[data-active]` styling hook, so the accessible
 * state and the visible state cannot drift apart.
 */
const pressed = computed<boolean>(() => (props.toggle ? !!props.modelValue : !!props.active))

/**
 * `aria-pressed` is written as an explicit string rather than left to the
 * boolean-attribute serialisation. An unpressed toggle must render
 * `aria-pressed="false"` — a *present* attribute with the value `false`, which
 * is what makes it a toggle button rather than a plain one. Rendering nothing
 * would silently demote the control.
 */
const ariaPressed = computed(() => (pressed.value ? 'true' : 'false'))

const onToggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <!--
    One root per branch, so `$attrs` has exactly one destination. `class`,
    `aria-*`, `data-*`, listeners and a caller's own `style` all fall through
    to it. `data-active` is bound with `|| undefined` so the attribute is
    absent — not `"false"` — when the chip is not selected, which is what lets
    the stylesheet select on its bare presence.
  -->
  <button
    v-if="element === 'toggle'"
    type="button"
    class="bf-chip"
    data-element="toggle"
    :aria-pressed="ariaPressed"
    :data-active="pressed || undefined"
    v-bind="$attrs"
    @click="onToggle"
  >
    <slot />
  </button>

  <NuxtLink
    v-else-if="element === 'link'"
    :to="to"
    class="bf-chip"
    data-element="link"
    :data-active="pressed || undefined"
    v-bind="$attrs"
  >
    <slot />
  </NuxtLink>

  <a
    v-else-if="element === 'anchor'"
    :href="href"
    class="bf-chip"
    data-element="anchor"
    :data-external="external || undefined"
    :data-active="pressed || undefined"
    v-bind="$attrs"
  >
    <slot />
  </a>

  <span
    v-else
    class="bf-chip"
    data-element="span"
    :data-active="pressed || undefined"
    v-bind="$attrs"
  >
    <slot />
  </span>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet. It did not until
  gh#101: `postcss-preset-env`'s `stage: 1` enabled the cascade-layers
  polyfill, which rewrote each SFC stylesheet in isolation and flattened this
  wrapper into unlayered rules that then outranked every layer. The feature is
  off in `nuxt.config.ts`; `scripts/verify-bf-chip.ts` §4 reads the emitted CSS
  and the probe reads the live CSSOM, so a regression fails loudly.
*/
@layer components {
  .bf-chip {
    /*
      Default values for the hooks. Override them from the consumer — a rule in
      a later layer, or a `style` attribute on the element — never by editing
      here.
    */
    --_bf-chip-bg: none;
    --_bf-chip-color: var(--color-text);
    --_bf-chip-border: var(--border-width-thin) solid var(--color-text);
    --_bf-chip-padding: 0.1em 0.6em;
    --_bf-chip-radius: var(--radius-pill);
    --_bf-chip-font-size: var(--size--2);
    --_bf-chip-focus-color: currentcolor;

    display: inline-block;
    inline-size: fit-content;
    padding: var(--_bf-chip-padding);
    border: var(--_bf-chip-border);
    border-radius: var(--_bf-chip-radius);

    /*
      `background`, not `background-color`: the shorthand accepts `none` — the
      default above — which paints no ground without naming a colour.
    */
    background: var(--_bf-chip-bg);
    color: var(--_bf-chip-color);

    /*
      `font: inherit`, then the step — the order `bfButton` uses, and it has to
      be the shorthand rather than `font-family` alone.

      Review finding gh#25-P2-1. A `<button>` carries UA declarations no other
      branch does: `line-height: normal` and a font of its own. With only
      `font-family` reset, the toggle rendered 18.25px tall against 23.25px for
      the span, link and anchor branches, and at a different weight — four
      modes of one atom that do not line up. `bfFilterBar` (issue 30) puts
      toggle chips in a row beside link chips, so that is a visible break, and
      it is exactly the class of inconsistency a shared atom exists to prevent.
      The shorthand resets family, weight, style and line-height together;
      `font-size` on the next line then re-applies the step, because a later
      declaration wins.

      `text-align` is the other UA difference (`center` on a button, inherited
      elsewhere), so it is stated once here for every branch. The casing and
      the tracking are untouched by the shorthand and stay the chip's own.
    */
    font: inherit;
    font-size: var(--_bf-chip-font-size);
    letter-spacing: 0.05em;
    text-align: center;
    text-transform: uppercase;
    text-decoration: none;
  }

  /*
    The selected state — the rule that replaces the wireframe's inline-attribute
    branch and the two hand-rolled duplicates on the search page.

    It re-points the hooks rather than declaring `background`/`color` again, so
    a consumer that has already overridden a hook keeps its override's shape,
    and so the selected state is reachable from a consumer rule
    (`[data-active]`) rather than only from this file.

    The border is re-pointed to the same paint as the ground, so selecting a
    chip changes no metric — the box does not move by a pixel as it toggles.
  */
  .bf-chip[data-active] {
    --_bf-chip-bg: var(--color-surface-inverse);
    --_bf-chip-color: var(--color-text-inverse);
    --_bf-chip-border: var(--border-width-thin) solid var(--color-surface-inverse);

    /*
      Review finding gh#24-P2-1, applied here before it can recur. The focus
      ring is drawn outside the chip, over the page ground, so the colour that
      must contrast is the ground's — not the fill's. Left on `currentcolor` a
      selected chip would inherit its light label colour and paint a white ring
      on a white page: a focus indicator that is not there (WCAG 1.4.11).
      `--color-text` contrasts with both the page and the selected fill.
    */
    --_bf-chip-focus-color: var(--color-text);
  }

  /*
    Only the toggle branch is a control the pointer can operate; the link and
    anchor branches get their cursor from the UA's own link handling, and the
    span is not interactive at all.
  */
  .bf-chip[data-element='toggle'] {
    cursor: pointer;
  }

  /*
    Two rings, not one. `--outline-focus` is the existing token (a `box-shadow`
    triple) and supplies the halo; the `outline` is what survives forced-colors
    mode, where `box-shadow` is dropped and an outline is repainted in a system
    colour. The ring colour comes from the hook rather than straight from
    `currentcolor`, for the reason given on the selected rule above.
  */
  .bf-chip:focus-visible {
    outline: var(--border-width-medium) solid var(--_bf-chip-focus-color);
    outline-offset: var(--border-width-medium);
    box-shadow: var(--outline-focus);
  }
}
</style>
