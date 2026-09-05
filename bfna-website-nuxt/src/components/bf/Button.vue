<script setup lang="ts">
/**
 * `bfButton` — one button/link atom for the whole `bf-*` system.
 *
 * Componentises the raw lo-fi button class the wireframe declares in
 * `public/css/wireframe.css` (issue 15 / gh#24). There, that class is only
 * ever written by hand onto a `<button>` or an `<a>` — it was never a
 * component — so five pages and two `wf-*` components each re-decide which
 * element to use and whether to mark an external link. This makes that
 * decision once. The class itself is frozen (D2) and is **not** reused here;
 * this component is styled from tokens, from scratch.
 *
 * Presentational-only (BRIEF D8): props in, nothing else. No data access, no
 * store, no composable that reads content.
 *
 * ## Which element renders
 *
 * | props | element |
 * |---|---|
 * | `disabled` | `<button disabled>` — **whatever else is set** |
 * | `to` | `<NuxtLink :to>` |
 * | `href` (no `to`) | `<a :href>`, plus `[data-external]` when `external` |
 * | neither | `<button>` |
 *
 * `disabled` outranking `to`/`href` is deliberate and is the spec's own rule.
 * Neither `<a>` nor `NuxtLink` supports a native `disabled`; faking one with
 * `aria-disabled` and a pointer-events kill leaves an element that is still in
 * the tab order and still activates on Enter. A real `<button disabled>` is
 * the only branch that is genuinely non-interactive *and* non-focusable, which
 * is what the acceptance asks for.
 *
 * That still holds for the `disabled` prop, and the prop is unchanged. What
 * gh#225 added is that non-focusable is sometimes the wrong answer: removing
 * focusability from the element a keyboard user is *currently standing on*
 * drops focus to `<body>` (WCAG 2.4.3). A caller in that position passes
 * `aria-disabled="true"` through `$attrs` instead and guards its own handler,
 * and the stylesheet below renders the two spellings identically so the choice
 * costs nothing visually. `bfLoadMore` is the worked example.
 *
 * The three-way branch itself is the one `wfChip.vue` already demonstrates,
 * down to `:data-external="external || undefined"` so the attribute is absent
 * rather than `"false"` on internal links. The marker is formalised as a
 * documented style hook in issue 19; this component only emits it.
 *
 * `external` applies to the `href` branch only. `<bfButton to="…" external>`
 * emits no marker: `to` is an internal route by definition, so that pairing is
 * a caller mistake rather than a case to render. It is ignored rather than
 * warned about — a presentational atom has nowhere useful to warn.
 *
 * ## Colour
 *
 * No new colour (BRIEF §5 rule 2) and no primitive — every value is an
 * existing semantic token. The wireframe's literals map like this:
 *
 * | | wireframe | here |
 * |---|---|---|
 * | default fill | white | *none* — the button paints no ground |
 * | default text + border | near-black | `--color-text` |
 * | primary fill | near-black | `--color-primary` |
 * | primary label | white | `--color-text-inverse` |
 *
 * The default variant paints **no** ground rather than a white one: the
 * semantic layer has no `--color-surface`, the one white-ish semantic name is
 * `--color-text-inverse` (whose meaning is text, not ground), and the
 * `--color-white` primitive is exactly what BRIEF §5 rule 2 forbids and what
 * gh#101 removed from `bfLogo`. On the white page ground the render is
 * identical to the wireframe's, and the button stays usable on a dark panel.
 *
 * `--color-text-inverse` on `--color-primary` is ≈6.2:1 — WCAG 2.1 AA at any
 * size.
 *
 * ## Box metrics
 *
 * Matched to the wireframe's button class rather than reinvented:
 * `0.4em 1.2em` padding and a 2px border, the latter through the existing
 * `--border-width-medium` token. Because the padding is in `em`, a size change
 * is a font-size change and the whole box scales with it — there is no
 * per-size padding table. `scripts/verify-bf-button.ts` parsed those two
 * values back out of `wireframe.css`, and probe 15 measured a real hidden
 * wireframe button against a rendered `bf-button`. Both retired with the probe
 * pages in gh#68 (BRIEF §5); the two values below still come from the frozen
 * rule and are not to be re-derived.
 */
