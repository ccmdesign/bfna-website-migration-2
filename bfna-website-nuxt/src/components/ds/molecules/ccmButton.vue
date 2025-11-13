<template>
  <component
    :is="componentTag"
    v-bind="componentProps"
    class="ccm-button"
    :style="cssVars"
    :aria-label="computedAriaLabel"
    :aria-pressed="computedAriaPressed"
    :aria-expanded="computedAriaExpanded"
    :aria-disabled="disabled || null"
    :variant="variant"
    :color="color"
    :size="size"
  >
    <!-- Default slot for button content. Can contain text, icons, or other components. Falls back to label prop if empty. -->
    <slot>{{ label }}</slot>
  </component>
</template>

<script setup lang="ts">
import { computed, resolveComponent } from 'vue'
import { useRouter } from '#app'

/**
 * Primary button component following all 10 Component Standards.
 *
 * A versatile button component that supports multiple variants, sizes, and colors.
 * Can render as button, link (NuxtLink), or anchor based on props. Includes full
 * accessibility support with proper ARIA attributes and keyboard navigation.
 *
 * Uses semantic color tokens for variants. Sizes follow s/m/l/xl scale.
 * See Component Design Decisions for full rationale.
 *
 * @component ccmButton
 * @category atom
 * @standards all-10
 *
 * @example Basic Usage
 * <ccmButton>Click me</ccmButton>
 *
 * @example Variants
 * <ccmButton variant="primary">Primary</ccmButton>
 * <ccmButton variant="secondary">Secondary</ccmButton>
 * <ccmButton variant="ghost">Ghost</ccmButton>
 * <ccmButton variant="link">Link</ccmButton>
 *
 * @example Sizes
 * <ccmButton size="s">Small</ccmButton>
 * <ccmButton size="m">Medium</ccmButton>
 * <ccmButton size="l">Large</ccmButton>
 * <ccmButton size="xl">Extra Large</ccmButton>
 *
 * @example Colors
 * <ccmButton color="primary">Primary</ccmButton>
 * <ccmButton color="secondary">Secondary</ccmButton>
 * <ccmButton color="success">Success</ccmButton>
 * <ccmButton color="warning">Warning</ccmButton>
 *
 * @example Links
 * <ccmButton href="https://example.com">External Link</ccmButton>
 * <ccmButton to="/about">Internal Link</ccmButton>
 *
 * @example Disabled State
 * <ccmButton disabled>Disabled Button</ccmButton>
 *
 * @example With Icons
 * <ccmButton>
 *   <Icon name="plus" />
 *   Add Item
 * </ccmButton>
 *
 * @example Custom Background
 * <ccmButton backgroundColor="color-accent">Custom Background</ccmButton>
 *
 * @example Unstyled Variant
 * <ccmButton variant="unstyled">Unstyled Button</ccmButton>
 */

defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})

const props = defineProps({
  // Structural props
  /** HTML tag to render when not using to/href. Defaults to 'button' for standard button behavior. */
  is: { type: String, default: 'button' },
  /** Internal route for NuxtLink navigation. When provided, renders as NuxtLink component. */
  to: { type: [String, Object], default: null },
  /** External URL for anchor link. When provided, renders as <a> tag with href attribute. */
  href: { type: String, default: null },

  // Content props
  /** Button text label used as fallback when slot is empty. Takes precedence over slot content for accessibility. */
  label: { type: String, default: '' },

  // Visual props
  /** Button size following the s/m/l/xl scale. Controls padding and font size. Valid values: s, m, l, xl */
  size: { type: String, default: 'm' },
  /** Color theme using semantic design tokens. Valid values: primary, secondary, base, accent, white, success, fail, warning, info */
  color: { type: String, default: 'base' },
  /** Custom background color override using CSS custom property name (without -- prefix). Use 'transparent' for default behavior. */
  backgroundColor: { type: String, default: 'transparent' },
  /** Visual style variant affecting appearance. Valid values: primary (filled), secondary (outlined), ghost (no border), link (text-only), unstyled (no styles) */
  variant: { type: String, default: 'primary' },

  // Accessibility props
  /** Custom aria-label for screen readers. Overrides automatic label generation. Use for buttons with icon-only content. */
  ariaLabel: { type: String, default: null },
  /** Toggle button pressed state. Set to true/false for toggle buttons, null for non-toggle buttons. Controls aria-pressed attribute. */
  isPressed: { type: Boolean, default: null },
  /** Expandable button expanded state. Set to true/false for expandable buttons, null for non-expandable buttons. Controls aria-expanded attribute. */
  isExpanded: { type: Boolean, default: null },

  // Behavior props
  /** Disable the button and prevent all interactions. Sets aria-disabled and removes pointer events. */
  disabled: { type: Boolean, default: false }
})

