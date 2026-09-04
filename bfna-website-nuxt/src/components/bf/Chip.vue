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
 * ## What the passive `active` state does
 *
 * It used to do one thing: change the paint. On the span, link and anchor
 * branches the selection was therefore conveyed by colour alone (WCAG 1.4.1),
 * and announced not at all (WCAG 1.3.1) — residual #112, closed here by
 * gh#117. Two separate answers, because they are two separate failures:
 *
 * **The cue** (1.4.1) is `text-decoration: underline`, re-pointed through
 * `--_bf-chip-text-decoration` by the same `[data-active]` rule that re-points
 * the paint, so it reaches every branch including the toggle and cannot drift
 * from the fill. Underline rather than a `::before` check glyph, for three
 * reasons: it is **layout-neutral** — a leading glyph widens the chip, and
 * "selecting changes no metric" is a contract this component states and probe
 * 16 measures; it **survives forced-colors mode**, where the system repaints
 * the fill but keeps text decoration, which is the mode where a colour-only
 * state fails hardest; and it puts **no generated text** into the
 * accessibility tree, which a `content` glyph does in Chrome and Safari. It
 * costs no colour: the decoration paints in `currentcolor`, and the base rule
 * sets `text-decoration: none` on all four branches, so within this component
 * an underline is unambiguous — it means selected.
 *
 * **The announcement** (1.3.1) is `aria-current="true"` on the link and anchor
 * branches — the interactive ones — via `currentAttrs` below. The toggle
 * branch keeps `aria-pressed` and gets no `aria-current`: a control that
 * announces two states is worse than one that announces one. The `<span>`
 * branch gets neither, and that is deliberate rather than an oversight: it is
 * not interactive, not focusable and not in the accessibility tree as a
 * control, so `aria-current` on it would be a state on a non-widget. A
 * consumer who needs a passive selection *announced* is describing a control,
 * and should render `toggle` or `to`/`href`. The visual cue reaches it
 * regardless, which is what 1.4.1 asks for.
 *
 * The frozen component still has both gaps; it is not edited (BRIEF D2).
 *
 * ## Box metrics
 *
 * Taken from the frozen rule rather than reinvented: the same `em`-relative
 * padding, a 1px border through `--border-width-thin`, and a fully rounded
 * end through `--radius-pill`, whose value is already the frozen rule's.
 * `scripts/verify-bf-chip.ts` parsed those values back out of the frozen
 * stylesheet and probe 16 measured a real hidden wireframe chip against a
 * rendered `bf-chip`, so no number was typed twice. Both retired with the probe
 * pages in gh#68 (BRIEF §5); the numbers below still come from the frozen rule
 * and are not to be re-derived.
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
  /*
   * `undefined`, not `false` — the signal that nothing is bound (#111). A
   * Boolean-typed prop with **no** default is cast to `false` when absent, and
   * that cast runs only when the prop is absent *and* carries no default; so
   * declaring the default explicitly is what keeps "unbound" distinguishable
   * from "bound to false". `toggleState` below is what reads it.
   */
  modelValue: undefined
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
 * The state an **uncontrolled** toggle keeps for itself.
 *
 * Residual #111, promoted as gh#117. `modelValue` is optional and toggle mode
 * used to be fully controlled with no fallback, so `<bfChip toggle>` — or the
 * plausible mistake `<bfChip toggle active>`, since `active` is ignored in
 * toggle mode — rendered a button that announced `aria-pressed="false"` for
 * ever and never changed on activation. It still *emitted*, so nothing that
 * watched the emit contract could see it: only a consumer who forgot
 * `v-model` was affected, and it failed silently (WCAG 4.1.2).
 *
 * This is the first of the two options the residual weighed — an internal ref,
 * read **only** while the prop is unbound. The objection to it, that a
 * stateful atom can desync from a parent which deliberately vetoes a change,
 * does not apply: the moment `modelValue` is bound this ref is never read
 * again, `toggleState` returns the prop, and a parent that declines to update
 * it still wins exactly as before. The rejected alternative was a
 * discriminated union making `toggle` require `modelValue` — free at runtime,
 * but it re-types a contract the spec deliberately declares optional and would
 * make `bfFilterBar` (issue 30) the only legal caller shape.
 */
const uncontrolled = ref(false)

/** Is the state the caller's? See the `modelValue` default above. */
const controlled = computed<boolean>(() => props.modelValue !== undefined)

/** The toggle's state, from whichever side owns it. */
const toggleState = computed<boolean>(() => (controlled.value ? !!props.modelValue : uncontrolled.value))

/**
 * The selected state, from whichever prop owns it in this mode.
 *
 * Toggle mode reads `toggleState` (and ignores `active`); the three passive
 * modes read `active` (and ignore `modelValue`). One boolean drives
 * `aria-pressed`, `aria-current` and the `[data-active]` styling hook, so the
 * accessible state and the visible state cannot drift apart.
 */
const pressed = computed<boolean>(() => (props.toggle ? toggleState.value : !!props.active))

