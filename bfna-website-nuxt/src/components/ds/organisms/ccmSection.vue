<template>
  <section
    class="ccm-section"
    :full-width="fullWidth"
    :style="cssVars"
    :image-left="imageLeft"
    :image-left-alt="imageLeftAlt"
    :image-right="imageRight"
    :image-right-alt="imageRightAlt"
    >

    <div class="ccm-section-container | center">
      <!-- Slot: left — Left-side content area. Defaults to imageLeft when provided. -->
      <slot name="left">
        <img v-if="imageLeft" :src="imageLeft" :alt="imageLeftAlt" />
      </slot>

      <!-- Slot: default — Main content area. Place headings, copy, CTAs here. -->
      <slot />
      
      <!-- Slot: right — Right-side content area. Defaults to imageRight when provided. -->
      <slot name="right">
        <img v-if="imageRight" :src="imageRight" :alt="imageRightAlt" />
      </slot>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Layout section component with flexible content areas and optional side images.
 *
 * Provides a structured container for page sections with configurable padding and background.
 * Supports three content slots (default, left, right) for flexible layouts. When image props
 * are provided, they render in the left/right slots automatically. Uses semantic design tokens
 * for consistent spacing and theming across the application.
 *
 * Follows all 10 Component Standards with positional slot naming and CSS variable patterns.
 *
 * @component ccmSection
 * @category ds-layout
 * @standards all-10
 *
 * @example Basic Usage
 * <ccmSection>
 *   <h2>Section Title</h2>
 *   <p>Section content goes here.</p>
 * </ccmSection>
 *
 * @example With Background Color
 * <ccmSection background-color="color-surface" size="xl">
 *   <h2>Featured Section</h2>
 *   <p>This section has a colored background.</p>
 * </ccmSection>
 *
 * @example With Side Images
 * <ccmSection
 *   image-left="/images/left.jpg"
 *   image-left-alt="Left decorative image"
 *   image-right="/images/right.jpg"
 *   image-right-alt="Right decorative image"
 * >
 *   <h2>Center Content</h2>
 *   <p>Content between images.</p>
 * </ccmSection>
 *
 * @example Custom Slot Layout
 * <ccmSection size="l">
 *   <template #left>
 *     <aside>Left sidebar content</aside>
 *   </template>
 *   <main>Main content area</main>
 *   <template #right>
 *     <aside>Right sidebar content</aside>
 *   </template>
 * </ccmSection>
 *
 * @example Full Width Section
 * <ccmSection full-width background-color="color-primary" size="2xl">
 *   <h2>Full Width Hero</h2>
 *   <p>This section spans the full viewport width.</p>
 * </ccmSection>
 */

defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})

const props = defineProps({
  // Visual props
  /** Padding size using design token scale (s, m, l, xl, 2xl). Controls vertical padding via --space-{size} token. */
  size: {
    type: String,
    default: 'l'
  },
  /** Background color token name (e.g., 'color-surface', 'color-primary'). Maps to --{backgroundColor} CSS variable. */
  backgroundColor: {
    type: String,
    default: 'transparent'
  },

  // Behavior props
  /** When true, section spans full viewport width. When false, content is constrained to container max-width. */
  fullWidth: {
    type: Boolean,
    default: false
  },
  /** Source URL for left-side image. Renders in #left slot when provided. */
  imageLeft: {
    type: String,
    default: ''
  },
  /** Alt text for left-side image. Required for accessibility when imageLeft is provided. */
  imageLeftAlt: {
    type: String,
    default: ''
  },
  /** Source URL for right-side image. Renders in #right slot when provided. */
  imageRight: {
    type: String,
    default: ''
  },
  /** Alt text for right-side image. Required for accessibility when imageRight is provided. */
  imageRightAlt: {
    type: String,
    default: ''
  }
})

const cssVars = computed(() => ({
  '--_ccm-section-background-color': `var(--${props.backgroundColor})`,
  '--_ccm-section-padding-block': `var(--space-${props.size})`
}))
</script>

<style scoped>
.ccm-section {
  --_ccm-section-padding-block: var(--space-l);
  --_ccm-section-background-color: transparent;

}

.ccm-section { 
  padding-block: var(--_ccm-section-padding-block);
  background-color: var(--_ccm-section-background-color);
  display: flex;
  flex-direction: row;
  align-items: center;
}

.ccm-section-container { flex: 1; }

.ccm-section :deep(img) { 
  flex: 1;
  max-width: 50%;
  object-fit: cover;
  object-position: center;
  transition: all 0.3s ease;
  &:hover { transform: scale(1.05); }
 }
</style>