import type { ButtonProps } from '~/types/bf-contracts'
import { newTabAttrs } from '~/utils/link'

defineOptions({
  name: 'BfButton',
  /*
   * A wrapper, not a base: `$attrs` is bound by hand below so it lands on
   * whichever of the three elements actually rendered, and — because it is
   * bound *after* `:style="cssVars"` — a caller's own `style` wins the merge.
   * That is the escape hatch that keeps the inline variables overridable.
   */
  inheritAttrs: false
})

const props = withDefaults(defineProps<ButtonProps>(), {
  to: undefined,
  href: undefined,
  external: undefined,
  variant: 'default',
  size: undefined,
  disabled: false
})

/**
 * The recognised `size` values, as existing Utopia type steps.
 *
 * Omitting `size` is not "medium" — it inherits, matching the wireframe
 * class's `font: inherit`, so an unsized `bfButton` is wireframe-exact
 * wherever it is dropped. `m` is the explicit request for the base step.
 */
const SIZE_STEPS: Readonly<Record<string, string>> = {
  s: 'var(--size--1)',
  m: 'var(--size-0)',
  l: 'var(--size-1)'
}

/**
 * Which element this render resolves to. Exposed as `data-element` so the
 * probe can assert the branch that was taken, not just the tag that appeared.
 */
const element = computed<'link' | 'anchor' | 'button'>(() => {
  if (props.disabled) return 'button'
  if (props.to !== undefined && props.to !== null && props.to !== '') return 'link'
  if (props.href) return 'anchor'
  return 'button'
})

/**
 * Prop-derived CSS variables, bound to `:style` (BRIEF §5.4, and the repo's
 * own Standard 5 — "only set overrides when necessary", as `ccmButton` does).
 *
 * Defaults deliberately are **not** here: they live in the stylesheet below,
 * inside `@layer components`, where a consumer's own rule can outrank them. An
 * inline style cannot be outranked by a rule, so only the values a prop
 * actively changes are written inline, and even those yield to a caller's
 * `style` because `$attrs` is merged after this.
 */
const cssVars = computed<Record<string, string>>(() => {
  const vars: Record<string, string> = {}

  if (props.variant === 'primary') {
    vars['--_bf-button-bg'] = 'var(--color-primary)'
    vars['--_bf-button-color'] = 'var(--color-text-inverse)'
    vars['--_bf-button-border'] = 'var(--border-width-medium) solid var(--color-primary)'
    /*
     * Review finding gh#24-P2-1. The focus ring is drawn outside the button,
     * over the page ground, so it must contrast with the ground rather than
     * with the fill. Left on `currentcolor` it would inherit this variant's
     * light label colour — a white ring on a white page, i.e. no visible focus
     * indicator. `--color-text` contrasts with both the page and the fill.
     */
    vars['--_bf-button-focus-color'] = 'var(--color-text)'
  }

  const step = props.size ? SIZE_STEPS[props.size] : undefined
  if (step) vars['--_bf-button-font-size'] = step

  return vars
})
</script>

