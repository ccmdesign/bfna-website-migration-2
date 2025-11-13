<!--
  eslint-disable vue/no-deprecated-html-element-is
-->
<template>
  <div
    :is="is"
    class="ccm-form-group"
    :variant="variant"
    :style="cssVars"
    :role="role"
    :aria-label="computedAriaLabel"
    v-bind="$attrs"
  >
    <!-- Slot: default — Button elements to group together. Typically ccmButton components. -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Container component for grouping related buttons with shared borders and spacing.
 *
 * Groups multiple button elements together, removing border radius between them
 * and applying negative margins to create a visually connected button group.
 * Supports semantic variants via attribute selectors and customizable spacing
 * through design tokens. Includes accessibility support with ARIA roles and labels.
 *
 * Use for action groups, toolbar-style controls, or any context where buttons
 * should appear as a single cohesive unit.
 *
 * @component ccmFormGroup
 * @category molecule
 * @standards all-10
 *
 * @example Basic Form Group
 * <ccmFormGroup>
 *   <ccmButton>Cancel</ccmButton>
 *   <ccmButton variant="primary">Save</ccmButton>
 * </ccmFormGroup>
 *
 * @example Multiple Buttons
 * <ccmFormGroup>
 *   <ccmButton size="s">Edit</ccmButton>
 *   <ccmButton size="s">Delete</ccmButton>
 *   <ccmButton size="s">Share</ccmButton>
 * </ccmFormGroup>
 *
 * @example With Toolbar Role
 * <ccmFormGroup role="toolbar" aria-label="Text formatting">
 *   <ccmButton variant="ghost" size="s">Bold</ccmButton>
 *   <ccmButton variant="ghost" size="s">Italic</ccmButton>
 *   <ccmButton variant="ghost" size="s">Underline</ccmButton>
 * </ccmFormGroup>
 */

defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})

const props = defineProps({
  // Structural props
  /** Root HTML element tag for the group container. Common values: 'div', 'nav', 'section'. */
  is: { type: String, default: 'div' },

  // Visual props
  /** Padding scale for the group container; uses space tokens (e.g., 2xs, xs, s, m, l). Maps to --_ccm-form-group-padding. */
  size: { type: String, default: 'm' },
  /** Presentation style variant. Use attribute selectors in CSS to style variants (e.g., [variant='attached']). */
  variant: { type: String, default: 'default' },
  /** Gap spacing between grouped buttons; uses space tokens (e.g., 2xs, xs, s, m, l). Maps to --_ccm-form-group-gap. */
  gap: { type: String, default: 'xs' },
  /** Background color design token name (without -- prefix). Example: 'color-surface-subtle' or 'color-brand-500'. Maps to --_ccm-form-group-background-color. */
  backgroundColor: { type: String, default: 'transparent' },
  /** Border radius token for outer corners (e.g., s, m, l, pill). Maps to --_ccm-form-group-border-radius. */
  borderRadius: { type: String, default: 'm' },

  // Accessibility props
  /** Accessible label for the group when no visible label exists. Recommended for toolbar or split button variants. */
  ariaLabel: { type: String, default: null },
  /** ARIA role for the container. Common values: 'group', 'toolbar'. Use 'toolbar' for action toolbars. */
  role: { type: String, default: null }
})

const cssVars = computed(() => ({
  '--_ccm-form-group-border-radius': `var(--radius-${props.borderRadius})`
}))

const computedAriaLabel = computed(() => {
  return props.ariaLabel
})
</script>

<style scoped>
.ccm-form-group {
  display: inline-flex;
  gap: 0;
}

.ccm-form-group > :deep(button:not(:first-child, :last-child)) {
  border-radius: 0;
}

.ccm-form-group > :deep(button:not(:first-child)) {
  margin-inline-start: -1px;
}

.ccm-form-group > :deep(button:first-child) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.ccm-form-group > :deep(button:last-child) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>

