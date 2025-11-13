<template>
  <component
    :is="componentTag"
    class="ccm-chip"
    :variant="variant"
    :color="color"
    :size="size"
    :disabled="disabled || null"
    :interactive="interactive || null"
    :dismissible="dismissible || null"
    :style="cssVars"
    :aria-label="computedAriaLabel"
    :to="to"
    @click="handleClick"
  >
    <!-- Slot: icon-before — Leading icon/content rendered before the label. -->
    <span v-if="iconBefore || $slots['icon-before']" class="ccm-chip__icon">
      <slot name="icon-before">{{ iconBefore }}</slot>
    </span>

    <!-- Slot: default — Label content. Falls back to `label` prop when empty. -->
    <span class="ccm-chip__label">
      <slot>{{ label }}</slot>
    </span>

    <!-- Slot: icon-after — Trailing icon/content. Replaced by dismiss button when `dismissible`. -->
    <span v-if="dismissible || iconAfter || $slots['icon-after']" class="ccm-chip__icon">
      <slot name="icon-after">
        <button
          v-if="dismissible"
          class="ccm-chip__dismiss"
          type="button"
          :aria-label="`Remove ${computedAriaLabel}`"
          @click.stop="handleDismiss"
        >
          ×
        </button>
        <span v-else>{{ iconAfter }}</span>
      </slot>
    </span>
  </component>
</template>

<script setup lang="ts">
/**
 * Compact label component for status, taxonomy, and quick actions.
 *
 * A versatile chip/badge that supports three visual variants, semantic colors,
 * and sizes. It can behave as static text, a button, or a link. Optional
 * leading/trailing icons and a built-in dismiss affordance are available. Uses
 * design tokens for consistent spacing, typography, and color across themes.
 *
 * Use for inline metadata, filters, tag lists, and light-weight actions. Favor
 * `ccmButton` when the primary intent is an action rather than annotation.
 *
 * @component ccmChip
 * @category atom
 * @standards all-10
 *
 * @example Basic Usage
 * <ccmChip label="Design" />
 *
 * @example With Icons
 * <ccmChip>
 *   <template #icon-before>🏷️</template>
 *   Tagged
 *   <template #icon-after>↗</template>
 * </ccmChip>
 *
 * @example Variants and Colors
 * <div style="display:flex;gap:8px;flex-wrap:wrap">
 *   <ccmChip variant="filled" color="primary" label="Primary" />
 *   <ccmChip variant="outlined" color="success" label="Success" />
 *   <ccmChip variant="minimal" color="warning" label="Warning" />
 * </div>
 *
 * @example Sizes
 * <div style="display:flex;gap:8px;align-items:center">
 *   <ccmChip size="xs" label="XS" />
 *   <ccmChip size="s" label="S" />
 *   <ccmChip size="m" label="M" />
 * </div>
 *
 * @example Dismissible / Interactive
 * <ccmChip dismissible interactive label="Remove me" />
 *
 * @example As Link
 * <ccmChip to="/docs/ccm-chip" label="Docs" />
 */
import { computed } from 'vue'
import type { PropType } from 'vue'

// Environment-based inheritAttrs
defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})

const props = defineProps({
  /**
   * Root HTML tag when not interactive or link.
   * Use 'button' only when you need custom semantics; otherwise set `interactive`.
   * Defaults to 'span'.
   */
  is: { type: String, default: 'span' },

  /**
   * NuxtLink target. When provided, chip renders as `NuxtLink` and emits `click` on activation.
   * Example: '/docs/ccm-chip'.
   */
  to: { type: String, default: null },

  /**
   * Fallback text label if default slot is empty. Also used for `aria-label`
   * when `ariaLabel` is not provided.
   */
  label: { type: String, default: '' },

  /**
   * Optional inline content rendered before the label when `icon-before` slot is unused.
   * Provide a short text/icon glyph.
   */
  iconBefore: { type: String, default: '' },

  /**
   * Optional inline content rendered after the label when `icon-after` slot is unused.
   * Ignored when `dismissible` is true (dismiss button is shown instead).
   */
  iconAfter: { type: String, default: '' },

  /**
   * Visual size preset.
   * Valid values: 'xs' | 's' | 'm'. Defaults to 'm'.
   */
  size: { type: String as PropType<'xs' | 's' | 'm'>, default: 's' },

  /**
   * Visual style variant.
   * Valid values: 'filled' | 'outlined' | 'minimal'. Defaults to 'filled'.
   */
  variant: { type: String as PropType<'filled' | 'outlined' | 'minimal'>, default: 'filled' },

  /**
   * Semantic color token name.
   * Valid values: 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info'.
   */
  color: { type: String as PropType<'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info'>, default: 'neutral' },

  /**
   * Custom background color token name (without leading --). When set, overrides
   * variant/color mapping for background and uses a readable foreground.
   * Example: 'color-brand-500'.
   */
  customColor: { type: String, default: null },

  /**
   * Explicit accessible name. Falls back to `label` or null when not provided.
   */
  ariaLabel: { type: String, default: null },

  /**
   * When true, displays a dismiss button and emits `dismiss` on activation.
   */
  dismissible: { type: Boolean, default: false },

  /**
   * Disables interaction and dims appearance.
   */
  disabled: { type: Boolean, default: false },

  /**
   * Makes the chip keyboard/mouse interactive, rendering as a `button` when not a link.
   */
  interactive: { type: Boolean, default: false }
})