/**
 * `aria-pressed` is written as an explicit string rather than left to the
 * boolean-attribute serialisation. An unpressed toggle must render
 * `aria-pressed="false"` — a *present* attribute with the value `false`, which
 * is what makes it a toggle button rather than a plain one. Rendering nothing
 * would silently demote the control.
 */
const ariaPressed = computed(() => (pressed.value ? 'true' : 'false'))

/**
 * `aria-current` for the two passive branches that are actually interactive
 * (residual #112, promoted as gh#117).
 *
 * A link or anchor chip that is `active` is the current item of a set, and
 * `aria-current="true"` is the ARIA idiom for exactly that. The toggle branch
 * is excluded because `aria-pressed` already owns its state and a control must
 * not announce two; the `<span>` branch is excluded because it is not
 * interactive at all — see the docblock section above for why no role is
 * invented for it.
 *
 * Emitted as an **object with the key omitted** when unselected, rather than
 * as `:aria-current="pressed || undefined"`. A bound `undefined` is still a
 * key in the fallthrough props, and `mergeProps` lets a later key win even
 * when its value is `undefined` — which would erase the `aria-current="page"`
 * `NuxtLink` sets by itself on a link whose route matches. Omitting the key
 * leaves that untouched.
 *
 * Spread **before** `$attrs` — one `v-bind` carrying both, because two
 * `v-bind` object bindings on one element are a compile error — so a consumer
 * whose chip means something more specific can still say so with
 * `aria-current="page"` (or `"step"`). That is the opposite of `aria-pressed`,
 * which is bound after `$attrs` (residual #115), because there is no honest
 * reason to set *that* one from outside.
 */
const currentAttrs = computed(
  (): Record<string, string> => (!props.toggle && pressed.value ? { 'aria-current': 'true' } : {})
)

const onToggle = () => {
  /*
   * The negation of the **effective** state, not of the raw prop: for an
   * uncontrolled chip `props.modelValue` is `undefined`, so `!props.modelValue`
   * was `true` on every activation — the payload never alternated either.
   * The emit is unconditional in both modes, so a consumer that only listens
   * (and never binds) still sees every change.
   */
  const next = !toggleState.value
  if (!controlled.value) uncontrolled.value = next
  emit('update:modelValue', next)
}
</script>

<template>
  <!--
    One root per branch, so `$attrs` has exactly one destination. `class`,
    `aria-*`, `data-*`, listeners and a caller's own `style` all fall through
    to it. `data-active` is bound with `|| undefined` so the attribute is
    absent — not `"false"` — when the chip is not selected, which is what lets
    the stylesheet select on its bare presence.

    `aria-current` is spread BEFORE `$attrs` on the two interactive passive
    branches (residual #112) — in one `v-bind`, since two object bindings on an
    element are a compile error — so a consumer whose chip means something more
    specific can override it with `"page"` or `"step"`. `aria-pressed` is bound
    AFTER `$attrs` (residual #115): unlike `type`,
    which a caller may legitimately want to change, there is no honest reason
    to set `aria-pressed` from outside, and a caller who did would desync it
    from `[data-active]` — the very invariant probe 16 asserts. Everything else
    still falls through, so this narrows the escape hatch by exactly one
    attribute and nothing more.
  -->
  <button
    v-if="element === 'toggle'"
    type="button"
    class="bf-chip"
    data-element="toggle"
    :data-active="pressed || undefined"
    v-bind="$attrs"
    :aria-pressed="ariaPressed"
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
    v-bind="{ ...currentAttrs, ...$attrs }"
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
    v-bind="{ ...currentAttrs, ...$attrs }"
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
  off in `nuxt.config.ts`, and `scripts/check-routes.ts`'s cascade-layer gate
  reads the emitted CSS, so a regression fails loudly. (That gate replaced
  `verify-bf-chip.ts` §4 and probe 16's live-CSSOM read in gh#68, and covers
  every `bf-*` rule rather than this one component's.)
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
    /*
      The non-colour cue for the selected state (residual #112). `none` here,
      `underline` on `[data-active]` below — a hook rather than a literal so a
      consumer can re-point it like every other paint on this component.
    */
    --_bf-chip-text-decoration: none;

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

    /*
      The shorthand first, then the two longhands it would otherwise reset:
      `text-decoration-thickness` is part of `text-decoration`, so stating it
      afterwards is what makes the selected underline the same weight as the
      chip's own border rather than the UA's `auto`. Neither longhand paints
      anything while the hook is `none`.
    */
    text-decoration: var(--_bf-chip-text-decoration);
    text-decoration-thickness: var(--border-width-thin);
    text-underline-offset: 0.2em;
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
      Residual #112: the selected state must not be conveyed by colour alone
      (WCAG 1.4.1). An underline is the cue — layout-neutral, so it does not
      break the "selecting changes no metric" promise the border re-point makes
      just above, and it survives forced-colors mode, where the fill does not.
      It paints in `currentcolor`, so it adds no colour (BRIEF §5 rule 2).
    */
    --_bf-chip-text-decoration: underline;

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