<template>
  <!--
    One root per branch, so `$attrs` has exactly one destination. `class`,
    `style`, `type`, `aria-*`, `data-*` and listeners all fall through to it.
    `type="button"` is written before `v-bind="$attrs"` on purpose: a caller
    that needs a submit button (`wfCtaSection`/`wfContactSection` both do)
    passes `type="submit"` and it wins.
  -->
  <NuxtLink
    v-if="element === 'link'"
    :to="to"
    class="bf-button"
    data-element="link"
    :data-variant="variant"
    :data-size="size || undefined"
    :style="cssVars"
    v-bind="$attrs"
  >
    <slot />
  </NuxtLink>

  <a
    v-else-if="element === 'anchor'"
    :href="href"
    class="bf-button"
    data-element="anchor"
    :data-variant="variant"
    :data-size="size || undefined"
    :data-external="external || undefined"
    :style="cssVars"
    v-bind="{ ...newTabAttrs(href), ...$attrs }"
  >
    <slot />
  </a>

  <button
    v-else
    type="button"
    class="bf-button"
    data-element="button"
    :data-variant="variant"
    :data-size="size || undefined"
    :disabled="disabled"
    :style="cssVars"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet. It did not until
  gh#101: `postcss-preset-env`'s `stage: 1` enabled the cascade-layers
  polyfill, which rewrote each SFC stylesheet in isolation and flattened this
  wrapper into unlayered rules that then outranked every layer. The feature is
  off in `nuxt.config.ts`, and `scripts/check-routes.ts`'s cascade-layer gate
  reads the emitted CSS, so a regression fails loudly. (That gate replaced
  `verify-bf-button.ts` §5 and probe 15's live-CSSOM read in gh#68, and covers
  every `bf-*` rule rather than this one component's.)
*/
@layer components {
  .bf-button {
    /*
      Default values for the hooks. Override them from the consumer — a rule in
      a later layer, or a `style` on the element — never by editing here.
    */
    --_bf-button-bg: none;
    --_bf-button-color: var(--color-text);
    --_bf-button-border: var(--border-width-medium) solid var(--color-text);
    --_bf-button-padding: 0.4em 1.2em;
    --_bf-button-focus-color: currentcolor;

    display: inline-block;
    padding: var(--_bf-button-padding);
    border: var(--_bf-button-border);

    /*
      `background`, not `background-color`: the shorthand accepts `none` — the
      default above — which paints no ground without naming a colour.
    */
    background: var(--_bf-button-bg);
    color: var(--_bf-button-color);

    /* The wireframe class's `font: inherit`, with the size hook layered on. */
    font: inherit;
    font-size: var(--_bf-button-font-size, inherit);
    text-align: center;
    text-decoration: none;
    cursor: pointer;
  }

  /*
    Two rings, not one. `--outline-focus` is the existing token (a `box-shadow`
    triple) and supplies the halo; the `outline` is what survives forced-colors
    mode, where `box-shadow` is dropped and an outline is repainted in a system
    colour.

    The ring colour comes from a hook rather than straight from `currentcolor`.
    `outline-offset` draws the ring **outside** the button, on the page ground,
    so the colour that has to contrast is the ground's — not the fill's. On the
    filled variant `currentcolor` is the light label colour, which made the
    ring white-on-white and left no visible focus indicator at all (WCAG
    1.4.11; review finding gh#24-P2-1). No new colour either way.
  */
  .bf-button:focus-visible {
    outline: var(--border-width-medium) solid var(--_bf-button-focus-color);
    outline-offset: var(--border-width-medium);
    box-shadow: var(--outline-focus);
  }

  /*
    `:disabled` is only ever a `<button>` — the element resolution guarantees
    it. `[aria-disabled='true']` is the second spelling of the same state, added
    for gh#225 and reachable on any of the three branches: a caller whose
    control must stay focusable while unavailable writes that instead, because
    setting the native attribute on the element that currently has focus blurs
    it to `<body>` (`bfLoadMore` is the case in point). One state, one
    appearance — no new declaration, no new token, no second opinion about what
    unavailable looks like.

    Disabled controls are exempt from WCAG 1.4.3 contrast, so the dimmed state
    is not a contrast failure. `aria-disabled` is *not* exempt in the same way,
    but it is here: the element is inert in fact, not merely in appearance —
    the caller's handler refuses the activation — so it is a disabled control
    that happens to keep focus, not an enabled one wearing a dimmed skin.
  */
  .bf-button:disabled,
  .bf-button[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>