const componentTag = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return props.is
})

const componentProps = computed(() => {
  if (props.to) {
    return { to: props.to }
  }

  if (props.href) {
    return { href: props.href }
  }

  // button or custom element
  return { disabled: props.disabled }
})

const cssVars = computed(() => {
  const vars = {}

  // Only override background-color if explicitly provided and not 'transparent'
  if (props.backgroundColor && props.backgroundColor !== 'transparent') {
    vars['--_ccm-button-background-color'] = `var(--${props.backgroundColor})`
  }

  return vars
})

// Resolve the final URL (href or to)
const router = useRouter()
const resolvedHref = computed(() => {
  if (props.href) return props.href
  if (props.to) {
    if (typeof props.to === 'string') return props.to
    try {
      return router.resolve(props.to).href
    } catch {
      return null
    }
  }
  return null
})

function humanizeUrl(url) {
  try {
    const u = new URL(url, 'http://example.local')
    const path = u.pathname || ''
    const last = path.split('/').filter(Boolean).pop() || u.hostname || ''
    const text = decodeURIComponent((last || '').replace(/[-_]+/g, ' ').trim())
    if (!text) return 'link'
    return text.charAt(0).toUpperCase() + text.slice(1)
  } catch {
    const fallback = decodeURIComponent((url || '').replace(/[-_]+/g, ' ').trim())
    return fallback ? fallback.charAt(0).toUpperCase() + fallback.slice(1) : 'link'
  }
}

// Accessibility fallbacks
const computedAriaLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel
  if (props.label) return props.label
  const url = resolvedHref.value
  return url ? `Go to ${humanizeUrl(url)}` : null
})

const computedAriaPressed = computed(() => {
  // Only set when explicitly provided; otherwise omit attribute
  return props.isPressed === null ? null : props.isPressed
})

const computedAriaExpanded = computed(() => {
  // Only set when explicitly provided; otherwise omit attribute
  return props.isExpanded === null ? null : props.isExpanded
})
</script>

<style scoped>
.ccm-button {
  /* Structure */
  display: inline-block;
  zoom: 1;
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
  text-align: center;
  -webkit-user-drag: none;
  user-select: none;
  box-sizing: border-box;
  text-decoration: none;
  place-self: self-start flex-start;
  border: var(--_ccm-button-border-width) var(--_ccm-button-border-style) var(--_ccm-button-border-color);
  cursor: pointer;
}

