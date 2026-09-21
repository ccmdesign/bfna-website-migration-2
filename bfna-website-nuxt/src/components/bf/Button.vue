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
 * Paper, 21 Sep 2026. Both treatments are navy. `--color-primary` is blue
 * and is not used here; navy's semantic name is `--color-accent`.
 *
 * | | fill | label | border |
 * |---|---|---|---|
 * | default | *none* | `--color-accent` | `--color-primary-tint-30` |
 * | primary | `--color-accent` | `--color-text-inverse` | `--color-accent` |
 *
 * The comp paints the default ground white because the artboard is white.
 * The button paints no ground: on the page that reads the same, and on the
 * hero scrim a white fill plus the scrim's inverse label is white on white.
 * Border is `--border-width-medium` (2px) on both.
 *
 * ## Box metrics
 *
 * Three sizes from the same comp. `m` is the base — omitting `size` and
 * `size="m"` are the same box. Padding is optical: block-end is 2px more
 * than block-start. Radius is the primitive `--border-radius-*` scale
 * (4 / 8 / 12); the semantic `--radius-*` scale is 6 / 12 / 20 and does not
 * match this comp.
 *
 * | size | font | padding (block-start / inline / block-end) | radius |
 * |---|---|---|---|
 * | l | 22px | 12 / 24 / 14 | `--border-radius-l` |
 * | m | 18px | 8 / 16 / 10 | `--border-radius-m` |
 * | s | 12px | 4 / 10 / 6 | `--border-radius-s` |
 *
 * Type is `--font-family-ui` (IBM Plex Sans) at `--font-weight-semibold`.
 * Line-height is 1: the comp sets line-height equal to the font-size.
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
    vars['--_bf-button-bg'] = 'var(--color-accent)'
    vars['--_bf-button-color'] = 'var(--color-text-inverse)'
    vars['--_bf-button-border'] = 'var(--border-width-medium) solid var(--color-accent)'
    /*
     * Review finding gh#24-P2-1. The focus ring is drawn outside the button,
     * over the page ground, so it must contrast with the ground rather than
     * with the fill. Left on `currentcolor` it would inherit this variant's
     * light label colour — a white ring on a white page, i.e. no visible focus
     * indicator. `--color-text` contrasts with both the page and the fill.
     */
    vars['--_bf-button-focus-color'] = 'var(--color-text)'
  }

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
    --_bf-button-color: var(--color-accent);
    --_bf-button-border: var(--border-width-medium) solid var(--color-primary-tint-30);
    --_bf-button-radius: var(--border-radius-m);
    --_bf-button-padding: 8px 16px 10px;
    --_bf-button-font-size: 18px;
    --_bf-button-focus-color: currentcolor;

    display: inline-block;
    padding: var(--_bf-button-padding);
    border: var(--_bf-button-border);
    border-radius: var(--_bf-button-radius);

    /*
      `background`, not `background-color`: the shorthand accepts `none` — the
      default above — which paints no ground without naming a colour.
    */
    background: var(--_bf-button-bg);
    color: var(--_bf-button-color);

    font-family: var(--font-family-ui);
    font-size: var(--_bf-button-font-size);
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
  }

  .bf-button[data-size='l'] {
    --_bf-button-radius: var(--border-radius-l);
    --_bf-button-padding: 12px 24px 14px;
    --_bf-button-font-size: 22px;
  }

  .bf-button[data-size='s'] {
    --_bf-button-radius: var(--border-radius-s);
    --_bf-button-padding: 4px 10px 6px;
    --_bf-button-font-size: 12px;
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