/**
 * Emitted when the dismiss control is activated.
 * @event dismiss
 *
 * Emitted when the chip is activated (button/link modes only).
 * @event click
 */
const emit = defineEmits(['dismiss', 'click'])

// Computed component tag (span, button, or NuxtLink)
const componentTag = computed(() => {
  if (props.to) return 'NuxtLink'
  if (props.interactive || props.dismissible) return 'button'
  return props.is
})

// Size mapping with proper token references
const sizeMap = {
  xs: { paddingBlock: '3xs', paddingInline: 'xs', fontSize: '--size--2', icon: '10' },
  s: { paddingBlock: '3xs', paddingInline: 'xs', fontSize: '--size--1', icon: '12' },
  m: { paddingBlock: '2xs', paddingInline: 's', fontSize: '--size-0', icon: '16' }
}

// Color mapping based on variant (text=full color, bg=10% tint)
const colorMap = {
  filled: {
    neutral: { bg: 'color-neutral-tint-10', color: 'color-neutral' },
    primary: { bg: 'color-primary-tint-10', color: 'color-primary' },
    success: { bg: 'color-success-tint-10', color: 'color-success' },
    warning: { bg: 'color-warning-tint-10', color: 'color-warning' },
    error: { bg: 'color-error-tint-10', color: 'color-error' },
    info: { bg: 'color-info-tint-10', color: 'color-info' }
  },
  outlined: {
    neutral: { bg: 'transparent', color: 'color-neutral', border: 'color-neutral' },
    primary: { bg: 'transparent', color: 'color-primary', border: 'color-primary' },
    success: { bg: 'transparent', color: 'color-success', border: 'color-success' },
    warning: { bg: 'transparent', color: 'color-warning', border: 'color-warning' },
    error: { bg: 'transparent', color: 'color-error', border: 'color-error' },
    info: { bg: 'transparent', color: 'color-info', border: 'color-info' }
  },
  minimal: {
    neutral: { bg: 'transparent', color: 'color-neutral' },
    primary: { bg: 'transparent', color: 'color-primary' },
    success: { bg: 'transparent', color: 'color-success' },
    warning: { bg: 'transparent', color: 'color-warning' },
    error: { bg: 'transparent', color: 'color-error' },
    info: { bg: 'transparent', color: 'color-info' }
  }
}

// CSS Variables
const cssVars = computed(() => {
  const currentSize = sizeMap[props.size as keyof typeof sizeMap] || sizeMap.m
  const currentColors = props.customColor
    ? { bg: props.customColor, color: 'color-neutral-tint-100' }
    : (colorMap as any)[props.variant]?.[props.color] || colorMap.filled.neutral

  return {
    '--_ccm-chip-padding-block': `var(--space-${currentSize.paddingBlock})`,
    '--_ccm-chip-padding-inline': `var(--space-${currentSize.paddingInline})`,
    '--_ccm-chip-font-size': `var(${currentSize.fontSize})`,
    '--_ccm-chip-icon-size': `${currentSize.icon}px`,
    '--_ccm-chip-background-color': `var(--${currentColors.bg})`,
    '--_ccm-chip-color': `var(--${currentColors.color})`,
    '--_ccm-chip-border-color': currentColors.border ? `var(--${currentColors.border})` : 'transparent'
  }
})