.ccm-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.ccm-button[disabled],
.ccm-button[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.ccm-button {
  --_ccm-button-border-width: 2px;
  --_ccm-button-border-style: solid;
  --_ccm-button-border-color: transparent;
  --_ccm-button-border-radius: 8px;
  --_ccm-button-font-family: var(--font-family-body);
  --_ccm-button-font-weight: var(--font-weight-bold);
  --_ccm-button-font-size: 100%;
  --_ccm-button-color: var(--_ccm-button-color);
  --_ccm-button-background-color: var(--_ccm-button-background-color);

  color: var(--_ccm-button-color);
  background-color: var(--_ccm-button-background-color);
  padding-block: var(--_ccm-button-padding-block-start) var(--_ccm-button-padding-block-end);
  padding-inline: var(--_ccm-button-padding-inline);
  border-radius: var(--_ccm-button-border-radius, 8px);
  font-family: var(--_ccm-button-font-family);
  font-weight: var(--_ccm-button-font-weight);
  font-size: var(--_ccm-button-font-size, 100%);
  border-width: var(--_ccm-button-border-width);
  border-style: var(--_ccm-button-border-style);
  border-color: var(--_ccm-button-border-color);
  transition: all 0.2s ease-in-out;
}

.ccm-button:hover {
  background-color: color-mix(in srgb, var(--_ccm-button-color) 90%, black 10%);
  color: var(--_ccm-button-color);
  border-color: transparent;
  transform: scale(1.05);
}

/* Button size */
.ccm-button[size='s'] {
  --_ccm-button-font-size: var(--size--1);
  --_ccm-button-padding-block-start: calc(var(--space-3xs) - 1px);
  --_ccm-button-padding-block-end: calc(var(--space-3xs) + 1px);
  --_ccm-button-padding-inline: var(--space-2xs);
}

.ccm-button[size='m'],
.ccm-button {
  --_ccm-button-font-size: var(--size-0);
  --_ccm-button-padding-block-start: calc(var(--space-xs) - 1px);
  --_ccm-button-padding-block-end: calc(var(--space-xs) + 1px);
  --_ccm-button-padding-inline: var(--space-s);
}

.ccm-button[size='l'] {
  --_ccm-button-font-size: var(--size-1);
  --_ccm-button-padding-block-start: calc(var(--space-s) - 2px);
  --_ccm-button-padding-block-end: calc(var(--space-s) + 2px);
  --_ccm-button-padding-inline: var(--space-m);
}

.ccm-button[size='xl'] {
  --_ccm-button-font-size: var(--size-2);
  --_ccm-button-padding-block-start: calc(var(--space-m) - 3px);
  --_ccm-button-padding-block-end: calc(var(--space-m) + 3px);
  --_ccm-button-padding-inline: var(--space-l);
}

/* Variants */
.ccm-button[variant='primary'] {
  --_ccm-button-background-color: var(--_ccm-button-color);

  color: var(--color-white);
  border-color: var(--_ccm-button-border-color);
}

.ccm-button[data-variant='secondary'],
.ccm-button[variant='secondary'] {
  background-color: transparent;
  color: var(--_ccm-button-color);
  border-color: currentcolor;
}

.ccm-button[variant='ghost'],
.ccm-button[variant='link'] {
  background-color: transparent;
  color: var(--_ccm-button-color);
  border-color: transparent;
}

.ccm-button[variant='ghost']:hover,
.ccm-button[variant='link']:hover {
  text-decoration: underline;
}

/* .ccm-button[variant='ghost']:hover,
.ccm-button[variant='link']:hover {
  background-color: color-mix(in srgb, var(--_ccm-button-color) 10%, transparent);
  color: var(--_ccm-button-color);
  border-color: transparent;
} */

.ccm-button[variant='unstyled'] { all: unset; }

.ccm-button[color='primary'] {
  --_ccm-button-color: var(--color-primary);
}

.ccm-button[color='secondary'] {
  --_ccm-button-color: var(--color-secondary);
}

.ccm-button[color='base'] {
  --_ccm-button-color: var(--color-base);
}

.ccm-button[color='accent'] {
  --_ccm-button-color: var(--color-accent);
}

.ccm-button[color='white'] {
  --_ccm-button-color: var(--color-white);
}

.ccm-button[color='success'] {
  --_ccm-button-color: var(--color-success);
}

.ccm-button[color='fail'] {
  --_ccm-button-color: var(--color-fail);
}

.ccm-button[color='warning'] {
  --_ccm-button-color: var(--color-warning);
}

.ccm-button[color='info'] {
  --_ccm-button-color: var(--color-info);
}


/* 
Colors (tokens)
- primary
- secondary
- tertiary
- accent
- white
- success
- fail
- warning
- info

Variants
- primary
- secondary
- link/ghost
- unstyled

Sizes (tokens)
- s
- m
- l
- xl

Icon 
- composability via main slot.
- treatment via :has()


*/
</style>