<template>
  <nuxt-link
    class="ccm-card"
    :to="to"
    :aria-label="title"
    :aria-describedby="ctaId"
    :style="cssVars"
    >
    <!-- Slot: image — Custom media for the card. Defaults to an <img> when the image prop is provided. -->
  <slot name="image">
    <img class="ccm-card__image" v-if="image" :src="image" :alt="title" />
    <div v-else class="ccm-card__image"></div>
  </slot>

  <div class="ccm-card__text">
    <!-- Slot: default — Primary textual content (heading, description). -->
    <slot />
  </div>

  <span class="ccm-card__action" aria-hidden="true" :id="ctaId">
    <!-- Slot: action — CTA text announced via aria-describedby on the link. -->
    <slot name="action">{{ action }}</slot>
  </span>
    
  </nuxt-link>
</template>

<script setup lang="ts">
/**
 * Accessible, themeable card/teaser for links and content previews.
 *
 * The entire card is a single interactive link (NuxtLink) with keyboard-focus styles,
 * optional media via an image slot, and a CTA string/slot referenced by aria-describedby.
 * Spacing and visuals are driven by semantic design tokens exposed as CSS custom properties.
 *
 * @component ccmCard
 * @category ds-component
 * @standards all-10
 *
 * @example Basic Usage
 * <ccm-card to="/blog/my-post" title="My Post">
 *   <h3>My Post</h3>
 *   <p>Short description of the post…</p>
 *   <template #action>Read more →</template>
 * </ccm-card>
 *
 * @example With Custom Image Slot
 * <ccm-card to="/docs" title="Documentation">
 *   <h3>Documentation</h3>
 *   <p>Explore the guides and API reference.</p>
 *   <template #image>
 *     <img src="/cover.jpg" alt="Documentation cover" />
 *   </template>
 *   <template #action>Explore docs →</template>
 * </ccm-card>
 */
import { computed } from 'vue'
import { useSlugify } from '~/composables/useSlugify'

defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})

const props = defineProps({
  // Structural props
  /**
   * Destination path or absolute URL for the card link.
   * Use app-relative routes (e.g., "/blog/post") or full URLs (e.g., "https://example.com").
   */
  to: {
    type: String,
    required: false
  },

  // Content props
  /**
   * Human-readable title used for the link's aria-label and the image alt text.
   * Also used to generate a stable id for the CTA description.
   */
  title: {
    type: String,
    required: false
  },
  /**
   * Image URL used by the default image rendering. Provide this when not supplying the #image slot.
   */
  image: {
    type: String,
    required: false
  },
  /**
   * CTA copy rendered in the `action` area and referenced by aria-describedby.
   * Provide a short, imperative phrase (e.g., "Read more →").
   */
  action: {
    type: String,
    default: ''
  },

  // Visual props
  /**
   * Spacing scale key controlling internal padding and gaps.
   * Valid values typically include: "s", "m", "l", "xl". Default is "l".
   */
  size: {
    type: String,
    default: 'l'
  },
  /**
   * Design token name (without the var(--) wrapper) controlling the image area's background color.
   * Example: "color-neutral-tint-90" → applied as var(--color-neutral-tint-90).
   */
  backgroundColor: {
    type: String,
    default: 'color-primary-tint-20'
  }
})

const { slugify } = useSlugify()

const cssVars = computed(() => ({
  '--_ccm-card-padding': `var(--space-${props.size})`,
  '--_ccm-card-background-color': `var(--${props.backgroundColor})`
}))

const baseForId = computed(() => props.title || props.to || 'card')
const ctaId = computed(() => `desc-${slugify(baseForId.value)}`)
</script>

<style scoped>

.ccm-card {
  --_ccm-card-padding: var(--space-l);
  --_ccm-card-border-radius: var(--border-radius-l);
  --_ccm-card-gap: var(--space-m);
  --_ccm-card-background-color: var(--color-primary-tint-20);
  --_ccm-card-color: var(--color-primary-tint-80);
  --_ccm-card-border-width: 2px;
  --_ccm-card-border-style: solid;
}


.ccm-card {
  display: flex;
  flex-direction: column;
  border: var(--_ccm-card-border-width) var(--_ccm-card-border-style) var(--_ccm-card-color);
  overflow: hidden;
  gap: var(--_ccm-card-gap);
  text-decoration: none;
  color: var(--_ccm-card-color);
  border-radius: var(--_ccm-card-border-radius);
}

.ccm-card * {
  cursor: pointer;
}

.ccm-card__text {
  flex: 1;
  padding: 0 var(--_ccm-card-padding) var(--_ccm-card-padding);
}

.ccm-card__image {
  padding: var(--_ccm-card-padding);
  background-color: var(--_ccm-card-background-color);
  width: 100%;
  aspect-ratio: 16/9;
}

.ccm-card__action {
  padding: var(--_ccm-card-padding);
}

.ccm-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