// Accessibility
const computedAriaLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel
  if (props.label) return props.label
  return null
})

// Event handlers
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && (props.interactive || props.to)) {
    emit('click', event)
  }
}

const handleDismiss = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('dismiss', event)
  }
}
</script>

<style scoped>
.ccm-chip {
  /* Default CSS variable values */
  --_ccm-chip-padding-block: var(--space-2xs);
  --_ccm-chip-padding-inline: var(--space-s);
  --_ccm-chip-gap: var(--space-2xs);
  --_ccm-chip-border-radius: 999px;
  --_ccm-chip-font-family: var(--font-family-body);
  --_ccm-chip-font-size: var(--size-0);
  --_ccm-chip-font-weight: var(--font-weight-medium);
  --_ccm-chip-line-height: 1.2;
  --_ccm-chip-background-color: var(--color-neutral-tint-10);
  --_ccm-chip-color: var(--color-neutral);
  --_ccm-chip-border-color: transparent;
  --_ccm-chip-border-width: 1px;
  --_ccm-chip-icon-size: 16px;
  --_ccm-chip-disabled-opacity: 0.5;

  /* Layout */
  display: inline-flex;
  align-items: center;
  gap: var(--_ccm-chip-gap);
  padding-block: var(--_ccm-chip-padding-block);
  padding-inline: var(--_ccm-chip-padding-inline);
  border-radius: var(--_ccm-chip-border-radius);
  border: var(--_ccm-chip-border-width) solid var(--_ccm-chip-border-color);

  /* Typography */
  font-family: var(--_ccm-chip-font-family);
  font-size: var(--_ccm-chip-font-size);
  font-weight: var(--_ccm-chip-font-weight);
  line-height: var(--_ccm-chip-line-height);

  /* Colors */
  background-color: var(--_ccm-chip-background-color);
  color: var(--_ccm-chip-color);

  /* Behavior */
  white-space: nowrap;
  text-decoration: none;
  user-select: none;
  cursor: default;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

/* Interactive state */
.ccm-chip[interactive],
.ccm-chip[to] {
  cursor: pointer;
}

.ccm-chip[interactive]:hover,
.ccm-chip[to]:hover {
  filter: brightness(0.95);
}

.ccm-chip[interactive]:active,
.ccm-chip[to]:active {
  filter: brightness(0.9);
}

/* Disabled state */
.ccm-chip[disabled] {
  opacity: var(--_ccm-chip-disabled-opacity);
  cursor: not-allowed;
  pointer-events: none;
}

/* Icon */
.ccm-chip__icon {
  display: inline-flex;
  align-items: center;
  width: var(--_ccm-chip-icon-size);
  height: var(--_ccm-chip-icon-size);
  font-size: var(--_ccm-chip-icon-size);
  color: currentcolor;
}

/* Label */
.ccm-chip__label {
  display: inline-block;
}

/* Icon padding overrides - reduce padding on sides with icons */
.ccm-chip:has(.ccm-chip__icon:first-child) {
  padding-inline-start: var(--space-2xs);
}

.ccm-chip:has(.ccm-chip__icon:last-child) {
  padding-inline-end: var(--space-2xs);
}

/* Dismiss button */
.ccm-chip__dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--_ccm-chip-icon-size);
  height: var(--_ccm-chip-icon-size);
  padding: 0;
  margin-inline-start: calc(var(--_ccm-chip-gap) * -0.5);
  background: transparent;
  border: none;
  color: currentcolor;
  cursor: pointer;
  border-radius: 999px;
  transition: background-color 0.2s ease;
  font-family: var(--font-family-body);
  font-size: calc(var(--_ccm-chip-icon-size) * 0.9);
  font-weight: var(--font-weight-normal);
  line-height: 1;
}

.ccm-chip__dismiss:hover {
  background-color: rgb(0 0 0 / 10%);
}

.ccm-chip__dismiss:active {
  background-color: rgb(0 0 0 / 20%);
}

/* Variant: outlined */
.ccm-chip[variant='outlined'] {
  background-color: transparent;
}

/* Variant: minimal */
.ccm-chip[variant='minimal'] {
  background-color: transparent;
  border-color: transparent;
  padding-inline: var(--space-2xs);
}
</style>
